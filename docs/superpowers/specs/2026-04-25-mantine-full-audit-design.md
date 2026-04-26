# Mantine Full-Audit Validation — Design Spec

**Status:** Draft
**Date:** 2026-04-25
**Audience:** Implementation engineers, Soribashi maintainers
**Scope:** Exhaustive Hard-Rule-13 enforcement across every soribashi file derivable from Mantine.

---

## 1. Why This Exists

Hard Rule 13 of the Soribashi design spec (`docs/superpowers/specs/2026-04-25-soribashi-design.md` § 13) requires that **every Mantine-derivable pattern be source-validated against actual Mantine source code, with every divergence deliberate and documented**. Accidental drift is a regression.

Prior validation work has covered substantial surface area but is not exhaustive:

- The original validation pass (`docs/superpowers/specs/2026-04-25-mantine-validation-pass-design.md`) explicitly excluded `@soribashi/codegen`, `auto-vars.ts`, `defineComponent.tsx`, the theme composition machinery beyond `createTheme`, and most of the provider internals.
- The post-adaptation 15-finding pass closed structural divergences in the layout blocks but did not re-walk factory or theme internals.
- The four V-audits (V1 CSS diff, V2 useStyles+useProps parity, V3 codegen variable-surface parity, V4 browser smoke) covered specific surfaces but did not enumerate every soribashi file or every Mantine-derivable pattern.

This audit closes the remaining gap. The promise is: **after this pass, every soribashi file derivable from Mantine has been read against its Mantine analog, and every divergence is logged.**

This is execution of the existing standard, not a new initiative.

---

## 2. Scope

### 2.1 In scope

Every TypeScript / TSX file under `packages/*/src/`, **excluding**:

