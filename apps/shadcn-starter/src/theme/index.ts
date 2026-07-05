import { createTheme, defineVocabulary, registerTheme } from '@soribashi/core';

/**
 * shadcn-starter seed theme (Phase 0 walking skeleton).
 *
 * PROVISIONAL VALUES: neutral is Tailwind's zinc ramp (shadcn's base palette);
 * primary is the donor-faithful MONOCHROME ramp (spec section 5 reviewed
 * decision: stock shadcn's primary is near-black zinc-900, and the starter
 * ships that look; swap tokens.colors.primary for any hued scale to re-color
 * every intent="primary" surface app-wide). success/warning/danger/info are
 * copied from apps/pilot's ramps as placeholders until Phase 1 consolidation.
 */
const definition = {
  name: 'shadcn-starter',
  tokens: {
    colors: {
      neutral: {
        '0': '#ffffff',
        '50': '#fafafa',
        '100': '#f4f4f5',
        '200': '#e4e4e7',
        '300': '#d4d4d8',
        '400': '#a1a1aa',
        '500': '#71717a',
        '600': '#52525b',
        '700': '#3f3f46',
        '800': '#27272a',
        '900': '#18181b',
        '950': '#09090b',
        foreground: '#ffffff',
      },
      primary: {
        // Monochrome: 500 anchors at shadcn's primary (zinc-900); hover/active
        // walk darker (600/700) per the intent resolver's scale-walking.
        '50': '#fafafa',
        '100': '#f4f4f5',
        '200': '#e4e4e7',
        '300': '#a1a1aa',
        '400': '#52525b',
        '500': '#18181b',
        '600': '#131316',
        '700': '#0e0e10',
        '800': '#09090b',
        '900': '#060607',
        '950': '#030303',
        foreground: '#fafafa',
      },
      success: {
        // the host library ramp preserved verbatim — anchors and steps already coherent.
        '50': 'hsl(138 76% 97%)',
        '100': 'hsl(141 84% 93%)',
        '200': 'hsl(141 79% 85%)',
        '300': 'hsl(142 77% 73%)',
        '400': 'hsl(142 71% 45%)',
        '500': 'hsl(142 76% 36%)',
        '600': 'hsl(142 72% 29%)',
        '700': 'hsl(142 64% 24%)',
        '800': 'hsl(143 62% 20%)',
        '900': 'hsl(144 61% 20%)',
        '950': 'hsl(145 80% 10%)',
        foreground: 'hsl(0 0% 100%)',
      },
      warning: {
        // the host library ramp preserved verbatim. Note: the host library's `500` anchor sits at
        // hue 38 while `50..400` and `600..950` sit at hues 22..49 — the
        // ramp is intentionally warm-amber on the upper end and cooler-
        // gold on the lighter end. Not regenerated.
        '50': 'hsl(48 96% 89%)',
        '100': 'hsl(48 96% 77%)',
        '200': 'hsl(48 97% 63%)',
        '300': 'hsl(49 98% 48%)',
        '400': 'hsl(49 96% 47%)',
        '500': 'hsl(38 92% 50%)',
        '600': 'hsl(32 95% 44%)',
        '700': 'hsl(26 90% 37%)',
        '800': 'hsl(23 83% 31%)',
        '900': 'hsl(22 78% 26%)',
        '950': 'hsl(26 83% 14%)',
        // black on warning yellow for legibility — matches playground.
        foreground: 'hsl(0 0% 0%)',
      },
      danger: {
        // RENAMED from the host library's `error` family per soribashi convention.
        // Ramp preserved verbatim.
        '50': 'hsl(0 93% 94%)',
        '100': 'hsl(0 96% 89%)',
        '200': 'hsl(0 97% 85%)',
        '300': 'hsl(0 94% 82%)',
        '400': 'hsl(0 91% 71%)',
        '500': 'hsl(0 84% 60%)',
        '600': 'hsl(0 72% 51%)',
        '700': 'hsl(0 74% 42%)',
        '800': 'hsl(0 70% 35%)',
        '900': 'hsl(0 63% 31%)',
        '950': 'hsl(0 75% 15%)',
        foreground: 'hsl(0 0% 100%)',
      },
      info: {
        // the host library ramp preserved verbatim. Note: like warning, the `500` anchor
        // (hue 199) shifts from the `50..400` cyan band (hues 183..188) and
        // sits cooler than the `600..950` blues (hues 200..204). Treated as
        // intentional crossfade — not regenerated. (Compare to primary,
        // where the 240 → 221 jump was a clear seed-from-defaults artifact.)
        '50': 'hsl(183 100% 96%)',
        '100': 'hsl(185 96% 90%)',
        '200': 'hsl(186 94% 81%)',
        '300': 'hsl(187 92% 69%)',
        '400': 'hsl(188 86% 53%)',
        '500': 'hsl(199 89% 48%)',
        '600': 'hsl(200 98% 39%)',
        '700': 'hsl(201 96% 32%)',
        '800': 'hsl(201 90% 27%)',
        '900': 'hsl(202 80% 24%)',
        '950': 'hsl(204 80% 16%)',
        foreground: 'hsl(0 0% 100%)',
      },
    },
    radius: {
      // shadcn v4: --radius = 0.625rem; sm/md derive by -4px/-2px, xl +4px.
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.625rem',
      xl: '0.875rem',
      full: '9999px',
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '0.75rem',
      lg: '1rem',
      xl: '1.5rem',
      '2xl': '2rem',
      '3xl': '3rem',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
    fontFamily: {
      sans: 'ui-sans-serif, system-ui, sans-serif',
    },
  },
  dark: {
    colors: {
      neutral: {
        // Inverted zinc: page bg goes near-black, text near-white.
        '0': '#09090b',
        '50': '#18181b',
        '100': '#27272a',
        '200': '#3f3f46',
        '300': '#52525b',
        '400': '#71717a',
        '500': '#a1a1aa',
        '600': '#d4d4d8',
        '700': '#e4e4e7',
        '800': '#f4f4f5',
        '900': '#fafafa',
        '950': '#ffffff',
      },
      primary: {
        // Dark-mode shadcn primary is near-white (zinc-200); hover walks lighter.
        '50': '#09090b',
        '100': '#18181b',
        '200': '#27272a',
        '300': '#3f3f46',
        '400': '#a1a1aa',
        '500': '#e4e4e7',
        '600': '#f4f4f5',
        '700': '#fafafa',
        '800': '#fcfcfc',
        '900': '#fdfdfd',
        '950': '#ffffff',
        foreground: '#18181b',
      },
      success: {
        '50': 'hsl(145 80% 10%)',
        '100': 'hsl(144 61% 20%)',
        '200': 'hsl(143 62% 20%)',
        '300': 'hsl(142 64% 24%)',
        '400': 'hsl(142 72% 29%)',
        '500': 'hsl(142 71% 45%)',
        '600': 'hsl(142 77% 73%)',
        '700': 'hsl(141 79% 85%)',
        '800': 'hsl(141 84% 93%)',
        '900': 'hsl(138 76% 97%)',
        '950': 'hsl(138 100% 99%)',
      },
      warning: {
        '50': 'hsl(26 83% 14%)',
        '100': 'hsl(22 78% 26%)',
        '200': 'hsl(23 83% 31%)',
        '300': 'hsl(26 90% 37%)',
        '400': 'hsl(32 95% 44%)',
        '500': 'hsl(49 98% 48%)',
        '600': 'hsl(49 97% 63%)',
        '700': 'hsl(48 97% 77%)',
        '800': 'hsl(48 96% 89%)',
        '900': 'hsl(48 100% 96%)',
        '950': 'hsl(48 100% 98%)',
      },
      danger: {
        // Renamed from the host library's `error` family in dark too. Ramp verbatim.
        '50': 'hsl(0 75% 15%)',
        '100': 'hsl(0 63% 31%)',
        '200': 'hsl(0 70% 35%)',
        '300': 'hsl(0 74% 42%)',
        '400': 'hsl(0 72% 51%)',
        '500': 'hsl(0 84% 60%)',
        '600': 'hsl(0 91% 71%)',
        '700': 'hsl(0 94% 82%)',
        '800': 'hsl(0 97% 85%)',
        '900': 'hsl(0 96% 89%)',
        '950': 'hsl(0 93% 94%)',
      },
      info: {
        '50': 'hsl(204 80% 16%)',
        '100': 'hsl(202 80% 24%)',
        '200': 'hsl(201 90% 27%)',
        '300': 'hsl(201 96% 32%)',
        '400': 'hsl(200 98% 39%)',
        '500': 'hsl(188 86% 53%)',
        '600': 'hsl(187 92% 69%)',
        '700': 'hsl(186 94% 81%)',
        '800': 'hsl(185 96% 90%)',
        '900': 'hsl(183 100% 96%)',
        '950': 'hsl(183 100% 98%)',
      },
    },
  },
  vocabulary: {
    size: defineVocabulary(['xs', 'sm', 'md', 'lg', 'xl']),
    intent: defineVocabulary(['primary', 'neutral', 'success', 'warning', 'danger', 'info']),
  },
  semanticTokens: {
    text: {
      default: 'colors.neutral.950',
      muted: 'colors.neutral.500',
    },
    surface: {
      canvas: 'colors.neutral.50',
      default: 'colors.neutral.0',
      raised: 'colors.neutral.0',
      floating: { value: 'colors.neutral.0', foreground: 'colors.neutral.950' },
    },
    border: {
      default: 'colors.neutral.200',
      input: 'colors.neutral.200',
      focus: 'colors.neutral.400',
    },
    accent: {
      default: 'colors.neutral.100',
      muted: 'colors.neutral.100',
    },
  },
} as const;

import { buttonTheme } from '../recipes/Button/Button.tsx';

/** Component-free theme TYPE for builders.ts threading (no runtime cycle). */
export type BaseTheme = ReturnType<typeof createTheme<(typeof definition)['vocabulary']>>;

/** Full runtime theme. Recipes register via .extend() entries here (Task 4). */
export const theme = createTheme({
  ...definition,
  components: [buttonTheme],
});

registerTheme(theme);
