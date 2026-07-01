# Wave 4A: Generic Builder Substrate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade `@soribashi/factory`'s `defineGenericComponent` so a recipe author supplies a generic *signature* type and the returned component carries exactly that signature (real call-site inference), mirroring Mantine's `genericFactory`. This is the substrate half of Wave 4 (Select); PR B consumes it.

**Architecture:** A type-only change. The runtime implementation of `defineGenericComponent` is unchanged (props handled untyped internally). Today it returns the fixed lossy `GenericComponentFn` (`<T>(props: any)`); after this change it returns `TSignature & GenericComponentStatics<TSignature>`, where `TSignature` is the author-supplied generic call signature (default `GenericComponentFn` for back-compat). All safety lives at the call site through `TSignature`.

**Tech Stack:** TypeScript, React 18, Vitest, Bun. Reference: Mantine `core/factory/factory.tsx` (`genericFactory`, `FactoryPayload.signature`).

---

## Spec reference

`docs/superpowers/specs/2026-06-08-wave-4-select-pilot-design.md` section 4 (substrate upgrade) and section 4.4 (substrate proof). This plan is PR A from section 9. PR B (the Select pilot) gets its own plan after this lands.

## Background the implementer needs

- `defineGenericComponent` lives in `packages/factory/src/define-generic-component.tsx` and is currently `@deprecated` with no real consumers.
- Its runtime body wires `useProps` + `useStyles` + `autoVars` + `validateVocabularyProps`, attaches `extend` / `withProps` / `classes` statics, and wraps in `forwardRef`. **None of that runtime behavior changes in this PR.**
- Its parity tests (`packages/factory/test/generic-parity.test.tsx`, groups G1-G13) assert that runtime behavior against Mantine's `genericFactory`. They must keep passing. Because they pass a *props template* (`defineGenericComponent<ItemProps<any>>`) as the type argument, and the type argument now means *signature*, those call sites need a mechanical migration to the new form (Task 3).
- Mantine's mechanism (verified):
  ```ts
  export function genericFactory<Payload extends FactoryPayload>(ui: Payload['signature']) {
    return factory(ui as any) as Payload['signature'] & MantineComponentStaticProperties<Payload>;
  }
  ```
  soribashi's analog: the type argument is the signature directly (no `FactoryPayload` wrapper), defaulting to `GenericComponentFn`.

## Baseline (run once before Task 1)

- [ ] **Confirm green baseline**

Run:
```bash
bun install
bun run typecheck
bun run --filter '@soribashi/factory' test
```
Expected: typecheck clean; factory 472 passed. If red, stop and fix before starting.

---

## Task 1: De-risk the signature-carrying + `const` inference mechanics (prototype, no repo edit)

This validates the type mechanics in isolation before touching the real builder, exactly as the PR #11 vocab-threading was prototyped. No commit; it is a gate.

**Files:**
- Create (temporary, deleted at end of task): `/tmp/generic-sig-proto.ts`

- [ ] **Step 1: Write the prototype**

```ts
// /tmp/generic-sig-proto.ts. Proves TSignature & statics carries real inference,
// and a `<const V>` signature narrows from a data prop. Self-contained (no imports).
type ReactElementLike = { __brand: 'el' } | null;

interface GenericStatics<TSignature> {
  extend: (cfg: unknown) => unknown;
  withProps: (presets: Record<string, unknown>) => TSignature & GenericStatics<TSignature>;
  displayName?: string;
}
type DefaultGenericFn = <T>(props: { items: T[] }) => ReactElementLike;

declare function defineGenericComponent<TSignature = DefaultGenericFn>(
  config: { name: string },
): TSignature & GenericStatics<TSignature>;

// --- consumer: a Select-like generic over a primitive Value, narrowing from data ---
type Primitive = string | number | boolean;
interface Item<V extends Primitive> { value: V; label: string }
interface SingleProps<V extends Primitive> { data: (V | Item<V>)[]; multiple?: false; onChange?: (v: V | null) => void }
interface MultiProps<V extends Primitive>  { data: (V | Item<V>)[]; multiple: true;  onChange?: (v: V[]) => void }
type SelectSignature = <const V extends Primitive = string>(props: SingleProps<V> | MultiProps<V>) => ReactElementLike;

const Select = defineGenericComponent<SelectSignature>({ name: 'Select' });

// POSITIVE: Value narrows to the data literal union; onChange typed accordingly
Select({ data: [{ value: 'sm', label: 'S' }, { value: 'md', label: 'M' }], onChange: (v) => { const ok: 'sm' | 'md' | null = v; void ok; } });
Select({ data: ['a', 'b'], multiple: true, onChange: (v) => { const ok: ('a' | 'b')[] = v; void ok; } });

// NEGATIVE: out-of-union value rejected
// @ts-expect-error: 'lg' is not in the data union 'sm' | 'md'
Select<'sm' | 'md'>({ data: [], onChange: (v) => { const bad: 'sm' | 'md' | null = v; void bad; }, value: 'lg' } as any);

// withProps preserves the generic signature
const Styled = Select.withProps({});
Styled({ data: [{ value: 1, label: 'one' }], onChange: (v) => { const ok: 1 | null = v; void ok; } });
export { Select, Styled };
```

