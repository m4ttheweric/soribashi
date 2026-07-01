import { createTheme, defaultDarkTokens, defaultTokens, defineVocabulary } from '@soribashi/core';

export const theme = createTheme({
  name: 'playground',
  tokens: {
    ...defaultTokens,
    colors: {
      ...defaultTokens.colors,
      primary: { ...defaultTokens.colors.primary, foreground: 'hsl(0 0% 100%)' },
      neutral: { ...defaultTokens.colors.neutral, foreground: 'hsl(0 0% 100%)' },
      danger: { ...defaultTokens.colors.danger, foreground: 'hsl(0 0% 100%)' },
      success: { ...defaultTokens.colors.success, foreground: 'hsl(0 0% 100%)' },
      warning: { ...defaultTokens.colors.warning, foreground: 'hsl(0 0% 0%)' },
      info: { ...defaultTokens.colors.info, foreground: 'hsl(0 0% 100%)' },
    },
  },
  dark: defaultDarkTokens,
  vocabulary: {
    intent: defineVocabulary(['primary', 'neutral', 'danger', 'success', 'warning', 'info']),
    variant: defineVocabulary(['filled', 'outline', 'subtle', 'ghost', 'link']),
  },
  semanticTokens: {
    text: {
      default: 'colors.neutral.900',
      muted: 'colors.neutral.500',
      disabled: 'colors.neutral.400',
    },
    surface: {
      canvas: 'colors.neutral.50',
      default: 'colors.neutral.0',
      raised: 'colors.neutral.100',
      sunken: 'colors.neutral.50',
      overlay: 'colors.neutral.900',
    },
    border: {
      default: 'colors.neutral.200',
      strong: 'colors.neutral.400',
      muted: 'colors.neutral.100',
    },
  },
});
