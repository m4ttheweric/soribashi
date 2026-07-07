import {
  SoribashiProvider,
  configureClassNameMerge,
  createTheme,
  registerTheme,
} from '@soribashi/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { twMerge } from 'tailwind-merge';
import { describe, expect, it, vi } from 'vitest';
import { theme } from '../../theme/index.ts';
import { DropdownMenu } from './DropdownMenu.tsx';

configureClassNameMerge(twMerge);

function wrap(ui: React.ReactElement) {
  return render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);
}

function BasicMenu() {
  return (
    <DropdownMenu>
      <DropdownMenu.Trigger>
        <button type="button">open-menu</button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Label>Menu label</DropdownMenu.Label>
        <DropdownMenu.Separator />
        <DropdownMenu.Item>Profile</DropdownMenu.Item>
        <DropdownMenu.Item shortcut="⌘S">Settings</DropdownMenu.Item>
        <DropdownMenu.Item disabled>Disabled item</DropdownMenu.Item>
        <DropdownMenu.Sub>
          <DropdownMenu.SubTrigger>More options</DropdownMenu.SubTrigger>
          <DropdownMenu.SubContent>
            <DropdownMenu.Item>Sub item one</DropdownMenu.Item>
          </DropdownMenu.SubContent>
        </DropdownMenu.Sub>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}

describe('DropdownMenu compound', () => {
  it('renders closed by default (content not in the DOM)', () => {
    wrap(<BasicMenu />);

    expect(screen.getByText('open-menu')).toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens on trigger click', async () => {
    const user = userEvent.setup();
    wrap(<BasicMenu />);

    await user.click(screen.getByText('open-menu'));
    expect(await screen.findByRole('menu')).toBeInTheDocument();
  });

  it('items are present and become focusable via arrow-key navigation', async () => {
    const user = userEvent.setup();
    wrap(<BasicMenu />);

    await user.click(screen.getByText('open-menu'));
    await screen.findByRole('menu');

    expect(screen.getByRole('menuitem', { name: 'Profile' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Settings/ })).toBeInTheDocument();

    // jsdom has no real layout, so Radix's FocusScope tabbable-detection
    // (which relies on client rects) can't auto-focus the first item on open.
    // Roving-focus keyboard navigation moves focus directly via ref, which
    // doesn't depend on layout, so it's a reliable way to prove items are
    // reachable/focusable.
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement?.getAttribute('role')).toBe('menuitem');
    expect(document.activeElement?.textContent).toContain('Profile');
  });

  it('renders the shortcut slot inside an item', async () => {
    const user = userEvent.setup();
    wrap(<BasicMenu />);

    await user.click(screen.getByText('open-menu'));
    const shortcut = await screen.findByText('⌘S');
    expect(shortcut.className).toContain('tracking-widest');
  });

  it('disabled items carry the disabled data attribute', async () => {
    const user = userEvent.setup();
    wrap(<BasicMenu />);

    await user.click(screen.getByText('open-menu'));
    const disabledItem = await screen.findByText('Disabled item');
    expect(disabledItem.closest('[role="menuitem"]')).toHaveAttribute('data-disabled');
  });

  it('separator renders with the correct class', async () => {
    const user = userEvent.setup();
    wrap(<BasicMenu />);

    await user.click(screen.getByText('open-menu'));
    await screen.findByRole('menu');
    const separator = document.body.querySelector('[role="separator"]');
    expect(separator).not.toBeNull();
    expect(separator?.className).toContain('h-px');
    expect(separator?.className).toContain('bg-(--border-default)');
  });

  it('sub-menu trigger is present and renders a chevron icon', async () => {
    const user = userEvent.setup();
    wrap(<BasicMenu />);

    await user.click(screen.getByText('open-menu'));
    const subTrigger = await screen.findByText('More options');
    expect(subTrigger.closest('svg, [data-state]')).not.toBeNull();
    expect(subTrigger.parentElement?.querySelector('svg')).not.toBeNull();
  });

  it('sub-menu opens on hover and reveals its items', async () => {
    const user = userEvent.setup();
    wrap(<BasicMenu />);

    await user.click(screen.getByText('open-menu'));
    const subTrigger = await screen.findByText('More options');
    await user.hover(subTrigger);

    expect(await screen.findByText('Sub item one')).toBeInTheDocument();
  });

  it('checkbox items report toggles via onCheckedChange', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    wrap(
      <DropdownMenu>
        <DropdownMenu.Trigger>
          <button type="button">checkbox-trigger</button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.CheckboxItem checked={false} onCheckedChange={onCheckedChange}>
            Show status bar
          </DropdownMenu.CheckboxItem>
        </DropdownMenu.Content>
      </DropdownMenu>,
    );

    await user.click(screen.getByText('checkbox-trigger'));
    const checkboxItem = await screen.findByRole('menuitemcheckbox', { name: 'Show status bar' });
    expect(checkboxItem).toHaveAttribute('aria-checked', 'false');

    await user.click(checkboxItem);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('checkbox item renders the Check icon inside its ItemIndicator when checked', async () => {
    const user = userEvent.setup();
    wrap(
      <DropdownMenu>
        <DropdownMenu.Trigger>
          <button type="button">checked-trigger</button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.CheckboxItem checked onCheckedChange={() => {}}>
            Panel
          </DropdownMenu.CheckboxItem>
        </DropdownMenu.Content>
      </DropdownMenu>,
    );

    await user.click(screen.getByText('checked-trigger'));
    const checkboxItem = await screen.findByRole('menuitemcheckbox', { name: 'Panel' });
    expect(checkboxItem).toHaveAttribute('aria-checked', 'true');
    expect(checkboxItem.querySelector('svg')).not.toBeNull();
  });

  it('radio group reports selection via onValueChange and marks the active item', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    wrap(
      <DropdownMenu>
        <DropdownMenu.Trigger>
          <button type="button">radio-trigger</button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.RadioGroup value="bottom" onValueChange={onValueChange}>
            <DropdownMenu.RadioItem value="top">Top</DropdownMenu.RadioItem>
            <DropdownMenu.RadioItem value="bottom">Bottom</DropdownMenu.RadioItem>
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu>,
    );

    await user.click(screen.getByText('radio-trigger'));
    const bottomItem = await screen.findByRole('menuitemradio', { name: 'Bottom' });
    const topItem = await screen.findByRole('menuitemradio', { name: 'Top' });
    expect(bottomItem).toHaveAttribute('aria-checked', 'true');
    expect(topItem).toHaveAttribute('aria-checked', 'false');

    await user.click(topItem);
    expect(onValueChange).toHaveBeenCalledWith('top');
  });

  it('renders content inside a portal (not inside the test container)', async () => {
    const user = userEvent.setup();
    const { container } = wrap(<BasicMenu />);

    await user.click(screen.getByText('open-menu'));
    await screen.findByRole('menu');

    expect(container.querySelector('[role="menu"]')).toBeNull();
    expect(document.body.querySelector('[role="menu"]')).not.toBeNull();
  });

  it('Content applies the recipe class', async () => {
    const user = userEvent.setup();
    wrap(<BasicMenu />);

    await user.click(screen.getByText('open-menu'));
    const content = await screen.findByRole('menu');
    expect(content.className).toContain('rounded-md');
    expect(content.className).toContain('bg-(--surface-floating)');
  });

  it('trigger wraps the child so the trigger element carries the compound styling', () => {
    wrap(
      <DropdownMenu>
        <DropdownMenu.Trigger>
          <button type="button" data-testid="inner-btn">
            trigger
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Item>item</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>,
    );

    const btn = screen.getByTestId('inner-btn');
    expect(btn.parentElement?.tagName).toBe('SPAN');
  });

  it('throws when DropdownMenu.Trigger is rendered outside DropdownMenu', () => {
    expect(() =>
      render(
        <SoribashiProvider theme={theme}>
          <DropdownMenu.Trigger>
            <button type="button">x</button>
          </DropdownMenu.Trigger>
        </SoribashiProvider>,
      ),
    ).toThrow(/<DropdownMenu\.Trigger> must be inside <DropdownMenu>/);
  });

  it('DropdownMenu.Content className from instance props lands on the rendered element', async () => {
    const user = userEvent.setup();
    wrap(
      <DropdownMenu>
        <DropdownMenu.Trigger>
          <button type="button">custom-class-trigger</button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content className="custom-content-class">
          <DropdownMenu.Item>item</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>,
    );

    await user.click(screen.getByText('custom-class-trigger'));
    const content = await screen.findByRole('menu');
    expect(content.className).toContain('custom-content-class');
  });

  it('extend-set className for DropdownMenu.Content lands on the element', async () => {
    const user = userEvent.setup();
    const themeWithDefaults = createTheme({
      extends: theme,
      components: [
        DropdownMenu.Content.extend({
          defaultProps: { className: 'theme-default-class' } as never,
        }),
      ],
    });
    registerTheme(themeWithDefaults);
    render(
      <SoribashiProvider theme={themeWithDefaults}>
        <DropdownMenu>
          <DropdownMenu.Trigger>
            <button type="button">wd-trigger</button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item>item</DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </SoribashiProvider>,
    );

    await user.click(screen.getByText('wd-trigger'));
    const content = await screen.findByRole('menu');
    expect(content.className).toContain('theme-default-class');
  });
});
