import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createTheme } from '@soribashi/theme';
import { build } from '../src/build.ts';

describe('build', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'soribashi-build-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('writes theme.css to output.css path', async () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    });

    const cssPath = join(tempDir, 'theme.css');
    await build({
      theme,
      output: { css: cssPath },
    });

    expect(existsSync(cssPath)).toBe(true);
    const content = readFileSync(cssPath, 'utf-8');
    expect(content).toContain('--color-primary-500');
  });

  it('writes Tailwind v3 config when mode=v3', async () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: { md: '0.5rem' },
        spacing: {},
        fontSize: {},
      },
    });

    const cssPath = join(tempDir, 'theme.css');
    const configPath = join(tempDir, 'tailwind.config.generated.js');
    await build({
      theme,
      output: {
        css: cssPath,
        tailwind: { mode: 'v3', configPath },
      },
    });

    expect(existsSync(configPath)).toBe(true);
    const content = readFileSync(configPath, 'utf-8');
    expect(content).toContain('module.exports');
    expect(content).toContain('hsl(var(--color-primary-500-hsl)');
  });

  it('writes Tailwind v4 css when mode=v4', async () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });

    const cssPath = join(tempDir, 'theme.css');
    const themeCssPath = join(tempDir, 'theme.tailwind.css');
    await build({
      theme,
      output: {
        css: cssPath,
        tailwind: { mode: 'v4', themeCssPath },
      },
    });

    expect(existsSync(themeCssPath)).toBe(true);
    const content = readFileSync(themeCssPath, 'utf-8');
    expect(content).toContain('@theme {');
  });

  it('writes both v3 and v4 outputs when mode=both', async () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });

    const cssPath = join(tempDir, 'theme.css');
    const configPath = join(tempDir, 'tailwind.config.generated.js');
    const themeCssPath = join(tempDir, 'theme.tailwind.css');
    await build({
      theme,
      output: {
        css: cssPath,
        tailwind: { mode: 'both', configPath, themeCssPath },
      },
    });

    expect(existsSync(configPath)).toBe(true);
    expect(existsSync(themeCssPath)).toBe(true);
  });

  it('creates parent directories as needed', async () => {
    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
    });
    const cssPath = join(tempDir, 'nested/dir/theme.css');
    await build({
      theme,
      output: { css: cssPath },
    });
    expect(existsSync(cssPath)).toBe(true);
  });

  it('returns a result describing what was written', async () => {
    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
    });
    const cssPath = join(tempDir, 'theme.css');
    const result = await build({
      theme,
      output: { css: cssPath },
    });

    expect(result.written).toContain(cssPath);
  });
});
