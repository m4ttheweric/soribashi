import { createTheme } from '@soribashi/theme';
import { describe, expect, it } from 'vitest';
import { emitCss } from '../src/emit-css.ts';

const baseTokens = {
  colors: {
    neutral: {
      '200': 'hsl(0 0% 90%)',
      '400': 'hsl(0 0% 60%)',
      '900': 'hsl(0 0% 10%)',
    },
  },
  radius: {},
  spacing: {},
  fontSize: {},
};

describe('emitCss surface dark override (fix round 2)', () => {
  it('emits the object form with a `dark` reference as ONE light-dark() custom property', () => {
    const theme = createTheme({
      tokens: baseTokens as never,
      semanticTokens: {
        surface: {
          placeholder: { value: 'colors.neutral.200', dark: 'colors.neutral.400' },
        },
      },
    });
    const css = emitCss(theme);
    expect(css).toContain(
      '--surface-placeholder: light-dark(var(--color-neutral-200), var(--color-neutral-400));',
    );
    // Exactly one declaration for this slot: no restated .dark block, same
    // rationale as tokens.colors' own light-dark() pairing (emit-css.ts's
    // pairValue doc comment).
    const occurrences = css.split('--surface-placeholder:').length - 1;
    expect(occurrences).toBe(1);
  });

  it('combines `dark` and `foreground` on the same slot independently', () => {
    const theme = createTheme({
      tokens: baseTokens as never,
      semanticTokens: {
        surface: {
          placeholder: {
            value: 'colors.neutral.200',
            dark: 'colors.neutral.400',
            foreground: 'colors.neutral.900',
          },
        },
      },
    });
    const css = emitCss(theme);
    expect(css).toContain(
      '--surface-placeholder: light-dark(var(--color-neutral-200), var(--color-neutral-400));',
    );
    // foreground has no per-scheme override of its own in this row; it stays
    // a single bare var() reference exactly as the existing (pre-round-2)
    // object form already emits it.
    expect(css).toContain('--surface-placeholder-foreground: var(--color-neutral-900);');
    expect(css).not.toContain('light-dark(var(--color-neutral-900)');
  });

  it('the plain string form is unaffected: still a single bare var(), never light-dark()', () => {
    const theme = createTheme({
      tokens: baseTokens as never,
      semanticTokens: {
        surface: { canvas: 'colors.neutral.200' },
      },
    });
    const css = emitCss(theme);
    expect(css).toContain('--surface-canvas: var(--color-neutral-200);');
    expect(css).not.toMatch(/--surface-canvas:\s*light-dark/);
  });

  it('the existing `{ value, foreground }` object form (no `dark`) is unaffected', () => {
    const theme = createTheme({
      tokens: baseTokens as never,
      semanticTokens: {
        surface: {
          floating: { value: 'colors.neutral.900', foreground: 'colors.neutral.200' },
        },
      },
    });
    const css = emitCss(theme);
    expect(css).toContain('--surface-floating: var(--color-neutral-900);');
    expect(css).toContain('--surface-floating-foreground: var(--color-neutral-200);');
    expect(css).not.toMatch(/--surface-floating:\s*light-dark/);
  });

  it('nests correctly when the underlying colour token ALSO carries its own dark override', () => {
    // The two dark mechanisms compose: the semantic slot's own light-dark()
    // (light index vs dark index) wraps around each ramp reference, and each
    // reference is itself a var() pointing at a token that may carry its own
    // light-dark() pairing (tokens.colors' dark override). Both nest without
    // conflict since each light-dark() call resolves independently against
    // the color-scheme of whatever element consumes the custom property.
    const theme = createTheme({
      tokens: baseTokens as never,
      dark: {
        colors: {
          neutral: { '200': 'hsl(0 0% 20%)', '400': 'hsl(0 0% 40%)' },
        },
      },
      semanticTokens: {
        surface: {
          placeholder: { value: 'colors.neutral.200', dark: 'colors.neutral.400' },
        },
      },
    });
    const css = emitCss(theme);
    expect(css).toContain(
      '--surface-placeholder: light-dark(var(--color-neutral-200), var(--color-neutral-400));',
    );
    expect(css).toContain('--color-neutral-200: light-dark(hsl(0 0% 90%), hsl(0 0% 20%));');
    expect(css).toContain('--color-neutral-400: light-dark(hsl(0 0% 60%), hsl(0 0% 40%));');
  });
});
