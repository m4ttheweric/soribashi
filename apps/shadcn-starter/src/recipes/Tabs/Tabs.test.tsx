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
import { Tabs } from './Tabs.tsx';

configureClassNameMerge(twMerge);

function wrap(ui: React.ReactElement) {
  return render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);
}

function ThreeTabs(props: React.ComponentProps<typeof Tabs>) {
  return (
    <Tabs defaultValue="one" {...props}>
      <Tabs.List>
        <Tabs.Trigger value="one">One</Tabs.Trigger>
        <Tabs.Trigger value="two">Two</Tabs.Trigger>
        <Tabs.Trigger value="three">Three</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="one">content-one</Tabs.Content>
      <Tabs.Content value="two">content-two</Tabs.Content>
      <Tabs.Content value="three">content-three</Tabs.Content>
    </Tabs>
  );
}

describe('Tabs compound', () => {
  it('renders with the default tab active', () => {
    wrap(<ThreeTabs />);

    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByText('content-one')).toBeInTheDocument();
    expect(screen.queryByText('content-two')).not.toBeInTheDocument();
  });

  it('switching tabs shows the correct content', async () => {
    const user = userEvent.setup();
    wrap(<ThreeTabs />);

    await user.click(screen.getByRole('tab', { name: 'Two' }));

    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('content-two')).toBeInTheDocument();
    expect(screen.queryByText('content-one')).not.toBeInTheDocument();
  });

  it('list has the recipe background class', () => {
    wrap(<ThreeTabs />);

    const list = screen.getByRole('tablist');
    expect(list.className).toContain('bg-(--accent-muted)');
  });

  it('the active trigger has the recipe shadow-on-active class', () => {
    wrap(<ThreeTabs />);

    const activeTab = screen.getByRole('tab', { name: 'One' });
    expect(activeTab.className).toContain('data-[state=active]:shadow');
    expect(activeTab.getAttribute('data-state')).toBe('active');
  });

  it('content mounts and unmounts per active tab', async () => {
    const user = userEvent.setup();
    wrap(<ThreeTabs />);

    expect(screen.queryByText('content-three')).not.toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Three' }));
    expect(screen.getByText('content-three')).toBeInTheDocument();
    expect(screen.queryByText('content-one')).not.toBeInTheDocument();
  });

  it('emits a data-variant attribute on the root reflecting the default variant', () => {
    const { container } = wrap(<ThreeTabs />);

    const root = container.querySelector('[data-variant]');
    expect(root).not.toBeNull();
    expect(root?.getAttribute('data-variant')).toBe('default');
  });

  it('emits the instance variant on the root data attribute', () => {
    const { container } = wrap(<ThreeTabs variant="pills" />);

    const root = container.querySelector('[data-variant]');
    expect(root?.getAttribute('data-variant')).toBe('pills');
  });

  it('an extend-set defaultProps variant overrides the recipe default', () => {
    const themeWithDefaults = createTheme({
      extends: theme,
      components: [Tabs.extend({ defaultProps: { variant: 'outline' } as never })],
    });
    registerTheme(themeWithDefaults);

    const { container } = render(
      <SoribashiProvider theme={themeWithDefaults}>
        <ThreeTabs />
      </SoribashiProvider>,
    );

    const root = container.querySelector('[data-variant]');
    expect(root?.getAttribute('data-variant')).toBe('outline');

    // restore the app-wide theme for subsequent tests in this file.
    registerTheme(theme);
  });
});