- Test files (audit our behavior, not Mantine's)
- Barrel `index.ts` files (no logic to validate)
- The audit infrastructure itself (`packages/blocks/scripts/css-parity-audit.ts`, parity test files)

For files with no direct Mantine analog (e.g., `auto-vars.ts`, codegen emitters), the audit produces a justification entry: "no Mantine equivalent because X; here is what Mantine does instead." This satisfies the spirit of Hard Rule 13 by proving the soribashi addition is deliberate.

For files with a *spiritual* analog (e.g., codegen's `emit-css.ts` ↔ Mantine's `default-css-variables-resolver.ts`), the audit walks the spiritual analog and flags any drift in coverage or convention.

### 2.2 Out of scope

- `apps/playground/` (consumer code, not framework)
- `THIRD-PARTY-LICENSES.md`, `STATUS.md`, and other meta files
- All Mantine versions other than `mantinedev/mantine@63dafbbf5f0135eb36455b7add4c0ddcd0f3240a` (the validation pin used by all prior audits)

### 2.3 Failure modes the audit catches

The audit explicitly looks for:

- **(a) Drift from an existing port** — file started as a Mantine port, mutated since.
- **(b) Hallucinated reimplementation** — file written from scratch when a canonical Mantine version exists.
- **(c) Inconsistent ports** — same Mantine pattern (e.g., merge order, undefined-filter, mod kebab-case) implemented differently in two soribashi files.
- **(d) Reinvented `@mantine/hooks` utilities** — soribashi hand-rolled something that already exists in `@mantine/hooks` (which Hard Rule 14 explicitly permits as a runtime dependency).

A fifth category — **(e) Missing ports** (Mantine has a useful helper soribashi could expose but doesn't) — is *out of scope* for this audit but captured in a roadmap document for follow-up consideration.

### 2.4 Hooks reimplementation rule

Per the (d) catch-type: when the audit finds a soribashi reimplementation of an existing `@mantine/hooks` export, **the reimplementation is replaced inline as part of this audit**. "Reimplementation" means the soribashi function provides the same observable contract (same inputs → same outputs, same React lifecycle behavior) as the `@mantine/hooks` export — minor signature differences (e.g., extra optional argument with a sensible default) do not disqualify replacement. The replacement:

1. Adds `@mantine/hooks` to the relevant package's runtime dependencies (per Hard Rule 14).
2. Imports the hook from `@mantine/hooks`.
3. Deletes the soribashi reimplementation.
4. Updates any tests that asserted on internal behavior of the deleted code.
5. Logs a ledger entry under "Aligned" referencing both the deleted soribashi file and the `@mantine/hooks` export now used.

We do not defer hook replacements to a follow-up PR; cleaning up at audit time avoids carrying dead code forward.

---

## 3. Tiers

Files are placed into one of three tiers based on blast radius. Tier determines depth of audit and sequencing.

### 3.1 Tier 1 — full enumeration + parity tests *(sequential, careful)*

Load-bearing factory primitives. One mistake in any of these silently corrupts every component built on soribashi. Already partially covered by V2 (`useProps` + `useStyles`).

**Files:**

| File | Mantine analog |
|---|---|
| `packages/factory/src/factory.tsx` | `core/factory/factory.tsx` |
| `packages/factory/src/polymorphic-component.tsx` | `core/factory/polymorphic-factory.tsx` |
| `packages/factory/src/define-polymorphic-component.tsx` | `core/factory/polymorphic-factory.tsx` + `create-polymorphic-component.ts` |
| `packages/factory/src/define-generic-component.tsx` | `core/factory/factory.tsx` (`genericFactory`) |
| `packages/factory/src/with-props.tsx` | inline `withProps` in `factory.tsx` |
| `packages/factory/src/inline-styles/InlineStyles.tsx` + helpers | `core/InlineStyles/InlineStyles.tsx` + helpers |
| `packages/factory/src/hash-style-props.ts` | `core/Box/hash-style-props/hash-style-props.ts` |
| `packages/factory/src/use-random-class-name.ts` | `core/use-random-class-name/use-random-class-name.ts` |

**Required output per file:**
- Branch enumeration table at `docs/superpowers/audits/2026-04-25-tier-1-<file>.md`
- ≥1 parity test per public branch / decision point, committed to `packages/factory/test/<file>-parity.test.tsx`
- TDD-driven fix for any bug found
- Ledger entry per divergence (kept or aligned)

### 3.2 Tier 2 — enumeration + report *(parallel, batched)*

Theme + codegen + provider + Box style-props machinery. Disjoint file ownership; survey work that parallelizes.

**Batches:**

| Batch | Files | Mantine analog |
|---|---|---|
| **T2-A** Theme | `theme/src/{create-theme.ts, compose-theme.ts, default-tokens.ts, default-intent-resolver.ts, types.ts}` | `core/MantineProvider/{create-theme, merge-theme, default-theme, default-variant-colors-resolver, theme.types}` |
| **T2-B** Provider + types | `factory/src/provider/{provider.tsx, context.ts, use-theme.ts}`, `factory/src/types/{polymorphic.ts, factory-payload.ts, props.ts, render-context.ts}` | `core/MantineProvider/{MantineProvider.tsx, Mantine.context.ts, use-mantine-context.ts}`, `core/factory/{create-polymorphic-component.ts, factory.tsx (FactoryPayload)}`, `styles-api/styles-api.types.ts` |
| **T2-C** Factory soribashi-additions | `factory/src/{auto-vars.ts, define-component.tsx, cn.ts, create-vars-resolver.ts}` | partial / soribashi-only (justified inline) |
| **T2-D** Box style-props | `blocks/src/Box/{Box.tsx, Box.types.ts, get-box-mod.ts}`, `blocks/src/Box/style-props/*` | `core/Box/{Box.tsx, Box.types.ts, get-box-mod, style-props/*}` |
| **T2-E** Codegen | `codegen/src/{emit-css.ts, emit-tailwind-v3.ts, emit-tailwind-v4.ts, load-config.ts}` | spiritual: `core/MantineProvider/default-css-variables-resolver/default-css-variables-resolver.ts` |

**Required output per batch:**
- Audit report at `docs/superpowers/audits/2026-04-25-tier-2-<batch>.md` with enumeration table for every file, classifying each as `IDENTICAL / TOKEN_DIFF / INTENTIONAL / BUG / HALLUCINATION / INCONSISTENCY / HOOK_REIMPL`.
- TDD-driven fixes for unambiguous bugs.
- Ledger fragment at `docs/superpowers/audits/2026-04-25-tier-2-<batch>-ledger-fragment.md` (merged into the master ledger by the orchestrator during Phase 4).

### 3.3 Tier 3 — spot-check + reuse existing parity tooling *(fast)*

Layout blocks + utils. Already extensively covered by V1 (CSS diff) + V4 (46 browser-parity tests) + the wrapper-style-merge regression test. This tier confirms coverage and walks each block's `.tsx` once against Mantine to confirm port fidelity.

**Files:**
- All 14 blocks (`Box`, `Stack`, ..., `Title`) — `.tsx` files only (CSS already covered by V1)
- All 8 utility helpers under `packages/blocks/src/utils/`
- Grid math helpers under `packages/blocks/src/Grid/{get-column-flex-basis,get-column-flex-grow,get-column-max-width,get-column-offset,Grid.context}.ts`
- `packages/core/src/index.ts` (barrel only — confirm re-export surface)

**Required output:**
- Single rolled-up report at `docs/superpowers/audits/2026-04-25-tier-3-blocks-and-utils.md`
- Affirmative coverage statement linking back to V1, V4, and the wrapper-style-merge tests as evidence
- No new tests required; existing audit infrastructure is the artifact

---

## 4. Process & Sequencing

Phases run strictly in order. Each phase must complete (all artifacts committed, all tests green) before the next begins.

### 4.1 Phase 1 — Tier 1 (sequential, foreground)

One agent per file or per pair, foreground execution, in this dependency order:

1. `factory.tsx`
2. `polymorphic-component.tsx` + `define-polymorphic-component.tsx` (one agent)
3. `define-generic-component.tsx`
4. `with-props.tsx`
5. `inline-styles/` (whole bundle as one unit)
6. `hash-style-props.ts` + `use-random-class-name.ts` (one agent)

**Reasoning for foreground execution:** drift in Tier 1 is too costly to fire-and-forget. The orchestrator reads each agent's report and integrates before dispatching the next.

Each agent works in an isolated worktree on its own `worktree-tier1-<file>` branch. The orchestrator merges with `--no-ff` after each agent returns. Worktrees are cleaned up at end of phase.

### 4.2 Phase 2 — Tier 2 (parallel, background)

Five concurrent worktree-isolated background agents, one per batch (T2-A through T2-E). Disjoint file ownership: no two batches edit the same source file.

Each batch:
- Writes its audit report at the assigned path.
- Writes its ledger fragment at the assigned path.
- Applies TDD-driven fixes inline (no deprecation shims; clean replacements only).
- Replaces any `@mantine/hooks`-equivalent reimplementation inline per § 2.4.

Background mode is acceptable here because batches are disjoint and survey-shaped. Orchestrator integrates after all five report.

### 4.3 Phase 3 — Tier 3 (single fast pass)

One agent walks every Tier 3 file, re-runs the existing V1 parity script, runs the V4 browser-parity suite, and produces the rolled-up report. No new tests required.

### 4.4 Phase 4 — Consolidation (orchestrator only)

After Phase 3 completes, the orchestrator (not a sub-agent):

1. Writes the **coverage manifest** at `docs/superpowers/audits/2026-04-25-coverage-manifest.md` — every file in scope with Mantine analog, tier, status, audit-doc link, ledger-entry list.
2. Writes the **roadmap doc** at `docs/superpowers/roadmap/mantine-derivable-future-work.md` — captures every (e) "missing port" finding from any phase.
3. Merges all Tier 2 ledger fragments into `docs/superpowers/divergences/mantine-master.md` under a new top-level section "Full audit pass — 2026-04-25."
4. Updates `STATUS.md` test counts and links to the manifest.
5. Updates Hard Rule 13 in `docs/superpowers/specs/2026-04-25-soribashi-design.md` to reference the new validation date.
6. Final smoke: `bunx vitest run`, `bun run typecheck`, `bun run --filter @soribashi/playground build`, `bun run test:browser`.
7. Cleanup: removes all audit worktrees, deletes merged branches.

---

## 5. Per-File Deliverables

Each in-scope file produces:

### 5.1 Coverage manifest entry (mandatory)

A row in `docs/superpowers/audits/2026-04-25-coverage-manifest.md`:

```
| Soribashi file | Mantine analog | Tier | Status | Audit doc | Ledger entries |
|---|---|---|---|---|---|
| packages/factory/src/factory.tsx | core/factory/factory.tsx | 1 | drift fixed | tier-1-factory.md | factory-fwd-ref, factory-with-props |
| packages/theme/src/compose-theme.ts | core/MantineProvider/merge-theme/merge-theme.ts | 2 | matches | tier-2-theme.md | — |
| packages/factory/src/auto-vars.ts | (no analog) | 2 | soribashi addition | tier-2-factory-additions.md | — |
```

`Status` is one of: `matches` / `drift fixed` / `intentional divergence` / `soribashi addition` / `hook replaced (uses @mantine/hooks)`.

### 5.2 Tier audit doc (mandatory per tier)

Per-file or per-batch narrative report. Tier 1: one doc per file. Tier 2: one doc per batch. Tier 3: one rolled-up doc.

Each doc contains:
- File header with Mantine source pointer (path + commit SHA `63dafbbf`).
- Branch enumeration table (Tier 1) or decision-points list (Tier 2) or coverage statement (Tier 3).
- Findings classified by type.
- Fixes applied (commit SHAs).

### 5.3 Ledger entries (mandatory per divergence)

Every divergence (kept OR aligned OR new hook replacement) produces a ledger entry in the master ledger at `docs/superpowers/divergences/mantine-master.md`, under the new "Full audit pass — 2026-04-25" section.

Tier 2 batches write ledger fragments, which the orchestrator merges into the master ledger during Phase 4.

### 5.4 Parity tests (mandatory for Tier 1 only)

Tier 1 files commit `<file>-parity.test.tsx` to `packages/factory/test/`. ≥1 test per public branch / decision point. Tests pass.

### 5.5 Roadmap doc (single artifact, populated by all phases)

`docs/superpowers/roadmap/mantine-derivable-future-work.md` accumulates (e) findings — Mantine helpers/utilities/types that soribashi could expose but doesn't. Each entry includes:
- Mantine source path
- Brief description
- Why it might be useful for soribashi consumers
- Estimated implementation effort (rough)

---

## 6. Definition of Done

The audit is complete when ALL hold:

1. Every file in scope appears in the coverage manifest with one of: `matches`, `drift fixed (→ ledger)`, `intentional divergence (→ ledger)`, `soribashi addition (no analog)`, `hook replaced (uses @mantine/hooks)`.
2. Every Tier 1 file has a parity test file committed; tests pass.
3. Every divergence (kept OR aligned OR hook replacement) has a ledger entry pointing at the Mantine source path + commit SHA.
4. The roadmap doc lists at least the (e) findings encountered, even if the list is short.
5. `bunx vitest run` clean.
6. `bun run typecheck` clean.
7. `bun run --filter @soribashi/playground build` clean.
8. `bun run test:browser` clean (46+ tests).
9. `STATUS.md` and Hard Rule 13 of `soribashi-design.md` updated with the new validation date.
10. Working tree clean of audit artifacts; no leftover worktrees, no stale branches.

---

## 7. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Tier 1 turns up a load-bearing bug requiring substantial refactor | Phase 1 agent pauses, raises to orchestrator; orchestrator does not auto-fix something that ripples through every component without user sign-off |
| Two Tier 2 batches both want to add ledger entries, creating merge conflicts | Each batch writes its ledger fragment to its own per-batch file; orchestrator serializes fragments into the master ledger during Phase 4 |
| `@mantine/hooks` replacement breaks tests that depended on the old implementation's internals | Allowed: update those tests as part of the replacement commit, since they were testing the wrong layer |
| Mantine source has commits past `63dafbbf` since prior audits | Validation pinned to `63dafbbf`; future-Mantine drift is a separate audit |
| Phase 2 batch encounters a finding that crosses package boundaries | Batch flags the finding in its report; orchestrator resolves during Phase 4 |
| Audit reveals Tier 3 V1/V4 work was incomplete | Promote that file to Tier 2 retroactively; re-walk it in Phase 2 (or as a Phase 2.5 if Phase 2 already shipped) |
| Parallel Tier 2 agents commit directly to main from worktrees (V1/V4 precedent) | Each agent prompt explicitly instructs `worktree-tier2-<batch>` branch only; no commits to main |
| Audit discovers a deprecation-shim from prior batch work | Remove cleanly per § 2.4 — no shims accumulate |

---

## 8. Hard Rules (audit-specific)

1. **No alignment without source review.** Every change must be traceable to a specific Mantine file + commit SHA `63dafbbf`.
2. **No silent divergence.** Every divergence (kept OR aligned OR hook replacement) must be in the ledger with a written reason.
3. **No regressions.** All existing tests pass throughout the audit.
4. **Atomic commits.** Each file (Tier 1) or batch (Tier 2) gets its own commit set; the corresponding audit doc + ledger fragment commits alongside the code changes.
5. **No deprecation shims.** When alignment requires removal of a soribashi feature (e.g., a hand-rolled hook now sourced from `@mantine/hooks`), the removal is clean. No `@deprecated` aliases.
6. **Affirmative coverage.** The coverage manifest must list *every* in-scope file, not just the ones with findings. A file with no findings has a `matches` status row.
7. **The audit pins to `63dafbbf`.** Any later Mantine commits are out of scope.

---

## 9. Out-of-Scope Future Work

These are explicitly deferred:

- Re-running the full audit against newer Mantine commits (a `mantine-vN.md` ledger keyed to each future commit).
- A CI check that fails the build if a soribashi file diverges from a pinned Mantine snapshot.
- Validating Mantine compatibility by running Mantine's own test suite against soribashi.
- Implementing the (e) "missing ports" findings from the roadmap doc.

---

## 10. Success Criteria

The audit is on track when:

1. After Phase 1, every Tier 1 file has a parity test file and a ledger entry (or a "matches" coverage manifest row); all tests pass.
2. After Phase 2, every Tier 2 file has an audit-doc entry and a ledger fragment (or coverage manifest row); all tests pass.
3. After Phase 3, the rolled-up Tier 3 report references V1/V4 evidence and confirms coverage of every block + util.
4. After Phase 4, the coverage manifest is exhaustive, the roadmap doc is populated, the master ledger has the new section, and STATUS + Hard Rule 13 reflect the new validation date.
5. The user can read the coverage manifest and verify, file by file, that every Mantine-derivable line in soribashi has been validated.
