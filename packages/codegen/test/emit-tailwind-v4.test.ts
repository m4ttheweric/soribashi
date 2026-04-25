import { describe, expect, it } from 'vitest';
import { createTheme } from '@soribashi/theme';
import { emitTailwindV4 } from '../src/emit-tailwind-v4.ts';

describe('emitTailwindV4', () => {
  it('wraps tokens in @theme block', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    });

    const css = emitTailwindV4(theme);
    expect(css).toContain('@theme {');
    expect(css).toContain('}');
  });

  it('emits color tokens directly (no alpha pattern)', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(217 91% 60%)' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    });

    const css = emitTailwindV4(theme);
    expect(css).toContain('--color-primary-500: hsl(217 91% 60%);');
  });

  it('emits radius, spacing, fontSize tokens', () => {
    const theme = createTheme({
      tokens: {
        colors: {},
        radius: { md: '0.5rem' },
        spacing: { lg: '1rem' },
        fontSize: { md: '1rem' },
      },
    });

    const css = emitTailwindV4(theme);
    expect(css).toContain('--radius-md: 0.5rem;');
    expect(css).toContain('--spacing-lg: 1rem;');
    expect(css).toContain('--font-size-md: 1rem;');
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

    expect(emitTailwindV4(theme)).toBe(emitTailwindV4(theme));
  });
});
