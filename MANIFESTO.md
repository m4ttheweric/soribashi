# The Soribashi Manifesto

## The gap

There are two ways to build a React component library today, and neither is complete.

**Path A: Own everything.** You use shadcn, CVA, hand-rolled recipes. You copy components into your repo. You control every line of code, every prop, every style. But you also carry every burden. There is no governing layer. Three components define `size` three ways. Color decisions leak into feature code because there is no central authority to appeal to. A junior developer picks `text-blue-600` because it looks right on their screen, and six months later the codebase has forty shades of blue with no semantic meaning. The ownership is real, but the consistency is aspirational.

**Path B: Adopt a framework.** You use Mantine, or Chakra, or another batteries-included library. You get `useProps`, `useStyles`, theme-level `.extend()`, an intent resolver that maps semantic names to colors, and a factory pattern that makes every component speak the same prop language. The DX is world-class. But you are coupled to someone else's components, someone else's opinions about styling, and someone else's release cycle. When you need a component that doesn't exist, you build it outside the system and it immediately looks like a second-class citizen.

Soribashi exists because the gap between these two paths is unnecessary. The authoring primitives that make Mantine's DX possible -- `defineComponent`, `useProps`, `useStyles`, the intent resolver, `.extend()`, `.withProps()` -- are separable from Mantine's component library. You can extract the framework and leave the components behind.

That is what Soribashi is: the framework without the library. The bridge from "own your components" to "own your components and have them behave like a coherent system."

## What was imagined

The original vision, sketched in the Deterministic UI Patterns RFC, started from a specific frustration: an internal component library (CVI, ClaimViewIslands) that had three parallel color-token systems, no semantic theming layer, and no way to express design intent through props. Feature developers were making ad-hoc color and spacing decisions in every file. The system was drifting, and manual code review was the only guardrail.

The RFC proposed a CSS-schema-first architecture layered on top of shadcn: typed codegen, layout blocks, and constrained component APIs that would make the governed path the path of least resistance. The idea was that if `intent="primary"` always did the right thing, and reaching for raw color values required stepping outside the system, most developers would stay on the governed path by default. Not because they were forced to, but because it was easier.

Early exploration revealed that the substrate question -- Tailwind v3, v4, CSS Modules, or something else -- was a false choice. The framework should not care. What matters is the contract between the theme and the component. If that contract is enforced, the styling substrate is an implementation detail.

This realization shifted the design from "soribashi on top of shadcn" to "soribashi as a substrate-agnostic authoring framework." The defining characteristics crystallized:

1. **The theme is the contract.** One `createTheme()` call defines every token, semantic mapping, and component default. No component makes color decisions on its own.
2. **Feature code expresses intent.** `variant="muted"`, `gap="md"`, `intent="danger"` -- never raw shades or pixel values in component consumer code.
3. **Drift is structurally impossible.** The Tailwind config (or CSS custom properties, or both) is generated from the theme. You cannot reference a token that does not exist.
4. **One declarative call per component.** `defineComponent({...})` replaces the multi-file, multi-type-alias ceremony that Mantine requires for each component.
5. **Color x variant decisions live in exactly one function.** The theme's `intentResolver` maps `(intent, variant)` to `{background, color, border, hover}`. Every component calls the same resolver.
6. **Vocabulary is declared, not assumed.** The framework has no opinion on what `size` or `intent` values exist. `defineVocabulary(['xs', 'sm', 'md', 'lg', 'xl'])` produces both the TypeScript type and the Zod runtime validator from one source of truth.

## What was built

### The foundation (v1)

Five packages, implemented plan-first and audited against Mantine `63dafbbf`:

- **`@soribashi/factory`** -- The component authoring layer. Four builders (`defineComponent`, `definePolymorphicComponent`, `defineCompound`, `defineGenericComponent`) cover four component shapes. `useProps` merges consumer props with theme defaults. `useStyles` resolves class names and CSS variables per slot. `makeBuilders` types all four builders against a specific theme's vocabulary using a type-only import, breaking the otherwise-fatal cycle between theme, recipes, and builders.

- **`@soribashi/theme`** -- The contract layer. `createTheme()` normalizes a partial definition into a resolved theme with color scales, semantic tokens, vocabulary, dark mode overrides, and per-component configs. `defineVocabulary()` produces a branded container with a Zod schema baked in. `composeTheme()` layers child themes over parents. The intent resolver maps `(intent, variant)` to concrete color values -- one function, one place, no scattering.

