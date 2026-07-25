/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/utils/get-shadow/get-shadow.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Replaced the closed sm..xl allowlist with open-ended token resolution via
 *     getSize (matching getSpacing/getRadius): any token-looking key becomes
 *     var(--shadow-{key}), raw CSS shadows pass through.
 */
import { getSize } from './get-size.ts';

/**
 * Resolves a box-shadow value to a CSS string:
 *   - token key ('xs', 'md', 'custom-key') → var(--shadow-{key})
 *   - raw CSS shadow ('0 1px 2px black', 'inset 0 1px 2px black', 'none') → pass-through
 *   - undefined → undefined
 */
export function getShadow(value: string | undefined): string | undefined {
  if (value === undefined || value === null) return undefined;
  // box-shadow: none is valid CSS; 'none' is not a plausible shadow token key
  if (value === 'none') return value;
  return getSize(value, 'shadow');
}
