# RFC: soribashi — Deterministic UI Patterns on Top of shadcn

Status: Draft v2  
Audience: IDE agent / platform engineer  
Primary goal: Build **soribashi** — _the bridge from ad hoc components to a coherent UI system_ — on top of shadcn, without losing shadcn's open-code editability, CVA ergonomics, or CSS-theme ecosystem.

---

## 1. Problem Statement

shadcn is excellent as an open-code component substrate, but it does not provide a complete, opinionated platform layer for application development.

### Current gaps

1. **Missing layout blocks**
   - Teams fall back to raw Tailwind for layout.
   - There is no complete Mantine-like base layer such as `Box`, `Stack`, `Group`, `Grid`, `Container`, etc.

2. **Weak semantic theming layer**
   - Feature developers should not decide:
     - which radius to use
     - which green shade works in dark mode
     - what spacing value is correct
   - Today those decisions leak into feature code.

3. **Too much room for design drift**
   - Humans and AI both “innovate” too easily with styling.
   - We want a constrained design language with intentional escape hatches.

4. **Need to preserve shadcn strengths**
   - Install components quickly via CLI
   - Edit component source directly
   - Keep CVA as the local styling engine
   - Keep compatibility with CSS theme packs and community theming patterns

---

## 2. Product Vision

Build the **soribashi** package ecosystem that provides:

- a **layout layer of building blocks** (`@soribashi/blocks`)
- a **typed theme authoring system** (`@soribashi/theme`)
- a **semantic component API for feature code** (`@soribashi/core`)
- **generated types from CSS tokens** so the theme layer reflects real available tokens (`@soribashi/codegen`)
- a **bridge layer for adapting open-code components into the system** (`@soribashi/bridges`, deferred unless needed in v1)

### One-sentence summary

**soribashi** is a Mantine-inspired design-system layer on top of shadcn, where CSS theme tokens are the source of truth, TypeScript is generated from those tokens, feature components use semantic constrained APIs, and shadcn remains editable and theme-compatible.

### Tagline

**The bridge from ad hoc components to a coherent UI system.**

---

## 3. Core Mental Model

## CSS is the schema

This is the central architectural principle.

Do **not** invent a parallel TypeScript token universe and hope it matches the active theme.

Instead:

1. CSS custom properties are the source of truth.
2. Codegen parses the active theme CSS and generates TypeScript types/manifests.
3. `createTheme()` is typed against that generated schema.
4. The runtime output is still CSS variables and Tailwind-exposed theme tokens.

### Analogy

- CSS custom properties = GraphQL schema
- Generated TypeScript types = generated GraphQL types
- `createTheme()` = typed authoring layer over the schema

This keeps the system aligned with shadcn’s CSS-variable-first theming model.

### Consequence

The system is **not** fundamentally shadcn-specific. shadcn is the first host substrate because it combines:
- open-code editable components
- CVA recipes
- CSS-variable theming
- CLI install flow

But the architectural core is broader:
- CSS schema
- codegen
- typed theme overrides
- semantic blocks
- adapted components

---

## 4. Goals

### Goals

- Preserve shadcn CLI install/edit workflow
- Keep CVA as the class recipe engine for shadcn-style components
- Provide a full base layer of reusable blocks inspired by Mantine
- Generate token types from CSS variables
- Support theme authoring through a TypeScript API that emits CSS variables
- Keep community CSS themes compatible
- Constrain feature code to semantic intent rather than implementation details
- Provide clear escape hatches for advanced or rogue customization
- Optimize for a very fast local iteration loop in a Bun monorepo
- Make the build graph, theme delivery, and token flow explicit enough that an AI agent can implement it without guessing

### Non-goals for v1

- Full Mantine API parity
- Full governance of every shadcn component on day one
- Replacing CVA
- Replacing CSS variable theming with a JS-only runtime theme
- Building a giant framework abstraction around shadcn
- Solving every slot/style API problem in v1
- Supporting Tailwind v3 configuration styles

