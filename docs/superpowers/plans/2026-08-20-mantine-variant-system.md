# Mantine Variant System Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Mantine's variant menu canonical in soribashi's default resolver (ramp + single-shade branches), ship the contrast gate as a shared export, and adopt across packages/ui, tui-kit, mr-board, and deck.

**Architecture:** Four acts. Act A (tasks 1–5, repo `~/Documents/GitHub/soribashi`) renames/extends the vocabulary and default resolver, adds the single-shade branch encoding tui-kit's shipped constants, relocates the contrast harness to `@soribashi/core/testing`, adopts in packages/ui, and prepares the 0.2.0 publish (user OTP gate). Act B (tasks 6–7, `~/Documents/GitHub/tui-kit`) renames the kit vocabulary, reduces `tuiIntentResolver` to palette mapping over the default branch helper, makes Button consume resolver vars with a computed-style parity proof, and adds the matrix gate. Act C (tasks 8–9) sweeps mr-board and deck with zero-diff capture proofs. Act D (task 10) lands the docs/skill updates.

**Tech Stack:** TypeScript, @soribashi/core (vitest node+browser in soribashi; bun+Playwright in consumers), color-mix in oklab (ramp) and srgb (single-shade), npm publish via bun.

**Spec:** `docs/superpowers/specs/2026-08-20-mantine-variant-system-design.md` (this repo). Binding authority; read before any task.

## Global Constraints

- **Canonical variant vocabulary** (core `DEFAULT_VOCABULARIES.variant`): `filled | light | outline | subtle | default | transparent | link`. Renames everywhere: old `subtle`→`light`, old `ghost`→`subtle`; tui-kit additionally `solid`→`default`.
- **Resolver signature unchanged**: `IntentResolverInput { intent, variant, theme? }` → `IntentResolverResult { background, color, border, hover?, active?, hoverColor? }`. No `focus`/`disabled` resolver states.
- **Hover changes background only** — never `color`/`border` except via the explicit `hoverColor` channel (outline/link). Structural rule in both branches.
- **Ramp branch keeps the tuned constants verbatim**: `wash` weights 12%/15% anchored on `--surface-canvas`, `deriveState` 90/80 (filled) and 94/88 (light), all `in oklab`.
- **Single-shade branch constants are tui-kit's shipped values, `in srgb`**: outline hover `color-mix(in srgb, tone 5%, var(--surface-canvas))`; subtle hover `color-mix(in srgb, tone 12%, var(--surface-canvas))`; light bg `var(--surface-card)` with hover `color-mix(in srgb, tone 12%, var(--surface-card))`; default = panel/border/text-primary with hover `var(--surface-card)`. Pixel parity with tui-kit's current Button is the acceptance test.
- **`@soribashi/core` → 0.2.0** (breaking). Publish is a USER gate (2FA OTP) — the plan prepares and dry-runs; Matt runs the publish command.
- **Consumer parity proofs**: tui-kit computed-style parity test (exact resolved values); baseline regeneration allowed ONLY for fixture-label text changes, reviewer-confirmed text-only; mr-board 20-capture and deck 15-capture harnesses at zero diff.
- **Clean-code comments rule** (`~/.claude/rules/clean-code-comments.md`) binds all code: constraint comments only; no task numbers/process citations.
- **Gates per repo**: soribashi — its test suites for core and ui (check package.json scripts; visual + node tiers) green after every task. tui-kit — `bun run typecheck && bun run test && bun run gates`. mr-board / local-apps — their `bun run test` (+ `test:dom` for deck) and capture compares.
- **No behavior change for fixed-`filled` consumers** (ui Checkbox/RadioGroup/Switch keep hardcoded `filled`).

## File Map

