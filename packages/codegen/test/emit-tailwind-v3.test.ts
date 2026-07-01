import { createTheme } from '@soribashi/theme';
import { describe, expect, it } from 'vitest';
import { emitTailwindV3 } from '../src/emit-tailwind-v3.ts';

describe('emitTailwindV3', () => {
  it('emits a CommonJS module exporting a theme config', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    });

    const config = emitTailwindV3(theme);

    expect(config).toContain('module.exports');
    expect(config).toContain('theme: {');
  });

  it('maps color families to var() references with alpha-value pattern', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(217 91% 60%)' }, brand: { '500': 'hsl(0 100% 50%)' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    });

    const config = emitTailwindV3(theme);
    expect(config).toContain('primary: {');
    expect(config).toContain("'500': 'hsl(var(--__hsl-color-primary-500) / <alpha-value>)'");
    expect(config).toContain('brand: {');
    expect(config).toContain("'500': 'hsl(var(--__hsl-color-brand-500) / <alpha-value>)'");
  });

  it('maps radius and spacing to var references (without alpha pattern)', () => {
    const theme = createTheme({
      tokens: {
        colors: {},
        radius: { sm: '0.25rem', md: '0.5rem' },
        spacing: { lg: '1rem' },
        fontSize: { md: '1rem' },
      },
    });

    const config = emitTailwindV3(theme);
    expect(config).toContain('borderRadius: {');
    expect(config).toContain("sm: 'var(--radius-sm)'");
    expect(config).toContain("md: 'var(--radius-md)'");
    expect(config).toContain('spacing: {');
    expect(config).toContain("lg: 'var(--spacing-lg)'");
  });

  it('maps fontSize to var references', () => {
    const theme = createTheme({
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: { sm: '0.875rem', md: '1rem' },
      },
    });

    const config = emitTailwindV3(theme);
    expect(config).toContain('fontSize: {');
    expect(config).toContain("sm: 'var(--font-size-sm)'");
    expect(config).toContain("md: 'var(--font-size-md)'");
  });

  it('output is deterministic', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    });

    expect(emitTailwindV3(theme)).toBe(emitTailwindV3(theme));
  });

  it('begins with auto-generated header', () => {
    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
    });
    const config = emitTailwindV3(theme);
    expect(config.split('\n')[0]).toMatch(/auto-generated/i);
  });
});

describe('emitTailwindV3 zIndex', () => {
  it('maps zIndex tokens to var references', () => {
    const theme = createTheme({
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
        zIndex: { app: 100, modal: '200' },
      },
    });

    const config = emitTailwindV3(theme);
    expect(config).toContain('zIndex: {');
    expect(config).toContain("app: 'var(--z-index-app)'");
    expect(config).toContain("modal: 'var(--z-index-modal)'");
  });
});

// Evaluates the generated CommonJS config; throws on syntax errors, so these
// tests prove the output is parseable, not just string-matched.
function evalConfig(source: string): {
  theme: { colors?: Record<string, Record<string, string>> };
} {
  const module = { exports: {} as { theme: { colors?: Record<string, Record<string, string>> } } };
  new Function('module', 'exports', source)(module, module.exports);
  return module.exports;
}

describe('emitTailwindV3 non-HSL tokens', () => {
  it('references the canonical var (not a dangling --__hsl companion) for hex/rgb/named tokens', () => {
    const theme = createTheme({
      tokens: {
        colors: {
          brand: { primary: '#ff0000', secondary: 'rgb(0 255 0)', tertiary: 'rebeccapurple' },
        },
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });

    const config = emitTailwindV3(theme);
    expect(config).not.toContain('--__hsl-color-brand');

    const parsed = evalConfig(config);
    expect(parsed.theme.colors?.brand?.primary).toBe('var(--color-brand-primary)');
    expect(parsed.theme.colors?.brand?.secondary).toBe('var(--color-brand-secondary)');
    expect(parsed.theme.colors?.brand?.tertiary).toBe('var(--color-brand-tertiary)');
  });

  it('notes the alpha limitation in a generated comment for non-HSL entries', () => {
    const theme = createTheme({
      tokens: {
        colors: { brand: { primary: '#ff0000' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });

    const config = emitTailwindV3(theme);
    const line = config.split('\n').find((l) => l.includes('var(--color-brand-primary)'));
    expect(line).toMatch(/\/\/.*alpha/i);
  });

  it('keeps the <alpha-value> pattern for HSL tokens alongside non-HSL ones', () => {
    const theme = createTheme({
      tokens: {
        colors: { brand: { solid: 'hsl(217 91% 60%)', hex: '#123456' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });

    const parsed = evalConfig(emitTailwindV3(theme));
    expect(parsed.theme.colors?.brand?.solid).toBe(
      'hsl(var(--__hsl-color-brand-solid) / <alpha-value>)',
    );
    expect(parsed.theme.colors?.brand?.hex).toBe('var(--color-brand-hex)');
  });

  it('uses the canonical var for every shade when emitCompanionHsl is false', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });

    const parsed = evalConfig(emitTailwindV3(theme, { emitCompanionHsl: false }));
    expect(parsed.theme.colors?.primary?.['500']).toBe('var(--color-primary-500)');
  });

  it('quotes hyphenated family names so the config parses', () => {
    const theme = createTheme({
      tokens: {
        colors: { 'blue-gray': { '500': 'hsl(215 16% 47%)' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });

    const config = emitTailwindV3(theme);
    const parsed = evalConfig(config);
    expect(parsed.theme.colors?.['blue-gray']?.['500']).toBe(
      'hsl(var(--__hsl-color-blue-gray-500) / <alpha-value>)',
    );
  });
});
