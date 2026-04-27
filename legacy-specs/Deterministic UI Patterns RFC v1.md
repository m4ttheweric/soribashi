# RFC: soribashi — Deterministic UI Patterns on Top of shadcn

Status: Draft v1  
Audience: IDE agent / platform engineer  
Primary goal: Build **soribashi** — _the bridge from ad hoc components to a coherent UI system_ — on top of shadcn, without losing shadcn's open-code editability, CVA ergonomics, or CSS-theme ecosystem.

---

## 1. Problem Statement

shadcn is excellent as an open-code component substrate, but it does not provide a complete, opinionated platform layer for application development.

### Current gaps

1. **Missing layout primitives**
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

### One-sentence summary

**soribashi** is a Mantine-inspired design-system layer on top of shadcn, where CSS theme tokens are the source of truth, TypeScript is generated from those tokens, feature components use semantic constrained APIs, and shadcn remains editable and theme-compatible.

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

### Non-goals for v1

- Full Mantine API parity
- Full governance of every shadcn component on day one
- Replacing CVA
- Replacing CSS variable theming with a JS-only runtime theme
- Building a giant framework abstraction around shadcn
- Solving every slot/style API problem in v1

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

  packages/
    blocks/          # @soribashi/blocks — layout blocks (Box, Stack, Group, etc.)
    codegen/         # @soribashi/codegen — CSS token parsing & type generation
    core/            # @soribashi/core — public component barrel
    theme/           # @soribashi/theme — createTheme, CSS emission, token resolution

  docs/
    rfc-ui-system-v1.md
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

This app should use shadcn exactly like a normal project.

### `packages/codegen` (`@soribashi/codegen`)

Responsible for:

- parsing CSS token declarations
- generating TypeScript token manifests/types
- generating optional JSON manifest output
- watching CSS files and regenerating outputs

### `packages/theme` (`@soribashi/theme`)

Responsible for:

- `createTheme()`
- theme normalization
- CSS emission / variable override generation
- runtime provider if needed
- shared theme utilities and token resolution logic

### `packages/blocks` (`@soribashi/blocks`)

Responsible for:

- base layout blocks
- semantic surface wrappers like `Paper`
- polymorphic blocks where appropriate

### `packages/core` (`@soribashi/core`)

Public barrel package for consumers.

Feature code should import from here.

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

---

## 10. `withProps` Requirement

`withProps` is a first-class API in the spec.

Every component created through the system should expose a static `withProps()` helper.

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

- Encourages reuse of approved semantic patterns
- Avoids ad hoc wrapper components
- Feels Mantine-like
- Gives AI and humans a constrained way to compose variants

### Target behavior

- preserves typing
- pre-applies default props
- ideally preserves `.Custom` and `.Rogue` accessors if feasible

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

`createTheme()` should be a typed authoring API that produces the CSS token system.

It should be able to define:

- base variable overrides
- semantic aliases
- palette aliases
- derived tokens
- utility behavior like what bare `rounded` means

### Important boundary

`createTheme()` is **not** a replacement for CSS.

It is the **authoring API that generates CSS**.

The output must still be CSS custom properties and Tailwind-exposed tokens so classes like `text-amber`, `bg-warning`, and `rounded` continue to work.

---

## 12. Token Codegen

## 12.1 Inputs

`@soribashi/codegen` (`packages/codegen`) should parse one or more CSS files, likely from the playground app:

- base theme CSS
- app theme CSS
- optional additional CSS token files

## 12.2 Outputs

Generate at least:

### `generated/css-tokens.ts`

Contains:

- token unions
- categorized token arrays/manifests

### `generated/css-tokens.json`

Contains:

- machine-readable manifest for debugging and tooling

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

---

## 17. Public Import Boundary

Feature code should import only from `@soribashi/core`, not directly from app-local shadcn files or internal soribashi packages.

Example target:

```ts
import { Button, Stack, Paper, Text } from '@soribashi/core';
```

This boundary allows internal implementation to evolve without changing feature code.

---

## 18. Example Repository Dev Workflow

