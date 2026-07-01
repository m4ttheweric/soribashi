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
 *   - Breakpoint keys are derived from theme.tokens.breakpoint at parse time
 *     (falling back to the default map) instead of a hardcoded xs..xl list, so
 *     2xl/3xl and custom theme breakpoints resolve.
 *   - Non-string/non-number values never resolve; they emit nothing plus a dev
 *     warning (Mantine string-coerces, which produced [object Object] output).
 */
import { defaultTokens, type ResolvedTheme } from '@soribashi/theme';
import { isDev } from '../../utils/is-dev.ts';
import type {
  ParsedStyleProps,
  StylePropDefinition,
} from './style-types.ts';

const DEFAULT_BREAKPOINT_KEYS = Object.keys(defaultTokens.breakpoint ?? {});

function breakpointKeysFor(theme: ResolvedTheme): readonly string[] {
  const themed = theme.tokens.breakpoint;
  if (themed && Object.keys(themed).length > 0) return Object.keys(themed);
  return DEFAULT_BREAKPOINT_KEYS;
}

function isResponsiveValue(
  value: unknown,
  breakpointKeys: readonly string[],
): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const keys = Object.keys(value as Record<string, unknown>);
  // Mirror Mantine's hasResponsiveStyles: a base-only object is NOT responsive
  // (it's equivalent to the flat value). Only treat as responsive when at least
  // one named breakpoint key is present.
  // Source: parse-style-props.ts@63dafbbf — hasResponsiveStyles() check
  if (keys.length === 1 && keys[0] === 'base') return false;
  return keys.some((k) => k === 'base' || breakpointKeys.includes(k));
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

function mediaQueryFor(theme: ResolvedTheme, key: string): string | undefined {
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
 * Resolves one style-prop value, refusing anything that is not a string or a
 * number: resolvers string-coerce, so objects would otherwise end up in the
 * CSS as `var(--spacing-[object Object])`.
 */
function resolveStylePropValue(
  def: StylePropDefinition,
  propName: string,
  value: unknown,
  theme: ResolvedTheme,
): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') {
    if (isDev()) {
      // eslint-disable-next-line no-console
      console.warn(
        `[soribashi] Ignoring style prop "${propName}": expected a string or number value, received ${
          value === null ? 'null' : typeof value
        }.`,
      );
    }
    return undefined;
  }
  return def.resolver(value, theme);
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
  const breakpointKeys = breakpointKeysFor(input.theme);

  for (const [propName, propValue] of Object.entries(input.styleProps)) {
    if (propValue === undefined || propValue === null) continue;
    if (!Object.hasOwn(input.data, propName)) continue;
    const def = input.data[propName];
    if (!def) continue;

    if (isResponsiveValue(propValue, breakpointKeys)) {
      hasResponsiveStyles = true;
      const responsive = propValue as Record<string, unknown>;

      if (responsive.base !== undefined) {
        const resolved = resolveStylePropValue(def, propName, responsive.base, input.theme);
        if (resolved !== undefined) applyToProperty(styles, def.property, resolved);
      }

      for (const bp of breakpointKeys) {
        if (responsive[bp] === undefined) continue;
        const resolved = resolveStylePropValue(def, propName, responsive[bp], input.theme);
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
      const resolved = resolveStylePropValue(def, propName, flatValue, input.theme);
      if (resolved !== undefined) applyToProperty(inlineStyles, def.property, resolved);
    }
  }

  return { hasResponsiveStyles, inlineStyles, styles, media: sortMediaAscending(media) };
}

function minWidthInPx(query: string): number {
  const match = query.match(/min-width:\s*([\d.]+)(rem|em|px)?/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  const value = Number.parseFloat(match[1]!);
  return match[2] === 'px' ? value : value * 16;
}

/**
 * Media rules must be emitted smallest-first: later rules win at equal
 * specificity, so with first-seen ordering an alias pair (ms/mis both set
 * marginInlineStart) could let a smaller breakpoint override a larger one.
 */
function sortMediaAscending(
  media: Record<string, Record<string, string>>,
): Record<string, Record<string, string>> {
  return Object.fromEntries(
    Object.entries(media).sort(([a], [b]) => minWidthInPx(a) - minWidthInPx(b)),
  );
}
