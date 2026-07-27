export interface Gaps {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export function centeringGaps(outer: Element, inner: Element): Gaps {
  const o = outer.getBoundingClientRect();
  const i = inner.getBoundingClientRect();
  return {
    left: i.left - o.left,
    right: o.right - i.right,
    top: i.top - o.top,
    bottom: o.bottom - i.bottom,
  };
}

/**
 * Symmetry alone passed on the 2026-07-27 RadioGroup defect, whose gaps were
 * a symmetric 4.5px and rendered antialiased off the pixel grid. Whole-pixel
 * placement is the second, independent condition.
 *
 * `axis` exists because a component may legitimately centre on one axis
 * only: Switch's horizontal offset is its travel affordance (room for the
 * thumb to slide between states), not a defect, so asserting inline
 * symmetry there would fail a correctly built control forever.
 */
export function isCentered(g: Gaps, dpr: number, axis: 'both' | 'block') {
  const whole = (n: number) => Math.abs(n * dpr - Math.round(n * dpr)) < 0.01;
  const blockOnly = axis === 'block';
  return {
    symmetric:
      Math.abs(g.top - g.bottom) < 0.01 && (blockOnly || Math.abs(g.left - g.right) < 0.01),
    wholePixel: whole(g.top) && whole(g.bottom) && (blockOnly || (whole(g.left) && whole(g.right))),
  };
}
