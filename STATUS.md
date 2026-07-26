# Soribashi: Implementation Status

> **Current as of 2026-07-25.** Slice 2 (below) is the current top record: ten native layout recipes, universal style props, and the deletion of `@soribashi/blocks` and its Playwright parity tier. It sits above the slice 1b record, the recipe-pilot record (2026-07-01), and the v1 Mantine-adaptation foundation record (2026-04-25), all kept unchanged further down this file.

## Slice 2: layout recipes, universal style props, and the deletion of blocks (2026-07-25)

Slice 1b (below) shipped `@soribashi/ui` with two recipes, Button and Popover, and restored `@soribashi/blocks`' Playwright browser-parity fixtures alongside the workshop app just to have something for `apps/workshop` to point codegen at. That left two parallel component surfaces: a real, three-tier-verified `@soribashi/ui` recipe pair, and a 14-primitive Mantine-adapted blocks package with its own, separate Playwright parity tier. Slice 2 closes that split: the blocks package's style-prop engine moves into `@soribashi/factory` where every builder resolves it the same way, ten of blocks' 14 layout shapes come back as native `@soribashi/ui` recipes (Grid's new `cols`/`minChildWidth` prop absorbs what Grid.Col and SimpleGrid did; `Flex` and `Space` did not get a new-recipe port this slice), and `@soribashi/blocks` plus the parity tier that verified it are deleted outright. `@soribashi/core` now exports the framework only, no components.

Branch `feat/slice-2-layout`, 17 commits ahead of `main` (merge-base `140e2315`), 11 numbered tasks executed in strict order plus this closing task.

### What landed

- **The style-prop engine moved from blocks into factory.** `extractStyleProps`/`parseStyleProps`/`STYLE_PROPS_DATA` and their per-property resolvers now live under `packages/factory/src/style-props/`, called from exactly one place, `packages/factory/src/style-props/use-style-props.tsx`'s `useStyleProps` hook, itself called from inside all four builders (`defineComponent`, `definePolymorphicComponent`, `defineGenericComponent`, `defineCompound`'s Root part). A recipe never calls the extraction functions itself; the Box-style props (`m`/`p`/`bg`/`fz`/`fw`/...) and the four visibility props (`hiddenFrom`/`visibleFrom`/`lightHidden`/`darkHidden`) arrive on every recipe for free.
- **Visibility utilities now come from codegen, not a hardcoded stylesheet.** `emitCss` gained a `soribashi.utilities` cascade layer that generates `.sb-hidden-from-*`, `.sb-visible-from-*`, `.sb-light-hidden`, and `.sb-dark-hidden` straight from the theme's own breakpoint tokens and dark-mode selector, closing a `2xl`/`3xl` gap the old hardcoded `blocks/src/Box/visibility.css` never covered.
- **Ten native layout recipes in `@soribashi/ui`:** `Box`, `Stack`, `Group`, `Center`, `AspectRatio`, `Grid`, `Container`, `Paper`, `Text`, `Title`, alongside the existing `Button` and `Popover` (twelve recipes total). Each is the same fixed four-file layout as Button and Popover, each declares `recipeCategory` (eleven are category 1, Popover stays category 2), and two of them (`Button`'s `BUTTON_HEIGHTS`, `Container`'s `CONTAINER_WIDTHS`) establish the dimension-record pattern for a size-keyed CSS variable that isn't a spacing/radius/font-size token.
- **The contrast matrix grew a classification guard.** `packages/ui/src/a11y/matrix-classification.ts`'s `MATRIX_CLASSIFICATION` map now requires every recipe, colour-bearing or not, to declare itself `'covered'` (Button's full grid, or a `SMALL_COVERAGE` cell for Paper/Popover/Text/Title) or `{ exempt: '<reason>' }` (the seven geometry-only layout recipes), guarded by name in `matrix-guard.test.ts`. Adding that coverage surfaced a real AA failure and a controller ruling: Text's `dimmed` state (`--text-muted`, then `colors.neutral.500`) measured 4.490:1 against `--surface-canvas` and 4.288:1 against `--surface-raised` in light scheme, both below the 4.5:1 floor. `text.muted` was remapped to `colors.neutral.600`; every muted/dimmed cell was re-measured in both schemes afterward, and the lowest of them (dimmed text on `--surface-raised`, light scheme) came in at 6.810:1, comfortably clear.
- **`@soribashi/blocks` and its Playwright browser-parity tier are deleted.** Nothing in `packages/ui` or `packages/factory` imports `@soribashi/blocks`; the package, `tests/browser-parity`, and the root `test:browser` script are gone. `@soribashi/core` no longer depends on it and exports framework primitives only (builders, hooks, theme/style-prop utilities, types), never a component.
- **Registry smoke now covers a layout recipe.** `bun run smoke:registry` vendors `button` and `stack` together through the real `shadcn` CLI in one throwaway project, generalizing the bundle-marker check to a recipe-name-prefixed custom property (`--sb-button-h`, `--sb-stack-gap`) instead of a same-named CSS Modules class, since both recipes declare a `.root` selector.
- **Linux visual baselines.** Every new visual scenario got a committed `*-chromium-linux.png`, generated via the pinned Docker command in `.github/workflows/visual-baselines.yml` (`mcr.microsoft.com/playwright:v1.59.1-noble`); see the gate state below for counts.
- **The authoring skill (`.claude/skills/authoring-a-recipe/SKILL.md`) and this repo's prose are current with the above.** Style props and visibility props arriving free, `mod` being Box-only, the dimension-record pattern, the generic-params trap, the `MATRIX_CLASSIFICATION`/`RESKIN_FIXTURES` registration obligations, and the collapse to three test tiers are all documented there now.

