import { watch as fsWatch } from 'node:fs';
import { resolve, dirname } from 'node:path';
import type { CodegenConfig } from './types.ts';
import { build } from './build.ts';

export interface WatchHandle {
  stop: () => Promise<void>;
  rebuild: () => Promise<void>;
}

export interface WatchOptions {
  silent?: boolean;
}

/**
 * Runs an initial build, then watches the configured paths for changes and
 * re-runs the build on each change.
 */
export async function watch(
  config: CodegenConfig,
  options: WatchOptions = {},
): Promise<WatchHandle> {
  let isRunning = false;
  const log = options.silent ? () => {} : console.log;

  const runBuild = async () => {
    if (isRunning) return;
    isRunning = true;
    try {
      const start = Date.now();
      const result = await build(config);
      log(`[soribashi] built in ${Date.now() - start}ms (${result.written.length} files)`);
    } catch (error) {
      console.error('[soribashi] build failed:', error);
    } finally {
      isRunning = false;
    }
  };

  await runBuild();

  const watchers = (config.watch ?? []).map((pattern) => {
    const dir = patternToDir(pattern);
    return fsWatch(dir, { recursive: true }, () => {
      runBuild().catch(() => {});
    });
  });

  return {
    stop: async () => {
      for (const w of watchers) w.close();
    },
    rebuild: runBuild,
  };
}

function patternToDir(pattern: string): string {
  const idx = pattern.search(/[*?[]/);
  const dirPart = idx === -1 ? pattern : pattern.slice(0, idx);
  return resolve(dirname(dirPart));
}
