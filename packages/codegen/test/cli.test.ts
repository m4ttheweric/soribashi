import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runCli } from '../src/cli.ts';

describe('runCli flags', () => {
  let tempDir: string;
  let log: ReturnType<typeof vi.spyOn>;
  let error: ReturnType<typeof vi.spyOn>;
  let savedDebug: string | undefined;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'soribashi-cli-'));
    log = vi.spyOn(console, 'log').mockImplementation(() => {});
    error = vi.spyOn(console, 'error').mockImplementation(() => {});
    savedDebug = process.env.DEBUG;
    delete process.env.DEBUG;
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
    log.mockRestore();
    error.mockRestore();
    if (savedDebug !== undefined) process.env.DEBUG = savedDebug;
  });

  const logged = () => log.mock.calls.map((c) => c.join(' ')).join('\n');
  const errored = () => error.mock.calls.map((c) => c.join(' ')).join('\n');

  it('--help prints usage and exits 0', async () => {
    const code = await runCli(['--help'], { cwd: tempDir });
    expect(code).toBe(0);
    expect(logged()).toContain('Usage: soribashi');
    expect(logged()).toContain('--config');
  });

  it('-h after a command also prints usage and exits 0', async () => {
    const code = await runCli(['build', '-h'], { cwd: tempDir });
    expect(code).toBe(0);
    expect(logged()).toContain('Usage: soribashi');
  });

  it('--version prints the @soribashi/codegen package version and exits 0', async () => {
    const pkg = JSON.parse(
      readFileSync(new URL('../package.json', import.meta.url), 'utf-8'),
    ) as { version: string };

    const code = await runCli(['--version'], { cwd: tempDir });
    expect(code).toBe(0);
    expect(logged()).toContain(pkg.version);
  });

  it('unknown flags error instead of being silently ignored', async () => {
    const code = await runCli(['build', '--nope'], { cwd: tempDir });
    expect(code).toBe(1);
    expect(errored()).toContain('--nope');
  });

  it('unknown commands still error', async () => {
    const code = await runCli(['frobnicate'], { cwd: tempDir });
    expect(code).toBe(1);
    expect(errored()).toContain('frobnicate');
  });

  it('errors still reach stderr when silent is set', async () => {
    const code = await runCli(['build'], { cwd: tempDir, silent: true });
    expect(code).toBe(1);
    expect(errored()).toContain('No config found');
  });

  it('--verbose includes the stack trace for config errors', async () => {
    const configPath = join(tempDir, 'soribashi.config.ts');
    writeFileSync(configPath, `throw new Error('boom in config');`);

    const code = await runCli(['build', '--config', configPath, '--verbose'], { cwd: tempDir });
    expect(code).toBe(1);
    expect(errored()).toContain('boom in config');
    expect(errored()).toMatch(/\n\s+at /);
  });

  it('omits the stack trace without --verbose or DEBUG', async () => {
    const configPath = join(tempDir, 'soribashi.config.ts');
    writeFileSync(configPath, `throw new Error('boom in config');`);

    const code = await runCli(['build', '--config', configPath], { cwd: tempDir });
    expect(code).toBe(1);
    expect(errored()).toContain('boom in config');
    expect(errored()).not.toMatch(/\n\s+at /);
  });

  it('DEBUG env enables the stack trace like --verbose', async () => {
    const configPath = join(tempDir, 'soribashi.config.ts');
    writeFileSync(configPath, `throw new Error('boom in config');`);

    process.env.DEBUG = '1';
    const code = await runCli(['build', '--config', configPath], { cwd: tempDir });
    expect(code).toBe(1);
    expect(errored()).toMatch(/\n\s+at /);
  });
});
