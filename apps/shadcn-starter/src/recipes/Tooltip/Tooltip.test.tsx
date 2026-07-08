import {
  SoribashiProvider,
  configureClassNameMerge,
  createTheme,
  registerTheme,
} from '@soribashi/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { twMerge } from 'tailwind-merge';
import { describe, expect, it } from 'vitest';
import { theme } from '../../theme/index.ts';
import { Tooltip } from './Tooltip.tsx';

configureClassNameMerge(twMerge);

function wrap(ui: React.ReactElement) {
  return render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);
}

describe('Tooltip compound', () => {
  it('renders the trigger; content is hidden until hover', () => {
    wrap(
      <Tooltip>
        <Tooltip.Trigger>
          <button type="button">init-trigger</button>
        </Tooltip.Trigger>
        <Tooltip.Content>init-tooltip-content</Tooltip.Content>
      </Tooltip>,
    );

    expect(screen.getByText('init-trigger')).toBeInTheDocument();
    // Before hover: Radix does not mount the tooltip content at all.
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('opens on hover and closes on escape', async () => {
    const user = userEvent.setup();
    wrap(
      <Tooltip delayDuration={0}>
        <Tooltip.Trigger>
          <button type="button">hover-trigger</button>
        </Tooltip.Trigger>
        <Tooltip.Content>hover-tooltip-content</Tooltip.Content>
      </Tooltip>,
    );

    await user.hover(screen.getByText('hover-trigger'));
    expect(
      await screen.findByRole('tooltip', { name: 'hover-tooltip-content' }),
    ).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(
      screen.queryByRole('tooltip', { name: 'hover-tooltip-content' }),
    ).not.toBeInTheDocument();
  });

  it('trigger wraps the child so the trigger element carries the compound styling', () => {
    wrap(
      <Tooltip>
        <Tooltip.Trigger>
          <button type="button" data-testid="inner-btn">
            trigger
          </button>
        </Tooltip.Trigger>
        <Tooltip.Content>tip</Tooltip.Content>
      </Tooltip>,
    );

    const btn = screen.getByTestId('inner-btn');
    // asChild merges Radix's trigger behavior onto the wrapping span, which
    // is the outer parent of the consumer's button.
    expect(btn.parentElement?.tagName).toBe('SPAN');
  });

  it('forwards a ref on Tooltip.Trigger to the wrapping span', () => {
    let node: HTMLElement | null = null;
    wrap(
      <Tooltip>
        <Tooltip.Trigger
          ref={(el: HTMLElement | null) => {
            node = el;
          }}
        >
          <button type="button">ref-trigger</button>
        </Tooltip.Trigger>
        <Tooltip.Content>tip</Tooltip.Content>
      </Tooltip>,
    );

    expect(node).toBeInstanceOf(HTMLSpanElement);
  });

  it('renders content inside a portal (not inside the test container)', async () => {
    const user = userEvent.setup();
    const { container } = wrap(
      <Tooltip delayDuration={0}>
        <Tooltip.Trigger>
          <button type="button">portal-trigger</button>
        </Tooltip.Trigger>
        <Tooltip.Content>portal-tooltip-text</Tooltip.Content>
      </Tooltip>,
    );

    await user.hover(screen.getByText('portal-trigger'));
    await screen.findByRole('tooltip', { name: 'portal-tooltip-text' });

    expect(container.querySelector('[role="tooltip"]')).toBeNull();
    expect(document.body.querySelector('[data-radix-popper-content-wrapper]')).not.toBeNull();
  });

  it('Content applies the recipe class', async () => {
    const user = userEvent.setup();
    wrap(
      <Tooltip delayDuration={0}>
        <Tooltip.Trigger>
          <button type="button">class-trigger</button>
        </Tooltip.Trigger>
        <Tooltip.Content>class-tip</Tooltip.Content>
      </Tooltip>,
    );

    await user.hover(screen.getByText('class-trigger'));
    const content = await screen.findByRole('tooltip', { name: 'class-tip' });
    // Content div is the parent of the accessible tooltip span (Radix renders
    // the visible text twice: once in the styled div, once in a visually
    // hidden accessible span).
    const contentDiv = content.closest('[data-side]') as HTMLElement;
    expect(contentDiv).not.toBeNull();
    expect(contentDiv.className).toContain('rounded-md');
    expect(contentDiv.className).toContain('bg-(--color-primary-900)');
  });

  it('defaults side to top via context when not overridden', async () => {
    const user = userEvent.setup();
    wrap(
      <Tooltip delayDuration={0}>
        <Tooltip.Trigger>
          <button type="button">default-side-trigger</button>
        </Tooltip.Trigger>
        <Tooltip.Content>default-side-tip</Tooltip.Content>
      </Tooltip>,
    );

    await user.hover(screen.getByText('default-side-trigger'));
    const content = await screen.findByRole('tooltip', { name: 'default-side-tip' });
    const contentDiv = content.closest('[data-side]') as HTMLElement;
    expect(contentDiv.getAttribute('data-side')).toBe('top');
  });

  it('side prop overrides the context default', async () => {
    const user = userEvent.setup();
    wrap(
      <Tooltip delayDuration={0}>
        <Tooltip.Trigger>
          <button type="button">bottom-side-trigger</button>
        </Tooltip.Trigger>
        <Tooltip.Content side="bottom">bottom-side-tip</Tooltip.Content>
      </Tooltip>,
    );

    await user.hover(screen.getByText('bottom-side-trigger'));
    const content = await screen.findByRole('tooltip', { name: 'bottom-side-tip' });
    const contentDiv = content.closest('[data-side]') as HTMLElement;
    expect(contentDiv.getAttribute('data-side')).toBe('bottom');
  });

  it('throws when Tooltip.Trigger is rendered outside Tooltip', () => {
    expect(() =>
      render(
        <SoribashiProvider theme={theme}>
          <Tooltip.Trigger>
            <button type="button">x</button>
          </Tooltip.Trigger>
        </SoribashiProvider>,
      ),
    ).toThrow(/<Tooltip\.Trigger> must be inside <Tooltip>/);
  });

  it('Tooltip.Content className from instance props lands on the rendered element', async () => {
    const user = userEvent.setup();
    wrap(
      <Tooltip delayDuration={0}>
        <Tooltip.Trigger>
          <button type="button">custom-class-trigger</button>
        </Tooltip.Trigger>
        <Tooltip.Content className="custom-content-class">custom-class-tip</Tooltip.Content>
      </Tooltip>,
    );
    await user.hover(screen.getByText('custom-class-trigger'));
    const content = await screen.findByRole('tooltip', { name: 'custom-class-tip' });
    const contentDiv = content.closest('[data-side]') as HTMLElement;
    expect(contentDiv.className).toContain('custom-content-class');
  });

  it('extend-set className for Tooltip.Content lands on the element', async () => {
    const user = userEvent.setup();
    const themeWithDefaults = createTheme({
      extends: theme,
      components: [
        Tooltip.Content.extend({ defaultProps: { className: 'theme-default-class' } as never }),
      ],
    });
    registerTheme(themeWithDefaults);
    render(
      <SoribashiProvider theme={themeWithDefaults}>
        <Tooltip delayDuration={0}>
          <Tooltip.Trigger>
            <button type="button">wd-trigger</button>
          </Tooltip.Trigger>
          <Tooltip.Content>wd-tip</Tooltip.Content>
        </Tooltip>
      </SoribashiProvider>,
    );
    await user.hover(screen.getByText('wd-trigger'));
    const content = await screen.findByRole('tooltip', { name: 'wd-tip' });
    const contentDiv = content.closest('[data-side]') as HTMLElement;
    expect(contentDiv.className).toContain('theme-default-class');
  });
});
