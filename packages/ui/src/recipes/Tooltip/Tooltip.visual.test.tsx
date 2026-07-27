import { SoribashiProvider } from '@soribashi/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { Tooltip } from './Tooltip.tsx';

/**
 * Tooltip.module.css transitions the popup's opacity/transform over 150ms
 * and drives a `@starting-style` enter animation (see the `.popup` rule),
 * the same mechanism as Popover.module.css/Select.module.css. `container`
 * (Tooltip.tsx's `ContentProps`, exercised the same way in Tooltip.test.tsx)
 * re-anchors the portal locally so this no-transition class, applied to
 * that local container, reaches the portalled popup and its descendants via
 * the wildcard descendant selector below.
 */
const NO_TRANSITION_CLASS = 'sb-visual-no-transition';
const noTransitionStyle = document.createElement('style');
noTransitionStyle.textContent = `
  .${NO_TRANSITION_CLASS},
  .${NO_TRANSITION_CLASS} * { transition: none !important; }
`;
document.head.appendChild(noTransitionStyle);

describe('Tooltip (visual)', () => {
  // `render`'s auto-cleanup (see Badge.visual.test.tsx/Popover.visual.test.tsx)
  // only tracks/removes the container it renders the Trigger/Root tree into;
  // `popupContainer` here is instead passed as the Portal's `container`
  // *prop*, so it is never in that tracked set and needs its own teardown.
  let popupContainer: HTMLDivElement | undefined;

  afterEach(() => {
    popupContainer?.remove();
    popupContainer = undefined;
  });

  async function mountOpenTooltip({ dark = false } = {}) {
    await page.viewport(900, 700);

    popupContainer = document.createElement('div');
    popupContainer.className = NO_TRANSITION_CLASS;
    if (dark) popupContainer.classList.add('dark');
    document.body.appendChild(popupContainer);

    // `defaultOpen` mounts the tooltip already open, no hover/focus needed
    // (Tooltip.tsx's Root forwards it straight to Base UI's TooltipRoot,
    // verified against the installed `TooltipRootProps.defaultOpen`).
    const screen = await render(
      <SoribashiProvider theme={uiTheme}>
        <Tooltip.Root defaultOpen>
          <Tooltip.Trigger delay={0}>Hover me</Tooltip.Trigger>
          <Tooltip.Content container={popupContainer}>Helpful hint</Tooltip.Content>
        </Tooltip.Root>
      </SoribashiProvider>,
    );
    await document.fonts.ready;
    return screen;
  }

  /**
   * Waits for Base UI's mount-entry state to actually clear before a
   * screenshot is taken. Global Constraint 19's settled-state idiom: the
   * no-transition class alone (installed above) is not sufficient, since
   * `[data-starting-style]` clears on the next animation frame independent
   * of any CSS transition duration (see Select.test.tsx's axe test comment
   * for the full mechanism this mirrors).
   */
  async function waitForSettled(tooltipEl: HTMLElement) {
    await vi.waitFor(
      () => {
        expect(tooltipEl.hasAttribute('data-starting-style')).toBe(false);
        expect(getComputedStyle(tooltipEl).opacity).toBe('1');
      },
      { timeout: 1000, interval: 10 },
    );
  }

  it('open tooltip matches its baseline in light mode', async () => {
    await mountOpenTooltip();

    const tooltip = page.getByRole('tooltip');
    await expect.element(tooltip).toBeVisible();
    await waitForSettled(tooltip.element() as HTMLElement);

    await expect(tooltip).toMatchScreenshot('tooltip-open-light');
  });

  it('open tooltip matches its baseline in dark mode', async () => {
    await mountOpenTooltip({ dark: true });

    const tooltip = page.getByRole('tooltip');
    await expect.element(tooltip).toBeVisible();
    await waitForSettled(tooltip.element() as HTMLElement);

    await expect(tooltip).toMatchScreenshot('tooltip-open-dark');
  });
});
