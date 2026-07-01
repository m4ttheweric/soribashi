import { SoribashiProvider } from '@soribashi/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { theme } from '../../theme/index.ts';
import { Select } from './Select.tsx';

const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);
const data = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large', disabled: true },
];

describe('Select single', () => {
  it('renders a closed combobox trigger with placeholder', () => {
    wrap(<Select data={data} placeholder="Pick" label="Size" />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Pick')).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('opens the dropdown on trigger click and lists options', () => {
    wrap(<Select data={data} placeholder="Pick" />);
    fireEvent.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('selects an option on click, calls onChange with (value, option), shows the label', () => {
    const onChange = vi.fn();
    wrap(<Select data={data} placeholder="Pick" onChange={onChange} />);
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'Medium' }));
    expect(onChange).toHaveBeenCalledWith('md', { value: 'md', label: 'Medium' });
    expect(screen.getByRole('combobox')).toHaveValue('Medium');
  });

  it('does not select a disabled option', () => {
    const onChange = vi.fn();
    wrap(<Select data={data} placeholder="Pick" onChange={onChange} />);
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'Large' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('honors a controlled value', () => {
    wrap(<Select data={data} value="sm" />);
    expect(screen.getByRole('combobox')).toHaveValue('Small');
  });

  it('Escape closes the open dropdown', () => {
    wrap(<Select data={data} placeholder="Pick" />);
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});

describe('Select multiple', () => {
  it('toggles values and calls onChange with arrays', () => {
    const onChange = vi.fn();
    wrap(<Select data={data} multiple placeholder="Pick" onChange={onChange} />);
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'Small' }));
    expect(onChange).toHaveBeenLastCalledWith(['sm'], [{ value: 'sm', label: 'Small' }]);
    fireEvent.click(screen.getByRole('option', { name: 'Medium' }));
    expect(onChange).toHaveBeenLastCalledWith(
      ['sm', 'md'],
      [
        { value: 'sm', label: 'Small' },
        { value: 'md', label: 'Medium' },
      ],
    );
  });

  it('renders a pill per selected value and stays open', () => {
    wrap(<Select data={data} multiple value={['sm', 'md']} />);
    expect(screen.getAllByTestId('select-pill')).toHaveLength(2);
  });
});

describe('Select searchable', () => {
  it('filters options by the typed query', () => {
    wrap(<Select data={data} searchable placeholder="Pick" />);
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'med' } });
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option')).toHaveTextContent('Medium');
  });
});

describe('Select clearable', () => {
  it('shows a clear button that resets the value', () => {
    const onChange = vi.fn();
    wrap(<Select data={data} clearable value="sm" onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Clear'));
    expect(onChange).toHaveBeenCalledWith(null, null);
  });
});

describe('Select correctness + a11y fixes', () => {
  it('submits the HIGHLIGHTED option after filtering (searchable + keyboard)', () => {
    const onChange = vi.fn();
    wrap(<Select data={data} searchable placeholder="Pick" onChange={onChange} />);
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'med' } });
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' });
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('md', { value: 'md', label: 'Medium' });
  });

  it('does not open via keyboard when disabled', () => {
    wrap(<Select data={data} placeholder="Pick" disabled />);
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' });
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('renders the clear control as a real, keyboard-operable button', () => {
    const onChange = vi.fn();
    wrap(<Select data={data} clearable value="sm" onChange={onChange} />);
    const clear = screen.getByLabelText('Clear');
    expect(clear.tagName).toBe('BUTTON');
  });

  it('closes on outside pointer press', () => {
    wrap(<Select data={data} placeholder="Pick" />);
    fireEvent.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('does not clear or remove when disabled', () => {
    const onChange = vi.fn();
    wrap(<Select data={data} clearable disabled value="sm" onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Clear'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('sets aria-activedescendant to the highlighted option id during keyboard nav', () => {
    wrap(<Select data={data} placeholder="Pick" />);
    const combo = screen.getByRole('combobox');
    fireEvent.click(combo);
    fireEvent.keyDown(combo, { key: 'ArrowDown' });
    const active = combo.getAttribute('aria-activedescendant');
    expect(active).toBeTruthy();
    expect(document.getElementById(active!)).not.toBeNull();
  });
});

describe('Select type narrowing (compile-time)', () => {
  // Enforced by `bun run typecheck`. Elements are constructed, never rendered.
  it('narrows Value from data and flips onChange on multiple', () => {
    // single: value narrows to the data union
    void (
      <Select
        data={[
          { value: 'sm', label: 'S' },
          { value: 'md', label: 'M' },
        ]}
        onChange={(v) => {
          const ok: 'sm' | 'md' | null = v;
          void ok;
        }}
      />
    );
    // multiple: onChange value is an array of the union
    void (
      <Select
        data={['a', 'b']}
        multiple
        onChange={(v) => {
          const ok: ('a' | 'b')[] = v;
          void ok;
        }}
      />
    );
    // numeric values narrow too
    void (
      <Select
        data={[{ value: 1, label: 'one' }]}
        onChange={(v) => {
          const ok: 1 | null = v;
          void ok;
        }}
      />
    );
    // Value is pinned explicitly so `value` is checked against it (otherwise
    // `value` would participate in inference and widen V to include 'lg').
    // @ts-expect-error: 'lg' is not in the Value union 'sm' | 'md'
    void (<Select<'sm' | 'md'> data={[{ value: 'sm', label: 'S' }]} value={'lg'} />);
    expect(true).toBe(true);
  });
});
