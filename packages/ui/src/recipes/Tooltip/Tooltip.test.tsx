import { SoribashiProvider } from '@soribashi/core';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { formatViolations, runAxe } from '../../a11y/axe.ts';
import { installNoTransitionStyle, NO_TRANSITION_CLASS } from '../../a11y/matrix-harness.tsx';
import { uiTheme } from '../../theme.ts';
import { Tooltip } from './Tooltip.tsx';

// `render` from vitest-browser-react resolves a Promise<RenderResult> (see
// Button.test.tsx); `wrap` awaits it so callers get the real result object.
const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={uiTheme}>{ui}</SoribashiProvider>);

describe('Tooltip (browser)', () => {
  it('is closed by default: trigger is visible, popup absent from the DOM', async () => {
    const screen = await wrap(
      <Tooltip.Root>
        <Tooltip.Trigger delay={0}>Hover me</Tooltip.Trigger>
        <Tooltip.Content>Helpful hint</Tooltip.Content>
      </Tooltip.Root>,
    );

    const trigger = screen.getByRole('button', { name: 'Hover me' });
    await expect.element(trigger).toBeVisible();
    // No `keepMounted`, so a never-opened tooltip renders nothing at all,
    // not just hidden (same shape as Popover.test.tsx's identical case).
    expect(screen.getByRole('tooltip').query()).toBeNull();
  });

  it('opens on trigger hover and closes when the pointer leaves', async () => {
    const screen = await wrap(
      <Tooltip.Root>
        <Tooltip.Trigger delay={0}>Hover me</Tooltip.Trigger>
        <Tooltip.Content>Helpful hint</Tooltip.Content>
      </Tooltip.Root>,
    );

    const trigger = screen.getByRole('button', { name: 'Hover me' });

    // A REAL pointer hover (vitest-browser's userEvent drives an actual
    // Playwright pointer move over the element), not a synthetic
    // dispatchEvent: Base UI's open-on-hover path listens for real
    // pointer/mouse events via floating-ui-react's hover interaction.
    await userEvent.hover(trigger.element());

    await expect.element(screen.getByRole('tooltip')).toBeVisible();
    await expect.element(screen.getByRole('tooltip')).toHaveTextContent('Helpful hint');

    await userEvent.unhover(trigger.element());

    await expect.element(screen.getByRole('tooltip')).not.toBeInTheDocument();
  });

  it('opens on keyboard focus and closes on Escape', async () => {
    const screen = await wrap(
      <Tooltip.Root>
        <Tooltip.Trigger delay={0}>Hover me</Tooltip.Trigger>
        <Tooltip.Content>Helpful hint</Tooltip.Content>
      </Tooltip.Root>,
    );

    // A real keyboard Tab, not a programmatic `.focus()` call: the trigger
    // is the only focusable element in this tree, so one Tab lands on it.
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Hover me' }).element());

    await expect.element(screen.getByRole('tooltip')).toBeVisible();

    await userEvent.keyboard('{Escape}');

    await expect.element(screen.getByRole('tooltip')).not.toBeInTheDocument();
  });

  it('names the trigger for assistive tech from the tooltip content, only while open', async () => {
    // Base UI's installed Tooltip wires neither `aria-describedby` nor
    // `aria-labelledby` from the trigger to the popup by default (see the
    // task report's Base UI Tooltip findings, and Tooltip.tsx's trigger-part
    // comment): this recipe wires the standard WAI-ARIA tooltip pattern
    // itself. Asserted by resolved TEXT (what the association actually
    // points at), not by which attribute name carries it, per the brief.
    //
    // Fix round 1 finding: the association must be GATED on open state, not
    // present unconditionally -- the Popup has no `keepMounted`, so while
    // closed the id it would reference does not exist in the DOM at all, and
    // an `aria-describedby` pointing at a non-existent id is an invalid
    // dangling IDREF for the entire closed lifetime of the tooltip (most of
    // the time). Asserted on both sides of the open/close transition, not
    // just the open side.
    const screen = await wrap(
      <Tooltip.Root>
        <Tooltip.Trigger delay={0}>Hover me</Tooltip.Trigger>
        <Tooltip.Content>Helpful hint</Tooltip.Content>
      </Tooltip.Root>,
    );

    const trigger = screen.getByRole('button', { name: 'Hover me' });
    expect(trigger.element().getAttribute('aria-describedby')).toBeNull();

    await userEvent.hover(trigger.element());
    await expect.element(screen.getByRole('tooltip')).toBeVisible();

    const describedbyId = trigger.element().getAttribute('aria-describedby');
    expect(describedbyId).toBeTruthy();
    const describedEl = document.getElementById(describedbyId as string);
    expect(describedEl).not.toBeNull();
    expect(describedEl?.textContent).toBe('Helpful hint');

    await userEvent.unhover(trigger.element());
    await expect.element(screen.getByRole('tooltip')).not.toBeInTheDocument();
    expect(trigger.element().getAttribute('aria-describedby')).toBeNull();
  });

  it('renders the popup inside `container` with the scoped theme colours (portal-escapes-scope)', async () => {
    // Same shape as Select.test.tsx's identically-purposed container test: a
    // scoped wrapper overriding a token the popup actually reads, `container`
    // re-anchoring the portal inside that wrapper, and a computed-colour
    // comparison proving the popup really painted with the SCOPED value, not
    // the ambient theme's.
    const scopeEl = document.createElement('div');
    scopeEl.className = 'dark';
    scopeEl.style.setProperty('--color-neutral-800', 'oklch(0.4 0 0)');
    document.body.appendChild(scopeEl);

    const screen = await wrap(
      <Tooltip.Root>
        <Tooltip.Trigger delay={0}>Hover me</Tooltip.Trigger>
        <Tooltip.Content container={scopeEl} classNames={{ popup: 'tooltip-popup-probe' }}>
          Helpful hint
        </Tooltip.Content>
      </Tooltip.Root>,
    );

    const trigger = screen.getByRole('button', { name: 'Hover me' });
    await userEvent.hover(trigger.element());
    await expect.element(screen.getByRole('tooltip')).toBeVisible();

    const popup = scopeEl.querySelector('.tooltip-popup-probe');
    expect(popup).not.toBeNull();
    expect(scopeEl.contains(popup)).toBe(true);

    // Settle-poll before measuring, the idiom every timing-sensitive
    // measurement in this package follows: a raw `background-color` read is
    // unaffected by the popup's own `opacity` transition (a separate CSS
    // property), so this isn't strictly required for THIS measurement the
    // way an axe/contrast read would be, but it is applied anyway per the
    // self-review bar ("every measuring assertion behind the settle idiom")
    // and costs nothing since the popup is already open.
    const popupEl = popup as HTMLElement;
    await vi.waitFor(
      () => {
        expect(popupEl.hasAttribute('data-starting-style')).toBe(false);
        expect(getComputedStyle(popupEl).opacity).toBe('1');
      },
      { timeout: 1000, interval: 10 },
    );

    const probe = document.createElement('div');
    probe.style.backgroundColor = 'var(--color-neutral-800)';
    scopeEl.appendChild(probe);
    const scopedBackground = getComputedStyle(probe).backgroundColor;
    probe.remove();

    const popupBackground = getComputedStyle(popupEl).backgroundColor;
    expect(popupBackground).toBe(scopedBackground);

    await userEvent.unhover(trigger.element());
    scopeEl.remove();
  });

  it('has zero axe violations for an open tooltip', async () => {
    // Fix round 1 finding: both templates this recipe is built on (Popover,
    // Select) carry a dedicated zero-axe-violations test on their own open
    // overlay; Tooltip had none. Same mechanism as
    // Popover.test.tsx's/Select.test.tsx's identically-named cases (see
    // either file's own comment for the full rationale): Tooltip.module.css's
    // `.popup` has the same opacity/transform enter transition AND the same
    // `[data-starting-style]` mount-entry state Base UI clears on the next
    // animation frame (`useTransitionStatus`), independent of the CSS
    // transition -- disabling the transition alone is not enough, the
    // assertion has to poll for that frame to have fired before axe reads
    // the element, or axe-core silently skips a still-transitioning element
    // (a near-vacuous pass) instead of actually grading its colours.
    //
    // This is also the one test that exercises the interaction between this
    // recipe's own `role="tooltip"` wiring and Base UI's other popup
    // attributes (`aria-hidden` on the Arrow, `data-open`/`data-side`/
    // `data-align` on the Positioner and Popup): a broken combination there
    // (e.g. a missing accessible name, an invalid role nesting) is exactly
    // the class of violation axe-core would catch that the more targeted
    // tests above do not.
    const localContainer = document.createElement('div');
    document.body.appendChild(localContainer);
    const removeNoTransitionStyle = installNoTransitionStyle();
    localContainer.classList.add(NO_TRANSITION_CLASS);

    const screen = await wrap(
      <Tooltip.Root defaultOpen>
        <Tooltip.Trigger delay={0}>Hover me</Tooltip.Trigger>
        <Tooltip.Content container={localContainer}>Helpful hint</Tooltip.Content>
      </Tooltip.Root>,
    );

    const tooltip = screen.getByRole('tooltip');
    await expect.element(tooltip).toBeVisible();
    const tooltipEl = tooltip.element() as HTMLElement;
    await vi.waitFor(
      () => {
        expect(tooltipEl.hasAttribute('data-starting-style')).toBe(false);
        expect(getComputedStyle(tooltipEl).opacity).toBe('1');
      },
      { timeout: 1000, interval: 10 },
    );

    const results = await runAxe(localContainer);
    expect(results.violations, formatViolations(results.violations)).toEqual([]);

    removeNoTransitionStyle();
    localContainer.remove();
  });

  it("does not expose Base UI's render prop on the public Trigger part", async () => {
    // Compile-time pin, same shape as Popover.test.tsx's identically-named
    // case: `render` is Base UI's own polymorphism mechanism and is
    // deliberately omitted from every part's public prop type (Tooltip.tsx's
    // TriggerProps/ContentProps).
    const TriggerWithLeakedRender = () => (
      // @ts-expect-error: `render` is not part of the public Trigger prop surface
      <Tooltip.Trigger render={<span data-testid="leaked-render">nope</span>}>
        Hover me
      </Tooltip.Trigger>
    );

    const screen = await wrap(
      <Tooltip.Root>
        <TriggerWithLeakedRender />
        <Tooltip.Content>Helpful hint</Tooltip.Content>
      </Tooltip.Root>,
    );

    const trigger = screen.getByRole('button', { name: 'Hover me' }).element();
    expect(trigger.tagName).toBe('BUTTON');
    expect(screen.container.querySelector('[data-testid="leaked-render"]')).toBeNull();
  });

  it('accepts style props on Root, strips them, and applies no padding anywhere (Root has no DOM of its own)', async () => {
    // Same shape as Popover.test.tsx's identically-named case: Root renders
    // no element of its own (Base UI's Root is a context provider), so a
    // style prop on Root is accepted and extracted by the builder but has
    // nowhere to attach: inert by design.
    const screen = await wrap(
      <Tooltip.Root p="md">
        <Tooltip.Trigger delay={0}>Hover me</Tooltip.Trigger>
        <Tooltip.Content>Helpful hint</Tooltip.Content>
      </Tooltip.Root>,
    );

    const trigger = screen.getByRole('button', { name: 'Hover me' }).element();
    expect(trigger.getAttribute('p')).toBeNull();
    expect((trigger as HTMLElement).style.padding).toBe('');

    await userEvent.hover(trigger);
    const tooltip = screen.getByRole('tooltip');
    await expect.element(tooltip).toBeVisible();
    const tooltipEl = tooltip.element();
    expect(tooltipEl.getAttribute('p')).toBeNull();
    expect((tooltipEl as HTMLElement).style.padding).toBe('');
  });
});
