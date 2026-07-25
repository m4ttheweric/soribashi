/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/Box/Box.types.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 */
import type { CSSProperties } from 'react';
import type { StyleProp } from './style-types.ts';

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
 * The full universal style-prop surface intersected into every built
 * component's public props (defineComponent, definePolymorphicComponent, and
 * defineCompound's Root; see packages/factory/src/style-props/use-style-props.tsx
 * for the runtime that backs this type). Adds the four visibility props
 * (consumed by the builder, never forwarded to the DOM) on top of BoxStyleProps.
 */
export interface UniversalStyleProps extends Partial<BoxStyleProps> {
  /** Breakpoint above which the component is hidden with `display: none` */
  hiddenFrom?: string;
  /** Breakpoint below which the component is hidden with `display: none` */
  visibleFrom?: string;
  /** Hide the component in light color scheme */
  lightHidden?: boolean;
  /** Hide the component in dark color scheme */
  darkHidden?: boolean;
}
