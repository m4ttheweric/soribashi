/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/components/Group/filter-falsy-children/filter-falsy-children.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 */
import { Children, type ReactNode } from 'react';

/**
 * Returns the truthy children of a node.
 * Used by Group to compute child count for the preventGrowOverflow childWidth math.
 */
export function filterFalsyChildren(children: ReactNode): ReactNode[] {
  return Children.toArray(children).filter(Boolean);
}
