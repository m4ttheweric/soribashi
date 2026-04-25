/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/utils/units-converters/rem.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - No scale support (we don't wrap in calc(…* var(--scale)))
 *   - Returns undefined for undefined/null input
 *   - Handles comma-separated values (mirrors Mantine's converter)
 */

/**
 * Converts a value to a rem string.
 *
 *   rem(16)              => '1rem'
 *   rem(0)               => '0rem'
 *   rem('8px')           => '0.5rem'
 *   rem('16px 32px')     => '1rem 2rem'
 *   rem('calc(...)')     => 'calc(...)' (pass-through)
 *   rem('var(--x)')      => 'var(--x)'  (pass-through)
 *   rem('1.5rem')        => '1.5rem'    (pass-through — not a px number)
 *   rem('100%')          => '100%'      (pass-through)
 *   rem(undefined)       => undefined
 */
export function rem(value: number | string | undefined | null): string | undefined {
  if (value === undefined || value === null) return undefined;

  if (value === 0 || value === '0') {
    return '0rem';
  }

  if (typeof value === 'number') {
    return `${value / 16}rem`;
  }

  if (typeof value === 'string') {
    if (value === '') return value;

    // Pass through CSS function expressions unchanged
    if (
      value.startsWith('calc(') ||
      value.startsWith('clamp(') ||
      value.startsWith('var(') ||
      value.includes('rgba(')
    ) {
      return value;
    }

    // Recurse on comma-separated values
    if (value.includes(',')) {
      return value
        .split(',')
        .map((v) => rem(v) ?? v)
        .join(',');
    }

    // Recurse on space-separated values
    if (value.includes(' ')) {
      return value
        .split(' ')
        .map((v) => rem(v) ?? v)
        .join(' ');
    }

    // Convert px strings: strip 'px', parse as number, divide by 16
    const stripped = value.replace('px', '');
    if (!Number.isNaN(Number(stripped))) {
      return `${Number(stripped) / 16}rem`;
    }
  }

  return value as string;
}
