/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/Box/Box.types.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 */
import type { CSSProperties } from 'react';
import type { BoxMod } from './get-box-mod.ts';
import type { StyleProp } from './style-props/style-types.ts';

export type { BoxMod };

/**
 * Style-prop interface for Box (and any component that wraps Box).
 *
 * Each prop is optional and accepts either a flat value or a responsive
 * `StyleProp<T>` object. The set of props mirrors Mantine's Box; adding new
 * entries to `STYLE_PROPS_DATA` automatically extends this surface (just
 * remember to add the type here too).
 */
export interface BoxStyleProps {
  // Margin
  m?: StyleProp<string | number>;
  mt?: StyleProp<string | number>;
  mb?: StyleProp<string | number>;
  ml?: StyleProp<string | number>;
  mr?: StyleProp<string | number>;
  ms?: StyleProp<string | number>;
  me?: StyleProp<string | number>;
  mis?: StyleProp<string | number>;
  mie?: StyleProp<string | number>;
  mx?: StyleProp<string | number>;
  my?: StyleProp<string | number>;

  // Padding
  p?: StyleProp<string | number>;
  pt?: StyleProp<string | number>;
  pb?: StyleProp<string | number>;
  pl?: StyleProp<string | number>;
  pr?: StyleProp<string | number>;
  ps?: StyleProp<string | number>;
  pe?: StyleProp<string | number>;
  pis?: StyleProp<string | number>;
  pie?: StyleProp<string | number>;
  px?: StyleProp<string | number>;
  py?: StyleProp<string | number>;

  // Color
  bg?: StyleProp<string>;
  c?: StyleProp<string>;
  bd?: StyleProp<string>;
  bdrs?: StyleProp<string | number>;

  // Typography
  ff?: StyleProp<string>;
  fz?: StyleProp<string | number>;
  fw?: StyleProp<string | number>;
  lh?: StyleProp<string | number>;
  lts?: StyleProp<string | number>;
  ta?: StyleProp<CSSProperties['textAlign']>;
  fs?: StyleProp<CSSProperties['fontStyle']>;
  tt?: StyleProp<CSSProperties['textTransform']>;
  td?: StyleProp<CSSProperties['textDecoration']>;

  // Visual
  opacity?: StyleProp<string | number>;

  // Layout
  display?: StyleProp<CSSProperties['display']>;
  pos?: StyleProp<CSSProperties['position']>;
  top?: StyleProp<string | number>;
  left?: StyleProp<string | number>;
  right?: StyleProp<string | number>;
  bottom?: StyleProp<string | number>;
  inset?: StyleProp<string | number>;

  // Sizing
  w?: StyleProp<string | number>;
  miw?: StyleProp<string | number>;
  maw?: StyleProp<string | number>;
  h?: StyleProp<string | number>;
  mih?: StyleProp<string | number>;
  mah?: StyleProp<string | number>;

  // Flex
  flex?: StyleProp<string | number>;

  // Background
  bgsz?: StyleProp<string | number>;
  bgp?: StyleProp<string>;
  bgr?: StyleProp<CSSProperties['backgroundRepeat']>;
  bga?: StyleProp<CSSProperties['backgroundAttachment']>;
}

/**
 * The full Box prop surface — style props + the `mod` API.
 */
export interface BoxOwnProps extends BoxStyleProps {
  /** Modifier API: `mod="active"`, `mod={{ active: true }}`, `mod={[...]}` */
  mod?: BoxMod;
  /** Variant string passed through as `data-variant` */
  variant?: string;

  // Visibility props — consumed by Box (never forwarded to the DOM)

  /** Breakpoint above which the component is hidden with `display: none` */
  hiddenFrom?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Breakpoint below which the component is hidden with `display: none` */
  visibleFrom?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Hide the component in light color scheme */
  lightHidden?: boolean;
  /** Hide the component in dark color scheme */
  darkHidden?: boolean;
  /**
   * NOT applied — soribashi has no CSS-in-JS runtime. The value is consumed
   * (so it cannot leak to the DOM) and a dev-only warning is emitted when set.
   * Use `style`, style props, or the Styles API instead.
   */
  sx?: Record<string, unknown>;
}
