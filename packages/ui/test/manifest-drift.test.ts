import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildManifest, toJsonFile } from '../scripts/derive.ts';
import { buildRegistryArtifacts } from '../scripts/generate-registry.ts';

/**
 * Tier 1 drift gate: rebuilds the manifest AND every registry item file in
 * memory through the exact same functions the generators use, then compares
 * byte-for-byte against what is committed. The set of registry item files
 * expected to exist is derived from the in-memory manifest's recipe list
 * (never a hardcoded file list), so a recipe added to the manifest without a
 * regenerated registry item fails here by construction. A hand-edit to any
 * of these files (or a source change nobody regenerated for) fails here, not
 * in CI's separate `git diff --exit-code` codegen-drift job, which runs the
 * same `bun run generate:ui` this test's expectations are built from.
 */

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const REGENERATE_MESSAGE = 'run: bun run generate:ui';

function assertNoDrift(committedPath: string, expectedContent: string): void {
  const committed = existsSync(committedPath) ? readFileSync(committedPath, 'utf-8') : null;
  if (committed !== expectedContent) {
    throw new Error(REGENERATE_MESSAGE);
  }
}

describe('manifest and registry drift', () => {
  it('packages/ui/manifest.json matches the derived manifest', async () => {
    const manifest = await buildManifest();
    assertNoDrift(join(PACKAGE_ROOT, 'manifest.json'), toJsonFile(manifest, 'manifest.json'));
  });

  it('every manifest recipe has a matching, drift-free registry item file', async () => {
    const { manifest, items } = await buildRegistryArtifacts();
    // Assumes registry item names are exactly the lowercased recipe name. True
    // for single-word recipes; if a multi-word recipe (e.g. AlertDialog) ever
    // kebab-cases differently in buildRecipeRegistryItem, update BOTH in step.
    const expectedNames = manifest.recipes.map((r) => r.name.toLowerCase()).sort();
    const actualNames = items.map((item) => item.name).sort();
    expect(actualNames, 'registry items must cover every recipe the manifest lists').toEqual(
      expectedNames,
    );
    for (const item of items) {
      assertNoDrift(
        join(PACKAGE_ROOT, 'registry', `${item.name}.json`),
        toJsonFile(item, `${item.name}.json`),
      );
    }
  });

  it('packages/ui/registry/soribashi-init.json matches the derived registry item', async () => {
    const { init } = await buildRegistryArtifacts();
    assertNoDrift(
      join(PACKAGE_ROOT, 'registry', 'soribashi-init.json'),
      toJsonFile(init, 'soribashi-init.json'),
    );
  });

  it('packages/ui/registry/registry.json matches the derived index', async () => {
    const { index } = await buildRegistryArtifacts();
    assertNoDrift(
      join(PACKAGE_ROOT, 'registry', 'registry.json'),
      toJsonFile(index, 'registry.json'),
    );
  });
});
