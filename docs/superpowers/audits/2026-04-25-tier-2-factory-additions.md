# Tier 2 Audit — Batch T2-C: Factory Soribashi Additions

**Pinned to:** `mantinedev/mantine@63dafbbf5f0135eb36455b7add4c0ddcd0f3240a`

**Batch:** T2-C — Factory soribashi-additions

**Soribashi files:**
- `packages/factory/src/auto-vars.ts`
- `packages/factory/src/define-component.tsx`
- `packages/factory/src/cn.ts`
- `packages/factory/src/create-vars-resolver.ts`

**Mantine source (where applicable):**
- `auto-vars.ts`: no analog
- `define-component.tsx`: composes `factory()` + `useProps` + `useStyles`; no direct analog; closest upstream patterns are `factory()` (already audited in Task 1.1) and the manual hook calls components make internally
- `cn.ts`: Mantine uses `clsx` directly (no `tailwind-merge`)
- `create-vars-resolver.ts`: `packages/@mantine/core/src/core/styles-api/create-vars-resolver/create-vars-resolver.ts` (commit 63dafbbf)

---

## File 1: `packages/factory/src/auto-vars.ts`

### Classification: SORIBASHI_ADDITION

### What it does

`autoVars(theme, componentName, props, hasVariants)` is a quality-of-life helper that
auto-derives root-selector CSS custom properties from the theme's `intentResolver` for
components that declare variants.  When a component declares `variants` but the author
does not supply an explicit `config.vars` resolver, `defineComponent` calls `autoVars` to
produce CSS vars that fill the standard intent-driven slots:

| Var name template | Source |
|---|---|
| `--{lowercased-name}-bg` | `intentResolver.background` |
| `--{lowercased-name}-color` | `intentResolver.color` |
| `--{lowercased-name}-border` | `intentResolver.border` |
| `--{lowercased-name}-hover` | `intentResolver.hover` (conditional) |
| `--{lowercased-name}-active` | `intentResolver.active` (conditional) |
| `--{lowercased-name}-hover-color` | `intentResolver.hoverColor` (conditional) |

Three conditions must all be true before any vars are produced:
1. `hasVariants === true` (the component opts in by declaring `variants`)
2. `props.intent` is defined and truthy
3. `props.variant` is defined and truthy

If any condition fails, the function returns `{}` (empty — no `root` key), which causes
`useStyles` to skip the CSS-var injection entirely.

### Why Mantine does not have an equivalent

Mantine's `factory(ui)` is a low-level type-cast; component authors call `createVarsResolver`
and write their own vars resolver inline.  The resolver always requires an explicit
implementation — there is no auto-derivation path.  Mantine's approach is more flexible
(any component can override any CSS variable for any selector) but more verbose for the
common intent/variant case.

Soribashi adds `autoVars` because the intent/variant pattern is the dominant theming
mechanism — virtually every interactive component (`Button`, `Badge`, etc.) maps to one of
the five standard variants (`filled`, `outline`, `subtle`, `ghost`, `link`).  Writing a
manual vars resolver for this pattern is boilerplate that `autoVars` eliminates.

### Decision-point enumeration

| # | Decision | Soribashi behavior | Classification |
|---|---|---|---|
| AV-1 | Guard on `hasVariants` | Returns `{}` immediately when false | SORIBASHI_ADDITION |
| AV-2 | Guard on `intent` and `variant` | Returns `{}` when either is falsy | SORIBASHI_ADDITION |
| AV-3 | Calls `theme.intentResolver` | Single call with `{ intent, variant, theme }` | SORIBASHI_ADDITION |
| AV-4 | Prefix derivation | `componentName.toLowerCase()` — e.g., `IconButton` → `iconbutton` | SORIBASHI_ADDITION |
| AV-5 | Required vars | Always includes `bg`, `color`, `border` | SORIBASHI_ADDITION |
| AV-6 | Conditional vars | `hover`, `active`, `hoverColor` only when `result[key] !== undefined` | SORIBASHI_ADDITION |
| AV-7 | Return shape | `{ root: Record<string, string> }` (always the `root` selector) | SORIBASHI_ADDITION |

