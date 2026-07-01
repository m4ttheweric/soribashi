import type { PartialThemeTokens, ThemeTokens } from '../types.ts';

/**
 * Default light-mode tokens. A reasonable starting palette that teams will
 * typically override entirely. Values are in HSL space for easy alpha
 * compositing via Tailwind's `<alpha-value>` pattern.
 */
export const defaultTokens: ThemeTokens = {
  colors: {
    primary: {
      '50': 'hsl(214 100% 97%)',
      '100': 'hsl(214 95% 93%)',
      '200': 'hsl(213 97% 87%)',
      '300': 'hsl(212 96% 78%)',
      '400': 'hsl(213 94% 68%)',
      '500': 'hsl(217 91% 60%)',
      '600': 'hsl(221 83% 53%)',
      '700': 'hsl(224 76% 48%)',
      '800': 'hsl(226 71% 40%)',
      '900': 'hsl(224 64% 33%)',
      '950': 'hsl(226 57% 21%)',
      foreground: 'hsl(0 0% 100%)',
    },
    neutral: {
      '0': 'hsl(0 0% 100%)',
      '50': 'hsl(210 40% 98%)',
      '100': 'hsl(210 40% 96%)',
      '200': 'hsl(214 32% 91%)',
      '300': 'hsl(213 27% 84%)',
      '400': 'hsl(215 20% 65%)',
      '500': 'hsl(215 16% 47%)',
      '600': 'hsl(215 19% 35%)',
      '700': 'hsl(215 25% 27%)',
      '800': 'hsl(217 33% 17%)',
      '900': 'hsl(222 47% 11%)',
      '950': 'hsl(229 84% 5%)',
      foreground: 'hsl(0 0% 100%)',
    },
    success: {
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
    danger: {
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
    warning: {
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
      // White fails contrast on the amber 500 background; use the 950 value.
      foreground: 'hsl(26 83% 14%)',
    },
    info: {
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
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
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
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
  },
  fontFamily: {
    sans: 'Inter, ui-sans-serif, system-ui, sans-serif',
    heading: 'Inter, ui-sans-serif, system-ui, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    xs: '1.4',
    sm: '1.45',
    md: '1.55',
    lg: '1.6',
    xl: '1.65',
  },
  heading: {
    sizes: {
      h1: { fontSize: '2.125rem', fontWeight: '700', lineHeight: '1.3' },
      h2: { fontSize: '1.625rem', fontWeight: '700', lineHeight: '1.35' },
      h3: { fontSize: '1.375rem', fontWeight: '700', lineHeight: '1.4' },
      h4: { fontSize: '1.125rem', fontWeight: '700', lineHeight: '1.45' },
      h5: { fontSize: '1rem', fontWeight: '700', lineHeight: '1.5' },
      h6: { fontSize: '0.875rem', fontWeight: '700', lineHeight: '1.5' },
    },
    textWrap: 'wrap',
  },
  shadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  breakpoint: {
    xs: '24rem',
    sm: '40rem',
    md: '48rem',
    lg: '64rem',
    xl: '80rem',
    '2xl': '96rem',
    '3xl': '120rem',
  },
};

/**
 * Default dark-mode token overrides. Fully inverts the neutral scale (dark
 * shade k takes the light value of its mirror shade) and brightens the primary
 * scale for dark backgrounds. The inversion must cover every shade the default
 * semantics and intent resolver reference; a partial inversion leaves stray
 * light values (e.g. a near-white border.default) in dark mode.
 *
 * The intent scales (success/warning/danger/info) deliberately have no dark
 * story yet; their 500 anchors read acceptably on dark surfaces.
 */
export const defaultDarkTokens: PartialThemeTokens = {
  colors: {
    primary: {
      '50': 'hsl(217 91% 15%)',
      '100': 'hsl(217 91% 20%)',
      '500': 'hsl(217 91% 60%)',
      '900': 'hsl(214 100% 97%)',
    },
    neutral: {
      '0': 'hsl(229 84% 5%)',
      '50': 'hsl(222 47% 11%)',
      '100': 'hsl(217 33% 17%)',
      '200': 'hsl(215 25% 27%)',
      '300': 'hsl(215 19% 35%)',
      '400': 'hsl(215 16% 47%)',
      '500': 'hsl(215 20% 65%)',
      '600': 'hsl(213 27% 84%)',
      '700': 'hsl(214 32% 91%)',
      '800': 'hsl(210 40% 96%)',
      '900': 'hsl(210 40% 98%)',
      '950': 'hsl(0 0% 100%)',
      // The inverted 500 is light, so filled-neutral text flips dark.
      foreground: 'hsl(222 47% 11%)',
    },
  },
};