---

## 5. Design Principles

1. **Feature code expresses intent; theme answers implementation details**
   - Feature code should say `rounded`, `variant="muted"`, `color="success"`, `gap="md"`.
   - Feature code should not decide actual shades, px values, or dark/light mappings.

2. **shadcn remains the open-code substrate**
   - shadcn component files stay editable.
   - CVA remains the normal recipe authoring mechanism.

3. **soribashi is additive, not replacement-oriented**
   - Developers can still install shadcn components exactly as in a normal app.

4. **Semantic APIs should be ergonomic; overrides should be intentionally less convenient**
   - Easy/default path should be the system path.
   - Advanced/override path should be explicit.

5. **CSS variables remain the runtime substrate**
   - The TypeScript theme authoring API generates CSS artifacts.
   - Tailwind utilities must continue to work.

6. **Build-time truth beats runtime guessing**
   - Token typing, theme emission, and utility exposure should be inspectable artifacts.
   - Runtime context should be minimal and only used where necessary.

---

## 6. User Experience Targets

## 6.1 Feature developer experience

Feature developers should write code like this:

```tsx
<Stack gap='lg'>
  <Text variant='muted'>Description</Text>
  <Group justify='end'>
    <Button rounded>Save</Button>
  </Group>
</Stack>
```

They should **not** need to think about:

- what radius to use
- which amber shade works in dark mode
- what spacing value to choose in px
- whether a green text color needs a different dark-mode shade

## 6.2 Platform engineer experience

Platform engineers should be able to:

- install shadcn components normally in the example app
- edit shadcn component files like normal
- extend CVA recipes naturally
- add CSS theme tokens and regenerate types quickly
- wrap or govern selected components when needed
- inspect generated token manifests and emitted CSS output in git

---

## 7. Package Architecture

Use a Bun workspace monorepo.

```text
soribashi/
  package.json
  bun.lock
  tsconfig.base.json

  apps/
    playground/
      src/
      components.json
      src/theme/
        base.css
        index.css
      src/generated/
        css-tokens.ts
        css-tokens.json
        soribashi.theme.css

  packages/
    blocks/          # @soribashi/blocks — layout blocks (Box, Stack, Group, etc.)
    codegen/         # @soribashi/codegen — CSS token parsing & type generation
    core/            # @soribashi/core — public component barrel
    theme/           # @soribashi/theme — createTheme, CSS emission, token resolution

  tooling/
    scripts/

  docs/
    rfc-ui-system-v2.md
    decisions.md
```

## 7.1 Package responsibilities

### `apps/playground`

A real Vite + React + TypeScript app.

Purpose:

- primary development surface
- real shadcn install target
- real theme CSS source
- real user environment for testing codegen and runtime integration
- owner of generated token artifacts in v1

This app should use shadcn exactly like a normal project.

### `packages/codegen` (`@soribashi/codegen`)

Responsible for:

- parsing CSS token declarations
- generating TypeScript token manifests/types
- generating JSON manifest output
- generating emitted Soribashi CSS output from normalized theme input
- watching CSS files and regenerating outputs

### `packages/theme` (`@soribashi/theme`)

Responsible for:

- `createTheme()`
- theme normalization
- type definitions for semantic mappings and component defaults
- shared theme utilities and token resolution logic
- CSS emission helpers that `@soribashi/codegen` can call in build/watch mode

### `packages/blocks` (`@soribashi/blocks`)

Responsible for:

- base layout blocks
- semantic surface wrappers like `Paper`
- polymorphic blocks where appropriate
- common component factory behavior such as `withProps`

### `packages/core` (`@soribashi/core`)

Public barrel package for consumers.

Feature code should import from here.

## 7.2 Explicit dependency graph

