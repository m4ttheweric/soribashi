import { SoribashiProvider } from '@soribashi/core';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { formatViolations, runAxe } from '../../a11y/axe.ts';
import { uiTheme } from '../../theme.ts';
import { Accordion } from './Accordion.tsx';

// `render` from vitest-browser-react resolves a Promise<RenderResult> (see
// Tabs.test.tsx); `wrap` awaits it so callers get the real result object.
const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={uiTheme}>{ui}</SoribashiProvider>);

/**
 * This recipe's Panel part defaults `keepMounted` to true, overriding Base
 * UI's own `false` (AccordionRoot.d.ts), because a panel that unmounts on
 * close leaves nothing for the collapse animation to run on. A closed panel
 * is therefore present in the DOM but hidden by Base UI, so the assertions
 * below check VISIBILITY rather than presence. They still read real computed
 * style and real box geometry, never a `data-*` attribute that merely claims
 * a value changed.
 *
 * Openings and closes now take a real animation (Accordion.module.css's
 * keyframes), so anything measuring the panel's box has to poll rather than
 * assert synchronously, or it races the first frame.
 */
function TwoItems({ defaultValue }: { defaultValue?: string[] } = {}) {
  return (
    <Accordion.Root defaultValue={defaultValue}>
      <Accordion.Item value="a">
        <Accordion.Header>
          <Accordion.Trigger>Header A</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel>Panel A content</Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item value="b">
        <Accordion.Header>
          <Accordion.Trigger>Header B</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel>Panel B content</Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  );
}

describe('Accordion (browser)', () => {
  it('expands an item on trigger click and shows only that panel (computed, not attribute)', async () => {
    const screen = await wrap(<TwoItems />);

    await expect.element(screen.getByText('Panel A content')).not.toBeVisible();
    await expect.element(screen.getByText('Panel B content')).not.toBeVisible();

    const triggerA = screen.getByRole('button', { name: 'Header A' }).element() as HTMLElement;
    await userEvent.click(triggerA);

    await expect.element(screen.getByText('Panel A content')).toBeVisible();
    const panelA = screen.getByText('Panel A content').element() as HTMLElement;
    expect(getComputedStyle(panelA).display).not.toBe('none');
    // Computed, not attribute: a real rendered box with non-zero size, not
    // merely the absence of a `hidden` attribute. Polled because the panel
    // now opens through a height animation, so it genuinely measures 0 for
    // the first frame; asserting synchronously would race the animation.
    await vi.waitFor(() => expect(panelA.offsetHeight).toBeGreaterThan(0), {
      timeout: 1000,
      interval: 10,
    });
    // The sibling panel stays mounted (the panel part defaults `keepMounted`
    // so the collapse has something to animate) but is hidden by Base UI, so
    // "not visible" rather than "not present" is the assertion that holds.
    await expect.element(screen.getByText('Panel B content')).not.toBeVisible();
  });

  it('collapses an open item on second click', async () => {
    const screen = await wrap(<TwoItems defaultValue={['a']} />);
    const triggerA = screen.getByRole('button', { name: 'Header A' }).element() as HTMLElement;

    await expect.element(screen.getByText('Panel A content')).toBeVisible();

    await userEvent.click(triggerA);

    // Bounded settle-poll (matrix-harness.tsx's idiom, worked example in
    // Tooltip.test.tsx). The close now runs a real collapse animation, so the
    // panel stays measurable for its duration before Base UI marks it hidden;
    // polling is what makes this independent of that duration.
    await vi.waitFor(
      () => {
        const panel = screen.getByText('Panel A content').element() as HTMLElement;
        expect(panel.checkVisibility()).toBe(false);
      },
      { timeout: 1000, interval: 10 },
    );
  });

  it('moves focus between headers with arrow keys and toggles with Enter/Space', async () => {
    const screen = await wrap(<TwoItems />);
    const triggerA = screen.getByRole('button', { name: 'Header A' }).element() as HTMLElement;
    const triggerB = screen.getByRole('button', { name: 'Header B' }).element() as HTMLElement;

    triggerA.focus();
    expect(document.activeElement).toBe(triggerA);

    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(triggerB);

    // Wraps at the end back to the first header (this recipe's own roving
    // handler owns wraparound; see Accordion.tsx's `focusAdjacentTrigger`
    // finding: Base UI's installed Accordion wires no arrow-key navigation
    // at all).
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(triggerA);

    await userEvent.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(triggerB);

    // Enter/Space toggle via native <button> semantics (free: Base UI's
    // Trigger renders a real button, nativeButton default true), not this
    // recipe's own keydown handler, which only ever acts on Arrow keys.
    await expect.element(screen.getByText('Panel B content')).not.toBeVisible();
    await userEvent.keyboard('{Enter}');
    await expect.element(screen.getByText('Panel B content')).toBeVisible();

    await userEvent.keyboard(' ');
    await vi.waitFor(
      () => {
        const panel = screen.getByText('Panel B content').element() as HTMLElement;
        expect(panel.checkVisibility()).toBe(false);
      },
      { timeout: 1000, interval: 10 },
    );
  });

  it('associates each trigger and panel (aria-controls / aria-labelledby resolve to each other)', async () => {
    const screen = await wrap(<TwoItems defaultValue={['a']} />);
    const triggerA = screen.getByRole('button', { name: 'Header A' }).element();
    const panelA = screen.getByText('Panel A content').element();

    // Base UI's Trigger only sets `aria-controls` while its panel is open
    // (AccordionTrigger.mjs: `'aria-controls': open ? panelId : undefined`),
    // so this association is only observable (and only meaningful) on an open
    // item -- confirmed from the installed source, not assumed.
    expect(triggerA.getAttribute('aria-controls')).toBe(panelA.id);
    expect(panelA.getAttribute('aria-labelledby')).toBe(triggerA.id);
  });

  it('has zero axe violations for an accordion with one item expanded', async () => {
    const screen = await wrap(<TwoItems defaultValue={['a']} />);
    const results = await runAxe(screen.container);
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });

  it('renders Header polymorphically at a different heading level', async () => {
    const screen = await wrap(
      <Accordion.Root defaultValue={['a']}>
        <Accordion.Item value="a">
          <Accordion.Header as="h2">
            <Accordion.Trigger>Header A</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Panel A content</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );

    const heading = screen.getByRole('heading', { level: 2 }).element();
    expect(heading.tagName).toBe('H2');
    expect(heading.textContent).toBe('Header A');
  });

  it('stamps data-panel-open on an expanded trigger and never emits data-variant on root (no vocabulary axes this slice)', async () => {
    const screen = await wrap(
      <Accordion.Root defaultValue={['a']} classNames={{ root: 'probe-accordion-root' }}>
        <Accordion.Item value="a">
          <Accordion.Header>
            <Accordion.Trigger>Header A</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Panel A content</Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="b">
          <Accordion.Header>
            <Accordion.Trigger>Header B</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Panel B content</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );

    const root = screen.container.querySelector('.probe-accordion-root')!;
    expect(root.hasAttribute('data-variant')).toBe(false);
    expect(root.hasAttribute('data-intent')).toBe(false);
    expect(root.hasAttribute('data-size')).toBe(false);

    const triggerA = screen.getByRole('button', { name: 'Header A' }).element();
    const triggerB = screen.getByRole('button', { name: 'Header B' }).element();
    expect(triggerA.getAttribute('data-panel-open')).toBe('');
    expect(triggerB.hasAttribute('data-panel-open')).toBe(false);
  });
});