Optimize for very fast iteration.

## 18.1 Tooling requirements

- Bun workspaces
- Vite + React + TypeScript playground app
- shadcn installed in the playground exactly like a real app
- codegen watcher for CSS token changes
- package watch builds
- single root `bun dev` command

## 18.2 Desired feedback loop

When any of these change:

- theme CSS
- token config
- block source
- adapted component source

The system should automatically:

1. regenerate token types
2. regenerate emitted theme CSS
3. rebuild affected packages
4. let Vite hot-reload the playground app

---

## 19. Suggested Initial Scripts

At repo root, aim for something conceptually like:

```json
{
  "scripts": {
    "dev": "bun run tooling/scripts/dev.ts",
    "build": "bun run tooling/scripts/build.ts",
    "test": "bun test",
    "codegen": "bun run --filter ./packages/codegen build",
    "codegen:watch": "bun run --filter ./packages/codegen dev",
    "playground": "bun run --filter ./apps/playground dev"
  }
}
```

---

## 20. v1 Scope

## 20.1 Must ship

### Packages

- `@soribashi/codegen`
- `@soribashi/theme`
- `@soribashi/blocks`
- `@soribashi/core`

### Primitive components

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

### shadcn integration

- playground app uses real shadcn CLI install flow
- at least one adapted component, likely `Button`
- `withProps` supported on system components

## 20.2 Nice to have but can defer

- broad component governance system
- full slot styling system
- full registry publishing story
- docs site
- large adapter catalog

---

## 21. Immediate Build Order

Follow this order.

1. Create Bun workspace monorepo.
2. Create `apps/playground` as a real Vite React TypeScript app.
3. Install shadcn in the playground exactly like a real project.
4. Add base theme CSS files in the playground.
5. Create `packages/codegen` (`@soribashi/codegen`).
6. Implement CSS token parsing from playground theme CSS.
7. Generate `css-tokens.ts` and `css-tokens.json`.
8. Create `packages/theme` (`@soribashi/theme`).
9. Implement `createTheme()` typed against generated token types.
10. Implement CSS emission from `createTheme()`.
11. Create `packages/blocks` (`@soribashi/blocks`).
12. Build `Box`, `Flex`, `Stack`, `Group`, `Paper`, `Text`, `Title` first.
13. Add remaining layout primitives.
14. Create `packages/core` (`@soribashi/core`) public barrel.
15. Add `withProps` support to system components.
16. Add one adapted shadcn component, likely `Button`.
17. Add a dev watcher that regenerates token types on CSS changes.
18. Add a playground "theme lab" route to verify light/dark, radius, semantic colors, palette aliases, and utilities.

---

## 22. Hard Rules for the IDE Agent

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

---

## 23. Open Questions

These are intentionally unresolved and can be decided during implementation.

1. Should generated CSS be emitted to a file, injected at runtime, or both?
2. Should theme overrides be scoped to a provider root or authored globally?
3. How much of Mantine-style polymorphism should exist in v1?
4. Which adapted shadcn components should be tackled first after `Button`?
5. Should `.Custom` and `.Rogue` exist on every component or only some?
6. How much category inference should codegen do automatically?

---

## 24. Success Criteria

This project is on track when the repo can do all of the following:

- edit theme CSS
- regenerate token types automatically
- use those generated types in `createTheme()`
- install a new shadcn component in the playground like a real app
- use soribashi blocks instead of raw Tailwind for most feature layouts
- expose Tailwind-friendly theme-aware tokens like `text-amber` and `rounded`
- keep shadcn components editable
- keep feature code semantic and constrained

---

## 25. First Concrete Milestone

The first milestone should be:

- repo boots with `bun dev`
- playground app runs
- shadcn is installed in playground
- CSS token codegen works on a theme CSS file
- generated token types are available in TS
- `createTheme()` compiles and emits CSS
- `Box`, `Stack`, `Group`, `Paper`, `Text`, and `Title` render in the playground
- one page in the playground demonstrates light/dark palette aliases, semantic color aliases, and theme-aware radius behavior