- **`@soribashi/codegen`** -- The enforcement layer. Reads a `soribashi.config.ts`, emits CSS custom properties and a Tailwind v3 or v4 config. The generated artifacts are committed to the repo, inspectable, and diffable. If a token changes in the theme, codegen updates the generated files. If someone references a token that does not exist, the build fails.

- **`@soribashi/blocks`** -- 14 layout primitives adapted from Mantine with full feature parity: Box (with responsive `StyleProp<T>`), Stack, Group, Flex, Grid + Grid.Col, SimpleGrid, Container, Center, AspectRatio, Space, Paper, Text, Title. MIT-attributed. Audited across three validation passes -- CSS structural diff, factory parity, codegen variable parity, and browser-computed-style smoke tests. 11 real bugs caught and fixed during the audit.

- **`@soribashi/core`** -- Public barrel. One import path for consumers.

785 tests at v1 completion. Three full audit passes against Mantine's source. A playground app demonstrating the theme lab (6 intents x 5 variants matrix, 3 sizes, loading/disabled states) and the blocks.

### The recipe pilots (Waves 1-4)

The foundation proves the framework works. The pilots prove it scales to real components. Four waves, each targeting a different component authoring category:

**Wave 1 -- Button (pure styled primitive).** The simplest shape: one element, style slots, variants. Piloted `definePolymorphicComponent` with CSS Modules, token consolidation from three parallel color systems into one soribashi theme, and the `component="a"` polymorphic rendering pattern. Surfaced and resolved 7 framework gaps.

**Wave 2 -- Tooltip (transient overlay compound).** Multi-part: Provider, Root, Trigger, Content. Introduced `defineCompound` with shared context, asChild forwarding via Radix, portal rendering, and the `surface.floating` semantic token with a formalized foreground pairing for guaranteed contrast.

**Wave 3 -- Tabs (persistent navigational compound).** Multi-part with a polymorphic Trigger. Exercised compound components where parts persist in the DOM (unlike Tooltip, which mounts/unmounts). Proved that `defineCompound` handles both transient and persistent patterns without modification.

**Wave 4 -- Select (data-driven generic form control).** The hardest shape. `defineGenericComponent<SelectSignature>` carries a real generic type parameter so that `V` narrows from data literals and `multiple` flips the `onChange` signature. Mantine data model, `@floating-ui/react` positioning, reusable Field wrapper, keyboard navigation, multi-select with pills. React-select-grade type inference from a soribashi builder.

### The conversion playbook

The pilots produced a transferable methodology: a 6-step token consolidation loop and category-specific authoring patterns documented in the [core-radix Conversion Playbook](docs/superpowers/specs/2026-04-26-core-radix-conversion-playbook.md). The playbook is designed to extend -- each wave appended its category pattern and contributed gaps to the shared registry.

### Vocabulary rails

The vocabulary system landed as a cross-cutting convention after Wave 3. `defineVocabulary(values)` is the only sanctioned vocabulary constructor. Themes declare their vocabulary axes (size, intent); recipes declare which axes they participate in (`vocabularyAxes: ['size', 'intent', 'variant']`). Variant is per-recipe, declared via `Recipe.extend({ vocabulary: { variant: defineVocabulary(variants) } })`. The theme composes everything. Dev builds validate every prop value against the Zod schema with actionable error messages.

The `makeBuilders<ThemeType>()` pattern solved the import cycle problem: builders need the theme's type for vocabulary narrowing, recipes need the builders, and the theme needs the recipes for `.extend()`. By threading only the type (not the value), the cycle breaks cleanly. A single `builders.ts` file becomes the entry point for every recipe in the library.

## Why it exists

The React ecosystem has mature component libraries and mature styling tools, but no mature component-authoring framework. If you want to build a component library with Mantine-grade DX -- consistent prop APIs, unified theming, `.extend()` for theme-level customization, type-safe vocabulary -- you have to either fork Mantine or reinvent the patterns from scratch.

Soribashi makes those patterns available as infrastructure. You bring your own components, your own design tokens, your own variant vocabulary. The framework provides the authoring primitives, the theme contract, and the codegen enforcement that make it all cohere.

The easy path should be the system path. Reaching for raw values should feel like an escape hatch, not the default. That is the governing idea. Not restriction, but convenience. The system constrains design language by making the governed path the path of least resistance.
