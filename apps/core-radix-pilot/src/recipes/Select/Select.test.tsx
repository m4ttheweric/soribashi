import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SoribashiProvider } from '@soribashi/core';
import { theme } from '../../theme/index.ts';
import { Select } from './Select.tsx';

const wrap = (ui: React.ReactNode) => render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);
const data = [{ value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' }, { value: 'lg', label: 'Large', disabled: true }];

describe('Select single', () => {
  it('renders a closed combobox trigger with placeholder', () => {
    wrap(<Select data={data} placeholder="Pick" label="Size" />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Pick')).toBeInTheDocument();
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
    expect(screen.getByRole('combobox')).toHaveTextContent('Medium');
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
    expect(screen.getByRole('combobox')).toHaveTextContent('Small');
  });

  it('Escape closes the open dropdown', () => {
    wrap(<Select data={data} placeholder="Pick" />);
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
