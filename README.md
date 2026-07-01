# Soribashi

A component-authoring framework for React. Define components once, theme them centrally, and generate the styling substrate -- so your team owns every line of UI code and still gets Mantine-grade DX.

Soribashi is not a component library. It is the toolkit you use to **build** one.

## The problem

Teams today choose between two poles:

- **Own your components** (shadcn, hand-rolled CVA recipes) -- full control, but no governing layer. `size` means different things across components, color decisions scatter into feature code, and three developers spell "focus ring" three different ways.
- **Adopt a framework** (Mantine, Chakra) -- world-class DX out of the box, but you're coupled to someone else's component set, styling conventions, and release cycle.

Soribashi bridges the gap. You get the authoring primitives that make Mantine's DX possible -- `defineComponent`, `useProps`, `useStyles`, the intent resolver, `.extend()`, `.withProps()` -- without adopting Mantine's components. You own everything. The framework just makes ownership sustainable.

## Quick look

**Define a vocabulary** -- the shared language your components speak:

```ts
import { defineVocabulary, createTheme } from '@soribashi/core';

const size  = defineVocabulary(['xs', 'sm', 'md', 'lg', 'xl']);
const intent = defineVocabulary(['primary', 'neutral', 'success', 'warning', 'danger', 'info']);

export const theme = createTheme({
  vocabulary: { size, intent },
  tokens: {
    colors: {
      primary: { 500: 'hsl(221 83% 53%)', foreground: 'hsl(0 0% 100%)' /* ...scale */ },
      neutral: { 500: 'hsl(215 16% 47%)', foreground: 'hsl(0 0% 100%)' /* ...scale */ },
    },
    radius: { sm: '0.25rem', md: '0.375rem', lg: '0.5rem' },
    spacing: { xs: '0.25rem', sm: '0.5rem', md: '0.75rem', lg: '1rem', xl: '1.5rem' },
  },
  semanticTokens: {
    text:    { default: 'colors.neutral.900', muted: 'colors.neutral.500' },
    surface: { default: 'colors.neutral.0', raised: 'colors.neutral.100' },
    border:  { default: 'colors.neutral.200' },
  },
});
```

**Author a component** -- one declarative call, types inferred:

```tsx
import { definePolymorphicComponent, defineVocabulary } from '@soribashi/core';
import classes from './Button.module.css';

const variants = ['filled', 'outline', 'subtle', 'ghost', 'link'] as const;

export const Button = definePolymorphicComponent({
  name: 'Button',
  defaultElement: 'button',
  vocabularyAxes: ['size', 'intent', 'variant'] as const,
  selectors: ['root', 'inner', 'label', 'icon'] as const,
  variants,
  classes,
  defaults: { intent: 'primary', variant: 'filled', size: 'md' },
  render: ({ Element, props, getStyles, ref }) => (
    <Element ref={ref} {...getStyles('root')} data-intent={props.intent} data-variant={props.variant}>
      <span {...getStyles('label')}>{props.children}</span>
    </Element>
  ),
});

// Register variant vocabulary with the theme
export const buttonTheme = Button.extend({
  vocabulary: { variant: defineVocabulary(variants) },
});
```

`getStyles(slot)` returns the class name and inline CSS vars for each slot. Intent and variant resolve against the theme automatically. Consumers get autocomplete on `size`, `intent`, and `variant` narrowed to the theme's literal unions.

**Use it** -- feature code expresses intent, never raw values:

```tsx
<Button intent="primary" variant="filled" size="lg">
  Submit
</Button>

<Button intent="danger" variant="outline" size="sm" component="a" href="/cancel">
  Cancel
</Button>
```

## Key ideas

- **Theme is the contract.** `createTheme()` is the single authority for tokens, semantics, and component defaults. Feature code says `intent="primary"` -- it never picks shades or pixel values.
- **Vocabulary, not magic strings.** `defineVocabulary(['xs', 'sm', 'md', 'lg', 'xl'])` produces a typed tuple backed by Zod. Compile-time inference and runtime validation from a single declaration.
- **One function, one component.** `defineComponent`, `definePolymorphicComponent`, `defineCompound`, or `defineGenericComponent` -- pick the builder that fits. Each replaces Mantine's five-type-alias ceremony with a single config object.
- **Codegen closes the loop.** `soribashi build` generates CSS custom properties and a Tailwind config from your theme. You cannot reference a token that does not exist.
- **Substrate-agnostic.** CSS Modules, Tailwind v3/v4, or plain class names. Mix and match across components.
- **`.extend()` without forking.** Theme-level customization of any component -- override defaults, inject classes, add vocabulary -- without touching the component source.

## Four builders for four shapes

| Builder | Use case | Example |
|---|---|---|
| `defineComponent` | Standard component with style slots | Card, Badge, Alert |
| `definePolymorphicComponent` | Renders as any element (`component="a"`) | Button, Text, Paper |
| `defineCompound` | Multi-part with shared context | Tooltip, Tabs, Accordion |
| `defineGenericComponent` | Data-driven with type inference | Select, Autocomplete, Table |

## Packages

| Package | Purpose |
|---|---|
| `@soribashi/factory` | `defineComponent`, `definePolymorphicComponent`, `defineCompound`, `defineGenericComponent`, `useProps`, `useStyles`, `makeBuilders` |
| `@soribashi/theme` | `createTheme`, `defineVocabulary`, `composeTheme`, intent resolver, default tokens |
| `@soribashi/codegen` | Theme to CSS variables + Tailwind v3/v4 config. CLI: `soribashi build` / `soribashi watch` |
| `@soribashi/blocks` | 14 layout primitives: Box, Stack, Group, Flex, Grid, Grid.Col, SimpleGrid, Container, Center, AspectRatio, Space, Paper, Text, Title |
| `@soribashi/core` | Public barrel re-exporting all of the above |

## Getting started

Requires [Bun](https://bun.sh).

```bash
bun install
bun run dev        # codegen + playground dev server
bun run test       # vitest across all packages (plain `bun test` invokes Bun's own runner)
bun run typecheck
bun run lint       # biome
```

`bun run dev` runs codegen first (theme to CSS custom properties + Tailwind config), then starts the playground. Change the theme and codegen regenerates those outputs.

The flagship consumer is `apps/pilot`, which ports real component recipes (Button, Tooltip, Tabs, Select) onto soribashi; run it with `bun run dev:pilot`.

## Status

Pre-v1. The foundation is stable: factory, theme, codegen, 14 adapted layout blocks, and vocabulary rails. Four component categories have been piloted (Button, Tooltip, Tabs, Select) with a [transferable conversion playbook](docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md). 980+ tests across packages. Packages are versioned at `0.0.0` and not yet published.

## Manifesto

For the full story -- what was imagined, what was built, and why -- see [MANIFESTO.md](./MANIFESTO.md).

## Attribution

Soribashi adapts patterns from [Mantine](https://mantine.dev) (MIT). Factory, blocks, and style-props machinery are derived from Mantine's open-source code. Every adapted source file carries a header comment pointing to the original. See [THIRD-PARTY-LICENSES.md](./THIRD-PARTY-LICENSES.md).

## License

MIT