```text
@ s o r i b a s h i / c o d e g e n
  standalone parser + generators
  reads app CSS schema inputs
  writes generated artifacts into apps/playground/src/generated/

@ s o r i b a s h i / t h e m e
  depends on no generated files at runtime
  exports createTheme(), types, and emit helpers
  codegen calls theme emit helpers during generation

@ s o r i b a s h i / b l o c k s
  depends on @soribashi/theme type-level utilities only
  consumes emitted CSS variables at runtime through normal CSS
  does not require React context for basic token resolution

@ s o r i b a s h i / c o r e
  re-exports blocks
  re-exports adapted components
  re-exports createTheme and selected theme helpers

apps/playground
  consumes @soribashi/core
  owns shadcn local components
  owns CSS schema source files
  owns generated artifacts in v1
```

### Decision: where generated files live

In v1, generated artifacts live in the consuming app:

- `apps/playground/src/generated/css-tokens.ts`
- `apps/playground/src/generated/css-tokens.json`
- `apps/playground/src/generated/soribashi.theme.css`

This keeps the codegen loop honest and app-first:
- codegen reads the actual app CSS schema
- generated artifacts are visible in the actual app
- the playground behaves like the reference consumer implementation

Later, Soribashi can support package-level generation presets, but v1 should be app-owned.

---

## 8. Block Inventory

This layer should take Mantine as inspiration and cover the common missing blocks.

### v1 block set

- `Box`
- `Flex`
- `Stack`
- `Group`
- `Grid`
- `Grid.Col`
- `SimpleGrid`
- `Container`
- `Center`
- `AspectRatio`
- `Space`
- `Paper`
- `Text`
- `Title`

## 8.1 Block roles

### `Box`

Polymorphic root primitive.

Should support:

- `as`
- tokenized spacing props
- semantic radius/surface/border props
- minimal compositional styling

### `Flex`

General flex primitive.

Should support:

- direction
- gap
- align
- justify
- wrap

### `Stack`

Opinionated vertical flex primitive.

### `Group`

Opinionated horizontal flex primitive.

### `Grid` / `Grid.Col`

Span-based asymmetric grid.

### `SimpleGrid`

Equal-width responsive grid.

### `Container`

Width-constrained layout shell.

### `Center`

Quick centering primitive.

### `AspectRatio`

Media/embed shell.

### `Space`

Theme-driven spacing helper.

### `Paper`

Basic semantic surface wrapper.

### `Text` / `Title`

Basic typography primitives.

## 8.2 How blocks resolve props

This is a core implementation decision.

### Decision

In v1, blocks resolve semantic props to **class names and CSS variables**, not Tailwind utility strings and not inline styles for theme-driven values.

Rules:

1. Blocks may use static structural classes internally for layout mechanics.
   - Example: `flex`, `grid`, `items-center`

2. Theme-driven values must resolve through CSS custom properties or generated Soribashi classes.
   - Example: `gap="lg"` resolves to a class or data attribute whose rule uses `var(--spacing-lg)`
   - Example: `color="success"` resolves to `color: var(--color-success)`

3. Inline styles are allowed only for:
   - user-provided literal dimensions where explicitly supported
   - complex dynamic values that are not part of the semantic theme contract

4. Blocks do **not** generate Tailwind utility strings dynamically at runtime.

### Why

- keeps runtime independent of Tailwind config introspection
- keeps values theme-driven through CSS vars
- preserves inspectability and predictable output
- avoids a runtime class-generation mini-framework

### Recommended mechanics

- blocks use a small internal class recipe layer for structure
- semantic props map to deterministic class names or `data-*` attributes
- emitted Soribashi CSS contains the variable-backed rules

Example direction:

```tsx
<Stack gap="lg" />
```

could render:

```html
<div class="sb-stack" data-gap="lg"></div>
```

with generated or package CSS:

```css
.sb-stack {
  display: flex;
  flex-direction: column;
}

.sb-stack[data-gap='lg'] {
  gap: var(--spacing-lg);
}
```

