# Tier 2 Audit — Batch T2-B: Provider + Types

**Pinned to:** `mantinedev/mantine@63dafbbf5f0135eb36455b7add4c0ddcd0f3240a`

**Batch:** T2-B
**Files audited:** 7
**Date:** 2026-04-25

---

## File 1: `packages/factory/src/provider/provider.tsx`

**Mantine analog:** `packages/@mantine/core/src/core/MantineProvider/MantineProvider.tsx`

### Decision-point enumeration

| # | Mantine line(s) | Decision / branch | Soribashi behavior | Classification |
|---|---|---|---|---|
| P1 | MantineProvider.tsx:14-65 | ~130-line provider with 15+ props: colorSchemeManager, defaultColorScheme, forceColorScheme, cssVariablesSelector, withCssVariables, deduplicateCssVariables, getRootElement, classNamesPrefix, getStyleNonce, cssVariablesResolver, withStaticClasses, withGlobalClasses, stylesTransform, env, deduplicateInlineStyles | ~5-line provider with only `theme` and `children` props | `INTENTIONAL` (pre-existing; in ledger under "SoribashiProvider — minimal context-only provider") |
| P2 | MantineProvider.tsx:86-96 | `useProviderColorScheme` manages color scheme state (light/dark/auto) at runtime | No color scheme management | `INTENTIONAL` (CSS-class-based approach; in ledger) |
| P3 | MantineProvider.tsx:93-96 | `useRespectReduceMotion` sets `--mantine-reduced-motion-media-query` | Not implemented | `INTENTIONAL` (consumer responsibility; in ledger) |
| P4 | MantineProvider.tsx:98-127 | Renders `MantineContext` (runtime context) then `MantineThemeProvider` (theme context) — two separate contexts | Single context wrapping `SoribashiContext.Provider value={props.theme}` | `INTENTIONAL` (soribashi combines both into one because there is no runtime state) |
| P5 | MantineProvider.tsx:116-118 | `withCssVariables && <MantineCssVariables>` — injects CSS variables at runtime | No CSS variable injection | `INTENTIONAL` (soribashi uses static `theme.css` from codegen) |
| P6 | MantineProvider.tsx:119-120 | `withGlobalClasses && <MantineClasses>` — injects global visibility classes | Not implemented | `INTENTIONAL` (soribashi uses static CSS) |
| P7 | MantineProvider.tsx:129 | `MantineProvider.displayName = '@mantine/core/MantineProvider'` | No `displayName` set | `INTENTIONAL` — low priority cosmetic omission; no behavioral impact |
| P8 | MantineProvider.tsx:131-162 | Exports `HeadlessMantineProvider` for headless mode | Not exported | `INTENTIONAL` (soribashi is already substrate-agnostic; no headless needed) |

### Findings

**No BUG, HALLUCINATION, INCONSISTENCY, or HOOK_REIMPL findings.**

All divergences are intentional and pre-existing. The "SoribashiProvider — minimal context-only provider" entry in the ledger captures all of P1–P8.

---

## File 2: `packages/factory/src/provider/context.ts`

**Mantine analog:** `packages/@mantine/core/src/core/MantineProvider/Mantine.context.ts`

### Decision-point enumeration

