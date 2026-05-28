import { defaultIntentResolver } from './default-intent-resolver.ts';
import type { ResolvedTheme, SemanticTokensConfig, ThemeDefinition, ThemeVocabulary } from './types.ts';
import { composeTheme } from './compose-theme.ts';
import { normalizeComponents } from './normalize-components.ts';
import { DEFAULT_VOCABULARIES } from './default-vocabularies.ts';

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
  overlay: 'colors.neutral.900',
};

const DEFAULT_BORDER: Record<string, string> = {
  default: 'colors.neutral.200',
  strong: 'colors.neutral.400',
  muted: 'colors.neutral.100',
};

/**
 * Builds a normalized theme from a (potentially partial) `ThemeDefinition`.
 *
 * Resolution order:
 * 1. If `definition.extends` is provided, recursively resolve and merge.
 * 2. Apply user fields, falling back to defaults for any omitted field.
 */
export function createTheme(definition: ThemeDefinition): ResolvedTheme {
  const base: ResolvedTheme | null = definition.extends ? createTheme(definition.extends) : null;

  const merged: ThemeDefinition = base ? composeTheme(base, definition) : definition;

  const vocabulary: ThemeVocabulary = {
    size: merged.vocabulary?.size ?? DEFAULT_VOCABULARIES.size,
    intent: merged.vocabulary?.intent ?? DEFAULT_VOCABULARIES.intent,
    variant: merged.vocabulary?.variant ?? DEFAULT_VOCABULARIES.variant,
  };

  const semanticTokens: SemanticTokensConfig = {
    text: merged.semanticTokens?.text ?? DEFAULT_TEXT,
    surface: merged.semanticTokens?.surface ?? DEFAULT_SURFACE,
    border: merged.semanticTokens?.border ?? DEFAULT_BORDER,
    ...(merged.semanticTokens?.accent ? { accent: merged.semanticTokens.accent } : {}),
  };

  return {
    tokens: merged.tokens,
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
