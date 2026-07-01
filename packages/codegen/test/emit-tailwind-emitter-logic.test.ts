/**
 * Tier 2 Batch T2-E — Tailwind Emitter Logic Parity Tests
 *
 * These tests cover line-level branches in emit-tailwind-v3.ts and
 * emit-tailwind-v4.ts found during the 2026-04-25 full-audit pass
 * (Mantine commit 63dafbbf).
 *
 * They complement the existing tests by covering:
 *
 * emit-tailwind-v3.ts:
 *   - Color alpha-value pattern (colors use hsl(var() / <alpha-value>))
 *   - Empty color set omits colors block
 *   - Breakpoints use `screens` key (Tailwind v3 convention)
 *   - quoteIfNeeded: identifiers unquoted, numeric/dash-starting keys quoted
 *   - emitVarMap skips empty source objects
 *   - Optional tokens (fontFamily, fontWeight, lineHeight, shadow, breakpoint)
 *
 * emit-tailwind-v4.ts:
 *   - Uses Tailwind v4 namespace conventions:
 *     - fontSize  → --text-{key}
 *     - fontFamily → --font-{key}
 *     - lineHeight → --leading-{key}
 *     - shadow    → --shadow-{key}
 *     - breakpoint → --breakpoint-{key}
 *   - No alpha-value pattern (v4 handles opacity natively)
 *   - Output wrapped in @theme block (not module.exports)
 *   - Sort order consistent across both emitters
 */

import { describe, expect, it } from 'vitest';
import { createTheme } from '@soribashi/theme';
import { emitTailwindV3 } from '../src/emit-tailwind-v3.ts';
import { emitTailwindV4 } from '../src/emit-tailwind-v4.ts';

// ---------------------------------------------------------------------------
// emit-tailwind-v3.ts
// ---------------------------------------------------------------------------

