/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/utils/get-spacing/get-spacing.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Token names: --mantine-spacing-{key} → --spacing-{key}
 *   - Replaced KNOWN_KEYS allowlist with open-ended token resolution via getSize;
 *     any non-numeric, non-CSS-function string is treated as a token key.
 */
import { getSize } from './get-size.ts';

/**
 * Resolves a spacing value to a CSS string:
 *   - number → rem string (e.g. 16 → '1rem')
 *   - token key (any non-digit-leading string) → var(--spacing-{key})
 *   - raw CSS value (digit-leading or CSS function) → pass-through
 *   - undefined → undefined
 */
export function getSpacing(value: string | number | undefined): string | undefined {
  return getSize(value, 'spacing');
}