This is the preferred pattern for theme-bound props.

---

## 9. Component API Tiers

Each system component can expose multiple levels of power.

## 9.1 Base component

This is the default, constrained, semantic API.

Example:

```tsx
<Button rounded variant="primary">Save</Button>
<Text variant="muted" color="success">Ready</Text>
```

## 9.2 `.Custom`

Advanced but still governed.

Rules:

- still token-driven
- still theme-aware
- still constrained to approved variants/tokens
- not raw CSS

Example:

```tsx
<Button.Custom radius='radius-xl' variant='secondary'>
  Save
</Button.Custom>
```

## 9.3 `.Rogue`

Rare escape hatch.

Rules:

- true off-system customization
- can expose raw `className` / style escape hatch
- should be clearly discouraged culturally and in docs

Example:

```tsx
<Button.Rogue className='rounded-[19px] bg-lime-500 px-[15px]'>
  Save
</Button.Rogue>
```

## 9.4 Applicability rule

`.Custom` and `.Rogue` are **not required on every component in v1**.

Required in v1:
- `Button`
- `Text` if useful
- any block/component where the extra tier clearly adds value

Not required in v1:
- `Space`
- `AspectRatio`
- `Center`
- simple wrappers with no meaningful override model

---

## 10. `withProps` Requirement

`withProps` is a first-class API in the spec.

Every component created through the system should expose a static `withProps()` helper where it is technically reasonable.

Example:

```tsx
const DangerButton = Button.withProps({
  variant: 'destructive'
});

const QuietText = Text.withProps({
  variant: 'muted'
});
```

### Why

- encourages reuse of approved semantic patterns
- avoids ad hoc wrapper components
- feels Mantine-like
- gives AI and humans a constrained way to compose variants

### Target behavior

- preserves typing
- pre-applies default props
- ideally preserves `.Custom` and `.Rogue` accessors if feasible

### Explicit precedence rule

For `withProps(defaults)`, instance props always win.

Example:

```tsx
const DangerButton = Button.withProps({ variant: 'destructive' });
<DangerButton variant='secondary' />
```

This renders as `secondary`.

### Mechanical requirement

`withProps` should be implemented via a shared component factory utility in `@soribashi/blocks` or `@soribashi/core`.

That factory must:
- merge default props and instance props
- preserve `displayName`
- preserve refs where applicable
- preserve static accessors like `.Custom` and `.Rogue` when they exist

---

## 11. Theme System Design

## 11.1 CSS token layers

The theme system should understand at least these layers:

1. **Base CSS vars**
   - e.g. `--background`, `--foreground`, `--primary`, `--radius`

2. **Derived vars**
   - e.g. `--radius-sm`, `--radius-md`, `--radius-lg`

3. **Semantic aliases**
   - e.g. `--success`, `--warning`, `--info`

4. **Tailwind-exposed aliases**
   - e.g. `--color-success`, `--color-amber`

## 11.2 `createTheme()` responsibilities

`createTheme()` is a typed authoring API that produces the CSS token system.

It can define:

- base variable overrides
- semantic aliases
- palette aliases
- derived tokens
- utility behavior like what bare `rounded` means
- component default props

### Important boundary

`createTheme()` is **not** a replacement for CSS.

It is the **authoring API that generates CSS**.

The output must still be CSS custom properties and Tailwind-exposed tokens so classes like `text-amber`, `bg-warning`, and `rounded` continue to work.

## 11.3 Theme delivery architecture

### Decision

Soribashi uses a **hybrid build-time first architecture**.

#### Primary mechanism in v1

- `createTheme()` is evaluated in build/watch mode
- codegen/theme emit a CSS artifact: `src/generated/soribashi.theme.css`
- the app imports that CSS artifact at its root

#### Runtime provider in v1

- **not required for the default path**
- may exist later for advanced multi-theme scenarios
- should not be part of the critical path for v1

