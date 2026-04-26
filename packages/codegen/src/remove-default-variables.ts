/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/MantineProvider/MantineCssVariables/remove-default-variables.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Operates on ResolvedTheme (the in-memory token tree) rather than Mantine's
 *     ConvertCSSVariablesInput shape ({variables, light, dark}). Same semantics,
 *     different layer.
 *   - Returns a diff'd ResolvedTheme that the existing `emitCss` pipeline consumes.
 *   - Dedup baseline is the soribashi default tokens (defaultTokens / defaultDarkTokens),
 *     not the user's `extends` chain. Matches Mantine.
 */
import type { ResolvedTheme, PartialThemeTokens, ThemeTokens } from '@soribashi/theme';
import { defaultTokens, defaultDarkTokens } from '@soribashi/theme';

function dedupRecord(
  current: Record<string, string> | undefined,
  base: Record<string, string> | undefined,
): Record<string, string> {
  if (!current) return {};
  if (!base) return { ...current };
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(current)) {
    if (base[key] !== value) result[key] = value;
  }
  return result;
}

function dedupColorScale(
  current: Record<string, Record<string, string>> | undefined,
  base: Record<string, Record<string, string>> | undefined,
): Record<string, Record<string, string>> {
  if (!current) return {};
  const result: Record<string, Record<string, string>> = {};
  for (const [family, shades] of Object.entries(current)) {
    const baseShades = base?.[family];
    const dedupedShades = dedupRecord(shades, baseShades);
    if (Object.keys(dedupedShades).length > 0) result[family] = dedupedShades;
  }
  return result;
}

function dedupHeading(
  current: ThemeTokens['heading'] | undefined,
  base: ThemeTokens['heading'] | undefined,
): ThemeTokens['heading'] | undefined {
  if (!current) return undefined;
  const sizes: Partial<NonNullable<ThemeTokens['heading']>['sizes']> = {};
  if (current.sizes) {
    for (const [order, size] of Object.entries(current.sizes)) {
      const baseSize = base?.sizes?.[order as keyof typeof base.sizes];
      const dedupedSize: Record<string, string> = {};
      let hasOverride = false;
      for (const [key, value] of Object.entries(size ?? {})) {
        if (baseSize?.[key as keyof typeof baseSize] !== value) {
          dedupedSize[key] = value as string;
          hasOverride = true;
        }
      }
      if (hasOverride) (sizes as Record<string, unknown>)[order] = dedupedSize;
    }
  }
  const textWrap = current.textWrap === base?.textWrap ? undefined : current.textWrap;
  if (Object.keys(sizes).length === 0 && textWrap === undefined) return undefined;
  return { sizes: sizes as NonNullable<ThemeTokens['heading']>['sizes'], textWrap };
}

function dedupTokens(
  current: ThemeTokens | undefined,
  base: ThemeTokens,
): ThemeTokens {
  if (!current) {
    // Return an empty-ish ThemeTokens so callers can safely access sub-fields
    return {
      colors: {},
      radius: {},
      spacing: {},
      fontSize: {},
    };
  }
  return {
    colors: dedupColorScale(current.colors, base.colors),
    radius: dedupRecord(current.radius, base.radius),
    spacing: dedupRecord(current.spacing, base.spacing),
    fontSize: dedupRecord(current.fontSize, base.fontSize),
    fontFamily: dedupRecord(current.fontFamily, base.fontFamily),
    fontWeight: dedupRecord(current.fontWeight, base.fontWeight),
    lineHeight: dedupRecord(current.lineHeight, base.lineHeight),
    shadow: dedupRecord(current.shadow, base.shadow),
    breakpoint: dedupRecord(current.breakpoint, base.breakpoint),
    zIndex: dedupRecord(
      current.zIndex as Record<string, string> | undefined,
      base.zIndex as Record<string, string> | undefined,
    ),
    heading: dedupHeading(current.heading, base.heading),
  };
}

function dedupPartialTokens(
  current: PartialThemeTokens | undefined,
  base: PartialThemeTokens | undefined,
): PartialThemeTokens | undefined {
  if (!current) return undefined;
  if (!base) return current;
  return dedupTokens(current as ThemeTokens, base as ThemeTokens);
}

/**
 * Returns a "diff theme" — same shape as the input, but with token entries that
 * match the soribashi default tokens removed. `emitCss(diffTheme)` produces a
 * smaller CSS file.
 */
export function removeDefaultVariables(theme: ResolvedTheme): ResolvedTheme {
  return {
    ...theme,
    tokens: dedupTokens(theme.tokens, defaultTokens),
    dark: dedupPartialTokens(theme.dark, defaultDarkTokens) ?? {},
  };
}
