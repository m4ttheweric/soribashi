# Soribashi v1 — Implementation Status

**As of 2026-04-25**

All 5 original plans executed end-to-end, the Mantine blocks adaptation pass is complete, **and** two follow-on validation passes (15 + 4 audits) closed all known residual divergences against Mantine `63dafbbf`. **442 vitest tests** across 42 files plus **46 Playwright browser-parity tests**. Playground app builds, typecheck clean (`bun run typecheck`). See `docs/superpowers/divergences/mantine-master.md`, `THIRD-PARTY-LICENSES.md`, and the audit reports under `docs/superpowers/audits/`.

## Mantine blocks adaptation — COMPLETE

**Plan:** `docs/superpowers/plans/2026-04-25-plan-mantine-blocks-adaptation.md`. All 14 layout primitives are now full Mantine adaptations, MIT-attributed.

### Phase status

- ✅ **Phase 0:** Attribution / `THIRD-PARTY-LICENSES.md`
- ✅ **Phase 1:** Theme tokens (`fontWeight`, `lineHeight`, `fontFamily.heading`, `heading.sizes`)
- ✅ **Phase 2:** Helper utilities (`rem`, `getSpacing`, `getRadius`, `getSize`, `getFontSize`, `getLineHeight`, `getShadow`, `getThemeColor`)
- ✅ **Phase 3:** Factory infrastructure (`useRandomClassName`, `hashStyleProps`, `<InlineStyles>`)
- ✅ **Phase 4:** Box style-props machinery (`STYLE_PROPS_DATA`, `parseStyleProps`, `extractStyleProps`, `getBoxMod`)
- ✅ **Phase 5:** Box — full style-prop pipeline + responsive `StyleProp<T>`
- ✅ **Phase 6:** Stack, Group (grow + preventGrowOverflow + filterFalsyChildren), Center (`:where([data-inline])` pattern), AspectRatio (children-aware fix), Space (1-line Box wrapper), Paper (a11y defaults + light/dark border)
- ✅ **Phase 7:** Flex, Grid + Grid.Col, SimpleGrid, Container (block strategy)
- ✅ **Phase 8:** Text (lineClamp, gradient, inline, inherit, RTL truncate, span shorthand) + Title (`order`, `size` accepts `h1`-`h6` token, `lineClamp`, `textWrap`, `getTitleSize` reading `theme.tokens.heading.sizes`)
- ✅ **Phase 9:** Divergence ledger refreshed (`docs/superpowers/divergences/mantine-master.md`); `--mantine-` lint clean (only attribution-comment references remain); final smoke (`bunx vitest run`, `bun run typecheck`, `bun run --filter @soribashi/playground build`) all green
- ✅ **Validation pass 1 (post-Phase 9):** 15 residual divergences against Mantine `63dafbbf` closed in a parallel-batch fix run — Grid math parameterized on `columns`, full Box style-prop parity (`hiddenFrom`/`visibleFrom`/12 missing props/logical-shorthand `mx`/`my`), `getBoxMod` kebab-cases mod keys, utility resolvers drop the `STANDARD_KEYS` allowlist, `rem` accepts px-strings, codegen emits `--heading-text-wrap`, `useRandomClassName` handles React 19 IDs, Paper border var scoped, SimpleGrid renames + selector specificity. See `mantine-master.md` § "Post-adaptation validation pass" for the full table.
- ✅ **Validation pass 2 (4 evidence-based audits):** Four parallel agents produced runnable artifacts and caught 5 more real bugs:
  - **V1 — CSS structural diff:** parser-based audit script (`packages/blocks/scripts/css-parity-audit.ts`) + parity test with allowlist. Found 28 IDENTICAL / 1 TOKEN_DIFF / 5 DECL_DIFF / 5 MISSING / 5 EXTRA across 14 blocks; fixed missing `--grid-column-gap`/`--grid-row-gap` defaults on `.sb-Grid-root` and missing `[dir="rtl"]` override on Text `truncate='start'`.
  - **V2 — Factory parity:** enumerated 42 decision branches in `useStyles` + `useProps`; wrote 74 parity tests (one per branch) — 41/42 confirmed equivalent to Mantine. Fixed US-29: `undefined` CSS-variable values were not filtered from the merged style object (would have rendered the literal string "undefined" to DOM).
  - **V3 — Codegen variable parity:** mapped 64/64 canonical Mantine vars to soribashi equivalents (100%); documented 288 intentional gaps (mostly Mantine's pre-computed color-variant vars which soribashi computes at render time via the intent resolver). Fixed silent `--breakpoint-*` emission gap that would have broken `visibility.css` at runtime.
  - **V4 — Browser-parity smoke:** 46 Playwright computed-style tests across all 14 blocks; surfaced and led to fixing a systemic bug across 13 blocks where consumer's inline `style` prop overwrote `vars()` output (test: `packages/blocks/test/Box/wrapper-style-merge.test.tsx`).

### Deferred (acknowledged, not yet implemented)

Tracked in the divergence ledger under "Deferred":

- Responsive `StyleProp<T>` for non-Box blocks (Flex / Grid / SimpleGrid)
- `GridProvider` context for responsive col span / offset / order
- `Container` grid strategy (with `data-breakout` children)
- `SimpleGrid` `type='container'` mode

**Blocks adapted from Mantine** — all 14 layout primitives now full Mantine fidelity, MIT-attributed, see `docs/superpowers/divergences/mantine-master.md` and `THIRD-PARTY-LICENSES.md`.

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
