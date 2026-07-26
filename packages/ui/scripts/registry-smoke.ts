#!/usr/bin/env bun
/**
 * Registry install smoke check.
 *
 * Proves the button registry item (packages/ui/registry/button.json) is
 * actually installable into a real Vite + React project, the way an agent
 * or a developer running `shadcn add` against this registry would
 * experience it, end to end: scaffold a throwaway project, vendor Button
 * into it, install real dependencies, and build.
 *
 * What this DOES prove: the vendored Button.tsx/Button.module.css resolve
 * against @soribashi/core (and its workspace-internal deps: factory,
 * theme), compile under Vite/React 19, and the resulting bundle contains a
 * class name that came from Button.module.css.
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
 * ./registry/button.json --yes --overwrite`) against a minimal
 * components.json/tsconfig.json this script writes, since that is the
 * actual tool an agent or developer would run. If the CLI fails for any
 * reason (network, a future shadcn version hard-requiring Tailwind wiring
 * this plain-CSS project cannot satisfy, etc.), this script falls back to a
 * manual resolver that writes each registry file's `content` to its
 * `target` itself. Either way, which path was taken is printed.
 *
 * Deliberately not part of `bun run test`: this hits the network (resolves
 * `shadcn` and real npm deps) and takes minutes. Run directly with
 * `bun run smoke:registry`.
 */

import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(SCRIPT_DIR, '..', '..', '..');
const BUTTON_REGISTRY_PATH = join(REPO_ROOT, 'packages', 'ui', 'registry', 'button.json');
const BUTTON_MODULE_CSS_PATH = join(
  REPO_ROOT,
  'packages',
  'ui',
  'src',
  'recipes',
  'Button',
  'Button.module.css',
);
const THEME_CSS_PATH = join(REPO_ROOT, 'apps', 'workshop', 'src', 'generated', 'theme.css');

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

