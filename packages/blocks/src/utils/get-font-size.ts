/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/utils/get-font-size/get-font-size.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 */
import { rem } from './rem.ts';

const KNOWN_KEYS = new Set(['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl']);

export function getFontSize(value: string | number | undefined): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') return rem(value);
  if (KNOWN_KEYS.has(value)) return `var(--font-size-${value})`;
  return value;
}
