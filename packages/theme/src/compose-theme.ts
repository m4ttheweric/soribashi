import { DEFAULT_VOCABULARIES } from './default-vocabularies.ts';
import { normalizeComponents } from './normalize-components.ts';
import type {
  ComponentThemeConfig,
  ComposableThemeDefinition,
  PartialThemeTokens,
  ResolvedTheme,
  ThemeDefinition,
  ThemeTokens,
  ThemeVocabulary,
} from './types.ts';

/**
 * Merges a child theme definition on top of a resolved base theme.
 *
 * - tokens: deep-merged per-family
 * - dark: same, but only families with actual overrides appear in the result
 * - vocabulary: per-axis replace (vocabularies are atomic; child axis fully replaces base axis)
 * - semanticTokens: per-slot deep merge (child keys override base keys within each slot)
 * - components: per-component field-level merge (child fields win, absent fields inherit)
 * - scope, darkMode, name, intentResolver: child overrides if present
 *
 * The child's `extends` is NOT resolved here; passing one is an error (see below).
 */
export function composeTheme(
  base: ResolvedTheme,
  child: ComposableThemeDefinition,
): ThemeDefinition {
  if (child.extends) {
    throw new Error(
      'composeTheme: the child definition declares `extends`, which composeTheme does not resolve. ' +
        'Resolve it first with createTheme(child), or pass the intended base as the first argument.',
    );
  }

  // Resolve the merged vocabulary so function-form component vocabulary overrides
  // in the child can be evaluated correctly during normalizeComponents below.
  const mergedVocabulary: ThemeVocabulary = {
    size: child.vocabulary?.size ?? base.vocabulary?.size ?? DEFAULT_VOCABULARIES.size,
    intent: child.vocabulary?.intent ?? base.vocabulary?.intent ?? DEFAULT_VOCABULARIES.intent,
    variant: child.vocabulary?.variant ?? base.vocabulary?.variant ?? DEFAULT_VOCABULARIES.variant,
  };

  return {
    tokens: mergeTokens(base.tokens, child.tokens ?? {}),
    dark: mergeDarkTokens(base.dark, child.dark ?? {}),
    // Vocabulary: per-axis replace (vocabularies are atomic; child axis fully replaces base axis)
    vocabulary: mergedVocabulary,
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
    components: mergeComponents(
      base.components,
      normalizeComponents(child.components, mergedVocabulary),
    ),
    scope: child.scope ?? base.scope,
    darkMode: child.darkMode ?? base.darkMode,
    name: child.name ?? base.name,
  };
}

/**
 * Field-level merge per component: a child re-extending `Button` overrides
 * only the fields it declares; the base entry's other fields (classNames,
 * vocabulary, ...) carry through. Matches the deep-merge semantics of every
 * other theme field instead of silently dropping base configuration.
 */
function mergeComponents(
  base: Record<string, ComponentThemeConfig>,
  child: Record<string, ComponentThemeConfig>,
): Record<string, ComponentThemeConfig> {
  const result = { ...base };
  for (const [name, config] of Object.entries(child)) {
    result[name] = { ...base[name], ...config };
  }
  return result;
}

/**
 * mergeTokens materializes every family, which is fine for light tokens (the
 * required families exist anyway) but dishonest for dark: codegen decides
 * whether to emit a `.dark {}` block by looking at what the theme declares,
 * so fabricated empty families must be stripped from the result.
 */
function mergeDarkTokens(base: PartialThemeTokens, child: PartialThemeTokens): PartialThemeTokens {
  const merged = mergeTokens(base as ThemeTokens, child as ThemeTokens);
  const out: Record<string, unknown> = {};
  for (const [family, value] of Object.entries(merged)) {
    if (value === undefined) continue;
    if (typeof value === 'object' && value !== null && Object.keys(value).length === 0) continue;
    out[family] = value;
  }
  return out as PartialThemeTokens;
}

function mergeTokens(base: ThemeTokens, child: Partial<ThemeTokens>): ThemeTokens {
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
