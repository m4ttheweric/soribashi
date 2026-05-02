import { describe, expect, it } from 'vitest';
import { createTheme } from '@soribashi/theme';
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