| Path | Responsibility |
|---|---|
| soribashi `packages/core/src/theme/default-vocabularies.ts` | variant menu → 7 entries |
| soribashi `packages/core/src/theme/default-intent-resolver.ts` | both branches + exported recipe helpers + detection |
| soribashi `packages/core/src/theme/*.test.ts` (resolver tests) | full-matrix snapshots per branch |
| soribashi `packages/core/src/testing/` (NEW) + package.json exports | relocated contrast utils + matrix harness, `./testing` subpath |
| soribashi `packages/ui/src/a11y/*` | re-export shims / imports from core/testing; matrix test updated |
| soribashi `packages/ui/src/recipes/{Button,Badge,Alert}/*` | renamed/widened variant tuples, CSS selector renames, baselines |
| tui-kit `src/theme.ts`, `src/intent-resolver.ts` | vocab rename; resolver = palette map over core helper |
| tui-kit `src/recipes/Button/*`, `src/recipes/Chip/*` | resolver-var consumption; Chip tuple rename; parity test |
| tui-kit `test/` matrix test (NEW) | shared-harness gate |
| mr-board (sweep), local-apps `core/board/*` (sweep) | call-site renames + zero-diff proofs |
| soribashi authoring skill + tui-kit README | Act D docs |

---

# Act A — soribashi (branch `mantine-variants`)

Before Task 1: read `packages/core/package.json` scripts and run the repo's
full test command once to record the green baseline (the survey says node +
browser tiers exist; find the exact script names and note them in the ledger).

### Task 1: Ramp branch — rename + menu extension + exported helpers

