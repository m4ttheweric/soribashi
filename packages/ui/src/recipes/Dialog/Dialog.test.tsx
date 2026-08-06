import { SoribashiProvider } from '@soribashi/core';
import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { formatViolations, runAxe } from '../../a11y/axe.ts';
import { installNoTransitionStyle, NO_TRANSITION_CLASS } from '../../a11y/matrix-harness.tsx';
import { uiTheme } from '../../theme.ts';
import { Dialog } from './Dialog.tsx';

// `render` from vitest-browser-react resolves a Promise<RenderResult> (see
// Button.test.tsx); `wrap` awaits it so callers get the real result object.
const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={uiTheme}>{ui}</SoribashiProvider>);

/**
 * Same helpers as Popover.test.tsx's own (duplicated, not imported: recipes
 * are meant to stand alone per generate-registry.ts's per-recipe vendoring).
 * Resolves a CSS custom property to its browser-computed value by setting it
 * on a throwaway probe element and reading the computed style back.
 */
function resolvedBackgroundColor(varName: string): string {
  const probe = document.createElement('div');
  probe.style.backgroundColor = `var(${varName})`;
  document.body.appendChild(probe);
  const value = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return value;
}

function resolvedBorderTopLeftRadius(varName: string): string {
  const probe = document.createElement('div');
  probe.style.borderTopLeftRadius = `var(${varName})`;
  document.body.appendChild(probe);
  const value = getComputedStyle(probe).borderTopLeftRadius;
  probe.remove();
  return value;
}

