// @soribashi/theme — public API

export { createTheme } from './create-theme.ts';
export { defaultIntentResolver } from './default-intent-resolver.ts';
export { defaultTokens, defaultDarkTokens } from './tokens/index.ts';
export { composeTheme } from './compose-theme.ts';

export type {
  ThemeDefinition,
  ResolvedTheme,
  ThemeTokens,
  PartialThemeTokens,
  ColorScale,
  SemanticTokens,
  SemanticReference,
  IntentResolver,
  IntentResolverInput,
  IntentResolverResult,
  ComponentThemeConfig,
  HeadingTokens,
  HeadingSize,
  ThemeComponentEntry,
} from './types.ts';

export { isThemeComponentEntry } from './theme-component-entry.ts';
