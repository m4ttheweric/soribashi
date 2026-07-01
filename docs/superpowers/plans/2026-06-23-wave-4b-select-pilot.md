# Wave 4B: Select Pilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Author a data-driven, generically-typed `Select` recipe in the pilot app that consumes the upgraded `defineGenericComponent` (shipped in Wave 4A), delivering react-select-grade inference on Mantine's data model, with a reusable `Field` wrapper and a minimal floating-ui `useCombobox` engine.

**Architecture:** Three pilot-local units composed bottom-up: a `useCombobox` hook (open/active-index/select state + keyboard, positioned by `@floating-ui/react`); a reusable `Field` wrapper (`defineComponent`, label/description/error/aria); and the `Select` recipe (`defineGenericComponent<SelectSignature>`, Mantine `data` model, single + `multiple`, searchable, clearable). All inference lives at the call site through the recipe's generic signature.

**Tech Stack:** TypeScript, React 18, `@floating-ui/react`, Vitest + Testing Library, Bun. Grounding: Mantine `Select`/`Combobox` (`/Users/matt/Documents/GitHub/mantine/packages/@mantine/core/src/components/{Select,Combobox}`).

## Global Constraints

- soribashi copies Mantine's building blocks; do not invent novel API. Data model and parsing mirror Mantine `Combobox.types.ts` + `get-parsed-combobox-data`.
- The recipe is authored against the pilot's local builders (`apps/pilot/src/builders.ts`), NOT `@soribashi/core` directly (Wave 4A/PR #11 convention).
- No em dashes or en dashes in any prose or code comment authored here (user house style); use colons, commas, or rephrase.
- `Value extends Primitive` where `Primitive = string | number | boolean`. The generic recipe types `size` locally (theme-vocab threading for the generic builder is out of scope, per spec section 2).
- Out of scope (do not build): async/remote data, virtualization, creatable/tags, typeahead-to-focus, grouped option rendering beyond a flat group label.
- Commit message trailer for every commit:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`

---

## Spec reference

`docs/superpowers/specs/2026-06-08-wave-4-select-pilot-design.md` sections 5 (Select recipe), 6 (engine), 7 (Field), 8 (testing). This is PR B from section 9; PR A (the `defineGenericComponent` signature upgrade) is already merged to `main` (`e5c0699`).

## File structure

| File | Responsibility |
|---|---|
| `apps/pilot/package.json` | add `@floating-ui/react` dependency |
| `apps/pilot/src/recipes/Select/parse-data.ts` | `parseSelectData` + the `Value`/`ComboboxItem`/`SelectData` types (ported from Mantine) |
| `apps/pilot/src/recipes/Select/parse-data.test.ts` | parsing unit tests |
| `apps/pilot/src/recipes/Field/Field.tsx` | reusable field wrapper (`defineComponent`) |
| `apps/pilot/src/recipes/Field/Field.module.css` | field layout |
| `apps/pilot/src/recipes/Field/Field.test.tsx` | field render + aria tests |
| `apps/pilot/src/recipes/Select/use-combobox.ts` | minimal combobox state + keyboard hook |
| `apps/pilot/src/recipes/Select/use-combobox.test.ts` | hook reducer/keyboard tests |
| `apps/pilot/src/recipes/Select/Select.tsx` | the Select recipe (`defineGenericComponent<SelectSignature>`) |
| `apps/pilot/src/recipes/Select/Select.module.css` | trigger/dropdown/option/pill styling |
| `apps/pilot/src/recipes/Select/Select.test.tsx` | behavior + compile-time narrowing tests |
| `apps/pilot/src/pages/SelectMatrix.tsx` | demo page |
| `apps/pilot/src/App.tsx` | register the SelectMatrix page |
| `docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md` | populate section 2.5 |
| `docs/superpowers/pilots/2026-06-23-select-pilot.md` | pilot journal |

## Baseline (run once before Task 1)

- [ ] **Confirm green baseline**

Run:
```bash
bun install
bun run typecheck
cd apps/pilot && bunx vitest run --reporter=basic
```
Expected: typecheck clean; pilot 52 passed. Confirm `defineGenericComponent` carries a signature (Wave 4A): `grep -q "TSignature & GenericComponentStatics" packages/factory/src/define-generic-component.tsx && echo OK`.

---

## Task 1: Data model + `parseSelectData`

**Files:**
- Create: `apps/pilot/src/recipes/Select/parse-data.ts`
- Test: `apps/pilot/src/recipes/Select/parse-data.test.ts`
- Modify: `apps/pilot/package.json` (add `@floating-ui/react`)

**Interfaces:**
- Produces: `type Primitive`, `interface ComboboxItem<V>`, `interface ComboboxGroup<V>`, `type SelectData<V>`, `type ParsedItem<V> = ComboboxItem<V> | { group: string; items: ComboboxItem<V>[] }`, `function parseSelectData<V extends Primitive>(data: SelectData<V> | undefined): ParsedItem<V>[]`, `function flattenOptions<V extends Primitive>(parsed: ParsedItem<V>[]): ComboboxItem<V>[]`.

- [ ] **Step 1: Add the floating-ui dependency**

Run:
```bash
cd apps/pilot && bun add @floating-ui/react && cd ../..
```
Expected: `@floating-ui/react` appears in `apps/pilot/package.json` dependencies.

- [ ] **Step 2: Write the failing parsing test**

Create `apps/pilot/src/recipes/Select/parse-data.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parseSelectData, flattenOptions } from './parse-data.ts';

