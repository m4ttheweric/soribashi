#!/usr/bin/env bun
/**
 * Registry install smoke check.
 *
 * Proves each registry item named in SMOKE_ITEMS (packages/ui/registry/
 * <name>.json) is actually installable into a real Vite + React project,
 * the way an agent or a developer running `shadcn add` against this
 * registry would experience it, end to end: scaffold a throwaway project,
 * vendor every SMOKE_ITEM into it, install real dependencies, and build.
 * SMOKE_ITEMS deliberately covers more than one authoring category (a leaf
 * recipe and a layout recipe) so the check proves the registry, not just
 * one recipe's registry item.
 *
 * What this DOES prove: the vendored .tsx/.module.css files resolve
 * against @soribashi/core (and its workspace-internal deps: factory,
 * theme), compile under Vite/React 19, and the resulting bundle contains,
 * for each SMOKE_ITEM, a marker that came from that item's own files (see
 * findItemMarker).
 *
 * What this CANNOT prove yet: resolution of @soribashi/core from the real
 * npm registry. It is `private: true` and unpublished, so this script
 * copies @soribashi/core, @soribashi/factory, and @soribashi/theme
 * (core's own `workspace:*` dependencies) into the
 * scratch project as a self-contained `vendor/` workspace and links against
 * those copies. That is a materially different resolution path than `bun
 * add @soribashi/core` against the public registry, which is exactly what a
 * real consumer would do post-publish. This note is repeated in the
 * script's own console output for anyone reading CI logs.
 *
 * This DOES now also prove a Base UI item (`checkbox`, which declares
 * `@base-ui/react` in its registry dependencies) resolves and builds through
 * the real CLI path. That was not always true: observed with `popover`
 * temporarily added to SMOKE_ITEMS (Task 1), the shadcn CLI's own `npm
 * install` step failed with EUNSUPPORTEDPROTOCOL on the vendored
 * @soribashi/core's `workspace:*` deps on factory/theme the moment there was
 * a real external package (Base UI) for npm to resolve against the
 * registry -- button/stack alone never surfaced this because their
 * dependency graph never needed npm to leave workspace-local resolution.
 * The check fell back to manualVendor at the time, and even then only
 * appeared to pass: `bun install`/`vite build` succeeded only because
 * writeAppEntry's hand-written JSX never rendered Popover, so its unused
 * import was tree-shaken before Vite needed to resolve `@base-ui/react` at
 * all, and the run still failed at the bundle-marker assertion for that
 * reason. `vendorSourcePackage` now rewrites every vendored package's
 * `workspace:*` specifier to a relative `file:` path before handing the
 * copy to npm (see that function's own doc comment), which fixed the CLI
 * path itself rather than accepting the manualVendor fallback for Base UI
 * items; `checkbox` is rendered for real by writeAppEntry below, so the
 * bundle-marker assertion is real evidence this time, not a pass-by-omission.
 *
 * This ALSO now proves the first real cross-recipe `registryDependencies`
 * chain: `textinput` declares `registryDependencies: ["field"]` (Task 3's
 * derivation), so this script vendors and builds `field` as TextInput's
 * dependency, never listed in SMOKE_ITEMS itself. Task 3's probes (see
 * .superpowers/sdd/2026-07-26-slice-4-components/task-3-report.md, "Probe
 * record") established that the shadcn CLI resolves a BARE-NAME
 * `registryDependencies` entry REMOTELY against the hosted shadcn registry,
 * and hard-fails the WHOLE `add` (exit 1, zero files written, even for the
 * requesting item) the instant that lookup 404s -- confirmed even when the
 * dependency's own file is separately, explicitly listed on the same CLI
 * invocation (Probe C). The committed `registry/textinput.json` correctly
 * keeps the bare name `"field"` (that is the right form for the eventual
 * published-registry story), so this script rewrites its OWN SCRATCH COPY of
 * that field to the relative-path form the CLI resolves LOCALLY instead
 * (Probe B2: `"./registry/<name>.json"` succeeds, exit 0, and the CLI vendors
 * the dependency's files itself as part of the same invocation) -- see
 * `scratchRegistryDependencies`'s own doc comment for the full justification,
 * which mirrors `vendorSourcePackage`'s identical rewrite of `workspace:*` to
 * `file:` immediately below: the committed form targets the publish story,
 * the scratch copy is a local-file install, a materially different
 * resolution context that gets a materially different form of the same
 * field.
 *
 * The copy (rather than `workspaces` pointed straight at this repo's real
 * packages/core etc.) is load-bearing, not incidental: `workspace:*`
 * dependencies only resolve inside an actual bun workspace, and bun's
 * install for a workspace member writes real node_modules symlinks INSIDE
 * that member's own directory. Pointing a scratch project's `workspaces` at
 * this repo's real package directories was tried first and confirmed
 * destructive: `bun install` rewrote packages/core/node_modules,
 * packages/factory/node_modules, etc. in this repo to point at the scratch
 * project's dependency tree, breaking `bun run typecheck` here until
 * `bun install` was re-run at the repo root. Copying into scratchDir/vendor
 * keeps every mutation inside the disposable scratch directory.
 *
 * Vendoring prefers driving the real `shadcn` CLI (`bunx shadcn@latest add
 * ./registry/<name>.json ... --yes --overwrite`, one item per SMOKE_ITEM in
 * a single invocation) against a minimal components.json/tsconfig.json this
 * script writes, since that is the actual tool an agent or developer would
 * run. If the CLI fails for any reason (network, a future shadcn version
 * hard-requiring Tailwind wiring this plain-CSS project cannot satisfy,
 * etc.), this script falls back to a manual resolver that writes each
 * registry file's `content` to its `target` itself. Either way, which path
 * was taken is printed.
 *
 * Deliberately not part of `bun run test`: this hits the network (resolves
 * `shadcn` and real npm deps) and takes minutes. Run directly with
 * `bun run smoke:registry`.
 */

