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
 *   - Cross-references light and dark colour dedup (see `dedupColorScale`'s
 *     `darkColors` parameter). Mantine's two-block emitter can dedup light and
 *     dark independently because each block restates whatever it keeps.
 *     Soribashi's emitter pairs them into a single `light-dark(light, dark)`
 *     declaration keyed off the LIGHT side (see emit-css.ts's pairValue/
 *     emitTokenLines), so a light entry that gets dropped for matching the
 *     default is never visited again, even when its dark counterpart survives
 *     dedup. A colour key whose dark override survives must therefore force
 *     its light entry to survive too, or the override is silently dropped.
 */
import type { PartialThemeTokens, ResolvedTheme, ThemeTokens } from '../theme/index.ts';
import { defaultDarkTokens, defaultTokens } from '../theme/index.ts';

function dedupRecord(
  current: Record<string, string> | undefined,
  base: Record<string, string> | undefined,
  keepKeys?: ReadonlySet<string>,
): Record<string, string> {
  if (!current) return {};
  if (!base) return { ...current };
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(current)) {
    if (base[key] !== value || keepKeys?.has(key)) result[key] = value;
  }
  return result;
}

/**
 * `darkColors` is the ALREADY-DEDUPED dark colour tree (dark values that
 * differ from defaultDarkTokens). A light shade whose key appears there
 * carries a real dark override, so it must survive here even when it
 * matches the light default: emitTokenLines's pairing walks light keys only,
 * so a dropped light entry makes the surviving dark override unreachable
 * (see the module doc comment above).
 */
function dedupColorScale(
  current: Record<string, Record<string, string>> | undefined,
  base: Record<string, Record<string, string>> | undefined,
  darkColors: PartialThemeTokens['colors'],
): Record<string, Record<string, string>> {
  if (!current) return {};
  const result: Record<string, Record<string, string>> = {};
  for (const [family, shades] of Object.entries(current)) {
    const baseShades = base?.[family];
    const darkShades = darkColors?.[family];
    const keepKeys = darkShades ? new Set(Object.keys(darkShades)) : undefined;
    const dedupedShades = dedupRecord(shades, baseShades, keepKeys);
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
  darkColors?: PartialThemeTokens['colors'],
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
    colors: dedupColorScale(current.colors, base.colors, darkColors),
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
 *
 * Dark is deduped first so its surviving colour keys can be threaded into the
 * light dedup as forced keepers (see dedupColorScale's doc comment and the
 * module header comment above).
 */
export function removeDefaultVariables(theme: ResolvedTheme): ResolvedTheme {
  const dark = dedupPartialTokens(theme.dark, defaultDarkTokens) ?? {};
  return {
    ...theme,
    tokens: dedupTokens(theme.tokens, defaultTokens, dark.colors),
    dark,
  };
}