describe('parseSelectData', () => {
  it('wraps bare primitives into { value, label }', () => {
    expect(parseSelectData(['a', 'b'])).toEqual([
      { value: 'a', label: 'a' },
      { value: 'b', label: 'b' },
    ]);
  });

  it('passes through item objects and preserves disabled', () => {
    expect(parseSelectData([{ value: 'x', label: 'X', disabled: true }])).toEqual([
      { value: 'x', label: 'X', disabled: true },
    ]);
  });

  it('labels a value-only object by stringifying its value', () => {
    expect(parseSelectData([{ value: 1 } as any])).toEqual([{ value: 1, label: '1', disabled: undefined }]);
  });

  it('parses groups recursively', () => {
    expect(parseSelectData([{ group: 'G', items: ['a', { value: 'b', label: 'B' }] }])).toEqual([
      { group: 'G', items: [{ value: 'a', label: 'a' }, { value: 'b', label: 'B' }] },
    ]);
  });

  it('returns [] for undefined', () => {
    expect(parseSelectData(undefined)).toEqual([]);
  });
});

describe('flattenOptions', () => {
  it('flattens groups into a single option list', () => {
    const parsed = parseSelectData([{ group: 'G', items: ['a'] }, 'b']);
    expect(flattenOptions(parsed)).toEqual([{ value: 'a', label: 'a' }, { value: 'b', label: 'b' }]);
  });
});
```

- [ ] **Step 3: Run it and watch it FAIL**

Run: `cd apps/pilot && bunx vitest run src/recipes/Select/parse-data.test.ts`
Expected: FAIL (module `./parse-data.ts` does not exist).

- [ ] **Step 4: Implement `parse-data.ts`**

Create `apps/pilot/src/recipes/Select/parse-data.ts` (ported from Mantine `get-parsed-combobox-data`):

```ts
/**
 * Select data model and parser, ported from Mantine's Combobox.
 * Reference: mantine core/components/Combobox/{Combobox.types.ts, get-parsed-combobox-data}.
 */
export type Primitive = string | number | boolean;

export interface ComboboxItem<V extends Primitive = string> {
  value: V;
  label: string;
  disabled?: boolean;
}

export interface ComboboxGroup<V extends Primitive = string> {
  group: string;
  items: (V | ComboboxItem<V>)[];
}

export type SelectData<V extends Primitive = string> = readonly (V | ComboboxItem<V> | ComboboxGroup<V>)[];

export type ParsedItem<V extends Primitive = string> =
  | ComboboxItem<V>
  | { group: string; items: ComboboxItem<V>[] };

function parseItem<V extends Primitive>(item: V | ComboboxItem<V> | ComboboxGroup<V>): ParsedItem<V> {
  if (typeof item !== 'object') {
    return { value: item, label: `${item}` };
  }
  if ('group' in item) {
    return { group: item.group, items: item.items.map((i) => parseItem<V>(i) as ComboboxItem<V>) };
  }
  if (!('label' in item)) {
    // Defensive: a value-only object (no `label`). Not part of the typed
    // SelectData surface, so `item` narrows to `never` here; cast to read it.
    const valueOnly = item as { value: V; disabled?: boolean };
    return { value: valueOnly.value, label: `${valueOnly.value}`, disabled: valueOnly.disabled };
  }
  return item;
}

export function parseSelectData<V extends Primitive>(data: SelectData<V> | undefined): ParsedItem<V>[] {
  if (!data) {
    return [];
  }
  return data.map((item) => parseItem<V>(item));
}

export function flattenOptions<V extends Primitive>(parsed: ParsedItem<V>[]): ComboboxItem<V>[] {
  const out: ComboboxItem<V>[] = [];
  for (const item of parsed) {
    if ('group' in item) {
      out.push(...item.items);
    } else {
      out.push(item);
    }
  }
  return out;
}
```

- [ ] **Step 5: Run the test, watch it PASS**

Run: `cd apps/pilot && bunx vitest run src/recipes/Select/parse-data.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add apps/pilot/src/recipes/Select/parse-data.ts apps/pilot/src/recipes/Select/parse-data.test.ts apps/pilot/package.json apps/pilot/bun.lock
git commit -m "$(cat <<'EOF'
feat(select): data model + parseSelectData (ported from Mantine); add floating-ui

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: `Field` wrapper

**Files:**
- Create: `apps/pilot/src/recipes/Field/Field.tsx`, `Field.module.css`
- Test: `apps/pilot/src/recipes/Field/Field.test.tsx`

**Interfaces:**
- Consumes: `defineComponent` from `../../builders.ts`.
- Produces: `interface FieldProps { id?: string; label?: ReactNode; description?: ReactNode; error?: ReactNode; required?: boolean; children?: ReactNode }`, `const Field`. The control rendered as `children` receives no props from Field; the consumer wires `id`/`aria-describedby` using the same `id`. Field exposes the resolved ids by convention: description id is `${id}-description`, error id is `${id}-error`.

- [ ] **Step 1: Write the failing test**

