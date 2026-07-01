# Soribashi — Implementation Status

> **Current as of 2026-05-28.** The v1 Mantine-adaptation foundation (2026-04-25, recorded below) is complete and stable. Since then the project has been building the **recipe pilot** — adapting real component recipes (Button, Tooltip, Tabs) on top of the foundation — and hardening the recipe-authoring conventions. This top section tracks that post-v1 work; the v1 record follows unchanged below.

## Post-v1: recipe pilot + library authoring hygiene

### Recipe pilots (Waves 1-3) — SHIPPED

The `apps/pilot` app ports real components from the host codebase onto soribashi, one category at a time:

- **Wave 1 — Button** (`#1`): pure-styled-primitive category via `definePolymorphicComponent`. Token consolidation (dropped shad-* layer, renamed error→danger, collapsed surfaces). Journal: `docs/superpowers/pilots/2026-04-26-button-conversion.md`.
- **Wave 2 — Tooltip** (`#7`): transient-overlay compound via the new `defineCompound` primitive. Wraps Radix, adds the `surface.floating` formalized foreground pairing. Journal: `docs/superpowers/pilots/2026-05-04-tooltip-pilot.md`.
- **Wave 3 — Tabs** (`#8`): persistent-navigational compound with a polymorphic Trigger part.

### Library authoring hygiene (PR #9 + PR #10) — MERGED 2026-05-28

Two cross-cutting authoring conventions that should have been settled before Wave 1, surfaced during the Wave 3 review and shipped as a 3-PR rollout:

- **PR #9 — CSS modules** (squash `2cc0494`): all three recipes migrated from plain `.css` with `cr-Recipe-slot` global prefixes to `.module.css` with plain `.root`/`.trigger`/`.content` selectors. Build-time scoping replaces convention-only prefixing. Added `vite-env.d.ts` for typed module imports; `:global(.dark)` for the dark-mode rule; `:where(:disabled, [aria-disabled])` for polymorphic disabled state. Playbook §§ 2.1-2.4 codify the pattern. Spec: `docs/superpowers/specs/2026-05-12-css-modules-migration-design.md`.
- **PR #10 — vocabulary rails** (squash `ef99d35`): soribashi has **no opinion** on `size`/`intent`/`variant` *values*; developers declare their own vocabulary. New surface:
  - `defineVocabulary(values)` — the only sanctioned vocabulary constructor; wraps Zod so the inferred type and the runtime schema can't drift.
  - Theme `semantic` field split into `vocabulary` (size/intent/variant enums) + `semanticTokens` (text/surface/border/accent aliases). Hard cutover, no shim.
  - `Recipe.extend({ vocabulary, defaultProps, classNames, styles, vars, attributes })` replaces `withDefaults()` across all four builders. Vocabulary overrides support replace-mode (a `Vocabulary`) and extend-mode (`(current) => Vocabulary`), resolved at `createTheme()` time.
  - `createSoribashiBuilders(theme)` — consumer entry point; registers theme vocab in a module-level Zod registry (idempotent) and returns the builders.
  - `vocabularyAxes` recipe opt-in + dev-only Zod runtime validation with actionable error messages.
  - Spec: `docs/superpowers/specs/2026-05-12-vocabulary-rails-design.md`.

### Next: PR #11 — pilot recipe migration (NOT YET STARTED)

PR #10 built the rails but did **not** wire the pilot recipes to them. PR #11 makes the pilot consume its own infrastructure: a `builders.ts` calling `createSoribashiBuilders(theme)`, recipes opting into `vocabularyAxes`, Tooltip/Tabs declaring their variant vocabularies via `Recipe.extend()`. Full briefing: `docs/superpowers/sessions/2026-05-28-pilot-migration-handoff.md`.

### Post-v1 test counts (on `main` @ `ef99d35`)

| Package | Tests |
|---|---|
| `@soribashi/theme` | 82 |
| `@soribashi/codegen` | 137 |
| `@soribashi/factory` | 472 |
| `@soribashi/blocks` | 244 |
| `apps/pilot` | 47 |

Typecheck clean. (The 785-total figure in the v1 record below predates the pilot + hygiene work and the per-package growth since.)

---

# Soribashi v1 — Implementation Status (foundation record)

**As of 2026-04-25**

