/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/Box/style-props/parse-style-props/parse-style-props.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 */
import type { ResolvedTheme } from '@soribashi/theme';
import type {
  ParsedStyleProps,
  StylePropDefinition,
} from './style-types.ts';

const BREAKPOINT_KEYS = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
type BreakpointKey = (typeof BREAKPOINT_KEYS)[number];

function isResponsiveValue(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const keys = Object.keys(value as Record<string, unknown>);
  return keys.some((k) => k === 'base' || (BREAKPOINT_KEYS as readonly string[]).includes(k));
}

function applyToProperty(
  target: Record<string, string>,
  property: string | string[],
  resolved: string,
): void {
  if (Array.isArray(property)) {
    for (const p of property) target[p] = resolved;
  } else {
    target[property] = resolved;
  }
}

function mediaQueryFor(theme: ResolvedTheme, key: BreakpointKey): string {
  const value = theme.tokens.breakpoint?.[key];
  if (!value) return `(min-width: 0)`;
  return `(min-width: ${value})`;
}

export interface ParseStylePropsInput {
  styleProps: Record<string, unknown>;
  data: Record<string, StylePropDefinition>;
  theme: ResolvedTheme;
}

/**
 * Walks a styleProps record and produces resolved CSS.
 *
 *   - Static values go into `inlineStyles` (applied via the element's `style` attr)
 *   - Responsive object values are split: `base` goes into `styles`, each
 *     breakpoint goes into `media[<query>]`
 */
export function parseStyleProps(input: ParseStylePropsInput): ParsedStyleProps {
  const inlineStyles: Record<string, string> = {};
  const styles: Record<string, string> = {};
  const media: Record<string, Record<string, string>> = {};
  let hasResponsiveStyles = false;

  for (const [propName, propValue] of Object.entries(input.styleProps)) {
    if (propValue === undefined || propValue === null) continue;
    const def = input.data[propName];
    if (!def) continue;

    if (isResponsiveValue(propValue)) {
      hasResponsiveStyles = true;
      const responsive = propValue as Partial<Record<'base' | BreakpointKey, unknown>>;

      if (responsive.base !== undefined) {
        const resolved = def.resolver(responsive.base);
        if (resolved !== undefined) applyToProperty(styles, def.property, resolved);
      }

      for (const bp of BREAKPOINT_KEYS) {
        if (responsive[bp] === undefined) continue;
        const resolved = def.resolver(responsive[bp]);
        if (resolved === undefined) continue;
        const query = mediaQueryFor(input.theme, bp);
        media[query] ??= {};
        applyToProperty(media[query]!, def.property, resolved);
      }
    } else {
      const resolved = def.resolver(propValue);
      if (resolved !== undefined) applyToProperty(inlineStyles, def.property, resolved);
    }
  }

  return { hasResponsiveStyles, inlineStyles, styles, media };
}
