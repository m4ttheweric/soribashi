import { describe, expect, it } from 'vitest';
import { createTheme } from '../src/create-theme.ts';

const baseTokens = {
  radius: { md: '0.5rem' },
  spacing: { md: '0.5rem' },
  fontSize: { md: '1rem' },
};

describe('SemanticSurfaceValue', () => {
  it('accepts string form (existing behavior)', () => {
    const theme = createTheme({
      tokens: { ...baseTokens, colors: { neutral: { '0': 'hsl(0 0% 100%)', '900': 'hsl(0 0% 10%)' } } },
      semanticTokens: { surface: { default: 'colors.neutral.0' } },
    });
    expect(theme.semanticTokens.surface.default).toBe('colors.neutral.0');
  });

  it('accepts object form with foreground', () => {
    const theme = createTheme({
      tokens: { ...baseTokens, colors: { neutral: { '0': 'hsl(0 0% 100%)', '900': 'hsl(0 0% 10%)' } } },
      semanticTokens: { surface: { floating: { value: 'colors.neutral.900', foreground: 'colors.neutral.0' } } },
    });
    expect(theme.semanticTokens.surface.floating).toEqual({ value: 'colors.neutral.900', foreground: 'colors.neutral.0' });
  });

  it('accepts object form without foreground (forward-compat opt-in)', () => {
    const theme = createTheme({
      tokens: { ...baseTokens, colors: { neutral: { '0': 'hsl(0 0% 100%)' } } },
      semanticTokens: { surface: { floating: { value: 'colors.neutral.0' } } },
    });
    expect(theme.semanticTokens.surface.floating).toEqual({ value: 'colors.neutral.0' });
  });

  it('resolves surface.floating through ResolvedTheme.semanticTokens', () => {
    const theme = createTheme({
      tokens: {
        ...baseTokens,
        colors: {
          neutral: {
            '0': 'hsl(0 0% 100%)',
            '900': 'hsl(0 0% 10%)',
          },
        },
      },
      semanticTokens: {
        surface: {
          default: 'colors.neutral.0',
          floating: { value: 'colors.neutral.900', foreground: 'colors.neutral.0' },
        },
      },
    });

    // Declared slots resolve as given; the remaining defaults merge in per-key.
    expect(theme.semanticTokens.surface).toMatchObject({
      default: 'colors.neutral.0',
      floating: { value: 'colors.neutral.900', foreground: 'colors.neutral.0' },
    });
  });
});
