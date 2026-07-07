import { SoribashiProvider, configureClassNameMerge } from '@soribashi/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { twMerge } from 'tailwind-merge';
import { describe, expect, it } from 'vitest';
import { theme } from '../../theme/index.ts';
import { Accordion } from './Accordion.tsx';

configureClassNameMerge(twMerge);

function wrap(ui: React.ReactElement) {
  return render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);
}

function ThreeItems(props: React.ComponentProps<typeof Accordion>) {
  return (
    <Accordion {...props}>
      <Accordion.Item value="one">
        <Accordion.Trigger>One</Accordion.Trigger>
        <Accordion.Content>content-one</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="two">
        <Accordion.Trigger>Two</Accordion.Trigger>
        <Accordion.Content>content-two</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="three">
        <Accordion.Trigger>Three</Accordion.Trigger>
        <Accordion.Content>content-three</Accordion.Content>
      </Accordion.Item>
    </Accordion>
  );
}

describe('Accordion compound', () => {
  it('items are collapsed by default', () => {
    wrap(<ThreeItems />);

    expect(screen.queryByText('content-one')).not.toBeInTheDocument();
    expect(screen.queryByText('content-two')).not.toBeInTheDocument();
    expect(screen.queryByText('content-three')).not.toBeInTheDocument();
  });

  it('clicking a trigger expands its content', async () => {
    const user = userEvent.setup();
    wrap(<ThreeItems />);

    await user.click(screen.getByRole('button', { name: 'One' }));

    expect(screen.getByText('content-one')).toBeInTheDocument();
  });

  it('the trigger renders a chevron icon that rotates open via data-state', async () => {
    const user = userEvent.setup();
    wrap(<ThreeItems />);

    const trigger = screen.getByRole('button', { name: 'One' });
    expect(trigger.querySelector('svg')).not.toBeNull();
    expect(trigger.getAttribute('data-state')).toBe('closed');

    await user.click(trigger);

    expect(trigger.getAttribute('data-state')).toBe('open');
  });

  it('type="single" (default) allows only one item open at a time', async () => {
    const user = userEvent.setup();
    wrap(<ThreeItems />);

    await user.click(screen.getByRole('button', { name: 'One' }));
    expect(screen.getByText('content-one')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Two' }));
    expect(screen.getByText('content-two')).toBeInTheDocument();
    expect(screen.queryByText('content-one')).not.toBeInTheDocument();
  });

  it('collapsible (default true) allows closing the open item back down', async () => {
    const user = userEvent.setup();
    wrap(<ThreeItems />);

    const trigger = screen.getByRole('button', { name: 'One' });
    await user.click(trigger);
    expect(screen.getByText('content-one')).toBeInTheDocument();

    await user.click(trigger);
    expect(screen.queryByText('content-one')).not.toBeInTheDocument();
  });

  it('type="multiple" allows more than one item open at once', async () => {
    const user = userEvent.setup();
    wrap(<ThreeItems type="multiple" />);

    await user.click(screen.getByRole('button', { name: 'One' }));
    await user.click(screen.getByRole('button', { name: 'Two' }));

    expect(screen.getByText('content-one')).toBeInTheDocument();
    expect(screen.getByText('content-two')).toBeInTheDocument();
  });

  it('item has the recipe border class', () => {
    wrap(<ThreeItems />);

    const trigger = screen.getByRole('button', { name: 'One' });
    // trigger -> Header (div.flex) -> Item (the bordered wrapper).
    const item = trigger.parentElement?.parentElement;
    expect(item?.className).toContain('border-(--border-default)');
  });
});
