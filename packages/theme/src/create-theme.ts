import { defaultIntentResolver } from './default-intent-resolver.ts';
import type {
  PartialThemeVocabulary,
  ResolveVocab,
  ResolvedTheme,
  SemanticTokensConfig,
  ThemeDefinition,
  ThemeTokens,
  ThemeVocabulary,
} from './types.ts';
import { composeTheme } from './compose-theme.ts';
import { normalizeComponents } from './normalize-components.ts';
import { DEFAULT_VOCABULARIES } from './default-vocabularies.ts';
import { defaultTokens } from './tokens/index.ts';

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
 */
export function createTheme<const V extends PartialThemeVocabulary = PartialThemeVocabulary>(
  definition: ThemeDefinition<V>,
): ResolvedTheme<ResolveVocab<V>> {
  const base: ResolvedTheme | null = definition.extends ? createTheme(definition.extends) : null;

  // composeTheme rejects a child carrying `extends` (it cannot resolve one);
  // it is already resolved into `base` here, so strip it before composing.
  const { extends: _resolved, ...childDefinition } = definition;
  const merged: ThemeDefinition = base ? composeTheme(base, childDefinition) : definition;

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

  // The runtime fills omitted axes from DEFAULT_VOCABULARIES, which is exactly
  // what ResolveVocab<V> expresses at the type level — declared axes keep their
  // literal unions, omitted axes become the defaults. The `vocabulary` const is
  // typed as the wide ThemeVocabulary, so we assert the narrowed return; the
  // assertion is sound because the runtime guarantees the ResolveVocab<V> shape.
  return {
    tokens: withBreakpointFallback(merged.tokens),
    dark: merged.dark ?? {},
    vocabulary,
    semanticTokens,
    intentResolver: merged.intentResolver ?? defaultIntentResolver,
    components: normalizeComponents(merged.components, vocabulary),
    scope: merged.scope ?? ':root',
    darkMode: merged.darkMode ?? { selector: '.dark' },
    name: merged.name ?? 'default',
  } as ResolvedTheme<ResolveVocab<V>>;
}
