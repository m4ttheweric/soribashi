import { createTheme, defaultTokens, defaultDarkTokens, defineVocabulary } from '@soribashi/core';

/**
 * Per-tenant scoped themes. Each theme sets `scope` to a class selector so its
 * tokens only apply inside `<div className="tenant-…">`. Codegen emits each
 * theme's tokens under that selector instead of `:root`, which lets a single
 * page render multiple brand styles without a provider swap.
 */

const tenantVocabulary = {
  intent: defineVocabulary(['primary', 'neutral', 'danger', 'success', 'warning', 'info']),
  variant: defineVocabulary(['filled', 'outline', 'subtle', 'ghost', 'link']),
};

const tenantSemanticTokens = {
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
} as const;

export const acmeTheme = createTheme({
  name: 'acme',
  scope: '.tenant-acme',
  tokens: {
    ...defaultTokens,
    colors: {
      ...defaultTokens.colors,
      // Acme brand: orange primary
      primary: {
        '50': 'hsl(33 100% 96%)',
        '100': 'hsl(34 100% 92%)',
        '200': 'hsl(32 98% 83%)',
        '300': 'hsl(31 97% 72%)',
        '400': 'hsl(27 96% 61%)',
        '500': 'hsl(25 95% 53%)',
        '600': 'hsl(21 90% 48%)',
        '700': 'hsl(17 88% 40%)',
        '800': 'hsl(15 79% 34%)',
        '900': 'hsl(15 75% 28%)',
        foreground: 'hsl(0 0% 100%)',
      },
    },
    radius: {
      ...defaultTokens.radius,
      // Acme prefers softer corners
      md: '0.625rem',
      lg: '0.875rem',
    },
  },
  dark: defaultDarkTokens,
  vocabulary: tenantVocabulary,
  semanticTokens: tenantSemanticTokens,
});

export const contosoTheme = createTheme({
  name: 'contoso',
  scope: '.tenant-contoso',
  tokens: {
    ...defaultTokens,
    colors: {
      ...defaultTokens.colors,
      // Contoso brand: violet primary
      primary: {
        '50': 'hsl(270 100% 98%)',
        '100': 'hsl(269 100% 95%)',
        '200': 'hsl(269 100% 92%)',
        '300': 'hsl(269 97% 85%)',
        '400': 'hsl(270 95% 75%)',
        '500': 'hsl(271 91% 65%)',
        '600': 'hsl(271 81% 56%)',
        '700': 'hsl(272 72% 47%)',
        '800': 'hsl(273 67% 39%)',
        '900': 'hsl(274 66% 32%)',
        foreground: 'hsl(0 0% 100%)',
      },
    },
    radius: {
      ...defaultTokens.radius,
      // Contoso prefers sharper corners
      md: '0.25rem',
      lg: '0.375rem',
    },
  },
  dark: defaultDarkTokens,
  vocabulary: tenantVocabulary,
  semanticTokens: tenantSemanticTokens,
});

export const tenantThemes = [acmeTheme, contosoTheme];
