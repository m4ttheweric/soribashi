import { describe, expect, it } from 'vitest';
import { emitCss } from '../../src/codegen/emit-css.ts';
import { createTheme } from '../../src/theme/index.ts';

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
    semanticTokens: {
      surface: {
        default: 'colors.neutral.0', // string form
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
      semanticTokens: { surface: { floating: { value: 'colors.neutral.0' } } },
    });
    const css = emitCss(theme);
    expect(css).toMatch(/--surface-floating:\s*var\(--color-neutral-0\)/);
    expect(css).not.toMatch(/--surface-floating-foreground/);
  });

  it('emits dark token overrides via light-dark() so surface foreground pair resolves correctly in dark mode', () => {
    const theme = createTheme({
      tokens: baseTokens as never,
      dark: {
        colors: { neutral: { '0': 'hsl(0 0% 5%)', '900': 'hsl(0 0% 95%)' } },
      },
      semanticTokens: {
        surface: { floating: { value: 'colors.neutral.900', foreground: 'colors.neutral.0' } },
      },
      darkMode: { selector: '.dark' },
    });
    const css = emitCss(theme);
    // The semantic pair is a var() reference, declared once.
    expect(css).toMatch(/--surface-floating:\s*var\(--color-neutral-900\)/);
    expect(css).toMatch(/--surface-floating-foreground:\s*var\(--color-neutral-0\)/);
    // The underlying color tokens carry both schemes via light-dark(), so the
    // semantic vars resolve correctly wherever they're consumed — no
    // restatement inside .dark is required.
    expect(css).toContain('--color-neutral-0: light-dark(hsl(0 0% 100%), hsl(0 0% 5%));');
    expect(css).toContain('--color-neutral-900: light-dark(hsl(0 0% 10%), hsl(0 0% 95%));');
  });
});
