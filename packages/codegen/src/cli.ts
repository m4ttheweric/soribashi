import { resolve, join } from 'node:path';
import { existsSync } from 'node:fs';
import { loadConfig } from './load-config.ts';
import { build } from './build.ts';
import { watch } from './watch.ts';

export interface CliOptions {
  cwd?: string;
  silent?: boolean;
}

const DEFAULT_CONFIG_NAMES = [
  'soribashi.config.ts',
  'soribashi.config.js',
  'soribashi.config.mjs',
];

export async function runCli(argv: string[], options: CliOptions = {}): Promise<number> {
  const cwd = options.cwd ?? process.cwd();
  const log = options.silent ? () => {} : console.log;
  const error = options.silent ? () => {} : console.error;

  const command = argv[0];

  if (!command || (command !== 'build' && command !== 'watch')) {
    error(`Usage: soribashi <build|watch> [--config <path>]`);
    error(`Unknown command: ${command ?? '(none)'}`);
    return 1;
  }

  const configFlag = parseConfigFlag(argv);
  const configPath = configFlag ? resolve(cwd, configFlag) : findConfig(cwd);

  if (!configPath) {
    error(
      `[soribashi] No config found. Looked for: ${DEFAULT_CONFIG_NAMES.join(', ')} in ${cwd}`,
    );
    return 1;
  }

  if (!existsSync(configPath)) {
    error(`[soribashi] Config file does not exist: ${configPath}`);
    return 1;
  }

  try {
    const config = await loadConfig(configPath);

    if (command === 'build') {
      const result = await build(config);
      log(`[soribashi] wrote ${result.written.length} file(s):`);
      for (const path of result.written) log(`  ${path}`);
      return 0;
    }

    if (command === 'watch') {
      const handle = await watch(config, { silent: options.silent });
      log(`[soribashi] watching for changes... (Ctrl+C to stop)`);
      await new Promise(() => {});
      await handle.stop();
      return 0;
    }

    return 1;
  } catch (err) {
    error(`[soribashi] error: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  }
}

function parseConfigFlag(argv: string[]): string | null {
  const idx = argv.indexOf('--config');
  if (idx === -1 || idx === argv.length - 1) return null;
  return argv[idx + 1] ?? null;
}

function findConfig(cwd: string): string | null {
  for (const name of DEFAULT_CONFIG_NAMES) {
    const path = join(cwd, name);
    if (existsSync(path)) return path;
  }
  return null;
}
