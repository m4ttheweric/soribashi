/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/components/Grid/GridCol/GridColVariables.tsx
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Extracted as a standalone module (Mantine inlines helpers in GridColVariables.tsx)
 *   - `columns` parameter is explicit (Mantine reads it from context)
 */

export type ColSpan = number | 'auto' | 'content';

/**
 * Returns the CSS `flex-basis` value for a Grid column.
 *
 * - `'content'` → `'auto'` (shrink to content width)
 * - `'auto'`    → `'0rem'` (participate in flex grow distribution)
 * - `span === columns` → `'100%'` (full row, no gap subtraction needed)
 * - numeric span → `calc(${pct}% - ${gapFactor} * var(--grid-column-gap))`
 */
export function getColumnFlexBasis(
  colSpan: ColSpan | undefined,
  columns: number,
): string | undefined {
  if (colSpan === 'content') {
    return 'auto';
  }

  if (colSpan === 'auto') {
    return '0rem';
  }

  if (!colSpan) {
    return undefined;
  }

  if (colSpan === columns) {
    return '100%';
  }

  const percentage = (100 * colSpan) / columns;
  const gapFactor = (columns - colSpan) / columns;
  return `calc(${percentage}% - ${gapFactor} * var(--grid-column-gap))`;
}
