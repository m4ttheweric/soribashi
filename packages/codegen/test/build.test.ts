import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createTheme } from '@soribashi/theme';
import { build } from '../src/build.ts';

// build() now validates semanticTokens refs against tokens. These minimal
// fixtures do not define the neutral family that createTheme's default
// semanticTokens reference, so give them explicitly empty semantic slots to
// keep each test focused on its own behavior.
const noSemanticTokens = { text: {}, surface: {}, border: {} };

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
      semanticTokens: noSemanticTokens,
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
      semanticTokens: noSemanticTokens,
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
    expect(content).toContain('hsl(var(--__hsl-color-primary-500)');
  });

  it('writes Tailwind v4 css when mode=v4', async () => {
    const theme = createTheme({
      semanticTokens: noSemanticTokens,
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
      semanticTokens: noSemanticTokens,
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
      semanticTokens: noSemanticTokens,
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
      semanticTokens: noSemanticTokens,
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
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
      semanticTokens: noSemanticTokens,
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: {}, spacing: {}, fontSize: {},
      },
    });
    const cssPath = join(tempDir, 'theme.css');
    await build({ theme, output: { css: cssPath } });
    const content = readFileSync(cssPath, 'utf-8');
    expect(content).toContain('--__hsl-color-primary-500: 0 0% 50%;');
  });

  it('emits --__hsl- companion vars when Tailwind mode=v3 (auto)', async () => {
    const theme = createTheme({
      semanticTokens: noSemanticTokens,
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: {}, spacing: {}, fontSize: {},
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
      semanticTokens: noSemanticTokens,
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: {}, spacing: {}, fontSize: {},
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
      semanticTokens: noSemanticTokens,
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: {}, spacing: {}, fontSize: {},
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
      semanticTokens: noSemanticTokens,
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: {}, spacing: {}, fontSize: {},
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
      semanticTokens: noSemanticTokens,
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: {}, spacing: {}, fontSize: {},
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
