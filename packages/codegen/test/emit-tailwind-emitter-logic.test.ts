/**
 * Tier 2 Batch T2-E — Tailwind Emitter Logic Parity Tests
 *
 * These tests cover line-level branches in emit-tailwind-v4.ts found during
 * the 2026-04-25 full-audit pass (Mantine commit 63dafbbf).
 *
 * They complement the existing tests by covering:
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
 *   - Sort order and determinism
 */

import { createTheme } from '@soribashi/theme';
import { describe, expect, it } from 'vitest';
import { emitTailwindV4 } from '../src/emit-tailwind-v4.ts';

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
      // Must NOT use the --font-size-* namespace (that's emit-css)
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
      // Must NOT use the alpha-value pattern (v4 handles opacity via color-mix())
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
      expect(output.indexOf('--color-alpha-500')).toBeLessThan(output.indexOf('--color-zebra-500'));
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
});