describe('emitTailwindV3 — emitter logic parity', () => {
  describe('color block structure', () => {
    it('uses hsl(var() / <alpha-value>) pattern for color shades', () => {
      const theme = createTheme({
        tokens: {
          colors: { primary: { '500': 'hsl(217 91% 60%)' } },
          radius: {},
          spacing: {},
          fontSize: {},
        },
      });

      const output = emitTailwindV3(theme);
      // Must use the alpha-value pattern, NOT a plain var()
      expect(output).toContain("'500': 'hsl(var(--__hsl-color-primary-500) / <alpha-value>)'");
      expect(output).not.toContain("'500': 'var(--color-primary-500)'");
    });

    it('omits the colors block entirely when tokens.colors is empty', () => {
      const theme = createTheme({
        tokens: { colors: {}, radius: { md: '0.5rem' }, spacing: {}, fontSize: {} },
      });

      const output = emitTailwindV3(theme);
      expect(output).not.toContain('colors: {');
    });

    it('color families are sorted alphabetically', () => {
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

      const output = emitTailwindV3(theme);
      expect(output.indexOf('alpha:')).toBeLessThan(output.indexOf('mango:'));
      expect(output.indexOf('mango:')).toBeLessThan(output.indexOf('zebra:'));
    });

    it('shades within a family are sorted alphabetically', () => {
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

      const output = emitTailwindV3(theme);
      const pos50 = output.indexOf("'50':");
      const pos500 = output.indexOf("'500':");
      const pos900 = output.indexOf("'900':");
      // String sort: '50' < '500' < '900'
      expect(pos50).toBeLessThan(pos500);
      expect(pos500).toBeLessThan(pos900);
    });
  });

  describe('breakpoints → screens key', () => {
    it('maps breakpoint tokens to the `screens` key (Tailwind v3 convention)', () => {
      const theme = createTheme({
        tokens: {
          colors: {},
          radius: {},
          spacing: {},
          fontSize: {},
          breakpoint: { xs: '36em', sm: '48em', md: '62em' },
        },
      });

      const output = emitTailwindV3(theme);
      expect(output).toContain('screens: {');
      expect(output).toContain("xs: '36em'");
      expect(output).toContain("sm: '48em'");
      expect(output).toContain("md: '62em'");
    });

    it('does not emit a screens block when breakpoint tokens are absent', () => {
      const theme = createTheme({
        tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      });
      // createTheme backfills default breakpoints; strip them so the emitter's
      // absent-breakpoint branch is still exercised.
      const { breakpoint: _backfilled, ...tokens } = theme.tokens;

      const output = emitTailwindV3({ ...theme, tokens });
      expect(output).not.toContain('screens:');
    });

    it('breakpoints use raw values (not var() references) in screens block', () => {
      const theme = createTheme({
        tokens: {
          colors: {},
          radius: {},
          spacing: {},
          fontSize: {},
          breakpoint: { md: '62em' },
        },
      });

      const output = emitTailwindV3(theme);
      // Tailwind v3 screens take raw values, not CSS var references
      expect(output).toContain("md: '62em'");
      expect(output).not.toContain('var(--breakpoint-md)');
    });
  });

  describe('quoteIfNeeded', () => {
    it('does not quote simple identifier keys (letters only)', () => {
      const theme = createTheme({
        tokens: { colors: {}, radius: { md: '0.5rem' }, spacing: {}, fontSize: {} },
      });

      const output = emitTailwindV3(theme);
      // 'md' is a valid identifier — should not be quoted
      expect(output).toContain("md: 'var(--radius-md)'");
      expect(output).not.toContain("'md': 'var(--radius-md)'");
    });

    it('quotes numeric-like keys (e.g. "50", "500")', () => {
      const theme = createTheme({
        tokens: { colors: { primary: { '50': 'light', '500': 'mid' } }, radius: {}, spacing: {}, fontSize: {} },
      });

      const output = emitTailwindV3(theme);
      // Shade keys '50' and '500' should be quoted in the colors block
      expect(output).toContain("'50': 'hsl(var(--__hsl-color-primary-50) / <alpha-value>)'");
      expect(output).toContain("'500': 'hsl(var(--__hsl-color-primary-500) / <alpha-value>)'");
    });
  });

  describe('optional token maps', () => {
    it('emits fontFamily → fontFamily config key with var() references', () => {
      const theme = createTheme({
        tokens: {
          colors: {},
          radius: {},
          spacing: {},
          fontSize: {},
          fontFamily: { sans: 'Inter', mono: 'monospace' },
        },
      });

      const output = emitTailwindV3(theme);
      expect(output).toContain('fontFamily: {');
      expect(output).toContain("sans: 'var(--font-family-sans)'");
      expect(output).toContain("mono: 'var(--font-family-mono)'");
    });

    it('emits fontWeight → fontWeight config key with var() references', () => {
      const theme = createTheme({
        tokens: {
          colors: {},
          radius: {},
          spacing: {},
          fontSize: {},
          fontWeight: { bold: '700', regular: '400' },
        },
      });

      const output = emitTailwindV3(theme);
      expect(output).toContain('fontWeight: {');
      expect(output).toContain("bold: 'var(--font-weight-bold)'");
    });

    it('emits lineHeight → lineHeight config key with var() references', () => {
      const theme = createTheme({
        tokens: {
          colors: {},
          radius: {},
          spacing: {},
          fontSize: {},
          lineHeight: { md: '1.55' },
        },
      });

      const output = emitTailwindV3(theme);
      expect(output).toContain('lineHeight: {');
      expect(output).toContain("md: 'var(--line-height-md)'");
    });

    it('emits shadow → boxShadow config key with var() references', () => {
      const theme = createTheme({
        tokens: {
          colors: {},
          radius: {},
          spacing: {},
          fontSize: {},
          shadow: { md: '0 4px 6px rgba(0,0,0,0.1)' },
        },
      });

      const output = emitTailwindV3(theme);
      expect(output).toContain('boxShadow: {');
      expect(output).toContain("md: 'var(--shadow-md)'");
    });

    it('skips optional token sections when the object is empty', () => {
      const theme = createTheme({
        tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      });

      const output = emitTailwindV3(theme);
      expect(output).not.toContain('fontFamily:');
      expect(output).not.toContain('fontWeight:');
      expect(output).not.toContain('lineHeight:');
      expect(output).not.toContain('boxShadow:');
    });
  });

  describe('structure and determinism', () => {
    it('always starts with the auto-generated header comment', () => {
      const theme = createTheme({
        tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      });

      const output = emitTailwindV3(theme);
      expect(output.split('\n')[0]).toMatch(/auto-generated/i);
    });

    it('output is wrapped in module.exports = { theme: { ... } }', () => {
      const theme = createTheme({
        tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      });

      const output = emitTailwindV3(theme);
      expect(output).toContain('module.exports = {');
      expect(output).toContain('theme: {');
    });

    it('is deterministic across runs', () => {
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
  });
});

// ---------------------------------------------------------------------------
// emit-tailwind-v4.ts
// ---------------------------------------------------------------------------

describe('emitTailwindV4 — emitter logic parity', () => {
  describe('Tailwind v4 namespace conventions', () => {
    it('fontSize uses --text-{key} namespace (v4 convention)', () => {
      const theme = createTheme({
        tokens: {
          colors: {},
          radius: {},
          spacing: {},
          fontSize: { sm: '0.875rem', md: '1rem', lg: '1.125rem' },
        },
      });

      const output = emitTailwindV4(theme);
      // v4 reads font-size from --text-* namespace
      expect(output).toContain('--text-sm: 0.875rem;');
      expect(output).toContain('--text-md: 1rem;');
      expect(output).toContain('--text-lg: 1.125rem;');
      // Must NOT use the --font-size-* namespace (that's v3 / emit-css)
      expect(output).not.toContain('--font-size-md');
    });

    it('fontFamily uses --font-{key} namespace (v4 convention)', () => {
      const theme = createTheme({
        tokens: {
          colors: {},
          radius: {},
          spacing: {},
          fontSize: {},
          fontFamily: { sans: 'Inter', mono: 'monospace' },
        },
      });

      const output = emitTailwindV4(theme);
      expect(output).toContain('--font-sans: Inter;');
      expect(output).toContain('--font-mono: monospace;');
      // Must NOT use the --font-family-* namespace (that's emit-css)
      expect(output).not.toContain('--font-family-sans');
    });

    it('lineHeight uses --leading-{key} namespace (v4 convention)', () => {
      const theme = createTheme({
        tokens: {
          colors: {},
          radius: {},
          spacing: {},
          fontSize: {},
          lineHeight: { xs: '1.4', md: '1.55', xl: '1.65' },
        },
      });

      const output = emitTailwindV4(theme);
      expect(output).toContain('--leading-xs: 1.4;');
      expect(output).toContain('--leading-md: 1.55;');
      expect(output).toContain('--leading-xl: 1.65;');
      // Must NOT use --line-height-* (that's emit-css)
      expect(output).not.toContain('--line-height-md');
    });

    it('shadow uses --shadow-{key} namespace (same as emit-css)', () => {
      const theme = createTheme({
        tokens: {
          colors: {},
          radius: {},
          spacing: {},
          fontSize: {},
          shadow: { card: '0 1px 2px black', elevated: '0 4px 8px black' },
        },
      });

      const output = emitTailwindV4(theme);
      expect(output).toContain('--shadow-card: 0 1px 2px black;');
      expect(output).toContain('--shadow-elevated: 0 4px 8px black;');
    });

    it('breakpoint uses --breakpoint-{key} namespace (v4 convention)', () => {
      const theme = createTheme({
        tokens: {
          colors: {},
          radius: {},
          spacing: {},
          fontSize: {},
          breakpoint: { sm: '48em', md: '62em', lg: '75em' },
        },
      });

      const output = emitTailwindV4(theme);
      expect(output).toContain('--breakpoint-sm: 48em;');
      expect(output).toContain('--breakpoint-md: 62em;');
      expect(output).toContain('--breakpoint-lg: 75em;');
    });
  });

  describe('no alpha-value pattern', () => {
    it('emits color values verbatim (no alpha pattern wrapping)', () => {
      const theme = createTheme({
        tokens: {
          colors: { primary: { '500': 'hsl(217 91% 60%)' } },
          radius: {},
          spacing: {},
          fontSize: {},
        },
      });

      const output = emitTailwindV4(theme);
      // v4: color values emitted directly
      expect(output).toContain('--color-primary-500: hsl(217 91% 60%);');
      // Must NOT use the alpha-value pattern (that's v3)
      expect(output).not.toContain('<alpha-value>');
    });
  });

  describe('@theme block structure', () => {
    it('wraps all tokens in an @theme block', () => {
      const theme = createTheme({
        tokens: {
          colors: { primary: { '500': 'hsl(0 0% 50%)' } },
          radius: { md: '0.5rem' },
          spacing: {},
          fontSize: {},
        },
      });

      const output = emitTailwindV4(theme);
      expect(output).toContain('@theme {');
      // Should NOT use module.exports (that's v3)
      expect(output).not.toContain('module.exports');
    });

    it('token vars are inside the @theme block', () => {
      const theme = createTheme({
        tokens: {
          colors: { primary: { '500': 'hsl(0 0% 50%)' } },
          radius: {},
          spacing: {},
          fontSize: {},
        },
      });

      const output = emitTailwindV4(theme);
      const themeStart = output.indexOf('@theme {');
      const themeEnd = output.indexOf('}', themeStart);
      const colorVarPos = output.indexOf('--color-primary-500');
      expect(colorVarPos).toBeGreaterThan(themeStart);
      expect(colorVarPos).toBeLessThan(themeEnd);
    });
  });

  describe('sort order and determinism', () => {
    it('color families are sorted alphabetically', () => {
      const theme = createTheme({
        tokens: {
          colors: {
            zebra: { '500': 'red' },
            alpha: { '500': 'blue' },
          },
          radius: {},
          spacing: {},
          fontSize: {},
        },
      });

      const output = emitTailwindV4(theme);
      expect(output.indexOf('--color-alpha-500')).toBeLessThan(
        output.indexOf('--color-zebra-500'),
      );
    });

    it('is deterministic across runs', () => {
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

    it('starts with the auto-generated header comment', () => {
      const theme = createTheme({
        tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      });

      const output = emitTailwindV4(theme);
      expect(output.split('\n')[0]).toMatch(/auto-generated/i);
    });
  });

  describe('v3 vs v4 namespace divergence', () => {
    it('v3 uses --font-size-* while v4 uses --text-*', () => {
      const tokens = {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: { md: '1rem' },
      };

      const themeA = createTheme({ tokens });
      const themeB = createTheme({ tokens });

      const v3Output = emitTailwindV3(themeA);
      const v4Output = emitTailwindV4(themeB);

      // v3 references --font-size-md via var()
      expect(v3Output).toContain("md: 'var(--font-size-md)'");
      // v4 declares --text-md directly
      expect(v4Output).toContain('--text-md: 1rem;');
      // No cross-contamination
      expect(v3Output).not.toContain('--text-md');
      expect(v4Output).not.toContain('--font-size-md');
    });

    it('v3 uses --line-height-* while v4 uses --leading-*', () => {
      const tokens = {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
        lineHeight: { md: '1.55' },
      };

      const themeA = createTheme({ tokens });
      const themeB = createTheme({ tokens });

      const v3Output = emitTailwindV3(themeA);
      const v4Output = emitTailwindV4(themeB);

      expect(v3Output).toContain("md: 'var(--line-height-md)'");
      expect(v4Output).toContain('--leading-md: 1.55;');
      expect(v3Output).not.toContain('--leading-md');
      expect(v4Output).not.toContain('--line-height-md');
    });

    it('v3 uses --font-family-* while v4 uses --font-*', () => {
      const tokens = {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
        fontFamily: { sans: 'Inter' },
      };

      const themeA = createTheme({ tokens });
      const themeB = createTheme({ tokens });

      const v3Output = emitTailwindV3(themeA);
      const v4Output = emitTailwindV4(themeB);

      expect(v3Output).toContain("sans: 'var(--font-family-sans)'");
      expect(v4Output).toContain('--font-sans: Inter;');
      expect(v3Output).not.toContain('--font-sans');
      expect(v4Output).not.toContain('--font-family-sans');
    });

    it('v3 breakpoints go in screens{} with raw values; v4 uses --breakpoint-* vars', () => {
      const tokens = {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
        breakpoint: { md: '62em' },
      };

      const themeA = createTheme({ tokens });
      const themeB = createTheme({ tokens });

      const v3Output = emitTailwindV3(themeA);
      const v4Output = emitTailwindV4(themeB);

      // v3: screens block with raw value
      expect(v3Output).toContain("screens: {");
      expect(v3Output).toContain("md: '62em'");
      // v4: --breakpoint-* custom property
      expect(v4Output).toContain('--breakpoint-md: 62em;');
      expect(v4Output).not.toContain('screens:');
    });
  });
});
