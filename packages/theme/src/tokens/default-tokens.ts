import type { PartialThemeTokens, ThemeTokens } from '../types.ts';

/**
 * Default light-mode tokens. A reasonable starting palette that teams will
 * typically override entirely. Colour values are in oklch, converted
 * numerically from the prior HSL palette (same rendered colours, different
 * representation). oklch is perceptually uniform, which keeps ramp
 * interpolation coherent and makes contrast assertions meaningful in a way
 * HSL lightness is not.
 */
export const defaultTokens: ThemeTokens = {
  colors: {
    primary: {
      '50': 'oklch(0.9716 0.0136 255.03)',
      '100': 'oklch(0.9346 0.0305 255.11)',
      '200': 'oklch(0.8807 0.058 253.59)',
      '300': 'oklch(0.8043 0.0976 252.31)',
      '400': 'oklch(0.7157 0.1425 254.45)',
      '500': 'oklch(0.6261 0.1859 259.6)',
      '600': 'oklch(0.5449 0.2154 262.74)',
      '700': 'oklch(0.4896 0.2153 264.27)',
      '800': 'oklch(0.4226 0.181 265.65)',
      '900': 'oklch(0.3814 0.1364 265.25)',
      '950': 'oklch(0.283 0.0872 267.76)',
      foreground: 'oklch(1 0 0)',
    },
    neutral: {
      '0': 'oklch(1 0 0)',
      '50': 'oklch(0.9838 0.0035 247.86)',
      '100': 'oklch(0.9676 0.007 247.9)',
      '200': 'oklch(0.9258 0.0132 255.03)',
      '300': 'oklch(0.8694 0.0199 253.37)',
      '400': 'oklch(0.71 0.0348 256.79)',
      '500': 'oklch(0.5564 0.0398 256.82)',
      '600': 'oklch(0.4505 0.0371 256.83)',
      '700': 'oklch(0.3752 0.0394 256.85)',
      '800': 'oklch(0.2753 0.0364 259.7)',
      '900': 'oklch(0.2064 0.0388 265.55)',
      '950': 'oklch(0.1292 0.0415 265.15)',
      foreground: 'oklch(1 0 0)',
    },
    success: {
      '50': 'oklch(0.9836 0.0162 155.55)',
      '100': 'oklch(0.9646 0.0405 157.07)',
      '200': 'oklch(0.9246 0.0811 155.98)',
      '300': 'oklch(0.8712 0.137 154.59)',
      '400': 'oklch(0.7205 0.192 149.49)',
      '500': 'oklch(0.623 0.1688 149.18)',
      '600': 'oklch(0.5248 0.1373 149.83)',
      '700': 'oklch(0.4458 0.1087 150.91)',
      '800': 'oklch(0.3909 0.0908 151.96)',
      '900': 'oklch(0.3898 0.0885 152.69)',
      '950': 'oklch(0.2661 0.0625 153.04)',
      foreground: 'oklch(1 0 0)',
    },
    danger: {
      '50': 'oklch(0.9344 0.0314 17.73)',
      '100': 'oklch(0.8803 0.0615 18.39)',
      '200': 'oklch(0.8386 0.0869 19.05)',
      '300': 'oklch(0.8098 0.1025 19.54)',
      '400': 'oklch(0.7123 0.1656 22.18)',
      '500': 'oklch(0.6356 0.2082 25.38)',
      '600': 'oklch(0.5786 0.2137 27.17)',
      '700': 'oklch(0.5079 0.1918 27.56)',
      '800': 'oklch(0.441 0.1603 26.89)',
      '900': 'oklch(0.3996 0.1348 25.77)',
      '950': 'oklch(0.2526 0.0866 26)',
      foreground: 'oklch(1 0 0)',
    },
    warning: {
      '50': 'oklch(0.9622 0.0569 95.61)',
      '100': 'oklch(0.9245 0.1131 95.76)',
      '200': 'oklch(0.8875 0.161 94.5)',
      '300': 'oklch(0.8416 0.1719 92.57)',
      '400': 'oklch(0.8231 0.1679 92.79)',
      '500': 'oklch(0.7697 0.1645 70.61)',
      '600': 'oklch(0.6688 0.1588 57.96)',
      '700': 'oklch(0.5542 0.1447 49.16)',
      '800': 'oklch(0.4706 0.1236 46.53)',
      '900': 'oklch(0.4096 0.1037 46.31)',
      '950': 'oklch(0.284 0.0633 53.89)',
      // White fails contrast on the amber 500 background; use the 950 value.
      foreground: 'oklch(0.284 0.0633 53.89)',
    },
    info: {
      '50': 'oklch(0.9831 0.0203 200.65)',
      '100': 'oklch(0.9548 0.0462 203.22)',
      '200': 'oklch(0.9146 0.0805 204.72)',
      '300': 'oklch(0.8644 0.115 207.1)',
      '400': 'oklch(0.7964 0.1343 211.78)',
      '500': 'oklch(0.6776 0.1481 238.1)',
      '600': 'oklch(0.5863 0.1366 241.18)',
      '700': 'oklch(0.4996 0.1179 242.21)',
      '800': 'oklch(0.438 0.0988 240.83)',
      '900': 'oklch(0.392 0.0844 240.76)',
      '950': 'oklch(0.2947 0.0635 243.15)',
      foreground: 'oklch(1 0 0)',
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
      '50': 'oklch(0.2463 0.0867 259.27)',
      '100': 'oklch(0.2941 0.1092 259.92)',
      '500': 'oklch(0.6261 0.1859 259.6)',
      '900': 'oklch(0.9716 0.0136 255.03)',
    },
    neutral: {
      '0': 'oklch(0.1292 0.0415 265.15)',
      '50': 'oklch(0.2064 0.0388 265.55)',
      '100': 'oklch(0.2753 0.0364 259.7)',
      '200': 'oklch(0.3752 0.0394 256.85)',
      '300': 'oklch(0.4505 0.0371 256.83)',
      '400': 'oklch(0.5564 0.0398 256.82)',
      '500': 'oklch(0.71 0.0348 256.79)',
      '600': 'oklch(0.8694 0.0199 253.37)',
      '700': 'oklch(0.9258 0.0132 255.03)',
      '800': 'oklch(0.9676 0.007 247.9)',
      '900': 'oklch(0.9838 0.0035 247.86)',
      '950': 'oklch(1 0 0)',
      // The inverted 500 is light, so filled-neutral text flips dark.
      foreground: 'oklch(0.2064 0.0388 265.55)',
    },
  },
};