import { execFileSync, spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildScratchDependencies } from './scratch-deps.ts';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(SCRIPT_DIR, '..', '..', '..');
// This package's own codegen artifact (SORI-13); it used to be read out of
// apps/workshop, where the root config wrote it.
const THEME_CSS_PATH = join(REPO_ROOT, 'packages', 'ui', 'src', 'generated', 'theme.css');
const MANIFEST_PATH = join(REPO_ROOT, 'packages', 'ui', 'manifest.json');

/**
 * The registry items this check installs and asserts bundle markers for, one
 * per authoring category (plus, as of `textinput`, one per dependency-chain
 * shape) it wants proof for: `button` (a leaf primitive), `stack` (a layout
 * recipe), `checkbox` (a Base UI-backed form control with an external npm
 * dependency to resolve), and `textinput` (the first SMOKE_ITEM with a
 * non-empty `registryDependencies` -- see the module doc comment's
 * cross-recipe-chain paragraph). This is the ASSERTED list: bundle markers
 * (assertBundleHasRecipeMarkers) are checked for these items only, and
 * writeAppEntry imports/renders exactly these. `field` (textinput's
 * dependency) deliberately does NOT appear here: it has no `--sb-field-*` var
 * to assert a marker for, and its own proof is structural (the vendored
 * TextInput.tsx's `'../Field/Field.tsx'` import resolves and the build
 * succeeds), not a bundle-marker check -- see resolveDependencyClosure. Add a
 * name here to extend ASSERTED coverage; a name with no matching
 * registry/<name>.json fails loudly in readRegistryItem, not silently.
 */
const SMOKE_ITEMS = ['button', 'stack', 'checkbox', 'textinput'] as const;

interface RegistryFile {
  path: string;
  type: string;
  target: string;
  content: string;
}

interface RegistryItem {
  name: string;
  dependencies: string[];
  registryDependencies: string[];
  files: RegistryFile[];
}

function log(message: string): void {
  console.log(`[registry-smoke] ${message}`);
}

/**
 * Not restricted to `SmokeItemName`: `resolveDependencyClosure` also looks up
 * names that only ever appear inside another item's `registryDependencies`
 * (e.g. `field`, never itself a SMOKE_ITEMS entry), so this accepts any
 * registry item name.
 */
function registryItemPath(name: string): string {
  return join(REPO_ROOT, 'packages', 'ui', 'registry', `${name}.json`);
}

/**
 * Loud-failure requirement: a name with no matching registry file must fail
 * with a message that says exactly which name and which path, and how to fix
 * it, not a bare ENOENT. Used both for SMOKE_ITEMS entries directly and for
 * names discovered transitively via `registryDependencies`.
 */
function readRegistryItem(name: string): RegistryItem {
  const path = registryItemPath(name);
  if (!existsSync(path)) {
    throw new Error(
      `[registry-smoke] "${name}" has no matching registry file at ${path}. ` +
        'Run: bun run generate:ui',
    );
  }
  return JSON.parse(readFileSync(path, 'utf-8')) as RegistryItem;
}

