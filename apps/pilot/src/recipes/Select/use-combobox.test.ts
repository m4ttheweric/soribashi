import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ComboboxItem } from './parse-data.ts';
import { nextEnabledIndex, useCombobox } from './use-combobox.ts';

const opts: ComboboxItem<string>[] = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B', disabled: true },
  { value: 'c', label: 'C' },
];

describe('nextEnabledIndex', () => {
  it('moves forward skipping disabled', () => {
    expect(nextEnabledIndex(opts, 0, 1)).toBe(2);
  });
  it('wraps forward from the end', () => {
    expect(nextEnabledIndex(opts, 2, 1)).toBe(0);
  });
  it('moves backward skipping disabled', () => {
    expect(nextEnabledIndex(opts, 2, -1)).toBe(0);
  });
  it('returns -1 when nothing is enabled', () => {
    expect(nextEnabledIndex([{ value: 'x', label: 'X', disabled: true }], 0, 1)).toBe(-1);
  });
});

describe('useCombobox keyboard intents', () => {
  it('ArrowDown opens when closed', () => {
    const { result } = renderHook(() => useCombobox({ options: opts, opened: false }));
    const r = result.current.onKeyDown({ key: 'ArrowDown', preventDefault() {} });
    expect(r.open).toBe(true);
  });

  it('Enter submits the active option', () => {
    const { result } = renderHook(() => useCombobox({ options: opts, opened: true }));
    act(() => result.current.setActiveIndex(2));
    const r = result.current.onKeyDown({ key: 'Enter', preventDefault() {} });
    expect(r.submit).toEqual({ value: 'c', label: 'C' });
  });

  it('Escape closes', () => {
    const { result } = renderHook(() => useCombobox({ options: opts, opened: true }));
    expect(result.current.onKeyDown({ key: 'Escape', preventDefault() {} }).close).toBe(true);
  });
});
