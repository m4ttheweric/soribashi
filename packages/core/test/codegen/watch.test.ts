import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { createRebuildScheduler, patternToDir, watch } from '../../src/codegen/watch.ts';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('patternToDir', () => {
  it('watches the glob base dir, not the whole cwd, for src/**/*.ts', () => {
    // Regression: dirname('src/') is '.', so the watcher recursively watched
    // the entire cwd (feedback-loop risk with build outputs).
    expect(patternToDir('src/**/*.ts', '/proj')).toBe(`${sep}proj${sep}src`);
  });

  it('watches the cwd for a bare **/*.ts pattern', () => {
    expect(patternToDir('**/*.ts', '/proj')).toBe(`${sep}proj`);
  });

  it('keeps only complete path segments before the first glob char', () => {
    expect(patternToDir('src/theme*.ts', '/proj')).toBe(`${sep}proj${sep}src`);
  });

  it('handles deep glob bases', () => {
    expect(patternToDir('src/a/b/**', '/proj')).toBe(`${sep}proj${sep}src${sep}a${sep}b`);
  });

  it('watches a literal directory itself', () => {
    const dir = mkdtempSync(join(tmpdir(), 'soribashi-watchdir-'));
    try {
      mkdirSync(join(dir, 'src'));
      expect(patternToDir('src', dir)).toBe(join(dir, 'src'));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('watches the parent directory of a literal file path', () => {
    const dir = mkdtempSync(join(tmpdir(), 'soribashi-watchdir-'));
    try {
      mkdirSync(join(dir, 'src'));
      writeFileSync(join(dir, 'src', 'tokens.ts'), 'export {};');
      expect(patternToDir('src/tokens.ts', dir)).toBe(join(dir, 'src'));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('createRebuildScheduler', () => {
  function deferred() {
    let resolve!: () => void;
    const promise = new Promise<void>((r) => {
      resolve = r;
    });
    return { promise, resolve };
  }

  it('coalesces triggers that arrive mid-build into exactly one follow-up run', async () => {
    // Regression: `if (isRunning) return;` dropped change events arriving
    // mid-build, so the last change never produced a build.
    const gates = [deferred(), deferred(), deferred()];
    let calls = 0;
    const scheduler = createRebuildScheduler(() => gates[calls++]!.promise, 10);

    void scheduler.runNow();
    expect(calls).toBe(1);
    void scheduler.runNow();
    void scheduler.runNow();
    expect(calls).toBe(1);

    gates[0]!.resolve();
    await vi.waitFor(() => expect(calls).toBe(2));

    gates[1]!.resolve();
    await sleep(30);
    expect(calls).toBe(2);
  });

  it('debounces bursts of change events into a single build', async () => {
    let calls = 0;
    const scheduler = createRebuildScheduler(async () => {
      calls++;
    }, 20);

    scheduler.schedule();
    scheduler.schedule();
    scheduler.schedule();
    expect(calls).toBe(0);

    await vi.waitFor(() => expect(calls).toBe(1));
    await sleep(50);
    expect(calls).toBe(1);
  });

  it('a schedule() firing mid-build re-runs once after completion', async () => {
    const gates = [deferred(), deferred()];
    let calls = 0;
    const scheduler = createRebuildScheduler(() => gates[calls++]!.promise, 5);

    void scheduler.runNow();
    scheduler.schedule();
    await sleep(20);
    expect(calls).toBe(1);

    gates[0]!.resolve();
    await vi.waitFor(() => expect(calls).toBe(2));
    gates[1]!.resolve();
  });

  it('cancel() drops a scheduled run', async () => {
    let calls = 0;
    const scheduler = createRebuildScheduler(async () => {
      calls++;
    }, 10);

    scheduler.schedule();
    scheduler.cancel();
    await sleep(40);
    expect(calls).toBe(0);
  });
});

function configSource(color: string, outPath: string): string {
  return `export default {
  theme: {
    tokens: { colors: { primary: { '500': '${color}' } }, radius: {}, spacing: {}, fontSize: {} },
    dark: {},
    vocabulary: {},
    semanticTokens: { text: {}, surface: {}, border: {} },
    scope: ':root',
    darkMode: { selector: '.dark' },
    name: 'watch-test',
    intentResolver: () => ({ background: '', color: '', border: '' }),
    components: {},
  },
  output: { css: ${JSON.stringify(outPath)} },
  watch: ['src/**/*.ts'],
};
`;
}

describe('watch — config reload integration', () => {
  // SORI-3: this test spawns a fresh `bun` subprocess per rebuild (no fs
  // events involved at all — `handle.rebuild()` is called directly), so a
  // timeout here can only be subprocess-spawn/build latency. The diagnosis
  // reproduced this timing out at the old 20s budget "under load" even though
  // the underlying watch/rebuild logic was correct — the budget was sized for
  // an unloaded machine. Scaling it up (20s -> 40s) is a pure test-timing
  // change; it doesn't relax what's being asserted.
  it('rebuild() picks up config edits (fresh subprocess per build)', {
    timeout: 40000,
  }, async () => {
    const dir = mkdtempSync(join(tmpdir(), 'soribashi-watch-'));
    try {
      mkdirSync(join(dir, 'src'));
      const configPath = join(dir, 'src', 'soribashi.config.ts');
      const outPath = join(dir, 'out', 'theme.css');
      writeFileSync(configPath, configSource('hsl(0 0% 10%)', outPath));

      const handle = await watch(configPath, { silent: true, cwd: dir, debounceMs: 20 });
      try {
        expect(readFileSync(outPath, 'utf-8')).toContain('hsl(0 0% 10%)');

        // Regression: the old watch() rebuilt the same in-memory ResolvedTheme
        // forever, so config edits never changed the output.
        writeFileSync(configPath, configSource('hsl(120 50% 50%)', outPath));
        await handle.rebuild();
        expect(readFileSync(outPath, 'utf-8')).toContain('hsl(120 50% 50%)');
      } finally {
        await handle.stop();
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // SORI-3: macOS FSEvents is documented to occasionally drop a change event,
  // and every rebuild pays fresh-`bun`-subprocess spawn latency that isn't
  // bounded under load (see watch.ts's module doc). The diagnosis couldn't
  // get a deterministic repro (21/21 passes in isolation), which points at a
  // low-frequency timing flake rather than a hard regression — but the
  // re-write-inside-`waitFor` retry below is already a poll backstop against
  // a dropped FSEvents delivery; it just didn't have enough budget to survive
  // a genuinely loaded machine. Scaling the budget (10s -> 20s waitFor, 250ms
  // -> 500ms interval so a slow build round-trip isn't miscounted as several
  // failed polls, 20s -> 40s outer test timeout) gives that same backstop
  // more room without changing what's being asserted or touching watch.ts's
  // production watch/rebuild path.
  it('a file change event triggers a rebuild with the fresh config', {
    timeout: 40000,
  }, async () => {
    const dir = mkdtempSync(join(tmpdir(), 'soribashi-watch-'));
    try {
      mkdirSync(join(dir, 'src'));
      const configPath = join(dir, 'src', 'soribashi.config.ts');
      const outPath = join(dir, 'out', 'theme.css');
      writeFileSync(configPath, configSource('hsl(0 0% 10%)', outPath));

      const handle = await watch(configPath, { silent: true, cwd: dir, debounceMs: 20 });
      try {
        expect(readFileSync(outPath, 'utf-8')).toContain('hsl(0 0% 10%)');

        writeFileSync(configPath, configSource('hsl(240 80% 60%)', outPath));
        await vi.waitFor(
          () => {
            // macOS FSEvents can drop a change landing right after the watcher
            // registers, and a single dropped event used to hang this waitFor
            // to its timeout. Re-touching the file keeps the test about "a
            // change event triggers a rebuild", not "the first event is never
            // dropped" — the OS guarantee the watcher never had. This is the
            // poll backstop: as long as the budget below gives it enough
            // attempts, it will eventually force a fresh fs event even if
            // every prior one was dropped.
            if (!readFileSync(outPath, 'utf-8').includes('hsl(240 80% 60%)')) {
              writeFileSync(configPath, configSource('hsl(240 80% 60%)', outPath));
            }
            expect(readFileSync(outPath, 'utf-8')).toContain('hsl(240 80% 60%)');
          },
          { timeout: 20000, interval: 500 },
        );
      } finally {
        await handle.stop();
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('throws at startup for a malformed config', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'soribashi-watch-'));
    try {
      const configPath = join(dir, 'soribashi.config.ts');
      writeFileSync(configPath, 'export default { output: {} };');

      await expect(watch(configPath, { silent: true, cwd: dir })).rejects.toThrow(/theme/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