### Gate state (2026-07-25, branch `feat/slice-2-layout`, fresh full run at the end of this task)

- `bun run test`: 1190 tests passed across 106 files.
- `bun run typecheck`: clean.
- `bun run lint`: 0 errors, 441 baseline warnings (pre-existing `noExplicitAny`, not part of this slice's scope).
- `bun run test:visual`: 16/16 tests passed across 12 files (darwin baselines locally; advisory only, per the skill). Linux baselines: 16 committed `*-chromium-linux.png` files match the 16 darwin baselines one for one; 10 are new (AspectRatio, Box, Center, Container, Grid, Group, Paper, Stack, Text, Title), Popover's 2 existing baselines changed (the `text.muted` remap legitimately shifted the description colour), and Button's 4 existing baselines are confirmed byte-identical to the prior commit.
- `bun run smoke:registry`: PASS (`button` and `stack` vendored together via the real `shadcn` CLI).

### Deliberately future (not yet done)

- **Three `as any` casts for `stylePropsStyle`** in `define-component.tsx`/`define-polymorphic-component.tsx`/`define-generic-component.tsx`. `defineCompound`'s `CSSProperties | null` pattern is the fix; not applied to the other three builders this slice.
- **Group has no grow-formula test at `n=1`/`n=0` children.** The grow-distribution math is covered at typical child counts; the edge counts are untested.
- **`fw`'s identity resolver silently no-ops an invalid token-key string** instead of erroring (`packages/factory/src/style-props/style-props-data.ts`). A real font-weight token resolver, rather than `String(v)` passthrough, would close that DX trap.
- **Registry smoke's scratch `pkg.dependencies` hardcodes `@soribashi/core`** rather than deriving the dependency list from `item.dependencies`. Works today because every registry item currently only needs `@soribashi/core`; would silently under-declare if that stopped being true.
- **The contrast matrix's light-scheme measurement relies on declaration order** (a pre-existing fragility inherited, not introduced, this slice): Popover's `SMALL_COVERAGE` cell measures the title's `--text-default`, not the description's `--text-muted`.
- **Publishing.** Unchanged from slice 1b: packages are still `version: 0.0.0`, `private: true`, unpublished; `smoke:registry` vendors against a local, in-repo copy rather than a real `bun add`.
- **More components.** Categories 3 (persistent compound, e.g. Tabs) and 4 (generic/form, e.g. Select) are proven at the framework level from the earlier recipe-pilot work but still have no `@soribashi/ui` recipe. Within category 1 itself, `Flex` and `Space` (two of the old blocks package's 14 primitives) did not get a new-recipe port this slice; no decision has been made on whether they're still wanted.

---

## Slice 1b: `@soribashi/ui`, the workshop, and the verification story (2026-07-25)

Slice 1a (2026-07-24, its own record lives in `docs/superpowers/sessions/`) rebuilt codegen for a real target and removed the last apps that predated the vocabulary rails (`apps/pilot`, `apps/playground`, `apps/shadcn-starter`), leaving no consumer app and codegen erroring with nothing to point at. Slice 1b closes that gap: a real package, a real app to view it in, and a verification story that makes "fully re-themeable through the theme alone" a checked fact rather than a claim.

### What landed

- **Two recipes in `@soribashi/ui`.** `Button` (category 1, pure styled primitive, `definePolymorphicComponent`) and `Popover` (category 2, transient overlay compound, `defineCompound` over `@base-ui/react`'s `Popover`). Each is the fixed four-file layout: `<Name>.tsx`, `<Name>.module.css`, `<Name>.test.tsx`, `<Name>.visual.test.tsx`, at `packages/ui/src/recipes/<Name>/`. Every recipe declares `export const recipeCategory` so the manifest derivation can classify it without guessing.
- **`apps/workshop`.** A restored consumer app (`bun run dev:workshop`): a showcase page per recipe across its full intent x variant x size surface in light and dark, a token reference page, and a multi-tenant theming demo (two brand themes, each scoped to its own class selector, one with an extra `.dark` wrapper proving scoped dark mode works independent of any other subtree on the same page). Browser-parity fixtures were restored alongside it; the `browser` CI job (`tests/browser-parity`, 46 Playwright computed-style tests over the 14 blocks) was un-gated again at this point. (Superseded by slice 2, below: `@soribashi/blocks` and this Playwright parity tier were both deleted; the layout shapes it tested moved into `@soribashi/ui` as native recipes verified by the same three-tier story as every other recipe.)
- **Three verification tiers**, wired into `packages/ui`'s own vitest configs: tier 1 logic (Node, `vitest.config.ts`), tier 2 browser (real Chromium via `@vitest/browser-playwright`, `vitest.browser.config.ts`, render/interaction/accessibility per recipe), tier 3 visual (`vitest.visual.config.ts`, screenshot baselines, run via `bun run test:visual`). Tiers 1 and 2 run under the root `bun run test`; tier 3 is separate because its baselines are platform-sensitive (see below).
- **Two conformance gates.** `packages/ui/test/no-hardcoded-values.test.ts` scans every recipe stylesheet for colour or length literals that didn't arrive via `var(...)` (short allowlist: `0`/`1px`/`2px`/`100%`, unitless/time values). `packages/ui/src/conformance/reskin.test.tsx` renders every recipe under a second, deliberately garish theme with zero recipe-source changes and asserts the computed background/foreground/radius actually moved; a recipe without a matching `RESKIN_FIXTURES` entry fails the guard by name.
- **A WCAG AA contrast matrix.** `packages/ui/src/a11y/contrast-matrix.test.tsx` checks >= 4.5:1 across every intent x variant x size combination (6 x 5 x 5 = 150 combinations for Button), in both light and dark scheme, using a canvas-based colour normalizer (this theme's `oklch()`/`light-dark()` tokens don't reliably serialize to `rgb()` via `getComputedStyle` on the pinned Chromium build). The matrix passes 300/300 cells across both schemes.
- **A visual oracle.** Per-recipe screenshot baselines under `__screenshots__/`, generated exclusively by the `visual-baselines` GitHub Actions workflow (`workflow_dispatch`) or the pinned Docker command it documents, never committed from a local (darwin) machine, since Vitest suffixes baseline filenames by platform and a `-chromium-darwin.png` is a different file from the `-chromium-linux.png` CI actually compares against. The `visual` CI job compares only; it never updates.
- **A derived manifest and a shadcn-compatible registry.** `bun run generate:ui` (`packages/ui/scripts/generate-manifest.ts` + `generate-registry.ts`, both thin writers over the shared `derive.ts`) reads every recipe's frozen metadata and CSS to produce `packages/ui/manifest.json` (name, category, builder, slots, vocabulary axes, variants, defaults, file paths, theme token dependencies) and `packages/ui/registry/*.json` (a `registry:ui` item per recipe, shadcn-schema-compatible). Nothing in either file is hand-authored; `manifest-drift.test.ts` rebuilds through the same functions and the `codegen-drift` CI job fails on any diff against what's committed.
- **A registry install smoke check.** `bun run smoke:registry` scaffolds a throwaway Vite + React project, drives the real `shadcn` CLI (`bunx shadcn@latest add ./registry/button.json`) against the generated registry, installs, builds, and asserts the recipe's own CSS-module class name made it into both the built CSS and JS bundles. It's its own CI job (`registry-smoke`) because it's network-dependent and takes minutes.
- **The `authoring-a-recipe` skill.** `.claude/skills/authoring-a-recipe/SKILL.md` replaces the stale `visual-parity-check` skill (which targeted the now-removed `apps/shadcn-starter`) with the agent-facing checklist for adding or changing a `packages/ui` recipe: four-file layout, builder selection, the two CLAUDE.md invariants, CSS rules, data-attribute conventions, per-tier test expectations, the post-authoring manifest regen step, and the traps that have already bitten someone once.
- **README reframed** around what this repo actually demonstrates: soribashi the authoring tool, `@soribashi/ui` the thing built with it, and the verification story that backs its claims.

### Gate state (2026-07-25, branch `feat/slice-1b-vertical`, at the end of the final review fix wave)

- `bun run test`: 1233 tests passed across 107 files (tiers 1 + 2 across every package, including the contrast matrix, reskin guard, and no-hardcoded-values scan; the count dropped by one when the final fix wave merged two hardcoded registry drift tests into one manifest-derived test with identical byte-comparison coverage).
- `bun run typecheck`: clean.
- `bun run lint`: 0 errors, 479 baseline warnings (pre-existing `noExplicitAny` in Mantine-adapted block internals; not part of this slice's scope).
- `bun run test:browser`: 46/46 Playwright browser-parity tests passed.
- All five CI jobs (`checks`, `codegen-drift`, `registry-smoke`, `browser`, `visual`) are live and un-gated; none are skipped or marked allow-failure.

### Deliberately future (not yet done)

- **Publishing.** `@soribashi/core`, `@soribashi/ui`, and their siblings are still `version: 0.0.0`, `private: true`, and unpublished. The registry smoke check vendors against a local, in-repo copy of the packages rather than a real `bun add @soribashi/core`; that gap only closes once publishing exists. There is no hosted registry URL.
- **More components.** Two of the four authoring categories are represented in `@soribashi/ui` (category 1 via Button, category 2 via Popover). Categories 3 (persistent compound, e.g. Tabs) and 4 (generic/form, e.g. Select) are proven at the framework level from the earlier recipe-pilot work (below) but have no `@soribashi/ui` recipe yet. The ~20-component conversion sweep outlined in the playbook (§5) remains future work.
- **`primary.700`'s dark chroma was gamut-clamped** (0.2153 to 0.1682, ~22% desaturation vs light); design pass to accept or redesign.
- **`subtle`'s dark-mode appearance changed** for success/danger/warning/info (light chip to dark tinted chip, matching primary); review against the committed dark baseline PNG.
- **Tenant themes brand only their light primaries**; tenant dark ramps fall back to the default blue; branding them is future design.
- **The `ui` theme emits no `--accent-*` tokens**; Button's focus ring rides a var fallback; decide whether accent becomes a real semantic family.
- ~~Popover has no contrast-ratio coverage of its own yet~~ resolved in slice 2: Popover has a `SMALL_COVERAGE` cell in the contrast matrix now.
- **Compound slot metadata needs a runtime source on `defineCompound`** before any future slice adds another compound (see `packages/factory/src/recipe-meta.ts`'s `slots` doc comment). Slice 2 did not add a compound (its ten new recipes are all category 1 or, for Popover, already-existing category 2), so this is still open.
- **`defineCompound` does not strip Base UI's `render` prop itself**; recipes do it manually; framework hardening candidate.
- **Spec sections 6.1/6.2 promised `@property` registration of recipe-local `--sb-*` vars**; not implemented this slice (set inline, never registered); recorded here as a deliberate narrowing.
- **First real push contingency:** if the visual CI job fails with only text-metric diffs, dispatch `visual-baselines.yml` on real Actions and recommit (Docker-generated baselines may differ from ubuntu-latest fonts).

---

> **Recorded 2026-07-01.** The v1 Mantine-adaptation foundation (2026-04-25, recorded below) is complete and stable. Since then the project has been building the **recipe pilot** (adapting real component recipes: Button, Tooltip, Tabs, Select, on top of the foundation) and hardening the recipe-authoring conventions. This section tracks that post-v1 work; the v1 record follows unchanged below.

## Post-v1: recipe pilot + library authoring hygiene

### Recipe pilots (Waves 1-4): SHIPPED

The `apps/pilot` app ports real components from the host codebase onto soribashi, one category at a time:

- **Wave 1: Button** (`#1`): pure-styled-primitive category via `definePolymorphicComponent`. Token consolidation (dropped shad-* layer, renamed error→danger, collapsed surfaces). Journal: `docs/superpowers/pilots/2026-04-26-button-conversion.md`.
- **Wave 2: Tooltip** (`#7`): transient-overlay compound via the new `defineCompound` primitive. Wraps Radix, adds the `surface.floating` formalized foreground pairing. Journal: `docs/superpowers/pilots/2026-05-04-tooltip-pilot.md`.
- **Wave 3: Tabs** (`#8`): persistent-navigational compound with a polymorphic Trigger part.
- **Wave 4: Select** (4A `e5c0699` + 4B `#12` squash `5e4b2aa`, merged 2026-07-01): data-driven generic form control. Wave 4A landed the `defineGenericComponent` generic-signature builder substrate; Wave 4B shipped the Select pilot on top of it. Completes the playbook's four authoring categories. Plans: `docs/superpowers/plans/2026-06-22-wave-4a-generic-builder-substrate.md`, `docs/superpowers/plans/2026-06-23-wave-4b-select-pilot.md`.

### Library authoring hygiene (PR #9 + PR #10): MERGED 2026-05-28

Two cross-cutting authoring conventions that should have been settled before Wave 1, surfaced during the Wave 3 review and shipped as a 3-PR rollout:

- **PR #9: CSS modules** (squash `2cc0494`): all three recipes migrated from plain `.css` with `cr-Recipe-slot` global prefixes to `.module.css` with plain `.root`/`.trigger`/`.content` selectors. Build-time scoping replaces convention-only prefixing. Added `vite-env.d.ts` for typed module imports; `:global(.dark)` for the dark-mode rule; `:where(:disabled, [aria-disabled])` for polymorphic disabled state. Playbook §§ 2.1-2.4 codify the pattern. Spec: `docs/superpowers/specs/2026-05-12-css-modules-migration-design.md`.
- **PR #10: vocabulary rails** (squash `ef99d35`): soribashi has **no opinion** on `size`/`intent`/`variant` *values*; developers declare their own vocabulary. New surface:
  - `defineVocabulary(values)`: the only sanctioned vocabulary constructor; wraps Zod so the inferred type and the runtime schema can't drift.
  - Theme `semantic` field split into `vocabulary` (size/intent/variant enums) + `semanticTokens` (text/surface/border/accent aliases). Hard cutover, no shim.
  - `Recipe.extend({ vocabulary, defaultProps, classNames, styles, vars, attributes })` replaces `withDefaults()` across all four builders. Vocabulary overrides support replace-mode (a `Vocabulary`) and extend-mode (`(current) => Vocabulary`), resolved at `createTheme()` time.
  - `createSoribashiBuilders(theme)`: consumer entry point; registers theme vocab in a module-level Zod registry (idempotent) and returns the builders.
  - `vocabularyAxes` recipe opt-in + dev-only Zod runtime validation with actionable error messages.
  - Spec: `docs/superpowers/specs/2026-05-12-vocabulary-rails-design.md`.

### PR #11: pilot vocab-rails wiring + type threading (MERGED 2026-06-06, squash `b2fc3cc`)

PR #10 built the rails; PR #11 wired the pilot to them and threaded the types: a `builders.ts` entry point using the generic `createTheme` plus `makeBuilders`/`registerTheme`, recipes opting into `vocabularyAxes`, and variant vocabularies declared per-recipe via `Recipe.extend()`. Delivers compile-time size/intent narrowing and cycle-free in-theme `.extend()`. Original briefing: `docs/superpowers/sessions/2026-05-28-pilot-migration-handoff.md`.

### Next: component sweep

All four authoring categories are proven; next is the ~20-component conversion sweep (playbook §5: `docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md`).

### Post-v1 test counts (on `main` @ `5e4b2aa`)

| Package | Tests |
|---|---|
| `@soribashi/theme` | 82 |
| `@soribashi/codegen` | 137 |
| `@soribashi/factory` | 473 |
| `@soribashi/blocks` | 244 (package deleted in slice 2; see that section) |
| `apps/pilot` | 86 |

Typecheck clean. (The 785-total figure in the v1 record below predates the pilot + hygiene work and the per-package growth since.)

---

# Soribashi v1: Implementation Status (foundation record)

**As of 2026-04-25**

All 5 original plans executed end-to-end, the Mantine blocks adaptation pass is complete, **and** three full audits (two early validation passes plus the comprehensive Hard-Rule-13 full audit) have closed all known divergences against Mantine `63dafbbf`. **739 vitest tests** across 54 files plus **46 Playwright browser-parity tests** = 785 total. Playground app builds, typecheck clean. Coverage manifest covers every TS/TSX file under `packages/*/src/`. See `docs/superpowers/divergences/mantine-master.md`, `docs/superpowers/audits/2026-04-25-coverage-manifest.md`, `docs/superpowers/roadmap/mantine-derivable-future-work.md`, and `THIRD-PARTY-LICENSES.md`.

## Mantine full audit pass: COMPLETE (2026-04-25)

Hard Rule 13 enforcement complete across every soribashi file derivable from Mantine. Pinned to `mantinedev/mantine@63dafbbf5f0135eb36455b7add4c0ddcd0f3240a`.

- **Coverage manifest:** `docs/superpowers/audits/2026-04-25-coverage-manifest.md`: every file in scope listed with status and audit-doc link.
- **Master ledger:** `docs/superpowers/divergences/mantine-master.md`: 1090 lines, ~50 divergence entries split across `Aligned` / `Kept` / `Closed` / `Full audit pass: 2026-04-25` (Tier 1 + Tier 2 entries) / `Validated and matching` sections.
- **Per-tier audit docs:** Tier 1 (`tier-1-{factory,polymorphic,generic,with-props,inline-styles,hash-and-classname}.md`), Tier 2 (`tier-2-{theme,provider-types,factory-additions,box-style-props,codegen}.md`), Tier 3 (`tier-3-blocks-and-utils.md`).
- **Roadmap:** `docs/superpowers/roadmap/mantine-derivable-future-work.md`: 12 (e) "missing port" candidates surfaced, sized S/M/L for follow-up consideration.

### Bugs caught by the full audit (11 total across all phases)

Real behavioral bugs found and fixed via TDD across the audit:

1. `useStyles`: `undefined` CSS variable values rendered as the string `"undefined"` (V2 / pre-pass; US-29)
2. `InlineStyles`: empty `selector { }` rule emitted when `styles={}` (Tier 1 / Task 1.5; ST-05)
3. `makeWithProps`: `withProps()` result missing `extend` propagation (Tier 1 / Task 1.1; B4)
4. `makeWithProps`: `withProps()` result missing recursive `withProps` chaining (Tier 1 / Task 1.2; P17c)
5. `composeTheme.mergeTokens`: silently dropping `fontWeight` / `lineHeight` / `heading` fields when child themes extend a base (Tier 2 / T2-A; CT-BUG-1..5)
6. `getBoxMod`: numeric-`0` mod values silently dropped (`mod={{ count: 0 }}` lost) (Tier 2 / T2-D; GBM-Z1)
7. `parseStyleProps`: `{ base: 'md' }` (only-base) treated as responsive, emitting unnecessary `<InlineStyles>` (Tier 2 / T2-D; PSP-B1)
8. `emit-css.ts`: `tokens.breakpoint` declared in types but never emitted as `--breakpoint-*` vars (V3 + Tier 2 / T2-E; BUG-E-1)
9. `emit-css.ts`: `emitDarkTokenLines` only handled 5 of 10 token-type fields (silent loss of fontFamily/fontWeight/lineHeight/breakpoint/heading dark overrides) (Tier 2 / T2-E; BUG-E-2)
10. Block wrapper style-merge: consumer's inline `style` prop overwrote `vars()` output across 13 blocks (V4 / pre-pass)
11. `--breakpoint-*` emission gap surfaced + fixed (V3 / pre-pass)

### Audit phases

- ✅ **Phase 1 (Tier 1, sequential):** 6 load-bearing factory primitive audits with parity tests: `factory.tsx`, polymorphic + define-polymorphic, define-generic, with-props, inline-styles bundle, hash + use-random-class-name. 161+ new parity tests.
- ✅ **Phase 2 (Tier 2, parallel):** 5 batches over theme / provider+types / factory-additions / Box-style-props / codegen. Audit reports + ledger fragments + TDD bug fixes. 5 fragments merged into master ledger.
- ✅ **Phase 3 (Tier 3, fast):** Confirmatory pass over 14 blocks + utils + Grid math + core barrel using existing V1/V4 infrastructure. 0 new bugs.
- ✅ **Phase 4 (consolidation):** Coverage manifest finalized, roadmap doc populated, master ledger consolidated, STATUS + Hard Rule 13 updated, final smoke clean.

## Mantine blocks adaptation: COMPLETE

**Plan:** `docs/superpowers/plans/2026-04-25-plan-mantine-blocks-adaptation.md`. All 14 layout primitives are now full Mantine adaptations, MIT-attributed.

### Phase status

- ✅ **Phase 0:** Attribution / `THIRD-PARTY-LICENSES.md`
- ✅ **Phase 1:** Theme tokens (`fontWeight`, `lineHeight`, `fontFamily.heading`, `heading.sizes`)
- ✅ **Phase 2:** Helper utilities (`rem`, `getSpacing`, `getRadius`, `getSize`, `getFontSize`, `getLineHeight`, `getShadow`, `getThemeColor`)
- ✅ **Phase 3:** Factory infrastructure (`useRandomClassName`, `hashStyleProps`, `<InlineStyles>`)
- ✅ **Phase 4:** Box style-props machinery (`STYLE_PROPS_DATA`, `parseStyleProps`, `extractStyleProps`, `getBoxMod`)
- ✅ **Phase 5:** Box: full style-prop pipeline + responsive `StyleProp<T>`
- ✅ **Phase 6:** Stack, Group (grow + preventGrowOverflow + filterFalsyChildren), Center (`:where([data-inline])` pattern), AspectRatio (children-aware fix), Space (1-line Box wrapper), Paper (a11y defaults + light/dark border)
- ✅ **Phase 7:** Flex, Grid + Grid.Col, SimpleGrid, Container (block strategy)
- ✅ **Phase 8:** Text (lineClamp, gradient, inline, inherit, RTL truncate, span shorthand) + Title (`order`, `size` accepts `h1`-`h6` token, `lineClamp`, `textWrap`, `getTitleSize` reading `theme.tokens.heading.sizes`)
- ✅ **Phase 9:** Divergence ledger refreshed (`docs/superpowers/divergences/mantine-master.md`); `--mantine-` lint clean (only attribution-comment references remain); final smoke (`bunx vitest run`, `bun run typecheck`, `bun run --filter @soribashi/playground build`) all green
- ✅ **Validation pass 1 (post-Phase 9):** 15 residual divergences against Mantine `63dafbbf` closed in a parallel-batch fix run: Grid math parameterized on `columns`, full Box style-prop parity (`hiddenFrom`/`visibleFrom`/12 missing props/logical-shorthand `mx`/`my`), `getBoxMod` kebab-cases mod keys, utility resolvers drop the `STANDARD_KEYS` allowlist, `rem` accepts px-strings, codegen emits `--heading-text-wrap`, `useRandomClassName` handles React 19 IDs, Paper border var scoped, SimpleGrid renames + selector specificity. See `mantine-master.md` § "Post-adaptation validation pass" for the full table.
- ✅ **Validation pass 2 (4 evidence-based audits):** Four parallel agents produced runnable artifacts and caught 5 more real bugs:
  - **V1: CSS structural diff:** parser-based audit script (`packages/blocks/scripts/css-parity-audit.ts`) + parity test with allowlist. Found 28 IDENTICAL / 1 TOKEN_DIFF / 5 DECL_DIFF / 5 MISSING / 5 EXTRA across 14 blocks; fixed missing `--grid-column-gap`/`--grid-row-gap` defaults on `.sb-Grid-root` and missing `[dir="rtl"]` override on Text `truncate='start'`.
  - **V2: Factory parity:** enumerated 42 decision branches in `useStyles` + `useProps`; wrote 74 parity tests (one per branch); 41/42 confirmed equivalent to Mantine. Fixed US-29: `undefined` CSS-variable values were not filtered from the merged style object (would have rendered the literal string "undefined" to DOM).
  - **V3: Codegen variable parity:** mapped 64/64 canonical Mantine vars to soribashi equivalents (100%); documented 288 intentional gaps (mostly Mantine's pre-computed color-variant vars which soribashi computes at render time via the intent resolver). Fixed silent `--breakpoint-*` emission gap that would have broken `visibility.css` at runtime.
  - **V4: Browser-parity smoke:** 46 Playwright computed-style tests across all 14 blocks; surfaced and led to fixing a systemic bug across 13 blocks where consumer's inline `style` prop overwrote `vars()` output (test: `packages/blocks/test/Box/wrapper-style-merge.test.tsx`). (This suite and the `@soribashi/blocks` package it covered were deleted in slice 2, below; the file path is historical.)

### Deferred (acknowledged, not yet implemented)

Tracked in the divergence ledger under "Deferred":

- Responsive `StyleProp<T>` for non-Box blocks (Flex / Grid / SimpleGrid)
- `GridProvider` context for responsive col span / offset / order
- `Container` grid strategy (with `data-breakout` children)
- `SimpleGrid` `type='container'` mode

**Blocks adapted from Mantine**: all 14 layout primitives now full Mantine fidelity, MIT-attributed, see `docs/superpowers/divergences/mantine-master.md` and `THIRD-PARTY-LICENSES.md`.

## What was built

### Plans (all written first, then executed)

- `docs/superpowers/plans/2026-04-25-plan-1-foundation.md`: workspace + theme + codegen
- `docs/superpowers/plans/2026-04-25-plan-2-factory.md`: `@soribashi/factory` core framework
- `docs/superpowers/plans/2026-04-25-plan-3-generic-polymorphic.md`: generic + polymorphic + escape hatches
- `docs/superpowers/plans/2026-04-25-plan-4-blocks.md`: 14 layout primitives
- `docs/superpowers/plans/2026-04-25-plan-5-playground.md`: `@soribashi/core` barrel + playground + Button

### Packages

| Package | Purpose | Tests |
|---|---|---|
| `@soribashi/theme` | `createTheme`, intent resolver, default tokens, composition | 29 |
| `@soribashi/codegen` | theme → CSS variables + Tailwind v3/v4 config; CLI | 32 |
| `@soribashi/factory` | `defineComponent`, `useProps`, `useStyles`, `cn`, generic + polymorphic, escape hatches | 63 |
| `@soribashi/blocks` | Box, Stack, Group, Flex, Grid, Grid.Col, SimpleGrid, Container, Center, AspectRatio, Space, Paper, Text, Title | 28 |
| `@soribashi/core` | Public barrel | n/a |

**Total: 152 tests across 23 files**

### App

- `apps/playground`: Vite + React + TS + Tailwind v3
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

- **Theme is the contract**: every component accesses tokens through `theme`; codegen ensures Tailwind config matches.
- **`defineComponent({...})`**: single config object, types inferred. The `Button` component implementation in `apps/playground/src/components/Button/Button.tsx` is ~70 lines (vs Mantine's ~280 for the equivalent).
- **Auto-vars for intent × variant**: components declaring `variants` automatically get `--{name}-bg/-color/-border/-hover/-active` on root via the theme's `intentResolver`. No manual `varsResolver` needed for the standard case.
- **Surface elevation** as first-class: `bg="raised"` etc. resolves to `var(--surface-raised)`. Avoids the Mantine workaround documented in console-archive (manual `--mantine-color-background-1..4` injection).
- **Substrate-agnostic styling**: `defineComponent` accepts CSS module classes, Tailwind/CVA recipes, or plain class names. `Button` uses plain CSS that references `var(--button-bg)` etc.
- **Layered token composition**: `createTheme({ extends: baseTheme, ... })` works; tested in roundtrip.
- **Generic component support**: `defineGenericComponent<SelectOwnProps<T>>` preserves the type parameter.
- **Polymorphic component support**: `definePolymorphicComponent` with `as` prop; `Box`, `Text` use it.
- **Codegen drift impossible**: Tailwind config is generated from the theme; you cannot reference a token that doesn't exist.

## Not yet done (deferred from the spec)

- Playwright visual tests (post-v1, can be added once playground is stable)
- Host library integration in the consuming codebase (separate effort)
- Per-tenant scope codegen for multi-tenant apps (works in `createTheme({ scope: ... })` but the playground doesn't demo it)
- Tailwind v4 mode tested end-to-end (codegen supports it; playground uses v3)
- The `tailwindPassthrough` escape hatch for libraries like Tremor (open question #3 in the spec)
- Lint rule for color classes inside soribashi-component recipes (open question #2)

## Known cosmetic gaps

- The playground's nav header buttons don't use the Button component (just raw `<button>` with default browser styling): a minor cosmetic loose end.
- Some redundant prop destructure in block render functions (`classNames, styles, vars, attributes, unstyled, className, style` are pulled out and discarded). Could be extracted into a helper but the duplication is intentional and clear for now.

## Git history

All work committed in atomic commits per task. `git log --oneline` shows the progression:

```
chore: initialize repository with docs and gitignore
chore: add Bun workspace, base TS config, and biome
feat(theme): add @soribashi/theme with createTheme, intent resolver, default tokens, composition
feat(codegen): add @soribashi/codegen with build/watch + CLI + roundtrip tests
chore: Plan 1 (foundation) complete: 61 tests passing across theme + codegen
feat(factory): add @soribashi/factory with defineComponent, useProps, useStyles, autoVars
feat(factory): add definePolymorphicComponent, defineGenericComponent, escape hatches
feat(blocks): add @soribashi/blocks with 14 layout primitives
feat(playground): add @soribashi/core barrel + Vite playground with Button + Theme Lab + Blocks Demo
```
