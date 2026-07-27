import { SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { Switch } from './Switch.tsx';

/**
 * Same rationale as Badge.visual.test.tsx/Alert.visual.test.tsx: baselines
 * here are for geometry (track/thumb shape, the checked travel distance) and
 * typography, not colour correctness (that's a11y/contrast-matrix.test.tsx's
 * job, though Switch's own checked-track fill has no rendered text to
 * contrast-check the way a colour-bearing text recipe would). The
 * no-transition wrapper freezes both the track's background-color transition
 * and the thumb's transform transition so a checked/unchecked pair captured
 * side by side never straddles a mid-animation frame.
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

/**
 * State established at mount only (`defaultChecked`), matching the
 * contrast-matrix harness's own stateful-cell convention: an interaction
 * inside the test body would risk capturing a mid-toggle frame instead of a
 * settled one.
 */
function UncheckedCheckedRow() {
  return (
    <div
      data-testid="switch-row"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '1rem',
        background: 'var(--surface-canvas)',
      }}
    >
      <Switch label="Off" />
      <Switch label="On" defaultChecked />
    </div>
  );
}

describe('Switch (visual)', () => {
  it('unchecked/checked row matches its baseline in light mode', async () => {
    await renderFixture(<UncheckedCheckedRow />);

    await expect(page.getByTestId('switch-row')).toMatchScreenshot('switch-row-light');
  });

  it('unchecked/checked row matches its baseline in dark mode', async () => {
    await renderFixture(<UncheckedCheckedRow />, { dark: true });

    await expect(page.getByTestId('switch-row')).toMatchScreenshot('switch-row-dark');
  });
});
