import { SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { Tabs } from './Tabs.tsx';

/**
 * Tabs.module.css transitions colour/border-colour on `.tab` (120ms) and the
 * sliding `.indicator` (150ms, line variant only). Same rationale as
 * Popover.visual.test.tsx/Button.visual.test.tsx: capture settled geometry,
 * not a mid-transition frame.
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
 * so the first paint is dark. Mirrors Checkbox.visual.test.tsx's helper.
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

/** One Tabs instance per variant, each with its second tab pre-selected. */
function VariantsRow() {
  return (
    <div
      data-testid="tabs-variants-row"
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        gap: '1.5rem',
        padding: '1rem',
        background: 'var(--surface-canvas)',
      }}
    >
      {(['line', 'pill', 'enclosed'] as const).map((variant) => (
        <Tabs.Root key={variant} defaultValue="b" variant={variant}>
          <Tabs.List>
            <Tabs.Tab value="a">First</Tabs.Tab>
            <Tabs.Tab value="b">Second</Tabs.Tab>
            <Tabs.Tab value="c">Third</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="a">First panel content.</Tabs.Panel>
          <Tabs.Panel value="b">Second panel content.</Tabs.Panel>
          <Tabs.Panel value="c">Third panel content.</Tabs.Panel>
        </Tabs.Root>
      ))}
    </div>
  );
}

describe('Tabs (visual)', () => {
  it('line/pill/enclosed variants with a selected tab match their baseline in light mode', async () => {
    await renderFixture(<VariantsRow />);

    await expect(page.getByTestId('tabs-variants-row')).toMatchScreenshot(
      'tabs-variants-row-light',
    );
  });

  it('line/pill/enclosed variants with a selected tab match their baseline in dark mode', async () => {
    await renderFixture(<VariantsRow />, { dark: true });

    await expect(page.getByTestId('tabs-variants-row')).toMatchScreenshot('tabs-variants-row-dark');
  });
});
