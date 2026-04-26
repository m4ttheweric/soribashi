# Tier 1 Audit — packages/factory/src/define-generic-component.tsx

**Pinned to:** `mantinedev/mantine@63dafbbf5f0135eb36455b7add4c0ddcd0f3240a`
**Mantine source:** `packages/@mantine/core/src/core/factory/factory.tsx` (`genericFactory` at line 99)
**Soribashi source:** `packages/factory/src/define-generic-component.tsx`
**Audit date:** 2026-04-25

The Mantine analog is the `genericFactory` function inside `factory.tsx`.  It is a 3-line
wrapper over `factory()` that re-casts the result to `Payload['signature'] &
MantineComponentStaticProperties<Payload>`.  Companion files checked:

- `factory.tsx` (already audited in Task 1.1 — re-read for `genericFactory` context)
- `create-factory.ts` — only type aliases `Factory` and `PolymorphicFactory`; no `genericFactory` types
- `index.ts` — exports `genericFactory`; no new behavior

Real-world usage inspected: `RadioGroup.tsx`, `Accordion.tsx`, `ChipGroup.tsx`.
Each uses `signature: <Value extends Primitive = string>(props: ...) => JSX.Element` in the
`FactoryPayload`; the resulting component is generic over that type parameter.

---

## Decision-point enumeration

