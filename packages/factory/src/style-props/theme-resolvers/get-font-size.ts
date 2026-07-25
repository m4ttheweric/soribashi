/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/utils/get-font-size/get-font-size.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Token names: --mantine-font-size-{key} → --font-size-{key}
 *   - Replaced KNOWN_KEYS allowlist with open-ended token resolution via getSize;
 *     any non-numeric, non-CSS-function string is treated as a token key.
 */
import { getSize } from './get-size.ts';

/**
 * Resolves a font-size value to a CSS string:
 *   - number → rem string
 *   - token key → var(--font-size-{key})
 *   - raw CSS value → pass-through
 *   - undefined → undefined
 */
export function getFontSize(value: string | number | undefined): string | undefined {
  return getSize(value, 'font-size');
}
