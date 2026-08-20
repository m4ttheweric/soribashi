import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { build } from '../../src/codegen/build.ts';
import { createTheme } from '../../src/theme/index.ts';

// build() validates semanticTokens refs against tokens, and createTheme's
// default semanticTokens now merge per-key (empty slots no longer blank
// them). Give every fixture the neutral shades those defaults reference so
// each test stays focused on its own behavior.
// '600' added alongside the others: createTheme's DEFAULT_TEXT.muted now
// references colors.neutral.600 (slice-2-layout task 8's AA ruling), so any
// fixture theme that doesn't override text.muted needs that shade too.
const neutral = {
  '0': 'hsl(0 0% 100%)',
  '50': 'hsl(210 40% 98%)',
  '100': 'hsl(210 40% 96%)',
  '200': 'hsl(214 32% 91%)',
  '400': 'hsl(215 20% 65%)',
  '500': 'hsl(215 16% 47%)',
  '600': 'hsl(215 18% 35%)',
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
});
