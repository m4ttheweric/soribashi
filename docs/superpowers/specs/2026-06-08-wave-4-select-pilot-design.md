# Wave 4: Select Pilot (Data-Driven Form Control) Design Spec

> **Status:** Design (2026-06-08). **Sizing:** L (a `@soribashi/factory` substrate upgrade plus a multi-part pilot recipe). **Category:** the fourth and final authoring category in the conversion playbook (data-driven form control). Completing it closes the playbook's category taxonomy; the remaining core-radix groups become a sequencing sweep.

## 1. Why this exists

Waves 1 to 3 proved three authoring categories: pure styled primitive (Button, `definePolymorphicComponent`), transient overlay compound (Tooltip, `defineCompound`), and persistent navigational compound (Tabs, `defineCompound` with a polymorphic part). Each exercised a builder that already carried real type information.

The one builder with **no real consumers and no real inference** is `defineGenericComponent`. It is currently a `@deprecated` stub whose returned component is typed `<T>(props: any)` ... it preserves a type parameter in shape only, with `props` widened to `any`. Wave 4 exists to prove the **data-driven form control** category, and the honest way to prove it is to make `defineGenericComponent` carry real generic inference and then author a `Select` recipe against it.

A compound Select (children-composed, like Tabs) was explicitly rejected: it adds zero stress to the library (we can build it today) and sidesteps the reason to pick Select at all. The value of Select is **react-select-grade type inference on a data prop**, grounded in Mantine's architecture.

**Grounding principle.** soribashi does not invent its own component ideas. It copies Mantine's library approach wherever possible and makes those building blocks more accessible to platform maintainers and builders. Wave 4 copies Mantine's Select data model, field composition, and generic-factory mechanism; it layers react-select's inference depth (literal-union narrowing, single-vs-multi `onChange` typing) on top.

## 2. Scope

**In scope:**
- Static `data`: an array of `Value`, `{ value, label, disabled }`, or `{ group, items }`.
- Single and multiple selection via one `multiple` flag (react-select `IsMulti` style), with `value`/`onChange` typing that flips on the flag.
- Optional client-side `searchable` filter; `clearable`; `disabled`; `placeholder`.
- Field composition: label, description, error, required asterisk, with `htmlFor` / `aria-describedby` / `aria-invalid` wiring.
- `@floating-ui/react` positioning plus a minimal `useCombobox` behavior hook (open state, active index, keyboard navigation).
- Full call-site inference: `Value` narrows to the literal union present in `data`; `onChange` shape follows `multiple`.

**Out of scope (YAGNI, named as future sweep items):**
- Async / remote data loading and loading states.
- Virtualized option lists.
- Creatable options / free-text tags input.
- Typeahead-to-focus (deferred from the engine port).
- Compile-time threading of the theme's `size` vocabulary into `defineGenericComponent` (the rails threading shipped in PR #11 is `definePolymorphicComponent`-only; extending it to the generic builder is a separate future item). Select's `size` is typed locally in its signature this wave; runtime `vocabularyAxes: ['size']` validation may opt in.

## 3. Architecture: four layers, bottom up

1. **Substrate (`@soribashi/factory`).** `defineGenericComponent` upgraded so the recipe author supplies a generic *signature* type; the returned component carries exactly that signature plus the static members. This mirrors Mantine's `genericFactory`. Reusable: every future generic component declares its own signature with no further builder change.
2. **Engine (pilot-local).** A `useCombobox` hook (open/active-index/select state, keyboard navigation) plus `@floating-ui/react` for dropdown positioning. A deliberately minimal port of Mantine's `use-combobox` behavior, not its full Combobox part-library.
3. **Field (pilot-local, reusable).** A `Field` component rendering label / description / control / error with the correct ARIA wiring. Composed by Select and reusable by any future form control, mirroring Mantine's shared `Input.Wrapper`.
4. **Select recipe (pilot-local).** Authored via the upgraded `defineGenericComponent`; consumes the engine and Field; declares the generic signature that delivers the inference DX.

The four units have clean boundaries: the substrate knows nothing about Select; the engine knows nothing about theming; Field knows nothing about combobox behavior; Select composes all three.

## 4. Substrate upgrade: `defineGenericComponent` carries a signature

### 4.1 Current state

```ts
// packages/factory/src/define-generic-component.tsx (today, @deprecated)
export type GenericComponentFn = <T>(props: any & React.RefAttributes<unknown>) => React.ReactElement | null;
export interface GenericComponentStatics { extend; withProps; classes?; displayName? }
export function defineGenericComponent<TOwnPropsTemplate>(
  config: DefineGenericComponentConfig,
): GenericComponentFn & GenericComponentStatics;
```

The returned component is always `<T>(props: any)`. The type parameter is preserved in shape but `props` is `any`, so there is no inference and no safety.

### 4.2 New shape

The author supplies the generic signature as a type parameter. The returned component IS that signature, plus statics:

