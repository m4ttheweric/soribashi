import { createTheme, defaultDarkTokens, defaultTokens, defineVocabulary } from '@soribashi/core';

/**
 * The ui package's own vocabulary declaration. Soribashi itself has no opinion
 * on these values (CLAUDE.md invariant 2); this file is where @soribashi/ui,
 * acting as a consumer, takes one.
 */
export const uiVocabulary = {
  size: defineVocabulary(['xs', 'sm', 'md', 'lg', 'xl'] as const),
  intent: defineVocabulary(['primary', 'neutral', 'success', 'warning', 'danger', 'info'] as const),
  variant: defineVocabulary(['filled', 'outline', 'subtle', 'ghost', 'link'] as const),
};

// createTheme's non-extending overload requires `tokens` in full (ThemeTokens
// has no optional fields of its own); @soribashi/theme's defaultTokens and
// defaultDarkTokens (oklch, numerically converted from the prior HSL palette)
// are the starting palette every other package in this repo reaches for the
// same way. Later tasks in this slice adjust these choices where an
// accessibility check finds a bad combination; this is the baseline.
export const uiTheme = createTheme({
  name: 'soribashi-ui',
  tokens: defaultTokens,
  dark: defaultDarkTokens,
  vocabulary: uiVocabulary,
});
