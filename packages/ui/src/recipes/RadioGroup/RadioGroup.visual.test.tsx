import { SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { RadioGroup } from './RadioGroup.tsx';

const PLANS = [
  { label: 'Free', value: 'free' },
  { label: 'Pro', value: 'pro' },
];

/**
 * Same rationale as Badge.visual.test.tsx/Switch.visual.test.tsx: baselines
 * here are for geometry (control/indicator shape, item layout) and
 * typography, not colour correctness (that's a11y/contrast-matrix.test.tsx's
 * job). The no-transition wrapper freezes the control's background-color
 * transition so a selected/unselected pair captured side by side never
 * straddles a mid-animation frame.
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
 * State established at mount only (`defaultValue`), matching the
 * contrast-matrix harness's own stateful-cell convention: an interaction
 * inside the test body would risk capturing a mid-selection frame instead of
 * a settled one. Two independent RadioGroups (not one two-item group) so
 * BOTH the selected and unselected visual states are captured side by side.
 */
function SelectedUnselectedRow() {
  return (
    <div
      data-testid="radiogroup-row"
      style={{
        display: 'inline-flex',
        alignItems: 'flex-start',
        gap: '1.5rem',
        padding: '1rem',
        background: 'var(--surface-canvas)',
      }}
    >
      <RadioGroup label="Unselected" items={PLANS} />
      <RadioGroup label="Selected" items={PLANS} defaultValue="pro" />
    </div>
  );
}

describe('RadioGroup (visual)', () => {
  it('selected/unselected row matches its baseline in light mode', async () => {
    await renderFixture(<SelectedUnselectedRow />);

    await expect(page.getByTestId('radiogroup-row')).toMatchScreenshot('radiogroup-row-light');
  });

  it('selected/unselected row matches its baseline in dark mode', async () => {
    await renderFixture(<SelectedUnselectedRow />, { dark: true });

    await expect(page.getByTestId('radiogroup-row')).toMatchScreenshot('radiogroup-row-dark');
  });
});
