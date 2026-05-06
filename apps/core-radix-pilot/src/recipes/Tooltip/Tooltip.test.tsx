/**
 * Tooltip recipe tests — Wave 2 pilot
 *
 * Tasks covered:
 *   8.2 — basic render lifecycle (content hidden until hover)
 *   8.3 — open-on-hover + escape-close
 *   8.4 — asChild, portal, default + subtle variant vars, safe-context throw
 */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SoribashiProvider } from '@soribashi/core';
import { theme } from '../../theme/index.ts';
import { Tooltip } from './Tooltip.tsx';

// ---------------------------------------------------------------------------
// Test wrappers
// ---------------------------------------------------------------------------

function withProviders(node: React.ReactNode) {
  return (
    <SoribashiProvider theme={theme}>
      <Tooltip.Provider>
        {node}
      </Tooltip.Provider>
    </SoribashiProvider>
  );
}

/** Provider with delayDuration=0 so hover tests don't need arbitrary timers. */
function withProvidersFastDelay(node: React.ReactNode) {
  return (
    <SoribashiProvider theme={theme}>
      <Tooltip.Provider delayDuration={0}>
        {node}
      </Tooltip.Provider>
    </SoribashiProvider>
  );
}

// ---------------------------------------------------------------------------
// Task 8.2 — Render lifecycle
// ---------------------------------------------------------------------------

describe('Tooltip recipe', () => {
  it('renders trigger; content is hidden until hover', () => {
    render(
      withProviders(
        <Tooltip>
          <Tooltip.Trigger asChild>
            <button>init-trigger</button>
          </Tooltip.Trigger>
          <Tooltip.Content>init-tooltip-content</Tooltip.Content>
        </Tooltip>,
      ),
    );

    expect(screen.getByText('init-trigger')).toBeInTheDocument();
    // Before hover: Radix does not mount the tooltip content at all.
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Task 8.3 — Open lifecycle
  // ---------------------------------------------------------------------------

  it('opens on hover and closes on escape', async () => {
    const user = userEvent.setup();
    render(
      withProvidersFastDelay(
        <Tooltip>
          <Tooltip.Trigger asChild>
            <button>hover-trigger</button>
          </Tooltip.Trigger>
          <Tooltip.Content>hover-tooltip-content</Tooltip.Content>
        </Tooltip>,
      ),
    );

    await user.hover(screen.getByText('hover-trigger'));
    // Radix renders the tooltip text twice: once in the visible content div and
    // once in a visually-hidden <span role="tooltip"> for screen readers.
    // Wait for the accessible tooltip role to appear.
    expect(await screen.findByRole('tooltip', { name: 'hover-tooltip-content' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip', { name: 'hover-tooltip-content' })).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Task 8.4 — asChild + portal + inverted variant + safe-context throw
  // ---------------------------------------------------------------------------

  it('asChild forwards trigger styling onto the child element', async () => {
    render(
      withProvidersFastDelay(
        <Tooltip>
          <Tooltip.Trigger asChild>
            <button data-testid="custom-btn">trigger</button>
          </Tooltip.Trigger>
          <Tooltip.Content>tip</Tooltip.Content>
        </Tooltip>,
      ),
    );

    const btn = screen.getByTestId('custom-btn');
    expect(btn.className).toContain('cr-Tooltip-trigger');
  });

  it('renders content inside a portal (not inside the test container)', async () => {
    const user = userEvent.setup();
    const { container } = render(
      withProvidersFastDelay(
        <Tooltip>
          <Tooltip.Trigger asChild>
            <button>portal-trigger</button>
          </Tooltip.Trigger>
          <Tooltip.Content>portal-tooltip-text</Tooltip.Content>
        </Tooltip>,
      ),
    );

    await user.hover(screen.getByText('portal-trigger'));
    // Wait for tooltip to appear (use role query to avoid Radix's duplicate text nodes)
    await screen.findByRole('tooltip', { name: 'portal-tooltip-text' });

    // Content is in document.body, NOT inside the test render container.
    expect(container.querySelector('.cr-Tooltip-content')).toBeNull();
    expect(document.body.querySelector('.cr-Tooltip-content')).not.toBeNull();
  });

  it('default variant applies the formalized floating-surface foreground vars', async () => {
    const user = userEvent.setup();
    render(
      withProvidersFastDelay(
        <Tooltip>
          <Tooltip.Trigger asChild>
            <button>default-trigger</button>
          </Tooltip.Trigger>
          <Tooltip.Content>default-tip-text</Tooltip.Content>
        </Tooltip>,
      ),
    );

    await user.hover(screen.getByText('default-trigger'));
    await screen.findByRole('tooltip', { name: 'default-tip-text' });

    const contentDiv = document.body.querySelector('.cr-Tooltip-content') as HTMLElement;
    expect(contentDiv).not.toBeNull();
    expect(contentDiv.style.getPropertyValue('--cr-tooltip-bg')).toBe('var(--surface-floating)');
    expect(contentDiv.style.getPropertyValue('--cr-tooltip-color')).toBe('var(--surface-floating-foreground)');
  });

  it('variant="subtle" applies the page-surface vars (opt-in non-inverted)', async () => {
    const user = userEvent.setup();
    render(
      withProvidersFastDelay(
        <Tooltip variant="subtle">
          <Tooltip.Trigger asChild>
            <button>subtle-trigger</button>
          </Tooltip.Trigger>
          <Tooltip.Content>subtle-tip-text</Tooltip.Content>
        </Tooltip>,
      ),
    );

    await user.hover(screen.getByText('subtle-trigger'));
    await screen.findByRole('tooltip', { name: 'subtle-tip-text' });

    const contentDiv = document.body.querySelector('.cr-Tooltip-content') as HTMLElement;
    expect(contentDiv).not.toBeNull();
    expect(contentDiv.style.getPropertyValue('--cr-tooltip-bg')).toBe('var(--surface-raised)');
    expect(contentDiv.style.getPropertyValue('--cr-tooltip-color')).toBe('var(--text-default)');
  });

  it('throws when Tooltip.Trigger is rendered outside Tooltip', () => {
    // defineCompound's partGetStyles throws "<Name.Part> must be inside <Name>"
    // when a context-consuming part (one that calls getStyles) renders outside Root.
    expect(() =>
      render(
        <SoribashiProvider theme={theme}>
          <Tooltip.Provider>
            <Tooltip.Trigger asChild>
              <button>x</button>
            </Tooltip.Trigger>
          </Tooltip.Provider>
        </SoribashiProvider>,
      ),
    ).toThrow(/<Tooltip\.Trigger> must be inside <Tooltip>/);
  });
});
