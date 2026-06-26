# Soribashi

A component-authoring framework for React, derived from Mantine's open-source patterns. Soribashi is the toolkit you use to build a component library, not the library itself: one way to define components, one place to make styling decisions (the theme), and codegen that keeps the two in sync.

See [`docs/superpowers/specs/2026-04-25-soribashi-design.md`](docs/superpowers/specs/2026-04-25-soribashi-design.md) and the [Deterministic UI Patterns RFC](./Deterministic%20UI%20Patterns%20RFC%20v2.md) for the full rationale.

## The idea

Feature code expresses intent through semantic props (`intent="primary"`, `variant="subtle"`, `size="md"`) instead of raw colors and pixel values. Those tokens are defined once in the theme. Codegen turns the theme into CSS variables and a Tailwind config, so a component can't reference a token that doesn't exist and styling decisions don't drift across the codebase. That's the deterministic part.

It adapts Mantine's factory patterns (`defineComponent`, `useProps`, `useStyles`, the intent/variant resolver) rather than forking its components, and stays substrate-agnostic (Tailwind v3/v4 or CSS Modules). Mantine-derived code is attributed in [`THIRD-PARTY-LICENSES.md`](./THIRD-PARTY-LICENSES.md).

## Packages

- `@soribashi/factory`: `defineComponent`, `definePolymorphicComponent`, `defineCompound`, `useProps`, `useStyles`
- `@soribashi/theme`: `createTheme`, `SoribashiProvider`, `useTheme`, `defineVocabulary`, the intent resolver
- `@soribashi/codegen`: theme to CSS variables + Tailwind config (CLI: `soribashi build` / `soribashi watch`)
- `@soribashi/blocks`: layout primitives (Box, Stack, Group, Flex, Grid, Container, Paper, Text, Title, and more)
- `@soribashi/core`: public barrel re-exporting the above

Two apps consume them: `apps/playground` (a theme lab and blocks demo) and `apps/core-radix-pilot` (a pilot porting real components like Button, Tooltip, and Tabs onto soribashi).

## Authoring a component

```tsx
import { defineComponent } from '@soribashi/core';

export const Button = defineComponent<ButtonOwnProps>({
  name: 'Button',
  element: 'button',
  selectors: ['root', 'label', 'icon'] as const,
  variants: ['filled', 'outline', 'subtle', 'ghost', 'link'] as const,
  defaults: { intent: 'primary', variant: 'filled', size: 'md' },
  render: ({ props, getStyles }) => (
    <button {...getStyles('root')} data-size={props.size}>
      <span {...getStyles('label')}>{props.children}</span>
    </button>
  ),
});
```

`getStyles(slot)` returns the class and inline vars for each slot; intent and variant resolve against the theme.

## Status

Pre-v1. The foundation is in place (factory, theme, codegen, and the Mantine blocks adaptation, with roughly 785 unit and Playwright parity tests). Active work is migrating real components onto the framework and building out per-recipe vocabulary rails. See [`STATUS.md`](./STATUS.md) for detail. Packages are versioned at 0.0.0 and not yet published.

## Local development

Needs [Bun](https://bun.sh).

```bash
bun install
bun run dev        # codegen, then the playground dev server
bun test           # vitest across all packages
bun run typecheck
bun run lint       # biome
```

`bun run dev` runs codegen first (theme to generated CSS + Tailwind config) and then starts the playground. Change the theme and codegen regenerates those outputs.
