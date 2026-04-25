# Soribashi v1 — Implementation Status

**As of 2026-04-25**

All 5 original plans executed end-to-end. **245 tests passing** across 28 test files. Playground app builds, typecheck clean (`bun run typecheck`). **Mantine validation pass complete** — see `docs/superpowers/divergences/mantine-master.md`.

## Mantine blocks adaptation — IN PROGRESS (handoff snapshot)

**Resume by reading:** `docs/superpowers/plans/2026-04-25-plan-mantine-blocks-adaptation.md` § "Handoff snapshot — 2026-04-25 (mid-execution)" at the top of the document.

### Phase status

- ✅ **Phase 0:** Attribution / `THIRD-PARTY-LICENSES.md`
- ✅ **Phase 1:** Theme tokens (`fontWeight`, `lineHeight`, `fontFamily.heading`, `heading.sizes`)
- ✅ **Phase 2:** Helper utilities (`rem`, `getSpacing`, `getRadius`, `getSize`, `getFontSize`, `getLineHeight`, `getShadow`, `getThemeColor`)
- ✅ **Phase 3:** Factory infrastructure (`useRandomClassName`, `hashStyleProps`, `<InlineStyles>`)
- ✅ **Phase 4:** Box style-props machinery (`STYLE_PROPS_DATA`, `parseStyleProps`, `extractStyleProps`, `getBoxMod`)
- ✅ **Phase 5:** Box — full style-prop pipeline + responsive `StyleProp<T>`
- ✅ **Phase 6:** Stack, Group (grow + preventGrowOverflow + filterFalsyChildren), Center (`:where([data-inline])` pattern), AspectRatio (children-aware fix), Space (1-line Box wrapper), Paper (a11y defaults + light/dark border)
- ✅ **Phase 7:** Flex, Grid + Grid.Col, SimpleGrid, Container (block + grid strategies + `data-breakout` children)
- ✅ **Phase 8 (partial):** Text (lineClamp, gradient, inline, inherit, RTL truncate, span shorthand)
- ⏳ **Phase 8 (remaining):** Title (textWrap, lineClamp, getTitleSize from `theme.heading.sizes`)
- ⏳ **Phase 9:** Cleanup (divergence ledger refresh, `--mantine-` lint, final smoke + STATUS update)

### Deferred from original plan (recorded in plan handoff snapshot)

- Responsive `StyleProp<T>` for non-Box blocks (Flex/Grid/SimpleGrid)
- `GridProvider` context for responsive col span/offset/order
- SimpleGrid `type='container'` mode

Typecheck passes cleanly (root tsconfig with `noEmit: true`, `allowImportingTsExtensions: true`).

## What was built

### Plans (all written first, then executed)

- `docs/superpowers/plans/2026-04-25-plan-1-foundation.md` — workspace + theme + codegen
- `docs/superpowers/plans/2026-04-25-plan-2-factory.md` — `@soribashi/factory` core framework
- `docs/superpowers/plans/2026-04-25-plan-3-generic-polymorphic.md` — generic + polymorphic + escape hatches
- `docs/superpowers/plans/2026-04-25-plan-4-blocks.md` — 14 layout primitives
- `docs/superpowers/plans/2026-04-25-plan-5-playground.md` — `@soribashi/core` barrel + playground + Button

### Packages

| Package | Purpose | Tests |
|---|---|---|
| `@soribashi/theme` | `createTheme`, intent resolver, default tokens, composition | 29 |
| `@soribashi/codegen` | theme → CSS variables + Tailwind v3/v4 config; CLI | 32 |
| `@soribashi/factory` | `defineComponent`, `useProps`, `useStyles`, `cn`, generic + polymorphic, escape hatches | 63 |
| `@soribashi/blocks` | Box, Stack, Group, Flex, Grid, Grid.Col, SimpleGrid, Container, Center, AspectRatio, Space, Paper, Text, Title | 28 |
| `@soribashi/core` | Public barrel | — |

**Total: 152 tests across 23 files**

### App