| # | Mantine line(s) | Decision / branch | Soribashi behavior | Classification |
|---|---|---|---|---|
| G1 | factory.tsx:99–102 | `genericFactory(ui)` is a thin 3-line wrapper: calls `factory(ui as any)` and re-casts the return type to `Payload['signature'] & MantineComponentStaticProperties<Payload>`. No forwardRef, no hook integration — same as plain `factory()`. | `defineGenericComponent(config)` is a full constructor: integrates `useProps` + `useStyles` + `autoVars` inside the component body; callers express intent via a `config.render` callback. | `INTENTIONAL` (soribashi uses the constructor model, same rationale as `definePolymorphicComponent` vs `polymorphicFactory`; no Mantine analog for the constructor layer) |
| G2 | factory.tsx:87–88 | `factory(ui)`: `const Component = ui as any` — NO `forwardRef` wrap; ref is an ordinary prop attached to the render function argument. | `defineGenericComponent` wraps in `React.forwardRef`; render signature is `(rawProps, ref)`. The `ref` is forwarded into `config.render({ props, getStyles, ref })`. | `INTENTIONAL` (same as `factory()` B1 divergence already in ledger — soribashi wraps in forwardRef across all factories) |
| G3 | factory.tsx:88–96 | `factory` attaches `extend = identity`, `withProps` (with `Extended.extend = Component.extend` and `Extended.displayName`). `factory.tsx:90` also sets `Extended.withProps = createWithProps(Component)`. | `defineGenericComponent` attaches `(Component as any).extend = identity` and `(Component as any).withProps = makeWithProps(Component)`. `makeWithProps` (fixed in this task) now propagates both `.extend` AND `.withProps` recursively. | `INCONSISTENCY` → fixed (see Findings) |
| G4 | factory.tsx:93 | `Extended.withProps = createWithProps(Component)` — Mantine's `withProps` result has its own `withProps` method (double-wrap chain). `createWithProps` is the same function as `factory.withProps`'s implementation. | `makeWithProps` sets `(Wrapped as any).withProps = makeWithProps(Wrapped as any)` after the fix. Double-wrap chains work. | `INCONSISTENCY` → fixed (part of same fix as G3; verified by G5c test) |
| G5 | factory.tsx:91 | `Extended.extend = Component.extend` — `withProps` result has the same `extend` as the parent. | `makeWithProps` sets `(Wrapped as any).extend = (Base as any).extend` when present after the fix. | `INCONSISTENCY` → fixed (part of same fix as G3/G4) |
| G6 | factory.tsx:92 | `Extended.displayName = \`WithProps(${Component.displayName})\`` | `makeWithProps` sets `Wrapped.displayName = \`WithProps(${Base.displayName ?? Base.name ?? 'Component'})\`` | `IDENTICAL` (soribashi adds fallback for unnamed components) |
| G7 | factory.tsx:99–102 | `genericFactory` signature: accepts `ui: Payload['signature']` (any function type). No `forwardRef`. The component's type parameter is preserved purely via the cast. | `defineGenericComponent` accepts `config: DefineGenericComponentConfig` with a `render` callback. Type-parameter preservation is handled via `GenericComponentFn & GenericComponentStatics` return type. | `INTENTIONAL` (different mechanism for same goal: generic type preservation through `withProps`) |
| G8 | (Mantine type) `FactoryPayload.signature?: any` | Mantine uses `Payload['signature']` to carry the generic component signature; the `genericFactory` call-site declares `signature: <T extends ...>(props: ...) => JSX.Element`. | Soribashi uses `GenericComponentFn = <T>(props: any & React.RefAttributes<unknown>) => React.ReactElement \| null`. The `TOwnPropsTemplate` type parameter on `defineGenericComponent<TOwnPropsTemplate>` is not actually used at runtime — it exists for documentation/IDE hints only. | `INTENTIONAL` (type-level only; both approaches produce a generic callable at the use-site; soribashi's approach is simpler because the constructor handles all hook integration, so the signature genericity is in `GenericComponentFn`) |
| G9 | (no Mantine analog) | Mantine's `genericFactory` / `factory` do NOT integrate `useProps`, `useStyles`, or `autoVars`. Callers call hooks manually. | `defineGenericComponent` calls `useProps` (with `config.defaults`), `useStyles` (with `config.name`, `config.classes`, and all prop slots), and optionally `config.vars` or `autoVars` inside the forwardRef body. | `INTENTIONAL` (soribashi's constructor model — same rationale as `definePolymorphicComponent`; no Mantine analog) |
| G10 | (no Mantine analog) | Mantine's `genericFactory` does not attach a `classes` static property (it's inherited from `MantineComponentStaticProperties` which includes `ComponentClasses<Payload>` only when `Payload['stylesNames']` is a string). | `defineGenericComponent` unconditionally attaches `(Component as any).classes = config.classes`. Callers can read `Select.classes.root` to get the stable CSS class name. | `INTENTIONAL` (soribashi extension; mirrors the `definePolymorphicComponent` convention; already in ledger for the polymorphic variant) |
| G11 | factory.tsx:80–82 | Mantine exports `identity` as a named export: `export function identity<T>(value: T): T`. Used as `Component.extend = identity`. | Soribashi declares `const identity = <T,>(value: T): T => value` as a module-private constant; not exported. `define-generic-component.tsx` defines its own private `identity` copy (same pattern as `factory.tsx` and `define-polymorphic-component.tsx` in soribashi). | `INTENTIONAL` (same as B6 in factory audit; soribashi keeps `identity` private in each module; not a runtime divergence) |
| G12 | factory.tsx:89 | Mantine's `withProps` does NOT forward a `ref` — `(props: any) => <Component {...fixedProps} {...props} />`. Since Mantine's factory does not use forwardRef, no ref is needed here. | `makeWithProps` wraps with `forwardRef` and passes `ref` down, because soribashi's factory uses `forwardRef`. | `INTENTIONAL` (consequence of G2; both approaches correctly forward the ref) |
| G13 | factory.tsx:90 | `Extended.withProps = createWithProps(Component)` — Mantine passes the ORIGINAL `Component` (not `Extended`) to `createWithProps`. Double-wrap chains all share the same underlying component. | `makeWithProps` sets `(Wrapped as any).withProps = makeWithProps(Wrapped as any)` — passes the WRAPPED component. Each level of wrapping stacks presets incrementally. | `INTENTIONAL` (consequence of the undefined-filter design; soribashi stacks wrappers whereas Mantine shares the base component; net result differs only when three or more levels of wrapping are chained — an exotic pattern; same observable behavior for the common one- and two-level cases) |

---

## Findings