Create `apps/pilot/src/recipes/Field/Field.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SoribashiProvider } from '@soribashi/core';
import { theme } from '../../theme/index.ts';
import { Field } from './Field.tsx';

const wrap = (ui: React.ReactNode) => render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);

describe('Field', () => {
  it('renders label, description, error and the control', () => {
    wrap(
      <Field id="f1" label="Name" description="help" error="bad" required>
        <input id="f1" />
      </Field>,
    );
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('help')).toBeInTheDocument();
    expect(screen.getByText('bad')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('marks required with an asterisk', () => {
    wrap(<Field id="f2" label="Name" required><input id="f2" /></Field>);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('wires description and error ids for aria-describedby', () => {
    wrap(<Field id="f3" label="L" description="d" error="e"><input id="f3" /></Field>);
    expect(document.getElementById('f3-description')).not.toBeNull();
    expect(document.getElementById('f3-error')).not.toBeNull();
  });

  it('omits description/error nodes when not provided', () => {
    wrap(<Field id="f4" label="L"><input id="f4" /></Field>);
    expect(document.getElementById('f4-description')).toBeNull();
    expect(document.getElementById('f4-error')).toBeNull();
  });
});
```

- [ ] **Step 2: Run it and watch it FAIL**

Run: `cd apps/pilot && bunx vitest run src/recipes/Field/Field.test.tsx`
Expected: FAIL (`./Field.tsx` missing).

- [ ] **Step 3: Implement `Field.module.css`**

Create `apps/pilot/src/recipes/Field/Field.module.css`:

```css
.root { display: flex; flex-direction: column; gap: 0.25rem; }
.label { font-size: var(--font-size-sm); font-weight: 600; color: var(--text-default); }
.required { color: var(--color-danger-500); margin-left: 0.125rem; }
.description { font-size: var(--font-size-xs); color: var(--text-muted); }
.error { font-size: var(--font-size-xs); color: var(--color-danger-600); }
```

- [ ] **Step 4: Implement `Field.tsx`**

Create `apps/pilot/src/recipes/Field/Field.tsx`:

```tsx
/**
 * Field: reusable form-control wrapper (label, description, error, required).
 * Mirrors Mantine's shared Input.Wrapper so multiple form controls reuse it.
 */
import type { ReactNode } from 'react';
import { defineComponent } from '../../builders.ts';
import classes from './Field.module.css';

export interface FieldProps {
  id?: string;
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children?: ReactNode;
}

export const Field = defineComponent<FieldProps, readonly ['root', 'label', 'required', 'description', 'error'], readonly []>({
  name: 'Field',
  element: 'div',
  selectors: ['root', 'label', 'required', 'description', 'error'] as const,
  classes,
  render: ({ props, getStyles, ref }: any) => {
    const { id, label, description, error, required, children } = props;
    return (
      <div ref={ref} {...getStyles('root')} data-part="root">
        {label && (
          <label {...getStyles('label')} htmlFor={id} data-part="label">
            {label}
            {required && <span {...getStyles('required')} aria-hidden data-part="required">*</span>}
          </label>
        )}
        {description && (
          <div {...getStyles('description')} id={id ? `${id}-description` : undefined} data-part="description">
            {description}
          </div>
        )}
        {children}
        {error && (
          <div {...getStyles('error')} id={id ? `${id}-error` : undefined} role="alert" data-part="error">
            {error}
          </div>
        )}
      </div>
    );
  },
});
```

- [ ] **Step 5: Run the test, watch it PASS**

Run: `cd apps/pilot && bunx vitest run src/recipes/Field/Field.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add apps/pilot/src/recipes/Field/
git commit -m "$(cat <<'EOF'
feat(field): reusable form-control wrapper (label/description/error/required)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: `useCombobox` hook (state + keyboard)

A minimal, DOM-independent state machine. Positioning (floating-ui) is wired in the Select component (Task 4), not here, so this hook is unit-testable without a DOM.

**Files:**
- Create: `apps/pilot/src/recipes/Select/use-combobox.ts`
- Test: `apps/pilot/src/recipes/Select/use-combobox.test.ts`

**Interfaces:**
- Consumes: `ComboboxItem`, `Primitive` from `./parse-data.ts`.
- Produces: `function nextEnabledIndex<V>(options: ComboboxItem<V>[], from: number, dir: 1 | -1): number` (pure; wraps, skips disabled, returns -1 if none). `function useCombobox<V>(opts: { options: ComboboxItem<V>[]; opened: boolean }): { activeIndex: number; setActiveIndex: (i: number) => void; onKeyDown: (e: { key: string; preventDefault: () => void }) => { submit?: ComboboxItem<V>; close?: boolean; open?: boolean } }`. The component owns `opened`; the hook owns `activeIndex` and translates keys into intents.

- [ ] **Step 1: Write the failing test (pure helper + hook keyboard intents)**

Create `apps/pilot/src/recipes/Select/use-combobox.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { nextEnabledIndex, useCombobox } from './use-combobox.ts';
import type { ComboboxItem } from './parse-data.ts';

const opts: ComboboxItem<string>[] = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B', disabled: true },
  { value: 'c', label: 'C' },
];

