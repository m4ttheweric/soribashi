# Wave 4B: Select Pilot Journal

**Date started:** 2026-06-23
**Spec:** docs/superpowers/specs/2026-06-08-wave-4-select-pilot-design.md
**Plan:** docs/superpowers/plans/2026-06-23-wave-4b-select-pilot.md

## Phase summary

All tasks (1-7) executed on branch `wave-4b-select-pilot`. Wave 4A (the
`defineGenericComponent` signature upgrade) was a prerequisite and landed on
`main` before this branch was cut (commit `e5c0699`, PR label "wave-4a-generic-builder").

| Task | Files | Notes |
|------|-------|-------|
| 1 | `parse-data.ts`, `parse-data.test.ts`, `package.json` | Data model + parser ported from Mantine; `@floating-ui/react` added |
| 2 | `Field.tsx`, `Field.module.css`, `Field.test.tsx` | Reusable form-control wrapper via `defineComponent` |
| 3 | `use-combobox.ts`, `use-combobox.test.ts` | Minimal state machine + keyboard intents |
| 4 | `Select.tsx` (single-select core), `Select.module.css`, `Select.test.tsx` | Single-select recipe with `defineGenericComponent<SelectSignature>` |
| 5 | `Select.tsx` (extended), `Select.test.tsx` | `multiple`, `searchable`, `clearable` |
| 6 | `Select.test.tsx` | Compile-time narrowing assertions |
| 7 | `SelectMatrix.tsx`, `App.tsx`, playbook 2.5, this journal | Demo page + docs |

## Substrate consumed: Wave 4A `defineGenericComponent` signature upgrade

Wave 4A added the ability to pass a generic signature type to `defineGenericComponent`:

```ts
defineGenericComponent<TSignature>({ name, selectors, classes, render })
```

The resulting component carries `TSignature & GenericComponentStatics` as its call
signature, so TypeScript sees the full generic overload at call sites rather than a
fallback `any`. Select is authored as:

```ts
export type SelectSignature = <const V extends Primitive = string>(
  props: SingleProps<V> | MultiProps<V>,
) => React.ReactElement | null;

export const Select = defineGenericComponent<SelectSignature>({ ... });
```

Without Wave 4A, the generic `V` parameter would have needed to be erased or worked
around with a cast at every call site. With it, the inference flows automatically.

## Inference DX achieved

Two forms of inference work at the call site with no consumer casts required:

**Value narrows from `data`.** When `data` is passed as a literal `as const` array or
inline object array (satisfying `const V`), TypeScript infers `V` as the union of the
value literals. Passing `data={[{ value: 'sm', label: 'S' }, { value: 'md', label: 'M' }]}`
makes `V = 'sm' | 'md'`, so `onChange` receives `'sm' | 'md' | null` and `value={'lg'}` is
a compile-time error.

**`multiple` flips `onChange`.** The discriminated union on `multiple` routes TypeScript to
`SingleProps` or `MultiProps`. Omitting `multiple` gives a scalar `onChange(value: V | null, option)`.
Passing `multiple: true` gives `onChange(value: V[], options)` with no overload needed.

Both assertions are enforced by the compile-time describe block in `Select.test.tsx`
(a `@ts-expect-error` line verifies the negative has teeth).

## `useCombobox` port: scope and deferrals

The hook is a bounded port of Mantine's `use-combobox`. It deliberately omits concerns
that are either out of scope for Wave 4 or the component's job rather than the hook's:

**Kept:**
- Active-option index (`activeIndex`) with `nextEnabledIndex` (skips disabled, wraps).
- Keyboard intent translation: ArrowDown/Up (move or open), Home/End (jump to first/last
  enabled), Enter (submit active), Escape (close). Returns intent objects rather than
  mutating component state directly.

**Deferred to the component:**
- Open/close state (the hook accepts `opened` but does not own it).
- Floating positioning (`@floating-ui/react` in `Select.tsx`, not the hook).
- Selection submission side effects (the component decides whether to close on single-select
  vs. stay open on multi-select).

