/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/components/Grid/Grid.context.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Stripped Mantine-specific `getStyles`/`breakpoints`/`type` from context value
 *   - Retains only what soribashi's flat-value v1 implementation needs
 */
import { createContext, useContext } from 'react';

export interface GridContextValue {
  /** Number of columns in the grid @default 12 */
  columns: number;
  /** If true, incomplete rows expand to fill available space @default false */
  grow: boolean | undefined;
}

const GridContext = createContext<GridContextValue>({ columns: 12, grow: undefined });

export const GridProvider = GridContext.Provider;

export function useGridContext(): GridContextValue {
  return useContext(GridContext);
}
