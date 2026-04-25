/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/utils/get-size/get-size.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 */
import { rem } from './rem.ts';

const STANDARD_KEYS = new Set(['xs', 'sm', 'md', 'lg', 'xl']);

/**
 * Generic size resolver parameterized by a CSS variable prefix.
 *
 *   getSize('md', 'container-size')  // => 'var(--container-size-md)'
 *   getSize(16,    'whatever')        // => '1rem'
 *   getSize('40rem', 'whatever')      // => '40rem'
 */
export function getSize(
  value: string | number | undefined,
  prefix: string,
): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') return rem(value);
  if (STANDARD_KEYS.has(value)) return `var(--${prefix}-${value})`;
  return value;
}
