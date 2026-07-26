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
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildScratchDependencies } from './scratch-deps.ts';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(SCRIPT_DIR, '..', '..', '..');
const THEME_CSS_PATH = join(REPO_ROOT, 'apps', 'workshop', 'src', 'generated', 'theme.css');

/**
 * The registry items this check installs, one per authoring category it
 * wants proof for: `button` (a leaf primitive), `stack` (a layout recipe),
 * and `checkbox` (a Base UI-backed form control, the first SMOKE_ITEM with
 * an external npm dependency to resolve). Add a name here to extend
 * coverage; a name with no matching registry/<name>.json fails loudly in
 * readRegistryItem, not silently.
 */
const SMOKE_ITEMS = ['button', 'stack', 'checkbox'] as const;
type SmokeItemName = (typeof SMOKE_ITEMS)[number];

interface RegistryFile {
  path: string;
  type: string;
  target: string;
  content: string;
}

interface RegistryItem {
  name: string;
  dependencies: string[];
  files: RegistryFile[];
}

function log(message: string): void {
  console.log(`[registry-smoke] ${message}`);
}

function registryItemPath(name: SmokeItemName): string {
  return join(REPO_ROOT, 'packages', 'ui', 'registry', `${name}.json`);
}

/**
 * Loud-failure requirement: a SMOKE_ITEMS entry with no matching registry
 * file must fail with a message that says exactly which entry and which
 * path, and how to fix it, not a bare ENOENT.
 */
function readRegistryItem(name: SmokeItemName): RegistryItem {
  const path = registryItemPath(name);
  if (!existsSync(path)) {
    throw new Error(
      `[registry-smoke] SMOKE_ITEMS entry "${name}" has no matching registry file at ${path}. ` +
        'Run: bun run generate:ui',
    );
  }
  return JSON.parse(readFileSync(path, 'utf-8')) as RegistryItem;
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
 * A minimal Vite + React 19 project. `@soribashi/core` and its
 * `workspace:*` dependencies (@soribashi/factory, @soribashi/theme) are
 * vendored into a scratch-local `vendor/` workspace (see
 * vendorSourcePackage) and linked in via `file:`, per the module-level
 * doc comment's caveat about what this can and cannot prove.
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
    // Derived from each SMOKE_ITEMS entry's own `dependencies` (see
    // buildScratchDependencies), rather than hardcoded, so a SMOKE_ITEM
    // needing an external package beyond @soribashi/core (e.g. a Base UI
    // item's `@base-ui/react`) gets that package pinned to the range
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
  // address per SMOKE_ITEM, so each one needs its own copy inside the
  // scratch project.
  for (const name of SMOKE_ITEMS) {
    await writeFile(
      join(scratchDir, 'registry', `${name}.json`),
      readFileSync(registryItemPath(name), 'utf-8'),
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
 * Drives the real `shadcn` CLI with every SMOKE_ITEM in a single `add`
 * invocation, the way a developer installing several recipes at once would.
 * Returns ok: false (never throws) on any failure so the caller can fall
 * back to the manual resolver; the specific failure is logged either way.
 */
function tryCliVendor(scratchDir: string, items: RegistryItem[]): { ok: boolean; reason?: string } {
  const registryArgs = items.map((item) => `./registry/${item.name}.json`);
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

  for (const item of items) {
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
 * Fallback resolver: writes each item's files[] entry's `content` to its
 * `target`, using the same src/-rooted convention the CLI resolved to (see
 * candidateVendoredPaths), so main.tsx's imports below work identically
 * regardless of which path was taken.
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

async function vendorItems(scratchDir: string, items: RegistryItem[]): Promise<VendorResult> {
  const cli = tryCliVendor(scratchDir, items);
  if (cli.ok) {
    log('vendored via: the real shadcn CLI');
    return { path: 'cli' };
  }
  log(`CLI vendoring failed, falling back to the manual resolver. Reason: ${cli.reason}`);
  await manualVendor(scratchDir, items);
  log('vendored via: the manual resolver (fallback)');
  return { path: 'manual', reason: cli.reason };
}

/** `button` -> `Button`, `aspect-ratio` -> `AspectRatio`: PascalCase of a SMOKE_ITEMS name, matching the recipe's own exported component name. */
function pascalCase(name: string): string {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * Renders Button and Checkbox inside Stack so a single mount proves all
 * three SMOKE_ITEMS together, the way a consumer installing a layout recipe
 * alongside leaf recipes actually uses them. Checkbox is genuinely rendered
 * here, not merely imported: an unrendered import is tree-shaken before
 * module resolution (see the module doc comment's Popover history), so
 * actually mounting it is what makes the build require `@base-ui/react` to
 * resolve at all. This composition is written by hand (not derived from
 * SMOKE_ITEMS generically): which recipes nest inside which is an authoring
 * decision, not something recoverable from the registry item alone. Adding
 * a fourth SMOKE_ITEM needs this JSX updated too.
 */
async function writeAppEntry(scratchDir: string, items: RegistryItem[]): Promise<void> {
  const importLines = items.map((item) => {
    const tsxFile = item.files.find((f) => f.target.endsWith('.tsx'));
    if (!tsxFile) {
      throw new Error(`[registry-smoke] Registry item "${item.name}" has no .tsx file to import.`);
    }
    return `import { ${pascalCase(item.name)} } from './${tsxFile.target}';`;
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

  const items = SMOKE_ITEMS.map((name) => readRegistryItem(name));
  const scratchDir = makeScratchDir();

  try {
    await writeScaffold(scratchDir, items);
    const vendored = await vendorItems(scratchDir, items);
    await writeAppEntry(scratchDir, items);
    runBunInstall(scratchDir);
    runViteBuild(scratchDir);
    await assertBundleHasRecipeMarkers(scratchDir, items);
    log(`PASS (vendoring path: ${vendored.path})`);
  } finally {
    rmSync(scratchDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
