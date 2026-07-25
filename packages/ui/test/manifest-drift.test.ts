import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'vitest';
import { buildManifest, toJsonFile } from '../scripts/derive.ts';
import { buildRegistryArtifacts } from '../scripts/generate-registry.ts';

/**
 * Tier 1 drift gate: rebuilds the manifest AND every registry file in
 * memory through the exact same functions the generators use, then compares
 * byte-for-byte against what is committed. A hand-edit to any of these five
 * files (or a source change nobody regenerated for) fails here, not in CI's
 * separate `git diff --exit-code` codegen-drift job, which runs the same
 * `bun run generate:ui` this test's expectations are built from.
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

  it('packages/ui/registry/button.json matches the derived registry item', async () => {
    const { button } = await buildRegistryArtifacts();
    assertNoDrift(join(PACKAGE_ROOT, 'registry', 'button.json'), toJsonFile(button, 'button.json'));
  });

  it('packages/ui/registry/popover.json matches the derived registry item', async () => {
    const { popover } = await buildRegistryArtifacts();
    assertNoDrift(
      join(PACKAGE_ROOT, 'registry', 'popover.json'),
      toJsonFile(popover, 'popover.json'),
    );
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
