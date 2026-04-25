import type { ResolvedTheme, ThemeDefinition, ThemeTokens } from './types.ts';

/**
 * Merges a child theme definition on top of a resolved base theme.
 *
 * - tokens: deep-merged per-family
 * - dark: same
 * - semantic: shallow-merged per category (text/surface/border merged key-by-key; intent/variant replaced if specified)
 * - components: shallow-merged (each child entry REPLACES base's entry for that component)
 * - scope, darkMode, name, intentResolver: child overrides if present
 */
export function composeTheme(base: ResolvedTheme, child: ThemeDefinition): ThemeDefinition {
  return {
    tokens: mergeTokens(base.tokens, child.tokens),
    dark: mergeTokens(
      base.dark as ThemeTokens,
      (child.dark ?? {}) as ThemeTokens,
    ) as ThemeDefinition['dark'],
    semantic: {
      intent: child.semantic?.intent ?? base.semantic.intent,
      variant: child.semantic?.variant ?? base.semantic.variant,
      text: { ...base.semantic.text, ...(child.semantic?.text ?? {}) },
      surface: { ...base.semantic.surface, ...(child.semantic?.surface ?? {}) },
      border: { ...base.semantic.border, ...(child.semantic?.border ?? {}) },
    },
    intentResolver: child.intentResolver ?? base.intentResolver,
    components: { ...base.components, ...(child.components ?? {}) },
    scope: child.scope ?? base.scope,
    darkMode: child.darkMode ?? base.darkMode,
    name: child.name ?? base.name,
  };
}

function mergeTokens(base: ThemeTokens, child: ThemeTokens): ThemeTokens {
  return {
    colors: mergeNamedScales(base.colors ?? {}, child.colors ?? {}),
    radius: { ...(base.radius ?? {}), ...(child.radius ?? {}) },
    spacing: { ...(base.spacing ?? {}), ...(child.spacing ?? {}) },
    fontSize: { ...(base.fontSize ?? {}), ...(child.fontSize ?? {}) },
    fontFamily: { ...(base.fontFamily ?? {}), ...(child.fontFamily ?? {}) },
    shadow: { ...(base.shadow ?? {}), ...(child.shadow ?? {}) },
    breakpoint: { ...(base.breakpoint ?? {}), ...(child.breakpoint ?? {}) },
    zIndex: { ...(base.zIndex ?? {}), ...(child.zIndex ?? {}) },
  };
}

function mergeNamedScales(
  base: ThemeTokens['colors'],
  child: ThemeTokens['colors'],
): ThemeTokens['colors'] {
  const result: ThemeTokens['colors'] = { ...base };
  for (const [name, scale] of Object.entries(child)) {
    result[name] = { ...(base[name] ?? {}), ...scale };
  }
  return result;
}
