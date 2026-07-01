/**
 * Tier 2 Batch T2-E — Emitter Logic Parity Tests
 *
 * These tests cover line-level branches in emit-css.ts found during the
 * 2026-04-25 full-audit pass (Mantine commit 63dafbbf).
 *
 * They complement the existing emit-css.test.ts (which tests the happy path
 * of each token type) by covering:
 *   - BUG-E-1: breakpoint tokens not emitted by emitTokenLines()
 *   - BUG-E-2: emitDarkTokenLines() silently drops fontFamily, fontWeight,
 *              lineHeight, breakpoint, heading dark overrides
 *   - Sort order: colors sorted family-then-shade alphabetically
 *   - Conditional emission: dark block only when theme.dark is non-empty
 *   - Edge cases: empty token sets, undefined heading props
 *   - semanticToVar: all four reference syntaxes
 */

import { createTheme } from '@soribashi/theme';
import { describe, expect, it } from 'vitest';
import { emitCss } from '../src/emit-css.ts';

// ---------------------------------------------------------------------------
// BUG-E-1: breakpoint tokens must be emitted in the light scope block
// ---------------------------------------------------------------------------

describe('emitCss — BUG-E-1: breakpoint emission', () => {
  it('emits --breakpoint-* vars when tokens.breakpoint is provided', () => {
    const theme = createTheme({
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
        breakpoint: { xs: '36em', sm: '48em', md: '62em', lg: '75em', xl: '88em' },
      },
    });

    const css = emitCss(theme);
    expect(css).toContain('--breakpoint-xs: 36em;');
    expect(css).toContain('--breakpoint-sm: 48em;');
    expect(css).toContain('--breakpoint-md: 62em;');
    expect(css).toContain('--breakpoint-lg: 75em;');
    expect(css).toContain('--breakpoint-xl: 88em;');
  });

  it('does NOT emit --breakpoint-* vars when tokens.breakpoint is absent', () => {
    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
    });
    // createTheme backfills default breakpoints; strip them so the emitter's
    // absent-breakpoint branch is still exercised.
    const { breakpoint: _backfilled, ...tokens } = theme.tokens;

    const css = emitCss({ ...theme, tokens });
    expect(css).not.toContain('--breakpoint-');
  });

  it('breakpoints appear inside the light-scope block (before closing brace)', () => {
    const theme = createTheme({
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
        breakpoint: { md: '62em' },
      },
    });

    const css = emitCss(theme);
    // The light-scope block is ':root { ... }'. The breakpoint must be inside it,
    // not floating at the top level.
    const rootStart = css.indexOf(':root {');
    const firstClose = css.indexOf('}', rootStart);
    const breakpointPos = css.indexOf('--breakpoint-md');
    expect(breakpointPos).toBeGreaterThan(rootStart);
    expect(breakpointPos).toBeLessThan(firstClose);
  });
});

// ---------------------------------------------------------------------------
// BUG-E-2: emitDarkTokenLines must handle all PartialThemeTokens fields
// ---------------------------------------------------------------------------

