import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { getRecipeMeta, type RecipeMeta } from '@soribashi/core';

/**
 * Shared derivation for the ui package's agent-facing manifest and shadcn
 * registry. Nothing here is hand-authored: every field below is read off a
 * recipe's frozen `RecipeMeta` (attached by the builders in
 * @soribashi/factory), scanned from its source files, or copied from the
 * package's own `uiVocabulary` declaration. `generate-manifest.ts` and
 * `generate-registry.ts` are thin writers on top of this module; the tier 1
 * drift test rebuilds through the same functions and compares byte-for-byte
 * against the committed output.
 */

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = join(SCRIPT_DIR, '..');
const REPO_ROOT = join(PACKAGE_ROOT, '..', '..');
const RECIPES_DIR = join(PACKAGE_ROOT, 'src', 'recipes');

export interface ManifestEntry {
  name: string;
  category: 1 | 2 | 3 | 4;
  builder: string;
  slots: readonly string[];
  vocabularyAxes: readonly string[];
  variants: readonly string[];
  defaults: Record<string, unknown>;
  /** The four recipe files (tsx, module.css, test.tsx, visual.test.tsx), repo-relative. */
  files: string[];
  /** Sorted, deduped theme CSS custom-property names the recipe's stylesheet depends on. */
  tokenDependencies: string[];
  /** Whether the recipe imports @base-ui/react. */
  baseUi: boolean;
}

export interface Manifest {
  vocabulary: Record<string, string[]>;
  recipes: ManifestEntry[];
}

/**
 * Theme CSS custom-property prefixes (see @soribashi/theme's ThemeTokens /
 * emit-css.ts): everything a recipe's stylesheet is allowed to depend on
 * *as a theme contract*. A recipe's own local vars (`--sb-*`) and its
 * autoVars-derived vars (`--{lowercased recipe name}-*`, e.g. `--button-*`,
 * `--popover-*`) never match one of these prefixes, so they fall out of
 * this list without needing a separate exclusion step.
 */
const THEME_VAR_PREFIXES = [
  'color',
  'radius',
  'spacing',
  'font-size',
  'font-family',
  'font-weight',
  'line-height',
  'shadow',
  'breakpoint',
  'z-index',
  'text',
  'surface',
  'border',
  'accent',
] as const;

const THEME_VAR_RE = new RegExp(`^--(?:${THEME_VAR_PREFIXES.join('|')})(?:-|$)`);

/**
 * Every `var(--x)` occurrence in `css`, including ones nested in fallback
 * position (`var(--a, var(--b)))`), filtered to names matching a theme
 * prefix, sorted and deduped. A plain global regex over the whole source
 * (rather than a parenthesis-balancing parser) is sufficient: a nested
 * fallback var() is still a literal `var(--name` substring wherever it
 * appears in the text, so it is picked up by the same scan as a top-level
 * reference.
 */
export function extractTokenDependencies(css: string): string[] {
  const found = new Set<string>();
  const varRefRe = /var\(\s*(--[a-zA-Z0-9-]+)/g;
  let match: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard exec-loop idiom
  while ((match = varRefRe.exec(css)) !== null) {
    const name = match[1];
    if (name && THEME_VAR_RE.test(name)) {
      found.add(name);
    }
  }
  return [...found].sort();
}

function toRepoRelative(absolutePath: string): string {
  return relative(REPO_ROOT, absolutePath).split(sep).join('/');
}

interface VocabularyLike {
  values: readonly string[];
}

function extractVocabulary(uiVocabulary: Record<string, VocabularyLike>): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [axis, vocab] of Object.entries(uiVocabulary)) {
    out[axis] = [...vocab.values];
  }
  return out;
}

const VALID_CATEGORIES = new Set([1, 2, 3, 4]);

async function buildManifestEntry(meta: RecipeMeta): Promise<ManifestEntry> {
  const recipeDir = join(RECIPES_DIR, meta.name);
  const tsxPath = join(recipeDir, `${meta.name}.tsx`);
  const cssPath = join(recipeDir, `${meta.name}.module.css`);
  const testPath = join(recipeDir, `${meta.name}.test.tsx`);
  const visualTestPath = join(recipeDir, `${meta.name}.visual.test.tsx`);

  const tsxSource = readFileSync(tsxPath, 'utf-8');
  const cssSource = readFileSync(cssPath, 'utf-8');

  // Read the module's own namespace (not the ui barrel, which does not
  // re-export recipeCategory) to pull the authoring-category constant every
  // recipe module is required to export.
  const recipeModule = (await import(pathToFileURL(tsxPath).href)) as Record<string, unknown>;
  const category = recipeModule.recipeCategory;
  if (typeof category !== 'number' || !VALID_CATEGORIES.has(category)) {
    throw new Error(
      `[derive] Recipe "${meta.name}" (${toRepoRelative(tsxPath)}) is missing a valid ` +
        '`export const recipeCategory = <1|2|3|4> as const;`. Every recipe module must declare ' +
        'its authoring category from the four in ' +
        'docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md before it can be derived ' +
        'into the manifest.',
    );
  }

  return {
    name: meta.name,
    category: category as 1 | 2 | 3 | 4,
    builder: meta.builder,
    slots: meta.slots,
    vocabularyAxes: meta.vocabularyAxes,
    variants: meta.variants,
    defaults: { ...meta.defaults },
    files: [tsxPath, cssPath, testPath, visualTestPath].map(toRepoRelative),
    tokenDependencies: extractTokenDependencies(cssSource),
    baseUi: tsxSource.includes("from '@base-ui/react"),
  };
}

/**
 * Walks the @soribashi/ui barrel, keeps every export with attached
 * RecipeMeta (i.e. every built recipe component; `.extend()` results and
 * plain values like `uiTheme`/`uiVocabulary` do not carry RecipeMeta and are
 * skipped), and pairs each with its four fixed-layout files and the
 * package's own vocabulary declaration.
 */
export async function buildManifest(): Promise<Manifest> {
  const barrel = (await import('../src/index.ts')) as Record<string, unknown> & {
    uiVocabulary: Record<string, VocabularyLike>;
  };

  const seen = new Set<unknown>();
  const metas: RecipeMeta[] = [];
  for (const value of Object.values(barrel)) {
    const meta = getRecipeMeta(value);
    if (!meta || seen.has(value)) continue;
    seen.add(value);
    metas.push(meta);
  }

  const recipes = await Promise.all(metas.map((meta) => buildManifestEntry(meta)));
  recipes.sort((a, b) => a.name.localeCompare(b.name));

  return {
    vocabulary: extractVocabulary(barrel.uiVocabulary),
    recipes,
  };
}

const BIOME_BIN = join(REPO_ROOT, 'node_modules', '.bin', 'biome');

/**
 * Canonical serialization shared by every generator and the drift test.
 * Runs the raw `JSON.stringify` output through the repo's own biome
 * formatter (the same binary `bun run lint`/`bun run format` use) so a
 * freshly generated file is byte-for-byte what biome considers correctly
 * formatted, instead of a hand-rolled printer trying to reverse-engineer
 * biome's line-fill rules (which collapse short arrays onto one line but
 * expand long ones; see packages/ui/manifest.json's `slots` vs.
 * `tokenDependencies`). `fileHint` only affects which biome parser config
 * applies by extension; every caller here passes a `.json` name.
 */
export function toJsonFile(value: unknown, fileHint = 'generated.json'): string {
  const raw = JSON.stringify(value, null, 2);
  return execFileSync(BIOME_BIN, ['format', `--stdin-file-path=${fileHint}`], {
    input: raw,
    encoding: 'utf-8',
  });
}
