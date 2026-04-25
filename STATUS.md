# Soribashi v1 — Implementation Status

**As of 2026-04-25**

All 5 original plans executed end-to-end. **233 tests passing** across 27 test files. Playground app builds (21KB CSS, 190KB JS gzipped 60KB) and runs. **Mantine validation pass complete** — see `docs/superpowers/divergences/mantine-master.md` for the full ledger satisfying Hard Rule 13.

## Mantine blocks adaptation — IN PROGRESS

A second pass to faithfully adapt Mantine's blocks (per `docs/superpowers/specs/2026-04-25-mantine-blocks-adaptation-design.md`) is **partially complete**:

**Completed (Phases 0–5 + Stack):**
- ✅ Phase 0: `THIRD-PARTY-LICENSES.md` with Mantine MIT attribution
- ✅ Phase 1: theme additions (`fontWeight`, `lineHeight`, `fontFamily.heading`, `heading.sizes`)
- ✅ Phase 2: helper utilities (`rem`, `getSpacing`, `getRadius`, `getSize`, `getFontSize`, `getLineHeight`, `getShadow`, `getThemeColor`)
- ✅ Phase 3: factory infrastructure (`useRandomClassName`, `hashStyleProps`, `<InlineStyles>`)
- ✅ Phase 4: Box style-props machinery (`STYLE_PROPS_DATA`, `parseStyleProps`, `extractStyleProps`, `getBoxMod`)
- ✅ Phase 5: Box itself — full Mantine-faithful with style-prop pipeline + responsive `StyleProp<T>` support (20 dedicated tests)
- ✅ Phase 6 (Stack only): adapted to Box-wrapping pattern with var-based theming

**Remaining (Phases 6 partial + 7–9):**
- ⏳ Group (with `grow` + `preventGrowOverflow`), Center, AspectRatio (children-aware fix), Space, Paper (a11y defaults)
- ⏳ Flex (responsive style props), Grid + GridCol + GridProvider + responsive cols, SimpleGrid (container queries + auto-fill/auto-fit), Container (block + grid strategies + breakout)
- ⏳ Text (lineClamp, gradient, inline, inherit), Title (text-wrap, lineClamp, getTitleSize)
- ⏳ Final cleanup: update style.css imports, divergence ledger refresh, lint check for `--mantine-` references

The remaining 12 blocks still work in their original soribashi form (data-attribute selectors). Tests pass; only the Stack block currently uses the new Mantine-faithful pattern.

**Pre-existing TypeScript errors surfaced:** With `tsconfig.json` properly in place again, `bun run typecheck` reveals pre-existing TS errors in `factory.tsx`, `use-styles.ts`, `Text.tsx`, `Title.tsx` that were latent because the root `tsconfig.json` had been deleted at some point earlier. These are unrelated to the Mantine adaptation and should be addressed in a focused fix pass. Tests and the playground build are unaffected.

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
