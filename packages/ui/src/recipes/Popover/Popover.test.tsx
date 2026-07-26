import { SoribashiProvider } from '@soribashi/core';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { formatViolations, runAxe } from '../../a11y/axe.ts';
import { installNoTransitionStyle, NO_TRANSITION_CLASS } from '../../a11y/matrix-harness.tsx';
import { uiTheme } from '../../theme.ts';
import { Popover } from './Popover.tsx';

// `render` from vitest-browser-react resolves a Promise<RenderResult> (see
// Button.test.tsx); `wrap` awaits it so callers get the real result object.
const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={uiTheme}>{ui}</SoribashiProvider>);

/**
 * Resolves a CSS custom property to its browser-computed value by setting it
 * on a throwaway probe element and reading the computed style back. Avoids
 * hand-parsing oklch()/light-dark() text and matches however the browser
 * actually resolves the token, which is what the popup itself renders with.
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

describe('Popover (browser)', () => {
  it('is closed by default: trigger is visible, popup absent from the DOM', async () => {
    const screen = await wrap(
      <Popover.Root>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>
          <Popover.Title>Title</Popover.Title>
        </Popover.Content>
      </Popover.Root>,
    );
    const trigger = screen.getByRole('button', { name: 'Open' });
    await expect.element(trigger).toBeVisible();
    // No `keepMounted`, so a never-opened popover renders nothing at all,
    // not just hidden: confirmed against PopoverPortal.js's `mounted ||
    // keepMounted` guard.
    expect(screen.getByRole('dialog').query()).toBeNull();
  });

  it('click trigger opens a portalled popup with themed background and radius', async () => {
    const screen = await wrap(
      <Popover.Root>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>
          <Popover.Title>Title</Popover.Title>
        </Popover.Content>
      </Popover.Root>,
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

  it('Escape closes the popover', async () => {
    const screen = await wrap(
      <Popover.Root>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>
          <Popover.Title>Title</Popover.Title>
        </Popover.Content>
      </Popover.Root>,
    );

    await screen.getByRole('button', { name: 'Open' }).click();
    await expect.element(screen.getByRole('dialog')).toBeVisible();

    await userEvent.keyboard('{Escape}');

    await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
  });

  it('Title and Description wire aria-labelledby/aria-describedby onto the popup', async () => {
    const screen = await wrap(
      <Popover.Root open onOpenChange={() => {}}>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>
          <Popover.Title>My Title</Popover.Title>
          <Popover.Description>My Description</Popover.Description>
        </Popover.Content>
      </Popover.Root>,
    );

    const dialog = screen.getByRole('dialog');
    await expect.element(dialog).toBeVisible();
    const dialogEl = dialog.element();
    const titleEl = screen.getByText('My Title').element();
    const descriptionEl = screen.getByText('My Description').element();

    // Base UI wires these; this pins that our part composition (Content
    // rendering Title/Description as siblings inside Popup) did not break it.
    expect(dialogEl.getAttribute('aria-labelledby')).toBe(titleEl.id);
    expect(dialogEl.getAttribute('aria-describedby')).toBe(descriptionEl.id);
  });

  it('the Close part closes the popover on click', async () => {
    const screen = await wrap(
      <Popover.Root>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>
          <Popover.Title>Title</Popover.Title>
          <Popover.Close>Dismiss</Popover.Close>
        </Popover.Content>
      </Popover.Root>,
    );

    await screen.getByRole('button', { name: 'Open' }).click();
    await expect.element(screen.getByRole('dialog')).toBeVisible();

    await screen.getByRole('button', { name: 'Dismiss' }).click();

    await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
  });

  it('classNames styles-API on Content reaches the popup element (and container is a real Portal prop)', async () => {
    // `container` is exercised structurally in the two tests above (the
    // portal target defaults to <body>, proven by the parent-chain check);
    // here we confirm it is a real, forwarded prop by pointing it at a local
    // node and asserting the popup renders inside that node instead of body.
    const localContainer = document.createElement('div');
    document.body.appendChild(localContainer);

    const screen = await wrap(
      <Popover.Root open onOpenChange={() => {}}>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content container={localContainer} classNames={{ popup: 'my-popup-class' }}>
          <Popover.Title>Title</Popover.Title>
        </Popover.Content>
      </Popover.Root>,
    );

    const dialog = screen.getByRole('dialog');
    await expect.element(dialog).toBeVisible();
    const dialogEl = dialog.element();

    expect(dialogEl.classList.contains('my-popup-class')).toBe(true);
    expect(localContainer.contains(dialogEl)).toBe(true);

    localContainer.remove();
  });

  it("does not expose Base UI's render prop on the public Trigger part", async () => {
    // Compile-time pin: `render` is Base UI's own polymorphism mechanism and
    // is deliberately omitted from every part's public prop type (see
    // Popover.tsx's TriggerProps/ContentProps/TitleProps/DescriptionProps/
    // CloseProps). If this ever stops erroring, the omission regressed.
    const TriggerWithLeakedRender = () => (
      // @ts-expect-error: `render` is not part of the public Trigger prop surface
      <Popover.Trigger render={<span data-testid="leaked-render">nope</span>}>Open</Popover.Trigger>
    );

    const screen = await wrap(
      <Popover.Root>
        <TriggerWithLeakedRender />
        <Popover.Content>
          <Popover.Title>Title</Popover.Title>
        </Popover.Content>
      </Popover.Root>,
    );

    // Runtime pin: even if the type check is bypassed (e.g. an `as any` at
    // a call site), a `render` value must not reach Base UI's element-swap
    // mechanism. Trigger still renders as a real <button>, not the <span>.
    const trigger = screen.getByRole('button', { name: 'Open' }).element();
    expect(trigger.tagName).toBe('BUTTON');
    expect(screen.container.querySelector('[data-testid="leaked-render"]')).toBeNull();
  });

  it('accepts style props on Root, strips them, and applies no padding anywhere (Root has no DOM of its own)', async () => {
    // Popover.tsx is untouched by Task 2. Root renders no element of its own
    // (Base UI's Root is a context provider, see Popover.tsx's root part),
    // so a style prop on Root is accepted and extracted by the builder but
    // has nowhere to attach: inert by design. This pins that it never leaks
    // as a raw `p` attribute or an unexpected inline `padding` on the
    // trigger or popup elements it renders.
    const screen = await wrap(
      <Popover.Root p="md">
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>
          <Popover.Title>Title</Popover.Title>
        </Popover.Content>
      </Popover.Root>,
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

  it('has zero axe violations for an open popover with title, description, and close', async () => {
    // `container` re-anchors the portal locally (see the classNames/container
    // test above) so axe gets a single local subtree covering the popup's
    // showcase content instead of having to sweep all of document.body.
    //
    // Same exposure as Select.test.tsx's axe case (see that file's comment
    // for the full mechanism): Popover.module.css's `.popup` has an
    // identical opacity/transform enter transition AND the same
    // `[data-starting-style]` mount-entry state Base UI clears on the next
    // animation frame (`useTransitionStatus`), independent of the CSS
    // transition. Disabling the transition alone is not enough -- the
    // assertion has to poll for that frame to have fired, not sample once
    // right after `toBeVisible()` resolves.
    const localContainer = document.createElement('div');
    document.body.appendChild(localContainer);
    const removeNoTransitionStyle = installNoTransitionStyle();
    localContainer.classList.add(NO_TRANSITION_CLASS);

    const screen = await wrap(
      <Popover.Root open onOpenChange={() => {}}>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content container={localContainer}>
          <Popover.Title>Popover title</Popover.Title>
          <Popover.Description>A short description of what this popover shows.</Popover.Description>
          <Popover.Close>Dismiss</Popover.Close>
        </Popover.Content>
      </Popover.Root>,
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
});
