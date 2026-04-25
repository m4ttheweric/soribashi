/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/components/Grid/GridCol/GridColVariables.tsx
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Extracted as a standalone module
 */

import type { ColSpan } from './get-column-flex-basis.ts';

/**
 * Returns the CSS `flex-grow` value for a Grid column.
 *
 * - `undefined` span → `undefined` (no override)
 * - `'auto'` or `grow=true` → `'1'` (expand to fill remaining space)
 * - otherwise → `'auto'` (do not grow)
 */
export function getColumnFlexGrow(
  colSpan: ColSpan | undefined,
  grow: boolean | undefined,
): string | undefined {
  if (!colSpan) {
    return undefined;
  }

  return colSpan === 'auto' || grow ? '1' : 'auto';
}
