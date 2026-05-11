/**
 * Tabs recipe tests — Wave 3 pilot
 */
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
});
