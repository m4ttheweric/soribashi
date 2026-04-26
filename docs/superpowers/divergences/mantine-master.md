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

## CSS Variable Layer — 2026-04-25 Audit (emit-css.ts vs default-css-variables-resolver.ts)

Full mapping at `docs/superpowers/audits/2026-04-25-css-variable-parity.md`. Summary of new INTENTIONAL_GAP entries:

### Color family variant vars (INTENTIONAL_GAP — architectural)

- **Mantine:** Emits `--mantine-color-{family}-{filled|filled-hover|light|light-hover|light-color|outline|outline-hover|text}` in both light and dark CSS scopes via `getCSSColorVariables()`. Components reference these CSS variables directly.
- **Soribashi:** Computes equivalent variant colors at render time via `intentResolver`. No per-family variant CSS vars are emitted or consumed. This is the most significant architectural divergence.
- **Count:** ~224 vars (14 families × 8 suffixes × 2 schemes)
- **Disposition:** INTENTIONAL_GAP. The intent resolver approach is documented in the soribashi design spec as a deliberate improvement over Mantine's CSS-variable-driven component theming.

### Primary color pointer vars (INTENTIONAL_GAP)

- **Mantine:** Emits `--mantine-primary-color-{0-9}` and `--mantine-primary-color-{filled|filled-hover|light|light-hover|light-color}`.
- **Soribashi:** No `primaryColor` concept at the CSS-variable layer. Components reference `--color-{intent}-{shade}` directly.
- **Count:** 15 vars
- **Disposition:** INTENTIONAL_GAP.

### Mantine named color families (INTENTIONAL_GAP — naming divergence)

- **Mantine:** Ships 14 named families (blue, cyan, dark, grape, gray, green, indigo, lime, orange, pink, red, teal, violet, yellow) with 10 shades each (0–9 numeric index).
- **Soribashi:** Ships semantic families (primary, neutral, danger, success, warning, info) with 50–950 shade keys. The `--color-{family}-{shade}` structural pattern IS implemented; the family names and shade keys differ.
- **Count:** 140 shade vars + 224 variant vars = 364 (all in INTENTIONAL_GAP)
- **Disposition:** INTENTIONAL_GAP. Documented in design spec § 4 substitution table.

### Runtime theme vars (INTENTIONAL_GAP)

These Mantine vars have no soribashi equivalent because they reflect runtime behavior soribashi handles differently:

| Mantine var | Reason for gap |
|---|---|
| `--mantine-scale` | Soribashi emits raw token values; no runtime scale multiplier needed. |
| `--mantine-cursor-type` | Set via Tailwind utility classes, not a CSS variable. |
| `--mantine-webkit-font-smoothing` / `--mantine-moz-font-smoothing` | Consumer's CSS reset responsibility. |
| `--mantine-color-white` / `--mantine-color-black` | Covered by `colors.neutral.0/.950`. |
| `--mantine-color-scheme` | Managed via `.dark` class on `<html>`; no CSS variable needed. |
| `--mantine-primary-color-contrast` | Intent resolver handles contrast at render time. |
| `--mantine-color-bright` | Covered by `colors.neutral.0/.950`. |
| `--mantine-color-error` | Components reference `colors.danger.*` shades directly. |
| `--mantine-color-placeholder` | Utility class in component CSS. |
| `--mantine-color-anchor` | Intent resolver at component level. |
| `--mantine-color-default-hover` | Intent resolver computes hover states. |
| `--mantine-color-disabled` / `-color` / `-border` | CSS `[data-disabled]` attribute selectors. |
| Z-index scale (5 vars) | `tokens.zIndex` exists in the type but emit-css.ts does not emit it; application-concern deferred to consumer. |

### One BUG fixed (not a gap)

- **`--breakpoint-xs` through `--breakpoint-xl`** were not emitted despite `tokens.breakpoint` being defined in the type. Fixed in `emit-css.ts` (see fix commit). These are now ✅ emitted.

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

