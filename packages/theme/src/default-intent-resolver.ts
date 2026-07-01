import type { IntentResolver, IntentResolverResult } from './types.ts';

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
 * Reference: based on Mantine's `defaultVariantColorsResolver`. The variant
 * set is adapted to soribashi's `filled | outline | subtle | ghost | link`.
 */
export const defaultIntentResolver: IntentResolver = ({ intent, variant }) => {
  const v = (shade: string) => `var(--color-${intent}-${shade})`;

  if (variant === 'filled') {
    return {
      background: v('500'),
      color: `var(--color-${intent}-foreground)`,
      border: 'transparent',
      hover: v('600'),
      active: v('700'),
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
