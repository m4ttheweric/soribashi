import { describe, expect, it } from 'vitest';
import {
  compositeOverQuantized,
  contrastRatio,
  parseColor,
  relativeLuminance,
} from '../src/a11y/contrast.ts';

/**
 * Pins the pure WCAG 2.x contrast math against known anchors before the
 * browser-tier matrix (src/a11y/contrast-matrix.test.tsx) leans on it. Inputs
 * are the exact string shapes Chromium's `getComputedStyle` serializes colors
 * to: `rgb(r, g, b)` and `rgba(r, g, b, a)`, never hex or named colors.
 */
describe('contrastRatio', () => {
  it('white on black is the maximum ratio, 21:1', () => {
    expect(contrastRatio('rgb(255, 255, 255)', 'rgb(0, 0, 0)')).toBeCloseTo(21, 5);
  });

  it('white on white is the minimum ratio, 1:1', () => {
    expect(contrastRatio('rgb(255, 255, 255)', 'rgb(255, 255, 255)')).toBeCloseTo(1, 5);
  });

  it('is symmetric: swapping fg/bg gives the same ratio', () => {
    const a = contrastRatio('rgb(255, 255, 255)', 'rgb(0, 0, 0)');
    const b = contrastRatio('rgb(0, 0, 0)', 'rgb(255, 255, 255)');
    expect(a).toBeCloseTo(b, 10);
  });

  it('#767676 on white clears the classic AA text boundary, >= 4.5:1', () => {
    // #767676 == rgb(118, 118, 118); Chromium never serializes computed
    // colors as hex, so the anchor is expressed the way getComputedStyle
    // would actually report it. #767676-on-white is the textbook "just
    // clears AA" gray (WCAG's own worked example lands at ~4.54:1).
    const ratio = contrastRatio('rgb(118, 118, 118)', 'rgb(255, 255, 255)');
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(ratio).toBeCloseTo(4.54, 2);
  });

  it('composites a translucent foreground over the supplied backdrop before computing', () => {
    // rgba(0, 0, 0, 0.5) over an rgb(255, 255, 255) backdrop composites to
    // rgb(127.5, 127.5, 127.5) per channel: result = fg*a + backdrop*(1-a)
    //   = 0 * 0.5 + 255 * 0.5 = 127.5
    // Relative luminance of that gray (WCAG 2.x, sRGB->linear per channel,
    // c/255 = 0.5, > 0.03928 so ((c+0.055)/1.055)^2.4):
    //   c = 127.5 / 255 = 0.5
    //   linear = ((0.5 + 0.055) / 1.055) ^ 2.4 = (0.5260663...) ^ 2.4 ≈ 0.2140411
    //   L = 0.2126*0.2140411 + 0.7152*0.2140411 + 0.0722*0.2140411 = 0.2140411 (R=G=B)
    // Contrast against opaque white (L = 1), white is lighter:
    //   (1 + 0.05) / (0.2140411 + 0.05) = 1.05 / 0.2640411 ≈ 3.976653
    const ratio = contrastRatio('rgba(0, 0, 0, 0.5)', 'rgb(255, 255, 255)');
    expect(ratio).toBeCloseTo(3.976653, 5);
  });

  it('composites a translucent background over the supplied backdrop before computing', () => {
    // Same compositing arithmetic as above, mirrored onto the background
    // argument: a 50% black background over a white backdrop also composites
    // to rgb(127.5, 127.5, 127.5) (L ≈ 0.2140411, see prior case), so opaque
    // black text (L = 0) on it lands at:
    //   (0.2140411 + 0.05) / (0 + 0.05) = 0.2640411 / 0.05 ≈ 5.280823
    const ratio = contrastRatio('rgb(0, 0, 0)', 'rgba(0, 0, 0, 0.5)', 'rgb(255, 255, 255)');
    expect(ratio).toBeCloseTo(5.280823, 5);
  });

  it('an explicit non-white backdrop is honored for alpha compositing', () => {
    // rgba(255, 255, 255, 0.5) over rgb(0, 0, 0) backdrop composites to
    // rgb(127.5, 127.5, 127.5) too (symmetric case), same ~3.9494 result
    // against a rgb(0, 0, 0) foreground... instead pin a simpler check: the
    // composited value must differ from compositing over white, proving the
    // backdrop argument is actually consumed rather than hardcoded.
    const overWhite = contrastRatio(
      'rgba(0, 0, 0, 0.5)',
      'rgb(255, 255, 255)',
      'rgb(255, 255, 255)',
    );
    const overBlack = contrastRatio('rgba(0, 0, 0, 0.5)', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)');
    expect(overWhite).not.toBeCloseTo(overBlack, 2);
  });

  it('rejects an unparseable color string rather than silently returning NaN', () => {
    expect(() => contrastRatio('oklch(1 0 0)', 'rgb(0, 0, 0)')).toThrow();
  });
});

describe('compositeOverQuantized', () => {
  it('quantizes each composited channel to the 8-bit integer the browser blend lands on', () => {
    // The design ledger's skeleton.deltaY.* rows model the browser's OWN
    // alpha blend, which lands on 8-bit integers per channel, not the
    // continuous values compositeOver keeps. Real inputs from the ledger's
    // light-mode measurement: fill rgb(225, 231, 239) at the pulse's 0.6
    // trough opacity over canvas rgb(248, 250, 252). Continuous compositing
    // gives 234.2 / 238.6 / 244.2; the browser lands on 234 / 239 / 244.
    // reference.ts's trough bounds were derived with this quantized model,
    // so the ledger must reproduce it exactly.
    const out = compositeOverQuantized(
      parseColor('rgba(225, 231, 239, 0.6)'),
      parseColor('rgb(248, 250, 252)'),
    );
    expect(out).toEqual({ r: 234, g: 239, b: 244, a: 1 });
  });

  it('is observably different from the continuous compositeOver (the fork it replaces was not redundant)', () => {
    // The g channel above (238.6 continuous vs 239 quantized) is the proof
    // that deduping the ledger's local composite through the continuous
    // compositeOver would have MOVED the measured deltas; the quantized
    // export exists precisely because that difference is real.
    const quantized = compositeOverQuantized(
      parseColor('rgba(225, 231, 239, 0.6)'),
      parseColor('rgb(248, 250, 252)'),
    );
    expect(quantized.g).not.toBe(231 * 0.6 + 250 * 0.4);
    expect(231 * 0.6 + 250 * 0.4).toBeCloseTo(238.6, 10);
  });
});

describe('relativeLuminance', () => {
  it('uses the WCAG-published linearization threshold, equivalent to the sRGB 0.04045 constant for 8-bit channels', () => {
    // contrast.ts linearizes with WCAG 2.x's published 0.03928 threshold; the
    // sRGB standard's is 0.04045. No integer channel lands between them
    // (10/255 ≈ 0.03922 is below both, 11/255 ≈ 0.04314 above both), so for
    // every color Chromium actually serializes (integer channels) the two
    // constants are behaviourally identical. Pinned here from both sides of
    // the boundary so a future "correction" of the constant in either
    // direction keeps this documented equivalence true.
    const below = relativeLuminance(parseColor('rgb(10, 10, 10)'));
    expect(below).toBeCloseTo(10 / 255 / 12.92, 10);
    const above = relativeLuminance(parseColor('rgb(11, 11, 11)'));
    expect(above).toBeCloseTo(((11 / 255 + 0.055) / 1.055) ** 2.4, 10);
  });
});
