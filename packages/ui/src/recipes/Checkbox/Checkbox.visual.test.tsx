import { SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { uiTheme, uiVocabulary } from '../../theme.ts';
import { Checkbox } from './Checkbox.tsx';

const INTENTS = uiVocabulary.intent.values;

/**
 * Same rationale as Alert.visual.test.tsx: baselines here are for
 * geometry/borders/radii/typography, not colour correctness (that's
 * a11y/contrast-matrix.test.tsx's job). Checkbox.module.css has no
 * transitions today, but the no-transition wrapper is kept anyway so a
 * future transition addition can't silently introduce a mid-animation
 * capture here without anyone noticing the class was already there to
 * prevent it.
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
 * Button.visual.test.tsx's identical helper for the full rationale.
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

function IntentColumn() {
  return (
    <div
      data-testid="intent-column"
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        gap: '0.5rem',
        padding: '1rem',
        background: 'var(--surface-canvas)',
      }}
    >
      {INTENTS.map((intent) => (
        <Checkbox key={intent} intent={intent} defaultChecked label={intent} />
      ))}
    </div>
  );
}

function StateRow() {
  return (
    <div
      data-testid="state-row"
      style={{
        display: 'inline-flex',
        gap: '1rem',
        padding: '1rem',
        background: 'var(--surface-canvas)',
      }}
    >
      <Checkbox label="Unchecked" />
      <Checkbox label="Checked" defaultChecked />
      <Checkbox label="Indeterminate" indeterminate />
      <Checkbox label="Disabled" disabled />
      <Checkbox label="Disabled checked" disabled defaultChecked />
    </div>
  );
}

describe('Checkbox (visual)', () => {
  it('checked intent column matches its baseline in light mode', async () => {
    await renderFixture(<IntentColumn />);

    await expect(page.getByTestId('intent-column')).toMatchScreenshot(
      'checkbox-intent-column-light',
    );
  });

  it('checked intent column matches its baseline in dark mode', async () => {
    await renderFixture(<IntentColumn />, { dark: true });

    await expect(page.getByTestId('intent-column')).toMatchScreenshot(
      'checkbox-intent-column-dark',
    );
  });

  it('the unchecked/checked/indeterminate/disabled state row matches its baseline', async () => {
    await renderFixture(<StateRow />);

    await expect(page.getByTestId('state-row')).toMatchScreenshot('checkbox-state-row');
  });
});