### Why

This keeps the architecture aligned with the core principle:
- CSS is the runtime substrate
- Tailwind utilities must keep working
- generated artifacts remain inspectable
- theme behavior does not depend on React context for normal use

### V1 import model

At the app root:

```ts
import './generated/soribashi.theme.css';
```

This is the canonical delivery path in v1.

---

## 12. Token Codegen

## 12.1 Inputs

`@soribashi/codegen` should parse one or more CSS files, likely from the playground app:

- `src/theme/base.css`
- `src/theme/index.css`
- optional additional CSS token files

## 12.2 Outputs

Generate at least:

### `apps/playground/src/generated/css-tokens.ts`

Contains:

- token unions
- categorized token arrays/manifests

### `apps/playground/src/generated/css-tokens.json`

Contains:

- machine-readable manifest for debugging and tooling

### `apps/playground/src/generated/soribashi.theme.css`

Contains:

- emitted vars
- semantic aliases
- `@theme inline` token exposure
- optional utilities like `rounded`

## 12.3 Suggested generated shapes

```ts
export const cssTokens = {
  all: [...],
  colors: [...],
  radius: [...],
  shadows: [...],
  fonts: [...],
} as const;

export type CssToken = typeof cssTokens.all[number];
export type CssColorToken = typeof cssTokens.colors[number];
export type CssRadiusToken = typeof cssTokens.radius[number];
```

## 12.4 Codegen behavior

- parse custom properties from `:root` and `.dark`
- optionally parse `@theme inline` exposures
- categorize tokens by prefix / naming conventions
- allow apps to add new tokens and regenerate types

### Important note

The codegen should not try to infer full UI semantics automatically.

CSS is the schema of what exists.  
The theme object still defines what those tokens mean in the system.

### Parsing edge cases to support in v1

- duplicate vars across light/dark scopes
- comments in CSS files
- `var(--token)` references
- empty files with no tokens
- additive token files split across multiple imports

Out of scope for v1 unless encountered:
- full CSS parser support for arbitrary nested preprocessing syntax beyond the files Soribashi owns

---

## 13. Theme Type Shape

Target shape:

```ts
type ThemeDefinition = {
  cssVarOverrides?: Partial<Record<CssToken, string>>;
  semantic?: {
    text?: Record<string, CssColorToken>;
    surface?: Record<string, CssColorToken>;
    border?: Record<string, CssColorToken>;
    radius?: Record<string, CssRadiusToken>;
    shadow?: Record<string, CssShadowToken>;
  };
  components?: {
    [componentName: string]: {
      defaultProps?: Record<string, unknown>;
    };
  };
};
```

## 13.1 Theme precedence

Recommended precedence:

1. `.Rogue`
2. `.Custom`
3. component-level theme defaults
4. `createTheme()` overrides and semantic mappings
5. imported shadcn/community CSS theme defaults
6. soribashi library fallback defaults

### Important decision

If the app explicitly sets a token override in `createTheme()`, that should win.

Example:

```ts
createTheme({
  cssVarOverrides: {
    radius: '2rem'
  }
});
```

This should override the imported theme’s base `--radius` value.

---

## 14. Theme Output Model

The runtime artifact generated by the theme system should include:

1. base light vars
2. base dark vars
3. derived vars
4. exposed Tailwind-facing aliases
5. optional custom utilities

Equivalent target output shape:

```css
:root { ... }
.dark { ... }
@theme inline { ... }
@utility rounded {
  border-radius: var(--radius);
}
```

The existing handwritten CSS pattern is effectively the runtime target for the generated system.

### Build-time emission decision

In v1, CSS is emitted at build/watch time, not injected through a runtime provider.

---

## 15. Tailwind Utility Compatibility

The system must preserve the ability to write utility classes like:

- `text-amber`
- `bg-warning`
- `rounded`

That means the generated theme CSS must expose the corresponding `--color-*` and related tokens.