describe('nextEnabledIndex', () => {
  it('moves forward skipping disabled', () => { expect(nextEnabledIndex(opts, 0, 1)).toBe(2); });
  it('wraps forward from the end', () => { expect(nextEnabledIndex(opts, 2, 1)).toBe(0); });
  it('moves backward skipping disabled', () => { expect(nextEnabledIndex(opts, 2, -1)).toBe(0); });
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
```

- [ ] **Step 2: Run it and watch it FAIL**

Run: `cd apps/pilot && bunx vitest run src/recipes/Select/use-combobox.test.ts`
Expected: FAIL (`./use-combobox.ts` missing).

- [ ] **Step 3: Implement `use-combobox.ts`**

Create `apps/pilot/src/recipes/Select/use-combobox.ts`:

```ts
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
```

- [ ] **Step 4: Run the test, watch it PASS**

Run: `cd apps/pilot && bunx vitest run src/recipes/Select/use-combobox.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/pilot/src/recipes/Select/use-combobox.ts apps/pilot/src/recipes/Select/use-combobox.test.ts
git commit -m "$(cat <<'EOF'
feat(select): minimal useCombobox state + keyboard hook (Mantine-grounded)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: `Select` recipe, single-select core

**Files:**
- Create: `apps/pilot/src/recipes/Select/Select.tsx`, `Select.module.css`
- Test: `apps/pilot/src/recipes/Select/Select.test.tsx`

**Interfaces:**
- Consumes: `defineGenericComponent` from `../../builders.ts`; `parseSelectData`, `flattenOptions`, `ComboboxItem`, `SelectData`, `Primitive` from `./parse-data.ts`; `useCombobox`, `nextEnabledIndex` from `./use-combobox.ts`; `Field` from `../Field/Field.tsx`; `useFloating`, `flip`, `shift`, `size`, `autoUpdate` from `@floating-ui/react`.
- Produces: `interface BaseSelectProps<V>`, `interface SingleProps<V>`, `interface MultiProps<V>`, `type SelectSignature`, `const Select`. Single: `value?: V | null; onChange?: (value: V | null, option: ComboboxItem<V> | null) => void`.

- [ ] **Step 1: Write the failing single-select behavior test**

Create `apps/pilot/src/recipes/Select/Select.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run it and watch it FAIL**

Run: `cd apps/pilot && bunx vitest run src/recipes/Select/Select.test.tsx`
Expected: FAIL (`./Select.tsx` missing).

- [ ] **Step 3: Implement `Select.module.css`**

Create `apps/pilot/src/recipes/Select/Select.module.css`:

```css
.trigger {
  display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;
  width: 100%; min-height: 2.25rem; padding: 0 0.625rem;
  border: 1px solid var(--border-default); border-radius: var(--radius-md);
  background: var(--surface-default); color: var(--text-default);
  font-size: var(--font-size-sm); cursor: pointer; text-align: left;
}
.trigger[data-disabled='true'] { opacity: 0.5; cursor: not-allowed; }
.placeholder { color: var(--text-subtle); }
.dropdown {
  z-index: 300; overflow: auto; max-height: 16rem;
  border: 1px solid var(--border-default); border-radius: var(--radius-md);
  background: var(--surface-default); box-shadow: var(--shadow-lg); padding: 0.25rem;
}
.option {
  display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;
  padding: 0.375rem 0.5rem; border-radius: var(--radius-sm);
  font-size: var(--font-size-sm); color: var(--text-default); cursor: pointer;
}
.option[data-active='true'] { background: var(--surface-raised); }
.option[data-selected='true'] { font-weight: 600; }
.option[data-disabled='true'] { opacity: 0.5; cursor: not-allowed; }
.group { font-size: var(--font-size-xs); color: var(--text-subtle); padding: 0.25rem 0.5rem; }
.pills { display: flex; flex-wrap: wrap; gap: 0.25rem; }
.pill {
  display: inline-flex; align-items: center; gap: 0.25rem;
  padding: 0.0625rem 0.375rem; border-radius: var(--radius-full);
  background: var(--surface-raised); font-size: var(--font-size-xs);
}
.pillRemove { cursor: pointer; border: 0; background: transparent; line-height: 1; }
.clear { border: 0; background: transparent; cursor: pointer; color: var(--text-subtle); }
```

- [ ] **Step 4: Implement `Select.tsx` (single-select core)**

Create `apps/pilot/src/recipes/Select/Select.tsx`. This task implements single-select; `multiple`/`searchable`/`clearable` props are declared in the signature but their bodies arrive in Task 5 (the single path must work first):

```tsx
/**
 * Select: data-driven, generically-typed form control authored with
 * defineGenericComponent. Mantine data model; react-select-grade inference
 * (Value narrows from data; `multiple` flips value/onChange). Engine: a minimal
 * useCombobox hook + @floating-ui/react positioning. Field wraps it.
 */
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { useFloating, flip, shift, size, autoUpdate } from '@floating-ui/react';
import { defineGenericComponent } from '../../builders.ts';
import { Field } from '../Field/Field.tsx';
import { parseSelectData, flattenOptions, type ComboboxItem, type SelectData, type Primitive } from './parse-data.ts';
import { useCombobox } from './use-combobox.ts';
import classes from './Select.module.css';

export interface BaseSelectProps<V extends Primitive> {
  data: SelectData<V>;
  placeholder?: string;
  searchable?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  size?: string;
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  id?: string;
}
export interface SingleProps<V extends Primitive> extends BaseSelectProps<V> {
  multiple?: false;
  value?: V | null;
  defaultValue?: V | null;
  onChange?: (value: V | null, option: ComboboxItem<V> | null) => void;
}
export interface MultiProps<V extends Primitive> extends BaseSelectProps<V> {
  multiple: true;
  value?: V[];
  defaultValue?: V[];
  onChange?: (value: V[], options: ComboboxItem<V>[]) => void;
}
export type SelectSignature = <const V extends Primitive = string>(
  props: SingleProps<V> | MultiProps<V>,
) => React.ReactElement | null;

let _id = 0;
function useAutoId(provided?: string): string {
  const ref = useRef<string | undefined>(provided);
  if (!ref.current) {
    _id += 1;
    ref.current = `select-${_id}`;
  }
  return provided ?? ref.current;
}

export const Select = defineGenericComponent<SelectSignature>({
  name: 'Select',
  selectors: ['trigger', 'dropdown', 'option', 'group', 'placeholder', 'pills', 'pill', 'clear'] as const,
  classes,
  render: ({ props }: any) => {
    const id = useAutoId(props.id);
    const parsed = useMemo(() => parseSelectData(props.data as SelectData<Primitive>), [props.data]);
    const options = useMemo(() => flattenOptions(parsed), [parsed]);

    const [opened, setOpened] = useState(false);
    const [uncontrolled, setUncontrolled] = useState<Primitive | null>(props.defaultValue ?? null);
    const isControlled = props.value !== undefined;
    const value: Primitive | null = isControlled ? (props.value ?? null) : uncontrolled;
    const selectedOption = options.find((o) => o.value === value) ?? null;

    const { activeIndex, setActiveIndex, onKeyDown } = useCombobox<Primitive>({ options, opened });

    const { refs, floatingStyles } = useFloating({
      open: opened,
      onOpenChange: setOpened,
      whileElementsMounted: autoUpdate,
      middleware: [flip(), shift({ padding: 8 }), size({
        apply({ rects, elements }) { elements.floating.style.width = `${rects.reference.width}px`; },
      })],
    });

    const close = () => { setOpened(false); setActiveIndex(-1); };

    const submit = (opt: ComboboxItem<Primitive>) => {
      if (opt.disabled) { return; }
      if (!isControlled) { setUncontrolled(opt.value); }
      props.onChange?.(opt.value, opt);
      close();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      const r = onKeyDown(e);
      if (r.open) { setOpened(true); }
      if (r.close) { close(); }
      if (r.submit) { submit(r.submit); }
    };

    return (
      <Field id={id} label={props.label} description={props.description} error={props.error} required={props.required}>
        <button
          ref={refs.setReference}
          type="button"
          role="combobox"
          aria-expanded={opened}
          aria-controls={`${id}-listbox`}
          aria-describedby={[props.description ? `${id}-description` : '', props.error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined}
          aria-invalid={props.error ? true : undefined}
          disabled={props.disabled}
          data-disabled={props.disabled ? 'true' : undefined}
          className={classes.trigger}
          data-part="trigger"
          onClick={() => !props.disabled && setOpened((o) => !o)}
          onKeyDown={handleKeyDown}
        >
          <span className={selectedOption ? undefined : classes.placeholder} data-part="placeholder">
            {selectedOption ? selectedOption.label : props.placeholder}
          </span>
          <span aria-hidden>{opened ? '▲' : '▼'}</span>
        </button>
        {opened && (
          <ul
            ref={refs.setFloating}
            id={`${id}-listbox`}
            role="listbox"
            className={classes.dropdown}
            data-part="dropdown"
            style={floatingStyles}
          >
            {options.map((opt, i) => (
              <li
                key={String(opt.value)}
                role="option"
                aria-selected={opt.value === value}
                aria-disabled={opt.disabled || undefined}
                className={classes.option}
                data-part="option"
                data-active={i === activeIndex ? 'true' : undefined}
                data-selected={opt.value === value ? 'true' : undefined}
                data-disabled={opt.disabled ? 'true' : undefined}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => submit(opt)}
              >
                <span>{opt.label}</span>
                {opt.value === value && <span aria-hidden>{'✓'}</span>}
              </li>
            ))}
          </ul>
        )}
      </Field>
    );
  },
});
```

- [ ] **Step 5: Run the single-select test, watch it PASS**

Run: `cd apps/pilot && bunx vitest run src/recipes/Select/Select.test.tsx`
Expected: PASS (6 tests). If the floating-ui dropdown does not appear in jsdom, confirm the `opened &&` branch renders the `ul` unconditionally of positioning (it does; `floatingStyles` is applied but the element mounts regardless).

- [ ] **Step 6: Typecheck + commit**

Run: `bun run typecheck` (expect clean).
```bash
git add apps/pilot/src/recipes/Select/Select.tsx apps/pilot/src/recipes/Select/Select.module.css apps/pilot/src/recipes/Select/Select.test.tsx
git commit -m "$(cat <<'EOF'
feat(select): single-select recipe (defineGenericComponent + floating-ui + Field)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: `multiple` + `searchable` + `clearable`

**Files:**
- Modify: `apps/pilot/src/recipes/Select/Select.tsx`
- Modify: `apps/pilot/src/recipes/Select/Select.test.tsx`

**Interfaces:**
- Consumes: everything from Task 4. Multi: `value?: V[]; onChange?: (value: V[], options: ComboboxItem<V>[]) => void`.
- Produces: no new exports; extends `Select` behavior.

- [ ] **Step 1: Write failing tests for multiple, searchable, clearable**

Append to `apps/pilot/src/recipes/Select/Select.test.tsx`:

```tsx
describe('Select multiple', () => {
  it('toggles values and calls onChange with arrays', () => {
    const onChange = vi.fn();
    wrap(<Select data={data} multiple placeholder="Pick" onChange={onChange} />);
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'Small' }));
    expect(onChange).toHaveBeenLastCalledWith(['sm'], [{ value: 'sm', label: 'Small' }]);
    fireEvent.click(screen.getByRole('option', { name: 'Medium' }));
    expect(onChange).toHaveBeenLastCalledWith(['sm', 'md'], [{ value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' }]);
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
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'med' } });
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
```

- [ ] **Step 2: Run them and watch them FAIL**

Run: `cd apps/pilot && bunx vitest run src/recipes/Select/Select.test.tsx`
Expected: the three new describe blocks FAIL (multi/search/clear not implemented).

- [ ] **Step 3: Implement multi/search/clear in `Select.tsx`**

Replace the `render` body's value-resolution, submit, and JSX with the multi-aware version. The full updated `render` body:

```tsx
  render: ({ props }: any) => {
    const id = useAutoId(props.id);
    const multiple = props.multiple === true;
    const parsed = useMemo(() => parseSelectData(props.data as SelectData<Primitive>), [props.data]);
    const allOptions = useMemo(() => flattenOptions(parsed), [parsed]);

    const [opened, setOpened] = useState(false);
    const [query, setQuery] = useState('');
    const [uncSingle, setUncSingle] = useState<Primitive | null>(props.defaultValue ?? null);
    const [uncMulti, setUncMulti] = useState<Primitive[]>(Array.isArray(props.defaultValue) ? props.defaultValue : []);
    const isControlled = props.value !== undefined;

    const singleValue: Primitive | null = multiple ? null : (isControlled ? (props.value ?? null) : uncSingle);
    const multiValue: Primitive[] = multiple ? (isControlled ? (props.value ?? []) : uncMulti) : [];

    const options = useMemo(
      () => (props.searchable && query ? allOptions.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())) : allOptions),
      [allOptions, props.searchable, query],
    );

    const { activeIndex, setActiveIndex, onKeyDown } = useCombobox<Primitive>({ options, opened });
    const { refs, floatingStyles } = useFloating({
      open: opened, onOpenChange: setOpened, whileElementsMounted: autoUpdate,
      middleware: [flip(), shift({ padding: 8 }), size({ apply({ rects, elements }) { elements.floating.style.width = `${rects.reference.width}px`; } })],
    });

    const close = () => { setOpened(false); setActiveIndex(-1); setQuery(''); };

    const submit = (opt: ComboboxItem<Primitive>) => {
      if (opt.disabled) { return; }
      if (multiple) {
        const has = multiValue.includes(opt.value);
        const nextValues = has ? multiValue.filter((v) => v !== opt.value) : [...multiValue, opt.value];
        const nextOptions = allOptions.filter((o) => nextValues.includes(o.value));
        if (!isControlled) { setUncMulti(nextValues); }
        props.onChange?.(nextValues, nextOptions);
        setQuery('');
      } else {
        if (!isControlled) { setUncSingle(opt.value); }
        props.onChange?.(opt.value, opt);
        close();
      }
    };

    const clear = () => {
      if (multiple) { if (!isControlled) { setUncMulti([]); } props.onChange?.([], []); }
      else { if (!isControlled) { setUncSingle(null); } props.onChange?.(null, null); }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      const r = onKeyDown(e);
      if (r.open) { setOpened(true); }
      if (r.close) { close(); }
      if (r.submit) { submit(r.submit); }
    };

    const selectedSingle = allOptions.find((o) => o.value === singleValue) ?? null;
    const selectedMulti = allOptions.filter((o) => multiValue.includes(o.value));
    const hasValue = multiple ? multiValue.length > 0 : singleValue !== null;

    return (
      <Field id={id} label={props.label} description={props.description} error={props.error} required={props.required}>
        <div style={{ position: 'relative' }}>
          <button
            ref={refs.setReference}
            type="button" role="combobox" aria-expanded={opened} aria-controls={`${id}-listbox`}
            aria-describedby={[props.description ? `${id}-description` : '', props.error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined}
            aria-invalid={props.error ? true : undefined}
            disabled={props.disabled} data-disabled={props.disabled ? 'true' : undefined}
            className={classes.trigger} data-part="trigger"
            onClick={() => !props.disabled && setOpened((o) => !o)} onKeyDown={handleKeyDown}
          >
            {multiple && selectedMulti.length > 0 ? (
              <span className={classes.pills} data-part="pills">
                {selectedMulti.map((o) => (
                  <span key={String(o.value)} className={classes.pill} data-part="pill" data-testid="select-pill">
                    {o.label}
                    <span role="button" aria-label={`Remove ${o.label}`} className={classes.pillRemove}
                      onClick={(e) => { e.stopPropagation(); submit(o); }}>{'×'}</span>
                  </span>
                ))}
              </span>
            ) : !multiple && selectedSingle ? (
              <span data-part="value">{selectedSingle.label}</span>
            ) : (
              <span className={classes.placeholder} data-part="placeholder">{props.placeholder}</span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {props.clearable && hasValue && (
                <span role="button" aria-label="Clear" className={classes.clear}
                  onClick={(e) => { e.stopPropagation(); clear(); }}>{'×'}</span>
              )}
              <span aria-hidden>{opened ? '▲' : '▼'}</span>
            </span>
          </button>
          {opened && (
            <ul ref={refs.setFloating} id={`${id}-listbox`} role="listbox" className={classes.dropdown} data-part="dropdown" style={floatingStyles}>
              {props.searchable && (
                <li role="presentation">
                  <input role="searchbox" aria-label="Search" autoFocus value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{ width: '100%', border: 0, outline: 'none', padding: '0.25rem 0.5rem', background: 'transparent' }} />
                </li>
              )}
              {options.map((opt, i) => {
                const isSel = multiple ? multiValue.includes(opt.value) : opt.value === singleValue;
                return (
                  <li key={String(opt.value)} role="option" aria-selected={isSel} aria-disabled={opt.disabled || undefined}
                    className={classes.option} data-part="option"
                    data-active={i === activeIndex ? 'true' : undefined} data-selected={isSel ? 'true' : undefined}
                    data-disabled={opt.disabled ? 'true' : undefined}
                    onMouseEnter={() => setActiveIndex(i)} onClick={() => submit(opt)}>
                    <span>{opt.label}</span>
                    {isSel && <span aria-hidden>{'✓'}</span>}
                  </li>
                );
              })}
              {options.length === 0 && <li role="presentation" className={classes.group}>Nothing found</li>}
            </ul>
          )}
        </div>
      </Field>
    );
  },
```

Note: a clicked search input inside the open `<ul>` keeps focus; the trigger's `onKeyDown` is also bound on the search input so arrow/enter still drive the active option.

- [ ] **Step 4: Run all Select tests, watch them PASS**

Run: `cd apps/pilot && bunx vitest run src/recipes/Select/Select.test.tsx`
Expected: all PASS (6 single + 2 multi + 1 search + 1 clear = 10).

- [ ] **Step 5: Typecheck + commit**

Run: `bun run typecheck` (expect clean).
```bash
git add apps/pilot/src/recipes/Select/Select.tsx apps/pilot/src/recipes/Select/Select.test.tsx
git commit -m "$(cat <<'EOF'
feat(select): multiple, searchable, and clearable

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Compile-time inference tests

**Files:**
- Modify: `apps/pilot/src/recipes/Select/Select.test.tsx`

**Interfaces:** consumes `Select`.

- [ ] **Step 1: Add the compile-time narrowing block**

Append to `apps/pilot/src/recipes/Select/Select.test.tsx`:

```tsx
describe('Select type narrowing (compile-time)', () => {
  // Enforced by `bun run typecheck`. Elements are constructed, never rendered.
  it('narrows Value from data and flips onChange on multiple', () => {
    // single: value narrows to the data union
    void (<Select data={[{ value: 'sm', label: 'S' }, { value: 'md', label: 'M' }]} onChange={(v) => { const ok: 'sm' | 'md' | null = v; void ok; }} />);
    // multiple: onChange value is an array of the union
    void (<Select data={['a', 'b']} multiple onChange={(v) => { const ok: ('a' | 'b')[] = v; void ok; }} />);
    // numeric values narrow too
    void (<Select data={[{ value: 1, label: 'one' }]} onChange={(v) => { const ok: 1 | null = v; void ok; }} />);
    // @ts-expect-error: 'lg' is not in the data union 'sm' | 'md'
    void (<Select data={[{ value: 'sm', label: 'S' }]} value={'lg'} />);
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 2: Verify typecheck enforces it (and the negative has teeth)**

Run: `bun run typecheck` (expect clean: all positives compile, the `@ts-expect-error` matches a real error).
Sanity-check teeth: temporarily change `value={'lg'}` to `value={'sm'}`; rerun `bun run typecheck`; expect a TS2578 "unused '@ts-expect-error'"; then revert to `'lg'`.

- [ ] **Step 3: Run the suite + commit**

Run: `cd apps/pilot && bunx vitest run src/recipes/Select/Select.test.tsx` (expect 11 passing: prior 10 + this 1).
```bash
git add apps/pilot/src/recipes/Select/Select.test.tsx
git commit -m "$(cat <<'EOF'
test(select): compile-time Value-narrowing and multiple-flip assertions

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Demo page + playbook section 2.5 + journal

**Files:**
- Create: `apps/pilot/src/pages/SelectMatrix.tsx`
- Modify: `apps/pilot/src/App.tsx`
- Modify: `docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md` (section 2.5)
- Create: `docs/superpowers/pilots/2026-06-23-select-pilot.md`

**Interfaces:** consumes `Select`.

- [ ] **Step 1: Create `SelectMatrix.tsx`**

Create `apps/pilot/src/pages/SelectMatrix.tsx`:

```tsx
import { useState } from 'react';
import { Select } from '../recipes/Select/Select.tsx';

const sizes = [{ value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' }, { value: 'lg', label: 'Large' }];

export function SelectMatrix() {
  // `sizes` is not `as const`, so V infers as `string` here; the literal-union
  // narrowing is proven by the inline-data compile-time test in Select.test.tsx.
  const [single, setSingle] = useState<string | null>(null);
  const [multi, setMulti] = useState<string[]>([]);
  return (
    <div style={{ display: 'grid', gap: '1.5rem', maxWidth: 320, padding: '1.5rem' }}>
      <Select data={sizes} label="Single" description="pick one" placeholder="Choose a size" clearable value={single} onChange={setSingle} />
      <Select data={sizes} label="Searchable" placeholder="Type to filter" searchable />
      <Select data={sizes} label="Multiple" placeholder="Choose sizes" multiple clearable value={multi} onChange={setMulti} />
      <Select data={sizes} label="Disabled" placeholder="Unavailable" disabled />
      <Select data={sizes} label="With error" placeholder="Choose" error="Required field" required />
    </div>
  );
}
```

- [ ] **Step 2: Register the page in `App.tsx`**

In `apps/pilot/src/App.tsx`: add `import { SelectMatrix } from './pages/SelectMatrix.tsx';`; extend the `Page` union with `'selects'`; add a nav button `<button onClick={() => setPage('selects')} aria-current={page === 'selects' ? 'page' : undefined}>Select matrix</button>` alongside the existing nav buttons; and add `{page === 'selects' && <SelectMatrix />}` in the `<main>` block next to the other pages. (Match the exact pattern already present for `tabs`.)

- [ ] **Step 3: Verify it builds and renders**

Run: `cd apps/pilot && bun run build 2>&1 | tail -3`
Expected: build succeeds, no circular-dependency warning.

- [ ] **Step 4: Populate playbook section 2.5**

In `docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md`, replace the `### 2.5 Form control (Wave 4 - Select)` stub line `_To be populated by Wave 4._` with a section (no em dashes) covering: the data-driven authoring shape (`defineGenericComponent<SelectSignature>`), the Mantine data model + `parseSelectData`, the single-vs-`multiple` inference via the discriminated union, the reusable `Field` composition, and the minimal `useCombobox` + floating-ui engine. Reference the recipe files. Mirror the depth of sections 2.1 to 2.4.

- [ ] **Step 5: Write the pilot journal**

Create `docs/superpowers/pilots/2026-06-23-select-pilot.md` recording: the substrate upgrade consumed (Wave 4A), the inference DX achieved, the `useCombobox` port scope and what was deferred (typeahead, async, virtualization), any gaps surfaced for the playbook section 3 ledger.

- [ ] **Step 6: Commit**

```bash
git add apps/pilot/src/pages/SelectMatrix.tsx apps/pilot/src/App.tsx docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md docs/superpowers/pilots/2026-06-23-select-pilot.md
git commit -m "$(cat <<'EOF'
feat(pilot): SelectMatrix page; playbook 2.5 + select pilot journal

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Whole-repo typecheck + all suites + build**

Run:
```bash
bun run typecheck && echo "typecheck PASS"
bun run --filter '@soribashi/*' test 2>&1 | grep -E "Tests |Exited with code"
(cd apps/pilot && bunx vitest run --reporter=basic 2>&1 | grep -E "Test Files|Tests " && bun run build 2>&1 | tail -2)
```
Expected: typecheck PASS; packages 82 / 137 / 473 / 244 (unchanged, PR B is pilot-only); pilot 52 + 21 new (parse 6 + field 4 + combobox 7 + select 11 = 28; pilot becomes 80) ... confirm the new count equals 52 prior + 28 = 80; production build clean, no circular-dependency warning.

- [ ] **Step 2: Manual visual check (state if unavailable)**

Run `cd apps/pilot && bun run dev`, open the Select matrix page, and confirm: single select opens/positions/selects; searchable filters; multiple shows pills and toggles; clear resets; disabled is inert; error renders. If a browser is not available in this environment, state that explicitly rather than claiming visual parity.

---

## Self-review checklist (run after all tasks)

- [ ] **Spec coverage:** section 5 (data model + signature + single/multi) -> Tasks 1, 4, 5, 6; section 6 (engine) -> Task 3 + floating-ui in Task 4; section 7 (Field) -> Task 2; section 8 (testing) -> Tasks 1-6 + 8; playbook 2.5 -> Task 7.
- [ ] **Substrate dependency:** Select uses `defineGenericComponent<SelectSignature>` from the local builders; relies on Wave 4A being merged (it is, on `main`).
- [ ] **No `@soribashi/*` package source changed:** PR B is pilot + docs only.
- [ ] **No placeholders; no em or en dashes** in authored prose/comments.
- [ ] **Counts:** packages unchanged; pilot 52 -> 80; build clean.

## Done =

Typecheck clean; packages 82/137/473/244 unchanged; pilot 80; production build clean; compile-time tests prove `Value` narrows from `data` and `multiple` flips `onChange`; SelectMatrix renders all variants. Then: `superpowers:finishing-a-development-branch` -> push -> PR B. With PR B merged, the playbook's four authoring categories are complete and the remaining host components become a sequencing sweep.
