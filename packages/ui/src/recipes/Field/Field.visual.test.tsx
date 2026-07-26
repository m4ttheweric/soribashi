import { Input as BaseInput } from '@base-ui/react/input';
import { SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { Field } from './Field.tsx';

/**
 * Same rationale as Badge.visual.test.tsx: baselines here are for
 * geometry/spacing/typography, not colour correctness (that's
 * a11y/contrast-matrix.test.tsx's job, via the TextInput/Textarea
 * SMALL_COVERAGE cells this recipe's `colour-via:` exemption points at).
 * Field.module.css has no transitions today, but the no-transition wrapper
 * is kept anyway so a future transition addition can't silently introduce a
 * mid-animation capture here without anyone noticing the class was already
 * there to prevent it.
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
  await page.viewport(500, 400);

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

function ComposedField() {
  return (
    <div
      data-testid="composed-field"
      style={{ display: 'inline-block', padding: '1rem', background: 'var(--surface-canvas)' }}
    >
      <Field.Root>
        <Field.Label>Email</Field.Label>
        <BaseInput />
        <Field.Description>We never share it.</Field.Description>
      </Field.Root>
    </div>
  );
}

function ErrorField() {
  return (
    <div
      data-testid="error-field"
      style={{ display: 'inline-block', padding: '1rem', background: 'var(--surface-canvas)' }}
    >
      <Field.Root>
        <Field.Label>Email</Field.Label>
        <BaseInput />
        <Field.Error match>Required</Field.Error>
      </Field.Root>
    </div>
  );
}

describe('Field (visual)', () => {
  it('composed field (label + control + description) matches its baseline in light mode', async () => {
    await renderFixture(<ComposedField />);

    await expect(page.getByTestId('composed-field')).toMatchScreenshot('field-composed-light');
  });

  it('composed field (label + control + description) matches its baseline in dark mode', async () => {
    await renderFixture(<ComposedField />, { dark: true });

    await expect(page.getByTestId('composed-field')).toMatchScreenshot('field-composed-dark');
  });

  it('error field (label + control + forced error) matches its baseline in light mode', async () => {
    await renderFixture(<ErrorField />);

    await expect(page.getByTestId('error-field')).toMatchScreenshot('field-error-light');
  });

  it('error field (label + control + forced error) matches its baseline in dark mode', async () => {
    await renderFixture(<ErrorField />, { dark: true });

    await expect(page.getByTestId('error-field')).toMatchScreenshot('field-error-dark');
  });
});