### Example pattern

Palette aliases should support light/dark-aware values:

- light mode `--amber` -> deeper shade
- dark mode `--amber` -> lighter shade
- `@theme inline` exposes `--color-amber`
- `text-amber` works automatically

This should be generated by the theme system rather than requiring manual CSS for each project.

## 15.1 Tailwind requirement

### Explicit decision

Soribashi v1 requires **Tailwind CSS v4**.

Reasons:
- uses CSS-first config model
- uses `@theme inline`
- uses `@utility`
- does not rely on `tailwind.config.js` as the source of token truth

### Implication

An AI agent must **not** scaffold Tailwind v3 patterns such as:
- `tailwind.config.js`
- JS theme extension as the primary mechanism
- plugin-driven token generation as the main path

Soribashi’s theme architecture is CSS-first and assumes Tailwind v4 syntax.

---

## 16. shadcn + soribashi Integration Strategy

## 16.1 Do not force rewrites of all shadcn components

A developer should be able to:

1. install shadcn components normally
2. use soribashi blocks immediately
3. optionally adapt selected shadcn components
4. gradually govern important ones

## 16.2 Integration tiers

### Raw shadcn

Untouched, installed via CLI in the playground app.

### Adapted shadcn

Wrapped by the system, but still using existing internals.

### Governed shadcn

Selected important components get spec + recipe integration.

This keeps adoption realistic.

## 16.3 CVA policy

Do **not** replace CVA.

Instead:

- system owns semantic vocabulary and defaults
- CVA owns class recipes
- platform engineers can still edit recipe files naturally

## 16.4 First adapted component

`Button` is the first adapted component in v1.

Why:
- high visibility in feature code
- good proving ground for base / `.Custom` / `.Rogue`
- exercises `withProps`
- touches semantic variants and radius behavior

---

## 17. Public Import Boundary

Feature code should import only from `@soribashi/core`, not directly from app-local shadcn files or internal soribashi packages.

Example target:

```ts
import { Button, Stack, Paper, Text, createTheme } from '@soribashi/core';
```

This boundary allows internal implementation to evolve without changing feature code.

## 17.1 What `@soribashi/core` re-exports

In v1, `@soribashi/core` re-exports:

- all public blocks from `@soribashi/blocks`
- adapted components such as `Button`
- `createTheme` and selected theme authoring helpers from `@soribashi/theme`

It does **not** re-export:
- raw generated token artifacts from the app
- internal codegen parser APIs
- app-local shadcn components

Generated token types remain app-owned in v1 and are imported where needed from the generated path.

---

## 18. Repository and Tooling Decisions

## 18.1 Tooling requirements

- Bun workspaces
- Vite + React + TypeScript playground app
- Tailwind CSS v4
- shadcn installed in the playground exactly like a real app
- codegen watcher for CSS token changes
- package watch builds only where necessary
- single root `bun dev` command

## 18.2 Package build strategy

### Decision

In v1, prefer **raw TypeScript workspace consumption** during local development where possible.

- Vite playground resolves workspace packages directly
- avoid unnecessary compile steps during iteration
- use `tsc` for type-checking and publish validation, not as the primary inner-loop bundler

If a package needs a build output for compatibility, keep it minimal and fast.

### Publish posture

Soribashi is iteration-first in v1. Publishing concerns are secondary.

## 18.3 TypeScript config strategy

Use:

- root `tsconfig.base.json`
- one `tsconfig.json` per package extending the base
- one app-specific TS config for the playground as needed by Vite

Recommended:
- path-safe workspace package names instead of deep relative imports
- `composite: true` only if project references materially help; do not overcomplicate v1

## 18.4 shadcn alias strategy

The playground owns the shadcn app-local aliases.

Rules:
- `@/` points to `apps/playground/src/`
- shadcn components install into the playground using normal `components.json`
- Soribashi packages import via workspace names such as `@soribashi/blocks`

