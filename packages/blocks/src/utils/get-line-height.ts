/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/utils/get-line-height/get-line-height.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 */

const KNOWN_KEYS = new Set(['xs', 'sm', 'md', 'lg', 'xl']);

export function getLineHeight(value: string | number | undefined): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') return value.toString();
  if (KNOWN_KEYS.has(value)) return `var(--line-height-${value})`;
  return value;
}
