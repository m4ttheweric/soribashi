import { composeTheme } from './compose-theme.ts';
import { defaultIntentResolver } from './default-intent-resolver.ts';
import { DEFAULT_VOCABULARIES } from './default-vocabularies.ts';
import { normalizeComponents } from './normalize-components.ts';
import { defaultTokens } from './tokens/index.ts';
import type {
  ComposableThemeDefinition,
  ExtendingThemeDefinition,
  PartialThemeVocabulary,
  ResolveVocab,
  ResolvedTheme,
  SemanticTokensConfig,
  ThemeDefinition,
  ThemeTokens,
  ThemeVocabulary,
  VocabOfExtends,
} from './types.ts';

const DEFAULT_TEXT: Record<string, string> = {
  default: 'colors.neutral.900',
  muted: 'colors.neutral.500',
  disabled: 'colors.neutral.400',
};

const DEFAULT_SURFACE: Record<string, string> = {
  canvas: 'colors.neutral.50',
  default: 'colors.neutral.0',
  raised: 'colors.neutral.100',
  sunken: 'colors.neutral.50',
  // Raw value on purpose: a neutral-scale reference inverts under the default
  // dark tokens, turning the scrim near-white. A scrim must stay dark in both
  // schemes, so it bypasses the ramp entirely.
  overlay: 'hsl(222 47% 11% / 0.6)',
};

const DEFAULT_BORDER: Record<string, string> = {
  default: 'colors.neutral.200',
  strong: 'colors.neutral.400',
  muted: 'colors.neutral.100',
};

/**
 * Breakpoint tokens are structural, not aesthetic: blocks' responsive style
 * props and visibility.css derive `(min-width: ...)` queries from them, so a
 * theme without any breakpoints breaks responsiveness outright (everything
 * collapses to `(min-width: 0)`). Backfill this one family from the defaults.
 * Other families are intentionally NOT backfilled; teams replace those
 * wholesale and expect the theme to contain exactly what they declared.
 */
function withBreakpointFallback(tokens: ThemeTokens): ThemeTokens {
  if (tokens.breakpoint && Object.keys(tokens.breakpoint).length > 0) return tokens;
  return { ...tokens, breakpoint: { ...defaultTokens.breakpoint } };
}

/**
 * Builds a normalized theme from a (potentially partial) `ThemeDefinition`.
 *
 * Resolution order:
 * 1. If `definition.extends` is provided, recursively resolve and merge.
 * 2. Apply user fields, falling back to defaults for any omitted field.
 *
 * Two call forms:
 * - with `extends`, tokens may be partial or omitted (the base supplies the
 *   rest) and omitted vocabulary axes inherit the BASE's axes, which the
 *   return type reflects via `VocabOfExtends`
 * - without `extends`, tokens are required in full and omitted axes resolve
 *   to the default vocabularies
 */
export function createTheme<
  const V extends PartialThemeVocabulary = PartialThemeVocabulary,
  const E extends ComposableThemeDefinition = ComposableThemeDefinition,
>(definition: ExtendingThemeDefinition<V, E>): ResolvedTheme<ResolveVocab<V, VocabOfExtends<E>>>;
export function createTheme<const V extends PartialThemeVocabulary = PartialThemeVocabulary>(
  definition: ThemeDefinition<V>,
): ResolvedTheme<ResolveVocab<V>>;
export function createTheme(definition: ComposableThemeDefinition): ResolvedTheme {
  return resolveTheme(definition);
}

// The non-overloaded worker: the overloads above narrow the vocabulary for
// callers (the runtime fills omitted axes from the base or the defaults, which
// ResolveVocab/VocabOfExtends mirror at the type level); internally everything
// is honestly wide.
function resolveTheme(definition: ComposableThemeDefinition): ResolvedTheme {
  const base: ResolvedTheme | null = definition.extends ? resolveTheme(definition.extends) : null;

  // composeTheme rejects a child carrying `extends` (it cannot resolve one);
  // it is already resolved into `base` here, so strip it before composing.
  const { extends: _resolved, ...childDefinition } = definition;
  const merged = base ? composeTheme(base, childDefinition) : childDefinition;

  const vocabulary: ThemeVocabulary = {
    size: merged.vocabulary?.size ?? DEFAULT_VOCABULARIES.size,
    intent: merged.vocabulary?.intent ?? DEFAULT_VOCABULARIES.intent,
    variant: merged.vocabulary?.variant ?? DEFAULT_VOCABULARIES.variant,
  };

  // Per-key merge over the defaults, matching composeTheme's per-slot merge:
  // declaring `surface.brand` must not delete `surface.default` and friends.
  const semanticTokens: SemanticTokensConfig = {
    text: { ...DEFAULT_TEXT, ...merged.semanticTokens?.text },
    surface: { ...DEFAULT_SURFACE, ...merged.semanticTokens?.surface },
    border: { ...DEFAULT_BORDER, ...merged.semanticTokens?.border },
    ...(merged.semanticTokens?.accent ? { accent: merged.semanticTokens.accent } : {}),
  };

  // The empty-family fallback only fires for untyped callers: the overloads
  // require full tokens exactly when there is no base to supply them.
  const tokens: ThemeTokens = {
    colors: {},
    radius: {},
    spacing: {},
    fontSize: {},
    ...merged.tokens,
  } as ThemeTokens;

  return {
    tokens: withBreakpointFallback(tokens),
    dark: merged.dark ?? {},
    vocabulary,
    semanticTokens,
    intentResolver: merged.intentResolver ?? defaultIntentResolver,
    components: normalizeComponents(merged.components, vocabulary),
    scope: merged.scope ?? ':root',
    darkMode: merged.darkMode ?? { selector: '.dark' },
    name: merged.name ?? 'default',
  };
}
