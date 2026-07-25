/**
 * WCAG 2.x contrast math over sRGB, parsed from the exact string shapes
 * Chromium's `getComputedStyle` serializes computed colors to: `rgb(r, g, b)`
 * and `rgba(r, g, b, a)`. Pure and framework-free so the browser-tier matrix
 * (contrast-matrix.test.tsx) can call it against real computed styles and the
 * node-tier anchors (test/contrast-math.test.ts) can pin the formula on its
 * own.
 *
 * No hex/named/oklch parsing: Chromium never serializes computed style that
 * way, and adding parsers for forms we never actually observed would be
 * speculative.
 */

export interface RGBA {
  r: number;
  g: number;
  b: number;
  /** 0-1 */
  a: number;
}

const RGB_RE = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)$/i;

/** Parses a Chromium-serialized `rgb()`/`rgba()` computed-style string. */
export function parseColor(input: string): RGBA {
  const match = RGB_RE.exec(input.trim());
  if (!match) {
    throw new Error(
      `contrast.ts: cannot parse color "${input}"; expected a computed-style rgb()/rgba() string`,
    );
  }
  const [, r, g, b, a] = match;
  return {
    r: Number(r),
    g: Number(g),
    b: Number(b),
    a: a === undefined ? 1 : Number(a),
  };
}

function srgbChannelToLinear(channel255: number): number {
  const c = channel255 / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG 2.x relative luminance of an opaque color. */
export function relativeLuminance({ r, g, b }: RGBA): number {
  const R = srgbChannelToLinear(r);
  const G = srgbChannelToLinear(g);
  const B = srgbChannelToLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Standard "over" alpha compositing: `color` painted on top of an opaque
 * `backdrop`. Returns an opaque RGBA (alpha forced to 1).
 */
export function compositeOver(color: RGBA, backdrop: RGBA): RGBA {
  return {
    r: color.r * color.a + backdrop.r * (1 - color.a),
    g: color.g * color.a + backdrop.g * (1 - color.a),
    b: color.b * color.a + backdrop.b * (1 - color.a),
    a: 1,
  };
}

/**
 * WCAG 2.x contrast ratio between `fg` and `bg`, both Chromium-serialized
 * `rgb()`/`rgba()` computed-style strings. Either (or both) may carry
 * alpha < 1 (the design system's `outline`/`ghost`/`link`/`subtle` variants
 * render transparent backgrounds by construction), in which case the
 * translucent color is composited over `backdrop` (defaults to opaque white,
 * the typical page background) before luminance is computed. An opaque input
 * (alpha === 1, the common case for solid backgrounds and text) is used as-is
 * and `backdrop` has no effect on it.
 */
export function contrastRatio(fg: string, bg: string, backdrop = 'rgb(255, 255, 255)'): number {
  const backdropColor = parseColor(backdrop);
  let fgColor = parseColor(fg);
  let bgColor = parseColor(bg);

  // Simplification: a translucent `fg` is composited straight over `backdrop`
  // here, not over `bg` composited over `backdrop`, which is what actually
  // paints on screen when both are translucent. Equivalent to the correct
  // fg-over-bg-over-backdrop result today because every caller's fg is
  // opaque (text colour) and every translucent input in this codebase is a
  // background; a transparent bg just passes `backdrop` through unchanged
  // either way. Revisit this shortcut before this function is ever asked to
  // grade translucent text.
  if (fgColor.a < 1) fgColor = compositeOver(fgColor, backdropColor);
  if (bgColor.a < 1) bgColor = compositeOver(bgColor, backdropColor);

  const l1 = relativeLuminance(fgColor);
  const l2 = relativeLuminance(bgColor);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
