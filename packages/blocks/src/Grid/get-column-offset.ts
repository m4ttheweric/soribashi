/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/components/Grid/GridCol/GridColVariables.tsx
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Extracted as a standalone module
 *   - `columns` parameter is explicit (Mantine reads it from context)
 */

/**
 * Returns the CSS `margin-inline-start` value for a Grid column offset.
 *
 * - `offset === 0` → `'0'`
 * - `undefined` → `undefined` (no override)
 * - numeric → `calc(${pct}% + ${gapFactor} * var(--grid-column-gap))`
 */
export function getColumnOffset(offset: number | undefined, columns: number): string | undefined {
  if (offset === 0) {
    return '0';
  }

  if (!offset) {
    return undefined;
  }

  const percentage = (100 * offset) / columns;
  const gapFactor = offset / columns;
  return `calc(${percentage}% + ${gapFactor} * var(--grid-column-gap))`;
}
