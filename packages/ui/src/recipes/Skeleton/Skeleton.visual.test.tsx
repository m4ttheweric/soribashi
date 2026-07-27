import { SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { Skeleton } from './Skeleton.tsx';

/**
 * Same rationale as every other visual test's no-transition block (see
 * Badge.visual.test.tsx), PLUS a new addition this recipe is the first to
 * need: Skeleton.module.css's `.root` carries a perpetually-running
 * `animation` (the pulse), not a one-shot enter/exit `transition` the way
 * every prior recipe's block only ever had to freeze. `transition: none`
 * alone does nothing for an `animation` declaration -- they are separate CSS
 * mechanisms -- so a screenshot taken here would land on whatever opacity the
 * keyframe happened to be interpolating through at that exact instant,
 * different on every run. Freezing `animation` too (in addition to
 * `transition`) pins the capture to the animation's own resting frame
 * (`opacity: 1`, the `from` keyframe) instead.
 */
const NO_TRANSITION_CLASS = 'sb-visual-no-transition';
const noTransitionStyle = document.createElement('style');
noTransitionStyle.textContent = `
  .${NO_TRANSITION_CLASS},
  .${NO_TRANSITION_CLASS} * {
    transition: none !important;
    animation: none !important;
  }
`;
document.head.appendChild(noTransitionStyle);

/**
 * Mounts `ui` inside a fresh container appended to `document.body` before
 * render, with the `dark` class (when requested) already present on the
 * container pre-mount so the very first paint is dark. See
 * Badge.visual.test.tsx's identical helper for the full rationale.
 */
async function renderFixture(ui: React.ReactNode, { dark = false } = {}) {
  await page.viewport(900, 700);

  const container = document.createElement('div');
  container.className = NO_TRANSITION_CLASS;
  if (dark) container.classList.add('dark');
  document.body.appendChild(container);
  const screen = await render(<SoribashiProvider theme={uiTheme}>{ui}</SoribashiProvider>, {
    container,
  });
  await document.fonts.ready;
  return screen;
}

/** A typical "loading card" composition: three text-line placeholders of decreasing width. */
function SkeletonStack() {
  return (
    <div
      data-testid="skeleton-stack"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        padding: '1rem',
        width: '220px',
        background: 'var(--surface-canvas)',
      }}
    >
      <Skeleton w="100%" h="1rem" />
      <Skeleton w="80%" h="1rem" />
      <Skeleton w="60%" h="1rem" />
    </div>
  );
}

describe('Skeleton (visual)', () => {
  it('a three-line loading stack matches its baseline in light mode', async () => {
    await renderFixture(<SkeletonStack />);

    await expect(page.getByTestId('skeleton-stack')).toMatchScreenshot('skeleton-stack-light');
  });

  it('a three-line loading stack matches its baseline in dark mode', async () => {
    await renderFixture(<SkeletonStack />, { dark: true });

    await expect(page.getByTestId('skeleton-stack')).toMatchScreenshot('skeleton-stack-dark');
  });
});
