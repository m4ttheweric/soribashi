import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadConfig } from '../src/load-config.ts';

describe('loadConfig', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'soribashi-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('throws a clear error if the config has no default export', async () => {
    const configPath = join(tempDir, 'soribashi.config.ts');
    writeFileSync(configPath, `export const x = 1;`);

    await expect(loadConfig(configPath)).rejects.toThrow(/default export/);
  });

  it('throws a clear error if the config has no theme field', async () => {
    const configPath = join(tempDir, 'soribashi.config.ts');
    writeFileSync(configPath, `export default { output: { css: './out.css' } };`);

    await expect(loadConfig(configPath)).rejects.toThrow(/theme/);
  });

  it('throws when output.css is missing', async () => {
    const configPath = join(tempDir, 'soribashi.config.ts');
    writeFileSync(
      configPath,
      `export default { theme: { tokens: {} }, output: {} };`,
    );

    await expect(loadConfig(configPath)).rejects.toThrow(/output\.css/);
  });
});

describe('loadConfig with emit options', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'soribashi-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('accepts emit.removeDefaultVariables in soribashi.config', async () => {
    const configPath = join(tempDir, 'soribashi.config.ts');
    writeFileSync(
      configPath,
      `export default {
        theme: { tokens: {}, scope: ':root', semanticTokens: {}, dark: {} },
        output: { css: './out.css' },
        emit: { removeDefaultVariables: true },
      };`,
    );

    const cfg = await loadConfig(configPath);
    expect(cfg.emit?.removeDefaultVariables).toBe(true);
  });

  it('accepts emit.cssVariablesResolver as a function', async () => {
    const configPath = join(tempDir, 'soribashi.config.ts');
    writeFileSync(
      configPath,
      `const resolver = () => ({ root: { '--x': 'y' } });
      export default {
        theme: { tokens: {}, scope: ':root', semanticTokens: {}, dark: {} },
        output: { css: './out.css' },
        emit: { cssVariablesResolver: resolver },
      };`,
    );

    const cfg = await loadConfig(configPath);
    expect(typeof cfg.emit?.cssVariablesResolver).toBe('function');
  });
});
