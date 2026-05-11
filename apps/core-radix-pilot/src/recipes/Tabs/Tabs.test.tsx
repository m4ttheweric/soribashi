/**
 * Tabs recipe tests — Wave 3 pilot
 */
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SoribashiProvider } from '@soribashi/core';
import { theme } from '../../theme/index.ts';
import { Tabs } from './Tabs.tsx';

function withProviders(node: React.ReactNode) {
  return <SoribashiProvider theme={theme}>{node}</SoribashiProvider>;
}

describe('Tabs recipe', () => {
  it('renders Tabs.Root + Tabs.List with children', () => {
    render(
      withProviders(
        <Tabs defaultValue="a">
          <Tabs.List>
            <span>list-child</span>
          </Tabs.List>
        </Tabs>,
      ),
    );

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByText('list-child')).toBeInTheDocument();
  });

  it('renders full Tabs with Trigger + Content; defaultValue panel is visible', () => {
    render(
      withProviders(
        <Tabs defaultValue="a">
          <Tabs.List>
            <Tabs.Trigger value="a">A</Tabs.Trigger>
            <Tabs.Trigger value="b">B</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
          <Tabs.Content value="b">content-b</Tabs.Content>
        </Tabs>,
      ),
    );

    expect(screen.getByRole('tab', { name: 'A' })).toHaveAttribute('data-state', 'active');
    expect(screen.getByRole('tab', { name: 'B' })).toHaveAttribute('data-state', 'inactive');
    expect(screen.getByText('content-a')).toBeInTheDocument();
    expect(screen.queryByText('content-b')).not.toBeInTheDocument();
  });

  it('clicking a Trigger switches data-state and the visible Content', async () => {
    const user = userEvent.setup();
    render(
      withProviders(
        <Tabs defaultValue="a">
          <Tabs.List>
            <Tabs.Trigger value="a">A</Tabs.Trigger>
            <Tabs.Trigger value="b">B</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
          <Tabs.Content value="b">content-b</Tabs.Content>
        </Tabs>,
      ),
    );

    await user.click(screen.getByRole('tab', { name: 'B' }));
    expect(screen.getByRole('tab', { name: 'B' })).toHaveAttribute('data-state', 'active');
    expect(screen.getByRole('tab', { name: 'A' })).toHaveAttribute('data-state', 'inactive');
    expect(screen.getByText('content-b')).toBeInTheDocument();
    expect(screen.queryByText('content-a')).not.toBeInTheDocument();
  });

  it('controlled mode: value + onValueChange round-trip', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(
      withProviders(
        <Tabs value="a" onValueChange={onValueChange}>
          <Tabs.List>
            <Tabs.Trigger value="a">A</Tabs.Trigger>
            <Tabs.Trigger value="b">B</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
          <Tabs.Content value="b">content-b</Tabs.Content>
        </Tabs>,
      ),
    );

    expect(screen.getByText('content-a')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'B' }));
    expect(onValueChange).toHaveBeenCalledWith('b');

    // Consumer-controlled — has to push the new value back
    rerender(
      withProviders(
        <Tabs value="b" onValueChange={onValueChange}>
          <Tabs.List>
            <Tabs.Trigger value="a">A</Tabs.Trigger>
            <Tabs.Trigger value="b">B</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
          <Tabs.Content value="b">content-b</Tabs.Content>
        </Tabs>,
      ),
    );

    expect(screen.getByText('content-b')).toBeInTheDocument();
    expect(screen.queryByText('content-a')).not.toBeInTheDocument();
  });

  it('keyboard nav: arrow keys move focus and switch active tab', async () => {
    const user = userEvent.setup();
    render(
      withProviders(
        <Tabs defaultValue="a">
          <Tabs.List>
            <Tabs.Trigger value="a">A</Tabs.Trigger>
            <Tabs.Trigger value="b">B</Tabs.Trigger>
            <Tabs.Trigger value="c">C</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
          <Tabs.Content value="b">content-b</Tabs.Content>
          <Tabs.Content value="c">content-c</Tabs.Content>
        </Tabs>,
      ),
    );

    const tabA = screen.getByRole('tab', { name: 'A' });
    tabA.focus();
    expect(tabA).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'B' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'B' })).toHaveAttribute('data-state', 'active');

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'C' })).toHaveFocus();

    // Loop back to first
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'A' })).toHaveFocus();
  });

  it('default variant applies data-variant attribute on List, Root, and Triggers', () => {
    const { container } = render(
      withProviders(
        <Tabs defaultValue="a">
          <Tabs.List>
            <Tabs.Trigger value="a">A</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
        </Tabs>,
      ),
    );

    // Root is the outermost element RadixTabs.Root renders.
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveAttribute('data-variant', 'default');
    expect(screen.getByRole('tablist')).toHaveAttribute('data-variant', 'default');
    expect(screen.getByRole('tab', { name: 'A' })).toHaveAttribute('data-variant', 'default');
  });

  it('variant="outline" propagates data-variant on List + Trigger', () => {
    render(
      withProviders(
        <Tabs variant="outline" defaultValue="a">
          <Tabs.List>
            <Tabs.Trigger value="a">A</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
        </Tabs>,
      ),
    );

    expect(screen.getByRole('tablist')).toHaveAttribute('data-variant', 'outline');
    expect(screen.getByRole('tab', { name: 'A' })).toHaveAttribute('data-variant', 'outline');
  });

  it('variant="pills" sets the active-pill bg + color vars on the List slot', () => {
    render(
      withProviders(
        <Tabs variant="pills" defaultValue="a">
          <Tabs.List>
            <Tabs.Trigger value="a">A</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
        </Tabs>,
      ),
    );

    const list = screen.getByRole('tablist') as HTMLElement;
    expect(list.style.getPropertyValue('--cr-tabs-active-bg')).toBe(
      'var(--color-primary-500)',
    );
    expect(list.style.getPropertyValue('--cr-tabs-active-color')).toBe(
      'var(--surface-default-foreground, var(--color-neutral-0))',
    );
  });

  it('non-pills variant: the active-pill vars resolve to transparent + text-default', () => {
    render(
      withProviders(
        <Tabs variant="default" defaultValue="a">
          <Tabs.List>
            <Tabs.Trigger value="a">A</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
        </Tabs>,
      ),
    );

    const list = screen.getByRole('tablist') as HTMLElement;
    expect(list.style.getPropertyValue('--cr-tabs-active-bg')).toBe('transparent');
    expect(list.style.getPropertyValue('--cr-tabs-active-color')).toBe(
      'var(--text-default)',
    );
  });

  it('Tabs.Trigger defaults to a <button> element', () => {
    render(
      withProviders(
        <Tabs defaultValue="a">
          <Tabs.List>
            <Tabs.Trigger value="a">A</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
        </Tabs>,
      ),
    );

    const tab = screen.getByRole('tab', { name: 'A' });
    expect(tab.tagName).toBe('BUTTON');
  });

  it('Tabs.Trigger with as="a" renders an anchor element', () => {
    render(
      withProviders(
        <Tabs defaultValue="a">
          <Tabs.List>
            <Tabs.Trigger value="a" as="a" href="/dashboard">A</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
        </Tabs>,
      ),
    );

    const tab = screen.getByRole('tab', { name: 'A' });
    expect(tab.tagName).toBe('A');
    expect(tab).toHaveAttribute('href', '/dashboard');
    expect(tab).toHaveAttribute('data-state', 'active');
  });

  it('Tabs.Trigger forwards refs to the rendered button (default element)', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      withProviders(
        <Tabs defaultValue="a">
          <Tabs.List>
            <Tabs.Trigger value="a" ref={ref}>A</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
        </Tabs>,
      ),
    );

    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe('BUTTON');
  });

  it('Tabs.Trigger forwards refs to the rendered anchor when as="a"', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      withProviders(
        <Tabs defaultValue="a">
          <Tabs.List>
            <Tabs.Trigger value="a" as="a" href="/x" ref={ref}>A</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
        </Tabs>,
      ),
    );

    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe('A');
    expect(ref.current?.getAttribute('href')).toBe('/x');
  });
});
