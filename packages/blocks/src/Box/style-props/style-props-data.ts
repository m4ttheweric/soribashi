/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/Box/style-props/style-props-data.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Resolvers reference soribashi's @soribashi/blocks/utils helpers
 *   - Token names: --mantine-* → soribashi-equivalent (handled inside the resolvers)
 */
import {
  getSpacing,
  getRadius,
  getFontSize,
  getLineHeight,
  getThemeColor,
  rem,
} from '../../utils/index.ts';
import type { StylePropDefinition, StylePropResolver } from './style-types.ts';

const identity: StylePropResolver = (v) =>
  v === undefined || v === null ? undefined : String(v);

const sizeOrRem: StylePropResolver = (v) => {
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'number') return rem(v);
  return String(v);
};

// font-weight is identity: CSS keywords (bold, bolder, lighter) and numeric values
// all pass through as-is. Mantine uses the same identity approach.
// If a consumer wants a CSS variable, they can write `var(--font-weight-bold)` explicitly.

/**
 * Static map from prop name to CSS property + resolver. Mirrors Mantine's
 * style-prop set. Adding a new prop here makes it work on every component
 * that wraps Box.
 */
export const STYLE_PROPS_DATA: Record<string, StylePropDefinition> = {
  // Margin
  m: { property: 'margin', resolver: getSpacing as StylePropResolver },
  mt: { property: 'marginTop', resolver: getSpacing as StylePropResolver },
  mb: { property: 'marginBottom', resolver: getSpacing as StylePropResolver },
  ml: { property: 'marginLeft', resolver: getSpacing as StylePropResolver },
  mr: { property: 'marginRight', resolver: getSpacing as StylePropResolver },
  ms: { property: 'marginInlineStart', resolver: getSpacing as StylePropResolver },
  me: { property: 'marginInlineEnd', resolver: getSpacing as StylePropResolver },
  mis: { property: 'marginInlineStart', resolver: getSpacing as StylePropResolver },
  mie: { property: 'marginInlineEnd', resolver: getSpacing as StylePropResolver },
  mx: { property: 'marginInline', resolver: getSpacing as StylePropResolver },
  my: { property: 'marginBlock', resolver: getSpacing as StylePropResolver },

  // Padding
  p: { property: 'padding', resolver: getSpacing as StylePropResolver },
  pt: { property: 'paddingTop', resolver: getSpacing as StylePropResolver },
  pb: { property: 'paddingBottom', resolver: getSpacing as StylePropResolver },
  pl: { property: 'paddingLeft', resolver: getSpacing as StylePropResolver },
  pr: { property: 'paddingRight', resolver: getSpacing as StylePropResolver },
  ps: { property: 'paddingInlineStart', resolver: getSpacing as StylePropResolver },
  pe: { property: 'paddingInlineEnd', resolver: getSpacing as StylePropResolver },
  pis: { property: 'paddingInlineStart', resolver: getSpacing as StylePropResolver },
  pie: { property: 'paddingInlineEnd', resolver: getSpacing as StylePropResolver },
  px: { property: 'paddingInline', resolver: getSpacing as StylePropResolver },
  py: { property: 'paddingBlock', resolver: getSpacing as StylePropResolver },

  // Color
  bg: { property: 'background', resolver: getThemeColor as StylePropResolver },
  c: { property: 'color', resolver: getThemeColor as StylePropResolver },
  bd: { property: 'border', resolver: identity },
  bdrs: { property: 'borderRadius', resolver: getRadius as StylePropResolver },

  // Typography
  ff: { property: 'fontFamily', resolver: identity },
  fz: { property: 'fontSize', resolver: getFontSize as StylePropResolver },
  fw: { property: 'fontWeight', resolver: identity },
  lh: { property: 'lineHeight', resolver: getLineHeight as StylePropResolver },
  lts: { property: 'letterSpacing', resolver: sizeOrRem },
  ta: { property: 'textAlign', resolver: identity },
  fs: { property: 'fontStyle', resolver: identity },
  tt: { property: 'textTransform', resolver: identity },
  td: { property: 'textDecoration', resolver: identity },

  // Visual
  opacity: { property: 'opacity', resolver: identity },

  // Layout
  display: { property: 'display', resolver: identity },
  pos: { property: 'position', resolver: identity },
  top: { property: 'top', resolver: sizeOrRem },
  left: { property: 'left', resolver: sizeOrRem },
  right: { property: 'right', resolver: sizeOrRem },
  bottom: { property: 'bottom', resolver: sizeOrRem },
  inset: { property: 'inset', resolver: sizeOrRem },

  // Sizing — accept spacing tokens (xs/sm/md/lg/xl/...) plus raw CSS / numbers.
  w: { property: 'width', resolver: getSpacing as StylePropResolver },
  miw: { property: 'minWidth', resolver: getSpacing as StylePropResolver },
  maw: { property: 'maxWidth', resolver: getSpacing as StylePropResolver },
  h: { property: 'height', resolver: getSpacing as StylePropResolver },
  mih: { property: 'minHeight', resolver: getSpacing as StylePropResolver },
  mah: { property: 'maxHeight', resolver: getSpacing as StylePropResolver },

  // Flex
  flex: { property: 'flex', resolver: identity },

  // Background
  bgsz: { property: 'backgroundSize', resolver: sizeOrRem },
  bgp: { property: 'backgroundPosition', resolver: identity },
  bgr: { property: 'backgroundRepeat', resolver: identity },
  bga: { property: 'backgroundAttachment', resolver: identity },
};
