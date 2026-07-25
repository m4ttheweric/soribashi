/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/utils/get-radius/get-radius.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Token names: --mantine-radius-{key} → --radius-{key}
 *   - undefined falls back to 'var(--radius-md)' (maps --mantine-radius-default)
 *   - Replaced KNOWN_KEYS allowlist with open-ended token resolution via getSize;
 *     any non-numeric, non-CSS-function string is treated as a token key.
 */
import { getSize } from './get-size.ts';

/**
 * Resolves a border-radius value to a CSS string:
 *   - undefined → 'var(--radius-md)' (default radius fallback)
 *   - number → rem string
 *   - token key → var(--radius-{key})
 *   - raw CSS value → pass-through
 */
export function getRadius(value: string | number | undefined): string {
  if (value === undefined || value === null) return 'var(--radius-md)';
  return getSize(value, 'radius') as string;
}
