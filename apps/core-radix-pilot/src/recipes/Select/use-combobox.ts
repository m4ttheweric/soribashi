/**
 * Minimal combobox state machine: active-option index + keyboard intents.
 * Bounded port of Mantine's use-combobox (no typeahead, no async). Positioning
 * is the component's job (floating-ui), not the hook's.
 */
import { useState } from 'react';
import type { ComboboxItem, Primitive } from './parse-data.ts';

export function nextEnabledIndex<V extends Primitive>(
  options: ComboboxItem<V>[],
  from: number,
  dir: 1 | -1,
): number {
  const n = options.length;
  if (n === 0) {
    return -1;
  }
  for (let step = 1; step <= n; step += 1) {
    const i = (((from + dir * step) % n) + n) % n;
    if (!options[i]?.disabled) {
      return i;
    }
  }
  return -1;
}

export interface ComboboxKeyResult<V extends Primitive> {
  submit?: ComboboxItem<V>;
  close?: boolean;
  open?: boolean;
}

export function useCombobox<V extends Primitive>(opts: { options: ComboboxItem<V>[]; opened: boolean }) {
  const { options, opened } = opts;
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const onKeyDown = (e: { key: string; preventDefault: () => void }): ComboboxKeyResult<V> => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!opened) {
        return { open: true };
      }
      const dir = e.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((cur) => nextEnabledIndex(options, cur < 0 ? (dir === 1 ? -1 : 0) : cur, dir));
      return {};
    }
    if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      setActiveIndex(nextEnabledIndex(options, e.key === 'Home' ? -1 : 0, e.key === 'Home' ? 1 : -1));
      return {};
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const opt = options[activeIndex];
      return opt && !opt.disabled ? { submit: opt } : {};
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      return { close: true };
    }
    return {};
  };

  return { activeIndex, setActiveIndex, onKeyDown };
}
