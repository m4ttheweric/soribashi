import { spawn } from 'node:child_process';
import { existsSync, watch as fsWatch, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from './load-config.ts';

export interface WatchHandle {
  stop: () => Promise<void>;
  rebuild: () => Promise<void>;
}

export interface WatchOptions {
  silent?: boolean;
  /** Debounce window for filesystem change events. @default 75 */
  debounceMs?: number;
  /** Base directory watch patterns resolve against. @default process.cwd() */
  cwd?: string;
}

/**
 * Runs an initial build, then watches the configured paths for changes and
 * re-runs the build on each change (debounced; changes arriving mid-build
 * queue exactly one follow-up build).
 *
 * Every build runs in a fresh `bun` subprocess (src/build-once.ts) so the
 * config module graph — the config file plus everything it imports — is
 * re-evaluated from disk. Tradeoff: each rebuild pays subprocess startup
 * (tens of ms) instead of reusing the parent process. The in-process
 * alternative, cache-busted dynamic import (`import(url + '?t=' + n)`), does
 * not work under Bun — its module cache ignores the query string — and even
 * where it works it only re-evaluates the entry module, keeping the config's
 * own imports stale.
 *
 * Limitation: the watched paths come from the initial config load; edits to
 * the config's `watch` array take effect on the next `soribashi watch` start.
 */
export async function watch(configPath: string, options: WatchOptions = {}): Promise<WatchHandle> {
  const cwd = options.cwd ?? process.cwd();
  const debounceMs = options.debounceMs ?? 75;
  const log = options.silent ? () => {} : console.log;

  // Validates the config up front (throws on malformed configs) and supplies
  // the watch patterns. Builds never reuse this in-memory config.
  const initialConfig = await loadConfig(configPath);

  let inFlight: Promise<void> | null = null;

  const runBuild = async (): Promise<void> => {
    const start = Date.now();
    const result = await runBuildOnce(configPath, cwd);
    if (result.ok) {
      log(`[soribashi] built in ${Date.now() - start}ms (${result.written.length} files)`);
    } else {
      console.error('[soribashi] build failed (see output above)');
    }
  };

  const trackedRun = async (): Promise<void> => {
    const p = runBuild();
    inFlight = p;
    try {
      await p;
    } finally {
      if (inFlight === p) inFlight = null;
    }
  };

  const scheduler = createRebuildScheduler(trackedRun, debounceMs);

  await scheduler.runNow();

  const watchers = (initialConfig.watch ?? []).flatMap((pattern) => {
    const dir = patternToDir(pattern, cwd);
    if (!existsSync(dir)) {
      console.error(
        `[soribashi] watch pattern '${pattern}' resolves to missing directory ${dir}; skipping`,
      );
      return [];
    }
    return [fsWatch(dir, { recursive: true }, () => scheduler.schedule())];
  });

  return {
    stop: async () => {
      scheduler.cancel();
      for (const w of watchers) w.close();
      if (inFlight) await inFlight.catch(() => {});
    },
    rebuild: () => scheduler.runNow(),
  };
}

interface BuildOnceResult {
  ok: boolean;
  written: string[];
}

function runBuildOnce(configPath: string, cwd: string): Promise<BuildOnceResult> {
  return new Promise((resolvePromise) => {
    // Under Bun, execPath is the bun binary; under other runtimes (e.g. tests
    // on node) fall back to bun on PATH, which the workspace requires anyway.
    const executable = process.versions.bun ? process.execPath : 'bun';
    const runner = fileURLToPath(new URL('./build-once.ts', import.meta.url));
    const child = spawn(executable, [runner, configPath], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let settled = false;
    const settle = (result: BuildOnceResult) => {
      if (!settled) {
        settled = true;
        resolvePromise(result);
      }
    };

    let stdout = '';
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    // Build errors and warnings must stay visible even in silent mode.
    child.stderr.on('data', (chunk: Buffer) => {
      process.stderr.write(chunk);
    });

    child.on('error', (err) => {
      console.error(`[soribashi] failed to spawn build subprocess: ${err.message}`);
      settle({ ok: false, written: [] });
    });

    child.on('close', (code) => {
      if (code !== 0) {
        settle({ ok: false, written: [] });
        return;
      }
      try {
        const parsed = JSON.parse(stdout.trim().split('\n').pop() ?? '') as { written?: string[] };
        settle({ ok: true, written: parsed.written ?? [] });
      } catch {
        settle({ ok: true, written: [] });
      }
    });
  });
}

export interface RebuildScheduler {
  /** Debounced trigger for filesystem change events. */
  schedule: () => void;
  /** Runs immediately (queueing behind an in-flight run). */
  runNow: () => Promise<void>;
  /** Drops any pending debounced trigger. */
  cancel: () => void;
}

/**
 * Serializes build runs: triggers arriving while a run is in flight coalesce
 * into exactly one follow-up run, and `schedule()` debounces bursts of
 * filesystem events into a single trigger.
 */
export function createRebuildScheduler(
  run: () => Promise<void>,
  debounceMs: number,
): RebuildScheduler {
  let running = false;
  let pending = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const execute = async (): Promise<void> => {
    if (running) {
      pending = true;
      return;
    }
    running = true;
    try {
      await run();
    } finally {
      running = false;
    }
    if (pending) {
      pending = false;
      await execute();
    }
  };

  return {
    schedule: () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = undefined;
        void execute();
      }, debounceMs);
    },
    runNow: execute,
    cancel: () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    },
  };
}

/**
 * Resolves a watch pattern to the directory to install a watcher on: the
 * deepest complete path segment before the first glob character. A literal
 * directory is watched itself; a literal file path watches its parent (more
 * robust against atomic-rename saves than watching the file directly).
 */
export function patternToDir(pattern: string, cwd: string = process.cwd()): string {
  const globIdx = pattern.search(/[*?[{]/);
  if (globIdx === -1) {
    const literal = resolve(cwd, pattern);
    if (existsSync(literal) && statSync(literal).isDirectory()) return literal;
    return dirname(literal);
  }
  const prefix = pattern.slice(0, globIdx);
  const lastSlash = prefix.lastIndexOf('/');
  const dir = lastSlash === -1 ? '.' : prefix.slice(0, lastSlash) || '/';
  return resolve(cwd, dir);
}
