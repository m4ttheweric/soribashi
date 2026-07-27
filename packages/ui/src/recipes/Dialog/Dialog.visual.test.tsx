import { SoribashiProvider } from '@soribashi/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { Dialog } from './Dialog.tsx';

/**
 * Dialog.module.css transitions both the backdrop's opacity and the popup's
 * opacity/transform over 150ms and drives a `@starting-style` enter
 * animation on each (see the `.backdrop`/`.popup` rules), the same mechanism
 * as Popover.module.css/Tooltip.module.css. `container` (Dialog.tsx's
 * `ContentProps`, exercised the same way in Dialog.test.tsx) re-anchors the
 * portal locally so this no-transition class, applied to that local
 * container, reaches the portalled backdrop/popup and their descendants via
 * the wildcard descendant selector below.
 */
const NO_TRANSITION_CLASS = 'sb-visual-no-transition';
const noTransitionStyle = document.createElement('style');
noTransitionStyle.textContent = `
  .${NO_TRANSITION_CLASS},
  .${NO_TRANSITION_CLASS} * { transition: none !important; }
`;
document.head.appendChild(noTransitionStyle);

describe('Dialog (visual)', () => {
  // `render`'s auto-cleanup (see Badge.visual.test.tsx/Popover.visual.test.tsx)
  // only tracks/removes the container it renders the Trigger/Root tree into;
  // `popupContainer` here is instead passed as the Portal's `container`
  // *prop*, so it is never in that tracked set and needs its own teardown.
  let popupContainer: HTMLDivElement | undefined;

  afterEach(() => {
    popupContainer?.remove();
    popupContainer = undefined;
  });

  async function mountOpenDialog({ dark = false } = {}) {
    await page.viewport(900, 700);

    popupContainer = document.createElement('div');
    popupContainer.className = NO_TRANSITION_CLASS;
    if (dark) popupContainer.classList.add('dark');
    document.body.appendChild(popupContainer);

    // `defaultOpen` mounts the dialog already open, no click needed
    // (Dialog.tsx's Root forwards it straight to Base UI's DialogRoot,
    // verified against the installed `DialogRootProps.defaultOpen`, the same
    // mount-time-open idiom Tooltip's/Select's own visual tests use).
    const screen = await render(
      <SoribashiProvider theme={uiTheme}>
        <Dialog.Root defaultOpen>
          <Dialog.Trigger>Open</Dialog.Trigger>
          <Dialog.Content
            container={popupContainer}
            classNames={{ backdrop: 'dialog-backdrop-target' }}
          >
            <Dialog.Title>Dialog title</Dialog.Title>
            <Dialog.Description>A short description of what this dialog shows.</Dialog.Description>
            <Dialog.Close>Dismiss</Dialog.Close>
          </Dialog.Content>
        </Dialog.Root>
      </SoribashiProvider>,
    );
    await document.fonts.ready;
    return screen;
  }

  /**
   * Waits for Base UI's mount-entry state to actually clear before a
   * screenshot is taken. The same settled-state idiom used throughout this
   * package, adapted from Tooltip.visual.test.tsx's identically-named
   * helper: the no-transition class alone (installed above) is not
   * sufficient, since `[data-starting-style]` clears on the next animation
   * frame independent of any CSS transition duration.
   */
  async function waitForSettled(el: HTMLElement) {
    await vi.waitFor(
      () => {
        expect(el.hasAttribute('data-starting-style')).toBe(false);
        expect(getComputedStyle(el).opacity).toBe('1');
      },
      { timeout: 1000, interval: 10 },
    );
  }

  /**
   * The screenshot target is the BACKDROP, not the popup: the brief asks for
   * "open dialog with backdrop", and the popup alone (a small centred box)
   * would crop the backdrop's dimming entirely out of frame. `.backdrop` is
   * `position: fixed; inset: 0` (Dialog.module.css), so its own bounding box
   * spans the whole viewport; `page.elementLocator` wraps the real DOM node
   * (found via the `classNames` probe above) as a Locator so
   * `toMatchScreenshot` can target it directly, the way `page.getByRole`
   * targets a Testing-Library-queryable node elsewhere in this package. A
   * screenshot of that box legitimately captures the popup too: the popup is
   * a later DOM sibling within the same Portal (Dialog.tsx's content part
   * renders Backdrop then Popup), so it paints on top of the backdrop in the
   * same region without needing an explicit z-index -- Playwright's element
   * screenshot is real rendered pixels within that box, not an isolated
   * capture of the backdrop's own paint.
   */
  it('open dialog with backdrop matches its baseline in light mode', async () => {
    await mountOpenDialog();

    const dialog = page.getByRole('dialog');
    await expect.element(dialog).toBeVisible();
    await waitForSettled(dialog.element() as HTMLElement);

    const backdropEl = popupContainer?.querySelector('.dialog-backdrop-target') as HTMLElement;
    await waitForSettled(backdropEl);

    await expect(page.elementLocator(backdropEl)).toMatchScreenshot('dialog-open-light');
  });

  it('open dialog with backdrop matches its baseline in dark mode', async () => {
    await mountOpenDialog({ dark: true });

    const dialog = page.getByRole('dialog');
    await expect.element(dialog).toBeVisible();
    await waitForSettled(dialog.element() as HTMLElement);

    const backdropEl = popupContainer?.querySelector('.dialog-backdrop-target') as HTMLElement;
    await waitForSettled(backdropEl);

    await expect(page.elementLocator(backdropEl)).toMatchScreenshot('dialog-open-dark');
  });
});