**Files:**
- Modify: `packages/core/src/theme/default-vocabularies.ts`, `packages/core/src/theme/default-intent-resolver.ts`
- Modify: every core/ui source+test file referencing variant literals `'subtle'`/`'ghost'` in the RESOLVER sense (grep `packages/core` first; packages/ui recipe files are Task 4's — but core tests referencing the old names change here)
- Test: the existing resolver unit test file (find via `grep -rl defaultIntentResolver packages/core --include='*.test.*'`), extended

**Interfaces:**
- Produces (frozen for Tasks 2/4/6): `DEFAULT_VOCABULARIES.variant = defineVocabulary(['filled', 'light', 'outline', 'subtle', 'default', 'transparent', 'link'])`; exported `rampVariantColors(intent: string, variant: string): IntentResolverResult` (the per-variant recipe table, extracted from the current inline branches so custom resolvers can extend rather than replace); `defaultIntentResolver` delegates to it.

- [ ] **Step 1: Write the failing tests.** Extend the resolver test file with a full-matrix snapshot: for each of the 7 variants × a representative intent (`primary`), assert the exact `IntentResolverResult`. New/renamed expectations:

```ts
// light (old subtle): background wash(intent,15) = "color-mix(in oklab, var(--color-primary-500) 15%, var(--surface-canvas))",
//   color var(--color-primary-700), border transparent, hover deriveState(bg,94), active deriveState(bg,88)
// subtle (old ghost): background transparent, color 700, border transparent, hover wash(intent,12)
// default (NEW): background var(--surface-panel), color var(--text-primary), border var(--border-default),
//   hover var(--surface-card, color-mix(in oklab, var(--surface-panel) 92%, black))  — the surface step with fallback
// transparent (NEW): background transparent, color 700, border transparent, no hover key
// filled/outline/link: unchanged values (pin them)
// rampVariantColors === what defaultIntentResolver returns for a ramp theme (delegation test)
```

- [ ] **Step 2: Run the resolver tests, verify failures.**
- [ ] **Step 3: Implement.** In `default-intent-resolver.ts`: extract the variant table into exported `rampVariantColors(intent, variant)`; rename the `subtle` branch to `light` and `ghost` to `subtle`; add `default` and `transparent` branches per Step 1's values; keep `deriveState`/`wash` and every constant verbatim; keep the unknown-variant fallback. Update `DEFAULT_VOCABULARIES.variant`. The resolver's doc comment updates its variant list and keeps the Mantine reference; the scale contract note (500/600/700/800/foreground) stays.
- [ ] **Step 4: Sweep core.** `grep -rn "'ghost'\|\"ghost\"\|'subtle'" packages/core/src` — update any remaining literals (types, tests, docs comments) to the new names. Run the full core test tier.
- [ ] **Step 5: Full soribashi suite green** (expected: packages/ui tests now FAIL on the renamed vocabulary — if so, cap this task at core-tier green and note that ui goes red until Task 4; if the repo's suite runs per-package, run core's only. Record which in the report; if ui cannot be left red because the repo gates globally, fold the minimal ui rename sweep forward from Task 4 into this commit and say so).
- [ ] **Step 6: Commit** `feat!: canonical Mantine variant menu in the default resolver`.

### Task 2: Single-shade branch + detection

**Files:**
- Modify: `packages/core/src/theme/default-intent-resolver.ts`
- Test: same resolver test file

**Interfaces:**
- Consumes: Task 1's `rampVariantColors`.
- Produces (frozen for Task 6): `singleShadeVariantColors(tone: string, variant: string): IntentResolverResult` — `tone` is any CSS color value or `var()` reference; and branch detection inside `defaultIntentResolver`: an intent whose color scale in `input.theme` exposes fewer than 3 numeric shade keys resolves via the single-shade branch using the scale's canonical value (`500` if present, else its sole entry); no theme → ramp branch (current behavior).

- [ ] **Step 1: Failing tests.** Matrix snapshot for `singleShadeVariantColors("var(--color-accent-500)", …)`:

```ts
// default: bg var(--surface-panel), color var(--text-primary), border var(--border-default), hover var(--surface-card)
// outline: bg transparent, color TONE, border TONE, hover "color-mix(in srgb, TONE 5%, var(--surface-canvas))"
// light:  bg var(--surface-card), color TONE, border transparent, hover "color-mix(in srgb, TONE 12%, var(--surface-card))"
// subtle: bg transparent, color TONE, border transparent, hover "color-mix(in srgb, TONE 12%, var(--surface-canvas))"
// filled: bg TONE, color var(--color-{intent}-foreground)? — NO: tone-based; use white fallback:
//   color "var(--sb-intent-foreground, #fff)"; border transparent; hover "color-mix(in srgb, TONE 90%, black)"
// transparent: bg transparent, color TONE, no hover; link: color TONE, hoverColor TONE, hover absent
// detection: a theme whose scale for the intent = { "500": "#2e7de9" } routes to single-shade;
//   a scale with 50..900 keys routes to ramp; resolver without theme routes to ramp
```

All srgb percentages are the spec's §3.2 constants (5/12/12) — they ARE tui-kit's shipped `OUTLINE_HOVER_TINT`/`GHOST_HOVER_TINT`/`SUBTLE_HOVER_TINT` values (verify against `~/Documents/GitHub/tui-kit/src/recipes/Button/Button.tsx` before writing; if the shipped constants differ from 5/12/12, the shipped values win and the spec table is corrected).

- [ ] **Step 2: Run, verify failures.**
- [ ] **Step 3: Implement** `singleShadeVariantColors` + detection; `defaultIntentResolver` = detect → delegate to the right helper. Export both helpers from the package barrel.
- [ ] **Step 4: Tests green; core tier green. Commit** `feat: single-shade palette branch in the default resolver`.

### Task 3: `@soribashi/core/testing` — shared contrast gate

**Files:**
- Create: `packages/core/src/testing/index.ts`, moving `packages/ui/src/a11y/contrast.ts` → `packages/core/src/testing/contrast.ts` and `packages/ui/src/a11y/matrix-harness.tsx` → `packages/core/src/testing/matrix-harness.tsx` (git mv; adjust imports)
- Modify: `packages/core/package.json` (exports gains `./testing` with the same `soribashi-source`/`types`/`default` triple as `./codegen`), the core build/pack gates (`fix-dts` script if path-scoped, `pack:check` expectations)
- Modify: `packages/ui/src/a11y/contrast.ts` + `matrix-harness.tsx` → thin re-export shims (`export * from '@soribashi/core/testing'`) so ui's existing imports keep working; `matrix-classification.ts` and `contrast-matrix.test.tsx` stay in ui (they are ui's coverage policy, not framework)
- Test: ui's `contrast-matrix.test.tsx` must run unchanged against the relocated harness

