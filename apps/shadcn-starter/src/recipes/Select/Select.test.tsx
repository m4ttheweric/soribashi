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
import { Field, FieldDescription, FieldLabel } from '../../recipes/Field/Field.tsx';
import { theme } from '../../theme/index.ts';
import { Select } from './Select.tsx';

configureClassNameMerge(twMerge);

function wrap(ui: React.ReactElement) {
  return render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);
}

function BasicSelect(props: { onValueChange?: (value: string) => void } = {}) {
  return (
    <Select onValueChange={props.onValueChange}>
      <Select.Trigger>
        <Select.Value placeholder="Pick a fruit" />
      </Select.Trigger>
      <Select.Content>
        <Select.Group>
          <Select.Label>Fruits</Select.Label>
          <Select.Item value="apple">Apple</Select.Item>
          <Select.Item value="banana">Banana</Select.Item>
          <Select.Item value="grape" disabled>
            Grape
          </Select.Item>
        </Select.Group>
        <Select.Separator />
        <Select.Group>
          <Select.Label>Vegetables</Select.Label>
          <Select.Item value="carrot">Carrot</Select.Item>
        </Select.Group>
      </Select.Content>
    </Select>
  );
}

describe('Select compound', () => {
  it('renders closed by default with placeholder text on the trigger', () => {
    wrap(<BasicSelect />);

    expect(screen.getByText('Pick a fruit')).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('opens on trigger click and shows items', async () => {
    const user = userEvent.setup();
    wrap(<BasicSelect />);

    await user.click(screen.getByRole('combobox'));
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Apple' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Banana' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Carrot' })).toBeInTheDocument();
  });

  it('selecting an item updates the displayed value and fires onValueChange', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    wrap(<BasicSelect onValueChange={onValueChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'Banana' }));

    expect(onValueChange).toHaveBeenCalledWith('banana');
    expect(await screen.findByText('Banana')).toBeInTheDocument();
  });

  it('disabled items are not selectable', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    wrap(<BasicSelect onValueChange={onValueChange} />);

    await user.click(screen.getByRole('combobox'));
    const grape = await screen.findByRole('option', { name: 'Grape' });
    expect(grape).toHaveAttribute('data-disabled');

    await user.click(grape);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
  });

  it('groups and labels render inside the open content', async () => {
    const user = userEvent.setup();
    wrap(<BasicSelect />);

    await user.click(screen.getByRole('combobox'));
    expect(await screen.findByText('Fruits')).toBeInTheDocument();
    expect(screen.getByText('Vegetables')).toBeInTheDocument();
  });

  it('separator renders with the recipe class', async () => {
    const user = userEvent.setup();
    wrap(<BasicSelect />);

    await user.click(screen.getByRole('combobox'));
    await screen.findByRole('listbox');
    // Radix Select's Separator is a plain aria-hidden div (no ARIA role of its
    // own, unlike DropdownMenu's role="separator"), so it's located by class.
    // Lucide icons also carry aria-hidden="true", so the query is scoped to
    // div elements and reads className via getAttribute (SVGAnimatedString
    // on the icons doesn't support .includes).
    const separator = Array.from(document.body.querySelectorAll('div[aria-hidden="true"]')).find(
      (el) => el.getAttribute('class')?.includes('h-px'),
    );
    expect(separator).not.toBeUndefined();
    expect(separator?.getAttribute('class')).toContain('bg-(--border-default)');
  });

  it('renders content inside a portal (not inside the test container)', async () => {
    const user = userEvent.setup();
    const { container } = wrap(<BasicSelect />);

    await user.click(screen.getByRole('combobox'));
    await screen.findByRole('listbox');

    expect(container.querySelector('[role="listbox"]')).toBeNull();
    expect(document.body.querySelector('[role="listbox"]')).not.toBeNull();
  });

  it('Trigger applies the recipe class', () => {
    wrap(<BasicSelect />);
    const trigger = screen.getByRole('combobox');
    expect(trigger.className).toContain('rounded-md');
    expect(trigger.className).toContain('bg-(--surface-raised)');
  });

  it('composes with Field: label/description/error render alongside the trigger', () => {
    wrap(
      <Field>
        <FieldLabel htmlFor="fruit-select">Favorite fruit</FieldLabel>
        <Select>
          <Select.Trigger>
            <Select.Value placeholder="Pick a fruit" id="fruit-select" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="apple">Apple</Select.Item>
          </Select.Content>
        </Select>
        <FieldDescription>Pick one you like</FieldDescription>
      </Field>,
    );

    expect(screen.getByText('Favorite fruit')).toBeInTheDocument();
    expect(screen.getByText('Pick one you like')).toBeInTheDocument();
    expect(screen.getByText('Pick a fruit')).toBeInTheDocument();
  });

  it('throws when Select.Trigger is rendered outside Select', () => {
    expect(() =>
      render(
        <SoribashiProvider theme={theme}>
          <Select.Trigger>
            <Select.Value placeholder="x" />
          </Select.Trigger>
        </SoribashiProvider>,
      ),
    ).toThrow(/<Select\.Trigger> must be inside <Select>/);
  });

  it('Select.Content className from instance props lands on the rendered element', async () => {
    const user = userEvent.setup();
    wrap(
      <Select>
        <Select.Trigger>
          <Select.Value placeholder="Pick a fruit" />
        </Select.Trigger>
        <Select.Content className="custom-content-class">
          <Select.Item value="apple">Apple</Select.Item>
        </Select.Content>
      </Select>,
    );

    await user.click(screen.getByRole('combobox'));
    const content = await screen.findByRole('listbox');
    expect(content.className).toContain('custom-content-class');
  });

  it('extend-set className for Select.Content lands on the element', async () => {
    const user = userEvent.setup();
    const themeWithDefaults = createTheme({
      extends: theme,
      components: [
        Select.Content.extend({
          defaultProps: { className: 'theme-default-class' } as never,
        }),
      ],
    });
    registerTheme(themeWithDefaults);
    render(
      <SoribashiProvider theme={themeWithDefaults}>
        <Select>
          <Select.Trigger>
            <Select.Value placeholder="Pick a fruit" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="apple">Apple</Select.Item>
          </Select.Content>
        </Select>
      </SoribashiProvider>,
    );

    await user.click(screen.getByRole('combobox'));
    const content = await screen.findByRole('listbox');
    expect(content.className).toContain('theme-default-class');
  });
});