### Findings

No bugs. No Mantine analog. All logic is intentional soribashi-specific design.

### Justification summary

`auto-vars.ts` provides a zero-configuration default for the dominant intent/variant
theming pattern.  It wraps the theme's `intentResolver` (itself a Mantine-analog for
`defaultVariantColorsResolver`) and produces a standard set of CSS custom properties
under the `root` selector.  Mantine requires every component to author its own
`varsResolver` explicitly; soribashi provides this as an opt-in default to eliminate
boilerplate for the common case.  Components with non-standard var needs can still supply
`config.vars` in `defineComponent` to override this default entirely.

---

## File 2: `packages/factory/src/define-component.tsx`

### Classification: SORIBASHI_ADDITION (with INTENTIONAL composition divergences from Mantine's lower-level primitives)

### What it does

`defineComponent(config)` is soribashi's primary component-authoring API.  It integrates
four lower-level primitives inside a single `React.forwardRef` wrapper:

1. `useProps` — merges component defaults, theme component defaults, and instance props
2. `autoVars` (or `config.vars`) — produces CSS custom properties via the intent resolver
3. `useStyles` — resolves class names, styles, and attributes across the layering hierarchy
4. `config.render` — calls the author's render function with a clean, fully-resolved context

The component produced by `defineComponent` is a `React.ForwardRefExoticComponent` with
three static properties:
- `displayName` — set to `config.name`
- `classes` — the static CSS class name map from `config.classes`
- `extend` — identity function (theme-level override hook; same pattern as `factory.extend`)
- `withProps` — preset-applying wrapper via `makeWithProps`

### Mantine analog search

Mantine has no direct `defineComponent` equivalent.  The closest analogs are:
- `factory(ui)` — the low-level wrapper audited in Task 1.1.  It does not integrate
  `useProps`, `useStyles`, or vars resolution; component authors do this manually inside
  the `ui` render function.
- `polymorphicFactory(ui)` — same situation, polymorphic variant.

Soribashi's `defineComponent` is a constructor model: authors provide a declarative config
object; the framework handles the plumbing.  This is a deliberate ergonomic improvement
over Mantine's imperative pattern.

### Decision-point enumeration

| # | Decision | Soribashi behavior | Classification |
|---|---|---|---|
| DC-1 | `hasVariants` computation | `(config.variants?.length ?? 0) > 0` | SORIBASHI_ADDITION |
| DC-2 | `useProps` call | Called with `config.name`, `config.defaults ?? null`, `rawProps` | SORIBASHI_ADDITION |
| DC-3 | `varsResolver` selection | Explicit `config.vars` takes precedence; falls back to `autoVars` | SORIBASHI_ADDITION |
| DC-4 | `autoVars` fallback shape | Returns `{ root?: Record<string, string> }` — always `root` selector | SORIBASHI_ADDITION |
| DC-5 | `useStyles` call | All Styles API props threaded through from merged props | SORIBASHI_ADDITION |
| DC-6 | Render call | `config.render({ props: merged, getStyles, ref })` | SORIBASHI_ADDITION |
| DC-7 | `displayName` | Set to `config.name` | SORIBASHI_ADDITION (consistent with Mantine convention) |
| DC-8 | `classes` static | Set from `config.classes` | SORIBASHI_ADDITION (consistent with `definePolymorphicComponent` and `defineGenericComponent`) |
| DC-9 | `extend` static | Set to local `identity` function | INTENTIONAL (identical to `factory.tsx`; identity is the correct no-op placeholder) |
| DC-10 | `withProps` static | Set via `makeWithProps(Component)` | INTENTIONAL (same pattern as `factory.tsx`, `definePolymorphicComponent`, `defineGenericComponent`) |

### Composition correctness

All four composed primitives are wired correctly:

- `useProps` receives the full `rawProps` (no pre-filtering), so theme defaults and
  component defaults are applied before the render function runs.
- `varsResolver` is applied after props are merged, so it sees the final resolved props
  (including defaults).