/**
 * Computes the registryDependencies closure of SMOKE_ITEMS: SMOKE_ITEMS
 * itself, plus, transitively, every name reachable through each item's own
 * `registryDependencies` field. A work-queue loop rather than a fixed
 * one-level lookup, so a future two-hop chain (a control depending on a
 * compound that itself depends on something else) is not silently
 * under-vendored the day this needs to grow past one level. Today this
 * equals SMOKE_ITEMS plus `field` (textinput's sole dependency).
 *
 * The closure feeds every vendoring concern that must ALSO cover a
 * dependency, even though the dependency itself is never asserted or
 * explicitly listed on the CLI invocation: the scratch registry/ copies
 * (writeScaffold), `buildScratchDependencies` (field's `@base-ui/react` dep
 * must flow into the scratch project's own package.json), `tryCliVendor`'s
 * file-verification loop (proving field's files actually landed, via the
 * CLI's OWN local dependency resolution -- see scratchRegistryDependencies),
 * and `manualVendor`'s fallback loop (so the fallback path produces field's
 * files too, not just the CLI path).
 */
function resolveDependencyClosure(names: readonly string[]): RegistryItem[] {
  const closure = new Map<string, RegistryItem>();
  const queue = [...names];
  while (queue.length > 0) {
    const name = queue.shift()!;
    if (closure.has(name)) continue;
    const item = readRegistryItem(name);
    closure.set(name, item);
    for (const dep of item.registryDependencies) {
      if (!closure.has(dep)) queue.push(dep);
    }
  }
  return [...closure.values()];
}

function makeScratchDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'soribashi-registry-smoke-'));
  log(`scratch dir: ${dir}`);
  return dir;
}

/**
 * Copies exactly a soribashi source package's package.json + src/ into
 * scratchDir/vendor/<name>, so it can be declared as a `workspaces` member
 * of the scratch project without ever touching the real repo directory
 * (see the module doc comment: pointing `workspaces` at the real
 * directories directly was tried and is destructive). Deliberately does NOT
 * copy the package's own tsconfig.json: it `extends: "../../tsconfig.base.json"`,
 * a path relative to this repo's layout that does not exist inside the
 * scratch dir, and Vite 8's build-time TS transform resolves and fails
 * loudly on a dangling `extends` if that file comes along for the ride.
 *
 * Rewrites every vendored-package dependency using the `workspace:` protocol
 * (any range form: `workspace:*`, `workspace:^`, `workspace:~`, ...) to a
 * relative `file:` path before writing the copy (e.g. `@soribashi/core`'s
 * `"@soribashi/factory": "workspace:*"` becomes `"file:../factory"`). Every
 * vendored package sits as a sibling directory under scratchDir/vendor/, so
 * `../<unscoped-name>` always resolves. This is required, not cosmetic: the
 * shadcn CLI shells out to `npm install`, and npm does not understand the
 * `workspace:` protocol the moment it actually has to hit the registry for
 * some OTHER dependency (e.g. a Base UI item's `@base-ui/react`) --
 * confirmed empirically with `popover` temporarily in SMOKE_ITEMS, where
 * this same npm install step failed with EUNSUPPORTEDPROTOCOL on exactly
 * these `workspace:*` specifiers (see the module doc comment's
 * `it also cannot yet prove a Base UI item...` paragraph). Button/stack
 * alone never surfaced this because their dependency graph has nothing
 * beyond the vendored packages themselves, so npm's workspace-local
 * resolution never needs to touch the registry at all; a real npm-registry
 * dependency anywhere in the graph is what triggers npm to choke on the
 * unrelated `workspace:*` specifiers sitting in vendor/core's package.json.
 */
function vendorSourcePackage(name: string, scratchDir: string): void {
  const src = join(REPO_ROOT, 'packages', name);
  const dest = join(scratchDir, 'vendor', name);
  mkdirSync(dest, { recursive: true });

  const pkgJson = JSON.parse(readFileSync(join(src, 'package.json'), 'utf-8'));
  for (const depField of ['dependencies', 'peerDependencies'] as const) {
    const deps = pkgJson[depField];
    if (!deps) continue;
    for (const [depName, depRange] of Object.entries(deps)) {
      // Matches any `workspace:` protocol specifier (`workspace:*`, and the
      // semver-range forms `workspace:^`/`workspace:~`/`workspace:1.2.3`
      // bun/npm workspaces also accept), not just the exact literal
      // `workspace:*` every package.json in this repo happens to use today:
      // a future dependency declared with a range form would hit the exact
      // same EUNSUPPORTEDPROTOCOL failure this rewrite exists to prevent,
      // and there is no cheaper way to stay correct than matching the
      // protocol prefix rather than one literal value of it.
      if (
        typeof depRange === 'string' &&
        depRange.startsWith('workspace:') &&
        depName.startsWith('@soribashi/')
      ) {
        deps[depName] = `file:../${depName.slice('@soribashi/'.length)}`;
      }
    }
  }
  writeFileSync(join(dest, 'package.json'), `${JSON.stringify(pkgJson, null, 2)}\n`, 'utf-8');
  cpSync(join(src, 'src'), join(dest, 'src'), { recursive: true });
}

