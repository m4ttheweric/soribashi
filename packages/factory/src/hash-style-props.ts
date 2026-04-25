/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/Box/hash-style-props/hash-style-props.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Class prefix: 'm-' → 'sb-h-'
 *   - djb2 hash for determinism
 */

function hash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}

/**
 * Deterministic hash of a styles object plus a media-queries map.
 * Used to dedupe identical responsive style blocks across many instances of
 * the same component (e.g., 1000 `<Group>` instances with the same gap props
 * generate one shared style block instead of 1000 distinct ones).
 *
 * Returns a CSS-class-safe identifier; the same input always hashes to the
 * same string.
 */
export function hashStyleProps(
  styles: Record<string, unknown>,
  media: Record<string, Record<string, unknown>>,
): string {
  const serialized = JSON.stringify(styles) + '|' + JSON.stringify(media);
  return `sb-h-${hash(serialized)}`;
}