**Interfaces:**
- Produces (for Task 7): `@soribashi/core/testing` exporting `parseColor`, `relativeLuminance`, `compositeOver`, `contrastRatio`, and the matrix-harness API exactly as `packages/ui/src/a11y/matrix-harness.tsx` exports it today (read the file; keep names identical).

- [ ] **Step 1: Move + shim.** git mv the two files, create the barrel, add the exports entry, point ui's shims at it.
- [ ] **Step 2: The harness imports React/vitest-browser** — confirm core's package can host browser-tier test code without dragging test deps into the runtime graph: the `./testing` subpath must NOT be imported by `.` (add a test or lint assertion: grep the built `dist/src/index.js` for `testing/` — zero hits).
- [ ] **Step 3: Run ui's contrast-matrix + design-ledger suites — green, unchanged counts. Run core build (`bun run` the repo's build/codegen scripts) and `pack:check` — the packed tarball contains `dist/src/testing/`.**
- [ ] **Step 4: Commit** `feat: ship the contrast matrix harness at @soribashi/core/testing`.

### Task 4: packages/ui adoption

**Files:**
- Modify: `packages/ui/src/recipes/Button/Button.tsx` (`BUTTON_VARIANTS` → all 7), `Badge.tsx` + `Alert.tsx` (`['filled','light','outline']`), their `.module.css` (selector renames `[data-variant="subtle"]`→`"light"` etc. where present), their tests and visual tests, workshop pages under `apps/workshop`
- Modify: `packages/ui/src/a11y/contrast-matrix.test.tsx` + `matrix-classification.ts` (renamed cells; new `default`/`transparent` Button cells)
- Test: full ui suite + regenerated visual baselines where labels/variants changed

**Interfaces:** consumes Task 1's vocabulary and resolver names; produces the reference rendering of the full menu (Button).

- [ ] **Step 1: Sweep.** `grep -rn "ghost\|subtle" packages/ui/src apps/workshop` — every variant-sense literal renames (`subtle`→`light`, `ghost`→`subtle`). Button's tuple becomes all 7; Badge/Alert become `['filled','light','outline']`.
- [ ] **Step 2: Matrix.** Extend Button's grid to 7 variants (incl. `default`/`transparent` cells; `transparent` has no hover fill — the harness's hover-delta assertion must exempt no-hover variants by reading whether the resolver returned `hover`; check how the harness currently handles `link` and mirror it).
- [ ] **Step 3: Run the ui suites; regenerate visual baselines whose fixtures changed; eyeball each regenerated PNG (Read tool) — the renamed variants must render identically to their old names, the two new Button variants correctly.**
- [ ] **Step 4: Full soribashi repo green. Commit** `feat: ui adopts the canonical variant menu`.

### Task 5: 0.2.0 publish prep (USER GATE)

**Files:**
- Modify: `packages/core/package.json` (version 0.2.0), any workspace deps pinning core's version (grep `"@soribashi/core"` across the monorepo)
- Modify: changelog/README notes if the repo keeps them (check for CHANGELOG.md)

- [ ] **Step 1:** Bump version; run the full build + `pack:check`; `bun publish --dry-run` from `packages/core` — record the tarball file list in the report (must include `dist/src/testing/`).
- [ ] **Step 2:** Push the branch. **STOP: controller surfaces the publish command to Matt** (`cd packages/core && bun publish --otp <code>` — 2FA). Task completes when the registry shows 0.2.0 (poll `npm view @soribashi/core version`).
- [ ] **Step 3: Commit** `chore: release @soribashi/core 0.2.0`.

---

# Act B — tui-kit (branch `mantine-variants`)

### Task 6: tui-kit adoption with computed-style parity

