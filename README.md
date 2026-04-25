# Soribashi

A component-authoring framework for React, derived from Mantine's open-source patterns. See [`docs/superpowers/specs/2026-04-25-soribashi-design.md`](docs/superpowers/specs/2026-04-25-soribashi-design.md) for the full design.

## Status

Pre-v1. Active implementation.

## Packages

- `@soribashi/factory` — `defineComponent`, `useProps`, `useStyles`
- `@soribashi/theme` — `createTheme`, intent resolver
- `@soribashi/codegen` — theme → CSS variables + Tailwind config
- `@soribashi/blocks` — layout primitives (Box, Stack, Group, etc.)
- `@soribashi/core` — public barrel

## Local development

```bash
bun install
bun test
bun run dev
```
