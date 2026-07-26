import { SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { TextInput } from './TextInput.tsx';

/**
 * Same rationale as Checkbox.visual.test.tsx/Badge.visual.test.tsx: baselines
 * here are for geometry/borders/radii/typography, not colour correctness
 * (that's a11y/contrast-matrix.test.tsx's job).
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

function LabelledWithDescription() {
  return (
    <div
      data-testid="labelled"
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        padding: '1rem',
        background: 'var(--surface-canvas)',
      }}
    >
      <TextInput label="Email" description="We never share it." defaultValue="ada@example.com" />
    </div>
  );
}

function ErrorState() {
  return (
    <div
      data-testid="error-state"
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        padding: '1rem',
        background: 'var(--surface-canvas)',
      }}
    >
      <TextInput label="Email" error="Required" />
    </div>
  );
}

describe('TextInput (visual)', () => {
  it('a labelled input with description matches its baseline in light mode', async () => {
    await renderFixture(<LabelledWithDescription />);

    await expect(page.getByTestId('labelled')).toMatchScreenshot('textinput-labelled-light');
  });

  it('a labelled input with description matches its baseline in dark mode', async () => {
    await renderFixture(<LabelledWithDescription />, { dark: true });

    await expect(page.getByTestId('labelled')).toMatchScreenshot('textinput-labelled-dark');
  });

  it('the error state matches its baseline in light mode', async () => {
    await renderFixture(<ErrorState />);

    await expect(page.getByTestId('error-state')).toMatchScreenshot('textinput-error-light');
  });

  it('the error state matches its baseline in dark mode', async () => {
    await renderFixture(<ErrorState />, { dark: true });

    await expect(page.getByTestId('error-state')).toMatchScreenshot('textinput-error-dark');
  });
});
