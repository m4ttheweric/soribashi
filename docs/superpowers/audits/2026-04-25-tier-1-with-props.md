# Tier 1 Audit — packages/factory/src/with-props.tsx

**Pinned to:** `mantinedev/mantine@63dafbbf5f0135eb36455b7add4c0ddcd0f3240a`
**Mantine source:** `packages/@mantine/core/src/core/factory/factory.tsx` (inline `withProps` at lines 89–94); also `packages/@mantine/core/src/core/factory/polymorphic-factory.tsx` (inline `withProps` at lines 42–47)
**Soribashi source:** `packages/factory/src/with-props.tsx`
**Audit date:** 2026-04-25

`with-props.tsx` exports a single function `makeWithProps` that is the shared implementation backing every `component.withProps(presets)` call in soribashi — for components created via `factory()`, `polymorphicComponent()`, `definePolymorphicComponent()`, and `defineGenericComponent()`. It was the subject of fixes in Tasks 1.1, 1.2, and 1.3; this task is a confirmatory final read.

**Companion files / sites checked:**

- `packages/@mantine/core/src/core/factory/factory.tsx` lines 89–94 — `factory()` inline `withProps` + `createWithProps` (no separate file in Mantine; the withProps logic lives inline)
- `packages/@mantine/core/src/core/factory/polymorphic-factory.tsx` lines 42–47 — `polymorphicFactory()` inline `withProps` (same pattern, slightly different type context)
- Existing ledger entries in `docs/superpowers/divergences/mantine-master.md` § "Full audit pass — 2026-04-25": `makeWithProps — extend+withProps propagation` and `makeWithProps — stacks wrappers vs Mantine sharing the base`

---

## Mantine's `withProps` — source summary

In Mantine, `withProps` is NOT a separate exported utility. It appears in two places:

### `factory.tsx` lines 89–94

```ts
Component.withProps = (fixedProps: any) => {
  const Extended = (props: any) => <Component {...fixedProps} {...props} />;
  Extended.extend = Component.extend;
  Extended.displayName = `WithProps(${Component.displayName})`;
  return Extended;
};
```

Note: at line 90 Mantine also attaches `Extended.withProps = createWithProps(Component)` (shown in the plan — however re-reading the pinned source, the actual content is as above; `createWithProps` does not appear as a named function at this commit). The inline closure IS the withProps implementation.

### `polymorphic-factory.tsx` lines 42–47

```ts
Component.withProps = (fixedProps: any) => {
  const Extended = (props: any) => <Component {...fixedProps} {...props} />;
  Extended.extend = Component.extend;
  Extended.displayName = `WithProps(${Component.displayName})`;
  return Extended;
};
```

Identical pattern. Neither version uses `forwardRef`. Neither version re-attaches `withProps` to `Extended`.

---

## Decision-point enumeration

