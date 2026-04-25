/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/utils/get-shadow/get-shadow.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 */

const KNOWN_KEYS = new Set(['sm', 'md', 'lg', 'xl']);

export function getShadow(value: string | undefined): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (KNOWN_KEYS.has(value)) return `var(--shadow-${value})`;
  return value;
}
