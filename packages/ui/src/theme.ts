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
  semanticTokens: {
    surface: {
      // Skeleton's decorative fill (design-ledger fix round 2). WHICH ramp
      // index reaches "clearly distinct from canvas" is not scheme-symmetric
      // under WCAG relative luminance -- the dark tail of the neutral ramp
      // compresses harder than the light head for the same rung-count gap
      // (see packages/ui/src/design-ledger/reference.ts's skeleton.deltaY.*
      // witnesses for the measured numbers) -- so this needs two different
      // ramp positions, not one position that happens to differ per scheme
      // for free the way every other surface.* slot here does. This is
      // @soribashi/ui, acting as a consumer, taking that position (CLAUDE.md
      // invariant 2); @soribashi/theme only gained the CAPABILITY to express
      // a per-scheme surface reference (SemanticSurfaceValue's optional
      // `dark` field), never an opinion on which ramp indices are right.
      placeholder: { value: 'colors.neutral.200', dark: 'colors.neutral.400' },
    },
  },
});
