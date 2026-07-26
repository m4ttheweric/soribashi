import { SoribashiProvider } from '@soribashi/core';
import { Fragment, type ReactNode } from 'react';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
// See contrast-matrix.test.tsx's own header comment for why `/pure` is
// required here: the main `vitest-browser-react` entry registers a global
// `beforeEach(() => cleanup())` that would unmount this harness's single
// `beforeAll` grid mount before the first `it`/`test` runs.
import { render } from 'vitest-browser-react/pure';
import { uiTheme } from '../theme.ts';
import { contrastRatio } from './contrast.ts';

export { contrastRatio };

export const MIN_CONTRAST = 4.5;

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
 * One canvas/context is created lazily and reused for every call across
 * every matrix consumer of this module (every grid cell x 2 colors x 2
 * schemes, plus canvas-backdrop reads): cheap, and avoids constructing a
 * fresh canvas element per read.
 */
let normalizeCtx: CanvasRenderingContext2D | undefined;
export function toRgbString(cssColor: string): string {
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
export function resolveCanvasColor(scope: HTMLElement): string {
  const probe = document.createElement('div');
  probe.style.backgroundColor = 'var(--surface-canvas)';
  scope.appendChild(probe);
  const value = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return toRgbString(value);
}

/**
 * Deterministic `data-testid` for one grid cell, shared by `describeColourGrid`
 * and any fixture (e.g. a `SMALL_COVERAGE` entry) that wants to put the same
 * id on the element it wants measured.
 *
 * Since this module's pre-refactor form, the id is prefixed with the recipe
 * name (`Button-primary-filled-md`); the prior shape had no recipe prefix at
 * all (`primary-filled-md`). A reader diffing this file's output against
 * older CI runs should expect that prefix to be new, not a sign something
 * else changed.
 */
export function cellId(name: string, intent: string, variant: string): string {
  return `${name}-${intent}-${variant}`;
}

export interface ColourGridOptions<
  Intent extends string = string,
  Variant extends string = string,
  Size extends string = string,
> {
  name: string;
  intents: readonly Intent[];
  variants: readonly Variant[];
  /**
   * Optional third axis (e.g. Button's size vocabulary). Defaults to a
   * single unnamed pass, so a recipe with no size axis (Alert, Badge) can
   * omit it entirely and get one cell per intent x variant.
   */
  sizes?: readonly Size[];
  /**
   * Renders one cell; must place `data-testid={testId}` on the measured
   * element. `size` is `undefined` when `sizes` is omitted.
   */
  renderCell: (intent: Intent, variant: Variant, testId: string, size?: Size) => ReactNode;
}

/**
 * Runs a full intent x variant (x optional size) colour grid for one recipe:
 * mounts every cell once, disables transitions, and emits a light `describe`
 * and a dark `describe`, each asserting every cell clears `MIN_CONTRAST`.
 *
 * Carries forward the Button grid's transition fix: toggling the `dark`
 * class animates `light-dark()` token transitions, and a real repro showed
 * reads taken right after the toggle (even after a forced reflow and two
 * `requestAnimationFrame`s) returning colours interpolated part-way between
 * light and dark. Disabling transitions for the whole grid up front, rather
 * than timing a wait around the class toggle, removes that timing
 * dependency instead of working around it.
 */
export function describeColourGrid<
  Intent extends string,
  Variant extends string,
  Size extends string = string,
>({ name, intents, variants, sizes, renderCell }: ColourGridOptions<Intent, Variant, Size>): void {
  const sizePasses: readonly (Size | undefined)[] = sizes ?? [undefined];

  function gridTestId(intent: Intent, variant: Variant, size: Size | undefined): string {
    const id = cellId(name, intent, variant);
    return size === undefined ? id : `${id}-${size}`;
  }

  describe(`${name} contrast matrix (WCAG AA >= ${MIN_CONTRAST}:1)`, () => {
    let container: HTMLDivElement;
    let noTransitionStyle: HTMLStyleElement;

    beforeAll(async () => {
      container = document.createElement('div');
      document.body.appendChild(container);

      noTransitionStyle = document.createElement('style');
      noTransitionStyle.textContent = `
        .a11y-contrast-matrix-no-transition,
        .a11y-contrast-matrix-no-transition * { transition: none !important; }
      `;
      document.head.appendChild(noTransitionStyle);
      container.classList.add('a11y-contrast-matrix-no-transition');

      await render(
        <SoribashiProvider theme={uiTheme}>
          {intents.map((intent) =>
            variants.map((variant) =>
              sizePasses.map((size) => (
                // Must stay a `Fragment`, never a real element (e.g. `<span>`):
                // wrapping a cell in an actual DOM node would sit between the
                // cell and whatever it visually composites against, changing
                // the CSS cascade for any transparent-background variant
                // (outline/ghost/link) and silently invalidating its contrast
                // reading.
                <Fragment key={gridTestId(intent, variant, size)}>
                  {renderCell(intent, variant, gridTestId(intent, variant, size), size)}
                </Fragment>
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
     * `getComputedStyle` is called fresh per cell on every invocation (never
     * memoized into a shared object across cells or across the light/dark
     * passes), so a variant- or size-specific miscoloring can't hide behind a
     * cached value read for a different combination.
     */
    function assertIntentClearsAA(intent: Intent) {
      for (const variant of variants) {
        for (const size of sizePasses) {
          const id = gridTestId(intent, variant, size);
          const el = container.querySelector<HTMLElement>(`[data-testid="${id}"]`);
          if (!el) {
            throw new Error(`${name} contrast matrix: no element rendered for combination "${id}"`);
          }
          const cs = getComputedStyle(el);
          const fg = toRgbString(cs.color);
          const bg = toRgbString(cs.backgroundColor);
          // A transparent background composites against the resolved canvas
          // backdrop inside contrastRatio; an opaque background is used as-is
          // (an alpha-1 color ignores the backdrop argument entirely).
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
      test.each(intents)(
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

      test.each(intents)(
        'intent=%s (every variant x size) clears AA against its background',
        (intent) => {
          assertIntentClearsAA(intent);
        },
      );
    });
  });
}
