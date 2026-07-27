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
 * Base UI's default `keepMounted` is `false` (AccordionRoot.d.ts), so a
 * closed item's Panel is not merely hidden, it is entirely absent from the
 * DOM once its close (a no-op instant close here: Accordion.module.css sets
 * no transition/animation on `.panel`, so Base UI's own
 * `useCollapsiblePanel` measures `animationType === 'none'` and unmounts
 * synchronously rather than entering the starting/ending transition
 * lifecycle -- see the task report's Base UI findings). Every assertion below
 * reads real DOM presence/computed style, never a `data-*` attribute that
 * merely claims a value changed.
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

    expect(screen.getByText('Panel A content').query()).toBeNull();
    expect(screen.getByText('Panel B content').query()).toBeNull();

    const triggerA = screen.getByRole('button', { name: 'Header A' }).element() as HTMLElement;
    await userEvent.click(triggerA);

    await expect.element(screen.getByText('Panel A content')).toBeVisible();
    const panelA = screen.getByText('Panel A content').element() as HTMLElement;
    // Computed, not attribute: a real rendered box with non-zero size, not
    // merely the absence of a `hidden` attribute.
    expect(getComputedStyle(panelA).display).not.toBe('none');
    expect(panelA.offsetHeight).toBeGreaterThan(0);
    // The sibling panel stays entirely out of the DOM (see the file header
    // comment), which is the strongest possible "not visible" a test can
    // observe.
    expect(screen.getByText('Panel B content').query()).toBeNull();
  });

  it('collapses an open item on second click', async () => {
    const screen = await wrap(<TwoItems defaultValue={['a']} />);
    const triggerA = screen.getByRole('button', { name: 'Header A' }).element() as HTMLElement;

    await expect.element(screen.getByText('Panel A content')).toBeVisible();

    await userEvent.click(triggerA);

    // Bounded settle-poll (matrix-harness.tsx's idiom, worked example in
    // Tooltip.test.tsx): the close is instant with this recipe's CSS today
    // (no transition declared on `.panel`), but polling rather than a single
    // synchronous assertion keeps this robust if a future transition is
    // added to Accordion.module.css.
    await vi.waitFor(
      () => {
        expect(screen.getByText('Panel A content').query()).toBeNull();
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
    expect(screen.getByText('Panel B content').query()).toBeNull();
    await userEvent.keyboard('{Enter}');
    await expect.element(screen.getByText('Panel B content')).toBeVisible();

    await userEvent.keyboard(' ');
    await vi.waitFor(
      () => {
        expect(screen.getByText('Panel B content').query()).toBeNull();
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
    // since a closed, unmounted panel has no id in the DOM to point at, so
    // this association is only observable (and only meaningful) on an open
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
