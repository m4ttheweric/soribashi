/**
 * Tabs recipe tests — Wave 3 pilot
 */
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SoribashiProvider, createTheme } from '@soribashi/core';
import { theme } from '../../theme/index.ts';
import { Tabs, type TabsRootProps, type TabsContentProps } from './Tabs.tsx';
import classes from './Tabs.module.css';

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
    const root = container.querySelector('[data-variant="default"]');
    expect(root).not.toBeNull();
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

  it('disabled Trigger does not fire onValueChange when clicked', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      withProviders(
        <Tabs defaultValue="a" onValueChange={onValueChange}>
          <Tabs.List>
            <Tabs.Trigger value="a">A</Tabs.Trigger>
            <Tabs.Trigger value="b" disabled>B</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
          <Tabs.Content value="b">content-b</Tabs.Content>
        </Tabs>,
      ),
    );

    await user.click(screen.getByRole('tab', { name: 'B' }));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByText('content-a')).toBeInTheDocument();
  });

  it('disabled Trigger is skipped by arrow-key navigation', async () => {
    const user = userEvent.setup();
    render(
      withProviders(
        <Tabs defaultValue="a">
          <Tabs.List>
            <Tabs.Trigger value="a">A</Tabs.Trigger>
            <Tabs.Trigger value="b" disabled>B</Tabs.Trigger>
            <Tabs.Trigger value="c">C</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
          <Tabs.Content value="b">content-b</Tabs.Content>
          <Tabs.Content value="c">content-c</Tabs.Content>
        </Tabs>,
      ),
    );

    screen.getByRole('tab', { name: 'A' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'C' })).toHaveFocus();
  });

  it('forceMount keeps inactive Content mounted in DOM', () => {
    render(
      withProviders(
        <Tabs defaultValue="a">
          <Tabs.List>
            <Tabs.Trigger value="a">A</Tabs.Trigger>
            <Tabs.Trigger value="b">B</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
          <Tabs.Content value="b" forceMount>content-b</Tabs.Content>
        </Tabs>,
      ),
    );

    // Active content is visible
    expect(screen.getByText('content-a')).toBeInTheDocument();
    // Inactive but forceMount'd content is still in DOM (hidden via Radix's `hidden` attr)
    expect(screen.getByText('content-b')).toBeInTheDocument();
    expect(screen.getByText('content-b').closest('[role="tabpanel"]'))
      .toHaveAttribute('data-state', 'inactive');
  });

  it('throws when Tabs.Trigger is rendered outside <Tabs>', () => {
    expect(() =>
      render(
        <SoribashiProvider theme={theme}>
          <Tabs.Trigger value="a">orphan</Tabs.Trigger>
        </SoribashiProvider>,
      ),
    ).toThrow(/<Tabs\.Trigger> must be inside <Tabs>/);
  });

  it('throws when Tabs.Content is rendered outside <Tabs>', () => {
    expect(() =>
      render(
        <SoribashiProvider theme={theme}>
          <Tabs.Content value="a">orphan</Tabs.Content>
        </SoribashiProvider>,
      ),
    ).toThrow(/<Tabs\.Content> must be inside <Tabs>/);
  });

  it('throws when Tabs.List is rendered outside <Tabs>', () => {
    expect(() =>
      render(
        <SoribashiProvider theme={theme}>
          <Tabs.List>orphan</Tabs.List>
        </SoribashiProvider>,
      ),
    ).toThrow(/<Tabs\.List> must be inside <Tabs>/);
  });

  it('className from instance props lands on Tabs.Trigger', () => {
    render(
      withProviders(
        <Tabs defaultValue="a">
          <Tabs.List>
            <Tabs.Trigger value="a" className="custom-trigger-class">A</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
        </Tabs>,
      ),
    );

    const tab = screen.getByRole('tab', { name: 'A' });
    expect(tab.className).toContain(classes.trigger);
    expect(tab.className).toContain('custom-trigger-class');
  });

  it('className from instance props lands on Tabs.Content', () => {
    render(
      withProviders(
        <Tabs defaultValue="a">
          <Tabs.List>
            <Tabs.Trigger value="a">A</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a" className="custom-content-class">content-a</Tabs.Content>
        </Tabs>,
      ),
    );

    const panel = screen.getByRole('tabpanel');
    expect(panel.className).toContain(classes.content);
    expect(panel.className).toContain('custom-content-class');
  });

  it('Tabs.extend({ defaultProps: { variant: "pills" } }) round-trips through createTheme', () => {
    const themeWithDefaults = createTheme({
      tokens: theme.tokens,
      semanticTokens: theme.semanticTokens,
      components: [
        Tabs.extend({ defaultProps: { variant: 'pills' } as Partial<TabsRootProps> }),
      ],
    });
    render(
      <SoribashiProvider theme={themeWithDefaults}>
        <Tabs defaultValue="a">
          <Tabs.List>
            <Tabs.Trigger value="a">A</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
        </Tabs>
      </SoribashiProvider>,
    );

    expect(screen.getByRole('tablist')).toHaveAttribute('data-variant', 'pills');
    expect(screen.getByRole('tab', { name: 'A' })).toHaveAttribute('data-variant', 'pills');
  });

  it('Tabs.Content.extend({ defaultProps: { forceMount: true } }) round-trips through createTheme', () => {
    const themeWithDefaults = createTheme({
      tokens: theme.tokens,
      semanticTokens: theme.semanticTokens,
      components: [
        Tabs.Content.extend({ defaultProps: { forceMount: true } as Partial<TabsContentProps> }),
      ],
    });
    render(
      <SoribashiProvider theme={themeWithDefaults}>
        <Tabs defaultValue="a">
          <Tabs.List>
            <Tabs.Trigger value="a">A</Tabs.Trigger>
            <Tabs.Trigger value="b">B</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
          <Tabs.Content value="b">content-b</Tabs.Content>
        </Tabs>
      </SoribashiProvider>,
    );

    // Even though 'a' is the active tab, 'b' content is mounted via extend forceMount
    expect(screen.getByText('content-a')).toBeInTheDocument();
    expect(screen.getByText('content-b')).toBeInTheDocument();
  });
});

describe('Tabs — vocabulary validation (dev)', () => {
  it('warns when variant is outside the declared vocabulary', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <SoribashiProvider theme={theme}>
        <Tabs variant={'zigzag' as never} defaultValue="a">
          <Tabs.List>
            <Tabs.Trigger value="a">A</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content</Tabs.Content>
        </Tabs>
      </SoribashiProvider>,
    );
    expect(
      errSpy.mock.calls.some((c) => String(c[0]).includes('not in the declared vocabulary')),
    ).toBe(true);
    errSpy.mockRestore();
  });
});