/**
 * Builds the consumer-side builders module a vendoring consumer would author
 * for themselves: a theme declaration plus `makeBuilders<typeof theme>()`.
 * The vocabulary values are interpolated from the committed manifest (see
 * `MANIFEST_PATH`) rather than hardcoded, the same no-drift move
 * `buildInitThemeTs` in generate-registry.ts makes, so this scaffold can
 * never fall out of step with packages/ui/src/theme.ts's actual uiVocabulary
 * declaration.
 */
function buildConsumerBuildersTs(vocabulary: Record<string, string[]>): string {
  const axisLines = Object.entries(vocabulary)
    .map(
      ([axis, values]) =>
        `  ${axis}: defineVocabulary([${values.map((v) => `'${v}'`).join(', ')}] as const),`,
    )
    .join('\n');
  return `// Consumer-side builders module: a vendoring consumer owns their theme,
// and typed builders derive from it. Written by the smoke scaffold; a real
// consumer authors the equivalent (values are their own vocabulary).
import { createTheme, defaultDarkTokens, defaultTokens, defineVocabulary, makeBuilders } from '@soribashi/core';

const vocabulary = {
${axisLines}
};

const theme = createTheme({ name: 'smoke-consumer', tokens: defaultTokens, dark: defaultDarkTokens, vocabulary });

export const { defineComponent, definePolymorphicComponent, defineCompound, defineGenericComponent } =
  makeBuilders<typeof theme>();
`;
}

/**
 * Rewrites a registry item's `registryDependencies` bare names to the
 * relative-path form the shadcn CLI resolves LOCALLY, for the SCRATCH COPY
 * only. Justified by, and mirroring, `vendorSourcePackage`'s identical
 * `workspace:*` -> `file:` rewrite above: the committed `registry/<name>.json`
 * targets the publish story (a real consumer's own registry resolving a
 * bare name against a real hosted registry, which this package does not have
 * yet), while the scratch project is a local-file install, a materially
 * different resolution context that needs a materially different form of the
 * same field. Justified empirically, not by inference: Task 3's probes
 * (task-3-report.md, "Probe record") showed a bare name is resolved REMOTELY
 * against the hosted shadcn registry and hard-fails the WHOLE `add` (exit 1,
 * zero files, even for the requesting item) when that lookup 404s -- even
 * when the dependency's own file is separately listed on the same CLI
 * invocation (Probe C) -- while the relative-path form
 * `"./registry/<name>.json"` resolves LOCALLY and succeeds (exit 0), with the
 * CLI vendoring the dependency's own files as part of the same invocation
 * (Probe B2). Fails loudly, per this script's own convention, if a named
 * dependency has no local registry file in this run's dependency closure to
 * point at, rather than silently emitting a path that would 404.
 */
function scratchRegistryDependencies(
  item: RegistryItem,
  availableNames: ReadonlySet<string>,
): string[] {
  return item.registryDependencies.map((dep) => {
    if (!availableNames.has(dep)) {
      throw new Error(
        `[registry-smoke] registry item "${item.name}" declares registryDependencies dependency ` +
          `"${dep}", which has no local registry/${dep}.json in this run's dependency closure ` +
          '(resolveDependencyClosure). Add it there, or fix the item.',
      );
    }
    return `./registry/${dep}.json`;
  });
}

/**
 * A minimal Vite + React 19 project. `@soribashi/core` and its
 * `workspace:*` dependencies (@soribashi/factory, @soribashi/theme) are
 * vendored into a scratch-local `vendor/` workspace (see
 * vendorSourcePackage) and linked in via `file:`, per the module-level
 * doc comment's caveat about what this can and cannot prove.
 *
 * `items` here is the FULL dependency closure of SMOKE_ITEMS (see
 * resolveDependencyClosure), not SMOKE_ITEMS alone: a dependency like `field`
 * needs its own scratch registry/ copy and its own external deps
 * (`@base-ui/react`) folded into the scratch project's package.json, even
 * though it is never itself asserted or explicitly listed on the CLI
 * invocation.
 */
