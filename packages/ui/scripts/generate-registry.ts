#!/usr/bin/env bun
/**
 * Writes packages/ui/registry/{<recipe-name>,soribashi-init,registry}.json
 * from buildManifest()'s output: one registry item file per manifest recipe,
 * derived by iterating `manifest.recipes` rather than naming individual
 * recipes, so a new recipe gets a registry item automatically the next time
 * this runs (the RECIPE_DESCRIPTIONS guard below still fails loudly if the
 * new recipe has no description registered). Thin writer over derivation,
 * same shape as generate-manifest.ts: the builder functions below are
 * exported so the tier 1 drift test (packages/ui/test/manifest-drift.test.ts)
 * can rebuild the same content in memory and compare it to what is
 * committed, without duplicating a second copy of these template strings
 * anywhere.
 *
 * Field names follow the live schema at
 * https://ui.shadcn.com/schema/registry-item.json and
 * https://ui.shadcn.com/schema/registry.json (fetched and read at authoring
 * time; both matched the task brief's sketch, no divergence to note beyond
 * registry.json's `items` entries being left as metadata-only summaries here
 * rather than re-embedding each item's full `files[].content` a second time,
 * which the schema permits since only `name`/`type` are required per item).
 *
 * The three template strings for soribashi-init.json's scaffolded files
 * (theme.ts's boilerplate, soribashi.config.ts) live here, not in derive.ts:
 * they are inputs to derivation (a starter for a *new* consumer project),
 * versioned in one place, per the task brief. The vocabulary values
 * interpolated into the theme.ts template are NOT hand-duplicated: they are
 * read from the same buildManifest() vocabulary this generator already
 * derives, so soribashi-init.json can never drift from packages/ui/src/theme.ts's
 * actual uiVocabulary declaration.
 *
 * Usage:
 *   bun run packages/ui/scripts/generate-registry.ts
 *   bun run generate:ui   (also regenerates the manifest)
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildManifest, type Manifest, type ManifestEntry, toJsonFile } from './derive.ts';

const here = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = join(here, '..');
const REPO_ROOT = join(PACKAGE_ROOT, '..', '..');
const REGISTRY_DIR = join(PACKAGE_ROOT, 'registry');

const SCHEMA_REGISTRY_ITEM = 'https://ui.shadcn.com/schema/registry-item.json';
const SCHEMA_REGISTRY = 'https://ui.shadcn.com/schema/registry.json';

export interface RegistryFile {
  path: string;
  type: string;
  target: string;
  content: string;
}

export interface RegistryItem {
  $schema: string;
  name: string;
  type: string;
  title: string;
  description: string;
  dependencies: string[];
  registryDependencies: string[];
  files: RegistryFile[];
}

export interface RegistryIndex {
  $schema: string;
  name: string;
  homepage: string;
  items: Array<Pick<RegistryItem, 'name' | 'type' | 'title' | 'description'>>;
}

function readRepoFile(repoRelativePath: string): string {
  return readFileSync(join(REPO_ROOT, repoRelativePath), 'utf-8');
}

/**
 * Human-authored copy per recipe (title/description text has no derivable
 * source; the mechanical parts of each registry item, dependencies, file
 * contents, still come straight from the manifest entry below). Every
 * recipe the manifest derives must have an entry here, or generation fails
 * loudly rather than shipping a registry item with placeholder copy.
 */
const RECIPE_DESCRIPTIONS: Record<string, string> = {
  AspectRatio: 'Locks a fixed width/height ratio for its content.',
  Box: 'The polymorphic primitive: element choice, style props, nothing else.',
  Button: 'Polymorphic button riding the soribashi vocabulary rails.',
  Center: 'Centers its content on both axes, flex or inline-flex.',
  Group: 'Horizontal flex row with theme-spacing gap and optional even growth.',
  Popover: 'Compound popover built on Base UI, themed through the soribashi vocabulary rails.',
  Stack: 'Vertical flex stack with theme-spacing gap.',
};

function buildRecipeRegistryItem(entry: ManifestEntry): RegistryItem {
  const description = RECIPE_DESCRIPTIONS[entry.name];
  if (!description) {
    throw new Error(
      `[generate-registry] No description registered for recipe "${entry.name}". Add one to ` +
        'RECIPE_DESCRIPTIONS in generate-registry.ts.',
    );
  }

  const tsxRepoPath = entry.files.find((f) => f.endsWith(`${entry.name}.tsx`));
  const cssRepoPath = entry.files.find((f) => f.endsWith(`${entry.name}.module.css`));
  if (!tsxRepoPath || !cssRepoPath) {
    throw new Error(
      `[generate-registry] Recipe "${entry.name}" is missing its .tsx or .module.css entry in ` +
        'the derived manifest files list.',
    );
  }

  const dependencies = entry.baseUi ? ['@soribashi/core', '@base-ui/react'] : ['@soribashi/core'];

  return {
    $schema: SCHEMA_REGISTRY_ITEM,
    name: entry.name.toLowerCase(),
    type: 'registry:ui',
    title: entry.name,
    description,
    dependencies,
    registryDependencies: [],
    files: [
      {
        path: `registry/soribashi/${entry.name}/${entry.name}.tsx`,
        type: 'registry:ui',
        target: `components/soribashi/${entry.name}/${entry.name}.tsx`,
        content: readRepoFile(tsxRepoPath),
      },
      {
        path: `registry/soribashi/${entry.name}/${entry.name}.module.css`,
        type: 'registry:ui',
        target: `components/soribashi/${entry.name}/${entry.name}.module.css`,
        content: readRepoFile(cssRepoPath),
      },
    ],
  };
}

