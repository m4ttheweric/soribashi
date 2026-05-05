import { describe, expect, it } from 'vitest';
import { createTheme } from '@soribashi/theme';
import { emitCss } from '../src/emit-css.ts';

const baseTokens = {
  colors: {
    neutral: {
      '0': 'hsl(0 0% 100%)',
      '900': 'hsl(0 0% 10%)',
    },
  },
  radius: {},
  spacing: {},
  fontSize: {},
};

function makeFloatingTheme() {
  return createTheme({
    tokens: baseTokens as never,
    semantic: {
      surface: {
        default: 'colors.neutral.0',                                              // string form
        floating: { value: 'colors.neutral.900', foreground: 'colors.neutral.0' }, // object form
      },
    },
  });
}

describe('emitCss surface foreground', () => {
  it('emits string-form surface as a single var', () => {
    const css = emitCss(makeFloatingTheme());
    expect(css).toMatch(/--surface-default:\s*var\(--color-neutral-0\)/);
  });

  it('emits object-form surface as paired vars (value + foreground)', () => {
    const css = emitCss(makeFloatingTheme());
    expect(css).toMatch(/--surface-floating:\s*var\(--color-neutral-900\)/);
    expect(css).toMatch(/--surface-floating-foreground:\s*var\(--color-neutral-0\)/);
  });

  it('emits object-form without foreground as value-only', () => {
    const theme = createTheme({
      tokens: baseTokens as never,
      semantic: { surface: { floating: { value: 'colors.neutral.0' } } },
    });
    const css = emitCss(theme);
    expect(css).toMatch(/--surface-floating:\s*var\(--color-neutral-0\)/);
    expect(css).not.toMatch(/--surface-floating-foreground/);
  });

  it('emits --__hsl- companion for both value and foreground vars', () => {
    const css = emitCss(makeFloatingTheme(), { emitCompanionHsl: true });
    // Companion vars (bare HSL components for Tailwind alpha utilities)
    expect(css).toMatch(/--__hsl-surface-floating:\s*0 0% 10%/);
    expect(css).toMatch(/--__hsl-surface-floating-foreground:\s*0 0% 100%/);
  });

  it('omits --__hsl- companion for surface vars when emitCompanionHsl=false', () => {
    const css = emitCss(makeFloatingTheme(), { emitCompanionHsl: false });
    expect(css).not.toMatch(/--__hsl-surface-floating/);
    expect(css).not.toMatch(/--__hsl-surface-floating-foreground/);
  });

  it('emits dark token overrides so surface foreground pair resolves correctly in dark mode', () => {
    const theme = createTheme({
      tokens: baseTokens as never,
      dark: {
        colors: { neutral: { '0': 'hsl(0 0% 5%)', '900': 'hsl(0 0% 95%)' } },
      },
      semantic: {
        surface: { floating: { value: 'colors.neutral.900', foreground: 'colors.neutral.0' } },
      },
      darkMode: { selector: '.dark' },
    });
    const css = emitCss(theme);
    // Light block has the semantic pair as var() references
    expect(css).toMatch(/--surface-floating:\s*var\(--color-neutral-900\)/);
    expect(css).toMatch(/--surface-floating-foreground:\s*var\(--color-neutral-0\)/);
    // Dark block overrides the underlying color tokens so the semantic vars resolve correctly via cascade
    expect(css).toMatch(/\.dark[^{]*\{[\s\S]*--color-neutral-0:\s*hsl\(0 0% 5%\)/);
    expect(css).toMatch(/\.dark[^{]*\{[\s\S]*--color-neutral-900:\s*hsl\(0 0% 95%\)/);
  });
});
