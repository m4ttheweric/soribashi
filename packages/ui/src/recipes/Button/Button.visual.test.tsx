import { SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { uiTheme, uiVocabulary } from '../../theme.ts';
import { Button } from './Button.tsx';

const INTENTS = uiVocabulary.intent.values;
const VARIANTS = uiVocabulary.variant.values;
const SIZES = uiVocabulary.size.values;

/**
 * Visual baselines here are for geometry/borders/radii/typography, not color
 * correctness (that's a11y/contrast-matrix.test.tsx's job against the full
 * intent x variant x size grid). Button.module.css transitions
 * background-color/border-color/color over 120ms; toggling into dark mode
 * changes which side of a `light-dark()` token resolves and the browser
 * animates toward it (same finding as contrast-matrix.test.tsx's
 * `no-transition` wrapper: reading computed styles, or here capturing a
 * screenshot, mid-transition returns an interpolated color, not the settled
 * one). Every fixture below mounts inside a container carrying this class so
 * no transition can ever run during a capture.
 */
const NO_TRANSITION_CLASS = 'sb-visual-no-transition';
const noTransitionStyle = document.createElement('style');
noTransitionStyle.textContent = `
  .${NO_TRANSITION_CLASS},
  .${NO_TRANSITION_CLASS} * { transition: none !important; }
`;
document.head.appendChild(noTransitionStyle);

/**
 * Mounts `ui` inside a fresh container appended to `document.body` before
 * render, with the `dark` class (when requested) already present on the
 * container pre-mount so the very first paint is dark: no post-mount class
 * flip, so no transition can fire even without the no-transition class above.
 *
 * `vitest-browser-react`'s main entry (imported here, see Button.test.tsx's
 * note) registers a global `beforeEach(() => cleanup())`; `cleanup()` removes
 * any container whose `parentNode === document.body`, which is true for the
 * container created here, so no manual teardown is needed between tests.
 */
async function renderFixture(ui: React.ReactNode, { dark = false } = {}) {
  // The tester iframe's default viewport is narrower than the intent x
  // variant grid's natural width; `locator.screenshot()` clips to the
  // viewport rather than scrolling to the element, which silently truncated
  // the grid's last (unpadded `link` variant) column until this was widened
  // (confirmed by comparing `getBoundingClientRect()` -- unaffected by
  // viewport -- against the actually-captured PNGs across a throwaway
  // baseline before adding this call).
  await page.viewport(900, 700);

  const container = document.createElement('div');
  container.className = NO_TRANSITION_CLASS;
  if (dark) container.classList.add('dark');
  document.body.appendChild(container);
  const screen = await render(<SoribashiProvider theme={uiTheme}>{ui}</SoribashiProvider>, {
    container,
  });
  // Belt-and-suspenders: settle any web font swap before a caller measures
  // or screenshots, so text metrics used below are the final ones.
  await document.fonts.ready;
  return screen;
}

// Rows of flexboxes, not a CSS grid: an `inline-grid` with `auto`/`max-content`
// tracks measured narrower than its painted content here (the `link`
// variant's underlined, `white-space: nowrap` label clipped past the grid's
// own right edge, confirmed against a throwaway baseline before switching).
// `alignItems: 'flex-start'` on the column is load-bearing, not decorative:
// the default `stretch` forces every row to the *first* row's shrink-to-fit
// width (a measured Chromium quirk under nested flex, confirmed by logging
// each row's `getBoundingClientRect()` before settling on this), so the
// `link` variant's unpadded, underlined label -- the one column with no
// border/background to absorb the squeeze -- got flex-shrunk narrower than
// its own text and visually overflowed. `flex-start` lets each row size to
// its own natural content instead.
function IntentVariantGrid() {
  return (
    <div
      data-testid="grid"
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '0.5rem',
        padding: '1rem',
        background: 'var(--surface-canvas)',
      }}
    >
      {INTENTS.map((intent) => (
        <div key={intent} style={{ display: 'flex', gap: '0.5rem' }}>
          {VARIANTS.map((variant) => (
            <Button key={`${intent}-${variant}`} intent={intent} variant={variant}>
              {intent}
            </Button>
          ))}
        </div>
      ))}
    </div>
  );
}

describe('Button (visual)', () => {
  it('intent x variant grid matches its baseline in light mode', async () => {
    await renderFixture(<IntentVariantGrid />);

    await expect(page.getByTestId('grid')).toMatchScreenshot('button-grid-light');
  });

  it('intent x variant grid matches its baseline in dark mode', async () => {
    await renderFixture(<IntentVariantGrid />, { dark: true });

    await expect(page.getByTestId('grid')).toMatchScreenshot('button-grid-dark');
  });

  it('size row matches its baseline', async () => {
    await renderFixture(
      <div
        data-testid="size-row"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem',
          background: 'var(--surface-canvas)',
        }}
      >
        {SIZES.map((size) => (
          <Button key={size} size={size}>
            {size}
          </Button>
        ))}
      </div>,
    );

    await expect(page.getByTestId('size-row')).toMatchScreenshot('button-size-row');
  });

  it('focus-visible state matches its baseline', async () => {
    const screen = await renderFixture(
      <div
        data-testid="focus-target"
        style={{
          display: 'inline-block',
          padding: '1rem',
          background: 'var(--surface-canvas)',
        }}
      >
        <Button>Focus me</Button>
      </div>,
    );

    const el = screen.getByRole('button', { name: 'Focus me' }).element() as HTMLElement;
    el.focus();

    // Sanity gate: a script-triggered `.focus()` call (not preceded by a
    // pointer interaction) is treated as focus-visible by Chromium's
    // heuristic, which is what this baseline is meant to capture. Asserting
    // the outline actually rendered before trusting the screenshot means a
    // regression in that heuristic (or in Button.module.css's
    // `:focus-visible` rule) fails loudly here instead of silently
    // baselining a plain unfocused button.
    expect(getComputedStyle(el).outlineStyle).toBe('solid');

    await expect(page.getByTestId('focus-target')).toMatchScreenshot('button-focus-visible');
  });
});
