import { SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { uiTheme, uiVocabulary } from '../../theme.ts';
import { Alert } from './Alert.tsx';

const INTENTS = uiVocabulary.intent.values;

/**
 * Same rationale as Button.visual.test.tsx: baselines here are for
 * geometry/borders/radii/typography, not colour correctness (that's
 * a11y/contrast-matrix.test.tsx's job against the full intent x variant
 * grid). Alert.module.css has no transitions today, but the no-transition
 * wrapper is kept anyway so a future transition addition can't silently
 * introduce a mid-animation capture here without anyone noticing the class
 * was already there to prevent it.
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
        <Alert key={intent} intent={intent} title={intent}>
          Sample body copy for the {intent} intent.
        </Alert>
      ))}
    </div>
  );
}

describe('Alert (visual)', () => {
  it('intent column at the default variant matches its baseline in light mode', async () => {
    await renderFixture(<IntentColumn />);

    await expect(page.getByTestId('intent-column')).toMatchScreenshot('alert-intent-column-light');
  });

  it('intent column at the default variant matches its baseline in dark mode', async () => {
    await renderFixture(<IntentColumn />, { dark: true });

    await expect(page.getByTestId('intent-column')).toMatchScreenshot('alert-intent-column-dark');
  });

  it('title, icon, and close button together match their baseline', async () => {
    await renderFixture(
      <div
        data-testid="full-alert"
        style={{ display: 'inline-block', padding: '1rem', background: 'var(--surface-canvas)' }}
      >
        <Alert
          intent="warning"
          title="Heads up"
          icon={<span aria-hidden="true">!</span>}
          withCloseButton
          onClose={() => {}}
        >
          This alert carries an icon, a title, and a close button all at once.
        </Alert>
      </div>,
    );

    await expect(page.getByTestId('full-alert')).toMatchScreenshot('alert-full');
  });
});