async function writeScaffold(scratchDir: string, items: RegistryItem[]): Promise<void> {
  for (const name of ['core', 'factory', 'theme']) {
    vendorSourcePackage(name, scratchDir);
  }

  const uiDeps = JSON.parse(
    readFileSync(join(REPO_ROOT, 'packages', 'ui', 'package.json'), 'utf-8'),
  ).dependencies;

  const pkg = {
    name: 'soribashi-registry-smoke',
    private: true,
    version: '0.0.0',
    type: 'module',
    scripts: { build: 'vite build' },
    // Derived from every closure item's own `dependencies` (see
    // buildScratchDependencies), rather than hardcoded, so an item needing an
    // external package beyond @soribashi/core (e.g. a Base UI item's
    // `@base-ui/react`) gets that package pinned to the range
    // packages/ui/package.json itself uses, not left to whatever the shadcn
    // CLI resolves. @soribashi/core is the only soribashi package that also
    // gets a top-level entry here, since that is what the vendored
    // Button.tsx (which imports `from '@soribashi/core'`) needs hoisted into
    // this project's own node_modules; factory/theme only need to be
    // resolvable from inside vendor/core, which workspace membership alone
    // provides (see buildScratchDependencies for why).
    dependencies: buildScratchDependencies(items, uiDeps),
    devDependencies: {
      '@vitejs/plugin-react': '^6',
      vite: '^8',
    },
    // Relative, entirely inside the scratch dir: `@soribashi/core`'s own
    // `workspace:*` dependencies on factory/theme resolve against these
    // siblings once they are all workspace members together.
    workspaces: ['vendor/*'],
  };

  const tsconfig = {
    compilerOptions: {
      target: 'ES2022',
      lib: ['ES2022', 'DOM', 'DOM.Iterable'],
      module: 'ESNext',
      moduleResolution: 'Bundler',
      jsx: 'react-jsx',
      strict: true,
      skipLibCheck: true,
      baseUrl: '.',
      paths: { '@/*': ['./src/*'] },
    },
    include: ['src'],
  };

  // A minimal but schema-valid components.json (required: style, tailwind
  // {config,css,baseColor,cssVariables}, rsc, aliases{utils,components} per
  // https://ui.shadcn.com/schema.json), written up front so the CLI never
  // hits its interactive "create components.json?" / style-picker wizard.
  // The `tailwind` block is inert here: our registry items declare no
  // `tailwind`/`cssVars` fields, so the CLI never touches actual Tailwind
  // config; a real Tailwind wiring requirement would show up as a distinct
  // CLI failure, caught by the caller and treated as a fallback trigger.
  const componentsJson = {
    style: 'new-york',
    tailwind: { config: '', css: 'src/index.css', baseColor: 'neutral', cssVariables: true },
    rsc: false,
    tsx: true,
    aliases: { components: '@/components', utils: '@/lib/utils' },
  };

  const viteConfig = `import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
});
`;

  const indexHtml = `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>soribashi registry smoke</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

  await mkdir(join(scratchDir, 'src'), { recursive: true });
  const manifestVocabulary = (
    JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8')) as { vocabulary: Record<string, string[]> }
  ).vocabulary;
  await mkdir(join(scratchDir, 'src', 'components', 'soribashi'), { recursive: true });
  await writeFile(
    join(scratchDir, 'src', 'components', 'soribashi', 'builders.ts'),
    buildConsumerBuildersTs(manifestVocabulary),
    'utf-8',
  );
  await mkdir(join(scratchDir, 'registry'), { recursive: true });
  await writeFile(join(scratchDir, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`, 'utf-8');
  await writeFile(
    join(scratchDir, 'tsconfig.json'),
    `${JSON.stringify(tsconfig, null, 2)}\n`,
    'utf-8',
  );
  await writeFile(
    join(scratchDir, 'components.json'),
    `${JSON.stringify(componentsJson, null, 2)}\n`,
    'utf-8',
  );
  await writeFile(join(scratchDir, 'vite.config.ts'), viteConfig, 'utf-8');
  await writeFile(join(scratchDir, 'index.html'), indexHtml, 'utf-8');
  await writeFile(join(scratchDir, 'src', 'index.css'), '', 'utf-8');
  // The CLI is invoked as `add ./registry/<name>.json`, a local-file item
  // address, so every closure item (SMOKE_ITEMS plus any transitive
  // registryDependencies, e.g. `field`) needs its own copy inside the
  // scratch project -- `field` is never named on the CLI invocation itself,
  // but it must still be sitting there locally for `textinput`'s rewritten
  // relative-path dependency (see scratchRegistryDependencies) to resolve
  // against. Each copy's `registryDependencies` is rewritten to the
  // relative-path form for this scratch project's own local resolution;
  // every other field is passed through unchanged.
  const closureNames = new Set(items.map((item) => item.name));
  for (const item of items) {
    const scratchItem = {
      ...item,
      registryDependencies: scratchRegistryDependencies(item, closureNames),
    };
    await writeFile(
      join(scratchDir, 'registry', `${item.name}.json`),
      `${JSON.stringify(scratchItem, null, 2)}\n`,
      'utf-8',
    );
  }
}

