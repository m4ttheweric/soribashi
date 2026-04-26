# Tier 1 Audit — packages/factory/src/factory.tsx

**Pinned to:** `mantinedev/mantine@63dafbbf5f0135eb36455b7add4c0ddcd0f3240a`
**Mantine source:** `packages/@mantine/core/src/core/factory/factory.tsx`
**Soribashi source:** `packages/factory/src/factory.tsx`
**Audit date:** 2026-04-25

---

## Decision-point enumeration

| # | Mantine line(s) | Decision / branch | Soribashi behavior | Classification |
|---|---|---|---|---|
| B1 | factory.tsx:84–97 | `factory(ui)` casts `ui` to `any` directly (`const Component = ui as any`); no `forwardRef` wrap; render signature is `(props: Payload['props'] & { ref? })` | Wraps in `React.forwardRef`; render signature is `(props, ref) => ReactNode` | `INTENTIONAL` (already in ledger) |
| B2 | factory.tsx:89–93 | `withProps(fixedProps)` inlines `(props) => <Component {...fixedProps} {...props} />`; no `undefined` filtering; instance `undefined` overrides preset | `makeWithProps` from `with-props.tsx` iterates instance props and skips `undefined` entries; presets win over explicit-`undefined` instance props | `INTENTIONAL` (already in ledger — "factory.withProps — filters undefined from instance props") |
| B3 | factory.tsx:88 | `Component.extend = identity` assigned | `Component.extend = identity` assigned | `IDENTICAL` |
| B4 | factory.tsx:91 | `Extended.extend = Component.extend` — the result of `withProps()` also has `extend` copied from the parent component | `makeWithProps` returns a `Wrapped` (forwardRef) with no `extend` property | `INCONSISTENCY` (withProps result missing extend — see Findings) |
| B5 | factory.tsx:92 | `Extended.displayName = \`WithProps(${Component.displayName})\`` | `makeWithProps` sets `Wrapped.displayName = \`WithProps(${Base.displayName ?? Base.name ?? 'Component'})\`` | `IDENTICAL` (same string; soribashi also handles unnamed components with a fallback) |
| B6 | factory.tsx:80–82 | `identity<T>(value: T): T` is exported | `identity` is defined as a private const, not exported | `INTENTIONAL` (soribashi's `identity` is an implementation detail; no consumer needs it directly) |
| B7 | factory.tsx:84–97 | `MantineComponent<Payload>` return type — rich type including `ThemeExtend`, `ComponentClasses`, `StaticComponents`, `ComponentVariablesResolver`, polymorphic props | `FactoryComponent<P>` — simpler type: `ComponentType<P['props'] & { ref? }>` + `.extend` + `.withProps` + `.classes` + `.displayName` | `INTENTIONAL` (soribashi omits compound/polymorphic/static-component slots from the base factory type; those are handled by dedicated typed wrappers) |
| B8 | factory.tsx:99–101 | `genericFactory<Payload>(ui)` exported from this file | Soribashi's `genericFactory` equivalent lives in `packages/factory/src/define-generic-component.tsx` (separate file) | `INTENTIONAL` (soribashi separates concerns into dedicated files; the auditable behavior matches — see Task 1.3) |
| B9 | factory.tsx:4 | `DataAttributes = Record<\`data-${string}\`, any>` defined and used in `ExtendCompoundComponent` and `ExtendsRootComponent` | No `DataAttributes` type in soribashi's `factory.tsx` | `INTENTIONAL` (soribashi's extend is identity; no compound/extend config shape needed in factory.tsx) |
| B10 | factory.tsx:60–66 | `FactoryComponentWithProps<Payload>` types `withProps` return as `React.NamedExoticComponent<Payload['props'] & React.RefAttributes<Payload['ref']> & PlaceholderPolymorphicProps>` | `FactoryComponent<P>` types `withProps` as returning `ComponentType<P['props']>` | `INTENTIONAL` (soribashi type is simpler; no `PlaceholderPolymorphicProps` because soribashi doesn't have `component` / `renderRoot` escape hatches on base factory) |

---

## Findings

### `INCONSISTENCY` findings

#### B4 — `withProps()` result does not propagate `extend`

- **File:Line:** `packages/factory/src/with-props.tsx` — `makeWithProps` return value
- **Mantine behavior:** The component created by `withProps` gets `Extended.extend = Component.extend` (factory.tsx line 91). This allows callers to chain `Button.withProps({...}).extend({...})` for further theme customization.
- **Soribashi behavior:** `makeWithProps` returns a `forwardRef`-wrapped component. The returned `Wrapped` function does not have an `extend` property.
- **Observable consequence:** Calling `.extend` on a `withProps()` result throws at runtime (`TypeError: (...).extend is not a function`). In Mantine this succeeds (returns the config, since `identity`).
- **Classification:** `INCONSISTENCY` — `factory()` itself has `extend`, but `makeWithProps` (called by `factory.withProps`) produces a component without `extend`. The factory's own `.extend` is present, but the `.withProps()` result's `.extend` is absent.
- **Fix:** Add `Wrapped.extend = (Base as any).extend ?? identity` in `makeWithProps`. **TDD:** see `factory-parity.test.tsx` B4 test.

### `INTENTIONAL` findings

All INTENTIONAL findings (B1, B2, B6, B7, B8, B9, B10) are either already in the ledger or are scope-related (soribashi deliberately uses a different file structure or simpler type shape). No new ledger entries required for B6–B10 because they are architectural scope differences, not behavioral divergences. B1 and B2 are already ledger-documented.

### No `BUG` / `HALLUCINATION` / `HOOK_REIMPL` findings

The single `INCONSISTENCY` (B4) is the only code-level finding requiring a fix.