- [ ] **Step 2: Typecheck the prototype in isolation**

Run:
```bash
cd /tmp && bunx tsc --noEmit --strict --skipLibCheck --target es2020 generic-sig-proto.ts; echo "EXIT: $?"
```
Expected: `EXIT: 0`. Exit 0 with the `@ts-expect-error` present means the positives compiled AND the negative genuinely errored (an unused directive would fail the build).

- [ ] **Step 3: Confirm the negative has teeth**

Run:
```bash
cd /tmp && sed '/@ts-expect-error/d' generic-sig-proto.ts > generic-sig-proto-neg.ts && bunx tsc --noEmit --strict --skipLibCheck --target es2020 generic-sig-proto-neg.ts 2>&1 | grep -c "error TS"
```
Expected: `1` (exactly the one stripped negative now errors). If `0`, the `const V` narrowing is not working as designed. STOP and report; the spec section 5.2 assumption needs revisiting before proceeding.

- [ ] **Step 4: Clean up**

Run:
```bash
rm -f /tmp/generic-sig-proto.ts /tmp/generic-sig-proto-neg.ts
```
No commit (prototype only). If Steps 2-3 passed, the mechanics are validated; proceed.

---

## Task 2: Upgrade `defineGenericComponent` to carry a signature

**Files:**
- Modify: `packages/factory/src/define-generic-component.tsx`
- Test: `packages/factory/test/generic-signature.test.tsx` (create)

- [ ] **Step 1: Write the failing type-level test**

Create `packages/factory/test/generic-signature.test.tsx`:

