import { createTheme, defaultDarkTokens, defaultTokens } from '@soribashi/core';
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
 * Tokens the `ui` theme deliberately declares beyond what `createTheme`'s own
 * defaults give every consumer, and which the bare-theme gate below therefore
 * has to excuse.
 *
 * Empty on purpose, and an entry here is a decision, not a formality: adding
 * one says "a consumer who installs this recipe from the registry and writes
 * no `semanticTokens` will get an unresolved custom property, and we accept
 * that". The alternative, and the default answer, is to move the token into
 * `DEFAULT_SURFACE`/`DEFAULT_TEXT`/`DEFAULT_BORDER` in
 * packages/theme/src/create-theme.ts so every theme carries it. Each entry
 * needs its own comment saying why the recipe stays usable without it.
 */
const UI_THEME_ONLY: ReadonlySet<string> = new Set<string>();

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

/**
 * Names every `recipe: --token (file)` pair whose dependency is absent from
 * `emitted` and excused by neither allowlist.
 */
function unsatisfiedDependencies(
  recipes: Awaited<ReturnType<typeof buildManifest>>['recipes'],
  emitted: ReadonlySet<string>,
  excused: ReadonlySet<string>,
): string[] {
  const missing: string[] = [];
  for (const recipe of recipes) {
    const cssFile = recipe.files.find((f) => f.endsWith('.module.css'));
    for (const dep of recipe.tokenDependencies) {
      if (excused.has(dep)) continue;
      if (!emitted.has(dep)) {
        missing.push(`${recipe.name}: ${dep} (${cssFile})`);
      }
    }
  }
  return missing;
}

describe('token existence: recipe tokenDependencies resolve against emitted CSS', () => {
  it('every manifest recipe tokenDependency is an emitted custom property, or allowlisted', async () => {
    const emitted = extractEmittedVarNames(emitCss(uiTheme));
    const manifest = await buildManifest();
    // Floor: if the barrel ever silently resolved to zero recipes, the loop
    // below would find nothing to check and this guard would pass
    // vacuously. Guard against that silently-toothless state (same pattern
    // as reskin.test.tsx's recipeCount floor).
    expect(manifest.recipes.length, 'expected at least one manifest recipe').toBeGreaterThan(0);

    const missing = unsatisfiedDependencies(manifest.recipes, emitted, ALLOWLIST);

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

  /**
   * The row above passes as soon as `uiTheme` declares a token, which is a
   * weaker contract than the registry actually ships: `shadcn add
   * soribashi-init` scaffolds a theme with no `semanticTokens` at all, and
   * every recipe added after it renders against exactly the theme
   * reconstructed here. A token only `uiTheme` declared therefore satisfied
   * the row above while resolving to nothing in a consumer's app, which is
   * how `--surface-placeholder` shipped a fully transparent Skeleton.
   *
   * `tokens`/`dark` are the defaults because soribashi-init's starter theme
   * passes exactly those; they are the palette, and a consumer is expected to
   * replace them. `semanticTokens` is what this row is really about: it is
   * omitted, so every `--text-*`/`--surface-*`/`--border-*` under test here
   * comes from create-theme.ts's own default set and nowhere else.
   */
  it('every manifest recipe tokenDependency is also emitted by a theme that declares no semanticTokens', async () => {
    const starterTheme = createTheme({
      name: 'bare',
      tokens: defaultTokens,
      dark: defaultDarkTokens,
    });
    const emitted = extractEmittedVarNames(emitCss(starterTheme));
    const manifest = await buildManifest();
    expect(manifest.recipes.length, 'expected at least one manifest recipe').toBeGreaterThan(0);

    const excused = new Set([...ALLOWLIST, ...UI_THEME_ONLY]);
    const missing = unsatisfiedDependencies(manifest.recipes, emitted, excused);

    expect(
      missing,
      missing.length === 0
        ? undefined
        : 'These recipe tokenDependencies resolve to nothing under a theme that declares no ' +
            `semanticTokens, so the registry ships them broken: ${missing.join(', ')}. Add the ` +
            'token to the default semantic set in packages/theme/src/create-theme.ts, or, if the ' +
            'recipe genuinely stays usable without it, to UI_THEME_ONLY in ' +
            'packages/ui/test/token-existence.test.ts with a comment saying why.',
    ).toEqual([]);
  });
});