describe('emitCss — BUG-E-2: dark override completeness', () => {
  it('dark fontFamily overrides are emitted in the dark block', () => {
    const theme = createTheme({
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
        fontFamily: { sans: 'Inter' },
      },
      dark: {
        fontFamily: { sans: 'SystemFont' },
      },
    });

    const css = emitCss(theme);
    // Dark block should override the font-family
    expect(css).toContain('--font-family-sans: Inter;');
    // The dark block must also contain the override
    const darkStart = css.lastIndexOf('.dark {');
    expect(darkStart).toBeGreaterThan(-1);
    const darkBlock = css.slice(darkStart);
    expect(darkBlock).toContain('--font-family-sans: SystemFont;');
  });

  it('dark fontWeight overrides are emitted in the dark block', () => {
    const theme = createTheme({
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
        fontWeight: { bold: '700' },
      },
      dark: {
        fontWeight: { bold: '600' },
      },
    });

    const css = emitCss(theme);
    const darkStart = css.lastIndexOf('.dark {');
    expect(darkStart).toBeGreaterThan(-1);
    const darkBlock = css.slice(darkStart);
    expect(darkBlock).toContain('--font-weight-bold: 600;');
  });

  it('dark lineHeight overrides are emitted in the dark block', () => {
    const theme = createTheme({
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
        lineHeight: { md: '1.55' },
      },
      dark: {
        lineHeight: { md: '1.6' },
      },
    });

    const css = emitCss(theme);
    const darkStart = css.lastIndexOf('.dark {');
    expect(darkStart).toBeGreaterThan(-1);
    const darkBlock = css.slice(darkStart);
    expect(darkBlock).toContain('--line-height-md: 1.6;');
  });

  it('dark breakpoint overrides are emitted in the dark block', () => {
    const theme = createTheme({
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
        breakpoint: { md: '62em' },
      },
      dark: {
        breakpoint: { md: '60em' },
      },
    });

    const css = emitCss(theme);
    const darkStart = css.lastIndexOf('.dark {');
    expect(darkStart).toBeGreaterThan(-1);
    const darkBlock = css.slice(darkStart);
    expect(darkBlock).toContain('--breakpoint-md: 60em;');
  });

  it('dark heading.textWrap override is emitted in the dark block', () => {
    const theme = createTheme({
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
        heading: {
          textWrap: 'wrap',
          sizes: {
            h1: { fontSize: '2rem' },
            h2: { fontSize: '1.5rem' },
            h3: { fontSize: '1.25rem' },
            h4: { fontSize: '1.125rem' },
            h5: { fontSize: '1rem' },
            h6: { fontSize: '0.875rem' },
          },
        },
      },
      dark: {
        heading: {
          textWrap: 'balance',
          sizes: {
            h1: { fontSize: '1.875rem' },
            h2: { fontSize: '1.5rem' },
            h3: { fontSize: '1.25rem' },
            h4: { fontSize: '1.125rem' },
            h5: { fontSize: '1rem' },
            h6: { fontSize: '0.875rem' },
          },
        },
      },
    });

    const css = emitCss(theme);
    const darkStart = css.lastIndexOf('.dark {');
    expect(darkStart).toBeGreaterThan(-1);
    const darkBlock = css.slice(darkStart);
    expect(darkBlock).toContain('--heading-text-wrap: balance;');
  });

  it('dark heading fontSize overrides are emitted in the dark block', () => {
    const theme = createTheme({
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
        heading: {
          sizes: {
            h1: { fontSize: '2rem' },
            h2: { fontSize: '1.5rem' },
            h3: { fontSize: '1.25rem' },
            h4: { fontSize: '1.125rem' },
            h5: { fontSize: '1rem' },
            h6: { fontSize: '0.875rem' },
          },
        },
      },
      dark: {
        heading: {
          sizes: {
            h1: { fontSize: '1.875rem' },
            h2: { fontSize: '1.5rem' },
            h3: { fontSize: '1.25rem' },
            h4: { fontSize: '1.125rem' },
            h5: { fontSize: '1rem' },
            h6: { fontSize: '0.875rem' },
          },
        },
      },
    });

    const css = emitCss(theme);
    const darkStart = css.lastIndexOf('.dark {');
    expect(darkStart).toBeGreaterThan(-1);
    const darkBlock = css.slice(darkStart);
    expect(darkBlock).toContain('--heading-h1-font-size: 1.875rem;');
  });
});

// ---------------------------------------------------------------------------
// Sort order — family-then-shade alphabetical
// ---------------------------------------------------------------------------

describe('emitCss — sort order', () => {
  it('color families are sorted alphabetically in the output', () => {
    const theme = createTheme({
      tokens: {
        colors: {
          zebra: { '500': 'red' },
          alpha: { '500': 'blue' },
          mango: { '500': 'green' },
        },
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });

    const css = emitCss(theme);
    const alphaPos = css.indexOf('--color-alpha-500');
    const mangoPos = css.indexOf('--color-mango-500');
    const zebraPos = css.indexOf('--color-zebra-500');
    expect(alphaPos).toBeLessThan(mangoPos);
    expect(mangoPos).toBeLessThan(zebraPos);
  });

  it('shades within a color family are sorted alphabetically (50 < 500 < 900 in string order)', () => {
    const theme = createTheme({
      tokens: {
        colors: {
          primary: { '900': 'dark', '50': 'light', '500': 'mid' },
        },
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });

    const css = emitCss(theme);
    // String sort: '50' < '500' < '900'
    const pos50 = css.indexOf('--color-primary-50:');
    const pos500 = css.indexOf('--color-primary-500:');
    const pos900 = css.indexOf('--color-primary-900:');
    expect(pos50).toBeLessThan(pos500);
    expect(pos500).toBeLessThan(pos900);
  });

  it('token sections appear in a deterministic order across runs', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
        fontFamily: { sans: 'Inter' },
        fontWeight: { bold: '700' },
        lineHeight: { md: '1.55' },
        shadow: { md: '0 1px 2px black' },
        breakpoint: { md: '62em' },
      },
    });
    expect(emitCss(theme)).toBe(emitCss(theme));
  });
});

// ---------------------------------------------------------------------------
// Conditional emission — dark block only if theme.dark is non-empty
// ---------------------------------------------------------------------------

describe('emitCss — conditional dark block emission', () => {
  it('no dark block when theme.dark is empty', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });

    const css = emitCss(theme);
    expect(css).not.toContain('.dark {');
  });

  it('dark block emitted when theme.dark has at least one color', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
      dark: {
        colors: { primary: { '500': 'hsl(0 0% 80%)' } },
      },
    });

    const css = emitCss(theme);
    expect(css).toContain('.dark {');
  });

  it('dark block uses the configured darkMode.selector', () => {
    const theme = createTheme({
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
      },
      dark: {
        colors: { primary: { '500': 'hsl(0 0% 80%)' } },
      },
      darkMode: { selector: '[data-theme="dark"]' },
    });

    const css = emitCss(theme);
    expect(css).toContain('[data-theme="dark"] {');
    expect(css).not.toContain('.dark {');
  });
});

