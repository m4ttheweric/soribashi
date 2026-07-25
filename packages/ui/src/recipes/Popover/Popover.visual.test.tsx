import { SoribashiProvider } from '@soribashi/core';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { Popover } from './Popover.tsx';

/**
 * Popover.module.css transitions the popup's opacity/transform over 150ms
 * and drives a `@starting-style` enter animation (see the `.popup` rule).
 * Capturing a screenshot mid-animation would baseline a partially
 * transparent, partially scaled popup instead of its settled geometry.
 * `container` (Popover.tsx's `ContentProps`, exercised the same way in
 * Popover.test.tsx) re-anchors the portal locally so this no-transition
 * class, applied to that local container, reaches the portalled popup and
 * its descendants via the wildcard descendant selector below.
 */
const NO_TRANSITION_CLASS = 'sb-visual-no-transition';
const noTransitionStyle = document.createElement('style');
noTransitionStyle.textContent = `
  .${NO_TRANSITION_CLASS},
  .${NO_TRANSITION_CLASS} * { transition: none !important; }
`;
document.head.appendChild(noTransitionStyle);

describe('Popover (visual)', () => {
  // `render`'s auto-cleanup (see Button.visual.test.tsx) only tracks/removes
  // the container it renders the Trigger/Root tree into; `popupContainer`
  // here is instead passed as the Portal's `container` *prop*, so it is
  // never in that tracked set and needs its own teardown.
  let popupContainer: HTMLDivElement | undefined;

  afterEach(() => {
    popupContainer?.remove();
    popupContainer = undefined;
  });

  function mountOpenPopover({ dark = false } = {}) {
    popupContainer = document.createElement('div');
    popupContainer.className = NO_TRANSITION_CLASS;
    if (dark) popupContainer.classList.add('dark');
    document.body.appendChild(popupContainer);

    // `open` force-opens without a click (Popover.test.tsx's pattern);
    // Base UI requires `onOpenChange` alongside a controlled `open` prop.
    return render(
      <SoribashiProvider theme={uiTheme}>
        <Popover.Root open onOpenChange={() => {}}>
          <Popover.Trigger>Open</Popover.Trigger>
          <Popover.Content container={popupContainer}>
            <Popover.Title>Popover title</Popover.Title>
            <Popover.Description>
              A short description of what this popover shows.
            </Popover.Description>
            <Popover.Close>Dismiss</Popover.Close>
          </Popover.Content>
        </Popover.Root>
      </SoribashiProvider>,
    );
  }

  // The screenshot target is the popup itself (the `dialog`-role element),
  // not `popupContainer`: the Positioner Base UI renders inside it is
  // `position: fixed` (floating-ui), so `popupContainer` -- a plain,
  // unstyled div appended to `document.body` -- never gains a non-zero
  // layout box of its own. Screenshotting it instead of the popup made
  // Playwright's own actionability wait for a "stable, visible" target
  // time out at the default 5000ms every time (confirmed by a throwaway
  // repro: the popup's own bounding rect was already static across a 300ms
  // wait and it reported zero running Web Animations, yet the container
  // screenshot still hung) -- the popup itself is what actually has
  // geometry/border/radius/typography worth baselining anyway.
  it('open popover matches its baseline in light mode', async () => {
    await mountOpenPopover();

    await expect.element(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog')).toMatchScreenshot('popover-open-light');
  });

  it('open popover matches its baseline in dark mode', async () => {
    await mountOpenPopover({ dark: true });

    await expect.element(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog')).toMatchScreenshot('popover-open-dark');
  });
});
