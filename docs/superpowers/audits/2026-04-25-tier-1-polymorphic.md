# Tier 1 Audit — packages/factory/src/polymorphic-component.tsx + define-polymorphic-component.tsx

**Pinned to:** `mantinedev/mantine@63dafbbf5f0135eb36455b7add4c0ddcd0f3240a`
**Mantine sources:**
- `packages/@mantine/core/src/core/factory/polymorphic-factory.tsx`
- `packages/@mantine/core/src/core/factory/create-polymorphic-component.ts`
**Soribashi sources:**
- `packages/factory/src/polymorphic-component.tsx`
- `packages/factory/src/define-polymorphic-component.tsx`
**Audit date:** 2026-04-25

These two files are audited together because `define-polymorphic-component.tsx` composes
`polymorphic-component.tsx`'s lower-level pattern (forwardRef + makeWithProps + identity extend).

---

## Decision-point enumeration

### From `polymorphic-factory.tsx` (Mantine) + `polymorphic-component.tsx` (soribashi)

| # | Mantine line(s) | Decision / branch | Soribashi behavior | Classification |
|---|---|---|---|---|
| P1 | polymorphic-factory.tsx:41 | `polymorphicFactory(ui)` casts `ui as unknown as PolymorphicComponent` — no `forwardRef`; render signature is `(props: Payload['props'] & { ref?: React.Ref<any> }) => React.ReactNode` (ref is an ordinary prop) | `polymorphicComponent(render)` wraps in `React.forwardRef`; render signature is `(props, ref) => React.ReactNode` (explicit separate ref parameter) | `INTENTIONAL` (already in ledger — "polymorphicFactory() — wraps render in forwardRef") |
| P2 | polymorphic-factory.tsx:42–47 | `Component.withProps` inlined directly inside `polymorphicFactory`; not extracted into a shared helper | `polymorphicComponent` delegates to `makeWithProps` from `with-props.tsx` | `INTENTIONAL` (soribashi extracts `withProps` into a shared module; behavioral outcome is equivalent when `makeWithProps` is correct) |
| P3 | polymorphic-factory.tsx:43–44 | `withProps` inlined function: `(props) => <Component {...fixedProps} {...props} />` — no `undefined` filtering; instance props spread last | `makeWithProps` filters `undefined` from instance props before merge | `INTENTIONAL` (already in ledger — "factory.withProps — filters undefined from instance props") |
| P4 | polymorphic-factory.tsx:44 | `Extended.extend = Component.extend` — extend propagated to the `withProps` result | `makeWithProps` does NOT copy `Base.extend` to `Wrapped` (as of this worktree's baseline) | `INCONSISTENCY` (same as factory.tsx B4; soribashi's withProps result is missing extend — see Findings) |
| P5 | polymorphic-factory.tsx:45 | `Extended.displayName = \`WithProps(${Component.displayName})\`` | `makeWithProps` sets `Wrapped.displayName = \`WithProps(${Base.displayName ?? Base.name ?? 'Component'})\`` | `IDENTICAL` (same pattern; soribashi adds fallback for unnamed components) |
| P6 | polymorphic-factory.tsx:49 | `Component.extend = identity` assigned | `(Component as any).extend = identity` assigned | `IDENTICAL` |
| P7 | polymorphic-factory.tsx:17–19 | `PolymorphicComponentWithProps.withProps` typed to accept `PolymorphicComponentProps<C, Payload['props']>` as presets, returning a component also typed polymorphically | `polymorphicComponent` uses `makeWithProps` whose generic is `TProps`; return type is `ComponentType<TProps>` (loses explicit polymorphic typing at this lower level) | `INTENTIONAL` (the high-level `definePolymorphicComponent` re-applies the correct polymorphic `WithPropsFn` type; the lower-level escape-hatch is intentionally untyped at `any`) |

### From `create-polymorphic-component.ts` (Mantine) + `polymorphic-component.tsx` / `types/polymorphic.ts` (soribashi)