- `useStyles` is passed the merged props and the resolved `varsResolver`, so var injection
  uses the correct resolved values.
- `config.render` receives `merged` (post-`useProps`) props — no raw prop leakage.

### Identified inconsistency — `withProps` result does not initially propagate `extend`/`withProps`

In this worktree's snapshot of `makeWithProps` (`with-props.tsx`), the component returned
by `Button.withProps({...})` does not have `.extend` or `.withProps` methods.  This is the
same INCONSISTENCY found and fixed in Task 1.4 (full audit pass).  The fix is already
applied to `packages/factory/src/with-props.tsx` on the main branch.  Since `with-props.tsx`
is outside Batch T2-C's scope, this is documented here as a carry-forward note only.

The fix: `makeWithProps` (on main) now copies `Base.extend` to `Wrapped.extend` when
present, and sets `Wrapped.withProps = makeWithProps(Wrapped)` unconditionally.  This means
`Button.withProps({...}).withProps({...})` chains correctly, matching Mantine's behavior.

**Disposition:** Already fixed in Task 1.4. No action needed in Batch T2-C.

### Findings

- No new bugs in `define-component.tsx` itself.
- The `extend = identity` pattern is consistent with `factory.tsx` and Mantine.
- The composition of `useProps` → `autoVars`/`vars` → `useStyles` → `render` is correct.
- The `withProps` propagation fix is inherited from `with-props.tsx` (Task 1.4).
- Parity test added: `define-component-parity.test.tsx` verifies `extend` is callable,
  `withProps` chains, `displayName` is set, and `classes` is accessible.

---

## File 3: `packages/factory/src/cn.ts`

### Classification: SORIBASHI_ADDITION

### What it does

`cn(...inputs)` is a class-name combiner that chains two widely-used utilities:
1. `clsx` — handles conditional, array, and object syntax (falsy filtering, deep arrays)
2. `tailwind-merge` — resolves conflicting Tailwind utility classes (last wins)

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

It is NOT a reimplementation of `clsx` or `classnames`. It is a thin composition wrapper
that uses both libraries directly.

### Mantine comparison

Mantine uses `clsx` directly in its source:
```typescript
// Mantine's use-styles/get-class-name — uses clsx() directly
import { clsx } from 'clsx';
```

Mantine does not use `tailwind-merge` because Mantine uses its own CSS-variable-based
theming system and does not target Tailwind utility classes in its component internals.

Soribashi is designed for Tailwind-first consumers.  The `cn` helper reflects this:
- `clsx` handles all the conditional/array/object class-name syntax Mantine also uses
- `twMerge` resolves conflicts between Tailwind utilities that `clsx` cannot (e.g.,
  `cn('px-2', 'px-4')` → `'px-4'` rather than `'px-2 px-4'`)

### `clsx` API compatibility

Soribashi's `cn` is a superset of `clsx`'s public API:
- Accepts all `ClassValue` inputs (string, number, boolean, null, undefined, object,
  array, nested arrays)
- Returns a string
- Re-exports `ClassValue` type for consumers

The only behavioral difference from bare `clsx`: conflicting Tailwind utilities are
resolved by `tailwind-merge` rather than left to CSS cascade order.

### Decision-point enumeration

| # | Decision | Soribashi behavior | Mantine behavior | Classification |
|---|---|---|---|---|
| CN-1 | Library choice | Uses `clsx` + `tailwind-merge` | Uses `clsx` only | INTENTIONAL |
| CN-2 | Conflict resolution | `tailwind-merge` removes conflicting Tailwind classes | CSS cascade order | INTENTIONAL |
| CN-3 | Type re-export | Exports `ClassValue` from `clsx` | `clsx` types not re-exported | SORIBASHI_ADDITION |
| CN-4 | Implementation | Thin wrapper; not a reimplementation | N/A | SORIBASHI_ADDITION |

### Is soribashi's `cn` a `HOOK_REIMPL`?

No. `cn` uses `clsx` directly — it does not reimplement it. The `tailwind-merge` layer is
additive. This is a composition helper, not a reimplementation. No `@mantine/hooks` analog
exists for `cn`.

