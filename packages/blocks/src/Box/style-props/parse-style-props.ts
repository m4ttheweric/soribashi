/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/Box/style-props/parse-style-props/parse-style-props.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Themes may omit breakpoint tokens (Mantine themes always have them), so
 *     media queries fall back to the default breakpoint map with a dev warning
 *     instead of collapsing to an always-true `(min-width: 0)` bucket.
 */
import { defaultTokens, type ResolvedTheme } from '@soribashi/theme';
import { isDev } from '../../utils/is-dev.ts';
import type {
  ParsedStyleProps,
  StylePropDefinition,
} from './style-types.ts';

const BREAKPOINT_KEYS = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
type BreakpointKey = (typeof BREAKPOINT_KEYS)[number];

function isResponsiveValue(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const keys = Object.keys(value as Record<string, unknown>);
  // Mirror Mantine's hasResponsiveStyles: a base-only object is NOT responsive
  // (it's equivalent to the flat value). Only treat as responsive when at least
  // one named breakpoint key is present.
  // Source: parse-style-props.ts@63dafbbf — hasResponsiveStyles() check
  if (keys.length === 1 && keys[0] === 'base') return false;
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

const warnedMissingBreakpoints = new Set<string>();

function mediaQueryFor(theme: ResolvedTheme, key: BreakpointKey): string | undefined {
  const themed = theme.tokens.breakpoint?.[key];
  if (themed) return `(min-width: ${themed})`;
  if (isDev() && !warnedMissingBreakpoints.has(key)) {
    warnedMissingBreakpoints.add(key);
    // eslint-disable-next-line no-console
    console.warn(
      `[soribashi] theme.tokens.breakpoint has no "${key}" token; falling back to the default breakpoint map.`,
    );
  }
  const fallback = defaultTokens.breakpoint?.[key];
  return fallback ? `(min-width: ${fallback})` : undefined;
}

export interface ParseStylePropsInput {
  styleProps: Record<string, unknown>;
  data: Record<string, StylePropDefinition>;
  theme: ResolvedTheme;
}

/**
 * Extracts the effective "base" value from a style prop that may be either a
 * flat value or a base-only responsive object (e.g. `{ base: 'md' }`).
 *
 * Mirrors Mantine's `getBaseValue` (parse-style-props.ts@63dafbbf).
 */
function getBaseValue(value: unknown): unknown {
  if (value !== null && typeof value === 'object' && 'base' in value) {
    return (value as Record<string, unknown>).base;
  }
  return value;
}

/**
 * Walks a styleProps record and produces resolved CSS.
 *
 *   - Static values go into `inlineStyles` (applied via the element's `style` attr)
 *   - Responsive object values are split: `base` goes into `styles`, each
 *     breakpoint goes into `media[<query>]`
 *   - base-only objects (`{ base: 'md' }`) are treated as non-responsive and
 *     land in `inlineStyles` (matches Mantine's hasResponsiveStyles check)
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
        if (query === undefined) continue;
        media[query] ??= {};
        applyToProperty(media[query]!, def.property, resolved);
      }
    } else {
      // For base-only objects like { base: 'md' }, extract the base value before resolving.
      const flatValue = getBaseValue(propValue);
      if (flatValue === undefined || flatValue === null) continue;
      const resolved = def.resolver(flatValue);
      if (resolved !== undefined) applyToProperty(inlineStyles, def.property, resolved);
    }
  }

  return { hasResponsiveStyles, inlineStyles, styles, media };
}