function buildInitThemeTs(vocabulary: Record<string, string[]>): string {
  const axisLines = Object.entries(vocabulary)
    .map(
      ([axis, values]) =>
        `  ${axis}: defineVocabulary([${values.map((v) => `'${v}'`).join(', ')}] as const),`,
    )
    .join('\n');

  return `// Starter theme, scaffolded by the soribashi-init registry item.
// Axis values mirror @soribashi/ui's own uiVocabulary, since the vendored
// Button/Popover recipes expect exactly these size/intent/variant values.
// Change them to declare your own vocabulary; soribashi has no opinion on
// the values themselves, only that a vocabulary is declared.
import { createTheme, defaultDarkTokens, defaultTokens, defineVocabulary } from '@soribashi/core';

export const vocabulary = {
${axisLines}
};

export const theme = createTheme({
  name: 'my-app',
  tokens: defaultTokens,
  dark: defaultDarkTokens,
  vocabulary,
});
`;
}

const INIT_CONFIG_TS = `// Starter soribashi config, scaffolded by the soribashi-init registry item.
// Points the codegen step at your theme and where to write the generated CSS.
// Run your project's codegen step (wraps @soribashi/codegen's \`soribashi build\`)
// whenever this file or ./soribashi/theme.ts changes, to regenerate that CSS.
import { theme } from './soribashi/theme.ts';

export default {
  theme,
  output: { css: 'src/generated/theme.css' },
};
`;

function buildSoribashiInitItem(vocabulary: Record<string, string[]>): RegistryItem {
  return {
    $schema: SCHEMA_REGISTRY_ITEM,
    name: 'soribashi-init',
    type: 'registry:lib',
    title: 'Soribashi Init',
    description:
      'Scaffolds a starter theme declaration and soribashi config for a new consumer project.',
    dependencies: ['@soribashi/core'],
    registryDependencies: [],
    files: [
      {
        path: 'registry/soribashi/theme.ts',
        type: 'registry:file',
        target: 'soribashi/theme.ts',
        content: buildInitThemeTs(vocabulary),
      },
      {
        path: 'registry/soribashi.config.ts',
        type: 'registry:file',
        target: 'soribashi.config.ts',
        content: INIT_CONFIG_TS,
      },
    ],
  };
}

function buildRegistryIndex(items: RegistryItem[]): RegistryIndex {
  return {
    $schema: SCHEMA_REGISTRY,
    name: 'soribashi',
    homepage: 'https://github.com/soribashi/soribashi',
    items: items.map((item) => ({
      name: item.name,
      type: item.type,
      title: item.title,
      description: item.description,
    })),
  };
}

export interface RegistryArtifacts {
  manifest: Manifest;
  /** One registry item per manifest recipe, in manifest order (sorted by recipe name). */
  items: RegistryItem[];
  init: RegistryItem;
  index: RegistryIndex;
}

export async function buildRegistryArtifacts(): Promise<RegistryArtifacts> {
  const manifest = await buildManifest();
  const items = manifest.recipes.map((entry) => buildRecipeRegistryItem(entry));
  const init = buildSoribashiInitItem(manifest.vocabulary);
  const index = buildRegistryIndex([...items, init]);

  return { manifest, items, init, index };
}

async function main(): Promise<void> {
  const { items, init, index } = await buildRegistryArtifacts();
  mkdirSync(REGISTRY_DIR, { recursive: true });
  for (const item of items) {
    writeFileSync(
      join(REGISTRY_DIR, `${item.name}.json`),
      toJsonFile(item, `${item.name}.json`),
      'utf-8',
    );
  }
  writeFileSync(
    join(REGISTRY_DIR, 'soribashi-init.json'),
    toJsonFile(init, 'soribashi-init.json'),
    'utf-8',
  );
  writeFileSync(join(REGISTRY_DIR, 'registry.json'), toJsonFile(index, 'registry.json'), 'utf-8');
  console.log(
    `[generate-registry] wrote ${items.map((i) => `registry/${i.name}.json`).join(', ')}, ` +
      'registry/soribashi-init.json, registry/registry.json',
  );
}

// Only run main() when executed directly (bun run ... or node ...), not when
// imported as a module by the drift test.
if (
  typeof process !== 'undefined' &&
  process.argv[1] &&
  (process.argv[1].endsWith('generate-registry.ts') ||
    process.argv[1].endsWith('generate-registry.js'))
) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