| # | Mantine line(s) | Decision / branch | Soribashi behavior | Classification |
|---|---|---|---|---|
| P8 | create-polymorphic-component.ts:11–13 | `ComponentProp<C>` uses `component?: C` (prop name is `component`) | Soribashi uses `as?: TAs` (prop name is `as`) — see `types/polymorphic.ts` and `define-polymorphic-component.tsx` | `INTENTIONAL` (already in ledger — "PolymorphicComponentProps — own props win on conflict"; soribashi uses `as` which is more idiomatic in the React ecosystem) |
| P9 | create-polymorphic-component.ts:21–26 | `PolymorphicComponentProps` includes `renderRoot?: (props: any) => any` — an escape hatch for custom render roots | Soribashi has no `renderRoot` prop | `INTENTIONAL` (soribashi does not support `renderRoot`; the `as` prop is the sole polymorphic mechanism) |
| P10 | create-polymorphic-component.ts:17–19 | `PolymorphicRef<C>` = `C extends React.ElementType ? React.ComponentProps<C>['ref'] : never` | Soribashi's `PolymorphicRef<TAs>` = `ComponentPropsWithRef<TAs> extends { ref?: infer R } ? R : never` | `IDENTICAL` (functionally equivalent; both extract the ref type from the element's component props) |
| P11 | create-polymorphic-component.ts:1–3 | `ExtendedProps<Props, OverrideProps> = OverrideProps & Omit<Props, keyof OverrideProps>` — own props (OverrideProps) win by omitting conflicting keys from Props | `PolymorphicProps<TAs, TOwnProps> = TOwnProps & Omit<ComponentPropsWithRef<TAs>, keyof TOwnProps | 'as'> & { as?: TAs }` — own props (TOwnProps) win by omitting conflicting keys from ComponentPropsWithRef | `IDENTICAL` (same omit-based override strategy; soribashi additionally removes `'as'` from the inherited surface — already in ledger) |
| P12 | create-polymorphic-component.ts:28–44 | `createPolymorphicComponent(component)` is a pure type-cast utility; no runtime behavior; takes `any`, returns typed `PolymorphicComponent` | No `createPolymorphicComponent` equivalent. Soribashi uses `definePolymorphicComponent` (a higher-level constructor with full Styles API) and `polymorphicComponent` (a lower-level forwardRef wrapper) | `INTENTIONAL` (soribashi doesn't need a pure type-cast wrapper because `definePolymorphicComponent` is the sole public entry point; see P13 below) |

### From `polymorphic-factory.tsx` (Mantine) + `define-polymorphic-component.tsx` (soribashi)

| # | Mantine line(s) | Decision / branch | Soribashi behavior | Classification |
|---|---|---|---|---|
| P13 | polymorphic-factory.tsx:22 | `polymorphicFactory(ui)` receives a bare render function without Styles API; callers must manually call `useProps`, `useStyles` etc | `definePolymorphicComponent(config)` integrates `useProps` + `useStyles` + `autoVars` inside the component body; callers provide a high-level `config.render` callback | `INTENTIONAL` (soribashi elevates the factory pattern into a full Styles-API component constructor; Mantine separates the type-casting concern from the behavior concern via `createPolymorphicComponent` + `polymorphicFactory`) |
| P14 | polymorphic-factory.tsx:41 | No `as` prop unwrap inside `polymorphicFactory` — the unwrap is the caller's responsibility inside `ui` | `definePolymorphicComponent` unwraps `as` from `rawProps` via `const { as: asProp, ...rest } = rawProps as { as?: ElementType }` | `INTENTIONAL` (consistent with soribashi's higher-level constructor model; the `as` unwrap is centralized in the constructor) |
| P15 | (no analog) | Mantine's `polymorphicFactory` does not attach a `classes` static property | `definePolymorphicComponent` attaches `(Component as any).classes = config.classes` | `INTENTIONAL` (soribashi extension: classes static mirrors the Styles API convention from `factory()`; no Mantine analog at this level) |
| P16 | polymorphic-factory.tsx:49 | `Component.extend = identity` | `definePolymorphicComponent` attaches `(Component as any).extend = identity` | `IDENTICAL` |
| P17 | polymorphic-factory.tsx:42–47, factory.tsx:90 | `polymorphicFactory.withProps` inlined with (a) `Extended.extend = Component.extend` and (b) `Extended.withProps = createWithProps(Component)` propagated | `definePolymorphicComponent` delegates to `makeWithProps(Component)` which did NOT copy `extend` (baseline) and did NOT set `withProps` on the result; P17c test (double-wrapped withProps) surfaced the `withProps` gap after the `extend` fix | `INCONSISTENCY` → fixed (both `extend` AND `withProps` now propagated in `makeWithProps`) |
| P18 | (no analog in polymorphic-factory.tsx) | No `defaultElement` / default `as` fallback in `polymorphicFactory` — callers write their own fallback | `definePolymorphicComponent` has `config.defaultElement`; render body does `const Element: ElementType = asProp ?? config.defaultElement` | `INTENTIONAL` (soribashi's higher-level constructor handles default-element as a first-class config option; Mantine delegates this to the caller's `ui` implementation) |
| P19 | polymorphic-factory.tsx:11–13 | `PolymorphicFactoryPayload.defaultComponent: any` and `.defaultRef: any` | Soribashi `DefinePolymorphicComponentConfig.defaultElement: TDefaultAs extends ElementType` | `TOKEN_DIFF` (same concept, different names: `defaultComponent` → `defaultElement`, `defaultRef` omitted because the ref is managed by forwardRef internally) |
| P20 | polymorphic-factory.tsx:44 | `withProps` result copies extend (`Extended.extend = Component.extend`) — enables chaining | `makeWithProps` result does NOT copy extend from `Base` | `INCONSISTENCY` (already noted as P4/P17; the fix in `with-props.tsx` resolves all three callsites: `factory`, `polymorphicComponent`, `definePolymorphicComponent`) |

