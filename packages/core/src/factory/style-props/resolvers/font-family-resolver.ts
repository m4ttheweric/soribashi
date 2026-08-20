/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/Box/style-props/resolvers/font-family-resolver/font-family-resolver.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Token names: --mantine-font-family → --font-family-sans (per substitution table)
 *   - Token names: --mantine-font-family-monospace → --font-family-mono
 *   - Token names: --mantine-font-family-headings → --font-family-heading
 *   - Adds 'sans' as an alias (matches soribashi tokens.fontFamily.sans key)
 */
import type { StylePropResolver } from '../style-types.ts';

const aliases: Record<string, string> = {
  text: 'var(--font-family-sans)',
  sans: 'var(--font-family-sans)',
  mono: 'var(--font-family-mono)',
  monospace: 'var(--font-family-mono)',
  heading: 'var(--font-family-heading)',
  headings: 'var(--font-family-heading)',
};

export const fontFamilyResolver: StylePropResolver = (value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string' && value in aliases) return aliases[value];
  return String(value);
};