- `apps/playground` — Vite + React + TS + Tailwind v3
  - Theme defined in `apps/playground/src/theme/index.ts`
  - Codegen produces `apps/playground/src/generated/theme.css` and `tailwind.config.generated.js` from the theme
  - Real `Button` component built using `defineComponent` from `@soribashi/core`
  - **Theme Lab** page: 6 intents × 5 variants matrix + 3 sizes + states (loading/disabled/fullWidth)
  - **Blocks Demo** page: Stack, Group, Grid, SimpleGrid, Typography, Center
  - Dark mode toggle wired to `.dark` class
  - Builds: 24KB CSS + 184KB JS gzipped (58KB)
  - Dev server boots and serves HTML

## Try it

```bash
bun install
bun run codegen        # regenerate theme.css + tailwind.config.generated.js
bun run dev:playground # open http://localhost:5173
bun test               # run all tests via vitest
```

Or for the full dev loop:

```bash
bun run dev            # codegen + playground in sequence
```

## Key wins from the design that landed

- **Theme is the contract** — every component accesses tokens through `theme`; codegen ensures Tailwind config matches.
- **`defineComponent({...})`** — single config object, types inferred. The `Button` component implementation in `apps/playground/src/components/Button/Button.tsx` is ~70 lines (vs Mantine's ~280 for the equivalent).
- **Auto-vars for intent × variant** — components declaring `variants` automatically get `--{name}-bg/-color/-border/-hover/-active` on root via the theme's `intentResolver`. No manual `varsResolver` needed for the standard case.
- **Surface elevation** as first-class — `bg="raised"` etc. resolves to `var(--surface-raised)`. Avoids the Mantine workaround documented in console-archive (manual `--mantine-color-background-1..4` injection).
- **Substrate-agnostic styling** — `defineComponent` accepts CSS module classes, Tailwind/CVA recipes, or plain class names. `Button` uses plain CSS that references `var(--button-bg)` etc.
- **Layered token composition** — `createTheme({ extends: baseTheme, ... })` works; tested in roundtrip.
- **Generic component support** — `defineGenericComponent<SelectOwnProps<T>>` preserves the type parameter.
- **Polymorphic component support** — `definePolymorphicComponent` with `as` prop; `Box`, `Text` use it.
- **Codegen drift impossible** — Tailwind config is generated from the theme; you cannot reference a token that doesn't exist.

## Not yet done (deferred from the spec)

- Playwright visual tests (post-v1, can be added once playground is stable)
- ClaimViewIslands integration in the assured codebase (separate effort)
- Per-tenant scope codegen for multi-tenant apps (works in `createTheme({ scope: ... })` but the playground doesn't demo it)
- Tailwind v4 mode tested end-to-end (codegen supports it; playground uses v3)
- The `tailwindPassthrough` escape hatch for libraries like Tremor (open question #3 in the spec)
- Lint rule for color classes inside soribashi-component recipes (open question #2)

## Known cosmetic gaps

- The playground's nav header buttons don't use the Button component (just raw `<button>` with default browser styling) — a minor cosmetic loose end.
- Some redundant prop destructure in block render functions (`classNames, styles, vars, attributes, unstyled, className, style` are pulled out and discarded). Could be extracted into a helper but the duplication is intentional and clear for now.

## Git history

All work committed in atomic commits per task. `git log --oneline` shows the progression:

```
chore: initialize repository with docs and gitignore
chore: add Bun workspace, base TS config, and biome
feat(theme): add @soribashi/theme with createTheme, intent resolver, default tokens, composition
feat(codegen): add @soribashi/codegen with build/watch + CLI + roundtrip tests
chore: Plan 1 (foundation) complete — 61 tests passing across theme + codegen
feat(factory): add @soribashi/factory with defineComponent, useProps, useStyles, autoVars
feat(factory): add definePolymorphicComponent, defineGenericComponent, escape hatches
feat(blocks): add @soribashi/blocks with 14 layout primitives
feat(playground): add @soribashi/core barrel + Vite playground with Button + Theme Lab + Blocks Demo
```
