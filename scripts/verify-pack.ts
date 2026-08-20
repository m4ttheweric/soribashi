#!/usr/bin/env bun
/**
 * Packs the published package with `bun pm pack` and asserts the tarball is
 * actually publishable. Run it before publishing: `bun run pack:check`.
 *
 * WHY: everything this checks is a silent failure that only shows up after a
 * version is already public and immutable.
 *
 *  1. No `workspace:` protocol may survive into the packed manifest. `bun pm
 *     pack` / `bun publish` rewrite each `workspace:*` interdependency to the
 *     concrete version; `npm pack` and `npm publish` DO NOT — npm leaves the
 *     literal string `workspace:*` in the published manifest, which is not a
 *     valid registry range, so every install of that package fails.
 *
 *     Since the four framework packages merged into this one, there are no
 *     soribashi interdependencies left to rewrite, so this check should now be
 *     vacuous — and that is precisely why it stays. It is the assertion that
 *     the merge bought what it was meant to buy, and it is what catches the day
 *     someone reintroduces a `workspace:*` dependency on a future sibling.
 *
 *  2. No entry point may resolve into `src/`. The `exports` map points at
 *     `dist/`, with a `soribashi-source` condition for this workspace only; if
 *     a `main`/`types`/`bin`/default export ever slipped back to `src/`,
 *     consumers would be type-checking our TypeScript source again — the exact
 *     friction publishing was meant to end (SORI-4, SORI-8, SORI-23).
 *
 *  3. Every entry point must EXIST inside the tarball. `files` and `exports`
 *     are two independent lists, and a target `files` does not ship resolves to
 *     nothing on the consumer's disk while looking perfectly correct in the
 *     manifest. Cheap to check, and the one thing a manifest-only reading of
 *     the tarball cannot catch.
 *
 *  4. No shipped `.d.ts` may carry a relative `.ts`/`.tsx` module specifier. A
 *     `.ts` extension in an import is a TS5097 error unless the CONSUMER opts
 *     into `allowImportingTsExtensions`, and the referenced `.ts` file is not
 *     in `dist/` anyway. scripts/fix-dts-extensions.ts rewrites these during
 *     the build and fails loudly if it cannot; this re-checks the real tarball,
 *     so a declaration that reached the archive by some path the build step
 *     never walked still cannot ship.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * The one published package. An array of one rather than a scalar: the
 * org-as-product shape means an OPTIONAL @soribashi/* sibling may join later,
 * and it should inherit every check here by being added to this list.
 */
const PACKAGES = ['core'] as const;
const REPO_ROOT = new URL('..', import.meta.url).pathname;