---

## Findings

### `INCONSISTENCY` findings

#### P4 / P17 / P20 — `makeWithProps` does not propagate `extend` or `withProps` to the result

- **File:Line:** `packages/factory/src/with-props.tsx` — `makeWithProps` return value (missing `.extend` copy and missing `.withProps` re-binding)
- **Affects:** All three polymorphic callsites — `polymorphicComponent.withProps`, `definePolymorphicComponent.withProps`, plus the non-polymorphic `factory.withProps` (B4 from the factory audit)
- **Mantine behavior — `extend` (polymorphic-factory.tsx:44):** `Extended.extend = Component.extend` — the `withProps` result can call `.extend()` for further theming.
- **Mantine behavior — `withProps` (factory.tsx:90):** `Extended.withProps = createWithProps(Component)` — the `withProps` result can call `.withProps()` again, enabling double-wrapping chains like `Button.withProps({...}).withProps({...})`.
- **Soribashi previous behavior:** `makeWithProps` returned a `forwardRef`-wrapped `Wrapped` component without copying `.extend` or re-binding `.withProps`. The P17c unconditional test (double-wrapped `withProps`) surfaced the `withProps` gap after the `extend` fix was already applied: `SmallText.withProps(...)` succeeded but `SmallSpanText.extend` was undefined because `SmallText` had no `.withProps` to produce a result that carried `extend`.
- **Classification:** `INCONSISTENCY` — the three factories all attach `extend` (and support `withProps` chaining) on the component itself, but `makeWithProps` (shared helper) failed to propagate either to the result.
- **Fix:** In `makeWithProps`, after the `extend` propagation block, add: `(Wrapped as any).withProps = makeWithProps(Wrapped as any);`. This matches Mantine's `Extended.withProps = createWithProps(Component)` at `factory.tsx:90`.
- **TDD:** See `polymorphic-parity.test.tsx` — P4 and P17 test groups. P17c specifically exercises the double-wrap chain.

### `INTENTIONAL` findings

P1 (forwardRef wrap), P3 (undefined filter), P8 (`as` vs `component`), P9 (no renderRoot), P12 (no createPolymorphicComponent), P13 (higher-level constructor), P14 (as-unwrap centralized), P15 (classes static), P18 (defaultElement), P19 (TOKEN_DIFF: defaultComponent→defaultElement) are all deliberate divergences from Mantine. The relevant ledger entries already exist for P1, P3, P8, P11. New ledger entries are added for P12, P13, P14, P15, P18, P19 which are not yet documented.

### No `BUG` / `HALLUCINATION` / `HOOK_REIMPL` findings

The single `INCONSISTENCY` class (P4/P17/P20) is the only code-level finding. `makeWithProps` missing the extend-propagation is the same root cause as factory.tsx B4, fixed in the same file.