### Required `components.json` alignment

The playground’s `components.json` must reflect:
- CSS variables enabled
- aliases pointing to the playground app structure
- normal shadcn CLI expectations

The monorepo must **not** attempt to make shadcn install directly into Soribashi packages in v1.

## 18.5 `cn()` utility decision

Soribashi should provide its own internal `cn()` utility for package code.

Rules:
- do not depend on the playground app’s local `@/lib/utils`
- Soribashi package code must be portable
- app-local shadcn components may continue to use the app’s own `cn()` utility

A small shared utility inside Soribashi should wrap `clsx` and `tailwind-merge` if needed.

---

## 19. Dev Workflow and Orchestration

Optimize for very fast iteration.

## 19.1 Desired feedback loop

When any of these change:

- theme CSS
- token config
- block source
- adapted component source

The system should automatically:

1. regenerate token types
2. regenerate emitted theme CSS
3. refresh the playground app
4. keep Vite serving without manual restarts

## 19.2 `bun dev` orchestration

### Decision

Use a custom Bun script at `tooling/scripts/dev.ts` to orchestrate the loop.

It must:
1. run codegen once before starting Vite
2. start the codegen watcher
3. start the playground Vite dev server
4. optionally start package watch tasks only if a package cannot be consumed raw
5. surface failures clearly and exit non-zero when bootstrap generation fails

### Ordering requirement

Codegen must complete successfully before Vite starts resolving imports from `src/generated/`.

This is a hard requirement.

---

## 20. Testing Strategy

This section is required in v2.

## 20.1 Unit tests

Use Bun test or Vitest-compatible setup where appropriate.

### `@soribashi/codegen`

Test:
- CSS input -> generated TS output
- CSS input -> generated JSON output
- token categorization
- handling of `:root` and `.dark`
- handling of `@theme inline`
- duplicate or missing token cases

### `@soribashi/theme`

Test:
- `createTheme()` normalization
- CSS emission shape
- semantic alias generation
- override precedence
- correct light/dark output

### `@soribashi/blocks`

Test:
- structural class rendering
- semantic prop rendering
- `withProps` merge behavior
- `.Custom` and `.Rogue` behavior where implemented

## 20.2 Integration tests

Required integration tests:

### Token roundtrip test

1. add a CSS token
2. run codegen
3. use the new token in `createTheme()`
4. use the resulting semantic value in a block/component
5. assert rendered DOM/CSS behavior

This is the key proof that the system actually works.

### Theme switching test

Verify light and dark values emit and resolve differently when expected.

## 20.3 Browser or visual tests

Use Playwright or equivalent visual verification on the playground “theme lab” route.

Required coverage:
- light mode
- dark mode
- palette aliases
- semantic aliases
- radius behavior
- adapted `Button`

---

## 21. v1 Scope

## 21.1 Must ship

### Packages

- `@soribashi/codegen`
- `@soribashi/theme`
- `@soribashi/blocks`
- `@soribashi/core`

### Blocks

- `Box`
- `Flex`
- `Stack`
- `Group`
- `Grid`
- `Grid.Col`
- `SimpleGrid`
- `Container`
- `Center`
- `AspectRatio`
- `Space`
- `Paper`
- `Text`
- `Title`

### Theme system (`@soribashi/theme`)

- CSS token parser
- generated token types
- `createTheme()` authoring API
- CSS emission for vars + aliases
- Tailwind-compatible exposed tokens
- emitted `soribashi.theme.css`

### shadcn integration

- playground app uses real shadcn CLI install flow
- at least one adapted component: `Button`
- `withProps` supported on relevant system components

### Tooling

- `bun dev` orchestration
- CSS watch -> codegen -> app refresh loop
- committed generated artifacts for inspectability

## 21.2 Nice to have but can defer

- broad component governance system
- full slot styling system
- runtime multi-theme provider
- full registry publishing story
- docs site
- large adapter catalog