All 5 original plans executed end-to-end, the Mantine blocks adaptation pass is complete, **and** three full audits — two early validation passes plus the comprehensive Hard-Rule-13 full audit — have closed all known divergences against Mantine `63dafbbf`. **739 vitest tests** across 54 files plus **46 Playwright browser-parity tests** = 785 total. Playground app builds, typecheck clean. Coverage manifest covers every TS/TSX file under `packages/*/src/`. See `docs/superpowers/divergences/mantine-master.md`, `docs/superpowers/audits/2026-04-25-coverage-manifest.md`, `docs/superpowers/roadmap/mantine-derivable-future-work.md`, and `THIRD-PARTY-LICENSES.md`.

## Mantine full audit pass — COMPLETE (2026-04-25)

Hard Rule 13 enforcement complete across every soribashi file derivable from Mantine. Pinned to `mantinedev/mantine@63dafbbf5f0135eb36455b7add4c0ddcd0f3240a`.

- **Coverage manifest:** `docs/superpowers/audits/2026-04-25-coverage-manifest.md` — every file in scope listed with status and audit-doc link.
- **Master ledger:** `docs/superpowers/divergences/mantine-master.md` — 1090 lines, ~50 divergence entries split across `Aligned` / `Kept` / `Closed` / `Full audit pass — 2026-04-25` (Tier 1 + Tier 2 entries) / `Validated and matching` sections.
- **Per-tier audit docs:** Tier 1 (`tier-1-{factory,polymorphic,generic,with-props,inline-styles,hash-and-classname}.md`), Tier 2 (`tier-2-{theme,provider-types,factory-additions,box-style-props,codegen}.md`), Tier 3 (`tier-3-blocks-and-utils.md`).
- **Roadmap:** `docs/superpowers/roadmap/mantine-derivable-future-work.md` — 12 (e) "missing port" candidates surfaced, sized S/M/L for follow-up consideration.

### Bugs caught by the full audit (11 total across all phases)

Real behavioral bugs found and fixed via TDD across the audit:

1. `useStyles` — `undefined` CSS variable values rendered as the string `"undefined"` (V2 / pre-pass; US-29)
2. `InlineStyles` — empty `selector { }` rule emitted when `styles={}` (Tier 1 / Task 1.5; ST-05)
3. `makeWithProps` — `withProps()` result missing `extend` propagation (Tier 1 / Task 1.1; B4)
4. `makeWithProps` — `withProps()` result missing recursive `withProps` chaining (Tier 1 / Task 1.2; P17c)
5. `composeTheme.mergeTokens` — silently dropping `fontWeight` / `lineHeight` / `heading` fields when child themes extend a base (Tier 2 / T2-A; CT-BUG-1..5)
6. `getBoxMod` — numeric-`0` mod values silently dropped (`mod={{ count: 0 }}` lost) (Tier 2 / T2-D; GBM-Z1)
7. `parseStyleProps` — `{ base: 'md' }` (only-base) treated as responsive, emitting unnecessary `<InlineStyles>` (Tier 2 / T2-D; PSP-B1)
8. `emit-css.ts` — `tokens.breakpoint` declared in types but never emitted as `--breakpoint-*` vars (V3 + Tier 2 / T2-E; BUG-E-1)
9. `emit-css.ts` — `emitDarkTokenLines` only handled 5 of 10 token-type fields (silent loss of fontFamily/fontWeight/lineHeight/breakpoint/heading dark overrides) (Tier 2 / T2-E; BUG-E-2)
10. Block wrapper style-merge — consumer's inline `style` prop overwrote `vars()` output across 13 blocks (V4 / pre-pass)
11. `--breakpoint-*` emission gap surfaced + fixed (V3 / pre-pass)

### Audit phases

- ✅ **Phase 1 (Tier 1, sequential):** 6 load-bearing factory primitive audits with parity tests — `factory.tsx`, polymorphic + define-polymorphic, define-generic, with-props, inline-styles bundle, hash + use-random-class-name. 161+ new parity tests.
- ✅ **Phase 2 (Tier 2, parallel):** 5 batches over theme / provider+types / factory-additions / Box-style-props / codegen. Audit reports + ledger fragments + TDD bug fixes. 5 fragments merged into master ledger.
- ✅ **Phase 3 (Tier 3, fast):** Confirmatory pass over 14 blocks + utils + Grid math + core barrel using existing V1/V4 infrastructure. 0 new bugs.
- ✅ **Phase 4 (consolidation):** Coverage manifest finalized, roadmap doc populated, master ledger consolidated, STATUS + Hard Rule 13 updated, final smoke clean.

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
- Host library integration in the consuming codebase (separate effort)
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
