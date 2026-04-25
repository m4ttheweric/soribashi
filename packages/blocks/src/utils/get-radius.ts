/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/utils/get-radius/get-radius.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 */
import { rem } from './rem.ts';

const KNOWN_KEYS = new Set(['sm', 'md', 'lg', 'xl', '2xl', 'full']);

export function getRadius(value: string | number | undefined): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') return rem(value);
  if (KNOWN_KEYS.has(value)) return `var(--radius-${value})`;
  return value;
}
