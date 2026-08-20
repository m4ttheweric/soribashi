import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './build.ts';
import { loadConfig } from './load-config.ts';
import { watch } from './watch.ts';

export interface CliOptions {
  cwd?: string;
  /**
   * Suppresses informational output (build summaries, watch status, help).
   * Errors always print to stderr, even when silent.
   */
  silent?: boolean;
}

const DEFAULT_CONFIG_NAMES = ['soribashi.config.ts', 'soribashi.config.js', 'soribashi.config.mjs'];

const USAGE = `Usage: soribashi <build|watch> [options]

Commands:
  build             Generate theme CSS (and Tailwind outputs) once
  watch             Build, then rebuild when watched files change

Options:
  --config <path>   Path to the config file (default: ${DEFAULT_CONFIG_NAMES.join(', ')})
  --verbose         Include stack traces in error output (DEBUG env var does the same)
  -h, --help        Show this help and exit
  -v, --version     Print the @soribashi/codegen version and exit`;

interface ParsedArgs {
  command?: string;
  configFlag?: string;
  verbose: boolean;
  help: boolean;
  version: boolean;
  error?: string;
}

export async function runCli(argv: string[], options: CliOptions = {}): Promise<number> {
  const cwd = options.cwd ?? process.cwd();
  const log = options.silent ? () => {} : console.log;
  const error: typeof console.error = (...args) => console.error(...args);

  const args = parseArgs(argv);

  if (args.help) {
    log(USAGE);
    return 0;
  }

  if (args.version) {
    log(readOwnVersion());
    return 0;
  }

  if (args.error) {
    error(`[soribashi] ${args.error}`);
    error(USAGE);
    return 1;
  }

  if (!args.command || (args.command !== 'build' && args.command !== 'watch')) {
    error(`[soribashi] Unknown command: ${args.command ?? '(none)'}`);
    error(USAGE);
    return 1;
  }

  const configPath = args.configFlag ? resolve(cwd, args.configFlag) : findConfig(cwd);

  if (!configPath) {
    error(`[soribashi] No config found. Looked for: ${DEFAULT_CONFIG_NAMES.join(', ')} in ${cwd}`);
    return 1;
  }

  if (!existsSync(configPath)) {
    error(`[soribashi] Config file does not exist: ${configPath}`);
    return 1;
  }

  try {
    if (args.command === 'build') {
      const config = await loadConfig(configPath);
      const result = await build(config);
      log(`[soribashi] wrote ${result.written.length} file(s):`);
      for (const path of result.written) log(`  ${path}`);
      return 0;
    }

    const handle = await watch(configPath, { silent: options.silent, cwd });
    log('[soribashi] watching for changes... (Ctrl+C to stop)');
    return await new Promise<number>((resolveExit) => {
      process.once('SIGINT', () => {
        log('[soribashi] shutting down...');
        void handle.stop().then(() => resolveExit(0));
      });
    });
  } catch (err) {
    error(`[soribashi] error: ${err instanceof Error ? err.message : String(err)}`);
    if ((args.verbose || process.env.DEBUG) && err instanceof Error && err.stack) {
      error(err.stack);
    }
    return 1;
  }
}

function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = { verbose: false, help: false, version: false };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--version' || arg === '-v') {
      args.version = true;
    } else if (arg === '--verbose') {
      args.verbose = true;
    } else if (arg === '--config') {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith('-')) {
        args.error ??= '--config requires a path argument';
      } else {
        args.configFlag = value;
        i++;
      }
    } else if (arg.startsWith('-')) {
      args.error ??= `Unknown flag: ${arg}`;
    } else if (args.command === undefined) {
      args.command = arg;
    } else {
      args.error ??= `Unexpected argument: ${arg}`;
    }
  }

  return args;
}

/**
 * Reads this package's own version.
 *
 * Deliberately walks up from this module rather than hardcoding
 * `new URL('../package.json', import.meta.url)`. That fixed single hop is only
 * correct while this module sits one level below the package root, which holds
 * for `src/cli.ts` but NOT for the published build, where the same module is
 * emitted to `dist/src/cli.js` and one hop lands on a `dist/package.json` that
 * does not exist. Walking up until a `package.json` turns up is correct for
 * both layouts, so `soribashi --version` works from an installed tarball as
 * well as from a source checkout.
 */
function readOwnVersion(): string {
  let dir = dirname(fileURLToPath(import.meta.url));

  // The filesystem root is a fixed point of `dirname`, which is the loop's stop
  // condition — there is no unbounded walk here.
  for (;;) {
    const candidate = join(dir, 'package.json');
    if (existsSync(candidate)) {
      const pkg = JSON.parse(readFileSync(candidate, 'utf-8')) as { version?: string };
      if (pkg.version) return pkg.version;
    }
    const parent = dirname(dir);
    if (parent === dir) return '0.0.0';
    dir = parent;
  }
}

function findConfig(cwd: string): string | null {
  for (const name of DEFAULT_CONFIG_NAMES) {
    const path = join(cwd, name);
    if (existsSync(path)) return path;
  }
  return null;
}
