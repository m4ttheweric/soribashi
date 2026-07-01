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
| `SimpleGrid` | Block strategy fully adapted (`minColWidth` / `autoFlow` / `autoRows`). Media-query behavior is the only mode; the `type` prop is not exposed until `type='container'` is implemented (2026-07-01). |
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
| 8 | Prop renames (`Grid.Col alignSelf`, `SimpleGrid minColumnWidth`/`autoCols`/`type='simple'`) | Renamed to `align`, `minColWidth`, `autoFlow`. Added `autoRows` on SimpleGrid. The `type` prop was later removed from the public props as dead surface (2026-07-01, see deferred entry). |
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

- **Status:** Media-query responsiveness works. `type='container'` (responsive via container queries) is not yet implemented. The `type` prop itself was removed from `SimpleGridOwnProps` on 2026-07-01: it was typed with a documented default but had no effect, which read as a working feature. A runtime-passed `type` is still stripped so it cannot leak to the DOM.
- **Why deferred:** Same rationale as above — niche, scope reduction.
- **To implement:** Reintroduce the `type` prop, emit `@container` queries in addition to `@media` when `type='container'`.

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

## Full audit pass — 2026-04-25 — Task 1.6 entries

### `useRandomClassName` — `stripIdMarkers` extracted for testability (U2)

- **File:** `packages/factory/src/use-random-class-name.ts`
- **Mantine source:** `packages/@mantine/core/src/core/Box/use-random-classname/use-random-classname.ts` (commit 63dafbbf)
- **Mantine behavior:** Single exported function `useRandomClassName()`. The `.replace(/[:«»]/g, '')` call is inlined in the function body; no separate helper is exported.
- **Soribashi behavior:** Two exported functions: `stripIdMarkers(id)` (the regex helper, extracted for unit testability) + `useRandomClassName()` (calls `useId()` then delegates to `stripIdMarkers`).
- **Reason for divergence:** Soribashi extension. Extracting `stripIdMarkers` makes the stripping logic directly testable without needing to invoke a React hook. Observable contract is identical.
- **Disposition:** Keep — soribashi addition (testability improvement)
- **Test:** `packages/factory/test/hash-and-classname-parity.test.tsx` — "U2a: stripIdMarkers is a named export"

### `useRandomClassName` — output prefix `sb-` vs `__m__-` (U4)

- **File:** `packages/factory/src/use-random-class-name.ts`
- **Mantine source:** `packages/@mantine/core/src/core/Box/use-random-classname/use-random-classname.ts` (commit 63dafbbf)
- **Mantine behavior:** Returns `` `__m__-${id}` `` where `id` is the stripped `useId()` value.
- **Soribashi behavior:** Returns `` `sb-${stripIdMarkers(id)}` `` — same structure with soribashi's `sb-` prefix.
- **Reason for divergence:** TOKEN_DIFF — `__m__` is a Mantine-internal prefix; `sb-` follows soribashi's naming convention. This was noted in the post-adaptation pass ledger item #12.
- **Disposition:** Keep — token substitution per design spec § 4
- **Test:** `packages/factory/test/hash-and-classname-parity.test.tsx` — "U4a: result starts with 'sb-'"

### `useRandomClassName` — NOT in `@mantine/hooks`; no hook replacement

- **File:** `packages/factory/src/use-random-class-name.ts`
- **Mantine source:** `packages/@mantine/core/src/core/Box/use-random-classname/use-random-classname.ts` (commit 63dafbbf)
- **Hook-replacement determination:** Searched `@mantine/hooks/src/` — `useRandomClassName` is not exported from `@mantine/hooks`. It lives only inside `@mantine/core`. Per Hard Rule 14, only `@mantine/hooks` exports may be adopted as runtime deps; `@mantine/core` internals cannot be pulled in wholesale. Soribashi keeps its own implementation.
- **Disposition:** INTENTIONAL — no hook replacement possible; no `@mantine/hooks` analog exists
- **Test:** all tests in `packages/factory/test/hash-and-classname-parity.test.tsx`

### `hashStyleProps` — Task 1.6 re-walk confirmation (H1–H11)

- **File:** `packages/factory/src/hash-style-props.ts`
- **Mantine source:** `packages/@mantine/core/src/core/InlineStyles/hash-styles.ts` (commit 63dafbbf)
- **Summary:** Full re-walk in Task 1.6 confirms all HS-0x findings from Task 1.5 (HS-01 through HS-07). Three additional decision points audited in Task 1.6:
  - **H8 (key-order sensitivity):** Both soribashi and Mantine are sensitive to property insertion order in the `styles` object. Neither normalizes. This is safe because `parseStyleProps` builds style objects deterministically. `IDENTICAL`.
  - **H9 (collision handling):** Neither implementation handles hash collisions. Collision risk is negligible for deterministic, bounded style-prop inputs. `IDENTICAL`.
  - **H2 (hash algorithm):** Computationally verified: `x & 0xffffffff` then `>>> 0` (Mantine) and `>>> 0` applied once (soribashi) produce identical unsigned results. `IDENTICAL`.
- **No new findings beyond Task 1.5's HS-01 through HS-07.**
- **Disposition:** All previously-documented divergences (file location, prefix, serialization method, types) are confirmed INTENTIONAL; no new divergences found.
- **Test:** `packages/factory/test/hash-and-classname-parity.test.tsx` — H2a/H2b/H5a–H5c/H6a/H6b/H7a–H7c/H8a–H8b/H9a

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

### Task 1.5 — `inline-styles/` bundle audit findings

Captured during Task 1.5: parity audit of `packages/factory/src/inline-styles/` bundle.
Audit document: `docs/superpowers/audits/2026-04-25-tier-1-inline-styles.md`.
Parity tests: `packages/factory/test/inline-styles-parity.test.tsx`.

### `InlineStyles` — no `nonce` prop (IS-01)

- **File:** `packages/factory/src/inline-styles/InlineStyles.tsx`
- **Mantine source:** `packages/@mantine/core/src/core/InlineStyles/InlineStyles.tsx`
- **Mantine behavior:** Calls `useMantineStyleNonce()` and passes the result to `<style nonce={...}>` for CSP compliance.
- **Soribashi behavior:** No nonce support; `<style>` rendered without any `nonce` attribute.
- **Reason for divergence:** Soribashi's static CSS (emitted by `@soribashi/codegen`) doesn't require CSP nonces at runtime. The component is used for responsive style-prop overrides; adding nonce support is a deferred concern.
- **Disposition:** Keep as-is. Tracked in file header comment.

### `InlineStyles` — no `deduplicate` prop (IS-02)

- **File:** `packages/factory/src/inline-styles/InlineStyles.tsx`
- **Mantine source:** `packages/@mantine/core/src/core/InlineStyles/InlineStyles.tsx`
- **Mantine behavior:** When `deduplicate=true`, renders a React 19 resource-style `<style href="mantine-{hash}" precedence="mantine">` element, which React deduplicates in SSR and hydration.
- **Soribashi behavior:** No `deduplicate` prop; always renders an inline `<style>` with children.
- **Reason for divergence:** Soribashi's use of `InlineStyles` is always at per-instance class scope (every call site produces a unique selector), so deduplication via React 19 resource hoisting is not needed. If identical styles appear, the hash-based class name already deduplicates via class reuse at the component level.
- **Disposition:** Keep as-is.

### `InlineStyles` — no `data-mantine-styles` attribute (IS-03)

