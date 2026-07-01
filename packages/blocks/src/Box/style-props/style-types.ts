/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/Box/style-props/style-props.types.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 */
import type { ResolvedTheme } from '@soribashi/theme';

/**
 * A style-prop value: either a flat T (applied at all breakpoints) OR an object
 * keyed by breakpoint name where each entry overrides at that breakpoint.
 * The named keys mirror the default breakpoint map; `(string & {})` keeps
 * custom theme breakpoints assignable (they are validated at parse time
 * against theme.tokens.breakpoint).
 *
 *   p="md"                                     // flat
 *   p={{ base: 'xs', sm: 'sm', md: 'md' }}     // responsive
 */
export type StyleProp<T> =
  | T
  | Partial<
      Record<'base' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | (string & {}), T>
    >;

/**
 * A function that resolves a token value (e.g., 'md' or 16) to a CSS string.
 * Receives the resolved theme (Mantine parity) so resolvers can consult
 * theme tokens, e.g. getThemeColor only maps names found in theme colors.
 */
export type StylePropResolver = (value: unknown, theme?: ResolvedTheme) => string | undefined;

/**
 * One entry in STYLE_PROPS_DATA: maps a prop name (like 'p') to the CSS
 * property/properties it sets and the resolver for the value.
 */
export interface StylePropDefinition {
  /** CSS property name in camelCase, or array if the prop sets multiple */
  property: string | string[];
  /** Resolver function (one of get-spacing/get-radius/get-theme-color/etc.) */
  resolver: StylePropResolver;
}

/**
 * The parsed output of a style-prop pass.
 */
export interface ParsedStyleProps {
  /** Whether any responsive (object-form) style props were found */
  hasResponsiveStyles: boolean;
  /** Static (non-responsive) styles to apply inline */
  inlineStyles: Record<string, string>;
  /** Base styles from genuinely responsive props (the `base` breakpoint value when other breakpoints are also present) */
  styles: Record<string, string>;
  /** Per-media-query styles, keyed by full @media expression */
  media: Record<string, Record<string, string>>;
}
