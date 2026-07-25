import { SoribashiProvider } from '@soribashi/core';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
// `vitest-browser-react`'s main entry (`import ... from 'vitest-browser-react'`)
// registers a global `beforeEach(() => cleanup())` as a side effect of import
// (see its index.js), which unmounts every previously-rendered root before
// each `it`/`test` runs: the right default for the rest of this package's
// tests, each of which mounts its own fresh component per `it`. This file
// deliberately wants the opposite: ONE mount for the whole 150-combination
// grid, read by many `test.each` cases. `vitest-browser-react/pure` exposes
// the same `render` without that side effect, confirmed by a throwaway
// two-`it`-sharing-one-`beforeAll`-mount repro before writing this file:
// importing the main entry left `container` empty by the first `it` (cleanup
// already ran); importing `/pure` did not.
import { render } from 'vitest-browser-react/pure';
import { Button } from '../recipes/Button/Button.tsx';
import { uiTheme, uiVocabulary } from '../theme.ts';
import { contrastRatio } from './contrast.ts';

const INTENTS = uiVocabulary.intent.values;
const VARIANTS = uiVocabulary.variant.values;
const SIZES = uiVocabulary.size.values;

const MIN_CONTRAST = 4.5;

// No allowlist here on purpose. This matrix only renders enabled buttons;
// `disabled` (the one combination that would legitimately be out of AA
// scope, and that axe-core itself exempts from color-contrast) isn't part
// of the 6 x 5 x 5 grid at all. Every combination that IS in the grid is a
// real, in-scope, enabled control, so a failure here is a genuine WCAG AA
// gap, not something to allowlist away. Both light and dark scheme clear
// the whole matrix (300/300 cells across both schemes) since the dark
// token derivation commits (ed313f4, f50938d) gave every non-neutral
// intent its own dark-specific text shades; there is no known gap left
// to track here.

function testId(intent: string, variant: string, size: string): string {
  return `${intent}-${variant}-${size}`;
}

/**
 * Normalizes any getComputedStyle-serialized CSS color to an `rgb()`/
 * `rgba()` string, the only shape contrast.ts's `contrastRatio` accepts.
 *
 * The task brief's premise was that Chromium always serializes computed
 * `color`/`background-color` as legacy `rgb()`/`rgba()`; in practice, on the
 * Chromium build this repo's Playwright provider pins, every token in this
 * theme (all declared as `oklch()`, several through `light-dark()`) comes
 * back from `getComputedStyle` as `oklch(...)`, unconverted: confirmed by a
 * throwaway probe test before writing this (`getComputedStyle` on both an
 * inline-styled and a class-styled div, plus a literal `color: oklch(...)`
 * with no custom property involved at all, all three still read back as
 * `oklch(...)`). That rules out "it's just how the custom property
 * resolves" and means every fg/bg read in this matrix needs the same
 * treatment, not only the canvas-backdrop path the brief called out.
 *
 * The brief's suggested fix, "getComputedStyle on a div whose color you
 * set, which forces rgb serialization", did not hold on this Chromium
 * build (same probe test, unchanged). Its other suggested option, a canvas,
 * does: `CanvasRenderingContext2D` has operated in 8-bit sRGB since long
 * before `oklch()` existed, so painting a 1x1 rect with the CSS color string
 * as `fillStyle` and reading the pixel back via `getImageData` yields an
 * authoritative `rgb()`/`rgba()` regardless of how getComputedStyle chooses
 * to serialize the value. Verified against a known value before use: the
 * fixed `primary-500` (oklch(0.57 0.1859 259.6)) round-trips to
 * `rgb(42, 114, 226)` here, matching the sRGB conversion computed
 * independently while triaging Step 4's failures.
 *
 * One canvas/context is created lazily and reused for every call in this
 * file (150 buttons x 2 colors x 2 schemes, plus canvas-backdrop reads):
 * cheap, and avoids constructing a fresh canvas element per read.
 */
let normalizeCtx: CanvasRenderingContext2D | undefined;
function toRgbString(cssColor: string): string {
  if (!normalizeCtx) {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    normalizeCtx = canvas.getContext('2d', { willReadFrequently: true }) ?? undefined;
    if (!normalizeCtx) throw new Error('contrast-matrix: 2d canvas context unavailable');
  }
  normalizeCtx.clearRect(0, 0, 1, 1);
  normalizeCtx.fillStyle = cssColor;
  normalizeCtx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = normalizeCtx.getImageData(0, 0, 1, 1).data;
  return a === 255
    ? `rgb(${r}, ${g}, ${b})`
    : `rgba(${r}, ${g}, ${b}, ${((a ?? 0) / 255).toFixed(3)})`;
}