### Verdict

`cn` is a soribashi addition well-suited to its Tailwind-first design.  Keeping it as a
thin composition wrapper (instead of calling `clsx` + `twMerge` separately at each call
site) is the correct ergonomic choice.

---

## File 4: `packages/factory/src/create-vars-resolver.ts`

### Classification: IDENTICAL (structure) with INTENTIONAL type differences

### Soribashi source

```typescript
export function createVarsResolver<P extends FactoryPayload>(
  fn: (
    theme: ResolvedTheme,
    props: P['props'],
  ) => Partial<Record<FactoryStylesNames<P>, Record<string, string>>>,
): (
  theme: ResolvedTheme,
  props: P['props'],
) => Partial<Record<FactoryStylesNames<P>, Record<string, string>>> {
  return fn;
}
```

### Mantine source (commit 63dafbbf)

```typescript
// packages/@mantine/core/src/core/styles-api/create-vars-resolver/create-vars-resolver.ts
export function createVarsResolver<Payload extends FactoryPayload>(
  resolver: VarsResolver<Payload>
) {
  return resolver;
}
```

Both are identity functions: they take a function, return it unchanged. The sole purpose
is type narrowing — ensuring callers pass correctly-typed resolver functions without
needing a manual type assertion.

### Side-by-side comparison

| # | Mantine | Soribashi | Classification |
|---|---|---|---|
| CVR-1 | `resolver: VarsResolver<Payload>` input | `fn: (theme: ResolvedTheme, props: ...) => ...` input | TOKEN_DIFF — same semantics, different type wrapper (`VarsResolver<P>` vs inline signature) |
| CVR-2 | `VarsResolver` includes `ctx: Payload['ctx']` as 3rd parameter | Soribashi has no `ctx` parameter (useStyles doesn't pass one) | INTENTIONAL — soribashi's `useStyles` does not support `stylesCtx` (documented in ledger) |
| CVR-3 | `TransformVars<Payload['vars']>` — strict CSS-variable typed record | `Partial<Record<FactoryStylesNames<P>, Record<string, string>>>` — looser, allows partial per-selector maps | INTENTIONAL — soribashi uses a simpler selector→vars mapping; `Partial<>` allows per-selector opt-in |
| CVR-4 | Runtime behavior: `return resolver` | Runtime behavior: `return fn` | IDENTICAL |
| CVR-5 | Return type inferred from `VarsResolver<Payload>` | Return type explicitly annotated (same shape as input) | INTENTIONAL — explicit annotation aids IDEs for soribashi's specific type shape |

### Findings

No bugs. The existing ledger entry under "Validated and matching (no divergence) — `createVarsResolver`" is confirmed correct. The identity-function nature means no observable runtime difference is possible. Type differences are all intentional consequences of soribashi's simpler `useStyles` model (no `ctx`, no strict CSS variable type).

---

## Summary of findings

| File | Classification | Findings | Bugs fixed | Ledger entries |
|---|---|---|---|---|
| `auto-vars.ts` | SORIBASHI_ADDITION | 0 | 0 | 1 (new — justification) |
| `define-component.tsx` | SORIBASHI_ADDITION | 0 new (1 carry-forward from Task 1.4) | 0 | 1 (new — composition model) |
| `cn.ts` | SORIBASHI_ADDITION | 0 | 0 | 1 (new — justification) |
| `create-vars-resolver.ts` | IDENTICAL + INTENTIONAL | 5 (all INTENTIONAL) | 0 | confirms existing ledger entry |

No bugs found in any of the 4 files. No `HOOK_REIMPL` findings. No `HALLUCINATION` findings.

## (e) Missing-port candidates

None surfaced in this batch. Mantine's `VarsResolver` type and `PartialVarsResolver` type
(from `create-vars-resolver.ts`) could be useful for advanced consumers who want stricter
typing on their vars resolvers, but soribashi's current `Partial<Record<...>>` approach is
intentionally simpler and sufficient.
