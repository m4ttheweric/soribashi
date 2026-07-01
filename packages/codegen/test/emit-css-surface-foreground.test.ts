import { createTheme } from '@soribashi/theme';
import { describe, expect, it } from 'vitest';
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

  it('emits --__hsl- companion for both value and foreground vars as var() references', () => {
    const css = emitCss(makeFloatingTheme(), { emitCompanionHsl: true });
    // Companions must be var() references so dark-mode overrides cascade automatically
    expect(css).toMatch(/--__hsl-surface-floating:\s*var\(--__hsl-color-neutral-900\)/);
    expect(css).toMatch(/--__hsl-surface-floating-foreground:\s*var\(--__hsl-color-neutral-0\)/);
    // Negative: must NOT bake literal HSL components onto the semantic companion lines
    expect(css).not.toMatch(/--__hsl-surface-floating:\s*\d/);
    expect(css).not.toMatch(/--__hsl-surface-floating-foreground:\s*\d/);
  });

  it('omits --__hsl- companion for surface vars when emitCompanionHsl=false', () => {
    const css = emitCss(makeFloatingTheme(), { emitCompanionHsl: false });
    expect(css).not.toMatch(/--__hsl-surface-floating/);
    expect(css).not.toMatch(/--__hsl-surface-floating-foreground/);
  });

  it('--__hsl-surface-* companions are emitted as var() references, not literals', () => {
    const theme = createTheme({
      tokens: baseTokens as never,
      semanticTokens: {
        surface: { floating: { value: 'colors.neutral.900', foreground: 'colors.neutral.0' } },
      },
    });
    const css = emitCss(theme, { emitCompanionHsl: true });

    // Companion should reference the token's companion, not bake the literal
    expect(css).toMatch(/--__hsl-surface-floating:\s*var\(--__hsl-color-neutral-900\)/);
    expect(css).toMatch(/--__hsl-surface-floating-foreground:\s*var\(--__hsl-color-neutral-0\)/);
    // Negative: should NOT contain literal HSL components on the semantic companion lines
    expect(css).not.toMatch(/--__hsl-surface-floating:\s*\d+\s+\d+%\s+\d+%/);
  });

  it('dark-mode overrides cascade through to --__hsl-surface-* via the var() reference', () => {
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
    const css = emitCss(theme, { emitCompanionHsl: true });

    // The .dark block overrides --__hsl-color-neutral-900 (from Wave 1 dual-emit);
    // --__hsl-surface-floating's var() reference picks it up automatically.
    expect(css).toMatch(/\.dark[^{]*\{[\s\S]*--__hsl-color-neutral-900:\s*0 0% 95%/);
    // The .dark block should NOT redundantly redefine the surface companion
    expect(css).not.toMatch(/\.dark[^{]*\{[\s\S]*--__hsl-surface-floating:/);
  });

  it('emits dark token overrides so surface foreground pair resolves correctly in dark mode', () => {
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
    // Light block has the semantic pair as var() references
    expect(css).toMatch(/--surface-floating:\s*var\(--color-neutral-900\)/);
    expect(css).toMatch(/--surface-floating-foreground:\s*var\(--color-neutral-0\)/);
    // Dark block overrides the underlying color tokens so the semantic vars resolve correctly via cascade
    expect(css).toMatch(/\.dark[^{]*\{[\s\S]*--color-neutral-0:\s*hsl\(0 0% 5%\)/);
    expect(css).toMatch(/\.dark[^{]*\{[\s\S]*--color-neutral-900:\s*hsl\(0 0% 95%\)/);
  });
});