- **File:** `packages/factory/src/inline-styles/InlineStyles.tsx`
- **Mantine source:** `packages/@mantine/core/src/core/InlineStyles/InlineStyles.tsx`
- **Mantine behavior:** Adds `data-mantine-styles="inline"` on the non-deduplicated `<style>` element (used by Mantine's static class cleanup logic).
- **Soribashi behavior:** No `data-*` attribute on the rendered `<style>` element.
- **Reason for divergence:** Soribashi has no static class cleanup system. The attribute would have no consumers.
- **Disposition:** Keep as-is.

### `InlineStyles` — CSS output format with spaces (IS-04 / IS-10)

- **File:** `packages/factory/src/inline-styles/InlineStyles.tsx`
- **Mantine source:** `packages/@mantine/core/src/core/InlineStyles/css-object-to-string/css-object-to-string.ts`
- **Mantine behavior:** Compact format: `selector{prop:value;}` — no spaces. `@media(query){...}`.
- **Soribashi behavior:** Readable format: `selector { prop: value; }` — spaces after colons and inside braces. `@media (query) { ... }`.
- **Reason for divergence:** Cosmetic preference; functionally equivalent.
- **Disposition:** Keep as-is.

### `InlineStyles` — `media` prop is a Record, not an array (IS-05)

- **File:** `packages/factory/src/inline-styles/InlineStyles.tsx`
- **Mantine source:** `packages/@mantine/core/src/core/InlineStyles/styles-to-string/styles-to-string.ts`
- **Mantine behavior:** `media?: Array<{ query: string; styles: CSSProperties }>` — ordered array; allows duplicate queries.
- **Soribashi behavior:** `media: Record<string, Record<string, unknown>>` — a query→styles map; order follows `Object.entries` insertion order; duplicate query keys are not possible.
- **Reason for divergence:** Soribashi's callers (Box style-prop pipeline) build a breakpoint map keyed by query string. Array form would require wrapping in `Object.entries` at call sites. Map form is more ergonomic for the actual call pattern.
- **Disposition:** Keep as-is.

### `InlineStyles` — no `container` queries (IS-06)

- **File:** `packages/factory/src/inline-styles/InlineStyles.tsx`
- **Mantine source:** `packages/@mantine/core/src/core/InlineStyles/styles-to-string/styles-to-string.ts`
- **Mantine behavior:** `container?: Array<{ query: string; styles: CSSProperties }>` — generates `@container` rules.
- **Soribashi behavior:** No `container` prop.
- **Reason for divergence:** Container query support was deferred (see also: `SimpleGrid type='container'` deferred entry above).
- **Disposition:** Deferred.

### `InlineStyles` — `styles` type is `Record<string, unknown>` (IS-07)

- **File:** `packages/factory/src/inline-styles/InlineStyles.tsx`
- **Mantine source:** `packages/@mantine/core/src/core/InlineStyles/styles-to-string/styles-to-string.ts`
- **Mantine behavior:** `styles?: React.CSSProperties` — strict typed CSS object.
- **Soribashi behavior:** `styles: Record<string, unknown>` — looser type that accepts CSS custom properties and arbitrary string values without casts.
- **Reason for divergence:** Soribashi's Box pipeline injects CSS custom properties (e.g., `--padding-xs`) as style values. Using `React.CSSProperties` would require `as any` casts at every call site.
- **Disposition:** Keep as-is.

### `camelToKebab` — CSS custom properties pass through unchanged (IS-08 / CO-03)

- **File:** `packages/factory/src/inline-styles/InlineStyles.tsx`
- **Mantine source:** `packages/@mantine/core/src/core/utils/camel-to-kebab-case/camel-to-kebab-case.ts`
- **Mantine behavior:** `camelToKebabCase('--myColor')` → `'--my-color'` — the uppercase transform still applies to `--` prefixed strings, potentially renaming CSS custom properties.
- **Soribashi behavior:** `camelToKebab('--myColor')` → `'--myColor'` — short-circuits at `--` prefix; custom properties pass through unchanged.
- **Reason for divergence:** CSS custom properties are case-sensitive. `--myColor` and `--my-color` are different variables. Applying camelCase→kebab conversion to them is incorrect. Soribashi's guard is more correct.
- **Disposition:** Keep soribashi's behavior (superior).
- **Test:** `inline-styles-parity.test.tsx` IS-08a, IS-08b.

### `rulesFromStyles` — null values are filtered (IS-09 / CO-05)

- **File:** `packages/factory/src/inline-styles/InlineStyles.tsx`
- **Mantine source:** `packages/@mantine/core/src/core/InlineStyles/css-object-to-string/css-object-to-string.ts`
- **Mantine behavior:** `css[rule] !== undefined` — filters only `undefined`; `null` values would be serialized as the string `"null"` (invalid CSS).
- **Soribashi behavior:** `value !== undefined && value !== null` — filters both.
- **Reason for divergence:** Soribashi is more defensive. Emitting `prop:null;` is invalid CSS that browsers silently ignore, but it's unnecessary bytes and confusing in dev tools. Filtering `null` is the correct behavior.
- **Disposition:** Keep soribashi's behavior (superior).
- **Test:** `inline-styles-parity.test.tsx` IS-09a.

### `InlineStyles` — `styles` prop required vs optional (ST-02)

- **File:** `packages/factory/src/inline-styles/InlineStyles.tsx`
- **Mantine source:** `packages/@mantine/core/src/core/InlineStyles/styles-to-string/styles-to-string.ts`
- **Mantine behavior:** `styles?: React.CSSProperties` — optional; base rule omitted when absent.
- **Soribashi behavior:** `styles: Record<string, unknown>` — required; callers pass `{}` for media-only usage.
- **Reason for divergence:** All soribashi call sites provide `styles` explicitly. Making it optional adds no practical benefit and would require adding a null check. A future alignment is trivial.
- **Disposition:** Keep as-is. Low priority.

### `InlineStyles` — empty `styles` emitted empty base rule (ST-05 — FIXED)

- **File:** `packages/factory/src/inline-styles/InlineStyles.tsx`
- **Mantine behavior:** When `styles` is empty or falsy, no base rule is emitted in the output CSS.
- **Soribashi previous behavior:** Always emitted `selector { }` even when `styles` was `{}` or all values were null/undefined — a wasteful empty CSS rule.
- **Fix:** Added a guard: `const baseDecls = rulesFromStyles(styles); const baseRule = baseDecls ? \`...\` : '';` — base rule is only emitted when there are actual declarations.
- **Disposition:** Fixed. Tests: `inline-styles-parity.test.tsx` ST-05a–ST-05d.

### `hashStyleProps` — file location and serialization method (HS-01 / HS-07)

- **File:** `packages/factory/src/hash-style-props.ts`
- **Mantine source:** `packages/@mantine/core/src/core/InlineStyles/hash-styles.ts`
- **Mantine behavior:** Located inside `InlineStyles/` bundle; serializes styles via `cssObjectToString()` (camel→kebab + prop:value format).
- **Soribashi behavior:** Located at factory root (not inside `inline-styles/`); serializes via `JSON.stringify()`.
- **Reason for divergence:** File placement reflects soribashi's organizational choice (hash is a factory-level utility, not InlineStyles-specific). JSON serialization is simpler and sufficient for hashing — exact CSS format doesn't affect uniqueness.
- **Disposition:** Keep as-is.

### `hashStyleProps` — output prefix (HS-06)

- **File:** `packages/factory/src/hash-style-props.ts`
- **Mantine source:** `packages/@mantine/core/src/core/InlineStyles/hash-styles.ts`
- **Mantine behavior:** Output prefix `__mdi__-`.
- **Soribashi behavior:** Output prefix `sb-h-`.
- **Reason for divergence:** Soribashi uses its own prefix convention; `__mdi__` is Mantine-internal.
- **Disposition:** Keep as-is.

---

### Tier 2 — Theme batch (T2-A) entries

# Tier 2 Batch T2-A — Ledger Fragment

> This fragment is merged into `docs/superpowers/divergences/mantine-master.md` by the orchestrator during Phase 4.

**Pinned to:** `mantinedev/mantine@63dafbbf5f0135eb36455b7add4c0ddcd0f3240a`

---

## Full audit pass — 2026-04-25 — Batch T2-A (Theme)

### `composeTheme` / `mergeTokens` — missing `fontWeight`, `lineHeight`, `heading` fields (BUG — FIXED)

- **File:** `packages/theme/src/compose-theme.ts`
- **Mantine source:** `packages/@mantine/core/src/core/MantineProvider/merge-mantine-theme/merge-mantine-theme.ts` (commit 63dafbbf) — uses `deepMerge` which handles all fields generically
- **Mantine behavior:** `mergeMantineTheme` uses `deepMerge(currentTheme, themeOverride)` — a generic recursive merge that handles every property in the theme object without an explicit list.
- **Soribashi previous behavior:** `mergeTokens()` had an explicit list of fields to merge (`colors`, `radius`, `spacing`, `fontSize`, `fontFamily`, `shadow`, `breakpoint`, `zIndex`) but was missing `fontWeight`, `lineHeight`, and `heading`. These fields exist in `ThemeTokens` but were silently dropped when a child theme extended a base theme.
- **Soribashi new behavior:** `mergeTokens()` now includes `fontWeight` (shallow merge), `lineHeight` (shallow merge), and `heading` (merged via `mergeHeadingTokens()` which shallow-merges `sizes` per heading level and takes child `textWrap` over base).
- **Classification:** `BUG` — fields added to `ThemeTokens` during the blocks adaptation pass were not added to `mergeTokens`, causing silent data loss in extended themes.
- **Disposition:** Aligned — fixed.
- **Tests:** `packages/theme/test/compose-theme.test.ts` — CT-BUG-1 through CT-BUG-5

---

### `createTheme` — full normalization on creation (confirmation: already in ledger)

- **File:** `packages/theme/src/create-theme.ts`
- **Mantine source:** `packages/@mantine/core/src/core/MantineProvider/create-theme/create-theme.ts` (commit 63dafbbf)
- **Status:** Already documented in master ledger under "Kept (deliberate divergences from Mantine) / `createTheme` — full normalization on creation." This audit confirms the entry is still accurate.
- **Disposition:** Keep — no change needed.

---

### `createTheme` — `extends` field for recursive theme inheritance

- **File:** `packages/theme/src/create-theme.ts`
- **Mantine source:** `packages/@mantine/core/src/core/MantineProvider/merge-theme-overrides/merge-theme-overrides.ts` (commit 63dafbbf) — Mantine provides `mergeThemeOverrides(...overrides)` as the compositing utility; no `extends` keyword on the theme object itself
- **Mantine behavior:** Consumers pass multiple `MantineThemeOverride` objects to `mergeThemeOverrides(overrideA, overrideB, ...)` which deep-merges them left-to-right. There is no declarative `extends` relationship.
- **Soribashi behavior:** `ThemeDefinition.extends?: ThemeDefinition` — a child theme declares its base theme inline. `createTheme` recursively resolves the chain: `createTheme(definition.extends)` first, then `composeTheme(base, definition)`.
- **Reason for divergence:** Soribashi's `extends` pattern is more declarative and tracks the inheritance relationship inside the theme object. Useful for codegen tooling that needs to traverse the inheritance chain. Mantine's `mergeThemeOverrides` is equivalent in capability but the chain is opaque after composition.
- **Disposition:** Keep soribashi's `extends` approach.
- **Test:** `packages/theme/test/compose-theme.test.ts` — "extending a theme inherits base tokens", "child tokens override base tokens by key"

---

### `composeTheme` — component config replaced wholesale vs Mantine's deep-merge

- **File:** `packages/theme/src/compose-theme.ts`
- **Mantine source:** `packages/@mantine/core/src/core/MantineProvider/merge-mantine-theme/merge-mantine-theme.ts` (commit 63dafbbf) — uses `deepMerge` which merges component configs key-by-key
- **Mantine behavior:** Deep-merging a component override will merge each key of the component config (`classNames`, `styles`, `vars`, `defaultProps`) individually.
- **Soribashi behavior:** `{ ...base.components, ...(child.components ?? {}) }` — child entry for a component name REPLACES the entire base entry for that component.
- **Reason for divergence:** Soribashi's per-component replacement is simpler and more predictable. Deep-merging nested component configs (e.g., `defaultProps` within `components.Button`) can produce surprising partial-override results. A component author who overrides `components.Button` in a child theme typically intends to fully control that component's config.
- **Disposition:** Keep soribashi's replacement approach.
- **Test:** `packages/theme/test/compose-theme.test.ts` — "child component config replaces base component config"

---

### `defaultIntentResolver` — variant set adapted (confirmation: already in ledger)

- **File:** `packages/theme/src/default-intent-resolver.ts`
- **Mantine source:** `packages/@mantine/core/src/core/MantineProvider/color-functions/default-variant-colors-resolver/default-variant-colors-resolver.ts` (commit 63dafbbf)
- **Status:** Already documented in master ledger under "Validated and matching / `defaultIntentResolver`." This audit confirms the entry is still accurate.
- **Summary:** Soribashi's variant set `['filled', 'outline', 'subtle', 'ghost', 'link']` vs Mantine's `['filled', 'light', 'outline', 'subtle', 'transparent', 'white', 'gradient', 'default', 'none']`. Soribashi adds `ghost` and `link`; drops Mantine-specific variants. The CSS variable naming follows the substitution table.
- **Disposition:** Keep — intentional and documented.

---

### `defaultTokens` — semantic color families vs Mantine's named palette (confirmation + addition)

- **File:** `packages/theme/src/tokens/default-tokens.ts`
- **Mantine source:** `packages/@mantine/core/src/core/MantineProvider/default-colors.ts` + `default-theme.ts` (commit 63dafbbf)
- **Status:** The CSS Variable Layer audit (2026-04-25) already documents the color naming divergence as INTENTIONAL_GAP. This audit confirms that finding still holds.
- **Additional finding:** Mantine's `fontWeights.medium` is `'600'` (same as `semibold`). Soribashi sets `fontWeight.medium = '500'` (standard semantic weight) and adds `fontWeight.semibold = '600'`. This is a soribashi correction of what appears to be an unusual default in Mantine.
- **Disposition:** Keep soribashi's values. The `medium: '500'` / `semibold: '600'` distinction follows standard CSS font-weight semantics.

---

### `types.ts` — `ResolvedTheme` vs `MantineTheme` (architectural divergence)

- **File:** `packages/theme/src/types.ts`
- **Mantine source:** `packages/@mantine/core/src/core/MantineProvider/theme.types.ts` (commit 63dafbbf)
- **Mantine behavior:** `MantineTheme` is a runtime configuration object with runtime fields (`focusRing`, `scale`, `cursorType`, `respectReducedMotion`, etc.) used by components and the provider at render time.
- **Soribashi behavior:** `ResolvedTheme` is a build-time token + semantic configuration object. No runtime fields. Consumed by `@soribashi/codegen` (no React) and the minimal `SoribashiProvider` (React context only).
- **Reason for divergence:** Soribashi's design separates static token configuration (resolved at build time by codegen) from runtime component configuration (handled by the minimal provider context). Mantine conflates both because its CSS variables are emitted at runtime.
- **Disposition:** Keep soribashi's design. This is fundamental to the architecture.

### Tier 2 — Provider + types batch (T2-B) entries

# Tier 2 Batch T2-B — Ledger Fragment

**To be merged into `docs/superpowers/divergences/mantine-master.md` by the orchestrator in Phase 4.**

**Mantine commit:** `63dafbbf5f0135eb36455b7add4c0ddcd0f3240a`
**Audit doc:** `docs/superpowers/audits/2026-04-25-tier-2-provider-types.md`

---

## Full audit pass — 2026-04-25 — Batch T2-B entries

### `provider.tsx` — pre-existing ledger entries confirmed

The following entries already exist in the master ledger and are confirmed correct by this pass:

- **"SoribashiProvider — minimal context-only provider"** — all 8 decision points (P1–P8) map to this entry. No changes needed.
- **"useTheme — falls back to default theme outside provider"** — C2, C3, UT2, UT3 all confirmed by this entry. No changes needed.

No new ledger entries for `provider.tsx`, `context.ts`, or `use-theme.ts`.

---

### `types/polymorphic.ts` — `PolymorphicRenderProps` (soribashi addition)

- **File:** `packages/factory/src/types/polymorphic.ts`
- **Mantine source:** `packages/@mantine/core/src/core/factory/create-polymorphic-component.ts` (commit 63dafbbf)
- **Mantine behavior:** No `PolymorphicRenderProps` type. Mantine components call `useProps`, `useStyles` directly inside their render function. No `render` callback pattern.
- **Soribashi behavior:** `PolymorphicRenderProps<TOwnProps>` with `Element: ElementType; props: TOwnProps` is the object passed to the `render` callback of `definePolymorphicComponent`. It is a soribashi-only type for the constructor pattern.
- **Reason for divergence:** Soribashi addition. Required by the constructor model (already in ledger under "definePolymorphicComponent — higher-level constructor vs Mantine's type-cast utilities").
- **Disposition:** Keep — soribashi addition
- **Test:** `packages/factory/test/polymorphic-parity.test.tsx` — P13/P14 group (render callback receives Element and props)

---

### `types/polymorphic.ts` — `ComponentPropsWithRef` vs `ComponentProps` for ref inclusion (PL3)

- **File:** `packages/factory/src/types/polymorphic.ts`
- **Mantine source:** `packages/@mantine/core/src/core/factory/create-polymorphic-component.ts` (commit 63dafbbf)
- **Mantine behavior:** `PropsOf<C>` uses `React.ComponentProps<C>` (no explicit ref in props object; ref handled separately by `ref?: PolymorphicRef<C>` added inline).
- **Soribashi behavior:** Uses `ComponentPropsWithRef<TAs>` — ref is included in the inherited props surface automatically, then `RefAttributes<PolymorphicRef<TAs>>` is intersected via `PolymorphicComponentProps`.
- **Reason for divergence:** Soribashi's approach is more explicit about ref inclusion; both produce equivalent type shapes for callers.
- **Disposition:** Keep — INTENTIONAL, superior explicitness
- **Test:** Type-only; confirmed by polymorphic parity tests passing typecheck.

---

### `types/factory-payload.ts` — `ctx?` field omitted from FactoryPayload

- **File:** `packages/factory/src/types/factory-payload.ts`
- **Mantine source:** `packages/@mantine/core/src/core/factory/factory.tsx` (FactoryPayload line 7, commit 63dafbbf)
- **Mantine behavior:** `FactoryPayload.ctx?: any` — threaded through `StylesApiRecord` callback signature as `(theme, props, ctx)` to give compound components access to parent context.
- **Soribashi behavior:** No `ctx` field in `FactoryPayload`. Callbacks receive `(theme, props)` only.
- **Reason for divergence:** Consistent with the pre-existing decision to omit `stylesCtx` from `useStyles` (documented in ledger under "useStyles — simpler resolution model"). The `ctx` parameter is only useful when a component's styles depend on parent compound context. Soribashi's compound components use props directly.
- **Disposition:** Keep — INTENTIONAL, consistent with existing architecture
- **Test:** Type-only. Confirmed by all factory test files passing typecheck.

---

### `types/factory-payload.ts` — `signature?` field omitted from FactoryPayload

- **File:** `packages/factory/src/types/factory-payload.ts`
- **Mantine source:** `packages/@mantine/core/src/core/factory/factory.tsx` (FactoryPayload line 19, commit 63dafbbf)
- **Mantine behavior:** `FactoryPayload.signature?: any` — stores the generic component's call signature for `genericFactory`. The caller writes `signature: <Value extends Primitive>(props: SelectProps<Value>) => JSX.Element` in the payload and `genericFactory` re-casts to it.
- **Soribashi behavior:** No `signature` field. `defineGenericComponent` uses `GenericComponentFn` pattern — the component is always typed as `<T>(props: ...) => ...` without needing a payload slot.
- **Reason for divergence:** Soribashi's constructor approach encapsulates the generic type differently; the `signature` escape hatch is not needed. Already in ledger under "defineGenericComponent — GenericComponentFn type vs Mantine's Payload['signature']".
- **Disposition:** Keep — INTENTIONAL, consistent with constructor model
- **Test:** `packages/factory/test/generic-parity.test.tsx` — "G8: GenericComponentFn type — runtime shape"

---

### `types/factory-payload.ts` — `vars?: Record<string, string>` vs Mantine's `vars?: any`

- **File:** `packages/factory/src/types/factory-payload.ts`
- **Mantine source:** `packages/@mantine/core/src/core/factory/factory.tsx` (FactoryPayload line 11, commit 63dafbbf)
- **Mantine behavior:** `vars?: any` — completely untyped; the specific shape is enforced by `VarsResolver`/`PartialVarsResolver` types at call sites.
- **Soribashi behavior:** `vars?: Record<string, string>` — typed as a simple string record. This constrains what consumers can declare in their payload.
- **Reason for divergence:** Soribashi's stricter type is appropriate because CSS variable values are always strings. No behavioral impact; type-only improvement.
- **Disposition:** Keep — INTENTIONAL, superior type safety
- **Test:** Type-only.

---

### `types/props.ts` — `StylesApiProps` includes `className`, `style`, `children`

- **File:** `packages/factory/src/types/props.ts`
- **Mantine source:** `packages/@mantine/core/src/core/styles-api/styles-api.types.ts` (StylesApiProps, lines 52-59, commit 63dafbbf)
- **Mantine behavior:** `StylesApiProps` has: `unstyled?`, `variant?`, `classNames?`, `styles?`, `vars?`, `attributes?`. Common DOM props (`className`, `style`, `children`) are added separately in each component's own props interface.
- **Soribashi behavior:** `StylesApiProps` additionally includes `className?`, `style?`, `children?`. These are bundled in for ergonomics — components don't have to re-declare them.
- **Reason for divergence:** Soribashi addition for ergonomics. All components accept these props; bundling reduces boilerplate.
- **Disposition:** Keep — INTENTIONAL, soribashi ergonomic addition
- **Test:** Covered by all `getStyles` call sites in the test suite; confirmed by typecheck.

---

### `types/props.ts` — `variant` omitted from `StylesApiProps`

- **File:** `packages/factory/src/types/props.ts`
- **Mantine source:** `packages/@mantine/core/src/core/styles-api/styles-api.types.ts` (line 54, commit 63dafbbf)
- **Mantine behavior:** `StylesApiProps` includes `variant?: Payload['variant'] extends string ? Payload['variant'] | (string & {}) : string` — the variant prop with an open-ended union allowing custom string variants alongside typed ones.
- **Soribashi behavior:** `variant` is NOT in `StylesApiProps`. Components that accept `variant` declare it in their own props type.
- **Reason for divergence:** Soribashi architectural choice — `variant` is component-specific, not a universal Styles API prop. Components declare it in their payload `variant` field and expose it in their own props interface. `useStyles` reads `props.variant` for CSS class generation. Equivalent result; different structural placement.
- **Disposition:** Keep — INTENTIONAL
- **Test:** `packages/factory/test/use-styles-parity.test.tsx` — variant-related branches pass with props.variant.

---

### `types/props.ts` — compound-component gating absent from `Attributes<P>` and `ClassNames<P>`/`Styles<P>`

- **File:** `packages/factory/src/types/props.ts`
- **Mantine source:** `packages/@mantine/core/src/core/styles-api/styles-api.types.ts` (StylesApiRecord lines 18-33, Attributes lines 42-46, commit 63dafbbf)
- **Mantine behavior:** When `Payload['compound'] extends true`, `StylesApiRecord` restricts to a plain record (no function form). `Attributes` becomes `never` for compound components.
- **Soribashi behavior:** No compound branching — `ClassNames<P>`, `Styles<P>`, and `Attributes<P>` have the same shape regardless of `compound`.
- **Reason for divergence:** Consistent with the simpler `useStyles` architecture. Soribashi's compound components are handled by convention (using the `compound: true` flag in the payload), not by type-level restriction.
- **Disposition:** Keep — INTENTIONAL, consistent with simpler architecture
- **Test:** Type-only.

---

### `types/render-context.ts` — full soribashi addition (no Mantine analog)

- **File:** `packages/factory/src/types/render-context.ts`
- **Mantine source:** No direct analog (commit 63dafbbf)
- **Mantine behavior:** Components call `const { className, style, ...others } = getStyles('root')` but this is not typed via a shared result type — Mantine's `getStyles` return type is inferred at each call site.
- **Soribashi behavior:** `GetStylesResult`, `GetStylesFn<P>`, `GetStylesOptions`, and `RenderContext<P>` are explicit shared types passed to every component render callback.
- **Reason for divergence:** Soribashi's constructor model requires explicit typing for the render callback parameter. These types are the soribashi-only "plumbing" for the constructor pattern.
- **Disposition:** Keep — soribashi addition, required by constructor model
- **Test:** Type-only; confirmed by all `defineComponent`/`definePolymorphicComponent`/`defineGenericComponent` tests passing.

---

## Coverage manifest rows (Batch T2-B)

```
| packages/factory/src/provider/provider.tsx | core/MantineProvider/MantineProvider.tsx | 2 | intentional divergence | 2026-04-25-tier-2-provider-types.md | SoribashiProvider-minimal (pre-existing) |
| packages/factory/src/provider/context.ts | core/MantineProvider/Mantine.context.ts | 2 | intentional divergence | 2026-04-25-tier-2-provider-types.md | useTheme-default-fallback (pre-existing), SoribashiProvider-minimal (pre-existing) |
| packages/factory/src/provider/use-theme.ts | core/MantineProvider/Mantine.context.ts (useMantineContext) | 2 | intentional divergence | 2026-04-25-tier-2-provider-types.md | useTheme-default-fallback (pre-existing) |
| packages/factory/src/types/polymorphic.ts | core/factory/create-polymorphic-component.ts | 2 | intentional divergence | 2026-04-25-tier-2-provider-types.md | PolymorphicComponentProps-own-props-win (pre-existing), PolymorphicRenderProps-addition (new), ComponentPropsWithRef-vs-ComponentProps (new) |
| packages/factory/src/types/factory-payload.ts | core/factory/factory.tsx (FactoryPayload) | 2 | intentional divergence | 2026-04-25-tier-2-provider-types.md | FactoryPayload-ctx-omitted (new), FactoryPayload-signature-omitted (new), FactoryPayload-vars-typed (new) |
| packages/factory/src/types/props.ts | core/styles-api/styles-api.types.ts | 2 | intentional divergence | 2026-04-25-tier-2-provider-types.md | StylesApiProps-className-style-children (new), StylesApiProps-variant-omitted (new), StylesApiProps-compound-gating-absent (new) |
| packages/factory/src/types/render-context.ts | (no direct analog) | 2 | soribashi addition | 2026-04-25-tier-2-provider-types.md | RenderContext-soribashi-addition (new) |
```

### Tier 2 — Factory soribashi-additions batch (T2-C) entries

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

### Tier 2 — Box style-props batch (T2-D) entries

# Tier 2 Batch T2-D — Ledger Fragment

**For:** `docs/superpowers/divergences/mantine-master.md` → "Full audit pass — 2026-04-25"
**Batch:** T2-D (Box style-props)
**Date:** 2026-04-25
**Mantine commit:** `63dafbbf5f0135eb36455b7add4c0ddcd0f3240a`

---

## Aligned (fixed in this audit)

### `getBoxMod` — numeric `0` filter (GBM-Z1) → Aligned

- **File:** `packages/blocks/src/Box/get-box-mod.ts`
- **Mantine source:** `packages/@mantine/core/src/core/Box/get-box-mod/get-box-mod.ts` (commit 63dafbbf)
- **Mantine behavior:** `getMod` filters: `undefined | '' | false | null`. Does NOT filter numeric `0`. `mod={{ count: 0 }}` produces `{ 'data-count': 0 }`.
- **Soribashi previous behavior:** Also filtered `v === 0`, silently dropping `mod={{ count: 0 }}` entries.
- **Fix:** Removed `|| v === 0` from the filter guard.
- **Classification:** `BUG` → aligned
- **Disposition:** Aligned
- **Test:** `packages/blocks/test/Box/get-box-mod-zero.test.ts` — GBM-Z1a through GBM-Z1g

### `parseStyleProps` — base-only `{ base: value }` treated as non-responsive (PSP-B1) → Aligned

- **File:** `packages/blocks/src/Box/style-props/parse-style-props.ts`
- **Mantine source:** `packages/@mantine/core/src/core/Box/style-props/parse-style-props/parse-style-props.ts` (commit 63dafbbf)
- **Mantine behavior:** `hasResponsiveStyles(styleProp)` returns `false` when the style prop object has exactly one key and that key is `'base'`. The value is resolved as a flat inline style.
- **Soribashi previous behavior:** `isResponsiveValue({ base: 'md' })` returned `true` because the `k === 'base'` check triggered. This caused an unnecessary `<InlineStyles>` tag and random class name to be generated even when no actual breakpoint-based styles were needed.
- **Fix:** Added early return in `isResponsiveValue`: `if (keys.length === 1 && keys[0] === 'base') return false`. Added `getBaseValue()` helper to extract the base value for the non-responsive path.
- **Classification:** `BUG` → aligned
- **Disposition:** Aligned
- **Test:** `packages/blocks/test/Box/parse-style-props-base-only.test.ts` — PSP-B1a through PSP-B1e

---

## Kept (deliberate divergences confirmed in this audit)

### `getBoxMod` — returns `{}` vs Mantine's `null` for falsy input

- **File:** `packages/blocks/src/Box/get-box-mod.ts`
- **Mantine source:** `packages/@mantine/core/src/core/Box/get-box-mod/get-box-mod.ts` (commit 63dafbbf)
- **Mantine behavior:** `getBoxMod(!mod)` returns `null` (spread as `{...null}` → `{}`).
- **Soribashi behavior:** Returns `{}` directly.
- **Reason:** Cosmetically different; functionally identical (spreading `null` and `{}` are equivalent). Soribashi's `{}` is marginally clearer.
- **Disposition:** Keep as-is.

### `style-props-data.ts` — function references vs type strings

- **File:** `packages/blocks/src/Box/style-props/style-props-data.ts`
- **Mantine source:** `packages/@mantine/core/src/core/Box/style-props/style-props-data.ts` (commit 63dafbbf)
- **Mantine behavior:** Each entry has `type: 'spacing' | 'color' | ...` (a string key); resolvers are looked up from a `resolvers` map at call time.
- **Soribashi behavior:** Each entry has `resolver: getSpacing | getThemeColor | ...` (a direct function reference); no indirection.
- **Reason:** Soribashi's approach avoids the resolver registry indirection, is more tree-shakeable, and aligns with TypeScript's preference for explicit imports. Observable behavior is identical.
- **Disposition:** Keep soribashi's direct function references.

### `style-props-data.ts` — `bd` uses `identity` resolver vs Mantine's `borderResolver`

- **File:** `packages/blocks/src/Box/style-props/style-props-data.ts`
- **Mantine source:** `packages/@mantine/core/src/core/Box/style-props/resolvers/border-resolver/border-resolver.ts` (commit 63dafbbf)
- **Mantine behavior:** `bd` uses `borderResolver` which understands Mantine's color token syntax for border colors (e.g., `'1px solid red.6'`).
- **Soribashi behavior:** `bd` uses `identity` — accepts raw CSS border values as-is.
- **Reason:** Soribashi has no Mantine-style color index system. Consumers write full CSS values or use `var(--color-...)` syntax explicitly.
- **Disposition:** Keep soribashi's identity resolver for `bd`.

### `style-props-data.ts` — `ff` uses `identity` vs Mantine's `fontFamilyResolver`

- **File:** `packages/blocks/src/Box/style-props/style-props-data.ts`
- **Mantine source:** `packages/@mantine/core/src/core/Box/style-props/resolvers/font-family-resolver/font-family-resolver.ts` (commit 63dafbbf)
- **Mantine behavior:** `fontFamilyResolver` maps `'monospace'` → `var(--mantine-font-family-monospace)`, `'text'` → `var(--mantine-font-family)`, `'heading'` → `var(--mantine-font-family-headings)`.
- **Soribashi behavior:** `ff` uses `identity` — accepts raw CSS values. Consumers write `var(--font-family-mono)` or `var(--font-family-sans)` explicitly.
- **Reason:** Soribashi's `ff` token shortcuts (`'mono'`, `'heading'`, `'sans'`) were not implemented as resolver magic because the API would require updating the resolver when new font families are added. Explicit `var()` references are more transparent.
- **Disposition:** Keep soribashi's identity resolver for `ff`. This is a candidate (e) "missing port" for a future enhancement: add a `fontFamilyResolver` that maps soribashi token names.

### `parse-style-props.ts` — `media` output type: `Record` vs sorted `Array`

- **File:** `packages/blocks/src/Box/style-props/parse-style-props.ts`
- **Mantine source:** `packages/@mantine/core/src/core/Box/style-props/parse-style-props/sort-media-queries.ts` (commit 63dafbbf)
- **Mantine behavior:** `parseStyleProps` calls `sortMediaQueries` which converts the media `Record` to a sorted `Array<{ query, styles }>` in ascending min-width order. Mantine's `InlineStyles` expects an array.
- **Soribashi behavior:** `parseStyleProps` outputs `media: Record<string, Record<string, string>>`. Breakpoints are added in BREAKPOINT_KEYS order (`xs`→`xl`), which is already ascending. Soribashi's `InlineStyles` accepts a `Record`. Sort is implicitly correct by insertion order.
- **Reason:** IS-05 (already in ledger) — soribashi's `InlineStyles` uses a Record API, which is more ergonomic for the box's call sites. The effective CSS output order is the same.
- **Disposition:** Keep soribashi's Record approach (matches IS-05 ledger entry).

### `extract-style-props.ts` — data-driven loop vs explicit destructuring

- **File:** `packages/blocks/src/Box/style-props/extract-style-props.ts`
- **Mantine source:** `packages/@mantine/core/src/core/Box/style-props/extract-style-props/extract-style-props.ts` (commit 63dafbbf)
- **Mantine behavior:** Explicit destructuring enumerates every known style prop key + visibility props. Result is passed through `filterProps` to remove undefined.
- **Soribashi behavior:** Data-driven loop over `STYLE_PROPS_DATA` keys. Visibility props (`hiddenFrom`/`visibleFrom`/`lightHidden`/`darkHidden`/`sx`) are not in the data table, so they always land in `rest`. They're also stripped before `extractStyleProps` is called in Box.tsx.
- **Reason:** Soribashi's approach is extensible — adding a new prop to STYLE_PROPS_DATA automatically handles it in `extractStyleProps`. Mantine's approach requires updating the destructuring in two places (STYLE_PROPS_DATA and extract-style-props).
- **Disposition:** Keep soribashi's data-driven approach.

### `Box.tsx` — `sx` prop consumed but not applied

- **File:** `packages/blocks/src/Box/Box.tsx`
- **Mantine source:** `packages/@mantine/core/src/core/Box/Box.tsx` (commit 63dafbbf) — `useMantineSxTransform()(styleProps.sx)` applies sx CSS-in-JS object
- **Mantine behavior:** Applies sx via a configurable sx transform, result merged into className.
- **Soribashi behavior:** `sx` is destructured and discarded (`sx: _sx`). The prop exists in BoxOwnProps to prevent DOM leakage.
- **Reason:** Soribashi uses static CSS classes + inline style vars; no runtime CSS-in-JS. `sx` is preserved as an escape hatch type for later integration.
- **Disposition:** Keep as-is. (Pre-existing intentional divergence, fix #5 in post-adaptation pass.)

### `Box.tsx` — no `renderRoot` prop

- **File:** `packages/blocks/src/Box/Box.tsx`
- **Mantine source:** `packages/@mantine/core/src/core/Box/Box.tsx` (commit 63dafbbf) — `renderRoot` renders via a provided function instead of an element
- **Mantine behavior:** When `renderRoot` is a function, calls it with the merged props instead of rendering `<Element>`.
- **Soribashi behavior:** No `renderRoot` prop. Polymorphism is handled at the `as` prop level via `definePolymorphicComponent`.
- **Reason:** Soribashi's polymorphic factory provides equivalent capability via the `as` prop and the `render` callback. `renderRoot` is an escape hatch for exotic portal-style patterns not yet encountered in soribashi's usage.
- **Disposition:** Keep as-is.

### `Box.tsx` — no `__vars`, `__size`, `size` props

- **File:** `packages/blocks/src/Box/Box.tsx`
- **Mantine source:** `packages/@mantine/core/src/core/Box/Box.tsx` (commit 63dafbbf)
- **Mantine behavior:** `__vars` injects CSS custom properties; `__size` sets the `size` HTML attribute; `size` sets `data-size` (when not number-like).
- **Soribashi behavior:** None of these props are present on soribashi's Box.
- **Reason:** `__vars` → soribashi's `varsResolver` in `useStyles` handles CSS var injection; `__size`/`size` → Mantine-internal plumbing for component variants; no equivalent system in soribashi.
- **Disposition:** Keep as-is.

### `Box.types.ts` — soribashi-only props (`sx`, `lightHidden`, `darkHidden`)

- **File:** `packages/blocks/src/Box/Box.types.ts`
- **Mantine source:** `packages/@mantine/core/src/core/Box/Box.tsx` (commit 63dafbbf) — `lightHidden`/`darkHidden` are in Mantine's `BoxProps`; `sx` is in Mantine's `BoxProps` via the extract-style-props destructuring.
- **Mantine behavior:** Both present in BoxProps.
- **Soribashi behavior:** Both present in BoxOwnProps. No divergence for `lightHidden`/`darkHidden`/`sx`. The `sx` type in soribashi is `Record<string, unknown>` vs Mantine's implicit `any` type — intentionally typed to prevent escape hatch abuse.
- **Disposition:** Keep soribashi's explicit `sx: Record<string, unknown>` typing.

---

## (e) Missing-port candidates

| Mantine feature | Description | Soribashi value | Effort |
|---|---|---|---|
| `fontFamilyResolver` in style-props | Maps `'mono'`/`'heading'`/`'sans'` to soribashi's CSS var names for the `ff` prop | Ergonomic: `ff="mono"` instead of `ff="var(--font-family-mono)"` | S |
| `borderResolver` in style-props | Understands soribashi color token syntax in `bd` values | Ergonomic: `bd="1px solid primary.300"` | M |
| `sortMediaQueries` as standalone export | Sorts a Record of breakpoint queries into ascending order | Useful for any consumer building a custom responsive prop system | S |

### Tier 2 — Codegen batch (T2-E) entries

# Tier 2 Batch T2-E — Ledger Fragment

**For orchestrator:** Merge this file into `docs/superpowers/divergences/mantine-master.md` under the "Full audit pass — 2026-04-25" section during Phase 4 consolidation, then delete this file.

---

## Aligned (soribashi corrected to match Mantine / complete expected behavior)

### `emit-css.ts` — missing breakpoint token emission (BUG-E-1)

- **File:** `packages/codegen/src/emit-css.ts`
- **Mantine source:** `packages/@mantine/core/src/core/MantineProvider/MantineCssVariables/default-css-variables-resolver.ts` (commit 63dafbbf) — `assignSizeVariables(result.variables, theme.breakpoints, 'breakpoint')`
- **Mantine behavior:** Always emits `--mantine-breakpoint-{xs|sm|md|lg|xl}` in the shared variables block.
- **Soribashi previous behavior:** `emitTokenLines()` had no `tokens.breakpoint` iteration block. `--breakpoint-*` vars were never emitted.
- **Soribashi new behavior:** `if (tokens.breakpoint)` block added after the shadow block; emits `--breakpoint-{key}: {value}` for all breakpoint entries.
- **Reason for drift:** Omission during initial implementation — breakpoints were typed but the emission loop was not added.
- **Disposition:** Aligned.
- **Test:** `packages/codegen/test/emit-css-emitter-logic.test.ts` — "BUG-E-1: breakpoint emission" suite (3 tests).
- **Also tracked in:** `docs/superpowers/audits/2026-04-25-css-variable-parity.md` BUG-1 (the V3 audit documented this finding; this batch closes it in the emitter-logic audit and confirms the fix is present).

### `emit-css.ts` — `emitDarkTokenLines()` incomplete token coverage (BUG-E-2)

- **File:** `packages/codegen/src/emit-css.ts`
- **Mantine source:** `packages/@mantine/core/src/core/MantineProvider/MantineCssVariables/default-css-variables-resolver.ts` (commit 63dafbbf) — the `dark` section includes all scheme-specific vars including typography.
- **Mantine behavior:** The dark section of the CSS variables output covers all token categories that have scheme-specific values.
- **Soribashi previous behavior:** `emitDarkTokenLines()` handled only: `colors`, `radius`, `spacing`, `fontSize`, `shadow`. Dark overrides for `fontFamily`, `fontWeight`, `lineHeight`, `breakpoint`, and `heading` were silently dropped.
- **Soribashi new behavior:** `emitDarkTokenLines()` now handles all `PartialThemeTokens` fields, including the five previously missing ones. Each uses the same undefined-guard pattern as the existing code.
- **Reason for drift:** Incremental implementation — the five token categories were added to `ThemeTokens` / `PartialThemeTokens` after the initial dark-mode emission code was written and the dark emitter was not updated.
- **Disposition:** Aligned.
- **Test:** `packages/codegen/test/emit-css-emitter-logic.test.ts` — "BUG-E-2: dark override completeness" suite (6 tests).

---

## Kept (deliberate divergences from Mantine)

### `emit-css.ts` — deterministic sort order vs. insertion-order iteration

- **File:** `packages/codegen/src/emit-css.ts`
- **Mantine source:** `default-css-variables-resolver.ts` (commit 63dafbbf) — uses `keys(sizes).forEach()` without explicit sort.
- **Mantine behavior:** Iterates object keys in JS insertion order (effectively: the order the theme was built).
- **Soribashi behavior:** All token iteration uses `.sort(byKey)` (localeCompare alphabetical) for deterministic output regardless of input key order.
- **Reason for divergence:** Soribashi is a build-time codegen tool; CSS output must be byte-identical across runs on any runtime. JS insertion order is non-deterministic in some edge cases and across different Object.keys() implementations.
- **Disposition:** Keep soribashi's sorted output.
- **Test:** `packages/codegen/test/emit-css-emitter-logic.test.ts` — "sort order" suite.

### `emit-css.ts` — single dark-class block vs. Mantine's attribute-scheme blocks

- **File:** `packages/codegen/src/emit-css.ts`
- **Mantine source:** `convert-css-variables.ts` (commit 63dafbbf) — produces `:root[data-mantine-color-scheme="dark"] { ... }` and `:root[data-mantine-color-scheme="light"] { ... }` blocks.
- **Mantine behavior:** Color scheme is toggled by setting `data-mantine-color-scheme` attribute on the root element.
- **Soribashi behavior:** Color scheme is toggled by adding/removing the `.dark` class on `<html>`. The dark CSS block is `{darkMode.selector}` (default `.dark`).
- **Reason for divergence:** Soribashi integrates with Tailwind's dark mode strategy (`class` mode). The `.dark` class on `<html>` is the Tailwind convention and aligns with Soribashi's Tailwind-first design.
- **Disposition:** Keep soribashi's class-based dark mode selector.
- **Test:** `packages/codegen/test/emit-css-emitter-logic.test.ts` — "conditional dark block emission" suite.

### `emit-css.ts` — per-level heading vars vs. Mantine's single global heading-font-weight

- **File:** `packages/codegen/src/emit-css.ts`
- **Mantine source:** `default-css-variables-resolver.ts` — emits one `--mantine-heading-font-weight` from `theme.headings.fontWeight`.
- **Mantine behavior:** Single global heading font weight; per-level `--mantine-h1-font-weight` etc. still emitted but fall back to the global.
- **Soribashi behavior:** Emits `--heading-{h1-h6}-font-weight` per level only when the per-level `fontWeight` is defined. No implicit global fallback in the emitter (CSS cascade handles fallback).
- **Reason for divergence:** Soribashi's explicit-token-only approach avoids emitting vars with undefined values. The CSS cascade provides the equivalent of Mantine's global fallback.
- **Disposition:** Keep soribashi's per-level explicit emission.
- **Test:** `packages/codegen/test/emit-css-emitter-logic.test.ts` — "omits --heading-{n}-font-weight when size.fontWeight is undefined".

### `emit-css.ts` — soribashi emits color-scheme-independent base block; Mantine emits scheme-specific light/dark blocks for semantic vars

- **File:** `packages/codegen/src/emit-css.ts`
- **Mantine source:** `default-css-variables-resolver.ts` — `light` and `dark` sections each have full copies of semantic vars with scheme-specific values.
- **Mantine behavior:** `--mantine-color-text` is hardcoded per-scheme (black in light, `var(--mantine-color-dark-0)` in dark).
- **Soribashi behavior:** Semantic vars (`--text-*`, `--surface-*`, `--border-*`) are emitted once in the base scope, pointing at color token vars (e.g., `--text-default: var(--color-neutral-900)`). Dark mode flips are achieved by overriding the underlying color tokens in the `.dark` block.
- **Reason for divergence:** Soribashi uses CSS custom property cascade: dark-mode color tokens are overridden in the `.dark` scope, so semantic vars that reference them automatically get dark values without re-emitting the semantic vars. Cleaner, fewer total vars.
- **Disposition:** Keep soribashi's cascade-based approach.
- **Test:** `packages/codegen/test/emit-css-emitter-logic.test.ts` — "semanticToVar reference resolution" suite.

---

## Soribashi Additions (no Mantine analog)

### `load-config.ts` — build-time config loader

- **File:** `packages/codegen/src/load-config.ts`
- **Mantine analog:** None. Mantine is runtime-only via `<MantineProvider>`.
- **Justification:** Soribashi's codegen is a build-time tool that reads a config file from disk and generates static CSS/Tailwind output. `load-config.ts` is the file-loading bridge: it converts a path to a `file://` URL, dynamically imports the TS/JS config file (via Bun's native TS loader), and validates the required fields (`theme`, `output.css`). There is no Mantine equivalent because Mantine's "configuration" is always provided at runtime via React props.
- **Disposition:** Soribashi addition — justified by the build-time codegen architecture.

### `emit-tailwind-v3.ts` — Tailwind v3 config emitter

- **File:** `packages/codegen/src/emit-tailwind-v3.ts`
- **Mantine analog:** None. Mantine doesn't generate Tailwind configs.
- **Justification:** Soribashi supports Tailwind-first usage. The v3 emitter maps soribashi token keys to Tailwind v3 `theme.extend` keys, enabling utility classes like `bg-primary-500/50` (via the `<alpha-value>` pattern) and `rounded-md`, `p-lg`, etc. The emitter follows canonical Tailwind v3 conventions (colors with alpha-value, breakpoints as `screens`, numeric/dashed keys quoted).
- **Disposition:** Soribashi addition — no Mantine equivalent exists or is needed.

### `emit-tailwind-v4.ts` — Tailwind v4 `@theme` block emitter

- **File:** `packages/codegen/src/emit-tailwind-v4.ts`
- **Mantine analog:** None. Mantine doesn't generate Tailwind v4 `@theme` blocks.
- **Justification:** Soribashi supports Tailwind v4 usage. The v4 emitter uses Tailwind v4's CSS-as-source-of-truth model (`@theme { --color-*: ...; }`). Key namespace differences from emit-css.ts: `--text-*` for font sizes, `--font-*` for font families, `--leading-*` for line heights, `--breakpoint-*` for breakpoints — all matching Tailwind v4's built-in token resolution namespaces. No `hsl(var() / <alpha-value>)` wrapping needed because v4 handles opacity natively.
- **Disposition:** Soribashi addition — no Mantine equivalent exists or is needed.

---

## Roadmap Batch 1 — 2026-04-25

Five items from `docs/superpowers/roadmap/mantine-derivable-future-work.md` ported into soribashi. Spec: `docs/superpowers/specs/2026-04-25-roadmap-batch-1-design.md`. Plan: `docs/superpowers/plans/2026-04-25-plan-roadmap-batch-1.md`.

### `CompoundStylesApiProps<P>` — direct port

- **File:** `packages/factory/src/types/props.ts`
- **Mantine source:** `packages/@mantine/core/src/core/styles-api/styles-api.types.ts` (commit 63dafbbf)
- **Mantine behavior:** `Omit<StylesApiProps, 'unstyled' | 'attributes'>` — variant for compound subcomponents.
- **Soribashi behavior:** Identical port. Same `Omit`, same purpose.
- **Disposition:** Aligned (added)
- **Test:** `packages/factory/test/compound-styles-api-props.test-d.ts`

### `removeDefaultVariables` — operates on `ResolvedTheme` not `ConvertCSSVariablesInput`

- **File:** `packages/codegen/src/remove-default-variables.ts`
- **Mantine source:** `packages/@mantine/core/src/core/MantineProvider/MantineCssVariables/remove-default-variables.ts` (commit 63dafbbf)
- **Mantine behavior:** Diffs `ConvertCSSVariablesInput` (`{variables, light, dark}`) against the default theme's emit output, key by key.
- **Soribashi behavior:** Diffs a `ResolvedTheme` (in-memory token tree) against `defaultTokens` / `defaultDarkTokens`. Returns a diff'd `ResolvedTheme` that the existing `emitCss` pipeline consumes.
- **Reason for divergence:** Soribashi's codegen runs at build time and operates on the in-memory token tree. Mantine's runs at render time on the post-emit CSS-var shape. Equivalent semantics, different layer.
- **Disposition:** Aligned (added). Surface: `emitCss(theme, { removeDefaultVariables: true })`.
- **Test:** `packages/codegen/test/remove-default-variables.test.ts` + `emit-css.test.ts` integration tests.

### `cssVariablesResolver` — build-time escape hatch (not render-time)

- **File:** `packages/codegen/src/emit-css.ts` (option) + `packages/codegen/src/types.ts` (type export)
- **Mantine source:** `packages/@mantine/core/src/core/MantineProvider/MantineProvider.tsx` `cssVariablesResolver` prop (commit 63dafbbf)
- **Mantine behavior:** Provider prop. Runs at render time, receives the theme and current color scheme, returns `{ variables, light, dark }`. Mantine merges the result with its default resolver's output.
- **Soribashi behavior:** `EmitCssOptions.cssVariablesResolver: (theme: ResolvedTheme) => CssVariablesAddition`. Runs at codegen build time. Output appended to the `:root`, `.dark`, and (optionally) per-scope blocks.
- **Reason for divergence:** Soribashi's codegen runs at build time. There is no provider hook to run a resolver from. The emit-time escape hatch achieves the same goal (consumer-injected vars) at the appropriate architectural layer.
- **Disposition:** Kept (intentional architectural divergence)
- **Test:** `packages/codegen/test/emit-css.test.ts` — `cssVariablesResolver` describe block (5 tests).

### `fontFamilyResolver` — soribashi token-name adaptation

- **File:** `packages/blocks/src/Box/style-props/resolvers/font-family-resolver.ts`
- **Mantine source:** `packages/@mantine/core/src/core/Box/style-props/resolvers/font-family-resolver/font-family-resolver.ts` (commit 63dafbbf)
- **Mantine behavior:** Alias map for `text/mono/monospace/heading/headings` keys → corresponding Mantine font-family CSS vars.
- **Soribashi behavior:** Same shape. Token names: `text/sans` → `var(--font-family-sans)`, `mono/monospace` → `var(--font-family-mono)`, `heading/headings` → `var(--font-family-heading)`. Soribashi adds `sans` as an alias to match the soribashi `tokens.fontFamily.sans` key.
- **Disposition:** Aligned (TOKEN_DIFF + soribashi alias addition)
- **Test:** `packages/blocks/test/Box/font-family-resolver.test.ts` (10 tests) + ff-resolver tests in `style-props.test.ts`.

### `borderResolver` — `(value)` signature without theme

- **File:** `packages/blocks/src/Box/style-props/resolvers/border-resolver.ts`
- **Mantine source:** `packages/@mantine/core/src/core/Box/style-props/resolvers/border-resolver/border-resolver.ts` (commit 63dafbbf)
- **Mantine behavior:** `(value, theme) => string`. Splits `"size style color"` and calls `colorResolver(color, theme)`.
- **Soribashi behavior:** `(value) => string | undefined`. Splits `"size style color"` and calls `getThemeColor(color)`. No `theme` arg required because `getThemeColor` returns CSS variable references resolved at paint time, not values from the theme tree.
- **Reason for divergence:** Soribashi's `getThemeColor` is a pure function that returns `var(--color-*)` references. The runtime resolves the var; soribashi's resolver doesn't need the theme at codegen time. Color syntax: soribashi uses `primary.500` (50–950 shade scale); Mantine uses `primary.5` (0–9 shade scale).
- **Disposition:** Kept (signature divergence; same observable behavior)
- **Test:** `packages/blocks/test/Box/border-resolver.test.ts` (10 tests) + bd-resolver tests in `style-props.test.ts`.
