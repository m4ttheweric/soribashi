/**
 * Tabs recipe tests — Wave 3 pilot
 */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
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
          <Tabs.List data-testid="list">
            <span>list-child</span>
          </Tabs.List>
        </Tabs>,
      ),
    );

    expect(screen.getByTestId('list')).toBeInTheDocument();
    expect(screen.getByText('list-child')).toBeInTheDocument();
  });
});