**Parity audit update — 2026-04-25:** A full branch-by-branch parity audit of `useStyles` and `useProps` was conducted (see `docs/superpowers/audits/2026-04-25-factory-parity-branches.md`). 42 decision branches were enumerated across both hooks. 74 new parity tests were added across `use-styles-parity.test.tsx` and `use-props-parity.test.tsx`. One new bug was found and fixed (`useStyles` — `undefined` CSS variable values not filtered, US-29). 159 factory tests pass after both passes; 0 regressions.

---

## Full audit pass — 2026-04-25

### `makeWithProps` — `withProps()` result does not propagate `extend` or `withProps`

- **File:** `packages/factory/src/with-props.tsx`
- **Mantine source:** `packages/@mantine/core/src/core/factory/polymorphic-factory.tsx` (commit 63dafbbf), line 44 (`Extended.extend = Component.extend`); also `factory.tsx` line 91 (`Extended.withProps = createWithProps(Component)`)
- **Mantine behavior — `extend`:** In both `polymorphicFactory` and `factory`, the component created by `withProps(fixedProps)` receives `Extended.extend = Component.extend`. Callers can chain `Button.withProps({...}).extend({...})`.
- **Mantine behavior — `withProps`:** At `factory.tsx:90`, `Extended.withProps = createWithProps(Component)` — the result of `withProps()` is itself a component that has a working `.withProps()` method, enabling double-wrap chains: `Button.withProps({...}).withProps({...})`.
- **Soribashi previous behavior:** `makeWithProps` created a `forwardRef`-wrapped `Wrapped` component but did not copy `.extend` from `Base` and did not re-bind `.withProps` on the result. The `withProps()` result lacked both methods. The `extend` gap was first caught by Task 1.1 (`B4a` test); the `withProps` gap was surfaced by Task 1.2's unconditional P17c double-wrap test after the `extend` fix was applied; confirmed again by Task 1.3's G5a–G5e tests.
- **Soribashi new behavior:** `makeWithProps` now (1) copies `Base.extend` to `Wrapped.extend` when present (matching `polymorphic-factory.tsx:44`) and (2) sets `Wrapped.withProps = makeWithProps(Wrapped)` unconditionally (matching `factory.tsx:90`). Both fixes apply to all four callers: `factory.withProps`, `polymorphicComponent.withProps`, `definePolymorphicComponent.withProps`, and `defineGenericComponent.withProps`.
- **Classification:** `INCONSISTENCY` (factory/polymorphic/generic itself had `extend` and `withProps`; the result of calling `withProps()` had neither) → aligned via TDD fix.
- **Disposition:** Aligned
- **Tests:** `packages/factory/test/factory-parity.test.tsx` — "B4a: withProps() result has an extend method"; `packages/factory/test/polymorphic-parity.test.tsx` — "P4a: polymorphicComponent.withProps() result has an extend method", "P17a: definePolymorphicComponent.withProps() result has an extend method", "P17c: double-wrapped withProps result also has extend"; `packages/factory/test/generic-parity.test.tsx` — "G5a: withProps() result has an extend method", "G5c: withProps() result has a withProps method"

### `definePolymorphicComponent` — higher-level constructor vs Mantine's type-cast utilities

- **File:** `packages/factory/src/define-polymorphic-component.tsx`
- **Mantine source:** `packages/@mantine/core/src/core/factory/polymorphic-factory.tsx` + `create-polymorphic-component.ts` (commit 63dafbbf)
- **Mantine behavior:** Two separate utilities: `polymorphicFactory(ui)` (a runtime type-cast, no Styles API integration) + `createPolymorphicComponent(component)` (a pure type-cast with no runtime behavior). Callers must wire `useProps`, `useStyles`, etc. manually inside their `ui` render function.
- **Soribashi behavior:** A single higher-level constructor `definePolymorphicComponent(config)` integrates `useProps` + `useStyles` + `autoVars` inside the component body. The `render` callback receives a fully-resolved `{ Element, props, getStyles, ref }` context. No separate type-cast utility is needed.
- **Reason for divergence:** Soribashi's constructor model is more ergonomic — component authors express intent (config object) rather than plumbing (manual hook calls). The trade-off is reduced flexibility for exotic patterns, which are handled by the lower-level `polymorphicComponent` escape hatch.
- **Disposition:** Keep soribashi's higher-level constructor.
- **Test:** `packages/factory/test/polymorphic-parity.test.tsx` — P13 / P14 group (as prop semantics, defaultElement fallback)