/**
 * Resolves `--surface-canvas`'s live computed color inside `scope`, so
 * `light-dark()` flips with whatever `color-scheme` `scope` currently
 * carries (see the `dark` class toggle below). Same probe-element technique
 * as Popover.test.tsx's `resolvedBackgroundColor`: setting the var on a
 * throwaway child and reading getComputedStyle back matches however the
 * browser actually resolves the token, rather than hand-parsing
 * oklch()/light-dark() source text, then normalized through `toRgbString`
 * per the note above. Re-created on every call (never cached) so a class
 * toggle between reads is always reflected.
 */
function resolveCanvasColor(scope: HTMLElement): string {
  const probe = document.createElement('div');
  probe.style.backgroundColor = 'var(--surface-canvas)';
  scope.appendChild(probe);
  const value = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return toRgbString(value);
}

describe('Button contrast matrix (WCAG AA >= 4.5:1)', () => {
  // One mount for the full 6 x 5 x 5 = 150 combination grid (per the task
  // brief); both the light and dark describe blocks below read computed
  // styles off this same container, toggling its `dark` class between
  // passes rather than re-mounting.
  let container: HTMLDivElement;
  let noTransitionStyle: HTMLStyleElement;

  beforeAll(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    // Button.module.css declares `transition: background-color 120ms, ...`
    // on `.root`. Toggling the `dark` class below changes which side of each
    // `light-dark()` token resolves, which the browser then *animates*
    // toward over that 120ms. A real repro caught this: reading computed
    // styles right after `classList.add('dark')` (even after a forced
    // reflow, even after two `requestAnimationFrame`s) returned in-flight
    // interpolated colors, not the settled dark value; only a real ~250ms
    // wait or disabling the transition produced the correct
    // `oklch(0.71 ...)` neutral-500 dark value instead of a color partway
    // between light and dark. Disabling transitions for the whole grid
    // up front (rather than timing a wait around each class toggle) makes
    // every read below exact and removes any timing dependency.
    noTransitionStyle = document.createElement('style');
    noTransitionStyle.textContent = `
      .a11y-contrast-matrix-no-transition,
      .a11y-contrast-matrix-no-transition * { transition: none !important; }
    `;
    document.head.appendChild(noTransitionStyle);
    container.classList.add('a11y-contrast-matrix-no-transition');

    await render(
      <SoribashiProvider theme={uiTheme}>
        {INTENTS.map((intent) =>
          VARIANTS.map((variant) =>
            SIZES.map((size) => (
              <Button
                key={testId(intent, variant, size)}
                intent={intent}
                variant={variant}
                size={size}
                attributes={{ root: { 'data-testid': testId(intent, variant, size) } }}
              >
                {intent}
              </Button>
            )),
          ),
        )}
      </SoribashiProvider>,
      { container },
    );
  });

  afterAll(() => {
    container.remove();
    noTransitionStyle.remove();
  });

  /**
   * Asserts every variant x size combination for one intent clears AA.
   * `getComputedStyle` is called fresh per button on every invocation (never
   * memoized into a shared object across buttons or across the light/dark
   * passes), so a variant- or size-specific miscoloring can't hide behind a
   * cached value read for a different combination.
   */
  function assertIntentClearsAA(intent: string) {
    for (const variant of VARIANTS) {
      for (const size of SIZES) {
        const id = testId(intent, variant, size);
        const el = container.querySelector<HTMLElement>(`[data-testid="${id}"]`);
        if (!el) {
          throw new Error(`contrast-matrix: no button rendered for combination "${id}"`);
        }
        const cs = getComputedStyle(el);
        const fg = toRgbString(cs.color);
        const bg = toRgbString(cs.backgroundColor);
        // `ghost`/`link`/`outline` (and `subtle`'s hover, though that's not
        // exercised here) render a transparent background, so it composites
        // against the resolved canvas backdrop inside contrastRatio; an
        // opaque background (`filled`, `subtle`) is used as-is (an alpha-1
        // color ignores the backdrop argument entirely).
        const backdrop = resolveCanvasColor(container);
        const ratio = contrastRatio(fg, bg, backdrop);
        expect(
          ratio,
          `${id}: fg=${fg} bg=${bg} backdrop=${backdrop} ratio=${ratio.toFixed(3)}`,
        ).toBeGreaterThanOrEqual(MIN_CONTRAST);
      }
    }
  }

  describe('light scheme', () => {
    test.each(INTENTS)(
      'intent=%s (every variant x size) clears AA against its background',
      (intent) => {
        assertIntentClearsAA(intent);
      },
    );
  });

  describe('dark scheme', () => {
    beforeAll(() => {
      container.classList.add('dark');
      // Belt-and-suspenders alongside the no-transition stylesheet above:
      // reading `offsetHeight` forces a synchronous style/layout recalc, so
      // this class change is fully settled before the first computed-style
      // read in this describe block.
      void container.offsetHeight;
    });

    afterAll(() => {
      container.classList.remove('dark');
    });

    test.each(INTENTS)(
      'intent=%s (every variant x size) clears AA against its background',
      (intent) => {
        assertIntentClearsAA(intent);
      },
    );
  });
});
