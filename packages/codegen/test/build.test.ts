import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createTheme } from '@soribashi/theme';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { build } from '../src/build.ts';

// build() validates semanticTokens refs against tokens, and createTheme's
// default semanticTokens now merge per-key (empty slots no longer blank
// them). Give every fixture the neutral shades those defaults reference so
// each test stays focused on its own behavior.
const neutral = {
  '0': 'hsl(0 0% 100%)',
  '50': 'hsl(210 40% 98%)',
  '100': 'hsl(210 40% 96%)',
  '200': 'hsl(214 32% 91%)',
  '400': 'hsl(215 20% 65%)',
  '500': 'hsl(215 16% 47%)',
  '900': 'hsl(222 47% 11%)',
};

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
        colors: { neutral, primary: { '500': 'hsl(0 0% 50%)' } },
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
        colors: { neutral, primary: { '500': 'hsl(0 0% 50%)' } },
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
    expect(content).toContain('hsl(var(--__hsl-color-primary-500)');
  });

  it('writes Tailwind v4 css when mode=v4', async () => {
    const theme = createTheme({
      tokens: {
        colors: { neutral, primary: { '500': 'hsl(0 0% 50%)' } },
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
        colors: { neutral, primary: { '500': 'hsl(0 0% 50%)' } },
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
      tokens: { colors: { neutral }, radius: {}, spacing: {}, fontSize: {} },
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
      tokens: { colors: { neutral }, radius: {}, spacing: {}, fontSize: {} },
    });
    const cssPath = join(tempDir, 'theme.css');
    const result = await build({
      theme,
      output: { css: cssPath },
    });

    expect(result.written).toContain(cssPath);
  });

  it('emits --__hsl- companion vars when no Tailwind output is configured (auto)', async () => {
    const theme = createTheme({
      tokens: {
        colors: { neutral, primary: { '500': 'hsl(0 0% 50%)' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });
    const cssPath = join(tempDir, 'theme.css');
    await build({ theme, output: { css: cssPath } });
    const content = readFileSync(cssPath, 'utf-8');
    expect(content).toContain('--__hsl-color-primary-500: 0 0% 50%;');
  });

  it('emits --__hsl- companion vars when Tailwind mode=v3 (auto)', async () => {
    const theme = createTheme({
      tokens: {
        colors: { neutral, primary: { '500': 'hsl(0 0% 50%)' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });
    const cssPath = join(tempDir, 'theme.css');
    const configPath = join(tempDir, 'tailwind.config.generated.js');
    await build({
      theme,
      output: { css: cssPath, tailwind: { mode: 'v3', configPath } },
    });
    const content = readFileSync(cssPath, 'utf-8');
    expect(content).toContain('--__hsl-color-primary-500: 0 0% 50%;');
  });

  it('SKIPS --__hsl- companion vars when Tailwind mode=v4 (auto — v4 uses color-mix())', async () => {
    const theme = createTheme({
      tokens: {
        colors: { neutral, primary: { '500': 'hsl(0 0% 50%)' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });
    const cssPath = join(tempDir, 'theme.css');
    const themeCssPath = join(tempDir, 'theme.tailwind.css');
    await build({
      theme,
      output: { css: cssPath, tailwind: { mode: 'v4', themeCssPath } },
    });
    const content = readFileSync(cssPath, 'utf-8');
    expect(content).toContain('--color-primary-500: hsl(0 0% 50%);');
    expect(content).not.toContain('--__hsl-color-primary-500');
  });

  it('emits --__hsl- companion vars when Tailwind mode=both (auto)', async () => {
    const theme = createTheme({
      tokens: {
        colors: { neutral, primary: { '500': 'hsl(0 0% 50%)' } },
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
      output: { css: cssPath, tailwind: { mode: 'both', configPath, themeCssPath } },
    });
    const content = readFileSync(cssPath, 'utf-8');
    expect(content).toContain('--__hsl-color-primary-500: 0 0% 50%;');
  });

  it('honors explicit emit.emitCompanionHsl=false even with v3 Tailwind', async () => {
    const theme = createTheme({
      tokens: {
        colors: { neutral, primary: { '500': 'hsl(0 0% 50%)' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });
    const cssPath = join(tempDir, 'theme.css');
    const configPath = join(tempDir, 'tailwind.config.generated.js');
    await build({
      theme,
      output: { css: cssPath, tailwind: { mode: 'v3', configPath } },
      emit: { emitCompanionHsl: false },
    });
    const content = readFileSync(cssPath, 'utf-8');
    expect(content).not.toContain('--__hsl-color-primary-500');
  });

  it('honors explicit emit.emitCompanionHsl=true even with v4-only Tailwind', async () => {
    const theme = createTheme({
      tokens: {
        colors: { neutral, primary: { '500': 'hsl(0 0% 50%)' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });
    const cssPath = join(tempDir, 'theme.css');
    const themeCssPath = join(tempDir, 'theme.tailwind.css');
    await build({
      theme,
      output: { css: cssPath, tailwind: { mode: 'v4', themeCssPath } },
      emit: { emitCompanionHsl: true },
    });
    const content = readFileSync(cssPath, 'utf-8');
    expect(content).toContain('--__hsl-color-primary-500: 0 0% 50%;');
  });
});
