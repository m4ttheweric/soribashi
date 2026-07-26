import { describe, expect, it } from 'vitest';
import { defaultIntentResolver } from '../src/default-intent-resolver.ts';
import type { ResolvedTheme } from '../src/types.ts';

const theme = {
  tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
  dark: {},
  vocabulary: {
    intent: { values: ['primary', 'danger'] },
    variant: { values: ['filled', 'outline', 'subtle', 'ghost', 'link'] },
    size: { values: [] },
  },
  semanticTokens: { text: {}, surface: {}, border: {} },
  intentResolver: defaultIntentResolver,
  components: {},
  scope: ':root',
  darkMode: { selector: '.dark' },
  name: 'test',
} as unknown as ResolvedTheme;

describe('defaultIntentResolver', () => {
  describe('filled variant', () => {
    it('returns intent-500 background and inverted text', () => {
      const result = defaultIntentResolver({ intent: 'primary', variant: 'filled', theme });
      expect(result.background).toBe('var(--color-primary-500)');
      expect(result.color).toBe('var(--color-primary-foreground)');
      expect(result.border).toBe('transparent');
    });

    it('derives hover from the resolved background rather than a separate shade', () => {
      const result = defaultIntentResolver({ intent: 'primary', variant: 'filled', theme });
      // Mixes toward `black`, not `transparent`: mixing toward transparent
      // reduces alpha, so the painted result depends on whatever surface is
      // behind the element and flips direction between light and dark
      // schemes (verified in-browser; see task-11-report.md). Mixing toward
      // black composites identically regardless of scheme.
      expect(result.hover).toBe(`color-mix(in oklab, ${result.background} 90%, black)`);
    });

    it('derives active more strongly than hover', () => {
      const result = defaultIntentResolver({ intent: 'primary', variant: 'filled', theme });
      expect(result.active).toBe(`color-mix(in oklab, ${result.background} 80%, black)`);
    });
  });

  describe('outline variant', () => {
    it('transparent background with intent-500 border', () => {
      const result = defaultIntentResolver({ intent: 'primary', variant: 'outline', theme });
      expect(result.background).toBe('transparent');
      expect(result.color).toBe('var(--color-primary-700)');
      expect(result.border).toBe('var(--color-primary-500)');
    });

    // Wash formula: anchored on --surface-canvas rather than a near-canvas
    // ramp shade (the old `v('50')`), so it stays visible for low-chroma
    // scales (neutral) and composites identically in both colour schemes
    // (opaque color-mix, unlike mixing toward transparent -- see
    // deriveState's doc comment in the resolver for why that direction was
    // rejected). 12% is the lighter of the two wash weights, tuned for
    // hover-affordance visibility (ground-truthed empirically against a real
    // Chromium color-mix, not just eyeballed).
    it('hover is a 12% wash of intent-500 over the canvas, opaque', () => {
      const result = defaultIntentResolver({ intent: 'primary', variant: 'outline', theme });
      expect(result.hover).toBe(
        'color-mix(in oklab, var(--color-primary-500) 12%, var(--surface-canvas))',
      );
    });

    it('keeps hoverColor at intent-800', () => {
      const result = defaultIntentResolver({ intent: 'primary', variant: 'outline', theme });
      expect(result.hoverColor).toBe('var(--color-primary-800)');
    });
  });

  describe('subtle variant', () => {
    // Wash formula, heavier weight than the hover wash (15% vs. 12%): this is
    // a resting background, not a hover affordance, so it needs to read as a
    // real chip colour at rest. 15% (not the ~18% starting point) is the
    // empirically-verified ceiling that still clears the shared
    // matrix-harness.tsx MIN_CONTRAST (4.5:1) floor for every intent x
    // scheme's `700`-on-wash text pairing; see the resolver's doc comment
    // and the wash-fix report for the ground-truth measurements (light's
    // tightest margin is `info` at 18%: 4.508, essentially at the floor;
    // dark's is `warning`). 15% keeps a >=0.19 margin in both schemes.
    it('uses a 15% wash of intent-500 over the canvas as its background', () => {
      const result = defaultIntentResolver({ intent: 'primary', variant: 'subtle', theme });
      expect(result.background).toBe(
        'color-mix(in oklab, var(--color-primary-500) 15%, var(--surface-canvas))',
      );
      expect(result.color).toBe('var(--color-primary-700)');
    });

    it('derives hover via color-mix at 94% weight toward black, from the wash background', () => {
      const result = defaultIntentResolver({ intent: 'primary', variant: 'subtle', theme });
      expect(result.hover).toBe(`color-mix(in oklab, ${result.background} 94%, black)`);
    });

    it('derives active via color-mix at 88% weight toward black, from the wash background', () => {
      const result = defaultIntentResolver({ intent: 'primary', variant: 'subtle', theme });
      expect(result.active).toBe(`color-mix(in oklab, ${result.background} 88%, black)`);
    });

    // Parameterization check, not a hardcoded-'primary' coincidence: the bug
    // report's core complaint was neutral's near-zero-chroma ramp making a
    // flat shade lookup converge on canvas. This formula's fix is that it
    // never looks up a ramp shade for the background at all (`v('500')`
    // mixed with the canvas, not `v('100')`), so a second intent proves the
    // substitution is real, not incidentally correct for `primary`.
    it('substitutes the intent name for a different intent (not hardcoded)', () => {
      const result = defaultIntentResolver({ intent: 'danger', variant: 'subtle', theme });
      expect(result.background).toBe(
        'color-mix(in oklab, var(--color-danger-500) 15%, var(--surface-canvas))',
      );
    });
  });

  describe('ghost variant', () => {
    it('transparent until hover, then a 12% wash of intent-500 over the canvas', () => {
      const result = defaultIntentResolver({ intent: 'primary', variant: 'ghost', theme });
      expect(result.background).toBe('transparent');
      expect(result.hover).toBe(
        'color-mix(in oklab, var(--color-primary-500) 12%, var(--surface-canvas))',
      );
    });

    it('has no hoverColor override', () => {
      const result = defaultIntentResolver({ intent: 'primary', variant: 'ghost', theme });
      expect(result.hoverColor).toBeUndefined();
    });
  });

  describe('link variant', () => {
    it('uses intent-600 color, no background or border', () => {
      const result = defaultIntentResolver({ intent: 'primary', variant: 'link', theme });
      expect(result.background).toBe('transparent');
      expect(result.border).toBe('transparent');
      expect(result.color).toBe('var(--color-primary-600)');
    });
  });

  describe('unknown variant', () => {
    it('returns transparent neutral fallback', () => {
      const result = defaultIntentResolver({ intent: 'primary', variant: 'invalid', theme });
      expect(result.background).toBe('transparent');
      expect(result.color).toBe('inherit');
    });
  });
});