/**
 * Where a vendored file actually lands depends on how `target` gets
 * resolved. Observed behavior (shadcn 4.15): a target whose first segment
 * matches an aliased root name (here, `components/...` against
 * `aliases.components: "@/components"` + `"@/*": ["./src/*"]`) gets
 * re-rooted under the alias's resolved directory (`src/components/...`),
 * even though the target string itself has no `@` placeholder. Both that
 * resolved form and the literal target are checked so a future CLI version
 * changing this convention degrades to a clear failure, not a false pass.
 */
function candidateVendoredPaths(scratchDir: string, target: string): string[] {
  return [join(scratchDir, 'src', target), join(scratchDir, target)];
}

interface VendorResult {
  path: 'cli' | 'manual';
  reason?: string;
}

/**
 * Drives the real `shadcn` CLI with every SMOKE_ITEM (the ASSERTED list) in
 * a single `add` invocation, the way a developer installing several recipes
 * at once would. `field` is deliberately NOT named on the command line: per
 * Task 3's Probe C, explicitly co-listing a dependency's file does not
 * change how the CLI handles a bare name in another item's
 * `registryDependencies` -- what actually makes this work is the scratch
 * copy's rewritten relative-path dependency (scratchRegistryDependencies),
 * which the CLI follows and resolves LOCALLY on its own. `closureItems`
 * (SMOKE_ITEMS plus every transitive dependency, e.g. `field`) is what the
 * post-install file-verification loop checks against, so this proves that
 * local dependency resolution actually happened -- field's files landing is
 * PART of what this check exists to prove, not an assumption it makes.
 * Returns ok: false (never throws) on any failure so the caller can fall
 * back to the manual resolver; the specific failure is logged either way.
 */
function tryCliVendor(
  scratchDir: string,
  smokeItems: RegistryItem[],
  closureItems: RegistryItem[],
): { ok: boolean; reason?: string } {
  const registryArgs = smokeItems.map((item) => `./registry/${item.name}.json`);
  log(
    `attempting to vendor via: bunx shadcn@latest add ${registryArgs.join(' ')} --yes --overwrite`,
  );
  const result = spawnSync(
    'bunx',
    ['shadcn@latest', 'add', ...registryArgs, '--yes', '--overwrite'],
    {
      cwd: scratchDir,
      encoding: 'utf-8',
      timeout: 120_000,
    },
  );

  if (result.error) {
    return { ok: false, reason: `CLI process error: ${result.error.message}` };
  }
  if (result.status !== 0) {
    const tail = `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim().split('\n').slice(-20);
    return {
      ok: false,
      reason: `CLI exited ${result.status}. Last output lines:\n${tail.join('\n')}`,
    };
  }

  for (const item of closureItems) {
    for (const file of item.files) {
      const candidates = candidateVendoredPaths(scratchDir, file.target);
      const written = candidates.find((p) => existsSync(p));
      if (!written) {
        return {
          ok: false,
          reason:
            `CLI reported success but no file was found for "${item.name}"'s target "${file.target}" ` +
            `at any of: ${candidates.join(', ')}`,
        };
      }
      const actual = readFileSync(written, 'utf-8');
      if (actual !== file.content) {
        return {
          ok: false,
          reason: `CLI-written file at ${written} does not match the registry item's content for ${file.path}.`,
        };
      }
    }
  }

  return { ok: true };
}

/**
 * Fallback resolver: writes each closure item's files[] entry's `content` to
 * its `target`, using the same src/-rooted convention the CLI resolved to
 * (see candidateVendoredPaths), so main.tsx's imports below work identically
 * regardless of which path was taken. Takes the full dependency closure (not
 * just SMOKE_ITEMS), so a `field`-shaped dependency lands via this fallback
 * path too, not only via the CLI's own local resolution.
 */
