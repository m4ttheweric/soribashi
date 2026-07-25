import { describe, expect, it } from 'vitest';
// Deep import, same rationale as reskin.test.tsx: `emitCss` is pure (no
// filesystem access), but `@soribashi/codegen`'s index.ts re-exports
// `watch.ts`, which pulls in `node:fs`/`node:child_process`. Importing the
// barrel here would drag that into this node-tier test for no reason.
import { emitCss } from '../../codegen/src/emit-css.ts';
import { buildManifest } from '../scripts/derive.ts';
import { uiTheme } from '../src/theme.ts';

/**
 * Token-existence gate (step 4): every `--x` custom property a recipe's
 * stylesheet depends on (`derive.ts`'s `tokenDependencies`, scraped from
 * `var(--x)` occurrences whose name matches a theme-var prefix) must be a
 * real custom property the `ui` theme actually emits. A `tokenDependencies`
 * entry that resolves to nothing at runtime is a recipe silently relying on
 * the browser's unregistered-custom-property fallback behaviour (reads as
 * `initial`/inherited, not a real value) instead of the theme contract.
 */

// Deliberate var-fallback, not a bug: Button's focus ring reads
// `--accent-primary` with a `var(--button-bg)` fallback
// (Button.module.css:34), and the `ui` theme declares no `accent` semantic
// family yet (STATUS.md's "Deliberately future" record: "The `ui` theme
// emits no `--accent-*` tokens; Button's focus ring rides a var fallback").
// This is a real, working fallback path today, not a broken dependency, so
// it is allowlisted here rather than failing the gate.
const ALLOWLIST = new Set(['--accent-primary']);

/**
 * Every custom-property NAME declared (given a value) in emitted CSS text,
 * as opposed to merely referenced via `var(--x)`. Declarations in this
 * file's output always start a line with `--name:` (after leading
 * whitespace); a `var(--x)` reference never appears at the start of a line
 * this way, since it's always the right-hand side of some other
 * declaration or nested inside a `var(...)` call.
 */
function extractEmittedVarNames(css: string): Set<string> {
  const names = new Set<string>();
  const re = /^[ \t]*(--[a-zA-Z0-9-]+)\s*:/gm;
  let match: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard exec-loop idiom
  while ((match = re.exec(css)) !== null) {
    const name = match[1];
    if (name) names.add(name);
  }
  return names;
}

describe('token existence: recipe tokenDependencies resolve against emitted CSS', () => {
  it('every manifest recipe tokenDependency is an emitted custom property, or allowlisted', async () => {
    const css = emitCss(uiTheme);
    const emitted = extractEmittedVarNames(css);
    const manifest = await buildManifest();
    // Floor: if the barrel ever silently resolved to zero recipes, the loop
    // below would find nothing to check and this guard would pass
    // vacuously. Guard against that silently-toothless state (same pattern
    // as reskin.test.tsx's recipeCount floor).
    expect(manifest.recipes.length, 'expected at least one manifest recipe').toBeGreaterThan(0);

    const missing: string[] = [];
    for (const recipe of manifest.recipes) {
      const cssFile = recipe.files.find((f) => f.endsWith('.module.css'));
      for (const dep of recipe.tokenDependencies) {
        if (ALLOWLIST.has(dep)) continue;
        if (!emitted.has(dep)) {
          missing.push(`${recipe.name}: ${dep} (${cssFile})`);
        }
      }
    }

    expect(
      missing,
      missing.length === 0
        ? undefined
        : `These recipe tokenDependencies are not emitted by uiTheme's CSS (packages/ui/src/theme.ts) ` +
            `and are not in this test's ALLOWLIST: ${missing.join(', ')}. Either add the token to the ` +
            'theme, fix the recipe stylesheet to reference a real token, or add it to ALLOWLIST in ' +
            'packages/ui/test/token-existence.test.ts with a comment explaining the deliberate fallback.',
    ).toEqual([]);
  });
});
