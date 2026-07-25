#!/usr/bin/env bun
/**
 * Writes packages/ui/manifest.json from buildManifest(). Thin writer: all
 * derivation logic lives in derive.ts so the tier 1 drift test
 * (packages/ui/test/manifest-drift.test.ts) can rebuild the same content in
 * memory and compare it to what is committed.
 *
 * Usage:
 *   bun run packages/ui/scripts/generate-manifest.ts
 *   bun run generate:ui   (also regenerates the registry)
 */

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildManifest, toJsonFile } from './derive.ts';

const here = dirname(fileURLToPath(import.meta.url));
const outPath = join(here, '..', 'manifest.json');

async function main(): Promise<void> {
  const manifest = await buildManifest();
  writeFileSync(outPath, toJsonFile(manifest, 'manifest.json'), 'utf-8');
  console.log(`[generate-manifest] wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