describe('Dialog (browser)', () => {
  it('is closed by default: trigger is visible, popup absent from the DOM', async () => {
    const screen = await wrap(
      <Dialog.Root>
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>Title</Dialog.Title>
        </Dialog.Content>
      </Dialog.Root>,
    );
    const trigger = screen.getByRole('button', { name: 'Open' });
    await expect.element(trigger).toBeVisible();
    // No `keepMounted`, so a never-opened dialog renders nothing at all, not
    // just hidden (same shape as Popover.test.tsx's/Tooltip.test.tsx's
    // identical case).
    expect(screen.getByRole('dialog').query()).toBeNull();
  });

  it('opens from the trigger and exposes role="dialog" named by its Title', async () => {
    const screen = await wrap(
      <Dialog.Root>
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>My Dialog</Dialog.Title>
        </Dialog.Content>
      </Dialog.Root>,
    );

    await screen.getByRole('button', { name: 'Open' }).click();

    // `{ name: 'My Dialog' }` resolves the ACCESSIBLE NAME (following
    // aria-labelledby to the Title's own text), not just checking that some
    // aria-labelledby attribute exists -- a behavioural assertion that the
    // Title/Popup wiring genuinely produces the named-dialog pattern.
    const dialog = screen.getByRole('dialog', { name: 'My Dialog' });
    await expect.element(dialog).toBeVisible();

    // Settle before the axe-adjacent computed-style read below (Global
    // Constraint 2's idiom): Dialog.module.css's `.popup` has the same
    // opacity/transform enter transition and `[data-starting-style]`
    // mount-entry state Base UI clears on the next animation frame,
    // independent of the CSS transition duration.
    const dialogEl = dialog.element() as HTMLElement;
    await vi.waitFor(
      () => {
        expect(dialogEl.hasAttribute('data-starting-style')).toBe(false);
        expect(getComputedStyle(dialogEl).opacity).toBe('1');
      },
      { timeout: 1000, interval: 10 },
    );
  });

  it('click trigger opens a portalled popup with themed background and radius', async () => {
    const screen = await wrap(
      <Dialog.Root>
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>Title</Dialog.Title>
        </Dialog.Content>
      </Dialog.Root>,
    );

    await screen.getByRole('button', { name: 'Open' }).click();

    const dialog = screen.getByRole('dialog');
    await expect.element(dialog).toBeVisible();
    const popupEl = dialog.element();

    // Portalled: the popup's parent chain leaves the render container
    // (Base UI's default Portal target is <body>, not the local mount point).
    expect(screen.container.contains(popupEl)).toBe(false);
    expect(document.body.contains(popupEl)).toBe(true);

    const cs = getComputedStyle(popupEl);
    expect(cs.backgroundColor).toBe(resolvedBackgroundColor('--surface-default'));
    expect(cs.borderTopLeftRadius).toBe(resolvedBorderTopLeftRadius('--radius-lg'));
  });

  it('traps focus while open: Tab cycles through its focusables and wraps, never leaving the popup', async () => {
    const screen = await wrap(
      <Dialog.Root>
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>My Dialog</Dialog.Title>
          <button type="button">First</button>
          <button type="button">Second</button>
          <Dialog.Close>Dismiss</Dialog.Close>
        </Dialog.Content>
      </Dialog.Root>,
    );

    await screen.getByRole('button', { name: 'Open' }).click();
    const dialog = screen.getByRole('dialog');
    await expect.element(dialog).toBeVisible();
    const dialogEl = dialog.element() as HTMLElement;

    const first = screen.getByRole('button', { name: 'First' }).element();
    const second = screen.getByRole('button', { name: 'Second' }).element();
    const dismiss = screen.getByRole('button', { name: 'Dismiss' }).element();

    // Base UI's default initialFocus moves to the first tabbable element
    // inside the popup (DialogPopup.d.ts's `initialFocus` doc comment);
    // waited rather than asserted once, since this focus move happens after
    // the popup's own open transition starts.
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(first);
    });
    expect(dialogEl.contains(document.activeElement)).toBe(true);

    await userEvent.tab();
    expect(document.activeElement).toBe(second);
    expect(dialogEl.contains(document.activeElement)).toBe(true);

    await userEvent.tab();
    expect(document.activeElement).toBe(dismiss);
    expect(dialogEl.contains(document.activeElement)).toBe(true);

    // A FULL cycle: the fourth Tab (one past the last focusable) wraps back
    // to the first instead of escaping to the document body/trigger -- the
    // actual proof of a focus TRAP, not just "focus happened to stay inside"
    // for three single steps.
    await userEvent.tab();
    expect(document.activeElement).toBe(first);
    expect(dialogEl.contains(document.activeElement)).toBe(true);
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const screen = await wrap(
      <Dialog.Root>
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>My Dialog</Dialog.Title>
        </Dialog.Content>
      </Dialog.Root>,
    );

    const trigger = screen.getByRole('button', { name: 'Open' });
    await trigger.click();
    await expect.element(screen.getByRole('dialog')).toBeVisible();

    await userEvent.keyboard('{Escape}');

    await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger.element());
  });

  it('the Close part closes the dialog on click', async () => {
    const screen = await wrap(
      <Dialog.Root>
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>Title</Dialog.Title>
          <Dialog.Close>Dismiss</Dialog.Close>
        </Dialog.Content>
      </Dialog.Root>,
    );

    await screen.getByRole('button', { name: 'Open' }).click();
    await expect.element(screen.getByRole('dialog')).toBeVisible();

    await screen.getByRole('button', { name: 'Dismiss' }).click();

    await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the popup and backdrop inside `container` with scoped theme colours on the popup', async () => {
    // Same shape as Select.test.tsx's identically-purposed container test: a
    // scoped wrapper overriding a token the popup actually reads
    // (`--surface-default`, Dialog.module.css's `.popup` background), and a
    // computed-colour comparison proving the popup really painted with the
    // SCOPED value, not the ambient theme's.
    const scopeEl = document.createElement('div');
    scopeEl.className = 'dark';
    scopeEl.style.setProperty('--surface-default', 'oklch(0.2 0 0)');
    document.body.appendChild(scopeEl);

    const screen = await wrap(
      <Dialog.Root>
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Content
          container={scopeEl}
          classNames={{ backdrop: 'dialog-backdrop-probe', popup: 'dialog-popup-probe' }}
        >
          <Dialog.Title>My Dialog</Dialog.Title>
        </Dialog.Content>
      </Dialog.Root>,
    );

    await screen.getByRole('button', { name: 'Open' }).click();
    await expect.element(screen.getByRole('dialog')).toBeVisible();

    const backdrop = scopeEl.querySelector('.dialog-backdrop-probe');
    const popup = scopeEl.querySelector('.dialog-popup-probe');
    expect(backdrop).not.toBeNull();
    expect(popup).not.toBeNull();
    expect(scopeEl.contains(backdrop)).toBe(true);
    expect(scopeEl.contains(popup)).toBe(true);

    const popupEl = popup as HTMLElement;
    await vi.waitFor(
      () => {
        expect(popupEl.hasAttribute('data-starting-style')).toBe(false);
        expect(getComputedStyle(popupEl).opacity).toBe('1');
      },
      { timeout: 1000, interval: 10 },
    );

    const probe = document.createElement('div');
    probe.style.backgroundColor = 'var(--surface-default)';
    scopeEl.appendChild(probe);
    const scopedBackground = getComputedStyle(probe).backgroundColor;
    probe.remove();

    const popupBackground = getComputedStyle(popupEl).backgroundColor;
    expect(popupBackground).toBe(scopedBackground);

    scopeEl.remove();
  });

  it('keeps a side gutter on a 320px viewport (popup never edge-to-edge)', async () => {
    // Below --breakpoint-xs (384px) the popup's max-inline-size clamp never
    // engaged, so the fixed-inset auto margins resolved to 0 and the popup
    // ran edge-to-edge. Visual fixtures never render a sub-384px viewport,
    // so this computed pin is the gate for the min()-based clamp.
    await page.viewport(320, 640);
    try {
      const screen = await wrap(
        <Dialog.Root defaultOpen>
          <Dialog.Content>
            <Dialog.Title>Narrow viewport</Dialog.Title>
          </Dialog.Content>
        </Dialog.Root>,
      );
      const dialog = screen.getByRole('dialog');
      await expect.element(dialog).toBeVisible();
      const popupEl = dialog.element() as HTMLElement;
      // Settle the enter transition first: while [data-starting-style]'s
      // scale(0.96) is still interpolating, getBoundingClientRect() reports
      // a shrunken box whose left edge is off the viewport edge, which would
      // fake exactly the gutter this test exists to pin.
      await vi.waitFor(
        () => {
          expect(popupEl.hasAttribute('data-starting-style')).toBe(false);
          const cs = getComputedStyle(popupEl);
          expect(cs.opacity).toBe('1');
          expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(cs.transform);
        },
        { timeout: 1000, interval: 10 },
      );
      const rect = popupEl.getBoundingClientRect();
      expect(rect.left).toBeGreaterThan(0);
      expect(window.innerWidth - rect.right).toBeGreaterThan(0);
    } finally {
      // vitest's browser-tier default viewport; restored so later tests in
      // this file (and this worker's other files) measure at the size they
      // were written for.
      await page.viewport(414, 896);
    }
  });

  it('has zero axe violations for an open dialog with title, description, and close', async () => {
    // Same exposure as Popover.test.tsx's/Select.test.tsx's identically-named
    // axe cases: Dialog.module.css's `.popup` has an opacity/transform enter
    // transition AND the same `[data-starting-style]` mount-entry state Base
    // UI clears on the next animation frame, independent of the CSS
    // transition -- the assertion has to poll for that frame to have fired
    // before axe reads the element, or axe-core silently skips a
    // still-transitioning element instead of actually grading its colours.
    const localContainer = document.createElement('div');
    document.body.appendChild(localContainer);
    const removeNoTransitionStyle = installNoTransitionStyle();
    localContainer.classList.add(NO_TRANSITION_CLASS);

    const screen = await wrap(
      <Dialog.Root defaultOpen>
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Content container={localContainer}>
          <Dialog.Title>Dialog title</Dialog.Title>
          <Dialog.Description>A short description of what this dialog shows.</Dialog.Description>
          <Dialog.Close>Dismiss</Dialog.Close>
        </Dialog.Content>
      </Dialog.Root>,
    );

    const dialog = screen.getByRole('dialog');
    await expect.element(dialog).toBeVisible();
    const dialogEl = dialog.element() as HTMLElement;
    await vi.waitFor(
      () => {
        expect(dialogEl.hasAttribute('data-starting-style')).toBe(false);
        expect(getComputedStyle(dialogEl).opacity).toBe('1');
      },
      { timeout: 1000, interval: 10 },
    );

    const results = await runAxe(localContainer);
    expect(results.violations, formatViolations(results.violations)).toEqual([]);

    removeNoTransitionStyle();
    localContainer.remove();
  });

  it("does not expose Base UI's render prop on the public Trigger part", async () => {
    // Compile-time pin, same shape as Popover.test.tsx's/Tooltip.test.tsx's
    // identically-named case: `render` is Base UI's own polymorphism
    // mechanism and is deliberately omitted from every part's public prop
    // type (Dialog.tsx's TriggerProps/ContentProps/TitleProps/
    // DescriptionProps/CloseProps).
    const TriggerWithLeakedRender = () => (
      // @ts-expect-error: `render` is not part of the public Trigger prop surface
      <Dialog.Trigger render={<span data-testid="leaked-render">nope</span>}>Open</Dialog.Trigger>
    );

    const screen = await wrap(
      <Dialog.Root>
        <TriggerWithLeakedRender />
        <Dialog.Content>
          <Dialog.Title>Title</Dialog.Title>
        </Dialog.Content>
      </Dialog.Root>,
    );

    const trigger = screen.getByRole('button', { name: 'Open' }).element();
    expect(trigger.tagName).toBe('BUTTON');
    expect(screen.container.querySelector('[data-testid="leaked-render"]')).toBeNull();
  });

  it('accepts style props on Root, strips them, and applies no padding anywhere (Root has no DOM of its own)', async () => {
    // Same shape as Popover.test.tsx's/Tooltip.test.tsx's identically-named
    // case: Root renders no element of its own (Base UI's Root is a context
    // provider, see Dialog.tsx's root part), so a style prop on Root is
    // accepted and extracted by the builder but has nowhere to attach: inert
    // by design.
    const screen = await wrap(
      <Dialog.Root p="md">
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>Title</Dialog.Title>
        </Dialog.Content>
      </Dialog.Root>,
    );

    const trigger = screen.getByRole('button', { name: 'Open' }).element();
    expect(trigger.getAttribute('p')).toBeNull();
    expect((trigger as HTMLElement).style.padding).toBe('');

    await screen.getByRole('button', { name: 'Open' }).click();

    const dialog = screen.getByRole('dialog');
    await expect.element(dialog).toBeVisible();
    const dialogEl = dialog.element();
    expect(dialogEl.getAttribute('p')).toBeNull();
    expect((dialogEl as HTMLElement).style.padding).toBe('');
  });
});