---

## 22. Immediate Build Order

Follow this order.

1. Create Bun workspace monorepo.
2. Create `apps/playground` as a real Vite React TypeScript app.
3. Install Tailwind CSS v4 in the playground.
4. Install shadcn in the playground exactly like a real project.
5. Add base theme CSS files in the playground.
6. Create `packages/codegen`.
7. Implement CSS token parsing from playground theme CSS.
8. Generate `src/generated/css-tokens.ts` and `src/generated/css-tokens.json` in the playground.
9. Create `packages/theme`.
10. Implement `createTheme()` typed against generated token types.
11. Implement CSS emission to `src/generated/soribashi.theme.css`.
12. Import generated theme CSS in the playground root.
13. Create `packages/blocks`.
14. Build `Box`, `Flex`, `Stack`, `Group`, `Paper`, `Text`, `Title` first.
15. Add shared `cn()` utility to Soribashi packages.
16. Add `withProps` support to system components.
17. Add remaining layout primitives.
18. Create `packages/core` public barrel.
19. Add the first adapted shadcn component: `Button`.
20. Add the dev watcher that regenerates token types and theme CSS on CSS changes.
21. Add the playground “theme lab” route to verify light/dark, radius, semantic colors, palette aliases, and utilities.
22. Add the token roundtrip integration test.
23. Add visual/browser verification for the theme lab route.

---

## 23. Hard Rules for the IDE Agent

1. Do not replace shadcn internals unless explicitly asked.
2. Preserve the normal shadcn CLI workflow in the playground app.
3. CSS variables are the source of truth.
4. Generated types must come from CSS tokens.
5. `createTheme()` must emit CSS-compatible outputs.
6. Favor small, incremental steps over giant abstractions.
7. Do not over-framework v1.
8. Keep feature-facing APIs semantic.
9. Keep override paths explicit.
10. Preserve Tailwind utility compatibility for theme-aware tokens.
11. Do not scaffold Tailwind v3 conventions.
12. Do not make runtime React context the primary theme delivery mechanism in v1.
13. Keep generated artifacts inspectable and committed unless there is a strong reason not to.

---

## 24. Open Questions

These are intentionally unresolved and can be decided during implementation.

1. Should generated CSS and token artifacts always be committed, or only in the reference app?
2. Should future versions support scoped multi-theme providers in addition to app-root CSS generation?
3. How much Mantine-style polymorphism should exist in v1 beyond `Box`?
4. Which adapted shadcn components should be tackled next after `Button`?
5. How much category inference should codegen do automatically?
6. Should a future `@soribashi/bridges` package exist explicitly, or should adapted components stay inside `@soribashi/core` for longer?

---

## 25. Success Criteria

This project is on track when the repo can do all of the following:

- edit theme CSS
- regenerate token types automatically
- use those generated types in `createTheme()`
- install a new shadcn component in the playground like a real app
- use soribashi blocks instead of raw Tailwind for most feature layouts
- expose Tailwind-friendly theme-aware tokens like `text-amber` and `rounded`
- keep shadcn components editable
- keep feature code semantic and constrained
- prove the token roundtrip works end to end

---

## 26. First Concrete Milestone

The first milestone should be:

- repo boots with `bun dev`
- playground app runs
- Tailwind v4 is active
- shadcn is installed in playground
- CSS token codegen works on a theme CSS file
- generated token types are available in TS
- `createTheme()` compiles and emits CSS
- `src/generated/soribashi.theme.css` is imported into the app
- `Box`, `Stack`, `Group`, `Paper`, `Text`, and `Title` render in the playground
- one page in the playground demonstrates light/dark palette aliases, semantic color aliases, and theme-aware radius behavior
- one adapted `Button` proves the base / `.Custom` / `.Rogue` pattern
- one integration test proves CSS token -> codegen -> `createTheme()` -> rendered UI roundtrip
