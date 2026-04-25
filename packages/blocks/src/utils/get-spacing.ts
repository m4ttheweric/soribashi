/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/utils/get-spacing/get-spacing.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Token names: --mantine-spacing-{key} → --spacing-{key}
 *   - KNOWN_KEYS expanded for soribashi spacing scale
 */
import { rem } from './rem.ts';

const KNOWN_KEYS = new Set(['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl']);

/**
 * Resolves a spacing value to a CSS string:
 *   - number → rem string
 *   - known token key (xs/sm/md/lg/xl/2xl/3xl) → var(--spacing-{key})
 *   - any other string → passes through verbatim (raw CSS)
 */
export function getSpacing(value: string | number | undefined): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') return rem(value);
  if (KNOWN_KEYS.has(value)) return `var(--spacing-${value})`;
  return value;
}