**Files:**
- Modify: `package.json` (`@soribashi/core` → `^0.2.0`; clean install), `src/theme.ts` (variant vocab → `["default", "light", "outline", "subtle"]`), `src/intent-resolver.ts` (becomes: map tui intent → family tone `var(--{family})` alias or `--color-{family}-500`, then delegate to `singleShadeVariantColors(tone, variant)`; keep any tui-specific overrides ONLY as field-level patches on the helper's result, with a comment naming which field and why)
- Modify: `src/recipes/Button/Button.tsx` (delete the hand-built hover-var injection — `OUTLINE_HOVER_TINT` etc. — autoVars now supplies `--button-bg/-color/-border/-hover`), `Button.module.css` (variant color blocks collapse to generic var consumption; structural CSS — padding, radius, translateY, focus, disabled — stays; `[data-variant]` names rename), `Button.test.tsx` (+ new parity test), `Button.visual.test.tsx` + workshop `Buttons.tsx` (label renames)
- Modify: `src/recipes/Chip/Chip.tsx` (`CHIP_VARIANTS = ["outline", "light"]`), `Chip.module.css` selectors, Chip tests/workshop
- Modify: kit-wide sweep — `grep -rn 'variant="\|"solid"\|"ghost"' src workshop` for stragglers (Segmented/SelectBox etc. don't use the variant axis; verify)
- Test: NEW `src/recipes/Button/Button.parity.test.tsx`

**Interfaces:** consumes `singleShadeVariantColors` from `@soribashi/core@0.2.0` (Task 2's exact output shapes).

- [ ] **Step 1: Parity test FIRST, against the CURRENT code** (before any rename): render Button per variant × intent × scheme, record `getComputedStyle` background/color/border at rest and on hover into an expectations table with today's resolved values (light + dark). Commit this test passing against the old implementation — it is the pixel-parity oracle.
- [ ] **Step 2:** Clean install with `^0.2.0`; rename vocab + variants (`solid`→`default`, `ghost`→`subtle`, `subtle`→`light`) across theme, Button, Chip, tests, workshop; rewrite `tuiIntentResolver` as palette-map + delegate; collapse Button.module.css color blocks to `var(--button-bg)`/`var(--button-color)`/`var(--button-border)`/`var(--button-hover)` consumption.
- [ ] **Step 3:** Update the parity test's variant NAMES (not its expected values) and run it — every computed value must equal the recorded oracle. A mismatch is a defect in the single-shade branch or the mapping, never a new expectation to record.
- [ ] **Step 4:** Regenerate visual baselines whose fixture labels changed; verify each diff is text-only (eyeball old vs new). `bun run typecheck && bun run test && bun run gates` green.
- [ ] **Step 5: Commit** `feat!: adopt @soribashi/core 0.2.0 canonical variants; Button colors from the resolver`.

### Task 7: tui-kit matrix gate

**Files:**
- Create: `src/recipes/Button/Button.matrix.test.tsx` (browser tier) using `@soribashi/core/testing`'s harness: tui-kit's 4 variants × 7 intents × light/dark, contrast ≥ 4.5 with translucent compositing, hover-delta assertion for hover-bearing variants
- Create: a kit-level classification map (mirror `packages/ui/src/a11y/matrix-classification.ts`'s shape): every tui-kit recipe either covered (Button), covered-by-recipe-local-tone-map-with-existing-visual-baselines (Badge, Alert, StatusDot, Chip), or exempt-with-reason (structural recipes)
- Test: the new matrix file + full gates

- [ ] **Step 1:** Write the matrix test; run; fix any cell that genuinely fails by adjusting the THEME's palette mapping (not by weakening the floor) — expected to pass given the parity-carried values, but a real failure here is a real accessibility finding: report it, don't exempt it.
- [ ] **Step 2:** `bun run typecheck && bun run test && bun run gates` green. **Commit** `test: contrast matrix gate over Button`.

---

# Act C — consumer sweeps

### Task 8: mr-board sweep + zero-diff proof

**Files:** repo `~/Documents/GitHub/mr-board` (work on a branch `kit-variant-rename`): grep `variant=` across `src/client`; rename any `subtle`→`light`, `ghost`→`subtle` kit-variant values; NO dep change needed (file:../tui-kit is live) but a clean `bun install` refresh per mr-board's `docs/tui-kit-devloop.md` if the kit's package.json changed (it did — core dep bump).

- [ ] **Step 1:** Sweep + `bun run typecheck` (mr-board's 3-program setup) + `bun test` green.
- [ ] **Step 2:** `bun run capture && bun run capture:compare` — 20/20 zero diff (attribute renames must not move pixels). If zero call sites used a renamed value, record the verified no-op.
- [ ] **Step 3: Commit; merge to main + push is the controller's finish step, not yours.**

### Task 9: deck sweep + zero-diff proof

**Files:** repo `~/Documents/GitHub/local-apps` (branch `kit-variant-rename`): `grep -rn 'variant=' core/board` — rename `ghost`→`subtle` (the sweep after the solid rework left only ghost + default-by-omission); clean install if needed; `bun run build:board`.

- [ ] **Step 1:** Sweep; `bun run test` + `bun run test:dom` green (update any DOM assertion reading `data-variant="ghost"`).
- [ ] **Step 2:** `bun run capture && bun run capture:compare` — 15/15 zero diff.
- [ ] **Step 3: Commit.**

---

# Act D — docs

### Task 10: Skill + README updates

**Files:**
- Modify: soribashi's authoring-a-recipe skill (find it: `grep -ril 'authoring' ~/Documents/GitHub/soribashi --include='SKILL.md'` or the repo's skills directory) — add a "Variant colors" section: variant colors come from the theme's intent resolver via `autoVars`; NEVER hand-write per-variant color CSS in a recipe (consume `--{component}-bg/-color/-border/-hover`); a custom resolver extends `rampVariantColors`/`singleShadeVariantColors` (call, then patch fields) rather than replacing the math; every color-variant recipe registers in the repo's matrix classification; the canonical menu and what each variant means (one line each).
- Modify: tui-kit `README.md` — variant menu table updated to `default/light/outline/subtle` with the Mantine mapping, plus a pointer to the skill rule.
- Modify: soribashi `docs/` cross-reference if the repo keeps design docs indexes (check `docs/roadmap`/`docs/references` conventions; add nothing speculative).

- [ ] **Step 1:** Write both updates; keep the skill section under ~40 lines (em-dashes fine in SKILL.md per user rule).
- [ ] **Step 2:** Commit in each repo: `docs: variant color authoring rules`.

---

## Plan self-review notes

- Spec §2 → Tasks 1 (core), 4 (ui), 6 (tui-kit incl. Chip), 8/9 (consumers). §3.1 → Task 1; §3.2 + detection → Task 2; §3.3 override contract → Task 6 (resolver-as-mapping) + Task 10 (rule). §4 gate → Tasks 3 (relocation) + 7 (tui-kit matrix) + 4 (ui cells). §5 adoption → 4/6/8/9 with the amended parity mechanism (computed-style oracle + text-only baseline deltas). §6 sequencing → task order; publish gate = Task 5 with explicit STOP. §7 testing → per-task steps. §8 risks: rename stragglers (grep sweeps + dev vocab warnings), single-shade drift (Task 6's oracle recorded BEFORE the change), detection (Task 2 tests both palette shapes), default-variant step (Task 1's fallback + matrix), 0.2.0 (in-house consumers only).
- Sequencing note for the executor: Tasks 1–4 may leave ui red mid-act only as Task 1 Step 5 describes; Acts B/C hard-depend on Task 5's registry publish (Matt's OTP) — if the publish must wait, Task 6 may proceed on a temporary `file:../soribashi/packages/core` link with the swap to `^0.2.0` recorded as a follow-up commit before merge.
- Naming hazard the executor must hold: during Act A/B, `subtle` changes meaning (old-ghost). Grep sweeps must distinguish variant-sense literals from unrelated words (Chip's `dimmed`, prose in comments). Every rename commit lists the files swept in its report.