```ts
export function defineGenericComponent<TSignature>(
  config: DefineGenericComponentConfig,
): TSignature & GenericComponentStatics;
```

This is the soribashi analog of Mantine's mechanism (verified in source):

```ts
// mantine core/factory/factory.tsx
export function genericFactory<Payload extends FactoryPayload>(ui: Payload['signature']) {
  return factory(ui as any) as Payload['signature'] & MantineComponentStaticProperties<Payload>;
}
// FactoryPayload.signature?: any   ← author-supplied generic call signature
```

### 4.3 Mechanics and guarantees

- **Runtime is unchanged.** Internally the render path handles props untyped (as today). All safety lives at the call site through `TSignature`. The `as` from the untyped implementation to `TSignature & statics` is the same trick Mantine uses and the same shape soribashi already uses elsewhere (the themed builders in PR #11 cast a runtime-identical implementation to a refined type).
- **Statics preserved.** `extend`, `withProps`, `classes`, `displayName` remain. `withProps` returns `TSignature & statics` so the generic call signature survives partial application (matches Mantine's generic `withProps`).
- **`@deprecated` removed.** The builder gains a real consumer (Select) and a real purpose.
- **`vocabularyAxes` still honored.** The existing dev-only Zod validation path is untouched; a generic recipe may still declare `vocabularyAxes` for runtime checks.

### 4.4 Substrate proof (independent of Select)

A tiny demo generic component plus type-level tests prove inference before Select is built: a `Pick<T>`-style component whose `onSelect` argument narrows to the element type of an `items: T[]` prop, asserted with `@ts-expect-error` (the same proof style used for the PR #11 vocab threading).

## 5. Select recipe: data model, signature, inference

### 5.1 Data model (copied from Mantine)

```ts
type Primitive = string | number | boolean;                       // mirror Mantine's Primitive
interface ComboboxItem<V extends Primitive> { value: V; label: string; disabled?: boolean }
interface ComboboxGroup<V extends Primitive> { group: string; items: (V | ComboboxItem<V>)[] }
type SelectData<V extends Primitive> = (V | ComboboxItem<V> | ComboboxGroup<V>)[];
```

A bare `Value` is sugar for `{ value, label: String(value) }`, resolved by a `parseSelectData` helper ported from Mantine's `get-parsed-combobox-data`.

### 5.2 Generic signature (the inference DX)

```ts
interface BaseProps<V extends Primitive> {
  data: SelectData<V>;
  searchable?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  placeholder?: string;
  size?: string;                 // typed locally this wave (see §2 out-of-scope)
  // Field composition:
  label?: ReactNode; description?: ReactNode; error?: ReactNode; required?: boolean;
}
interface SingleProps<V extends Primitive> extends BaseProps<V> {
  multiple?: false;
  value?: V | null; defaultValue?: V | null;
  onChange?: (value: V | null, option: ComboboxItem<V> | null) => void;
}
interface MultiProps<V extends Primitive> extends BaseProps<V> {
  multiple: true;
  value?: V[]; defaultValue?: V[];
  onChange?: (value: V[], options: ComboboxItem<V>[]) => void;
}

// `const V` narrows V to the literal union present in `data` without `as const`.
type SelectSignature = <const V extends Primitive = string>(
  props: SingleProps<V> | MultiProps<V>,
) => ReactElement | null;

export const Select = defineGenericComponent<SelectSignature>({ /* config */ });
```

**Resulting DX:**
- `<Select data={[{ value: 'sm', label: 'S' }, { value: 'md', label: 'M' }]} onChange={(v) => …} />` infers `v: 'sm' | 'md' | null`.
- Adding `multiple` flips `v` to `('sm' | 'md')[]` and the second `onChange` argument to `ComboboxItem[]`.
- Passing a value outside the data union is a compile error.

The `const V` literal-narrowing is the one piece carrying inference risk; the implementation plan validates it in an isolated prototype first (as the PR #11 threading was prototyped before any package edit).

### 5.3 Parts / anatomy

| Part | Role |
|---|---|
| `field` | Field wrapper (label / description / error), composed from the reusable `Field` unit |
| `trigger` | The control surface: shows placeholder, selected label(s), pills (multi), clear button, chevron |
| `dropdown` | Floating-ui positioned panel containing the option list |
| `option` | A single option row; check icon for selected; disabled styling; active (highlighted) styling |
| `group` | Optional group label above a set of options |

Styling uses the same `data-attribute selector + vars-resolver` hybrid as Button and Tabs. CSS lives in `Select.module.css` with plain scoped selectors.

## 6. Engine: `useCombobox` + floating-ui (minimal port)

A pilot-local hook, bounded to what the pilot needs, ported from Mantine's `use-combobox`:

- **State:** `opened`, `activeIndex` (highlighted option), and the selection (single value or array). Open is controllable; selection is controlled/uncontrolled via `useUncontrolled`-style logic.
- **Actions:** open / close / toggle, set active index, select option, clear.
- **Keyboard:** ArrowDown / ArrowUp move the active option (wrapping, skipping disabled), Enter selects the active option, Escape closes, Home / End jump to first / last. Typeahead-to-focus is deferred.
- **Positioning:** `@floating-ui/react` `useFloating` with `flip`, `shift`, and `size` middleware so the dropdown stays in view and matches trigger width.
- **ARIA:** `role="combobox"` trigger with `aria-expanded` / `aria-controls`, `role="listbox"` dropdown, `role="option"` rows with `aria-selected`, and `aria-activedescendant` tracking the highlighted option.

`@floating-ui/react` is a new pilot dependency (Mantine uses floating-ui as well). The hook is intentionally not a general-purpose Combobox subsystem; it is the smallest correct behavior layer for the pilot.

## 7. Field wrapper

A reusable `Field` authored with `defineComponent`, rendering in order: label (with required asterisk), description, the control (children), and error. It wires `htmlFor` to the control id, `aria-describedby` to description and error ids, and `aria-invalid` when an error is present. Select composes it; future form controls reuse it. This mirrors Mantine's `Input.Wrapper` being shared across inputs rather than re-baked per control.

## 8. Testing strategy

- **Substrate (type-level).** Against the tiny demo generic component: `@ts-expect-error` assertions that the data element type infers into the callback, and that an out-of-set value is rejected. Enforced by `bun run typecheck` (the pilot and packages are in the root tsconfig).
- **Select (type-level).** Assertions that `Value` narrows to the `data` literal union, that `multiple` flips `value`/`onChange` between single and array, and that out-of-union values error.
- **Select (behavior, vitest + Testing Library).** Open on trigger click; keyboard navigation (Arrow / Enter / Escape / Home / End); single select; multiple select with pills; client-side search filter; clearable; disabled options and disabled control; controlled and uncontrolled value flows.
- **Field (vitest).** Label / description / error render; required asterisk; ARIA wiring (`htmlFor`, `aria-describedby`, `aria-invalid`).
- **Playwright parity.** Smoke the high-frequency cells: dropdown open and positioned, selected check icon, multi pills, dark mode. Not exhaustive.

Pilot test harness reuses the canonical three-file vitest scaffold from playbook section 2.0.

## 9. Sequencing: two phases / two PRs

This is L. Split it the way the vocabulary-rails core (PR #10) and pilot migration (PR #11) were split:

- **PR A (substrate).** `defineGenericComponent` signature upgrade, statics preservation, type-level tests, and the tiny demo generic component. `@soribashi/factory` only. Independently valuable and reviewable; unblocks any future generic component, not just Select.
- **PR B (pilot).** `@floating-ui/react` dependency, the `useCombobox` engine, the `Field` wrapper, the `Select` recipe, all tests, the playbook section 2.5 extension, and the pilot journal. Consumes PR A.

## 10. Open design questions (for the planning phase)

1. **`const V` literal narrowing fidelity.** Does `<const V extends Primitive>` infer the exact union from `data` across the `SelectData` shape (bare values, items, groups), or does any branch widen `V` to `Primitive`? Prototype before implementing (gates §5.2).
2. **Single union prop vs split unions.** `SingleProps | MultiProps` discriminated by `multiple` is the proposed shape. Confirm TS narrows the union cleanly at call sites when `multiple` is absent (should default to the single branch) without requiring the consumer to annotate.
3. **`Field` as `defineComponent` vs `defineCompound`.** Proposed `defineComponent` (one render, ordered slots). Revisit if consumers need to reorder or target slots independently.
4. **`size` for the generic builder.** This wave types `size` locally. Confirm whether a follow-up should thread the theme `size` vocab into `defineGenericComponent` (parity with `definePolymorphicComponent`) or whether generic recipes should always type vocab axes locally.

## 11. References

- Mantine Select: `/Users/matt/Documents/GitHub/mantine/packages/@mantine/core/src/components/Select/Select.tsx` (`SelectProps<Value extends Primitive>`, `genericFactory<SelectFactory>`, `SelectFactory['signature']`).
- Mantine Combobox types: `.../components/Combobox/Combobox.types.ts` (`ComboboxItem`, `ComboboxData`, `ComboboxLikeProps`).
- Mantine generic factory: `.../core/factory/factory.tsx` (`genericFactory`, `FactoryPayload.signature`).
- Mantine combobox behavior: `.../components/Combobox/use-combobox/`, `.../get-parsed-combobox-data/`, `.../OptionsDropdown/`.
- Mantine field composition: `.../components/Input/` (`Input.Wrapper`), `.../components/InputBase/`.
- soribashi generic builder (to upgrade): `packages/factory/src/define-generic-component.tsx`.
- Prior wave specs: `2026-05-10-wave-3-tabs-pilot-design.md`, `2026-05-12-vocabulary-rails-design.md` (the core-then-pilot PR split precedent, and the prototype-before-implementing discipline).
- Playbook: `2026-04-26-core-radix-conversion-playbook.md` section 2.5 (Wave 4 stub) and section 5 (future waves outline).
