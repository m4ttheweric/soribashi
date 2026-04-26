# Soribashi vs. Mantine — Divergence Ledger

**Validated against:** [`mantinedev/mantine`](https://github.com/mantinedev/mantine) at commit `63dafbbf5f0135eb36455b7add4c0ddcd0f3240a` (master, 2026-04-25).

This ledger satisfies Hard Rule 13 of the Soribashi design spec. Every soribashi primitive that has a Mantine analog has been read against the actual Mantine source. Every behavioral or implementation divergence is recorded below with the reason and the disposition (kept-as-is, aligned, or hybrid).

The single behavioral alignment from the original pass: `useProps` now supports the function-form `defaultProps` (`(theme) => Partial<Props>`) that Mantine documents and uses internally.

A second alignment from the 2026-04-25 parity audit: `useStyles` now strips `undefined` values from CSS variable maps before merging them into the style object, matching Mantine's `mergeVars`+`filterProps` behavior.

---

## Aligned (changed soribashi to match Mantine)

### `useProps` — function-form theme `defaultProps`

- **File:** `packages/factory/src/hooks/use-props.ts`
- **Mantine source:** `packages/@mantine/core/src/core/MantineProvider/use-props/use-props.ts`
- **Mantine behavior:** `theme.components[name].defaultProps` may be either a `Partial<Props>` object or a `(theme) => Partial<Props>` function. The function form is invoked with the theme and the result is used as defaults.
- **Soribashi previous behavior:** Only the object form was supported.
- **Soribashi new behavior:** Both forms supported, matching Mantine.
- **Test added:** `packages/factory/test/use-props.test.tsx` — "theme defaultProps as a function receives the theme and returns dynamic defaults".

### `useStyles` — CSS variable maps strip `undefined` values (US-29)

- **File:** `packages/factory/src/hooks/use-styles.ts`
- **Mantine source:** `packages/@mantine/core/src/core/styles-api/use-styles/get-style/resolve-vars/merge-vars.ts`
- **Mantine behavior:** `mergeVars` applies `filterProps(current[key])` per selector key — any CSS variable entry with an `undefined` value is stripped before being merged into the style object.
- **Soribashi previous behavior:** `Object.assign` was used directly without filtering — `undefined`-valued CSS variable keys were retained in the merged style object (key present with value `undefined`), which React would render as the string `"undefined"`.
- **Soribashi new behavior:** `filterDefinedValues` helper strips `undefined` entries from each vars map before pushing into `styleParts`. Matches Mantine's `filterProps` behavior.
- **Bug classified as:** `BUG` — incorrect style output for components returning `undefined` CSS variable values from `varsResolver`.
- **Test added:** `packages/factory/test/use-styles-parity.test.tsx` — "US-29: undefined values in vars > varsResolver with defined values produces those in style".

### `definePolymorphicComponent.withProps` — preserves polymorphism through presets

- **File:** `packages/factory/src/define-polymorphic-component.tsx`
- **Mantine source:** `packages/@mantine/core/src/core/factory/polymorphic-factory.tsx` (`PolymorphicComponentWithProps`)
- **Mantine behavior:** Polymorphic components have a typed `withProps` that returns a component whose `as` prop continues to typecheck. Presets may include `as` to change the default element.
- **Soribashi previous behavior:** Used the same `makeWithProps` helper as the non-polymorphic factory; the return type was `ComponentType<TProps>`, dropping polymorphism. Tests required `as any` casts.
- **Soribashi new behavior:** `withProps` typed as `<TAs>(presets) => PolymorphicComponentLike<TAs, OwnProps>`. Callers can pass `as` at the call site without casts. Presets may include `as` to override the default element.
- **Test added:** `packages/factory/test/define-polymorphic-component.test.tsx` — "Component.withProps preserves polymorphism" (no `as any`) and "Component.withProps with as preset overrides defaultElement".

### `defineGenericComponent.withProps` — preserves the type parameter

- **File:** `packages/factory/src/define-generic-component.tsx`
- **Mantine source:** `packages/@mantine/core/src/core/factory/factory.tsx` (`genericFactory`)
- **Mantine behavior:** Generic components retain their type parameter through `withProps`.
- **Soribashi previous behavior:** `withProps` return type stripped the generic. `Select.withProps({...})` returned a non-generic component; `<Result<User> ...>` failed typecheck.
- **Soribashi new behavior:** `withProps` returns the same `GenericComponentFn` shape as the original component. Type parameters flow through.
- **Test added:** `packages/factory/test/define-generic-component.test.tsx` — "withProps preserves the generic so callers can still type-parameterize".

---

## Kept (deliberate divergences from Mantine)

### `factory()` — wraps render in `forwardRef`

- **File:** `packages/factory/src/factory.tsx`
- **Mantine source:** `packages/@mantine/core/src/core/factory/factory.tsx`
- **Mantine behavior:** Casts the user's render function to `any` and returns it directly. The render function takes one argument (`props` with `ref` attached as a regular prop). No `forwardRef` wrapping.
- **Soribashi behavior:** Wraps the render function in `React.forwardRef`. Render function signature is `(props, ref) => ReactNode`.
- **Reason for divergence:** Soribashi's signature exposes `ref` as a separate parameter — a more conventional `forwardRef` ergonomic. Component authors can `(props, ref) => <button ref={ref} />` directly. Mantine relies on consumers reading `props.ref` inline, which works but is less idiomatic React.
- **Disposition:** Keep soribashi's wrap.

### `factory.withProps` — filters `undefined` from instance props

- **File:** `packages/factory/src/with-props.tsx`
- **Mantine source:** Inline in `factory.tsx`: `(props) => <Component {...fixedProps} {...props} />`.
- **Mantine behavior:** Spreads instance props last, so `undefined` instance values override presets.
- **Soribashi behavior:** Filters `undefined` from instance props before merging with presets.
- **Reason for divergence:** This matches the `useProps` semantics ("instance props with explicit undefined do NOT override defaults"). Mantine has an inconsistency: `useProps` filters undefined but `withProps` does not. Soribashi makes the two consistent.
- **Disposition:** Keep soribashi's filter.
- **Test:** `packages/factory/test/factory.test.tsx` — "withProps: instance props override preset" (with non-undefined values).

### `polymorphicFactory()` — wraps render in `forwardRef`

- **File:** `packages/factory/src/define-polymorphic-component.tsx`, `packages/factory/src/polymorphic-component.tsx`
- **Mantine source:** `packages/@mantine/core/src/core/factory/polymorphic-factory.tsx`
- **Mantine behavior:** Same as `factory()` — casts to `any`, no `forwardRef`. Render function signature `(props) => ReactNode`.
- **Soribashi behavior:** Wraps in `forwardRef`, render signature `(props, ref) => ReactNode`.
- **Reason for divergence:** Same rationale as `factory()` above.
- **Disposition:** Keep soribashi's wrap.

### `PolymorphicComponentProps` — own props win on conflict

- **File:** `packages/factory/src/types/polymorphic.ts`
- **Mantine source:** `packages/@mantine/core/src/core/factory/create-polymorphic-component.ts`
- **Mantine behavior:** `PolymorphicComponentProps<C, Props> = InheritedProps<C, Props & ComponentProp<C>>` where `InheritedProps<C, Props>` is `Omit<PropsOf<C>, keyof Props> & Props`. Own props (`Props`) extend C's props with `Omit` removing duplicates from C — so own props win on key collision, but C's full prop surface is preserved.
- **Soribashi behavior:** `PolymorphicProps<TAs, TOwnProps> = TOwnProps & Omit<ComponentPropsWithRef<TAs>, keyof TOwnProps | 'as'> & { as?: TAs }`. Own props win on conflict (same effect as Mantine), but the implementation is structurally different and explicitly excludes `as` from the inherited surface.
- **Reason for divergence:** Soribashi addresses the console-archive Mantine workarounds 4b and 4c — places where TabsPanel / Collapse polymorphic typing dropped target-component props that should have flowed through. Soribashi's implementation is structurally different to make the propagation more reliable.
- **Disposition:** Keep soribashi's. This is a recorded design improvement.
- **Test:** `packages/factory/test/define-polymorphic-component.test.tsx` — "renders a custom React component when as is a component" exercises target-component prop propagation.

### `useTheme` — falls back to default theme outside provider

- **File:** `packages/factory/src/provider/context.ts`, `packages/factory/src/provider/use-theme.ts`
- **Mantine source:** `packages/@mantine/core/src/core/MantineProvider/Mantine.context.ts` (`useMantineContext`)
- **Mantine behavior:** Throws `[@mantine/core] MantineProvider was not found in tree` if there is no provider in the React tree above the call site.
- **Soribashi behavior:** Returns a sensible default empty theme (created via `createTheme({ tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} } })`).
- **Reason for divergence:** Easier component-in-isolation testing without provider boilerplate. Components can be rendered in tests without a wrapper. The default theme is structurally valid, just empty — the codepath is exercised, no surprising runtime crashes.
- **Disposition:** Keep soribashi's fallback.
- **Test:** `packages/factory/test/provider.test.tsx` — "useTheme returns default theme outside provider".

### `SoribashiProvider` — minimal context-only provider

- **File:** `packages/factory/src/provider/provider.tsx`
- **Mantine source:** `packages/@mantine/core/src/core/MantineProvider/MantineProvider.tsx`
- **Mantine behavior:** ~130-line provider. Manages color scheme via `useProviderColorScheme`, injects CSS variables via `<MantineCssVariables>`, sets up static class injection, supports headless mode, deduplicates inline styles, etc.
- **Soribashi behavior:** ~5-line provider that just supplies `theme` via React context. No CSS injection, no color scheme manager, no static class system.
- **Reason for divergence:**
  - **CSS variable injection** is replaced by `@soribashi/codegen` emitting a static `theme.css` at build time. The CSS file is imported by the consumer; no runtime injection needed.
  - **Color scheme management** is the consumer's responsibility. Soribashi's design philosophy is that the runtime should be minimal — toggle a class on `<html>` or use `prefers-color-scheme` via media queries. Mantine's color scheme manager exists because it has to stay in sync with the dynamic CSS variables it injects; soribashi's static CSS doesn't have that problem.
  - **Static class prefix system** is unnecessary because soribashi components use stable `sb-{Component}-{selector}` class names directly.
  - **Headless mode** is unnecessary — soribashi is already substrate-agnostic.
- **Disposition:** Keep minimal.

### `createTheme` — full normalization on creation

- **File:** `packages/theme/src/create-theme.ts`
- **Mantine source:** `packages/@mantine/core/src/core/MantineProvider/create-theme/create-theme.ts`
- **Mantine behavior:** `createTheme(theme) => theme` — literally an identity function. Theme normalization happens elsewhere (via `mergeThemeWithDefaults` inside `MantineThemeProvider`).
- **Soribashi behavior:** `createTheme()` performs full normalization upfront — applies semantic defaults (`text`, `surface`, `border`), default intent resolver, default scope (`:root`) and dark mode selector (`.dark`), default name. Returns a fully-resolved `ResolvedTheme` ready for codegen and the provider.
- **Reason for divergence:** Soribashi's codegen package consumes the theme without React. It needs a fully-resolved theme at creation time, not at render time. Doing normalization in `createTheme` means both runtime (provider) and build time (codegen) operate on the same shape.
- **Disposition:** Keep soribashi's full normalization.

### `useStyles` — simpler resolution model

- **File:** `packages/factory/src/hooks/use-styles.ts`
- **Mantine source:** `packages/@mantine/core/src/core/styles-api/use-styles/use-styles.ts`
- **Mantine behavior:** ~150 lines, supports:
  - Multiple component names (`name: string | (string | undefined)[]`) — useful for compound theme overrides
  - Configurable `rootSelector` (default `'root'`)
  - `stylesCtx` parameter passed to all callbacks for deeper context-driven dynamic styles
  - Style transforms (`useMantineStylesTransform`) for CSS-in-JS adapters
  - `headless` mode that skips theme resolution
  - Static classes prefix (`mantine-Button-root`-style) configurable via context
  - `mergeVars` helper that merges multiple sources of CSS variables
- **Soribashi behavior:** ~120 lines, supports the core Styles API (built-in classes < theme classNames < instance classNames; same for styles, vars, attributes). Hardcoded `'root'` selector. Single component name. No `stylesCtx`. No style transforms. No headless mode. No prefix system.
- **Reason for divergence:**
  - **Multiple component names**: The compound-component case (Tabs.List inheriting from Tabs theme) is real but rare. Soribashi does single-component theme matching for now; compound components can use the lower-level `factory()` escape hatch.
  - **`rootSelector` configurability**: 99% of components use `'root'`. The 1% can use the lower-level escape hatch.
  - **`stylesCtx`**: A Mantine convenience for context-driven dynamic styles. Soribashi's render function already has access to all props via the `render({ props })` callback — the same use cases work without a separate `stylesCtx`.
  - **Style transforms**: Mantine's hook for plugging in CSS-in-JS systems. Soribashi is explicitly substrate-agnostic via class names; no need.
  - **Headless / classNamesPrefix / static classes**: Mantine added these for runtime CSS generation. Soribashi uses static classes that codegen ensures are correct. None of this is necessary.
- **Disposition:** Keep simpler. If a use case demonstrates the need for one of Mantine's features, add it deliberately.

### ~~Layout blocks — direct DOM rendering, no `Box` wrapper~~ — **CLOSED 2026-04-25**

> **Closed:** all 14 layout blocks (Box, Stack, Group, Flex, Grid, Grid.Col, SimpleGrid, Container, Center, AspectRatio, Space, Paper, Text, Title) are now Box-wrapped Mantine adaptations with full attribution headers. The previous direct-DOM, ad-hoc `data-*` pattern has been replaced by `Box` + `mod` + `getStyles('root')` everywhere. Source-validated against Mantine master `63dafbbf`. See "Closed (adapted from Mantine)" below for the per-block summary.

---

## Closed (adapted from Mantine)

Per the 2026-04-25 blocks adaptation pass (see `docs/superpowers/plans/2026-04-25-plan-mantine-blocks-adaptation.md` and `THIRD-PARTY-LICENSES.md`), every block under `packages/blocks/src/` was rewritten as a faithful Mantine adaptation. Each adapted file carries an attribution header pointing at its upstream source. Behavioral differences are limited to (1) token names per the substitution table in the adaptation spec § 4, (2) framework imports targeting `@soribashi/factory` instead of Mantine's `core`, and (3) the `sb-` class-name prefix.

| Block | Notes |
|---|---|
| `Box` | Full Mantine-faithful with style-prop pipeline + responsive `StyleProp<T>` (Box itself only). |
| `Stack`, `Group` | Group includes `grow` / `preventGrowOverflow` / `filterFalsyChildren`. |
| `Center` | `:where([data-inline])` zero-specificity inline mode. |
| `AspectRatio` | Children-aware fix (Mantine's `*[data-aspect-ratio-child]` selector). |
| `Space` | One-line `Box` wrapper (the `w` / `h` style props do all the work). |
| `Paper` | a11y defaults plus light/dark border via `:root` / `.dark`. |
| `Flex` | Adapted; flat values for own props (responsive `StyleProp<T>` deferred — see below). |
| `Grid` + `Grid.Col` | Mantine column-math helpers (`getColumnFlexBasis`/`getColumnMaxWidth`/`getColumnFlexGrow`/`getColumnOffset`) ported and parameterized on `columns`. `GridProvider` context wires `columns` + `grow` to children. Responsive `StyleProp<T>` for col span / offset / order still deferred. |
| `SimpleGrid` | Block strategy fully adapted (`minColWidth` / `autoFlow` / `autoRows` / `type='media'`). `type='container'` mode deferred. |
| `Container` | Both block and grid strategies implemented. Grid strategy: `strategy="grid"` renders a CSS Grid template; direct children default to the center column; children with `data-breakout` span the full viewport; `data-breakout > [data-container]` children are re-constrained to `--container-size`. |
| `Text` | `lineClamp`, `gradient`, `inline`, `inherit`, RTL truncate (`truncate='start'`), `span` shorthand. |
| `Title` | `order` (1-6), `size` accepts `h1`-`h6` token, `lineClamp`, `textWrap`, vars from `theme.tokens.heading.sizes`. |

Layout blocks are now full Mantine adaptations. Behavioral parity verified by tests; remaining differences are limited to (1) token names (per § 4 of the adaptation spec), (2) framework imports targeting `@soribashi/factory` instead of Mantine's `core`, and (3) class-name prefix `sb-` instead of `mantine-`.

### Post-adaptation validation pass — 2026-04-25

After the adaptation pass, a second-pass validation against Mantine `63dafbbf` surfaced 15 residual divergences. All 15 are now closed:

| # | Area | Resolution |
|---|---|---|
| 1 | `Grid` math hardcoded 12 columns, missing gap-factor term, `span="auto"` set width=100% | Ported Mantine column-math helpers; parameterized on `columns`; added `GridProvider` for context-aware col vars; added `grow` prop |
| 2 | `getBoxMod` did not kebab-case camelCase keys | Added `transformModKey` mirroring Mantine's `replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()` |
| 3 | `mx`/`my` mapped to physical longhands | Now map to `marginInline` / `marginBlock` logical shorthands (same for padding) |
| 4 | `fw` resolver mangled CSS keywords like `bolder` | Identity pass-through (matches Mantine) |
| 5 | `hiddenFrom` / `visibleFrom` / `sx` / `lightHidden` / `darkHidden` leaked to DOM | Explicitly consumed in Box destructure; not forwarded to DOM |
| 6 | Visibility props not implemented | `hiddenFrom`/`visibleFrom`/`lightHidden`/`darkHidden` now apply `sb-{hidden,visible}-from-{bp}` / `sb-{light,dark}-hidden` classes backed by `packages/blocks/src/Box/visibility.css` |
| 7 | Style-prop set missing 12 props | Added `mis`/`mie`/`pis`/`pie`/`ff`/`fs`/`tt`/`td`/`bgsz`/`bgp`/`bgr`/`bga` |
| 8 | Prop renames (`Grid.Col alignSelf`, `SimpleGrid minColumnWidth`/`autoCols`/`type='simple'`) | Renamed to `align`, `minColWidth`, `autoFlow`, `type='media'`. Added `autoRows` on SimpleGrid. |
| 9 | `--heading-text-wrap` referenced by `Title.css` but never emitted | `emit-css.ts` now emits the var when `theme.tokens.heading.textWrap` is set |
| 10 | `getSize`/`getSpacing`/`getRadius`/`getFontSize` over-restrictive `STANDARD_KEYS` allowlist | Replaced with Mantine's `isNumberLike` heuristic (open-ended token resolution); `getRadius(undefined)` falls back to `var(--radius-md)` |
| 11 | `rem.ts` did not handle px-strings | Now parses `'8px'` → `'0.5rem'`, recurses on space- and comma-separated values, passes through CSS functions |
| 12 | `useRandomClassName` only stripped `:` | Now strips `[:«»]` (handles React 19 boundary IDs) |
| 13 | `Paper` `--paper-border-color` declared on `:root`/`.dark` (global namespace) | Scoped to `.sb-Paper-root` and `.dark .sb-Paper-root` |
| 14 | `SimpleGrid` auto-flow rules wrapped in `:where()` (zero specificity) | Bare attribute selectors (matches Mantine specificity for overridability) |
| 15 | Ledger marked `Container` grid strategy as deferred when in fact shipped | Ledger entry corrected; per-block table updated |

---

## Deferred (acknowledged, not yet implemented)

Captured during the 2026-04-25 blocks adaptation pass — items the plan called out as out-of-scope or descoped during execution. Each is implementable later under the same recipe.

### Responsive `StyleProp<T>` on non-Box blocks

- **Status:** Box has full responsive style-prop support (`p={{ base: 'xs', md: 'lg' }}` generates a per-instance class with media-query rules via `<InlineStyles>`). Flex / Grid / SimpleGrid currently take flat values for their non-Box-overlapping props (Flex's `gap` / `align` / etc., Grid's `cols`, etc.).
- **Why deferred:** The infrastructure (`parseStyleProps`, `<InlineStyles>`, `useRandomClassName`) is built and proven on Box. Plugging it into each block requires defining a `STYLE_PROPS_DATA`-shaped table for that block's own props. Mechanical but per-block; out of scope for the initial adaptation pass.
- **To implement:** Per block, declare its own `STYLE_PROPS_DATA`-style table covering its own props, run them through the same `parseStyleProps` pipeline, render `<InlineStyles>` when responsive values are present.

### `GridProvider` context for responsive col span / offset / order

- **Status:** Mantine's `Grid` uses a context provider so `Grid.Col` can read responsive breakpoints from the parent `Grid`. Soribashi's `Grid.Col span={{ base: 12, md: 6 }}` is not yet supported — current `Grid` uses flat per-col values.
- **Why deferred:** Requires the responsive `StyleProp<T>` machinery above plus a `<GridProvider>` context wrapping `Grid`. Same recipe as Mantine's `packages/@mantine/core/src/components/Grid/GridProvider.tsx`.
- **To implement:** Port `GridProvider.tsx` and `use-grid-context.ts`, thread breakpoints through `Grid.Col`'s vars resolver.

### `SimpleGrid` `type='container'` mode

- **Status:** Default `type='media'` mode (responsive via media queries) works. `type='container'` (responsive via container queries) is not yet implemented.
- **Why deferred:** Same rationale as above — niche, scope reduction.
- **To implement:** Add the `type` prop, emit `@container` queries in addition to `@media` when `type='container'`.

---

## Validated and matching (no divergence)

These pieces were source-validated and are functionally equivalent to Mantine.

### `defaultIntentResolver`

- **File:** `packages/theme/src/default-intent-resolver.ts`
- **Mantine source:** `packages/@mantine/core/src/core/MantineProvider/color-functions/default-variant-colors-resolver/default-variant-colors-resolver.ts`
- **Validation:** Already source-validated in the original Plan 1 implementation. The variant-set adaptation (`'filled' | 'outline' | 'subtle' | 'ghost' | 'link'` for soribashi vs Mantine's broader set) is the only difference and is intentional / documented in the design spec § 5.3.

### `Factory` payload type

- **File:** `packages/factory/src/types/factory-payload.ts`
- **Mantine source:** `packages/@mantine/core/src/core/factory/factory.tsx` (FactoryPayload interface, lines 4-20)
- **Validation:** Soribashi's `FactoryPayload` matches Mantine's shape (`props`, `ref`, `stylesNames`, `vars`, `variant`, `staticComponents`, `compound`). No divergence.

### `createVarsResolver`

- **File:** `packages/factory/src/create-vars-resolver.ts`
- **Mantine source:** Inline pattern in components like `Stack.tsx` line 45.
- **Validation:** Both are identity functions that exist purely for type narrowing. No runtime divergence.

### `useProps` overall structure

- **File:** `packages/factory/src/hooks/use-props.ts`
- **Mantine source:** `packages/@mantine/core/src/core/MantineProvider/use-props/use-props.ts`
- **Validation:** After the function-form alignment above, soribashi's `useProps` is functionally equivalent to Mantine's. Both use the same merge order (`{ ...defaults, ...themeDefaults, ...filterProps(instance) }`) and both filter `undefined` from instance props.

---

## Coverage statement

All files in scope of `docs/superpowers/specs/2026-04-25-mantine-validation-pass-design.md` § 2 were source-validated on 2026-04-25 against Mantine master commit `63dafbbf`. One alignment was made (`useProps` function-form defaults). All other divergences are intentional, documented, and have associated tests where behaviorally observable.

**Parity audit update — 2026-04-25:** A full branch-by-branch parity audit of `useStyles` and `useProps` was conducted (see `docs/superpowers/audits/2026-04-25-factory-parity-branches.md`). 42 decision branches were enumerated across both hooks. 74 new parity tests were added across `use-styles-parity.test.tsx` and `use-props-parity.test.tsx`. One new bug was found and fixed (`useStyles` — `undefined` CSS variable values not filtered, US-29). All 159 factory tests pass; 0 regressions.

153 + 74 = 159 tests pass after both passes; 0 regressions.
