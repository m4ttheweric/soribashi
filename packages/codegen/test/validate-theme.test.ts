import { describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createTheme } from '@soribashi/theme';
import type { ThemeDefinition } from '@soribashi/theme';
import { validateTheme } from '../src/validate-theme.ts';
import { build } from '../src/build.ts';

// createTheme's default semanticTokens merge per-key under any overrides, so
// the fixture palette must cover every neutral shade those defaults reference.
const neutral = {
  '0': 'hsl(0 0% 100%)',
  '50': 'hsl(210 40% 98%)',
  '100': 'hsl(210 40% 96%)',
  '200': 'hsl(214 32% 91%)',
  '400': 'hsl(215 20% 65%)',
  '500': 'hsl(215 16% 47%)',
  '900': 'hsl(222 47% 11%)',
};

function themeWith(overrides: Partial<ThemeDefinition>) {
  return createTheme({
    ...overrides,
    tokens: {
      colors: { neutral },
      radius: { md: '0.5rem' },
      spacing: { md: '1rem' },
      fontSize: { md: '1rem' },
      ...overrides.tokens,
    },
  });
}

describe('validateTheme — semantic token references', () => {
  it('accepts a theme whose refs all resolve (green path)', () => {
    const theme = themeWith({
      semanticTokens: {
        text: { default: 'colors.neutral.900', body: 'fontSize.md' },
        surface: {
          default: 'colors.neutral.0',
          floating: { value: 'colors.neutral.900', foreground: 'colors.neutral.0' },
          gutter: 'spacing.md',
        },
        border: { default: 'colors.neutral.500', rounded: 'radius.md' },
        accent: { primary: 'colors.neutral.500' },
      },
    });

    expect(() => validateTheme(theme)).not.toThrow();
  });

  it('allows literal CSS values that do not look like token references', () => {
    const theme = themeWith({
      semanticTokens: {
        text: { accent: '#ff0000' },
        surface: { scrim: 'rgb(0 0 0 / 0.5)' },
        border: { none: 'transparent' },
      },
    });

    expect(() => validateTheme(theme)).not.toThrow();
  });

  it('rejects an unknown token namespace, naming the ref and slot', () => {
    const theme = themeWith({
      semanticTokens: {
        text: { default: 'color.neutral.900' },
      },
    });

    expect(() => validateTheme(theme)).toThrow(/semanticTokens\.text\.default/);
    expect(() => validateTheme(theme)).toThrow(/color\.neutral\.900/);
    expect(() => validateTheme(theme)).toThrow(/not a recognized token namespace/);
  });

  it('rejects a colors ref with the wrong arity', () => {
    const theme = themeWith({
      semanticTokens: {
        text: { default: 'colors.neutral' },
      },
    });

    expect(() => validateTheme(theme)).toThrow(/semanticTokens\.text\.default/);
    expect(() => validateTheme(theme)).toThrow(/colors\.<family>\.<shade>/);
  });

  it('rejects a ref to a nonexistent color family', () => {
    const theme = themeWith({
      semanticTokens: {
        surface: { default: 'colors.brand.500' },
      },
    });

    expect(() => validateTheme(theme)).toThrow(/semanticTokens\.surface\.default/);
    expect(() => validateTheme(theme)).toThrow(/no color family 'brand'/);
  });

  it('rejects a ref to a nonexistent shade, naming the exact ref and slot', () => {
    const theme = themeWith({
      semanticTokens: {
        text: { default: 'colors.neutral.950' },
      },
    });

    expect(() => validateTheme(theme)).toThrow(
      /semanticTokens\.text\.default references colors\.neutral\.950 but scale 'neutral' has no shade '950'/,
    );
  });

  it('rejects a radius/spacing/fontSize ref with a missing key', () => {
    const theme = themeWith({
      semanticTokens: {
        border: { rounded: 'radius.xl' },
      },
    });

    expect(() => validateTheme(theme)).toThrow(/semanticTokens\.border\.rounded/);
    expect(() => validateTheme(theme)).toThrow(/tokens\.radius has no key 'xl'/);
  });

  it('validates the object-form surface foreground slot', () => {
    const theme = themeWith({
      semanticTokens: {
        surface: { floating: { value: 'colors.neutral.900', foreground: 'colors.neutral.999' } },
      },
    });

    expect(() => validateTheme(theme)).toThrow(/semanticTokens\.surface\.floating\.foreground/);
    expect(() => validateTheme(theme)).toThrow(/no shade '999'/);
  });

  it('validates accent slot refs', () => {
    const theme = themeWith({
      semanticTokens: {
        accent: { primary: 'colors.missing.500' },
      },
    });

    expect(() => validateTheme(theme)).toThrow(/semanticTokens\.accent\.primary/);
  });

  it('aggregates multiple errors into one actionable message', () => {
    const theme = themeWith({
      semanticTokens: {
        text: { default: 'colors.neutral.999', muted: 'bogus.thing' },
      },
    });

    let message = '';
    try {
      validateTheme(theme);
    } catch (err) {
      message = err instanceof Error ? err.message : String(err);
    }
    expect(message).toContain("no shade '999'");
    expect(message).toContain('bogus.thing');
  });
});

describe('validateTheme — custom-property-unsafe token names', () => {
  it('rejects a color family name with spaces', () => {
    const theme = themeWith({
      tokens: {
        colors: { 'blue gray': { '500': 'hsl(215 16% 47%)' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });

    expect(() => validateTheme(theme)).toThrow(/'blue gray'/);
    expect(() => validateTheme(theme)).toThrow(/CSS custom property/);
  });

  it('rejects a shade name with unsafe characters', () => {
    const theme = themeWith({
      tokens: {
        colors: { neutral: { '5 0': '#eee' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });

    expect(() => validateTheme(theme)).toThrow(/'5 0'/);
  });

  it('rejects unsafe names in dark color overrides', () => {
    const theme = themeWith({
      dark: { colors: { 'dark family': { '500': '#111' } } },
    });

    expect(() => validateTheme(theme)).toThrow(/'dark family'/);
  });

  it('accepts hyphenated and underscored names', () => {
    const theme = themeWith({
      tokens: {
        colors: { neutral, 'blue-gray': { '500': 'hsl(215 16% 47%)' }, brand_alt: { '500': '#123' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });

    expect(() => validateTheme(theme)).not.toThrow();
  });
});

describe('build — fails on invalid semantic token refs', () => {
  it('rejects with the validation error instead of writing broken CSS', async () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'soribashi-validate-'));
    try {
      const theme = themeWith({
        semanticTokens: {
          text: { default: 'colors.neutral.999' },
        },
      });

      await expect(
        build({ theme, output: { css: join(tempDir, 'theme.css') } }),
      ).rejects.toThrow(/no shade '999'/);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
