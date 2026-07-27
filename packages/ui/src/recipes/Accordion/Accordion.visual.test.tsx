import { SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { Accordion } from './Accordion.tsx';

/**
 * Accordion.module.css transitions `.trigger`'s background-color/color
 * (120ms, the expanded-vs-collapsed cue). Same rationale as
 * Tabs.visual.test.tsx/Badge.visual.test.tsx: capture settled geometry and
 * colour, not a mid-transition frame.
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
 * render, with the `dark` class (when requested) already present pre-mount
 * so the first paint is dark. Mirrors Badge.visual.test.tsx's helper.
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

/** One item open (`defaultValue`), one closed, per the task brief. */
function OneOpenOneClosed() {
  return (
    <div
      data-testid="accordion-two-items"
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        inlineSize: '20rem',
        padding: '1rem',
        background: 'var(--surface-canvas)',
      }}
    >
      <Accordion.Root defaultValue={['a']}>
        <Accordion.Item value="a">
          <Accordion.Header>
            <Accordion.Trigger>Expanded item</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Expanded panel content.</Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="b">
          <Accordion.Header>
            <Accordion.Trigger>Collapsed item</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Collapsed panel content.</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    </div>
  );
}

describe('Accordion (visual)', () => {
  it('one open item and one closed item match their baseline in light mode', async () => {
    await renderFixture(<OneOpenOneClosed />);

    await expect(page.getByTestId('accordion-two-items')).toMatchScreenshot(
      'accordion-two-items-light',
    );
  });

  it('one open item and one closed item match their baseline in dark mode', async () => {
    await renderFixture(<OneOpenOneClosed />, { dark: true });

    await expect(page.getByTestId('accordion-two-items')).toMatchScreenshot(
      'accordion-two-items-dark',
    );
  });
});