### `INCONSISTENCY` — `makeWithProps` missing extend + withProps propagation

- **File:Line:** `packages/factory/src/with-props.tsx` — `makeWithProps` return value
- **Classification:** `INCONSISTENCY` (same root-cause finding as factory.tsx B4 / polymorphic-parity.tsx P4/P17/P20)
- **Mantine behavior:**
  - `factory.tsx:91` — `Extended.extend = Component.extend`
  - `factory.tsx:90` — `Extended.withProps = createWithProps(Component)` (double-wrap chain)
- **Soribashi baseline behavior (pre-fix):** `makeWithProps` returned a `forwardRef`-wrapped `Wrapped` component without copying `.extend` or re-binding `.withProps`. The result of `Select.withProps({...})` had neither `.extend` nor `.withProps`.
- **TDD:** Tests G5a–G5e all failed first (confirming the bug), then passed after the fix was applied.
- **Fix:** In `with-props.tsx`, after the `displayName` assignment:
  1. Copy `Base.extend` to `Wrapped.extend` when present.
  2. Set `Wrapped.withProps = makeWithProps(Wrapped as any)` unconditionally.
- **Status:** Fixed. All parity tests pass.

### No `BUG`, `HALLUCINATION`, or `HOOK_REIMPL` findings

All findings are either `INCONSISTENCY` (one, fixed above) or `INTENTIONAL` divergences.

### `INTENTIONAL` findings requiring new ledger entries

The following are deliberate divergences not yet recorded in the master ledger:

- **G1 / G9:** `defineGenericComponent` is a full constructor (constructor model) vs Mantine's thin
  type-cast + delegated hook calls. Same rationale as `definePolymorphicComponent`. New ledger
  entry: "defineGenericComponent — constructor model vs genericFactory type-cast".

- **G8:** `GenericComponentFn` type shape vs Mantine's `Payload['signature']` mechanism. Type-only
  divergence; soribashi's type is simpler because the constructor handles all hook integration.
  New ledger entry: "GenericComponentFn — simpler generic signature type".

- **G10:** `classes` static attached unconditionally (same as polymorphic variant, already in ledger
  for polymorphic). Confirm ledger entry exists / add for generic variant.

- **G13:** `makeWithProps` stacks wrappers vs Mantine sharing the base component in `createWithProps`.
  Observable difference only for 3+ levels of chaining (exotic). New ledger entry.

### Already-in-ledger `INTENTIONAL` findings (no new entry needed)

- G2: forwardRef wrap (already in ledger as "factory() — wraps render in forwardRef")
- G6: `withProps` displayName fallback (same as factory.tsx B5, already covered)
- G11: `identity` private (same as factory.tsx B6)
- G12: ref forwarded through `makeWithProps` (consequence of G2 forwardRef, already covered)

---

## Extend / withProps propagation — fix applied in this task

**Finding classification:** `INCONSISTENCY` — `makeWithProps` (the shared helper in
`packages/factory/src/with-props.tsx`) did not propagate `.extend` or `.withProps` to the
result component. This is the same root-cause finding as factory.tsx B4 and polymorphic
P4/P17/P20 (all three are fixed by the same `with-props.tsx` change).

**TDD sequence:** Tests G5a–G5e were written first (per TDD discipline) and all failed. Then
the fix was applied to `with-props.tsx`. Tests then passed.

**Fix in `packages/factory/src/with-props.tsx`:** After `Wrapped.displayName`, added:
1. `if ((Base as any).extend !== undefined) { (Wrapped as any).extend = (Base as any).extend; }`
2. `(Wrapped as any).withProps = makeWithProps(Wrapped as any);`

This means:
- `Select.withProps({...}).extend` → function (propagated from `Select.extend`)
- `Select.withProps({...}).withProps({...})` → works (double-wrap chain)
- `Select.withProps({...}).withProps({...}).extend` → function (propagated through both wraps)

Verified by parity tests G5a–G5e, G12a–G12b, G13a–G13b in `generic-parity.test.tsx`.
