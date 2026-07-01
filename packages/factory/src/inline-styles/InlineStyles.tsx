/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/InlineStyles/InlineStyles.tsx
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Drops Mantine's nonce + dedupe machinery for v1 (added later if needed)
 *   - Simplified API: a selector + base styles + media-query map
 */

export interface InlineStylesProps {
  /** CSS selector the rules apply to (typically a per-instance class like `.sb-r1`) */
  selector: string;
  /** Base (non-responsive) styles */
  styles: Record<string, unknown>;
  /** Per-media-query styles. Keys are full media query expressions like `(min-width: 48em)`. */
  media: Record<string, Record<string, unknown>>;
}

function camelToKebab(s: string): string {
  // CSS custom properties (already starting with --) pass through unchanged
  if (s.startsWith('--')) return s;
  return s.replace(/([A-Z])/g, '-$1').toLowerCase();
}

function rulesFromStyles(styles: Record<string, unknown>): string {
  return Object.entries(styles)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([prop, value]) => `${camelToKebab(prop)}: ${value};`)
    .join(' ');
}

/**
 * Renders a `<style>` block scoped to a selector with optional media-query rules.
 * Used by Box / Flex / Grid / SimpleGrid / Container to support responsive
 * `StyleProp<T>` props (`p={{ base: 'xs', md: 'lg' }}`).
 *
 * Parity note (ST-05): when `styles` is empty or all values are undefined/null,
 * no base rule is emitted — matches Mantine's behavior of omitting empty rules.
 */
export function InlineStyles({ selector, styles, media }: InlineStylesProps) {
  const baseDecls = rulesFromStyles(styles);
  const baseRule = baseDecls ? `${selector} { ${baseDecls} }` : '';
  const mediaRules = Object.entries(media)
    .map(
      ([query, mStyles]) =>
        `@media ${query} { ${selector} { ${rulesFromStyles(mStyles)} } }`,
    )
    .join(' ');
  const css = [baseRule, mediaRules].filter(Boolean).join(' ');
  // dangerouslySetInnerHTML (Mantine-matched): text children are HTML-escaped
  // by react-dom/server, which breaks quoted CSS values under SSR.
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
