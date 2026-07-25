/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/utils/get-size/get-size.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Token names use soribashi prefix convention (no --mantine- prefix)
 *   - Replaced STANDARD_KEYS allowlist with Mantine's isNumberLike heuristic:
 *     any string that looks like a raw CSS value passes through; everything
 *     else is treated as a design-token key and resolved to var(--prefix-key).
 *   - Adds an explicit CSS keyword allowlist (Mantine instead routes unknown
 *     strings through rem(), which passes them through unchanged).
 */
import { rem } from './rem.ts';

/**
 * CSS-wide keywords plus intrinsic sizing keywords that must never be
 * mistaken for design-token keys (mx="auto" is not var(--spacing-auto)).
 * Exported for sibling resolvers (get-shadow, get-line-height, get-title-size)
 * that share the raw-vs-token heuristic but emit different var prefixes.
 */
const CSS_KEYWORDS = new Set([
  'auto',
  'inherit',
  'initial',
  'unset',
  'revert',
  'revert-layer',
  'fit-content',
  'max-content',
  'min-content',
]);

/**
 * Returns true when `value` should be treated as a raw CSS value rather
 * than a design-token key.  Mirrors Mantine's `isNumberLike` heuristic:
 *   - JS number → true (will be rem()-converted)
 *   - String starting with a digit, '.', or '-' → true (e.g. '100px', '.5rem', '-4')
 *   - String starting with a CSS function  → true (e.g. 'calc(…)', 'var(…)')
 *   - CSS keyword (auto, inherit, fit-content, …) → true
 *   - String containing a space → true (multi-value CSS; token keys have no spaces)
 *   - Anything else                         → false → treat as token key
 */
export function isRawCss(value: string): boolean {
  const first = value[0];
  if (first === undefined) return false;
  if (CSS_KEYWORDS.has(value)) return true;
  if (value.includes(' ')) return true;
  // Digit-leading, dot-leading, or signed number
  if ((first >= '0' && first <= '9') || first === '.' || first === '-' || first === '+') {
    return true;
  }
  // CSS function tokens
  if (
    value.startsWith('calc(') ||
    value.startsWith('var(') ||
    value.startsWith('clamp(') ||
    value.startsWith('min(') ||
    value.startsWith('max(') ||
    value.startsWith('env(') ||
    value.startsWith('rgba(') ||
    value.startsWith('rgb(') ||
    value.startsWith('hsla(') ||
    value.startsWith('hsl(') ||
    value.includes('rgba(')
  ) {
    return true;
  }
  return false;
}

/**
 * Generic size resolver parameterized by a CSS variable prefix.
 *
 *   getSize('md', 'container-size')       => 'var(--container-size-md)'
 *   getSize('custom-key', 'container')    => 'var(--container-custom-key)'
 *   getSize(16, 'whatever')               => '1rem'
 *   getSize('40rem', 'whatever')          => '40rem'
 *   getSize('100px', 'whatever')          => '100px'
 *   getSize('calc(100% - 8px)', 'foo')    => 'calc(100% - 8px)'
 *   getSize(undefined, 'foo')             => undefined
 */
export function getSize(value: string | number | undefined, prefix: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') return rem(value);
  if (isRawCss(value)) return value;
  return `var(--${prefix}-${value})`;
}
