/**
 * Tabs recipe tests — Wave 3 pilot
 */
import { describe, expect, it } from 'vitest';
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
});
