#!/usr/bin/env bun
/**
 * Packs every publishable package with `bun pm pack` and asserts the tarballs
 * are actually publishable. Run it before publishing: `bun run pack:check`.
 *
 * WHY: the two things this checks are both silent failures that only show up
 * after a version is already public and immutable.
 *
 *  1. `workspace:*` must be gone. `bun pm pack` / `bun publish` rewrite each
 *     `workspace:*` interdependency to the concrete version; `npm pack` and
 *     `npm publish` DO NOT — npm leaves the literal string `workspace:*` in the
 *     published manifest, which is not a valid registry range, so every install
 *     of that package fails. This is why publishing is a Bun-only operation
 *     here (see the repo README's "Publishing" section).
 *  2. No entry point may resolve into `src/`. Each package's `exports` map
 *     points at `dist/`, with a `soribashi-source` condition for this
 *     workspace only; if a `main`/`types`/`bin`/default export ever slipped
 *     back to `src/`, consumers would be type-checking our TypeScript source
 *     again — the exact friction publishing was meant to end (SORI-4, SORI-8,
 *     SORI-23).
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PACKAGES = ['theme', 'factory', 'core', 'codegen'] as const;
const REPO_ROOT = new URL('..', import.meta.url).pathname;

interface Manifest {
  name?: string;
  version?: string;
  main?: string;
  types?: string;
  bin?: Record<string, string>;
  exports?: Record<string, unknown>;
  dependencies?: Record<string, string>;
}

const failures: string[] = [];
const fail = (msg: string) => {
  failures.push(msg);
  console.error(`  FAIL  ${msg}`);
};

/** Every string value nested anywhere inside `exports`. */
function exportTargets(node: unknown): string[] {
  if (typeof node === 'string') return [node];
  if (node && typeof node === 'object') return Object.values(node).flatMap(exportTargets);
  return [];
}

const outDir = mkdtempSync(join(tmpdir(), 'soribashi-pack-'));

try {
  for (const pkg of PACKAGES) {
    const cwd = join(REPO_ROOT, 'packages', pkg);
    console.log(`\n${pkg}`);
    execFileSync('bun', ['pm', 'pack', '--destination', outDir], { cwd, stdio: 'pipe' });

    const tarball = readdirSync(outDir).find((f) => f.includes(`-${pkg}-`) && f.endsWith('.tgz'));
    if (!tarball) {
      fail(`${pkg}: no tarball produced`);
      continue;
    }

    const raw = execFileSync('tar', ['-xOf', join(outDir, tarball), 'package/package.json'], {
      encoding: 'utf-8',
    });
    const manifest = JSON.parse(raw) as Manifest;

    // 1. workspace: protocol must have been rewritten to a real version.
    for (const [dep, range] of Object.entries(manifest.dependencies ?? {})) {
      if (range.startsWith('workspace:')) {
        fail(
          `${pkg}: dependency ${dep} is still "${range}" in the packed manifest. ` +
            `Pack/publish with Bun (\`bun publish\`), not npm — npm does not rewrite the workspace: protocol.`,
        );
      }
    }

    // 2. Every published entry point must live under dist/.
    //
    // The test is "is it under ./dist/", not "does the path contain src".
    // @soribashi/codegen legitimately emits to `./dist/src/index.js`: its build
    // has to span both `src/` and `bin/`, so its rootDir is the package root
    // and the source tree's shape is preserved one level down. That is still
    // built output, and no consumer ever sees the path — they resolve through
    // the exports map.
    const underDist = (p: string) => p === './dist' || p.startsWith('./dist/');

    const entries: Array<[string, string | undefined]> = [
      ['main', manifest.main],
      ['types', manifest.types],
      ...Object.entries(manifest.bin ?? {}).map(
        ([k, v]) => [`bin.${k}`, v] as [string, string | undefined],
      ),
    ];
    for (const [field, value] of entries) {
      if (value && !underDist(value)) {
        fail(
          `${pkg}: "${field}" is "${value}"; every published entry point must live under ./dist/.`,
        );
      }
    }

    // The `soribashi-source` condition is the one legitimate ./src target: only
    // this workspace opts into that condition, never a consumer. Every OTHER
    // target in the map must be built output.
    const sourceCondition = (manifest.exports?.['.'] as Record<string, string> | undefined)?.[
      'soribashi-source'
    ];
    for (const target of exportTargets(manifest.exports ?? {})) {
      if (target === sourceCondition) continue;
      if (!underDist(target)) {
        fail(`${pkg}: exports target "${target}" is not under ./dist/.`);
      }
    }

    console.log(`  ok    ${manifest.name}@${manifest.version}`);
    console.log(`        deps: ${JSON.stringify(manifest.dependencies ?? {})}`);
  }
} finally {
  rmSync(outDir, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(`\n${failures.length} problem(s) would have shipped. Nothing was published.`);
  process.exit(1);
}
console.log('\nAll packages pack cleanly and are safe to publish with `bun publish`.');