| # | Mantine line(s) | Decision / branch | Soribashi behavior | Classification |
|---|---|---|---|---|
| W1 | factory.tsx:89–94, polymorphic-factory.tsx:42–47 | `Extended` is a plain arrow function `(props: any) => <Component .../>`. No `forwardRef`. No separate `ref` parameter. | `makeWithProps` wraps with `React.forwardRef((props, ref) => ...)`. `ref` is explicitly forwarded to `<Component ref={ref} {...merged} />`. | `INTENTIONAL` — consequence of soribashi's forwardRef wrap on all factory components (already in ledger under "factory() — wraps render in forwardRef"); see also ledger entry for polymorphicFactory. |
| W2 | factory.tsx:90 `<Component {...fixedProps} {...props} />` | Mantine spreads instance props last: `{...fixedProps, ...props}`. Any key present in `props`, including `undefined`-valued keys, overrides the corresponding preset. | `makeWithProps` filters `undefined` from instance props before merge: `if (props[key] !== undefined) merged[key] = props[key]`. Presets survive when instance prop is explicitly `undefined`. | `INTENTIONAL` — already in ledger as "factory.withProps — filters undefined from instance props". Soribashi intentionally makes `withProps` consistent with `useProps` semantics. |
| W3 | factory.tsx:90 `{...fixedProps, ...props}` | Merge order: presets first, then instance props. Instance props win for non-undefined keys. | Same merge order: `merged = { ...presets }`, then instance keys written in if not undefined. Presets first, instance wins (for non-undefined values). | `IDENTICAL` |
| W4 | factory.tsx:91 `Extended.extend = Component.extend` | Copies `extend` from `Component` to `Extended`. | `if ((Base as any).extend !== undefined) { (Wrapped as any).extend = (Base as any).extend; }`. Copies `extend` when present. | `IDENTICAL` (fixed in Tasks 1.1/1.2/1.3; see ledger entry "makeWithProps — extend+withProps propagation") |
| W5 | factory.tsx:92 `Extended.displayName = \`WithProps(${Component.displayName})\`` | `WithProps(` + `Component.displayName` + `)`. No fallback if `displayName` is undefined. | `\`WithProps(${(Base as any).displayName ?? Base.name ?? 'Component'})\`` — adds fallback chain: `displayName` → `name` → `'Component'`. | `IDENTICAL` for the common case; soribashi adds robustness for unnamed components. The fallback is additive, not divergent. |
| W6 | factory.tsx (no line) | Mantine's inline `withProps` does NOT re-attach `withProps` to `Extended`. A second `.withProps()` call on the result would fail at runtime (TypeError: Extended.withProps is not a function). | `(Wrapped as any).withProps = makeWithProps(Wrapped as any)` — unconditionally re-attaches, enabling double-wrap chains. | `INTENTIONAL` — already in ledger as "makeWithProps — stacks wrappers vs Mantine sharing the base". This is a soribashi improvement: Mantine's inline version silently doesn't support chaining, while soribashi does. |
| W7 | polymorphic-factory.tsx:42–47 (same as W1–W6) | Polymorphic factory's inline `withProps` has identical structure to `factory.tsx`'s version. Both have the same forwardRef-absent, undefined-pass-through, no-chaining characteristics. | `makeWithProps` is the SAME function used for all four callers: `factory.withProps`, `polymorphicComponent.withProps`, `definePolymorphicComponent.withProps`, `defineGenericComponent.withProps`. | `INTENTIONAL` — soribashi unifies what Mantine duplicates. Equivalent behavior after the W1/W4/W6 fixes. |
| W8 | factory.tsx:89 signature `(fixedProps: any)` | `withProps` accepts `fixedProps: any`. No type constraint at the implementation level (typing is in `FactoryComponentWithProps<Payload>`). | `withProps(presets: Partial<TProps>): ComponentType<TProps>` — typed, constraining presets to a partial of the component's prop type. | `INTENTIONAL` — soribashi's typing is stricter and more ergonomic. Type-level only; runtime behavior is identical (`as any` casts internally). |
| W9 | (no Mantine analog) | Mantine does not export a standalone `makeWithProps` / `createWithProps` utility. `withProps` is always inline inside `factory()` / `polymorphicFactory()`. | Soribashi exports `makeWithProps` as a standalone function from `with-props.tsx`, used by all four factory variants. | `INTENTIONAL` — soribashi consolidation avoids code duplication. No observable behavioral divergence. |
| W10 | (class-name merging) | Mantine's `withProps` does not perform class-name concatenation. `className` from preset is overridden by `className` from instance if both are present. | Soribashi's `makeWithProps` does not perform class-name concatenation either. Same semantics: instance `className` (if defined) overrides preset `className`; preset `className` wins when instance `className` is `undefined`. | `IDENTICAL` |
| W11 | (style merging) | Mantine's `withProps` does not perform deep style merging. `style` from preset is overridden by `style` from instance if both are present. | Soribashi's `makeWithProps` does not perform deep style merging. Same semantics: instance `style` (if defined) overrides preset `style`; preset `style` wins when instance `style` is `undefined`. | `IDENTICAL` |
| W12 | (type signature) | `FactoryComponentWithProps<Payload>.withProps` returns `React.NamedExoticComponent<...>`. No chaining type (result lacks `withProps`). | `makeWithProps` returns `ComponentType<TProps>`. The result has `withProps` at runtime (W6) but the static type does not expose it — callers need `as any` for chaining. | `INTENTIONAL` — type-level gap; soribashi's type is simpler. Runtime behavior is correct (chaining works). |

---

## Findings

### No new `BUG`, `HALLUCINATION`, `INCONSISTENCY`, or `HOOK_REIMPL` findings

All decision points map to prior findings. The three `INCONSISTENCY` items (W4, W6) were fixed in Tasks 1.1/1.2/1.3 and covered by existing ledger entries. No new bugs found in the final confirmatory read.

### `INTENTIONAL` findings (all pre-existing in ledger)

The following decision points correspond to existing ledger entries — no new entries needed:

| Decision point | Ledger entry |
|---|---|
| W1 (forwardRef wrap) | "factory() — wraps render in forwardRef" + "polymorphicFactory() — wraps render in forwardRef" |
| W2 (undefined filter) | "factory.withProps — filters undefined from instance props" |
| W4 (extend propagation, fixed) | "makeWithProps — extend+withProps propagation" (INCONSISTENCY → aligned) |
| W6 (withProps chaining, fixed) | "makeWithProps — extend+withProps propagation" (same ledger entry covers both extend and withProps re-attachment) |
| W7 (unified shared helper vs Mantine duplication) | Covered by the same entry — soribashi uses one function for all callers |
| W12 (type signature) | No separate entry needed; covered by the overall constructor-model / forwardRef divergence |

### `INTENTIONAL` findings requiring **new** ledger entries

None. All decision points in `with-props.tsx` are covered by pre-existing ledger entries from Tasks 1.1, 1.2, and 1.3. This confirmatory audit finds no new divergences.

---

## Post-fix state

After Tasks 1.1–1.3, `packages/factory/src/with-props.tsx` is 37 lines long and implements:

1. **Preset merge** — `{ ...presets }` base, then instance keys written in if not `undefined` (W2/W3).
2. **forwardRef wrap** — `React.forwardRef((props, ref) => ...)` with `ref` forwarded to `<Component>` (W1).
3. **`extend` propagation** — copied from `Base` to `Wrapped` when present (W4).
4. **`withProps` re-attachment** — `makeWithProps(Wrapped)` unconditionally on the result (W6).
5. **`displayName`** — `WithProps(<name>)` with fallback chain (W5).

All decision branches are exercised by parity tests in `packages/factory/test/with-props-parity.test.tsx`.