```tsx
/**
 * Type-level proof that defineGenericComponent carries an author-supplied generic
 * signature with real call-site inference (Mantine genericFactory parity).
 * Enforced by `bun run typecheck` (this file is in the root tsconfig). The one
 * runtime `it` exists so vitest does not error on an empty suite; the real
 * assertions are the @ts-expect-error directives, checked at compile time.
 */
import { describe, expect, it } from 'vitest';
import { defineGenericComponent } from '../src/define-generic-component.tsx';

type Primitive = string | number | boolean;
interface Item<V extends Primitive> { value: V; label: string }
interface PickProps<V extends Primitive> { data: (V | Item<V>)[]; onPick?: (v: V) => void }
type PickSignature = <const V extends Primitive = string>(props: PickProps<V>) => React.ReactElement | null;

const Pick = defineGenericComponent<PickSignature>({
  name: 'Pick',
  selectors: ['root'] as const,
  render: ({ props, getStyles, ref }: any) => <ul ref={ref} {...getStyles('root')} data-n={props.data.length} />,
});

describe('defineGenericComponent generic signature inference', () => {
  it('narrows the type parameter from the data prop at the call site', () => {
    // POSITIVE: V narrows to 'sm' | 'md'; onPick arg is that union
    void (<Pick data={[{ value: 'sm', label: 'S' }, { value: 'md', label: 'M' }]} onPick={(v) => { const ok: 'sm' | 'md' = v; void ok; }} />);
    // @ts-expect-error: 'lg' is not in the data union 'sm' | 'md'
    void (<Pick data={[{ value: 'sm', label: 'S' }]} onPick={(v: 'lg') => void v} />);
    // withProps preserves the generic signature
    const Styled = Pick.withProps({});
    void (<Styled data={[{ value: 1, label: 'one' }]} onPick={(v) => { const ok: 1 = v; void ok; }} />);
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 2: Run it and watch it FAIL (typecheck)**

Run:
```bash
bun run typecheck 2>&1 | grep "generic-signature"
```
Expected: errors. With today's builder, `defineGenericComponent<PickSignature>` treats `PickSignature` as the old `TOwnPropsTemplate` (used only by `extend`), and the returned component is `GenericComponentFn` (`<T>(props: any)`), so `Pick`'s props are `any`: the `@ts-expect-error` on the `'lg'` line has no error beneath it and fails as TS2578 "unused directive", and/or `onPick`'s `v` is `any` (the positive `const ok: 'sm' | 'md' = v` would not narrow). Either way typecheck is RED here.

(Vitest itself will pass, since it does not typecheck, so the gate for this task is `bun run typecheck`, not the test runner.)

- [ ] **Step 3: Upgrade the builder types**

In `packages/factory/src/define-generic-component.tsx`, replace the `GenericComponentStatics` interface and the `defineGenericComponent` signature. Keep the ENTIRE function body unchanged; only the type annotations on the statics interface, the function's generic parameter, and the return cast change.

Replace this block:

```ts
export interface GenericComponentStatics {
  extend: (cfg: ComponentExtendConfig<any>) => ThemeComponentEntry<any>;
  withProps: (presets: any) => GenericComponentFn & GenericComponentStatics;
  classes?: Record<string, string>;
  displayName?: string;
}
```

with:

```ts
export interface GenericComponentStatics<TSignature = GenericComponentFn> {
  extend: (cfg: ComponentExtendConfig<any>) => ThemeComponentEntry<any>;
  /** Preserves the generic signature on the partially-applied component. */
  withProps: (presets: Record<string, unknown>) => TSignature & GenericComponentStatics<TSignature>;
  classes?: Record<string, string>;
  displayName?: string;
}
```

Replace the function signature line:

```ts
export function defineGenericComponent<TOwnPropsTemplate>(
  config: DefineGenericComponentConfig,
): GenericComponentFn & GenericComponentStatics {
```

with (the type argument is now the author-supplied SIGNATURE, defaulting to the old lossy fn for back-compat):

```ts
export function defineGenericComponent<TSignature = GenericComponentFn>(
  config: DefineGenericComponentConfig,
): TSignature & GenericComponentStatics<TSignature> {
```

Replace the `extend` static's inner cast (it referenced the old `TOwnPropsTemplate`):

```ts
  (Component as any).extend = (
    extendConfig: ComponentExtendConfig<TOwnPropsTemplate>,
  ): ThemeComponentEntry<TOwnPropsTemplate> => ({
```

with (the props template is no longer a separate type param; use `any`; `.extend` typing for generic recipes is out of scope, runtime unchanged):

```ts
  (Component as any).extend = (
    extendConfig: ComponentExtendConfig<any>,
  ): ThemeComponentEntry<any> => ({
```

Replace the final return cast:

```ts
  return Component as unknown as GenericComponentFn & GenericComponentStatics;
}
```

with:

```ts
  return Component as unknown as TSignature & GenericComponentStatics<TSignature>;
}
```

Also remove the `@deprecated` tag from the doc comment (the builder now has a real consumer) and update the comment's last line. Change:

```ts
 * returns a component that's still generic; you can still write `<Result<User> ...>`.
 *
 * @deprecated — no current consumers; will be removed in a future release if no use case emerges.
 */
```

to:

```ts
 * returns a component that's still generic; you can still write `<Result<User> ...>`.
 *
 * The type argument is the author-supplied generic call SIGNATURE (mirrors
 * Mantine's `genericFactory<Payload>(ui: Payload['signature'])`). It defaults to
 * `GenericComponentFn` for callers that do not need inference. Runtime behavior
 * is identical regardless of the signature; all safety is at the call site.
 */
```

- [ ] **Step 4: Run typecheck and the test, now passes**

Run:
```bash
bun run typecheck 2>&1 | grep "generic-signature" || echo "no generic-signature errors"
bun run --filter '@soribashi/factory' test 2>&1 | grep -E "generic-signature|Tests "
```
Expected: no `generic-signature` typecheck errors; the new test's single `it` passes. `Value` now narrows from `data` and the `@ts-expect-error` matches a real error.

- [ ] **Step 5: Commit**

```bash
git add packages/factory/src/define-generic-component.tsx packages/factory/test/generic-signature.test.tsx
git commit -m "$(cat <<'EOF'
feat(factory): defineGenericComponent carries an author-supplied generic signature

The type argument is now the generic call signature (default GenericComponentFn),
so the returned component infers at the call site, mirroring Mantine's
genericFactory<Payload>(ui: Payload['signature']). Runtime is unchanged; the
@deprecated tag is removed. Compile-time test proves Value narrows from a data prop.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Migrate the existing parity tests to the signature form

The G1-G13 parity tests pass a props template (`defineGenericComponent<ItemProps<any>>`); under the new meaning that type argument is a *signature*, so `Select`'s type would become non-callable and the `<Select<User> ...>` JSX would fail to typecheck. The runtime is unchanged, so only the type-argument form needs migrating. The same applies to `with-props-parity.test.tsx`.

**Files:**
- Modify: `packages/factory/test/generic-parity.test.tsx`
- Modify: `packages/factory/test/with-props-parity.test.tsx`

- [ ] **Step 1: See the failure**

Run:
```bash
bun run typecheck 2>&1 | grep -E "generic-parity|with-props-parity" | head
```
Expected: type errors in both files at the `defineGenericComponent<ItemProps<any>>` definition and/or the `<Select<User> ...>` call sites (the component is no longer generic-callable with a props template as the type arg).

- [ ] **Step 2: Migrate `generic-parity.test.tsx`'s `Select` definition**

Replace:

```ts
const Select = defineGenericComponent<ItemProps<any>>({
```

with a real signature type (declared just above the definition):

```ts
type SelectSignature = <T>(props: ItemProps<T> & React.RefAttributes<unknown>) => React.ReactElement | null;
const Select = defineGenericComponent<SelectSignature>({
```

The existing `<Select<User> ...>` / `<Select<Fruit> ...>` JSX call sites now typecheck unchanged (the signature is generic over `T`). Leave every runtime assertion and the `render` body exactly as-is. Note: test G8's comment about `GenericComponentFn` is now slightly stale but its runtime assertions still hold; leave the assertions, no comment edit required.

- [ ] **Step 3: Migrate `with-props-parity.test.tsx` the same way**

Run first to see its exact `defineGenericComponent` usage:
```bash
grep -n "defineGenericComponent" packages/factory/test/with-props-parity.test.tsx
```
For each `defineGenericComponent<SomePropsTemplate>({ ... })`, introduce a `type XSignature = <T>(props: SomePropsTemplate<T> & React.RefAttributes<unknown>) => React.ReactElement | null;` above it and pass `<XSignature>`. If a usage is non-generic (a fixed props type with no `<T>`), use `type XSignature = (props: TheProps & React.RefAttributes<unknown>) => React.ReactElement | null;` (no `<T>`). Leave all runtime assertions unchanged.

- [ ] **Step 4: Verify typecheck + both suites pass**

Run:
```bash
bun run typecheck 2>&1 | grep -E "generic-parity|with-props-parity" || echo "clean"
bun run --filter '@soribashi/factory' test 2>&1 | grep -E "Tests |Exited with code"
```
Expected: no typecheck errors in those files; factory tests still at their full count (472 + the 1 new from Task 2 = 473).

- [ ] **Step 5: Commit**

```bash
git add packages/factory/test/generic-parity.test.tsx packages/factory/test/with-props-parity.test.tsx
git commit -m "$(cat <<'EOF'
test(factory): migrate generic parity tests to the signature form

defineGenericComponent's type argument is now the generic signature, so the
parity tests pass a `<T>(props) => ReactElement` signature instead of a props
template. Runtime assertions (G1-G13) are unchanged.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Whole-repo typecheck + all suites**

Run:
```bash
bun run typecheck && echo "typecheck PASS"
bun run --filter '@soribashi/*' test 2>&1 | grep -E "Tests |Exited with code"
(cd apps/pilot && bunx vitest run --reporter=basic 2>&1 | grep -E "Test Files|Tests ")
```
Expected: typecheck PASS; theme 82, codegen 137, factory 473 (472 + the new signature test), blocks 244; pilot 52 (unchanged; PR A touches only the factory). No pre-existing test broken.

- [ ] **Step 2: Confirm no `@deprecated` remains on the builder**

Run:
```bash
grep -n "@deprecated" packages/factory/src/define-generic-component.tsx || echo "deprecation removed"
```
Expected: `deprecation removed`.

---

## Self-review checklist (run after all tasks)

- [ ] **Spec coverage:** section 4 (signature upgrade) → Task 2; section 4.4 (substrate proof via tiny demo + type tests) → Task 2's `generic-signature.test.tsx`; back-compat for existing consumers → Task 3. PR B (Select pilot) is intentionally a separate plan.
- [ ] **Type-only change:** `git diff` on `define-generic-component.tsx` shows only the statics interface, the function generic parameter/return, the `extend` inner cast, and the doc comment changed, with no runtime body lines.
- [ ] **Counts:** factory 472 → 473; theme/codegen/blocks/pilot unchanged.
- [ ] **No placeholders;** every step has real code or a real command.

## Done =

Typecheck clean; factory 473; all other suites unchanged; `@deprecated` gone; the compile-time inference test proves `Value` narrows from `data`. Then: `superpowers:finishing-a-development-branch` → push → PR A. PR B (Select pilot: floating-ui + useCombobox + Field + Select recipe) gets its own plan written against the now-shipped builder.
