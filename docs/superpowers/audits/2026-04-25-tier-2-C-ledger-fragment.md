# Ledger Fragment — Tier 2 Batch T2-C (Factory soribashi-additions)

> This fragment is merged into `docs/superpowers/divergences/mantine-master.md` during Phase 4 consolidation.

**Mantine commit:** `63dafbbf5f0135eb36455b7add4c0ddcd0f3240a`

**Audit doc:** `docs/superpowers/audits/2026-04-25-tier-2-factory-additions.md`

---

## Full audit pass — 2026-04-25 — Batch T2-C entries

### `autoVars` — soribashi-only quality-of-life helper (SORIBASHI_ADDITION)

- **File:** `packages/factory/src/auto-vars.ts`
- **Mantine source:** No analog. Mantine has no equivalent auto-derivation path; component authors always write explicit `createVarsResolver` calls.
- **Mantine behavior:** Each component manually implements a vars resolver via `createVarsResolver<Factory>((theme, props) => ({ root: { '--var': value } }))`.
- **Soribashi behavior:** `autoVars(theme, componentName, props, hasVariants)` auto-derives the standard intent-driven CSS custom properties (`bg`, `color`, `border`, and optionally `hover`, `active`, `hoverColor`) from `theme.intentResolver`. Used as the default `varsResolver` in `defineComponent` when no explicit `config.vars` is provided.
- **Reason:** Eliminates boilerplate for the dominant intent/variant theming pattern. Components with non-standard var needs can supply `config.vars` to override. The intent resolver pattern (soribashi's analog to Mantine's `defaultVariantColorsResolver`) is sufficiently uniform that auto-derivation is safe.
- **Disposition:** Keep — soribashi addition. No Mantine analog exists because Mantine's component theming always requires explicit resolver functions.
- **Test:** `packages/factory/test/auto-vars.test.ts` (pre-existing), `packages/factory/test/define-component.intent.test.tsx` (pre-existing)

### `defineComponent` — higher-level constructor model (SORIBASHI_ADDITION)

- **File:** `packages/factory/src/define-component.tsx`
- **Mantine source:** No direct analog. The closest patterns are `factory(ui)` (`core/factory/factory.tsx`, commit 63dafbbf) and the manual hook calls each Mantine component makes inside its `ui` render function.
- **Mantine behavior:** Components are authored via `factory(ui)`, where the `ui` function manually calls `useProps(...)`, `useStyles(...)`, and an explicit `createVarsResolver(...)`. The plumbing is per-component, not centralized.
- **Soribashi behavior:** `defineComponent(config)` is a declarative constructor. It integrates `useProps` + `autoVars`/`config.vars` + `useStyles` inside a `React.forwardRef` wrapper. Component authors receive a fully-resolved `{ props, getStyles, ref }` context in their `render` callback; no manual hook calls are needed.
- **Reason for divergence:** Constructor model is more ergonomic for soribashi's use case. The rigid interface ensures consistent composition ordering (`useProps` → vars → `useStyles` → render) and prevents subtle ordering bugs. The trade-off is reduced flexibility for exotic patterns; the lower-level `factory()` escape hatch handles those.
- **Disposition:** Keep — soribashi addition.
- **Test:** `packages/factory/test/define-component.test.tsx` (pre-existing), `packages/factory/test/define-component.intent.test.tsx` (pre-existing), `packages/factory/test/define-component-parity.test.tsx` (new — added in T2-C)

### `cn` — `clsx` + `tailwind-merge` composition wrapper (SORIBASHI_ADDITION)

- **File:** `packages/factory/src/cn.ts`
- **Mantine source:** No analog. Mantine uses `clsx` directly throughout its source (e.g., `core/styles-api/use-styles/get-class-name/get-class-name.ts`). Mantine does not use `tailwind-merge`.
- **Mantine behavior:** `clsx(...)` is called directly. No Tailwind conflict resolution.
- **Soribashi behavior:** `cn(...inputs)` wraps `clsx` (for conditional/array/object syntax) and pipes the result through `tailwind-merge` (for Tailwind utility conflict resolution). This is NOT a reimplementation of `clsx` — it uses `clsx` directly as a dependency.
- **Reason for divergence:** Soribashi is Tailwind-first. The `tailwind-merge` layer is necessary for consumer code that passes Tailwind utilities alongside component-level class names — without it, `cn('px-2', 'px-4')` would output `'px-2 px-4'` (both present, creating specificity ambiguity). Soribashi components use `cn` in `useStyles` for className resolution, and consumers often add Tailwind overrides.
- **Disposition:** Keep — soribashi addition appropriate for Tailwind-first design.
- **Test:** `packages/factory/test/cn.test.ts` (pre-existing)

### `createVarsResolver` — identity helper (IDENTICAL runtime; INTENTIONAL type differences) — confirms existing ledger entry

- **File:** `packages/factory/src/create-vars-resolver.ts`
- **Mantine source:** `packages/@mantine/core/src/core/styles-api/create-vars-resolver/create-vars-resolver.ts` (commit 63dafbbf)
- **Mantine behavior:** `createVarsResolver<Payload>(resolver)` returns `resolver` unchanged. Runtime: pure identity function. Type: input is `VarsResolver<Payload>` which includes a `ctx` 3rd parameter and uses strict `TransformVars<Payload['vars']>` typing.
- **Soribashi behavior:** `createVarsResolver<P>(fn)` returns `fn` unchanged. Runtime: pure identity function. Type: input uses an inline function signature without `ctx` and uses `Partial<Record<FactoryStylesNames<P>, Record<string, string>>>` (simpler, partial map).
- **Reason for type differences:** (1) No `ctx` parameter because soribashi's `useStyles` does not support `stylesCtx` (documented in the main ledger). (2) `Partial<>` wrapper allows per-selector opt-in; Mantine's `TransformVars` requires all declared vars to be present. (3) The `Record<string, string>` value type is simpler than Mantine's strict CSS-variable union type — soribashi's CSS variable management is handled at the codegen layer, not at the type layer.
- **Classification:** IDENTICAL runtime; INTENTIONAL type divergences (all consequences of soribashi's simpler `useStyles` model).
- **Disposition:** Keep — soribashi's types are intentionally simpler and sufficient.
- **Test:** Covered by all tests that use `createVarsResolver` + `useStyles` integration.
- **Prior ledger entry:** This entry confirms the existing "Validated and matching (no divergence)" entry under `createVarsResolver` in the master ledger. No new divergences found.
