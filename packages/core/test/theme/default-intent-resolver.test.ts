import { describe, expect, it } from 'vitest';
import {
  defaultIntentResolver,
  rampVariantColors,
  singleShadeVariantColors,
} from '../../src/theme/default-intent-resolver.ts';
import type { ResolvedTheme } from '../../src/theme/types.ts';

const theme = {
  tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
  dark: {},
  vocabulary: {
    intent: { values: ['primary', 'danger'] },
    variant: {
      values: ['filled', 'light', 'outline', 'subtle', 'default', 'transparent', 'link'],
    },
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

  describe('light variant (formerly subtle)', () => {
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
      const result = defaultIntentResolver({ intent: 'primary', variant: 'light', theme });
      expect(result.background).toBe(
        'color-mix(in oklab, var(--color-primary-500) 15%, var(--surface-canvas))',
      );
      expect(result.color).toBe('var(--color-primary-700)');
    });

    it('has a transparent border', () => {
      const result = defaultIntentResolver({ intent: 'primary', variant: 'light', theme });
      expect(result.border).toBe('transparent');
    });

    it('derives hover via color-mix at 94% weight toward black, from the wash background', () => {
      const result = defaultIntentResolver({ intent: 'primary', variant: 'light', theme });
      expect(result.hover).toBe(`color-mix(in oklab, ${result.background} 94%, black)`);
    });

    it('derives active via color-mix at 88% weight toward black, from the wash background', () => {
      const result = defaultIntentResolver({ intent: 'primary', variant: 'light', theme });
      expect(result.active).toBe(`color-mix(in oklab, ${result.background} 88%, black)`);
    });

    // Parameterization check, not a hardcoded-'primary' coincidence: the bug
    // report's core complaint was neutral's near-zero-chroma ramp making a
    // flat shade lookup converge on canvas. This formula's fix is that it
    // never looks up a ramp shade for the background at all (`v('500')`
    // mixed with the canvas, not `v('100')`), so a second intent proves the
    // substitution is real, not incidentally correct for `primary`.
    it('substitutes the intent name for a different intent (not hardcoded)', () => {
      const result = defaultIntentResolver({ intent: 'danger', variant: 'light', theme });
      expect(result.background).toBe(
        'color-mix(in oklab, var(--color-danger-500) 15%, var(--surface-canvas))',
      );
    });
  });

  describe('subtle variant (formerly ghost)', () => {
    it('transparent until hover, then a 12% wash of intent-500 over the canvas', () => {
      const result = defaultIntentResolver({ intent: 'primary', variant: 'subtle', theme });
      expect(result.background).toBe('transparent');
      expect(result.color).toBe('var(--color-primary-700)');
      expect(result.border).toBe('transparent');
      expect(result.hover).toBe(
        'color-mix(in oklab, var(--color-primary-500) 12%, var(--surface-canvas))',
      );
    });

    it('has no hoverColor override', () => {
      const result = defaultIntentResolver({ intent: 'primary', variant: 'subtle', theme });
      expect(result.hoverColor).toBeUndefined();
    });
  });

  describe('default variant', () => {
    // Not intent-parameterized like the ramp variants above: `default` is the
    // neutral/unstyled-chrome surface (a plain panel with a border), so it
    // reads from the semantic surface/text/border layer instead of
    // `--color-{intent}-*`. The hover step names a fallback because the
    // `--surface-card` slot may not exist on every theme; the fallback keeps
    // the variant usable without requiring one.
    it('reads background/color/border from the semantic token layer', () => {
      const result = defaultIntentResolver({ intent: 'primary', variant: 'default', theme });
      expect(result.background).toBe('var(--surface-panel)');
      expect(result.color).toBe('var(--text-primary)');
      expect(result.border).toBe('var(--border-default)');
    });

    it('hover names the --surface-card step with a color-mix fallback', () => {
      const result = defaultIntentResolver({ intent: 'primary', variant: 'default', theme });
      expect(result.hover).toBe(
        'var(--surface-card, color-mix(in oklab, var(--surface-panel) 92%, black))',
      );
    });

    it('is not intent-parameterized', () => {
      const primary = defaultIntentResolver({ intent: 'primary', variant: 'default', theme });
      const danger = defaultIntentResolver({ intent: 'danger', variant: 'default', theme });
      expect(primary).toEqual(danger);
    });
  });

  describe('transparent variant', () => {
    it('stays transparent with intent-700 text and no hover key', () => {
      const result = defaultIntentResolver({ intent: 'primary', variant: 'transparent', theme });
      expect(result.background).toBe('transparent');
      expect(result.color).toBe('var(--color-primary-700)');
      expect(result.border).toBe('transparent');
      expect(result.hover).toBeUndefined();
      expect('hover' in result).toBe(false);
    });
  });

  describe('link variant', () => {
    it('uses intent-600 color, no background or border', () => {
      const result = defaultIntentResolver({ intent: 'primary', variant: 'link', theme });
      expect(result.background).toBe('transparent');
      expect(result.border).toBe('transparent');
      expect(result.color).toBe('var(--color-primary-600)');
    });

    it('keeps hover as a deliberate no-op and hoverColor at intent-800', () => {
      const result = defaultIntentResolver({ intent: 'primary', variant: 'link', theme });
      expect(result.hover).toBe('transparent');
      expect(result.hoverColor).toBe('var(--color-primary-800)');
    });
  });

  // SORI-8: `theme` is optional on IntentResolverInput because this resolver
  // never reads it. Calling without one is the natural unit-test shape; it now
  // typechecks (see intent-resolver-input.test-d.ts) and behaves identically.
  describe('without a theme', () => {
    it('resolves identically to a call that passes one', () => {
      for (const variant of [
        'filled',
        'light',
        'outline',
        'subtle',
        'default',
        'transparent',
        'link',
      ]) {
        expect(defaultIntentResolver({ intent: 'primary', variant })).toEqual(
          defaultIntentResolver({ intent: 'primary', variant, theme }),
        );
      }
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

describe('rampVariantColors', () => {
  // The extraction point: defaultIntentResolver must delegate rather than
  // duplicate, so a caller building a custom resolver can extend this table
  // instead of re-deriving it. Proven by equality against the resolver's own
  // output across the full variant menu, not just spot-checked.
  it('is exactly what defaultIntentResolver returns, for every variant', () => {
    for (const variant of [
      'filled',
      'light',
      'outline',
      'subtle',
      'default',
      'transparent',
      'link',
    ]) {
      expect(rampVariantColors('primary', variant)).toEqual(
        defaultIntentResolver({ intent: 'primary', variant, theme }),
      );
    }
  });
});

describe('singleShadeVariantColors', () => {
  const TONE = 'var(--color-accent-500)';

  describe('filled variant', () => {
    it('paints TONE as the background with a generic foreground fallback', () => {
      const result = singleShadeVariantColors(TONE, 'filled');
      expect(result.background).toBe(TONE);
      expect(result.color).toBe('var(--sb-intent-foreground, #fff)');
      expect(result.border).toBe('transparent');
    });

    it('hover mixes 90% TONE toward black, in srgb (tui-kit parity)', () => {
      const result = singleShadeVariantColors(TONE, 'filled');
      expect(result.hover).toBe(`color-mix(in srgb, ${TONE} 90%, black)`);
    });

    it('has no active key', () => {
      const result = singleShadeVariantColors(TONE, 'filled');
      expect('active' in result).toBe(false);
    });
  });

  describe('outline variant', () => {
    it('transparent background, TONE color and border', () => {
      const result = singleShadeVariantColors(TONE, 'outline');
      expect(result.background).toBe('transparent');
      expect(result.color).toBe(TONE);
      expect(result.border).toBe(TONE);
    });

    // Mirrors tui-kit's shipped OUTLINE_HOVER_TINT (Button.tsx): a 5% srgb
    // mix over the canvas surface, not the ramp branch's oklab wash.
    it('hover is a 5% srgb mix of TONE over the canvas', () => {
      const result = singleShadeVariantColors(TONE, 'outline');
      expect(result.hover).toBe(`color-mix(in srgb, ${TONE} 5%, var(--surface-canvas))`);
    });

    it('has no hoverColor key', () => {
      const result = singleShadeVariantColors(TONE, 'outline');
      expect('hoverColor' in result).toBe(false);
    });
  });

  describe('light variant', () => {
    it('rests on --surface-card, not a wash, with a transparent border', () => {
      const result = singleShadeVariantColors(TONE, 'light');
      expect(result.background).toBe('var(--surface-card)');
      expect(result.color).toBe(TONE);
      expect(result.border).toBe('transparent');
    });

    // tui-kit's shipped SUBTLE_HOVER_TINT is 12%, mixed in srgb over the
    // variant's OWN resting surface (--surface-card), not the canvas.
    it('hover is a 12% srgb mix of TONE over --surface-card', () => {
      const result = singleShadeVariantColors(TONE, 'light');
      expect(result.hover).toBe(`color-mix(in srgb, ${TONE} 12%, var(--surface-card))`);
    });

    it('has no active key', () => {
      const result = singleShadeVariantColors(TONE, 'light');
      expect('active' in result).toBe(false);
    });
  });

  describe('subtle variant', () => {
    it('transparent until hover', () => {
      const result = singleShadeVariantColors(TONE, 'subtle');
      expect(result.background).toBe('transparent');
      expect(result.color).toBe(TONE);
      expect(result.border).toBe('transparent');
    });

    // tui-kit's shipped GHOST_HOVER_TINT is 12%, mixed in srgb over the
    // canvas (this branch has no resting surface of its own to mix over).
    it('hover is a 12% srgb mix of TONE over the canvas', () => {
      const result = singleShadeVariantColors(TONE, 'subtle');
      expect(result.hover).toBe(`color-mix(in srgb, ${TONE} 12%, var(--surface-canvas))`);
    });
  });

  describe('default variant', () => {
    it('reads the same semantic layer as the ramp branch, plain --surface-card hover', () => {
      const result = singleShadeVariantColors(TONE, 'default');
      expect(result.background).toBe('var(--surface-panel)');
      expect(result.color).toBe('var(--text-primary)');
      expect(result.border).toBe('var(--border-default)');
      expect(result.hover).toBe('var(--surface-card)');
    });

    it('is not TONE-parameterized', () => {
      const a = singleShadeVariantColors('var(--color-accent-500)', 'default');
      const b = singleShadeVariantColors('var(--color-danger-500)', 'default');
      expect(a).toEqual(b);
    });
  });

  describe('transparent variant', () => {
    it('stays transparent with TONE text and no hover key', () => {
      const result = singleShadeVariantColors(TONE, 'transparent');
      expect(result.background).toBe('transparent');
      expect(result.color).toBe(TONE);
      expect(result.border).toBe('transparent');
      expect('hover' in result).toBe(false);
    });
  });

  describe('link variant', () => {
    it('uses TONE for both color and hoverColor, with no hover key', () => {
      const result = singleShadeVariantColors(TONE, 'link');
      expect(result.background).toBe('transparent');
      expect(result.border).toBe('transparent');
      expect(result.color).toBe(TONE);
      expect(result.hoverColor).toBe(TONE);
      expect('hover' in result).toBe(false);
    });
  });

  describe('unknown variant', () => {
    it('returns the same transparent neutral fallback as the ramp branch', () => {
      const result = singleShadeVariantColors(TONE, 'invalid');
      expect(result.background).toBe('transparent');
      expect(result.color).toBe('inherit');
    });
  });
});

describe('branch detection', () => {
  function themeWithScale(scale: Record<string, string>): ResolvedTheme {
    return {
      ...theme,
      tokens: { ...theme.tokens, colors: { accent: scale } },
    } as ResolvedTheme;
  }

  it('a scale with a single numeric shade key routes to the single-shade branch, tone = that value', () => {
    const scaleTheme = themeWithScale({ '500': '#2e7de9' });
    const result = defaultIntentResolver({ intent: 'accent', variant: 'filled', theme: scaleTheme });
    expect(result).toEqual(singleShadeVariantColors('#2e7de9', 'filled'));
  });

  it('a scale with two numeric shade keys, no 500, routes to single-shade using the first entry', () => {
    const scaleTheme = themeWithScale({ '400': '#1e6fd9', '600': '#0e5fc9' });
    const result = defaultIntentResolver({ intent: 'accent', variant: 'outline', theme: scaleTheme });
    expect(result).toEqual(singleShadeVariantColors('#1e6fd9', 'outline'));
  });

  it('a scale with 50..900 (>=3 numeric keys) routes to the ramp branch', () => {
    const scaleTheme = themeWithScale({
      '50': '#eef4ff',
      '100': '#dde8ff',
      '500': '#2e7de9',
      '700': '#1a4fa0',
      '900': '#0d2c5c',
    });
    const result = defaultIntentResolver({ intent: 'accent', variant: 'filled', theme: scaleTheme });
    expect(result).toEqual(rampVariantColors('accent', 'filled'));
  });

  it('an intent absent from theme.tokens.colors falls back to the ramp branch', () => {
    // The shared `theme` fixture's empty `colors: {}` already exercises this
    // path above; this case pins it as the detection contract in its own
    // right rather than leaving it implicit in another assertion's fixture.
    const result = defaultIntentResolver({ intent: 'primary', variant: 'filled', theme });
    expect(result).toEqual(rampVariantColors('primary', 'filled'));
  });

  it('no theme at all routes to the ramp branch', () => {
    const result = defaultIntentResolver({ intent: 'accent', variant: 'filled' });
    expect(result).toEqual(rampVariantColors('accent', 'filled'));
  });
});