function readButtonRegistryItem(): RegistryItem {
  if (!existsSync(BUTTON_REGISTRY_PATH)) {
    throw new Error(
      `[registry-smoke] ${BUTTON_REGISTRY_PATH} does not exist. Run: bun run generate:ui`,
    );
  }
  return JSON.parse(readFileSync(BUTTON_REGISTRY_PATH, 'utf-8')) as RegistryItem;
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
 */
function vendorSourcePackage(name: string, scratchDir: string): void {
  const src = join(REPO_ROOT, 'packages', name);
  const dest = join(scratchDir, 'vendor', name);
  mkdirSync(dest, { recursive: true });
  cpSync(join(src, 'package.json'), join(dest, 'package.json'));
  cpSync(join(src, 'src'), join(dest, 'src'), { recursive: true });
}

/**
 * A minimal Vite + React 19 project. `@soribashi/core` and its
 * `workspace:*` dependencies (@soribashi/factory, @soribashi/theme) are
 * vendored into a scratch-local `vendor/` workspace (see
 * vendorSourcePackage) and linked in via `file:`, per the module-level
 * doc comment's caveat about what this can and cannot prove.
 */
async function writeScaffold(scratchDir: string): Promise<void> {
  for (const name of ['core', 'factory', 'theme']) {
    vendorSourcePackage(name, scratchDir);
  }

  const pkg = {
    name: 'soribashi-registry-smoke',
    private: true,
    version: '0.0.0',
    type: 'module',
    scripts: { build: 'vite build' },
    dependencies: {
      react: '^19.2',
      'react-dom': '^19.2',
      '@soribashi/core': 'file:./vendor/core',
    },
    devDependencies: {
      '@vitejs/plugin-react': '^6',
      vite: '^8',
    },
    // Relative, entirely inside the scratch dir: `@soribashi/core`'s own
    // `workspace:*` dependencies on factory/theme resolve against these
    // siblings once they are all workspace members together.
    // @soribashi/core is the only one that also needs a top-level
    // `dependencies` entry above, since that is what the vendored Button.tsx
    // (which imports `from '@soribashi/core'`) needs hoisted into this
    // project's own node_modules; factory/theme only need to be resolvable
    // from inside vendor/core, which workspace membership alone provides.
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
  // The CLI is invoked as `add ./registry/button.json`, a local-file item
  // address, so it needs its own copy inside the scratch project.
  await writeFile(
    join(scratchDir, 'registry', 'button.json'),
    readFileSync(BUTTON_REGISTRY_PATH, 'utf-8'),
    'utf-8',
  );
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
 * Drives the real `shadcn` CLI. Returns ok: false (never throws) on any
 * failure so the caller can fall back to the manual resolver; the specific
 * failure is logged either way.
 */
function tryCliVendor(scratchDir: string, item: RegistryItem): { ok: boolean; reason?: string } {
  log('attempting to vendor via: bunx shadcn@latest add ./registry/button.json --yes --overwrite');
  const result = spawnSync(
    'bunx',
    ['shadcn@latest', 'add', './registry/button.json', '--yes', '--overwrite'],
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

  for (const file of item.files) {
    const candidates = candidateVendoredPaths(scratchDir, file.target);
    const written = candidates.find((p) => existsSync(p));
    if (!written) {
      return {
        ok: false,
        reason:
          `CLI reported success but no file was found for target "${file.target}" at any of: ` +
          candidates.join(', '),
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

  return { ok: true };
}

/**
 * Fallback resolver: writes each files[] entry's `content` to its `target`
 * itself, using the same src/-rooted convention the CLI resolved to (see
 * candidateVendoredPaths), so main.tsx's import below works identically
 * regardless of which path was taken.
 */
async function manualVendor(scratchDir: string, item: RegistryItem): Promise<void> {
  for (const file of item.files) {
    const target = join(scratchDir, 'src', file.target);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, file.content, 'utf-8');
    log(`manual resolver wrote ${target}`);
  }
}

async function vendorButton(scratchDir: string, item: RegistryItem): Promise<VendorResult> {
  const cli = tryCliVendor(scratchDir, item);
  if (cli.ok) {
    log('vendored via: the real shadcn CLI');
    return { path: 'cli' };
  }
  log(`CLI vendoring failed, falling back to the manual resolver. Reason: ${cli.reason}`);
  await manualVendor(scratchDir, item);
  log('vendored via: the manual resolver (fallback)');
  return { path: 'manual', reason: cli.reason };
}

async function writeAppEntry(scratchDir: string): Promise<void> {
  const mainTsx = `import { createRoot } from 'react-dom/client';
import { Button } from './components/soribashi/Button/Button.tsx';
import './theme.css';

const el = document.getElementById('root');
if (el) {
  createRoot(el).render(<Button intent="primary">Smoke</Button>);
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
 * Button.module.css's own top-level local class names (`.root`, `.label`),
 * read straight from source rather than hardcoded, so this stays correct
 * if the recipe's CSS ever adds or renames a slot.
 */
function extractLocalClassNames(css: string): string[] {
  const names = new Set<string>();
  const re = /^\s*\.([a-zA-Z_][\w-]*)\s*\{/gm;
  let match: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard exec-loop idiom
  while ((match = re.exec(css)) !== null) {
    const name = match[1];
    if (name) names.add(name);
  }
  return [...names];
}

/**
 * Finds a local class name inside a built CSS bundle. Vite's default CSS
 * Modules build hashing produces names like `_root_fs7jf_2`
 * (`_{local}_{hash}_{line}`); the literal `.local` form is also accepted in
 * case hashing is ever disabled. Returns the exact matched string (without
 * the leading dot) so the caller can check for it verbatim in the JS bundle.
 */
function findBuiltClassName(builtCss: string, localName: string): string | null {
  const hashed = builtCss.match(new RegExp(`_${localName}_[A-Za-z0-9]+_\\d+`));
  if (hashed) return hashed[0];
  if (new RegExp(`\\.${localName}\\b`).test(builtCss)) return localName;
  return null;
}

async function assertBundleHasButtonClass(scratchDir: string): Promise<void> {
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

  const localNames = extractLocalClassNames(readFileSync(BUTTON_MODULE_CSS_PATH, 'utf-8'));
  if (localNames.length === 0) {
    throw new Error(
      `[registry-smoke] Could not find any local class names in ${BUTTON_MODULE_CSS_PATH} to look for.`,
    );
  }

  for (const localName of localNames) {
    const builtClass = findBuiltClassName(builtCss, localName);
    if (builtClass && builtJs.includes(builtClass)) {
      log(
        `bundle assertion passed: class "${builtClass}" (from Button.module.css's .${localName}) ` +
          'found in both the built CSS and the built JS.',
      );
      return;
    }
  }

  throw new Error(
    `[registry-smoke] None of Button.module.css's local classes (${localNames.join(', ')}) were ` +
      'found, matching, in both the built CSS and JS bundles.',
  );
}

async function main(): Promise<void> {
  log(
    'NOTE: this proves the registry item resolves and builds via a workspace file: link to ' +
      '@soribashi/core (and its factory/theme workspace deps), not via published-npm ' +
      'resolution, since @soribashi/core is not published. That is a real gap this check cannot ' +
      'close until publishing exists.',
  );

  const item = readButtonRegistryItem();
  const scratchDir = makeScratchDir();

  try {
    await writeScaffold(scratchDir);
    const vendored = await vendorButton(scratchDir, item);
    await writeAppEntry(scratchDir);
    runBunInstall(scratchDir);
    runViteBuild(scratchDir);
    await assertBundleHasButtonClass(scratchDir);
    log(`PASS (vendoring path: ${vendored.path})`);
  } finally {
    rmSync(scratchDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