async function manualVendor(scratchDir: string, items: RegistryItem[]): Promise<void> {
  for (const item of items) {
    for (const file of item.files) {
      const target = join(scratchDir, 'src', file.target);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, file.content, 'utf-8');
      log(`manual resolver wrote ${target}`);
    }
  }
}

async function vendorItems(
  scratchDir: string,
  smokeItems: RegistryItem[],
  closureItems: RegistryItem[],
): Promise<VendorResult> {
  const cli = tryCliVendor(scratchDir, smokeItems, closureItems);
  if (cli.ok) {
    log('vendored via: the real shadcn CLI');
    return { path: 'cli' };
  }
  log(`CLI vendoring failed, falling back to the manual resolver. Reason: ${cli.reason}`);
  await manualVendor(scratchDir, closureItems);
  log('vendored via: the manual resolver (fallback)');
  return { path: 'manual', reason: cli.reason };
}

/**
 * Renders Button, Checkbox, and TextInput inside Stack so a single mount
 * proves all four SMOKE_ITEMS together, the way a consumer installing a
 * layout recipe alongside leaf recipes actually uses them. `items` here is
 * SMOKE_ITEMS (the ASSERTED list), not the dependency closure: `field`
 * arrives transitively through the vendored TextInput.tsx's own
 * `'../Field/Field.tsx'` import, and is never imported or rendered directly
 * here -- its proof is structural (that import resolving and the build
 * succeeding), not a bundle marker (see the module doc comment and
 * SMOKE_ITEMS' own doc comment). Checkbox and TextInput are genuinely
 * rendered here, not merely imported: an unrendered import is tree-shaken
 * before module resolution (see the module doc comment's Popover history),
 * so actually mounting them is what makes the build require `@base-ui/react`
 * (and, for TextInput, `field`) to resolve at all. This composition is
 * written by hand (not derived from SMOKE_ITEMS generically): which recipes
 * nest inside which is an authoring decision, not something recoverable from
 * the registry item alone. Adding a fifth SMOKE_ITEM needs this JSX updated
 * too.
 */
async function writeAppEntry(scratchDir: string, items: RegistryItem[]): Promise<void> {
  const importLines = items.map((item) => {
    const tsxFile = item.files.find((f) => f.target.endsWith('.tsx'));
    if (!tsxFile) {
      throw new Error(`[registry-smoke] Registry item "${item.name}" has no .tsx file to import.`);
    }
    const componentName = basename(tsxFile.target, '.tsx');
    return `import { ${componentName} } from './${tsxFile.target}';`;
  });

  const mainTsx = `import { createRoot } from 'react-dom/client';
${importLines.join('\n')}
import './theme.css';

const el = document.getElementById('root');
if (el) {
  createRoot(el).render(
    <Stack>
      <Button intent="primary">Smoke</Button>
      <Checkbox label="smoke" />
      <TextInput label="smoke" />
    </Stack>,
  );
}
`;
  await writeFile(join(scratchDir, 'src', 'main.tsx'), mainTsx, 'utf-8');
  await writeFile(
    join(scratchDir, 'src', 'theme.css'),
    readFileSync(THEME_CSS_PATH, 'utf-8'),
    'utf-8',
  );
}

function runBunInstall(scratchDir: string): void {
  log('running: bun install');
  execFileSync('bun', ['install'], { cwd: scratchDir, stdio: 'inherit', timeout: 180_000 });
}

function runViteBuild(scratchDir: string): void {
  log('running: vite build');
  execFileSync('bun', ['run', 'build'], { cwd: scratchDir, stdio: 'inherit', timeout: 180_000 });
}

/**
 * A recipe's own `--sb-<name>-*` CSS custom properties, read straight from
 * the registry item's own module CSS content rather than hardcoded, so this
 * stays correct if a recipe's CSS ever adds or renames one. This is the
 * bundle marker every SMOKE_ITEM is checked against (see findItemMarker):
 * a local CSS Module class name (e.g. `.root`) was the original,
 * single-item version of this check, but it does not generalize once more
 * than one SMOKE_ITEM shares a selector name, which Button and Stack both
 * do (both declare `.root` among their selectors). Vite CSS Modules hashes
 * each occurrence to a distinct string, but a same-named-selector search
 * against the *combined* built CSS of several items can only ever find the
 * first occurrence in the concatenated text, which is not necessarily the item
 * being checked; that would silently validate the wrong recipe's survival,
 * not prove anything about the one under test. Every SMOKE_ITEM recipe with
 * a size/dimension-driven var instead prefixes its custom property with its
 * own recipe name by convention (`--sb-button-h`, `--sb-stack-gap`, ...),
 * making the string unique to that recipe by construction: unhashed, so it
 * survives verbatim both in the built CSS (the module CSS's own
 * `var(--sb-...)` reference) and in the built JS (the same string as an
 * object key in the recipe's `vars()` resolver, compiled straight from the
 * registry item's own .tsx content).
 */
