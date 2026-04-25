/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/utils/rem/rem.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Simpler signature (single value, not array; we don't yet need scale support)
 *   - Returns undefined for undefined input rather than throwing
 */

/**
 * Converts a pixel number to a rem string. Pass-through for non-numeric strings.
 *
 *   rem(16)       => '1rem'
 *   rem(8)        => '0.5rem'
 *   rem('1.5rem') => '1.5rem'
 *   rem('var(--x)') => 'var(--x)'
 */
export function rem(value: number | string | undefined): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') return value;
  return `${value / 16}rem`;
}
