/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/Box/style-props/resolvers/border-resolver/border-resolver.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Signature: (value) instead of Mantine's (value, theme).
 *     Mantine's colorResolver requires a theme argument because it consults
 *     theme.colors at render time. Soribashi's getThemeColor returns CSS
 *     variable references resolved at paint time — no theme arg needed.
 *   - Color syntax: 'primary.500' (50–950 shade scale) instead of Mantine's
 *     'primary.5' (0–9 shade scale). Inherited from getThemeColor.
 */
import { rem } from '../../../utils/rem.ts';
import { getThemeColor } from '../../../utils/get-theme-color.ts';
import type { StylePropResolver } from '../style-types.ts';

export const borderResolver: StylePropResolver = (value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') return rem(value);
  if (typeof value !== 'string') return String(value);

  const parts = value.split(' ').filter((v) => v.trim() !== '');
  if (parts.length === 0) return value;

  const [size, style, ...colorTuple] = parts;
  const sizeOut = rem(size as string | number) ?? size;
  let result = String(sizeOut);
  if (style) result += ` ${style}`;
  if (colorTuple.length > 0) {
    const resolved = getThemeColor(colorTuple.join(' '));
    if (resolved !== undefined) result += ` ${resolved}`;
  }
  return result.trim();
};
