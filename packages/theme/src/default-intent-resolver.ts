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
 * Default intent resolver. Maps `(intent, variant)` to CSS values referencing
 * the theme's CSS variables. Components consume this through the framework;
 * never directly.
 *
 * Scale contract: this resolver hardcodes shade lookups rather than consulting
 * `input.theme`, so every color scale named by the theme's intent vocabulary
 * MUST define the shades `50`, `100`, `200`, `500`, `600`, `700`, `800`, and
 * `foreground` (the text color paired with the `500` filled background).
 * A scale missing one of these leaves components referencing an undefined
 * `--color-{intent}-{shade}` variable. Custom scales that cannot satisfy the
 * contract need a custom `IntentResolver` instead.
 *
 * `filled` derives its `hover`/`active` from `background` via `deriveState`
 * (see above). The other variants keep ramp-shade lookups for their hover
 * behaviour: their `background` is `transparent`, so deriving from it would
 * flatten a deliberate "wash appears on hover" effect (outline, ghost) or a
 * deliberate no-op (link, which intentionally never grows a background) into
 * a no-op `color-mix(transparent, ...)` for all of them.
 *
 * `subtle`'s `background` (`100`) is solid, not `transparent`, so `hover:
 * v('200')` COULD derive the same way `filled` does. Left as a ramp lookup
 * deliberately, not an oversight: picking a mix weight against a light
 * background is a visual design call, not a mechanical substitution, and is
 * tracked as a follow-up rather than decided here.
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
      hover: v('50'),
      hoverColor: v('800'),
    };
  }

  if (variant === 'subtle') {
    return {
      background: v('100'),
      color: v('700'),
      border: 'transparent',
      hover: v('200'),
    };
  }

  if (variant === 'ghost') {
    return {
      background: 'transparent',
      color: v('700'),
      border: 'transparent',
      hover: v('50'),
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
