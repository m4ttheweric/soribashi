import type { IntentResolver, IntentResolverResult } from './types.ts';

/**
 * Derives an interaction state from an already-resolved, opaque background.
 *
 * Deriving rather than looking up a separate ramp shade makes state behaviour
 * consistent by construction: a theme declares anchors and CSS derives the
 * rest, instead of every theme having to remember to pick a coherent hover
 * shade. oklab is the interpolation space because it is perceptually uniform,
 * so the same percentage reads as the same amount of change across hues.
 *
 * Mixes toward `black`, not `transparent`. `color-mix(..., transparent)`
 * reduces alpha rather than lightness, so the *painted* result depends on
 * whatever is behind the element: verified in a real browser (canvas
 * composite, primary-500 `oklch(0.6261 0.1859 259.6)` over a white vs.
 * near-black surface), `color-mix(in oklab, 500 90%, transparent)` painted
 * `rgb(80,144,247)` (lighter than the `rgb(60,131,246)` base) over the light
 * surface but `rgb(54,119,224)` (darker, and barely distinct) over the dark
 * one... the same expression flips direction, and is weakest exactly where
 * `--button-hover` also has to work: dark mode, where `color-scheme` is
 * flipped on a wrapper rather than swapping the token value. Mixing toward
 * `black` composites identically regardless of backdrop (measured
 * `rgb(51,113,214)` in both schemes) and keeps this resolver's pre-existing
 * scheme-invariant direction: `defaultDarkTokens` DOES override several of
 * these shades per scheme (e.g. `primary.500`, `neutral.500`, `neutral.600`
 * in default-tokens.ts), so the literal CSS value substituted at each shade
 * differs between light and dark. That doesn't undermine the "always
 * darker" claim, though: mixing toward black darkens whatever the
 * light-dark()-resolved background happens to be in the current scheme, so
 * hover/active were already "always darker than background, in both
 * schemes" before this derivation replaced the ramp lookup, regardless of
 * whether the anchor shade itself was overridden per scheme.
 */
function deriveState(background: string, weight: number): string {
  return `color-mix(in oklab, ${background} ${weight}%, black)`;
}

/**
 * A "wash": an opaque tint of `intent-500` over the canvas, used for surfaces
 * that used to be a near-canvas ramp shade (`ghost`/`outline` hover: `v('50')`;
 * `subtle`'s resting background: `v('100')`).
 *
 * Anchoring on `var(--surface-canvas)` rather than looking up a fixed ramp
 * shade fixes two compounding problems those lookups had:
 *
 * - **Low-chroma scales converge on canvas.** `--surface-canvas` maps to
 *   `--color-neutral-50` (see the generated theme CSS), so `neutral`'s own
 *   `v('50')` wash was literally identical to the canvas -- no visible change
 *   at all -- and every other intent's `-50`/`-100` shade sits so close to
 *   `neutral-50` (L ~ 0.97-0.98 against canvas' ~0.984) that the "wash" read
 *   as barely-there. A ramp shade can only ever be as visible as the ramp's
 *   OWN lightness step from white allows; `neutral`'s ramp has almost no
 *   chroma, so no fixed shade fixes it. Mixing `intent-500` (a strongly
 *   saturated, mid-lightness shade every scale has) toward the canvas
 *   produces a visible tint by construction, including for neutral.
 * - **Opaque, not mixed toward `transparent`.** Same rationale as
 *   `deriveState` above: `color-mix(..., transparent)` composites against
 *   whatever is behind the element and flips direction between light and dark
 *   scheme. Anchoring on `--surface-canvas` (itself `light-dark()`-aware, and
 *   several `-500` shades carry their own dark overrides -- see
 *   `defaultDarkTokens`) sidesteps that: both inputs already resolve
 *   correctly per scheme, so the wash adapts with no extra work, and it
 *   composites the same regardless of what is actually behind the element.
 *
 * `weight` is intentionally the caller's to choose (see the two call sites
 * below): a hover affordance and a resting background want different
 * strengths, both empirically tuned against a real Chromium `color-mix` (see
 * the wash-fix report) rather than picked by eye.
 */
function wash(intent: string, weight: number): string {
  return `color-mix(in oklab, var(--color-${intent}-500) ${weight}%, var(--surface-canvas))`;
}

/**
 * Default intent resolver. Maps `(intent, variant)` to CSS values referencing
 * the theme's CSS variables. Components consume this through the framework;
 * never directly.
 *
 * Scale contract: this resolver hardcodes shade lookups rather than consulting
 * `input.theme`, so every color scale named by the theme's intent vocabulary
 * MUST define the shades `500`, `600`, `700`, `800`, and `foreground` (the
 * text color paired with the `500` filled background). A scale missing one of
 * these leaves components referencing an undefined `--color-{intent}-{shade}`
 * variable. Custom scales that cannot satisfy the contract need a custom
 * `IntentResolver` instead. (`50`/`100`/`200` are no longer referenced here:
 * the wash formula above replaced every near-canvas ramp-shade lookup.)
 *
 * `filled` and `subtle` derive their `hover`/`active` from `background` via
 * `deriveState` (see above). `outline` and `ghost` derive their `hover`
 * background from a `wash` (see above) instead: their resting `background` is
 * `transparent`, so `deriveState`-from-background would flatten their
 * deliberate "wash appears on hover" effect into a no-op
 * `color-mix(transparent, ...)`. `link` keeps a literal `hover: 'transparent'`
 * (a deliberate no-op, not a wash) -- it intentionally never grows a
 * background.
 *
 * `subtle`'s hover/active weights (94%/88%, applied via `deriveState` to its
 * now-opaque wash background) are a starting point tunable by design review,
 * same as the wash weights themselves.
 *
 * Reference: based on Mantine's `defaultVariantColorsResolver`. The variant
 * set is adapted to soribashi's `filled | outline | subtle | ghost | link`.
 */
export const defaultIntentResolver: IntentResolver = ({ intent, variant }) => {
  const v = (shade: string) => `var(--color-${intent}-${shade})`;

  if (variant === 'filled') {
    const background = v('500');
    return {
      background,
      color: `var(--color-${intent}-foreground)`,
      border: 'transparent',
      hover: deriveState(background, 90),
      active: deriveState(background, 80),
    };
  }

  if (variant === 'outline') {
    return {
      background: 'transparent',
      color: v('700'),
      border: v('500'),
      hover: wash(intent, 12),
      hoverColor: v('800'),
    };
  }

  if (variant === 'subtle') {
    const background = wash(intent, 15);
    return {
      background,
      color: v('700'),
      border: 'transparent',
      hover: deriveState(background, 94),
      active: deriveState(background, 88),
    };
  }

  if (variant === 'ghost') {
    return {
      background: 'transparent',
      color: v('700'),
      border: 'transparent',
      hover: wash(intent, 12),
    };
  }

  if (variant === 'link') {
    return {
      background: 'transparent',
      color: v('600'),
      border: 'transparent',
      hover: 'transparent',
      hoverColor: v('800'),
    };
  }

  // Fallback for unknown variants
  return {
    background: 'transparent',
    color: 'inherit',
    border: 'none',
  } satisfies IntentResolverResult;
};
