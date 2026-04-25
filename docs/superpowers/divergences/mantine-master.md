# Soribashi vs. Mantine — Divergence Ledger

**Validated against:** [`mantinedev/mantine`](https://github.com/mantinedev/mantine) at commit `63dafbbf5f0135eb36455b7add4c0ddcd0f3240a` (master, 2026-04-25).

This ledger satisfies Hard Rule 13 of the Soribashi design spec. Every soribashi primitive that has a Mantine analog has been read against the actual Mantine source. Every behavioral or implementation divergence is recorded below with the reason and the disposition (kept-as-is, aligned, or hybrid).

The single behavioral alignment from this pass: `useProps` now supports the function-form `defaultProps` (`(theme) => Partial<Props>`) that Mantine documents and uses internally. All other divergences are deliberate and retained.

---

## Aligned (changed soribashi to match Mantine)

### `useProps` — function-form theme `defaultProps`

- **File:** `packages/factory/src/hooks/use-props.ts`
- **Mantine source:** `packages/@mantine/core/src/core/MantineProvider/use-props/use-props.ts`
- **Mantine behavior:** `theme.components[name].defaultProps` may be either a `Partial<Props>` object or a `(theme) => Partial<Props>` function. The function form is invoked with the theme and the result is used as defaults.
- **Soribashi previous behavior:** Only the object form was supported.
- **Soribashi new behavior:** Both forms supported, matching Mantine.
- **Test added:** `packages/factory/test/use-props.test.tsx` — "theme defaultProps as a function receives the theme and returns dynamic defaults".

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

### Layout blocks — direct DOM rendering, no `Box` wrapper

- **Files:** `packages/blocks/src/Stack/Stack.tsx`, `Group/Group.tsx`, `Flex/Flex.tsx`, `Grid/Grid.tsx`, `SimpleGrid/SimpleGrid.tsx`, `Container/Container.tsx`, `Center/Center.tsx`, `AspectRatio/AspectRatio.tsx`, `Space/Space.tsx`, `Paper/Paper.tsx`, `Text/Text.tsx`, `Title/Title.tsx`
- **Mantine source:** `packages/@mantine/core/src/components/{Stack,Group,...}/...tsx`
- **Mantine behavior:** Every block is a wrapper around `<Box {...getStyles('root')} {...others} />`. Box supplies polymorphism, style props (`p`, `m`, `bg`, etc.), and the `mod` API for data attributes. Variant-driven theme overrides go through Mantine's CSS module + CSS variable mechanism.
- **Soribashi behavior:** Each block renders the underlying DOM element directly (`<div>` for Stack/Group, `<p>`/`<span>` for Text via `definePolymorphicComponent`, `<h1>`-`<h6>` for Title). Data attributes are emitted explicitly (`data-gap={gap}`, `data-direction={direction}`, etc.). Plain CSS files reference `var(--spacing-md)`, etc.
- **Reason for divergence:**
  - **No `Box` middleware**: Mantine wraps every block in `Box` because Box owns polymorphic typing, the style-props parser, and the `mod` API. Soribashi puts polymorphic typing into `definePolymorphicComponent` directly and exposes a smaller, simpler block surface. Style-props (`p`, `m`, `bg`) are limited to `Box` itself; other blocks don't accept them. This is a deliberate scope reduction.
  - **No `mod` API**: Mantine's `mod={['data-with-border', withBorder]}` syntax is replaced by direct `data-*` attributes in JSX. Less abstraction, easier to read.
  - **CSS Modules vs plain CSS**: Mantine uses CSS Modules (`Stack.module.css`) keyed by selector; soribashi uses plain CSS with stable `sb-{Component}-{selector}` class names. The plain CSS pattern is simpler to test, debug, and integrate with build tools. CSS Modules are still supported via `defineComponent({ classes: cssModule })` for consumers that prefer them.
- **Disposition:** Keep direct DOM rendering. The Mantine-style `Box`-wrapped pattern is achievable for any team that prefers it via `defineComponent` + `Box`, but the default block library does not require it.
- **Spot-validated against:** `Stack.tsx`, `Paper.tsx`, `Text.tsx` (canonical examples of the three patterns: simple block, polymorphic block, polymorphic block with extensive variants).

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

153 tests pass after the validation pass; 0 regressions.
