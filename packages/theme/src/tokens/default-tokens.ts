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
      // Darkened from oklch(0.6261 0.1859 259.6): the original only cleared
      // 3.64:1 against the white `filled`-variant foreground, below WCAG AA's
      // 4.5:1 text minimum (found by packages/ui/src/a11y/contrast-matrix.test.tsx).
      // Same hue/chroma, lower L; now clears ~4.56:1.
      '500': 'oklch(0.57 0.1859 259.6)',
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
      // Darkened from oklch(0.623 0.1688 149.18): the original only cleared
      // 3.33:1 against the white `filled`-variant foreground, below WCAG AA's
      // 4.5:1 text minimum (found by packages/ui/src/a11y/contrast-matrix.test.tsx).
      // Same hue/chroma, lower L; now clears ~4.60:1.
      '500': 'oklch(0.5423 0.1688 149.18)',
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
      // Darkened from oklch(0.6356 0.2082 25.38): the original only cleared
      // 3.78:1 against the white `filled`-variant foreground, below WCAG AA's
      // 4.5:1 text minimum (found by packages/ui/src/a11y/contrast-matrix.test.tsx).
      // Same hue/chroma, lower L; now clears ~4.57:1.
      '500': 'oklch(0.5885 0.2082 25.38)',
      '600': 'oklch(0.5786 0.2137 27.17)',
      // Darkened from oklch(0.5079 0.1918 27.56): `subtle`'s text-on-tint
      // pairing (this shade on the `100` background) only cleared 4.38:1,
      // below AA's 4.5:1 (found by contrast-matrix.test.tsx). Same
      // hue/chroma, lower L; now clears ~4.59:1 (and improves `outline`/
      // `ghost`, which already passed using this same shade on canvas).
      '700': 'oklch(0.4966 0.1918 27.56)',
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
      // Darkened from oklch(0.6688 0.1588 57.96) for light mode ONLY (see the
      // matching defaultDarkTokens.warning['600'] override below, which
      // restores this exact original value for dark): `link`'s
      // text-on-canvas pairing (this shade, transparent background) only
      // cleared 3.02:1 in light mode, below AA's 4.5:1 (found by
      // contrast-matrix.test.tsx). Same hue/chroma, lower L; now clears
      // ~4.65:1 against the light canvas. Unlike every other fix in this
      // file, this one COULD NOT be a single scheme-invariant value: this
      // shade already cleared AA in dark mode (5.66:1) using the ORIGINAL
      // lighter value (light text reads fine against the dark canvas), so
      // darkening it as one shared value to fix light would have flipped
      // that passing dark combination to failing. A light-dark split avoids
      // the tradeoff entirely: dark keeps its already-correct value, light
      // gets a new one, at the cost of being the one shade in this pass
      // that needed a new defaultDarkTokens entry rather than reusing the
      // family's existing one.
      '600': 'oklch(0.5595 0.1588 57.96)',
      // Darkened from oklch(0.5542 0.1447 49.16): `subtle`'s text-on-tint
      // pairing (this shade on the `100` background) only cleared 4.06:1,
      // below AA's 4.5:1 (found by contrast-matrix.test.tsx). Same
      // hue/chroma, lower L; now clears ~4.57:1 (and improves `outline`/
      // `ghost`, which already passed using this same shade on canvas).
      '700': 'oklch(0.525 0.1447 49.16)',
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
      // Darkened from oklch(0.6776 0.1481 238.1): the original only cleared
      // 2.86:1 against the white `filled`-variant foreground, below WCAG AA's
      // 4.5:1 text minimum (found by packages/ui/src/a11y/contrast-matrix.test.tsx).
      // Same hue/chroma, lower L; now clears ~4.60:1.
      '500': 'oklch(0.5504 0.1481 238.1)',
      // Darkened from oklch(0.5863 0.1366 241.18): `link`'s text-on-canvas
      // pairing (this shade, transparent background) only cleared 3.93:1 in
      // light mode, below AA's 4.5:1 (found by contrast-matrix.test.tsx).
      // Same hue/chroma, lower L; now clears ~4.70:1 against the light
      // canvas. Dark mode's `link` (this shade against the dark canvas) was
      // already failing before this change (3.93:1 -> ~3.64:1, unrelated to
      // the fix above) and stays failing after it: darkening moves it
      // further from AA, not into a regression, since it never passed dark
      // to begin with.
      //
      // Unlike `warning`'s `600` (left untouched, see the failure table in
      // the task report): that one DID pass in dark (5.66:1) before any
      // change, so darkening it to fix light would have flipped a
      // currently-passing dark combination to failing, a real regression a
      // single scheme-invariant value can't avoid without a light-dark()
      // split, which is out of this fix's value-level scope.
      '600': 'oklch(0.5424 0.1366 241.18)',
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
  motionDuration: {
    fast: '120ms',
    base: '150ms',
    slow: '200ms',
  },
  motionEase: {
    // Named by intent, not by curve, so a recipe reads its own meaning: things
    // entering decelerate into place, things leaving accelerate away. `standard`
    // is for state changes that neither enter nor exit (colour, border).
    enter: 'cubic-bezier(0, 0, 0.2, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

/**
 * Default dark-mode token overrides. Fully inverts the neutral scale (dark
 * shade k takes the light value of its mirror shade) and brightens the primary
 * scale for dark backgrounds. The inversion must cover every shade the default
 * semantics and intent resolver reference; a partial inversion leaves stray
 * light values (e.g. a near-white border.default) in dark mode.
 *
 * The intent scales (success/warning/danger/info) still have no general dark
 * ramp; their `500` anchors read acceptably on dark surfaces. What each one
 * DOES have now is a single, narrowly-scoped `600` (the `link`-variant text
 * shade, per default-intent-resolver.ts) dark override, added to clear AA
 * against the dark canvas: see each family's own comment below for the
 * derivation and the specific failing combination it fixes. `warning['600']`
 * is the one exception within that group: its dark value is a restoration
 * of the pre-fix value (light mode needed to darken it; dark already
 * passed), not a newly-derived one.
 *
 * `primary` additionally has a dark `700` (the `outline`/`ghost`/`subtle`
 * text shade) and, from before this task, a dark `100` (`subtle`'s
 * background): a dark-tinted chip, not a light one, so `subtle`'s and
 * `outline`/`ghost`'s dark-mode text wants the same thing (light text
 * against a dark-ish surface), and one `700` value can serve all three.
 *
 * The other four intent families (success/danger/warning/info) did NOT have
 * that until this pass: their `100` had no dark override at all, so it
 * stayed at its light-mode (light, near-white) value in dark mode, and a
 * `700` dark override light enough for `outline`/`ghost` (against the dark
 * canvas) would read as `subtle`'s text too (same CSS custom property, same
 * variant-independent resolver lookup) against that still-light
 * background: light text on a near-white chip. Proved this was a genuine,
 * unavoidable conflict, not a tuning gap, before touching anything further:
 * computed the best achievable SIMULTANEOUS contrast across the full
 * lightness range for each family's `700` (canvas dark vs. that family's
 * OWN light-mode `100`) and the maximum landed between 3.49:1 and 4.05:1,
 * short of 4.5:1, for all four.
 *
 * Resolution: dissolve the conflict by giving each of these four families
 * its own dark `100`, mirroring `primary`'s existing light-to-dark `100`
 * relationship mechanically rather than picking a value by eye: adopt
 * `primary`'s dark `100` lightness (`0.2941`) for every family; scale each
 * family's OWN light-mode `100` chroma by the same ratio `primary`'s dark
 * `100` chroma bears to `primary`'s light `100` chroma (`0.1092 / 0.0305 ≈
 * 3.58`), gamut-clamping back into sRGB where that scaled chroma doesn't
 * fit (all four needed it); keep each family's own hue. Computed with
 * culori's `clampChroma`. With every family's `100` now a dark tint instead
 * of a light one, both `700` consumers want the same direction again, so
 * `700` was re-derived the same way `primary`'s already was: same hue and
 * chroma as the light-mode value, lightness raised until the harder of the
 * two dark-mode backgrounds it's read against (the new `100` dark tint, in
 * every case lighter than, and so the tighter constraint than, the plain
 * dark canvas) clears 4.5 with margin. Every one of the four cleared on this
 * second derivation (4.80:1 against its own family's new dark `100`,
 * 5.86-6.34:1 against the dark canvas); see each family's own comment below
 * for the exact before/after values, and the task report for the full
 * derivation trail (the first, blocked attempt, the proof it was a genuine
 * conflict, and this resolution).
 *
 * `subtle`'s dark-mode appearance for these four families changes as a
 * direct, intended consequence: it now renders as a dark tinted chip
 * (matching `primary`'s `subtle` in dark), not the light chip it was
 * before. Mechanical starting point for all of the above, tunable by design
 * review (same framing as the `subtle` hover/active weights in
 * default-intent-resolver.ts).
 */
export const defaultDarkTokens: PartialThemeTokens = {
  colors: {
    primary: {
      '50': 'oklch(0.2463 0.0867 259.27)',
      '100': 'oklch(0.2941 0.1092 259.92)',
      // Mirrors the light-mode `500` fix above (same value in both schemes,
      // as before): oklch(0.6261 0.1859 259.6) -> oklch(0.57 0.1859 259.6).
      '500': 'oklch(0.57 0.1859 259.6)',
      // New dark-only value (light keeps the original oklch(0.4896 0.2153
      // 264.27)). `outline`/`ghost`/`subtle` all read this shade as their
      // text colour (default-intent-resolver.ts: `color: v('700')` in all
      // three), and against dark surfaces the light-mode value read as dark
      // text on a dark background (2.68:1 against the dark canvas, 2.13:1
      // against `subtle`'s own `primary['100']` dark tint above, both below
      // AA's 4.5:1). Derivation: same hue/chroma as the light value, only
      // lightness raised until the harder of the two backgrounds this shade
      // is read against in dark mode (`primary['100']` above, lighter than
      // the plain dark canvas) clears 4.5 with margin, then chroma
      // gamut-clamped back into sRGB at that lightness (culori
      // `clampChroma`, since the raw raised-lightness/original-chroma pair
      // fell outside sRGB). Solved with culori, accepted against the real
      // browser matrix: clears 4.8:1 against `primary['100']` (dark) and
      // 6.07:1 against the dark canvas. Mechanical starting point, tunable
      // by design review (same framing as the `subtle` hover/active
      // weights in default-intent-resolver.ts).
      '700': 'oklch(0.6798 0.1682 264.27)',
      // New dark-only value (light keeps the original oklch(0.5449 0.2154
      // 262.74)). Only `link` reads this shade (default-intent-resolver.ts:
      // `color: v('600')` for `link` only, no other variant), so this is
      // read only against the dark canvas: light-mode value gave 3.46:1 in
      // dark, below AA. Same derivation as `700` above (raise lightness,
      // gamut-clamp, target ~4.8 against the dark canvas with margin);
      // clears 4.80:1 against the dark canvas.
      '600': 'oklch(0.6226 0.203 262.74)',
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
    success: {
      // New dark-only value (light keeps the original oklch(0.9646 0.0405
      // 157.07)). `subtle`'s background. Derivation: mirrors `primary`'s
      // light-to-dark `100` relationship mechanically, see the file header
      // comment above for the full rule. Adopts `primary`'s dark-`100`
      // lightness (0.2941); chroma is this family's own light-`100` chroma
      // (0.0405) scaled by primary's dark/light `100` chroma ratio (~3.58)
      // then gamut-clamped back into sRGB (0.145 raw -> 0.0699 clamped);
      // hue is this family's own (157.07, unchanged). Turns `subtle` from a
      // light mint chip into a dark tinted one in dark mode, matching
      // `primary`'s `subtle`.
      '100': 'oklch(0.2941 0.0699 157.07)',
      // New dark-only value (light keeps the original oklch(0.5248 0.1373
      // 149.83)). Only `link` reads this shade, so only against the dark
      // canvas: light-mode value gave 3.52:1 in dark, below AA. Derivation:
      // same hue/chroma, lightness raised until clearing ~4.8 against the
      // dark canvas (culori, accepted against the real browser matrix:
      // 4.80:1). Mechanical starting point, tunable by design review.
      '600': 'oklch(0.5995 0.1373 149.83)',
      // New dark-only value (light keeps the original oklch(0.4458 0.1087
      // 150.91)). `outline`/`ghost`/`subtle` all read this shade as text.
      // Blocked in an earlier pass: with `100` still at its light value in
      // dark mode, the best achievable simultaneous contrast against both
      // the dark canvas and `100` topped out at 4.04:1, short of AA (see
      // the file header comment). Unblocked once `100` above got a dark
      // tint: both consumers now want light text against a dark-ish
      // surface, so this could be re-derived the same way `primary.700`
      // was (same hue/chroma, lightness raised until the harder of the two
      // backgrounds, `100` above, clears 4.5 with margin). Clears 4.80:1
      // against `success['100']` (dark) and 6.34:1 against the dark canvas.
      // Mechanical starting point, tunable by design review.
      '700': 'oklch(0.6736 0.1087 150.91)',
    },
    danger: {
      // New dark-only value (light keeps the original oklch(0.8803 0.0615
      // 18.39)). `subtle`'s background. Same derivation as `success['100']`
      // above (mirrors `primary`'s light-to-dark `100` ratio mechanically):
      // lightness 0.2941 (adopted from `primary`'s dark `100`), chroma
      // 0.0615 (this family's own light-`100` chroma) scaled by ~3.58 then
      // gamut-clamped (0.2202 raw -> 0.1179 clamped), hue 18.39 (own,
      // unchanged).
      '100': 'oklch(0.2941 0.1179 18.39)',
      // New dark-only value (light keeps the light-mode `600`, unchanged by
      // this task: oklch(0.5786 0.2137 27.17)). Only `link` reads this
      // shade, so only against the dark canvas: light-mode value gave
      // 3.73:1 in dark, below AA. Derivation: same hue/chroma, lightness
      // raised until clearing ~4.8 against the dark canvas (culori,
      // accepted against the real browser matrix: 4.80:1). Mechanical
      // starting point, tunable by design review.
      '600': 'oklch(0.6399 0.2137 27.17)',
      // New dark-only value (light keeps the round-1 fix from this task,
      // unrelated to dark: oklch(0.4966 0.1918 27.56)). `outline`/`ghost`/
      // `subtle` all read this shade as text. Blocked in an earlier pass at
      // a 3.49:1 simultaneous-contrast ceiling (see the file header
      // comment); unblocked once `100` above got a dark tint. Re-derived
      // the same way as `success.700` above. Clears 4.80:1 against
      // `danger['100']` (dark) and 5.86:1 against the dark canvas.
      // Mechanical starting point, tunable by design review.
      '700': 'oklch(0.6877 0.1918 27.56)',
    },
    warning: {
      // New dark-only value (light keeps the original oklch(0.9245 0.1131
      // 95.76)). `subtle`'s background. Same derivation as `success['100']`
      // above: lightness 0.2941 (adopted from `primary`'s dark `100`),
      // chroma 0.1131 (this family's own light-`100` chroma) scaled by
      // ~3.58 then gamut-clamped (0.4049 raw, well outside sRGB -> 0.0605
      // clamped, the largest reduction of the four), hue 95.76 (own,
      // unchanged).
      '100': 'oklch(0.2941 0.0605 95.76)',
      // Restores the light-mode `600`'s pre-fix value (see
      // defaultTokens.colors.warning['600']'s comment): this shade already
      // cleared AA in dark mode with this value, so dark keeps it unchanged
      // while light gets a darker one.
      '600': 'oklch(0.6688 0.1588 57.96)',
      // New dark-only value (light keeps the round-1 fix from this task,
      // unrelated to dark: oklch(0.525 0.1447 49.16)). `outline`/`ghost`/
      // `subtle` all read this shade as text. Blocked in an earlier pass at
      // a 3.79:1 simultaneous-contrast ceiling (see the file header
      // comment); unblocked once `100` above got a dark tint. Re-derived
      // the same way as `success.700` above. Clears 4.80:1 against
      // `warning['100']` (dark) and 6.17:1 against the dark canvas.
      // Mechanical starting point, tunable by design review.
      '700': 'oklch(0.6913 0.1447 49.16)',
    },
    info: {
      // New dark-only value (light keeps the original oklch(0.9548 0.0462
      // 203.22)). `subtle`'s background. Same derivation as
      // `success['100']` above: lightness 0.2941 (adopted from `primary`'s
      // dark `100`), chroma 0.0462 (this family's own light-`100` chroma)
      // scaled by ~3.58 then gamut-clamped (0.1654 raw -> 0.0501 clamped),
      // hue 203.22 (own, unchanged).
      '100': 'oklch(0.2941 0.0501 203.22)',
      // New dark-only value (light keeps the earlier light-only fix from
      // this task, oklch(0.5424 0.1366 241.18)). Only `link` reads this
      // shade, so only against the dark canvas: even the already-darkened
      // light-mode fix value gave 3.68:1 in dark, below AA (that earlier
      // fix targeted light mode only; dark was never addressed and stayed
      // failing). Derivation: same hue/chroma, lightness raised until
      // clearing ~4.8 against the dark canvas (culori, accepted against the
      // real browser matrix: 4.80:1). Mechanical starting point, tunable by
      // design review.
      '600': 'oklch(0.6107 0.1366 241.18)',
      // New dark-only value (light keeps the original oklch(0.4996 0.1179
      // 242.21)). `outline`/`ghost`/`subtle` all read this shade as text.
      // Blocked in an earlier pass at a 3.99:1 simultaneous-contrast
      // ceiling, the closest of the four to clearing on its own (see the
      // file header comment); unblocked once `100` above got a dark tint.
      // Re-derived the same way as `success.700` above. Clears 4.80:1
      // against `info['100']` (dark) and 6.28:1 against the dark canvas.
      // Mechanical starting point, tunable by design review.
      '700': 'oklch(0.6796 0.1179 242.21)',
    },
  },
};