**Out of scope for Wave 4 entirely:**
- Typeahead-to-focus (keyboard char navigation jumps to matching option).
- Async/remote data loading (callback-based `getData`).
- Virtualization (windowed rendering for large lists).
- Creatable/tags (free-form entry adds new items).
- Grouped option rendering with visual group headers (the data model supports groups;
  the pilot renders them flat without a separator row).

## Code review gaps surfaced and fixed

An in-wave code review surfaced four bugs and one missing accessibility attribute. All
were fixed before the tasks completed:

**1. Active-index reset on filter.** When `searchable` is true and the user types a
query that reduces the option list, the `activeIndex` from the previous full list could
point past the end of the filtered list. Fix: reset `activeIndex` to `-1` in the
`query` state setter (via `setActiveIndex` in `close()`, which is called on search
input change in addition to close events).

**2. Disabled keyboard guard.** The trigger's `onKeyDown` handler did not early-return
when `disabled` is true, so keyboard navigation was possible even when the control was
visually inert. Fix: added a `if (props.disabled) { return; }` guard in `handleKeyDown`.

**3. Real clear and remove buttons.** The clear button (`×` for single-select) and the
pill remove spans (`×` per pill in multi-select) were rendered as plain `<span>` elements
in the initial implementation, making them inaccessible to keyboard users and screen
readers. Fix: promoted both to `<span role="button">` with `aria-label` attributes
(`"Clear"` and `"Remove ${label}"` respectively), with `onClick` and explicit
`tabIndex={0}` on the outer clear span.

**4. `aria-activedescendant`.** The `<button role="combobox">` trigger lacked the
`aria-activedescendant` attribute pointing to the active option's id. Screen readers
use this to announce the currently highlighted option during keyboard navigation. Fix:
added `id={`${id}-opt-${i}`}` to each `<li role="option">` and wired
`aria-activedescendant={activeIndex >= 0 ? `${id}-opt-${activeIndex}` : undefined}` on
the trigger.

## Known limitations (playbook section 3 ledger)

The following limitations exist in the pilot implementation and should be tracked for
future resolution before a production rollout:

**Duplicate-value handling.** `parseSelectData` does not deduplicate items with the
same `value`. If a consumer passes duplicate values in `data`, the option list renders
them both and selection of either matches the first occurrence. Mantine's combobox also
does not deduplicate at parse time; this is documented expected behavior. A future
`strict` mode could warn on duplicates in development.

**Focus-return on close.** Pressing Escape or clicking an option closes the dropdown,
but focus is not explicitly returned to the trigger button. In most browsers the trigger
retains focus because it is the last focused element and the listbox is removed from the
DOM, but this is not guaranteed when the trigger itself lost focus during keyboard
navigation. A `triggerRef.current?.focus()` call in `close()` would make this
deterministic.

**Visual browser testing deferred.** The `SelectMatrix` demo page is wired and builds
correctly. A manual visual pass in a real browser is required before shipping to
confirm: dropdown positioning under the trigger, `flip` behavior near the viewport
edge, pill layout in multi-select, dark-mode token resolution, and focus-ring
visibility on the trigger.

**`useAutoId` counter is module-global.** The `_id` counter in `Select.tsx` is a
module-level variable, not a React id (no `useId` from React 18). This is fine for the
pilot but a production implementation should use React 18's `useId` hook to produce
stable, hydration-safe ids.

## Open design questions resolved during pilot

**OQ-1: Should the data parser live in `@soribashi/core` or stay pilot-local?**
Decision: pilot-local for Wave 4. The parser is a direct Mantine port and its
generics are coupled to the `SelectSignature` pattern; moving it to the package requires
settling the generic-builder API shape first. The pilot's `parse-data.ts` is the
authoritative reference for the future package implementation.

**OQ-2: Should `Field` live in `@soribashi/core`?**
Decision: pilot-local for Wave 4. `Field` uses `defineComponent` from the local
`builders.ts`, which re-exports the core factory. Promoting `Field` to the package is a
Wave 5+ concern and depends on the vocabulary-rails threading work landing fully in the
core factory.

**OQ-3: Should `useCombobox` expose `opened` in its return value?**
Decision: no. The component owns open/close state because it also owns positioning
lifecycle (`autoUpdate` in floating-ui needs `open` to be stable). The hook accepting
`opened` as input (rather than owning it) keeps the hook unit-testable without DOM.