function extractRecipeCustomProperties(css: string, itemName: string): string[] {
  const names = new Set<string>();
  const re = new RegExp(`--sb-${itemName}-[\\w-]+`, 'g');
  let match: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard exec-loop idiom
  while ((match = re.exec(css)) !== null) {
    names.add(match[0]);
  }
  return [...names];
}

/**
 * The one marker for a given registry item that must appear, verbatim, in
 * both the built CSS and the built JS. Returns null (never throws) so the
 * caller can report which item failed.
 */
function findItemMarker(item: RegistryItem, builtCss: string, builtJs: string): string | null {
  const cssFile = item.files.find((f) => f.path.endsWith('.module.css'));
  if (!cssFile) return null;
  for (const varName of extractRecipeCustomProperties(cssFile.content, item.name)) {
    if (builtCss.includes(varName) && builtJs.includes(varName)) {
      return varName;
    }
  }
  return null;
}

async function assertBundleHasRecipeMarkers(
  scratchDir: string,
  items: RegistryItem[],
): Promise<void> {
  const assetsDir = join(scratchDir, 'dist', 'assets');
  if (!existsSync(assetsDir)) {
    throw new Error(`[registry-smoke] Expected build output at ${assetsDir}, found none.`);
  }
  const { readdir } = await import('node:fs/promises');
  const entries = await readdir(assetsDir);
  const cssFiles = entries.filter((f) => f.endsWith('.css'));
  const jsFiles = entries.filter((f) => f.endsWith('.js'));
  if (cssFiles.length === 0 || jsFiles.length === 0) {
    throw new Error(
      `[registry-smoke] Expected at least one built .css and .js asset in ${assetsDir}, found: ${entries.join(', ')}`,
    );
  }

  const builtCss = cssFiles.map((f) => readFileSync(join(assetsDir, f), 'utf-8')).join('\n');
  const builtJs = jsFiles.map((f) => readFileSync(join(assetsDir, f), 'utf-8')).join('\n');

  for (const item of items) {
    const marker = findItemMarker(item, builtCss, builtJs);
    if (!marker) {
      throw new Error(
        `[registry-smoke] No --sb-${item.name}-* marker for registry item "${item.name}" was found, ` +
          'matching, in both the built CSS and JS bundles.',
      );
    }
    log(
      `bundle assertion passed for "${item.name}": marker "${marker}" found in both the built CSS ` +
        'and the built JS.',
    );
  }
}

async function main(): Promise<void> {
  log(
    'NOTE: this proves each registry item resolves and builds via a workspace file: link to ' +
      '@soribashi/core (and its factory/theme workspace deps), not via published-npm ' +
      'resolution, since @soribashi/core is not published. That is a real gap this check cannot ' +
      'close until publishing exists.',
  );
  log(`SMOKE_ITEMS: ${SMOKE_ITEMS.join(', ')}`);

  const smokeItems = SMOKE_ITEMS.map((name) => readRegistryItem(name));
  const closureItems = resolveDependencyClosure(SMOKE_ITEMS);
  const closureOnlyNames = closureItems
    .map((item) => item.name)
    .filter((name) => !(SMOKE_ITEMS as readonly string[]).includes(name));
  if (closureOnlyNames.length > 0) {
    log(
      `dependency closure adds: ${closureOnlyNames.join(', ')} (not asserted, not on the CLI invocation)`,
    );
  }
  const scratchDir = makeScratchDir();

  try {
    await writeScaffold(scratchDir, closureItems);
    const vendored = await vendorItems(scratchDir, smokeItems, closureItems);
    await writeAppEntry(scratchDir, smokeItems);
    runBunInstall(scratchDir);
    runViteBuild(scratchDir);
    await assertBundleHasRecipeMarkers(scratchDir, smokeItems);
    log(`PASS (vendoring path: ${vendored.path})`);
  } finally {
    rmSync(scratchDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