// ---------------------------------------------------------------------------
// Edge cases — empty sets, undefined heading props
// ---------------------------------------------------------------------------

describe('emitCss — edge cases', () => {
  it('handles completely empty tokens gracefully', () => {
    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
    });

    const css = emitCss(theme);
    expect(css).toContain(':root {');
    expect(css).toContain('}');
    // No undefined or "[object Object]" in output
    expect(css).not.toContain('undefined');
    expect(css).not.toContain('[object');
  });

  it('omits --heading-{n}-font-weight when size.fontWeight is undefined', () => {
    const theme = createTheme({
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
        heading: {
          sizes: {
            h1: { fontSize: '2rem' },
            h2: { fontSize: '1.5rem' },
            h3: { fontSize: '1.25rem' },
            h4: { fontSize: '1.125rem' },
            h5: { fontSize: '1rem' },
            h6: { fontSize: '0.875rem' },
          },
        },
      },
    });

    const css = emitCss(theme);
    // Only fontSize was specified; fontWeight and lineHeight should not appear
    expect(css).toContain('--heading-h1-font-size: 2rem;');
    expect(css).not.toContain('--heading-h1-font-weight');
    expect(css).not.toContain('--heading-h1-line-height');
  });

  it('omits --heading-text-wrap when textWrap is undefined', () => {
    const theme = createTheme({
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
        heading: {
          sizes: {
            h1: { fontSize: '2rem' },
            h2: { fontSize: '1.5rem' },
            h3: { fontSize: '1.25rem' },
            h4: { fontSize: '1.125rem' },
            h5: { fontSize: '1rem' },
            h6: { fontSize: '0.875rem' },
          },
        },
      },
    });

    const css = emitCss(theme);
    expect(css).not.toContain('--heading-text-wrap');
  });

  it('dark override with undefined value is not emitted', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)', '600': 'hsl(0 0% 40%)' } },
        radius: { md: '0.5rem' },
        spacing: {},
        fontSize: {},
      },
      dark: {
        colors: { primary: { '500': 'hsl(0 0% 80%)', '600': undefined } },
        radius: { md: undefined },
      },
    });

    const css = emitCss(theme);
    // '500' has a real value
    const darkStart = css.lastIndexOf('.dark {');
    const darkBlock = css.slice(darkStart);
    expect(darkBlock).toContain('--color-primary-500: hsl(0 0% 80%);');
    // '600' is undefined — must NOT appear
    expect(darkBlock).not.toContain('--color-primary-600');
    // radius.md is undefined in dark — must NOT appear
    expect(darkBlock).not.toContain('--radius-md');
  });
});

// ---------------------------------------------------------------------------
// semanticToVar — all four reference syntaxes
// ---------------------------------------------------------------------------

describe('emitCss — semanticToVar reference resolution', () => {
  it('resolves colors.{family}.{shade} → var(--color-{family}-{shade})', () => {
    const theme = createTheme({
      tokens: {
        colors: { neutral: { '900': '#111' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
      semanticTokens: {
        text: { primary: 'colors.neutral.900' },
      },
    });

    const css = emitCss(theme);
    expect(css).toContain('--text-primary: var(--color-neutral-900);');
  });

  it('resolves radius.{key} → var(--radius-{key})', () => {
    const theme = createTheme({
      tokens: {
        colors: {},
        radius: { md: '0.5rem' },
        spacing: {},
        fontSize: {},
      },
      semanticTokens: {
        border: { radius: 'radius.md' },
      },
    });

    const css = emitCss(theme);
    expect(css).toContain('--border-radius: var(--radius-md);');
  });

  it('resolves spacing.{key} → var(--spacing-{key})', () => {
    const theme = createTheme({
      tokens: {
        colors: {},
        radius: {},
        spacing: { md: '1rem' },
        fontSize: {},
      },
      semanticTokens: {
        surface: { gutter: 'spacing.md' },
      },
    });

    const css = emitCss(theme);
    expect(css).toContain('--surface-gutter: var(--spacing-md);');
  });

  it('resolves fontSize.{key} → var(--font-size-{key})', () => {
    const theme = createTheme({
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: { md: '1rem' },
      },
      semanticTokens: {
        text: { body: 'fontSize.md' },
      },
    });

    const css = emitCss(theme);
    expect(css).toContain('--text-body: var(--font-size-md);');
  });

  it('passes through unknown reference strings verbatim', () => {
    const theme = createTheme({
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
      },
      semanticTokens: {
        text: { accent: '#ff0000' },
      },
    });

    const css = emitCss(theme);
    // An unrecognized reference is emitted as-is (not wrapped in var())
    expect(css).toContain('--text-accent: #ff0000;');
  });
});
