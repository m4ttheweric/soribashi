// @soribashi/theme — public API

export { composeTheme } from './compose-theme.ts';
export { createTheme, DEFAULT_SEMANTIC_TOKENS } from './create-theme.ts';
export { defaultIntentResolver } from './default-intent-resolver.ts';
export type { Vocabulary } from './define-vocabulary.ts';
export { defineVocabulary } from './define-vocabulary.ts';

export { isThemeComponentEntry } from './theme-component-entry.ts';
export { defaultDarkTokens, defaultTokens } from './tokens/index.ts';
export type {
  ColorScale,
  ComponentThemeConfig,
  ComposableThemeDefinition,
  ExtendingThemeDefinition,
  HeadingSize,
  HeadingTokens,
  IntentResolver,
  IntentResolverInput,
  IntentResolverResult,
  PartialSemanticTokensConfig,
  PartialThemeTokens,
  PartialThemeVocabulary,
  ResolvedTheme,
  SemanticReference,
  SemanticSurfaceValue,
  SemanticTokensConfig,
  ThemeComponentEntry,
  ThemeDefinition,
  ThemeTokens,
  ThemeVocabulary,
  VocabOfExtends,
} from './types.ts';

export type { VocabularyOverride } from './vocabulary-override.ts';
