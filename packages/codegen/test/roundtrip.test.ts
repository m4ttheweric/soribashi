import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
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

describe('token roundtrip integration', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'soribashi-roundtrip-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('a new color family added to the theme appears in both theme.css and tailwind config', async () => {
    const theme = createTheme({
      tokens: {
        colors: {
          neutral,
          primary: { '500': 'hsl(217 91% 60%)' },
          brand: {
            '50': 'hsl(160 100% 95%)',
            '500': 'hsl(160 84% 39%)',
            '900': 'hsl(160 84% 12%)',
          },
        },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    });

    const cssPath = join(tempDir, 'theme.css');
    const tailwindPath = join(tempDir, 'tailwind.config.generated.js');
    await build({
      theme,
      output: {
        css: cssPath,
        tailwind: { mode: 'v3', configPath: tailwindPath },
      },
    });

    const css = readFileSync(cssPath, 'utf-8');
    expect(css).toContain('--color-brand-50: hsl(160 100% 95%);');
    expect(css).toContain('--color-brand-500: hsl(160 84% 39%);');
    expect(css).toContain('--color-brand-900: hsl(160 84% 12%);');

    const tw = readFileSync(tailwindPath, 'utf-8');
    expect(tw).toContain('brand:');
    expect(tw).toContain("'500': 'hsl(var(--__hsl-color-brand-500) / <alpha-value>)'");
  });

  it('a removed color family disappears from outputs', async () => {
    const theme = createTheme({
      tokens: {
        colors: { neutral, primary: { '500': '#000' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });

    const cssPath = join(tempDir, 'theme.css');
    await build({
      theme,
      output: { css: cssPath },
    });

    const css = readFileSync(cssPath, 'utf-8');
    expect(css).not.toContain('--color-brand');
    expect(css).not.toContain('--color-secondary');
  });

  it('extending a base theme produces inherited + new tokens', async () => {
    const baseTheme = createTheme({
      tokens: {
        colors: { neutral, primary: { '500': '#aaa' } },
        radius: { md: '0.5rem' },
        spacing: {},
        fontSize: {},
      },
      name: 'base',
    });

    const tenantTheme = createTheme({
      extends: baseTheme,
      tokens: {
        colors: { brand: { '500': '#ff0' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
      name: 'tenant',
    });

    const cssPath = join(tempDir, 'theme.css');
    await build({
      theme: tenantTheme,
      output: { css: cssPath },
    });

    const css = readFileSync(cssPath, 'utf-8');
    expect(css).toContain('--color-primary-500: #aaa;');
    expect(css).toContain('--radius-md: 0.5rem;');
    expect(css).toContain('--color-brand-500: #ff0;');
  });

  it('custom scope and dark mode propagate through codegen end-to-end', async () => {
    const theme = createTheme({
      tokens: {
        colors: { neutral, primary: { '500': 'hsl(217 91% 60%)' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
      dark: {
        colors: { primary: { '500': 'hsl(217 91% 80%)' } },
      },
      scope: '.app-scope',
      darkMode: { selector: '.dark .app-scope' },
    });

    const cssPath = join(tempDir, 'theme.css');
    await build({
      theme,
      output: { css: cssPath },
    });

    const css = readFileSync(cssPath, 'utf-8');
    expect(css).toContain('.app-scope {');
    expect(css).toContain('.dark .app-scope {');
    expect(css).not.toContain(':root {');
  });

  it('semantic surface tokens reach the emitted CSS', async () => {
    const theme = createTheme({
      tokens: {
        colors: { neutral },
        radius: {},
        spacing: {},
        fontSize: {},
      },
      semanticTokens: {
        surface: {
          canvas: 'colors.neutral.50',
          default: 'colors.neutral.0',
          raised: 'colors.neutral.100',
        },
      },
    });

    const cssPath = join(tempDir, 'theme.css');
    await build({
      theme,
      output: { css: cssPath },
    });

    const css = readFileSync(cssPath, 'utf-8');
    expect(css).toContain('--surface-canvas: var(--color-neutral-50);');
    expect(css).toContain('--surface-default: var(--color-neutral-0);');
    expect(css).toContain('--surface-raised: var(--color-neutral-100);');
  });

  it('byte-identical output across runs (determinism)', async () => {
    const theme = createTheme({
      tokens: {
        colors: { neutral, primary: { '500': '#000' }, brand: { '500': '#fff' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    });

    const cssPath1 = join(tempDir, 'theme1.css');
    const cssPath2 = join(tempDir, 'theme2.css');
    await build({ theme, output: { css: cssPath1 } });
    await build({ theme, output: { css: cssPath2 } });

    const a = readFileSync(cssPath1, 'utf-8');
    const b = readFileSync(cssPath2, 'utf-8');
    expect(a).toBe(b);
  });
});
