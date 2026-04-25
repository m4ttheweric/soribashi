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

import { type ColSpan, getColumnFlexBasis } from './get-column-flex-basis.ts';

/**
 * Returns the CSS `max-width` value for a Grid column.
 *
 * - `grow` or `span === 'auto'` → `'100%'` (fill available space)
 * - `'content'` → `'unset'`
 * - numeric span → same calc as `getColumnFlexBasis` (constrains the max)
 */
export function getColumnMaxWidth(
  colSpan: ColSpan | undefined,
  columns: number,
  grow: boolean | undefined,
): string | undefined {
  if (grow || colSpan === 'auto') {
    return '100%';
  }

  if (colSpan === 'content') {
    return 'unset';
  }

  return getColumnFlexBasis(colSpan, columns);
}