### `definePolymorphicComponent` — `classes` static property (soribashi extension)

- **File:** `packages/factory/src/define-polymorphic-component.tsx`
- **Mantine source:** `packages/@mantine/core/src/core/factory/polymorphic-factory.tsx` (commit 63dafbbf)
- **Mantine behavior:** `polymorphicFactory` does not attach a `classes` static property to the produced component.
- **Soribashi behavior:** `definePolymorphicComponent` attaches `(Component as any).classes = config.classes`, mirroring the `factory()` convention. Callers can read `MyComponent.classes.root` to get the stable CSS class name.
- **Reason for divergence:** Soribashi extension. The `classes` static provides a stable reference to the component's CSS class names, enabling consumers to target selectors without hardcoding strings.
- **Disposition:** Keep soribashi's extension.
- **Test:** `packages/factory/test/polymorphic-parity.test.tsx` — "P15a: classes static exists on the component", "P15b: classes static contains the configured class names"

### `definePolymorphicComponent` — `defaultElement` as first-class config (TOKEN_DIFF + soribashi addition)

- **File:** `packages/factory/src/define-polymorphic-component.tsx`
- **Mantine source:** `packages/@mantine/core/src/core/factory/polymorphic-factory.tsx` (commit 63dafbbf)
- **Mantine behavior:** `PolymorphicFactoryPayload.defaultComponent: any` (Mantine's name for the default element type). No centralized default-element fallback inside `polymorphicFactory` — callers handle the `|| 'div'` themselves inside their render function.
- **Soribashi behavior:** `DefinePolymorphicComponentConfig.defaultElement: TDefaultAs` (typed, renamed to `defaultElement` per substitution table). `definePolymorphicComponent` centralizes the fallback: `const Element = asProp ?? config.defaultElement`.
- **Reason for divergence:** (a) Token rename: `defaultComponent` → `defaultElement` is consistent with soribashi's `as` prop convention (prefer element-centric terminology). (b) Centralization: The default-element fallback belongs in the constructor, not scattered across every `ui` implementation.
- **Disposition:** Keep soribashi's approach.
- **Test:** `packages/factory/test/polymorphic-parity.test.tsx` — "P14a: renders defaultElement when as is not provided"

### `defineGenericComponent` — constructor model vs Mantine's `genericFactory` type-cast

- **File:** `packages/factory/src/define-generic-component.tsx`
- **Mantine source:** `packages/@mantine/core/src/core/factory/factory.tsx` (`genericFactory` at line 99, commit 63dafbbf)
- **Mantine behavior:** `genericFactory(ui)` is a 3-line wrapper: calls `factory(ui as any)` and re-casts the result to `Payload['signature'] & MantineComponentStaticProperties<Payload>`. No hook integration; callers must call `useProps`, `useStyles`, etc. manually inside their `ui` render function.
- **Soribashi behavior:** `defineGenericComponent(config)` is a full constructor that integrates `useProps` + `useStyles` + `autoVars` inside the component body. Callers provide a high-level `config.render` callback that receives a fully-resolved `{ props, getStyles, ref }` context.
- **Reason for divergence:** Same rationale as `definePolymorphicComponent` vs `polymorphicFactory`: soribashi's constructor model is more ergonomic — component authors express intent (config object) rather than plumbing (manual hook calls). The trade-off is reduced flexibility for exotic patterns, which can use the lower-level `factory()` escape hatch.
- **Disposition:** Keep soribashi's constructor model.
- **Test:** `packages/factory/test/generic-parity.test.tsx` — "G1: defineGenericComponent — constructor model" group

### `defineGenericComponent` — `GenericComponentFn` type vs Mantine's `Payload['signature']`

- **File:** `packages/factory/src/define-generic-component.tsx`
- **Mantine source:** `packages/@mantine/core/src/core/factory/factory.tsx` (`FactoryPayload.signature?: any`, commit 63dafbbf)
- **Mantine behavior:** The generic component signature is carried via `FactoryPayload.signature?: any` and re-applied via a type cast at the `genericFactory` call site (e.g., `signature: <Value extends Primitive = string>(props: RadioGroupProps<Value>) => JSX.Element`). The component itself is a plain function (Mantine does not use `forwardRef`), so `typeof result === 'function'`.
- **Soribashi behavior:** `GenericComponentFn = <T>(props: any & React.RefAttributes<unknown>) => React.ReactElement | null`. The component is created with `forwardRef`, so `typeof result === 'object'` (a React.ForwardRefExoticComponent). The `TOwnPropsTemplate` type parameter on `defineGenericComponent<TOwnPropsTemplate>` serves as a documentation/IDE hint only — it is not used at runtime.
- **Reason for divergence:** (1) Type-only difference in practice: both are renderable as JSX and callable. (2) The `typeof 'object'` consequence is an artifact of the `forwardRef` divergence (G2), which is intentional. Mantine's `genericFactory` approach requires callers to manually write the generic signature in `FactoryPayload.signature`; soribashi's approach encapsulates this by making the component's external type generic through `GenericComponentFn`.
- **Disposition:** Keep soribashi's approach. Type-level only; no runtime behavior difference for callers.
- **Test:** `packages/factory/test/generic-parity.test.tsx` — "G8: GenericComponentFn type — runtime shape"

### `defineGenericComponent` — `classes` static unconditionally attached

- **File:** `packages/factory/src/define-generic-component.tsx`
- **Mantine source:** `packages/@mantine/core/src/core/factory/factory.tsx` (commit 63dafbbf)
- **Mantine behavior:** `ComponentClasses<Payload>` is a type-only construct — `{ classes: Record<string, string> }` when `Payload['stylesNames']` is a string. At runtime, `genericFactory` does not unconditionally attach a `classes` property; it flows from `factory()` which also doesn't set it.
- **Soribashi behavior:** `defineGenericComponent` always sets `(Component as any).classes = config.classes`. Callers can read `Select.classes.root` to get the stable CSS class name without hardcoding strings.
- **Reason for divergence:** Soribashi extension consistent with `definePolymorphicComponent` (already in ledger). The `classes` static provides stable class-name references, enabling consumers to target component selectors without hardcoding strings.
- **Disposition:** Keep soribashi's extension.
- **Test:** `packages/factory/test/generic-parity.test.tsx` — "G10: classes static attached to the component"

### `makeWithProps` — stacks wrappers vs Mantine sharing the base component

- **File:** `packages/factory/src/with-props.tsx`
- **Mantine source:** `packages/@mantine/core/src/core/factory/factory.tsx` (`factory.tsx:90` — `Extended.withProps = createWithProps(Component)`, commit 63dafbbf)
- **Mantine behavior:** `Extended.withProps = createWithProps(Component)` — Mantine passes the original `Component` (not `Extended`) to `createWithProps`. In a double-wrap chain `A.withProps({x:1}).withProps({x:2})`, the second `withProps` call still renders into the original `Component`, and `{x:1}` from the first level is not inherited — the second call's presets fully replace the first.
- **Soribashi behavior:** `(Wrapped as any).withProps = makeWithProps(Wrapped)` — soribashi passes the WRAPPED component. Each level of wrapping stacks presets incrementally. In a double-wrap chain `A.withProps({x:1}).withProps({x:2})`, the second renders into the first wrapper, which renders into the original; `{x:2}` presets override `{x:1}` presets (but neither overrides explicit instance props). The undefined-filter means only truly undefined instance slots fall through to the next level.
- **Reason for divergence:** Consequence of soribashi's undefined-filter design — the filter happens at each wrapper layer, so the preset-stacking approach is more natural. Observable difference only for 3+ levels of wrapping (exotic pattern); for the common 1- and 2-level cases, both approaches produce equivalent visible behavior.
- **Disposition:** Keep soribashi's stacking approach.
- **Test:** `packages/factory/test/generic-parity.test.tsx` — "G13: withProps stacking — preset accumulation"
