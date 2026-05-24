import type { ResolvedTheme, ThemeDefinition, ThemeTokens } from './types.ts';
import { normalizeComponents } from './normalize-components.ts';

/**
 * Merges a child theme definition on top of a resolved base theme.
 *
 * - tokens: deep-merged per-family
 * - dark: same
 * - vocabulary: per-axis replace (vocabularies are atomic; child axis fully replaces base axis)
 * - semanticTokens: per-slot deep merge (child keys override base keys within each slot)
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
    // Vocabulary: per-axis replace (vocabularies are atomic; child axis fully replaces base axis)
    vocabulary: {
      ...base.vocabulary,
      ...(child.vocabulary ?? {}),
    },
    // SemanticTokens: per-slot deep merge (child keys override base keys within each slot)
    semanticTokens: {
      text: { ...base.semanticTokens?.text, ...(child.semanticTokens?.text ?? {}) },
      surface: { ...base.semanticTokens?.surface, ...(child.semanticTokens?.surface ?? {}) },
      border: { ...base.semanticTokens?.border, ...(child.semanticTokens?.border ?? {}) },
      ...((base.semanticTokens?.accent || child.semanticTokens?.accent) && {
        accent: { ...base.semanticTokens?.accent, ...(child.semanticTokens?.accent ?? {}) },
      }),
    },
    intentResolver: child.intentResolver ?? base.intentResolver,
    components: { ...base.components, ...normalizeComponents(child.components) },
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
    fontWeight: { ...(base.fontWeight ?? {}), ...(child.fontWeight ?? {}) },
    lineHeight: { ...(base.lineHeight ?? {}), ...(child.lineHeight ?? {}) },
    shadow: { ...(base.shadow ?? {}), ...(child.shadow ?? {}) },
    breakpoint: { ...(base.breakpoint ?? {}), ...(child.breakpoint ?? {}) },
    zIndex: { ...(base.zIndex ?? {}), ...(child.zIndex ?? {}) },
    heading: mergeHeadingTokens(base.heading, child.heading),
  };
}

function mergeHeadingTokens(
  base: ThemeTokens['heading'],
  child: ThemeTokens['heading'],
): ThemeTokens['heading'] {
  if (!base && !child) return undefined;
  if (!base) return child;
  if (!child) return base;
  return {
    sizes: { ...base.sizes, ...child.sizes },
    textWrap: child.textWrap ?? base.textWrap,
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