/** The same specifier shape scripts/fix-dts-extensions.ts rewrites. */
const TS_SPECIFIER = /(\bfrom\s*|\bimport\s*\(\s*)(['"])(\.[^'"]*?)\.tsx?\2/;

interface Manifest {
  name?: string;
  version?: string;
  main?: string;
  types?: string;
  bin?: Record<string, string>;
  exports?: Record<string, unknown>;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

const failures: string[] = [];
const fail = (msg: string) => {
  failures.push(msg);
  console.error(`  FAIL  ${msg}`);
};

interface ExportLeaf {
  /** Human-readable position, e.g. `exports["."].types`. */
  where: string;
  target: string;
  /** True when this leaf sits under a `soribashi-source` condition KEY. */
  isSourceCondition: boolean;
}

/**
 * Every leaf of the `exports` map, tagged with WHERE it sits.
 *
 * Position, not value, is what earns the `src/` exemption. Exempting by target
 * value instead would mean any condition that happens to name the same path as
 * `soribashi-source` — say a `types` accidentally pointed at `./src/index.ts` —
 * inherits the exemption and ships our TypeScript source to every consumer.
 * That exact mistake was caught by testing this script against a deliberately
 * broken manifest; keep the walk positional.
 */
function exportLeaves(node: unknown, where = 'exports', inSource = false): ExportLeaf[] {
  if (typeof node === 'string') return [{ where, target: node, isSourceCondition: inSource }];
  if (!node || typeof node !== 'object') return [];
  return Object.entries(node).flatMap(([key, value]) =>
    exportLeaves(
      value,
      key.startsWith('.') ? `${where}[${JSON.stringify(key)}]` : `${where}.${key}`,
      inSource || key === 'soribashi-source',
    ),
  );
}

const outDir = mkdtempSync(join(tmpdir(), 'soribashi-pack-'));

try {
  for (const pkg of PACKAGES) {
    const cwd = join(REPO_ROOT, 'packages', pkg);
    const failuresBefore = failures.length;
    console.log(`\npackages/${pkg}`);
    execFileSync('bun', ['pm', 'pack', '--destination', outDir], { cwd, stdio: 'pipe' });

    const tarball = readdirSync(outDir).find((f) => f.endsWith('.tgz'));
    if (!tarball) {
      fail(`${pkg}: no tarball produced`);
      continue;
    }
    const archive = join(outDir, tarball);

    const raw = execFileSync('tar', ['-xOf', archive, 'package/package.json'], {
      encoding: 'utf-8',
    });
    const manifest = JSON.parse(raw) as Manifest;

    /** Every path in the archive, with the leading `package/` stripped. */
    const contents = new Set(
      execFileSync('tar', ['-tf', archive], { encoding: 'utf-8' })
        .split('\n')
        .filter(Boolean)
        .map((p) => p.replace(/^package\//, '').replace(/\/$/, '')),
    );

    // 1. No workspace: protocol may survive, in any dependency field.
    for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies'] as const) {
      for (const [dep, range] of Object.entries(manifest[field] ?? {})) {
        if (range.startsWith('workspace:')) {
          fail(
            `${pkg}: ${field}.${dep} is still "${range}" in the packed manifest. ` +
              'Pack/publish with Bun (`bun publish`), not npm — npm does not rewrite the ' +
              'workspace: protocol.',
          );
        }
      }
    }

    // 2. Every published entry point must live under dist/.
    //
    // The test is "is it under ./dist/", not "does the path contain src". This
    // package legitimately emits to `./dist/src/index.js`: its build spans both
    // `src/` and `bin/`, so its rootDir is the package root and the source
    // tree's shape is preserved one level down. That is still built output, and
    // no consumer ever sees the path — they resolve through the exports map.
    const underDist = (p: string) => p === './dist' || p.startsWith('./dist/');

    // The `soribashi-source` condition is the one legitimate ./src target: only
    // this workspace opts into that condition, never a consumer. Every OTHER
    // leaf must be built output — including the ones under a subpath like
    // `./codegen`, which is why exportLeaves walks the whole map.
    const leaves = exportLeaves(manifest.exports ?? {});

    const named: Array<[string, string]> = [
      ...(manifest.main ? ([['main', manifest.main]] as Array<[string, string]>) : []),
      ...(manifest.types ? ([['types', manifest.types]] as Array<[string, string]>) : []),
      ...Object.entries(manifest.bin ?? {}).map(([k, v]) => [`bin.${k}`, v] as [string, string]),
    ];
    for (const [field, value] of named) {
      if (!underDist(value)) {
        fail(
          `${pkg}: "${field}" is "${value}"; every published entry point must live under ./dist/.`,
        );
      }
    }
    for (const leaf of leaves) {
      // `./package.json` is a deliberate self-reference, not an entry point.
      if (leaf.target === './package.json') continue;
      if (leaf.isSourceCondition) continue;
      if (!underDist(leaf.target)) {
        fail(`${pkg}: ${leaf.where} is "${leaf.target}", which is not under ./dist/.`);
      }
    }

    // 3. Every entry point must actually be IN the tarball.
    const shipped: Array<[string, string]> = [
      ...named,
      ...leaves.map((l) => [l.where, l.target] as [string, string]),
    ];
    for (const [field, target] of shipped) {
      if (!contents.has(target.replace(/^\.\//, ''))) {
        fail(`${pkg}: ${field} points at "${target}", which the tarball does not contain.`);
      }
    }

    // 4. No shipped .d.ts may carry a relative .ts/.tsx specifier.
    const declarations = [...contents].filter((p) => p.endsWith('.d.ts'));
    for (const decl of declarations) {
      const source = execFileSync('tar', ['-xOf', archive, `package/${decl}`], {
        encoding: 'utf-8',
      });
      if (TS_SPECIFIER.test(source)) {
        fail(
          `${pkg}: ${decl} carries a relative .ts/.tsx import specifier. A consumer cannot resolve ` +
            'it (TS5097, and the .ts file is not in dist/). See scripts/fix-dts-extensions.ts.',
        );
      }
    }

    if (failures.length > failuresBefore) continue;
    console.log(`  ok    ${manifest.name}@${manifest.version}`);
    console.log(`        deps: ${JSON.stringify(manifest.dependencies ?? {})}`);
    console.log(`        peer: ${JSON.stringify(manifest.peerDependencies ?? {})}`);
    console.log(`        entry points: ${shipped.length} checked, every one present under dist/`);
    console.log(`        declarations: ${declarations.length} scanned, no .ts specifiers`);
  }
} finally {
  rmSync(outDir, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(`\n${failures.length} problem(s) would have shipped. Nothing was published.`);
  process.exit(1);
}
console.log('\nPacks cleanly and is safe to publish with `bun publish`.');