| # | Mantine line(s) | Decision / branch | Soribashi behavior | Classification |
|---|---|---|---|---|
| C1 | Mantine.context.ts:1 | `import { createContext, use } from 'react'` — uses `use()` (React 19 API) | `import { createContext } from 'react'` — no `use()` | `INTENTIONAL` (soribashi uses `useContext` in use-theme.ts, not `use()`) |
| C2 | Mantine.context.ts:26 | `createContext<MantineContextValue | null>(null)` — initial value `null` (throws when missing) | `createContext<ResolvedTheme>(defaultContextTheme)` — initial value is a valid default theme | `INTENTIONAL` (pre-existing; in ledger under "useTheme — falls back to default theme outside provider") |
| C3 | Mantine.context.ts:28-36 | `useMantineContext()` throws `[@mantine/core] MantineProvider was not found in tree` when context is null | No throw; `useTheme()` returns the default theme | `INTENTIONAL` (in ledger) |
| C4 | Mantine.context.ts:38-72 | Exports 9 helper selectors: `useMantineCssVariablesResolver`, `useMantineClassNamesPrefix`, `useMantineStyleNonce`, `useMantineWithStaticClasses`, `useMantineIsHeadless`, `useMantineSxTransform`, `useMantineStylesTransform`, `useMantineEnv`, `useMantineDeduplicateInlineStyles` | No equivalent selectors | `INTENTIONAL` (soribashi has no equivalent context fields; these are all tied to Mantine's runtime CSS injection system which soribashi replaces with static codegen) |
| C5 | Mantine.context.ts:10-24 | `MantineContextValue` interface has 11 fields (colorScheme, setColorScheme, clearColorScheme, getRootElement, classNamesPrefix, getStyleNonce, cssVariablesResolver, cssVariablesSelector, withStaticClasses, headless, stylesTransform, env, deduplicateInlineStyles) | `SoribashiContext` holds just `ResolvedTheme` — the entire context IS the theme | `INTENTIONAL` (architectural; minimal runtime context) |
| C6 | (soribashi-only) | `defaultContextTheme` is a named export; initialized via `createTheme` with empty token maps | No Mantine equivalent (Mantine context always null when missing; throws on access) | `INTENTIONAL` (soribashi extension enabling test-without-provider ergonomics) |

### Findings

**No BUG, HALLUCINATION, INCONSISTENCY, or HOOK_REIMPL findings.**

---

## File 3: `packages/factory/src/provider/use-theme.ts`

**Mantine analog:** `packages/@mantine/core/src/core/MantineProvider/Mantine.context.ts` (`useMantineContext`)

### Decision-point enumeration

| # | Mantine analog | Decision / branch | Soribashi behavior | Classification |
|---|---|---|---|---|
| UT1 | Mantine.context.ts:28-36 | `useMantineContext()` uses React 19 `use(MantineContext)` | `useTheme()` uses `useContext(SoribashiContext)` (React 18 API) | `INTENTIONAL` (React 18 compatible; `use()` vs `useContext` is functionally equivalent when the context value is synchronous) |
| UT2 | Mantine.context.ts:29-35 | Throws if context is null | Returns default theme (no throw) | `INTENTIONAL` (in ledger) |
| UT3 | Mantine.context.ts:30 | Returns `MantineContextValue` (full runtime context object) | Returns `ResolvedTheme` directly | `INTENTIONAL` (soribashi's context IS the theme; no extra runtime metadata) |

### Findings

**No BUG, HALLUCINATION, INCONSISTENCY, or HOOK_REIMPL findings.**

**Hook-replacement check:** `useTheme` uses `useContext` — a React built-in, not a candidate for `@mantine/hooks` replacement. No `@mantine/hooks` analog exists.

---

## File 4: `packages/factory/src/types/polymorphic.ts`

**Mantine analog:** `packages/@mantine/core/src/core/factory/create-polymorphic-component.ts`

### Decision-point enumeration

| # | Mantine line(s) | Decision / branch | Soribashi behavior | Classification |
|---|---|---|---|---|
| PL1 | create-polymorphic-component.ts:1-4 | `ExtendedProps<Props, OverrideProps> = OverrideProps & Omit<Props, keyof OverrideProps>` | `PolymorphicProps<TAs, TOwnProps> = TOwnProps & Omit<ComponentPropsWithRef<TAs>, keyof TOwnProps \| 'as'> & { as?: TAs }` — own props win, omit 'as' from inherited | `INTENTIONAL` (pre-existing; in ledger under "PolymorphicComponentProps — own props win on conflict") |
| PL2 | create-polymorphic-component.ts:6 | Uses `keyof React.JSX.IntrinsicElements \| React.JSXElementConstructor<any>` local alias for `ElementType` | Imports `ElementType` from React directly | `TOKEN_DIFF` — same semantics, different import style |
| PL3 | create-polymorphic-component.ts:7-9 | `PropsOf<C> = React.JSX.LibraryManagedAttributes<C, React.ComponentProps<C>>` | Uses `ComponentPropsWithRef<TAs>` from React | `INTENTIONAL` — `ComponentPropsWithRef` includes ref; Mantine's `PropsOf` uses `ComponentProps` (no ref). Soribashi explicitly includes ref via `ComponentPropsWithRef`. This is the more explicit approach. |
| PL4 | create-polymorphic-component.ts:11-13 | `ComponentProp<C> = { component?: C }` — Mantine's polymorphic `as`-equivalent uses `component` | `{ as?: TAs }` — soribashi uses `as` | `TOKEN_DIFF` — deliberate renaming per soribashi convention; `as` is more idiomatic React. |
| PL5 | create-polymorphic-component.ts:17-26 | `PolymorphicComponentProps<C, Props>` includes `renderRoot?: (props: any) => any` | No `renderRoot` prop | `INTENTIONAL` — `renderRoot` is a Mantine escape hatch for custom render roots; soribashi doesn't need it |
| PL6 | (soribashi-only) | No Mantine equivalent | `PolymorphicRef<TAs>` — extracts the ref type from `ComponentPropsWithRef<TAs>` | `INTENTIONAL` — soribashi addition enabling typed ref forwarding in polymorphic components |
| PL7 | (soribashi-only) | No Mantine equivalent | `PolymorphicComponentProps<TAs, TOwnProps>` = `PolymorphicProps<TAs, TOwnProps> & RefAttributes<PolymorphicRef<TAs>>` — composed type with explicit RefAttributes | Mantine uses `ref?: PolymorphicRef<C>` inline in `PolymorphicComponentProps` | `INTENTIONAL` — soribashi uses `RefAttributes` wrapper; equivalent result |
| PL8 | (soribashi-only) | No Mantine equivalent | `SoribashiPolymorphicComponent<TDefaultAs, TOwnProps>` interface — generic callable interface for polymorphic components | `INTENTIONAL` — soribashi addition; no Mantine runtime equivalent (Mantine uses `createPolymorphicComponent` type cast) |
| PL9 | (soribashi-only) | No Mantine equivalent | `PolymorphicRenderProps<TOwnProps>` with `Element: ElementType; props: TOwnProps` | `INTENTIONAL` — soribashi addition for the constructor render callback pattern |

### Findings

**No BUG, HALLUCINATION, INCONSISTENCY, or HOOK_REIMPL findings.**

All divergences are intentional. The key ones are pre-existing and in the ledger (PL1 — "PolymorphicComponentProps — own props win on conflict"). PL2, PL6–PL9 are soribashi additions supporting the constructor model.

---

## File 5: `packages/factory/src/types/factory-payload.ts`

**Mantine analog:** `packages/@mantine/core/src/core/factory/factory.tsx` (FactoryPayload interface, lines 4-20)

### Decision-point enumeration

| # | Mantine line(s) | Decision / branch | Soribashi behavior | Classification |
|---|---|---|---|---|
| FP1 | factory.tsx:6-20 | `FactoryPayload` has fields: `props`, `ctx?`, `ref?`, `stylesNames?`, `vars?`, `variant?`, `staticComponents?`, `compound?`, `signature?` | `FactoryPayload` has: `props`, `ref?`, `stylesNames?`, `vars?`, `variant?`, `staticComponents?`, `compound?` — missing `ctx?` and `signature?` | See FP1a and FP1b below |
| FP1a | factory.tsx:7 | `ctx?: any` — passed to `StylesApiRecord` callback signature `(theme, props, ctx)` for compound components | No `ctx` field | `INTENTIONAL` — soribashi's `useStyles` doesn't support `ctx` parameter (documented in ledger under "useStyles — simpler resolution model"). Omitting it from the payload type is consistent. |
| FP1b | factory.tsx:19 | `signature?: any` — stores the generic component's call signature type for `genericFactory` | No `signature` field | `INTENTIONAL` — soribashi's `defineGenericComponent` uses `GenericComponentFn` pattern instead; the `signature` field was Mantine's type-escape mechanism for `genericFactory`. Not needed in soribashi's constructor approach. |
| FP2 | factory.tsx:8 | `vars?: any` (type `any`) | `vars?: Record<string, string>` (more specific type) | `INTENTIONAL` — soribashi adds stricter typing; no runtime impact. Soribashi's approach is superior. |
| FP3 | factory.tsx:18 | `FactoryProps<P>`, `FactoryStylesNames<P>`, etc. are NOT declared in the payload file — they live in other files | Soribashi exports `FactoryProps<P>`, `FactoryStylesNames<P>`, `FactoryVars<P>` from this file | `INTENTIONAL` — soribashi co-locates utility extractors with the payload type for ergonomics |

### Findings

**No BUG, HALLUCINATION, INCONSISTENCY, or HOOK_REIMPL findings.**

The `ctx` and `signature` omissions are both intentional and consistent with the existing architecture. Previously validated in the master ledger ("Factory payload type" entry).

---

## File 6: `packages/factory/src/types/props.ts`

**Mantine analog:** `packages/@mantine/core/src/core/styles-api/styles-api.types.ts`

### Decision-point enumeration

| # | Mantine line(s) | Decision / branch | Soribashi behavior | Classification |
|---|---|---|---|---|
| PR1 | styles-api.types.ts:18-33 | `StylesApiRecord<Payload, DataType>` — a conditional type that (a) returns `never` for compound components without stylesNames; (b) for non-compound: allows `StylesRecord \| ((theme, props, ctx) => StylesRecord)` | `ClassNames<P>` and `Styles<P>` — both defined directly as `Partial<Record<...>> \| ((theme, props) => Partial<Record<...>>)` without compound branching | `INTENTIONAL` — soribashi omits the `compound` branch (which makes classNames/styles/vars unavailable on compound components in Mantine's provider). Soribashi's simpler form is consistent with its simpler `useStyles`. |
| PR2 | styles-api.types.ts:30 | `StylesApiRecord` callback receives `(theme, props, ctx)` — 3 params | Soribashi callbacks receive `(theme, props)` — 2 params, no `ctx` | `INTENTIONAL` — `ctx` omitted throughout; consistent with `FactoryPayload` decision (FP1a). |
| PR3 | styles-api.types.ts:35-36 | `Styles<Payload>` and `ClassNames<Payload>` derived from `StylesApiRecord` generic | Soribashi has separate standalone definitions for `ClassNames<P>` and `Styles<P>` | `INTENTIONAL` — soribashi doesn't have the `StylesApiRecord` generic; equivalent types defined directly. |
| PR4 | styles-api.types.ts:42-46 | `Attributes<Payload>` is `{ [K in stylesNames]?: Record<string, any> }` but only when NOT compound (otherwise `never`) | `Attributes<P>` is always `Partial<Record<FactoryStylesNames<P>, Record<string, unknown>>>` — no compound-gating | `INTENTIONAL` — same omission of compound branching as PR1. Also soribashi uses `unknown` instead of `any` for the attribute record value — stricter. |
| PR5 | styles-api.types.ts:52-59 | `StylesApiProps<Payload>` has: `unstyled`, `variant`, `classNames`, `styles`, `vars`, `attributes` | Soribashi adds: `className`, `style`, `children` to `StylesApiProps` and omits `variant` | See PR5a/PR5b below |
| PR5a | styles-api.types.ts:54 | `variant?: Payload['variant'] extends string ? Payload['variant'] \| (string & {}) : string` — the `variant` prop with open-ended union | No `variant` in soribashi's `StylesApiProps` | `INTENTIONAL` — soribashi's `variant` is handled as a regular prop in the component's own props type, not in the shared `StylesApiProps`. Equivalent effect; different structural choice. |
| PR5b | (soribashi-only) | No Mantine equivalent in `StylesApiProps` | Soribashi's `StylesApiProps` includes `className?`, `style?`, `children?` | `INTENTIONAL` — soribashi bundles the common DOM-adjacent props (`className`, `style`, `children`) into `StylesApiProps` for ergonomics. Mantine spreads these across the component's own props definition. |
| PR6 | styles-api.types.ts:61-64 | `CompoundStylesApiProps<Payload>` — omits `unstyled` and `attributes` for compound components | Not present | `INTENTIONAL` — soribashi doesn't model compound component restrictions at the type level. |
| PR7 | styles-api.types.ts:1-5 | `VarsResolver` type imported from `create-vars-resolver` | Soribashi `Vars<P>` is defined inline as `(theme, props) => Partial<Record<...>>` | `INTENTIONAL` — soribashi uses a simpler direct function type; Mantine's `VarsResolver`/`PartialVarsResolver` distinguish full vs partial. |

### Findings

**No BUG, HALLUCINATION, INCONSISTENCY, or HOOK_REIMPL findings.**

The `StylesApiProps` additions (`className`, `style`, `children`) in soribashi are a deliberate ergonomic bundling. The `variant` omission and compound-gating omissions are consistent with soribashi's simpler `useStyles` architecture.

**Potential INCONSISTENCY check:** `StylesApiProps` includes `children?: ReactNode` but `FactoryPayload.props` is `Record<string, any>` — components declare `children` in their own props. This means `children` appears in both `StylesApiProps` and component prop types. This is a minor duplication but not a bug (TypeScript intersection deduplicates it). **Classification: INTENTIONAL** — the `children` in `StylesApiProps` is a convenience so callers don't have to re-declare it.

---

## File 7: `packages/factory/src/types/render-context.ts`

**Mantine analog:** No direct analog. Mantine components call `useStyles()`, `useProps()`, etc. inline. Soribashi's `RenderContext` is a soribashi-only abstraction for the constructor render callback.

### Decision-point enumeration

| # | Mantine context | Decision / branch | Soribashi behavior | Classification |
|---|---|---|---|---|
| RC1 | (no analog) | No `RenderContext` type in Mantine | `RenderContext<P>` with `props`, `getStyles`, `ref?` — the object passed to every `defineComponent`/`definePolymorphicComponent`/`defineGenericComponent` render callback | `INTENTIONAL` — soribashi addition for the constructor model |
| RC2 | styles-api.types.ts:6-16 | `GetStylesApiOptions` has: `className?`, `style?`, `focusable?`, `active?`, `classNames?`, `styles?`, `variant?`, `props?`, `withStaticClass?` | `GetStylesOptions` has: `active?`, `variant?`, `style?`, `className?` | `INTENTIONAL` — soribashi's options are a subset; `focusable`, `classNames`, `styles`, `props`, `withStaticClass` omitted as they relate to features soribashi doesn't implement (focus styles, nested overrides, static classes) |
| RC3 | (no analog) | Not present in Mantine | `GetStylesResult` with `className: string; style?: CSSProperties; [data-*]: unknown; [aria-*]: unknown` | `INTENTIONAL` — soribashi addition; encapsulates the full result of `getStyles()` call |
| RC4 | (no analog) | Not present in Mantine | `GetStylesFn<P>` function type | `INTENTIONAL` — soribashi addition for typed `getStyles` function |

### Findings

**No BUG, HALLUCINATION, INCONSISTENCY, or HOOK_REIMPL findings.**

`render-context.ts` is a soribashi-only file with no Mantine equivalent. All contents are `INTENTIONAL` additions for the constructor model.

---

## Summary

| File | BUG | HALLUCINATION | INCONSISTENCY | HOOK_REIMPL | INTENTIONAL | TOKEN_DIFF | IDENTICAL |
|---|---|---|---|---|---|---|---|
| provider.tsx | 0 | 0 | 0 | 0 | 8 | 0 | 0 |
| context.ts | 0 | 0 | 0 | 0 | 6 | 0 | 0 |
| use-theme.ts | 0 | 0 | 0 | 0 | 3 | 0 | 0 |
| types/polymorphic.ts | 0 | 0 | 0 | 0 | 7 | 2 | 0 |
| types/factory-payload.ts | 0 | 0 | 0 | 0 | 3 | 0 | 0 |
| types/props.ts | 0 | 0 | 0 | 0 | 7 | 0 | 0 |
| types/render-context.ts | 0 | 0 | 0 | 0 | 4 | 0 | 0 |
| **Total** | **0** | **0** | **0** | **0** | **38** | **2** | **0** |

**Bugs fixed:** 0
**Hook replacements:** 0
**New INTENTIONAL ledger entries:** 14 (new ones not previously documented)

### New (e) candidates for roadmap

- `HeadlessMantineProvider` pattern — Mantine exports a no-CSS-variable variant of the provider for headless usage. Soribashi is already effectively headless-first; no consumer need identified.
- `useMantineEnv` — `'default' | 'test'` mode flag that disables transitions. Useful for test-environment detection. Low priority; consumers can set this via CSS.
- `CompoundStylesApiProps` — typed restriction of StylesApiProps for compound components. Could improve type safety for compound component authors.
