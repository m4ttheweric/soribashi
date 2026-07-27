import { SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { Divider } from './Divider.tsx';

/**
 * Same rationale as Badge.visual.test.tsx/Switch.visual.test.tsx: baselines
 * here are for geometry (rule thickness, label centring, orientation) and
 * typography, not colour correctness (that's a11y/contrast-matrix.test.tsx's
 * job). The no-transition wrapper is kept for the same reason Badge's is:
 * Divider.module.css has no transitions today, but a future one can't
 * silently introduce a mid-animation capture here without anyone noticing
 * the class was already there to prevent it.
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

describe('Divider (visual)', () => {
  it('a labelled horizontal divider matches its baseline in light mode', async () => {
    await renderFixture(
      <div
        data-testid="divider-h"
        style={{ width: '260px', padding: '1rem', background: 'var(--surface-canvas)' }}
      >
        <Divider label="OR" />
      </div>,
    );

    await expect(page.getByTestId('divider-h')).toMatchScreenshot(
      'divider-labelled-horizontal-light',
    );
  });

  it('a labelled horizontal divider matches its baseline in dark mode', async () => {
    await renderFixture(
      <div
        data-testid="divider-h"
        style={{ width: '260px', padding: '1rem', background: 'var(--surface-canvas)' }}
      >
        <Divider label="OR" />
      </div>,
      { dark: true },
    );

    await expect(page.getByTestId('divider-h')).toMatchScreenshot(
      'divider-labelled-horizontal-dark',
    );
  });

  it('a bare vertical divider matches its baseline', async () => {
    await renderFixture(
      <div
        data-testid="divider-v"
        style={{
          display: 'flex',
          height: '80px',
          padding: '1rem',
          background: 'var(--surface-canvas)',
        }}
      >
        <Divider orientation="vertical" />
      </div>,
    );

    await expect(page.getByTestId('divider-v')).toMatchScreenshot('divider-bare-vertical');
  });
});
