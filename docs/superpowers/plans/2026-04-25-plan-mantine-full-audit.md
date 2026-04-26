# Mantine Full-Audit Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute exhaustive Hard-Rule-13 enforcement: every soribashi file derivable from Mantine validated against the pinned commit `63dafbbf`, with every divergence logged in the ledger and every reimplemented `@mantine/hooks` utility replaced inline.

**Architecture:** Four sequential phases. Phase 1 (Tier 1) walks load-bearing factory primitives one at a time with parity-test deliverables. Phase 2 (Tier 2) dispatches five disjoint background batches over theme / provider+types / factory-soribashi-additions / Box-style-props / codegen. Phase 3 (Tier 3) does a single fast pass over blocks + utils, leaning on existing V1/V4 audit infrastructure. Phase 4 (orchestrator-only) consolidates the coverage manifest, roadmap doc, master ledger, and STATUS.

**Tech Stack:** TypeScript, React 18+, Vitest, Playwright, jsdom, Bun workspace. Mantine source at `/Users/matt/Documents/GitHub/mantine` pinned to `63dafbbf5f0135eb36455b7add4c0ddcd0f3240a`.

**Reference docs:**
- Spec: `docs/superpowers/specs/2026-04-25-mantine-full-audit-design.md`
- Hard Rule 13: `docs/superpowers/specs/2026-04-25-soribashi-design.md` § 13
- Hard Rule 14 (`@mantine/hooks` permission): `docs/superpowers/specs/2026-04-25-soribashi-design.md` § 14
- Existing ledger: `docs/superpowers/divergences/mantine-master.md`
- Prior audit reports: `docs/superpowers/audits/2026-04-25-{css-parity,css-variable-parity,factory-parity-branches}.md`

---

## Conventions (read once before any task)

### Mantine source baseline

All validation pins to commit `63dafbbf5f0135eb36455b7add4c0ddcd0f3240a` of `mantinedev/mantine` master, checked out at `/Users/matt/Documents/GitHub/mantine`. Confirm before starting:

```bash
cd /Users/matt/Documents/GitHub/mantine && git rev-parse HEAD
# Expected: 63dafbbf5f0135eb36455b7add4c0ddcd0f3240a
```

If the rev does not match, `git -C /Users/matt/Documents/GitHub/mantine checkout 63dafbbf5f0135eb36455b7add4c0ddcd0f3240a` before continuing.

### Per-file audit recipe

Every file in scope follows this recipe. Adapt only when the file has a soribashi-only purpose with no Mantine analog.

1. **Read soribashi side end-to-end.** Note: imports, exports, public functions, every `if`/`else`/branch, every default value, every merge-precedence decision.
2. **Read Mantine analog end-to-end.** Same structural read.
3. **Walk side-by-side.** For each Mantine decision point, find the soribashi equivalent. Classify the soribashi behavior as one of:
   - `IDENTICAL` — same observable behavior post-token-substitution.
   - `TOKEN_DIFF` — same logic, different token names per the substitution table (`docs/superpowers/specs/2026-04-25-mantine-blocks-adaptation-design.md` § 4).
   - `INTENTIONAL` — divergent on purpose; already in the ledger or to be added.
   - `BUG` — soribashi misbehaves; must fix via TDD.
   - `HALLUCINATION` — soribashi has logic Mantine doesn't, written from scratch when Mantine has a canonical version.
   - `INCONSISTENCY` — soribashi has logic that's also in another soribashi file, but implemented differently.
   - `HOOK_REIMPL` — soribashi reimplemented something now available via `@mantine/hooks`. Replace inline.
4. **Write findings into the audit doc** for the file/batch.
5. **For each `BUG`, `HALLUCINATION`, `INCONSISTENCY`, `HOOK_REIMPL` finding:** TDD — write the failing test first, run to confirm fail, fix, re-run to confirm pass.
6. **For each `INTENTIONAL` finding:** add or confirm a ledger entry under "Full audit pass — 2026-04-25" (Tier 2/3) or under the file's own ledger section (Tier 1).
7. **Update the coverage manifest row** for the file with status (`matches` / `drift fixed` / `intentional divergence` / `soribashi addition` / `hook replaced`).

### Hooks-replacement procedure

When a finding is classified `HOOK_REIMPL`:

1. Confirm the soribashi reimplementation provides the same observable contract as the `@mantine/hooks` export (same inputs → same outputs, same React lifecycle behavior). Minor signature differences (extra optional argument with sensible default) do not disqualify replacement.
2. Add `@mantine/hooks` to the relevant package's `package.json` dependencies (per Hard Rule 14):

```bash
bun add -F @soribashi/<package-name> @mantine/hooks
```

3. Replace all imports of the soribashi hook with imports from `@mantine/hooks`.
4. Delete the soribashi reimplementation file and any unit tests of its internals.
5. Update consumer-facing tests if they assert on internal behavior (acceptable per spec § 7).
6. Add a ledger entry under "Aligned" referencing both the deleted soribashi file and the `@mantine/hooks` export now in use.

### Worktree + branch discipline

- Tier 1 (Phase 1): each agent works in `worktree-tier1-<file-slug>`. Foreground execution. Orchestrator merges with `--no-ff` after each agent returns.
- Tier 2 (Phase 2): each batch works in `worktree-tier2-<batch-letter>`. Background execution. Orchestrator merges with `--no-ff` after all five batches return.
- Tier 3 (Phase 3): one agent in `worktree-tier3`. Foreground.
- Phase 4 (consolidation): orchestrator only, on `main`.

**No agent commits directly to `main` from a worktree.** Each agent prompt explicitly instructs the worktree branch.

### Ledger fragment convention

Tier 2 batches do not edit `docs/superpowers/divergences/mantine-master.md` directly. Each writes a fragment file at `docs/superpowers/audits/2026-04-25-tier-2-<batch-letter>-ledger-fragment.md`. The orchestrator merges all fragments into the master ledger during Phase 4.

Tier 1 agents may edit the master ledger directly (sequential, no contention).

### Verification gate (run before every commit in any phase)

```bash
cd /Users/matt/Documents/GitHub/soribashi
bunx vitest run
bun run typecheck
```

Both must be clean. If a test fails, fix or document before committing.

### Commit message convention

Use conventional commits scoped to the audit:

- `audit(<package>): <description>` — for audit docs and ledger entries
- `fix(<package>): <description>` — for TDD-driven bug fixes
- `refactor(<package>): replace <hook> with @mantine/hooks` — for hook replacements
- `docs: <description>` — for spec/STATUS/manifest updates

Each commit message references the Mantine source path + commit SHA, e.g.:
```
fix(factory): align withProps undefined handling

Mantine source: packages/@mantine/core/src/core/factory/factory.tsx
Mantine commit: 63dafbbf
```

---

## Phase 0 — Pre-flight

### Task 0.1: Verify Mantine source pin

**Files:**
- (none)

- [ ] **Step 1: Verify Mantine pin.**

```bash
cd /Users/matt/Documents/GitHub/mantine && git rev-parse HEAD
```

Expected output: `63dafbbf5f0135eb36455b7add4c0ddcd0f3240a`

- [ ] **Step 2: If pin does not match, check out the canonical commit.**

```bash
git -C /Users/matt/Documents/GitHub/mantine fetch origin
git -C /Users/matt/Documents/GitHub/mantine checkout 63dafbbf5f0135eb36455b7add4c0ddcd0f3240a
```

- [ ] **Step 3: Verify soribashi tree is clean (or stash any WIP).**

```bash
cd /Users/matt/Documents/GitHub/soribashi && git status --short
```

If the tree has uncommitted changes belonging to the user (tenants/playground/codegen), they must be committed or stashed by the user before this audit begins. Do not stash the user's work as part of this plan; halt and ask.

---

### Task 0.2: Scaffold audit-doc directory and coverage manifest

**Files:**
- Create: `docs/superpowers/audits/2026-04-25-coverage-manifest.md`
- Create: `docs/superpowers/roadmap/mantine-derivable-future-work.md`

- [ ] **Step 1: Create the directories if they don't exist.**

```bash
mkdir -p docs/superpowers/audits docs/superpowers/roadmap
```

- [ ] **Step 2: Write the coverage manifest scaffold.**

```markdown
# Mantine Coverage Manifest — 2026-04-25 Full Audit

**Pinned to:** `mantinedev/mantine@63dafbbf5f0135eb36455b7add4c0ddcd0f3240a`

**Status legend:**
- `matches` — soribashi behavior matches Mantine (post token-substitution); no findings.
- `drift fixed` — drift was found and corrected; see ledger entries.
- `intentional divergence` — soribashi diverges deliberately; see ledger entries.
- `soribashi addition` — no Mantine analog; soribashi-only feature.
- `hook replaced` — soribashi reimplementation removed; now imports from `@mantine/hooks`.

| Soribashi file | Mantine analog | Tier | Status | Audit doc | Ledger entries |
|---|---|---|---|---|---|
| _(rows added during execution)_ | | | | | |
```

- [ ] **Step 3: Write the roadmap doc scaffold.**

```markdown
# Mantine-Derivable Future Work

This document captures (e) findings — Mantine helpers / utilities / types soribashi could expose but currently doesn't. These are explicitly out of scope for the 2026-04-25 full-audit pass; they are candidates for follow-up consideration.

Each entry includes:
- Mantine source path
- Brief description
- Why it might be useful for soribashi consumers
- Estimated implementation effort (S / M / L)

| Mantine source | Description | Soribashi value | Effort | Surfaced in audit |
|---|---|---|---|---|
| _(rows added during execution)_ | | | | |
```

- [ ] **Step 4: Commit.**

```bash
git add docs/superpowers/audits/2026-04-25-coverage-manifest.md docs/superpowers/roadmap/mantine-derivable-future-work.md
git commit -m "audit: scaffold coverage manifest and roadmap doc for full audit pass"
```

---

## Phase 1 — Tier 1 (sequential, foreground)

Each Tier 1 task runs as one foreground agent in an isolated worktree. The orchestrator dispatches each agent, reviews the report, merges the worktree branch with `--no-ff`, and proceeds to the next.

### Task 1.1: Audit `factory.tsx`

**Mantine source:** `packages/@mantine/core/src/core/factory/factory.tsx`

**Soribashi files:**
- Audit: `packages/factory/src/factory.tsx`
- Audit doc: `docs/superpowers/audits/2026-04-25-tier-1-factory.md`
- Parity test: `packages/factory/test/factory-parity.test.tsx`
- Ledger updates: `docs/superpowers/divergences/mantine-master.md` (under new "Full audit pass — 2026-04-25" section)
- Manifest update: `docs/superpowers/audits/2026-04-25-coverage-manifest.md`

- [ ] **Step 1: Create worktree.**

```bash
git worktree add -b worktree-tier1-factory .claude/worktrees/tier1-factory main
cd .claude/worktrees/tier1-factory
```

- [ ] **Step 2: Read soribashi source end-to-end.**

Read `packages/factory/src/factory.tsx`. Note: every export, every `forwardRef` wrap, every props-merge call, every type cast, every helper call.

- [ ] **Step 3: Read Mantine source end-to-end.**

Read `/Users/matt/Documents/GitHub/mantine/packages/@mantine/core/src/core/factory/factory.tsx`. Note: same structural elements.

- [ ] **Step 4: Build the branch enumeration table.**

Create `docs/superpowers/audits/2026-04-25-tier-1-factory.md` with a table listing every decision point in Mantine's `factory.tsx` and the soribashi behavior at the equivalent point. Format:

```markdown
# Tier 1 Audit — packages/factory/src/factory.tsx

**Pinned to:** `mantinedev/mantine@63dafbbf5f0135eb36455b7add4c0ddcd0f3240a`
**Mantine source:** `packages/@mantine/core/src/core/factory/factory.tsx`

## Decision-point enumeration

| # | Mantine line(s) | Decision / branch | Soribashi behavior | Classification |
|---|---|---|---|---|
| 1 | factory.tsx:21-27 | `factory(ui)` returns the `ui` cast to `any` (no forwardRef) | Wraps in `React.forwardRef`; render signature is `(props, ref)` | `INTENTIONAL` (already in ledger) |
| 2 | factory.tsx:30-38 | `withProps(fixedProps)` returns `(props) => <Component {...fixedProps} {...props} />` | Filters `undefined` from instance props before merge | `INTENTIONAL` (already in ledger) |
| ... | ... | ... | ... | ... |

## Findings

### `BUG` / `HALLUCINATION` / `INCONSISTENCY` / `HOOK_REIMPL` findings

(none / list with file:line specificity)

### `INTENTIONAL` findings (ledger entries)

(none / list)
```

- [ ] **Step 5: Write parity tests for every public branch.**

Create `packages/factory/test/factory-parity.test.tsx`. Each branch in the enumeration table gets at least one test asserting on the observable soribashi behavior. Use the V2 parity-test files (`packages/factory/test/use-styles-parity.test.tsx`, `use-props-parity.test.tsx`) as templates.

```typescript
// Example structure
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { factory } from '../src/factory.tsx';

describe('factory() — Mantine parity', () => {
  it('B1: factory(ui) returns a forwardRef-wrapped component (soribashi divergence from Mantine\'s identity cast)', () => {
    // ...test asserting on the observable behavior
  });

  // ...more tests, one per branch
});
```

- [ ] **Step 6: Run tests.**

```bash
cd /Users/matt/Documents/GitHub/soribashi
bunx vitest run packages/factory/test/factory-parity.test.tsx
```

Expected: all tests pass on first run (factory.tsx already implemented). If any fail, that test surfaces a `BUG` / `HALLUCINATION` finding — fix via TDD before continuing.

- [ ] **Step 7: For each `BUG` / `HALLUCINATION` / `INCONSISTENCY` / `HOOK_REIMPL` finding, apply the fix via TDD.**

Procedure:
1. The failing parity test from Step 5 IS the regression test.
2. Fix `packages/factory/src/factory.tsx` minimally to make the test pass.
3. Re-run: `bunx vitest run packages/factory/test/factory-parity.test.tsx`
4. Verify pass.
5. Run full suite: `bunx vitest run` and `bun run typecheck`. Both must remain clean.

- [ ] **Step 8: For each `INTENTIONAL` finding not already in the ledger, add a ledger entry.**

Edit `docs/superpowers/divergences/mantine-master.md`. Under a new top-level section "Full audit pass — 2026-04-25" (create if not present), add:

```markdown
### `factory()` — <short description>

- **File:** `packages/factory/src/factory.tsx`
- **Mantine source:** `packages/@mantine/core/src/core/factory/factory.tsx` (commit 63dafbbf)
- **Mantine behavior:** <description>
- **Soribashi behavior:** <description>
- **Reason for divergence:** <description>
- **Disposition:** Keep / Aligned / Hybrid
- **Test:** `packages/factory/test/factory-parity.test.tsx` — "<test name>"
```

- [ ] **Step 9: Update the coverage manifest.**

Edit `docs/superpowers/audits/2026-04-25-coverage-manifest.md`. Append a row:

```
| packages/factory/src/factory.tsx | core/factory/factory.tsx | 1 | <status> | tier-1-factory.md | <ledger-entry-list> |
```

Status is `matches` if no divergences, `drift fixed` if any `BUG` was fixed, `intentional divergence` if any `INTENTIONAL` ledger entry exists.

- [ ] **Step 10: Verification.**

```bash
cd /Users/matt/Documents/GitHub/soribashi
bunx vitest run
bun run typecheck
```

Both must be clean.

- [ ] **Step 11: Commit.**

```bash
git add packages/factory/test/factory-parity.test.tsx packages/factory/src/factory.tsx docs/superpowers/audits/ docs/superpowers/divergences/mantine-master.md
git commit -m "audit(factory): parity audit of factory.tsx vs Mantine 63dafbbf

Mantine source: packages/@mantine/core/src/core/factory/factory.tsx
Mantine commit: 63dafbbf"
```

- [ ] **Step 12: Orchestrator integrates worktree.**

After agent reports, orchestrator (in main checkout):

```bash
cd /Users/matt/Documents/GitHub/soribashi
git merge --no-ff worktree-tier1-factory -m "merge: Tier 1 — factory.tsx audit"
git worktree remove .claude/worktrees/tier1-factory
git branch -D worktree-tier1-factory
```

Run final verification:

```bash
bunx vitest run && bun run typecheck
```

---

### Task 1.2: Audit `polymorphic-component.tsx` + `define-polymorphic-component.tsx`

**Mantine source:**
- `packages/@mantine/core/src/core/factory/polymorphic-factory.tsx`
- `packages/@mantine/core/src/core/factory/create-polymorphic-component.ts`

**Soribashi files:**
- Audit: `packages/factory/src/polymorphic-component.tsx` + `packages/factory/src/define-polymorphic-component.tsx`
- Audit doc: `docs/superpowers/audits/2026-04-25-tier-1-polymorphic.md`
- Parity test: `packages/factory/test/polymorphic-parity.test.tsx`
- Manifest + ledger updates as above.

Worktree branch: `worktree-tier1-polymorphic`.

Tasks 1.2 through 1.6 share the same 12-step shape as Task 1.1. Read Task 1.1 Step 1–12 once; the deltas for each subsequent task are listed inline below. The Conventions § "Per-file audit recipe" defines the per-file work that fills Steps 4–9 of every Tier 1 task.

This task covers both files in a single audit doc and parity test file because they are tightly coupled (define-polymorphic-component composes polymorphic-component).

- [ ] **Step 1: Create worktree.** `git worktree add -b worktree-tier1-polymorphic .claude/worktrees/tier1-polymorphic main && cd .claude/worktrees/tier1-polymorphic`

- [ ] **Step 2-4: Read both soribashi files + both Mantine files; build branch enumeration table covering both.**

Branch enumeration must cover at least:
- Polymorphic `as` prop unwrap
- Default element when `as` is not set
- Type instantiation through `withProps`
- Compound `Components.Subcomponent` attachment
- ref forwarding through the polymorphic chain
- forwardRef wrap (soribashi divergence from Mantine's identity cast)

- [ ] **Step 5-7: Parity tests; TDD any fixes.**

Parity test file structure:

```typescript
describe('polymorphicFactory + define-polymorphic-component — Mantine parity', () => {
  describe('as prop semantics', () => {
    it('renders defaultElement when as is not set', () => { /* ... */ });
    it('renders the as element when set', () => { /* ... */ });
    it('preserves polymorphism through withProps', () => { /* ... */ });
    // ...
  });
  describe('forwardRef behavior', () => { /* ... */ });
  describe('compound subcomponent attachment', () => { /* ... */ });
});
```

- [ ] **Step 8-9: Ledger entries + manifest rows for both files.**

- [ ] **Step 10-12: Verify, commit, orchestrator integrates.** Commit message: `audit(factory): parity audit of polymorphic-component.tsx + define-polymorphic-component.tsx vs Mantine 63dafbbf`

---

### Task 1.3: Audit `define-generic-component.tsx`

**Mantine source:** `packages/@mantine/core/src/core/factory/factory.tsx` (search for `genericFactory`)

**Soribashi files:**
- Audit: `packages/factory/src/define-generic-component.tsx`
- Audit doc: `docs/superpowers/audits/2026-04-25-tier-1-generic.md`
- Parity test: `packages/factory/test/generic-parity.test.tsx`
- Manifest + ledger updates as above.

Worktree branch: `worktree-tier1-generic`.

- [ ] **Step 1-12:** Follow the recipe in Task 1.1, adapted for the generic factory. Branch enumeration must cover at least:
  - `genericFactory<T>` produces a component that retains the type parameter
  - `withProps` preserves the generic
  - Inheritance of `factory()` behavior (forwardRef, undefined-filter)
  - Type-only divergences (`GenericComponentFn` shape)

Commit message: `audit(factory): parity audit of define-generic-component.tsx vs Mantine 63dafbbf`

---

### Task 1.4: Audit `with-props.tsx`

**Mantine source:** `packages/@mantine/core/src/core/factory/factory.tsx` (search for `withProps` inline definition)

**Soribashi files:**
- Audit: `packages/factory/src/with-props.tsx`
- Audit doc: `docs/superpowers/audits/2026-04-25-tier-1-with-props.md`
- Parity test: `packages/factory/test/with-props-parity.test.tsx`

Worktree branch: `worktree-tier1-with-props`.

- [ ] **Step 1-12:** Follow the recipe. Branch enumeration must cover at least:
  - undefined-filter (soribashi divergence already in ledger)
  - Preset merge order (presets first, then instance)
  - Polymorphism preservation (already covered in 1.2 but verify the `with-props.tsx` side)
  - Generic preservation (already covered in 1.3 but verify the `with-props.tsx` side)
  - Class-name merge if any
  - Style-merge if any

Commit message: `audit(factory): parity audit of with-props.tsx vs Mantine 63dafbbf`

---

### Task 1.5: Audit `inline-styles/` bundle

**Mantine source:**
- `packages/@mantine/core/src/core/InlineStyles/InlineStyles.tsx`
- `packages/@mantine/core/src/core/InlineStyles/css-object-to-string.ts` (and any sibling helpers)

**Soribashi files:**
- Audit: `packages/factory/src/inline-styles/InlineStyles.tsx` + every helper file in `packages/factory/src/inline-styles/`
- Audit doc: `docs/superpowers/audits/2026-04-25-tier-1-inline-styles.md`
- Parity test: `packages/factory/test/inline-styles-parity.test.tsx`

Worktree branch: `worktree-tier1-inline-styles`.

- [ ] **Step 1-12:** Follow the recipe. The audit doc covers the whole bundle (all files in `packages/factory/src/inline-styles/`). Branch enumeration must cover at least:
  - The `selector` + `styles` + `media` props
  - Media query rule generation order (Mantine sorts by ascending min-width — verify soribashi)
  - Container query handling (or absence — soribashi defers `type='container'`)
  - The `<style>` element output format
  - SSR considerations (Mantine handles SSR via `nonce` — soribashi may or may not)
  - Hash collisions / `useRandomClassName` integration

Commit message: `audit(factory): parity audit of inline-styles/ bundle vs Mantine 63dafbbf`

---

### Task 1.6: Audit `hash-style-props.ts` + `use-random-class-name.ts`

**Mantine source:**
- `packages/@mantine/core/src/core/Box/hash-style-props/hash-style-props.ts`
- `packages/@mantine/core/src/core/use-random-class-name/use-random-class-name.ts`

**Soribashi files:**
- Audit: `packages/factory/src/hash-style-props.ts` + `packages/factory/src/use-random-class-name.ts`
- Audit doc: `docs/superpowers/audits/2026-04-25-tier-1-hash-and-classname.md`
- Parity test: `packages/factory/test/hash-and-classname-parity.test.tsx`

Worktree branch: `worktree-tier1-hash-classname`.

**Note: `useRandomClassName` is a strong `HOOK_REIMPL` candidate.** Mantine's hook is a one-liner over `useId`. Per Hard Rule 14 the audit may decide to delete soribashi's reimplementation and import from `@mantine/hooks`. **Before deciding, verify** `@mantine/hooks` actually exports `useRandomClassName` (check `node_modules/@mantine/hooks` or the Mantine source). If it does, follow the hooks-replacement procedure. If it does not, leave the soribashi version in place and document why (no analog in `@mantine/hooks`, only in `@mantine/core`).

- [ ] **Step 1-12:** Follow the recipe + hooks-replacement procedure where applicable.

Commit message: `audit(factory): parity audit of hash-style-props + use-random-class-name vs Mantine 63dafbbf` (or `refactor(factory): replace use-random-class-name with @mantine/hooks` if hook replaced).

---

### Task 1.7: Phase 1 gate — verification

After Tasks 1.1–1.6 are integrated:

- [ ] **Step 1: Verify all parity tests committed.**

```bash
ls packages/factory/test/*-parity.test.tsx
```

Expected files:
- `factory-parity.test.tsx`
- `polymorphic-parity.test.tsx`
- `generic-parity.test.tsx`
- `with-props-parity.test.tsx`
- `inline-styles-parity.test.tsx`
- `hash-and-classname-parity.test.tsx` (or only one half if `use-random-class-name` was replaced)
- (already-existing: `use-styles-parity.test.tsx`, `use-props-parity.test.tsx`)

- [ ] **Step 2: Verify all audit docs committed.**

```bash
ls docs/superpowers/audits/2026-04-25-tier-1-*.md
```

- [ ] **Step 3: Verify coverage manifest has Tier 1 rows for all audited files.**

```bash
grep "| 1 |" docs/superpowers/audits/2026-04-25-coverage-manifest.md
```

Each Tier 1 file must appear.

- [ ] **Step 4: Final smoke.**

```bash
bunx vitest run
bun run typecheck
bun run --filter @soribashi/playground build
```

All clean.

---

## Phase 2 — Tier 2 (parallel, background)

Five concurrent worktree-isolated background agents. Orchestrator dispatches all five, awaits completion notifications, then integrates serially.

### Task 2.1: Batch T2-A — Theme

**Files in batch:**
- `packages/theme/src/create-theme.ts`
- `packages/theme/src/compose-theme.ts`
- `packages/theme/src/default-tokens.ts`
- `packages/theme/src/default-intent-resolver.ts`
- `packages/theme/src/types.ts`

**Mantine source:**
- `packages/@mantine/core/src/core/MantineProvider/create-theme/create-theme.ts`
- `packages/@mantine/core/src/core/MantineProvider/merge-theme/merge-theme.ts`
- `packages/@mantine/core/src/core/MantineProvider/default-theme.ts`
- `packages/@mantine/core/src/core/MantineProvider/default-variant-colors-resolver/default-variant-colors-resolver.ts`
- `packages/@mantine/core/src/core/MantineProvider/theme.types.ts`

**Worktree branch:** `worktree-tier2-A`

**Deliverables (committed by the agent in its worktree):**
- Audit report: `docs/superpowers/audits/2026-04-25-tier-2-theme.md`
- Ledger fragment: `docs/superpowers/audits/2026-04-25-tier-2-A-ledger-fragment.md`
- TDD-driven fixes for any `BUG` / `HALLUCINATION` / `INCONSISTENCY` / `HOOK_REIMPL` findings
- Coverage manifest rows for all 5 files

**Agent dispatch:** background, isolated worktree. The orchestrator's dispatch prompt must include:
1. The full per-file audit recipe from the conventions section above.
2. The hooks-replacement procedure.
3. The worktree-branch discipline (commit only to `worktree-tier2-A`, never to main).
4. The list of files in scope and Mantine analogs.
5. The verification gate (vitest + typecheck before each commit).
6. The deliverable paths.

- [ ] **Step 1: Orchestrator dispatches Batch T2-A agent in background worktree mode.**

(See "Phase 2 dispatch script" at the end of Phase 2 for the canonical dispatch shape.)

- [ ] **Step 2: Agent works through its checklist** (the agent's internal task list, not part of this plan):
  - For each of the 5 files: apply the per-file recipe.
  - Write findings into the audit report.
  - For each `INTENTIONAL` finding: write a fragment ledger entry into `2026-04-25-tier-2-A-ledger-fragment.md`.
  - For each `BUG` / `HALLUCINATION` / `INCONSISTENCY` / `HOOK_REIMPL` finding: TDD fix.
  - Update the coverage manifest with one row per file.
  - Run verification gate before committing.
  - Commit atomically per file (or per logical group).

- [ ] **Step 3: Agent reports back** with branch name, commit list, findings count, hook replacements (if any), bugs fixed (if any).

---

### Task 2.2: Batch T2-B — Provider + types

**Files in batch:**
- `packages/factory/src/provider/provider.tsx`
- `packages/factory/src/provider/context.ts`
- `packages/factory/src/provider/use-theme.ts`
- `packages/factory/src/types/polymorphic.ts`
- `packages/factory/src/types/factory-payload.ts`
- `packages/factory/src/types/props.ts`
- `packages/factory/src/types/render-context.ts`

**Mantine source:**
- `packages/@mantine/core/src/core/MantineProvider/MantineProvider.tsx`
- `packages/@mantine/core/src/core/MantineProvider/Mantine.context.ts`
- `packages/@mantine/core/src/core/MantineProvider/use-mantine-context.ts`
- `packages/@mantine/core/src/core/factory/create-polymorphic-component.ts`
- `packages/@mantine/core/src/core/factory/factory.tsx` (FactoryPayload — already partially read in Task 1.1)
- `packages/@mantine/core/src/core/styles-api/styles-api.types.ts`

**Worktree branch:** `worktree-tier2-B`

**Deliverables:**
- Audit report: `docs/superpowers/audits/2026-04-25-tier-2-provider-types.md`
- Ledger fragment: `docs/superpowers/audits/2026-04-25-tier-2-B-ledger-fragment.md`
- TDD-driven fixes
- Coverage manifest rows for all 7 files

**Steps:** same shape as Task 2.1 (background dispatch, agent works internally, reports back).

---

### Task 2.3: Batch T2-C — Factory soribashi-additions

**Files in batch:**
- `packages/factory/src/auto-vars.ts`
- `packages/factory/src/define-component.tsx`
- `packages/factory/src/cn.ts`
- `packages/factory/src/create-vars-resolver.ts`

**Mantine source (where applicable):**
- `auto-vars.ts`: no analog. Audit deliverable: justification entry.
- `define-component.tsx`: composes `factory()` + `useProps` + `useStyles`; audit deliverable: confirm composition is correct, no hidden divergences.
- `cn.ts`: check whether this matches `clsx` or `classnames` semantics; if it's a reimplementation of a common library, document the choice. Mantine uses `clsx` directly.
- `create-vars-resolver.ts`: identity helper for type narrowing; analog is Mantine's `createVarsResolver` in `core/styles-api/use-styles/`.

**Worktree branch:** `worktree-tier2-C`

**Deliverables:**
- Audit report: `docs/superpowers/audits/2026-04-25-tier-2-factory-additions.md`
- Ledger fragment: `docs/superpowers/audits/2026-04-25-tier-2-C-ledger-fragment.md`
- For `auto-vars.ts` and `cn.ts`: a "soribashi addition" justification paragraph in the audit report.
- TDD-driven fixes for `define-component.tsx` if it leaks any inconsistency between its composed primitives.
- Coverage manifest rows for all 4 files (status: `soribashi addition` for files with no analog).

---

### Task 2.4: Batch T2-D — Box style-props

**Files in batch:**
- `packages/blocks/src/Box/Box.tsx`
- `packages/blocks/src/Box/Box.types.ts`
- `packages/blocks/src/Box/get-box-mod.ts`
- `packages/blocks/src/Box/style-props/style-props-data.ts`
- `packages/blocks/src/Box/style-props/parse-style-props.ts`
- `packages/blocks/src/Box/style-props/extract-style-props.ts`

**Mantine source:**
- `packages/@mantine/core/src/core/Box/Box.tsx`
- `packages/@mantine/core/src/core/Box/Box.types.ts`
- `packages/@mantine/core/src/core/Box/get-box-mod/`
- `packages/@mantine/core/src/core/Box/style-props/`

**Worktree branch:** `worktree-tier2-D`

**Note:** Box is partially covered by V1 (CSS) and the post-adaptation pass (12 missing style props, mx/my logical, fw identity, hiddenFrom). This batch confirms the .tsx logic is fully aligned and the style-props machinery is line-faithful. Re-walk every line.

**Deliverables:**
- Audit report: `docs/superpowers/audits/2026-04-25-tier-2-box-style-props.md`
- Ledger fragment: `docs/superpowers/audits/2026-04-25-tier-2-D-ledger-fragment.md`
- TDD-driven fixes for any line-level drift not covered by prior audits.
- Coverage manifest rows for all 6 files.

---

### Task 2.5: Batch T2-E — Codegen

**Files in batch:**
- `packages/codegen/src/emit-css.ts`
- `packages/codegen/src/emit-tailwind-v3.ts`
- `packages/codegen/src/emit-tailwind-v4.ts`
- `packages/codegen/src/load-config.ts`

**Mantine source (spiritual analog):**
- `packages/@mantine/core/src/core/MantineProvider/default-css-variables-resolver/default-css-variables-resolver.ts`
- `packages/@mantine/core/src/core/MantineProvider/MantineCssVariables.tsx`

**Worktree branch:** `worktree-tier2-E`

**Note:** V3 covered the variable surface (which `--*` vars get emitted) but not the emitter logic itself. This batch walks the emitter logic line-by-line to confirm:
- Sort orders match (e.g., Mantine's resolver sorts colors family-then-shade)
- Conditional emission rules (e.g., dark-mode block emission) are equivalent
- Edge cases (empty token sets, undefined values) handled the same way
- Tailwind v3 + v4 outputs match Mantine's v3 + v4 conventions where Mantine has them
- `load-config.ts` has no Mantine analog; document as soribashi addition.

**Deliverables:**
- Audit report: `docs/superpowers/audits/2026-04-25-tier-2-codegen.md`
- Ledger fragment: `docs/superpowers/audits/2026-04-25-tier-2-E-ledger-fragment.md`
- TDD-driven fixes (extend `packages/codegen/test/css-variable-parity.test.ts` or add new tests).
- Coverage manifest rows for all 4 files.

---

### Phase 2 dispatch prompt template

Tasks 2.1–2.5 use this dispatch-prompt template. The orchestrator substitutes `<BATCH-LETTER>`, `<FILES>`, `<MANTINE-FILES>`, and `<DELIVERABLE-PATHS>` per the per-task spec above.

```
You are running Tier 2 Batch <BATCH-LETTER> of the Mantine full audit pass.
Repo: /Users/matt/Documents/GitHub/soribashi
Mantine source (pinned to commit 63dafbbf5f0135eb36455b7add4c0ddcd0f3240a):
  /Users/matt/Documents/GitHub/mantine

You are in an isolated git worktree on branch `worktree-tier2-<BATCH-LETTER>`.
Do NOT commit to main. Do NOT push.

## Required reading before starting

1. Plan: docs/superpowers/plans/2026-04-25-plan-mantine-full-audit.md
   - Read the Conventions section in full
   - Read your specific Task in Phase 2 (Task 2.<N>)
2. Spec: docs/superpowers/specs/2026-04-25-mantine-full-audit-design.md
3. Existing ledger: docs/superpowers/divergences/mantine-master.md
4. Substitution table: docs/superpowers/specs/2026-04-25-mantine-blocks-adaptation-design.md § 4

## Files in your batch

<FILES>

## Mantine analogs

<MANTINE-FILES>

## Process

For each file in your batch, apply the per-file audit recipe in the plan's
Conventions section:

1. Read soribashi end-to-end.
2. Read Mantine analog end-to-end.
3. Walk side-by-side; classify every decision point.
4. Write findings into your audit doc.
5. For BUG / HALLUCINATION / INCONSISTENCY / HOOK_REIMPL: TDD fix.
6. For INTENTIONAL: write a fragment ledger entry.
7. Update the coverage manifest row.

## Hooks-replacement rule

If you find a HOOK_REIMPL, follow the hooks-replacement procedure in the
plan's Conventions section. Replace inline. No deprecation aliases.

## Deliverables

Commit to your worktree branch only. Do NOT commit to main.

<DELIVERABLE-PATHS>

## Verification gate (run before EVERY commit)

```bash
cd /Users/matt/Documents/GitHub/soribashi
bunx vitest run
bun run typecheck
```

Both must be clean.

## What NOT to do

- Do not edit `docs/superpowers/divergences/mantine-master.md` directly
  (use your fragment file).
- Do not edit any source file outside your assigned batch.
- Do not edit `packages/blocks/test/blocks.test.tsx` or any other shared
  test file (create new test files in the appropriate test directory if
  you need to add tests for fixes).
- Do not commit to main branch.

## Final report

When done, output:
- Branch name (worktree-tier2-<BATCH-LETTER>) + commit list
- Findings count by classification
- Bugs fixed (count + descriptions)
- Hook replacements (count + descriptions)
- (e) "missing port" candidates surfaced (for the roadmap doc)
```

### Task 2.6: Phase 2 gate — integration and ledger merge

After all five Batch agents (T2-A through T2-E) report:

- [ ] **Step 1: Orchestrator merges each worktree branch in order.**

```bash
cd /Users/matt/Documents/GitHub/soribashi
for letter in A B C D E; do
  git merge --no-ff "worktree-tier2-$letter" -m "merge: Tier 2 — Batch T2-$letter audit"
done
```

If any merge has conflicts (likely on the coverage manifest), resolve by appending all conflicting rows in order; the manifest is append-only.

- [ ] **Step 2: Merge ledger fragments into the master ledger.**

For each fragment file at `docs/superpowers/audits/2026-04-25-tier-2-<letter>-ledger-fragment.md`:
1. Read the fragment.
2. Append its content under the "Full audit pass — 2026-04-25" section in `docs/superpowers/divergences/mantine-master.md`, organized by file (so all entries for `theme/create-theme.ts` are grouped).
3. Once all fragments are merged, delete the fragment files.

```bash
for letter in A B C D E; do
  rm "docs/superpowers/audits/2026-04-25-tier-2-$letter-ledger-fragment.md"
done
```

- [ ] **Step 3: Cleanup worktrees and branches.**

```bash
for letter in A B C D E; do
  git worktree remove ".claude/worktrees/tier2-$letter" 2>/dev/null
  git branch -D "worktree-tier2-$letter"
done
git worktree prune
```

- [ ] **Step 4: Commit the consolidated ledger.**

```bash
git add docs/superpowers/divergences/mantine-master.md docs/superpowers/audits/
git commit -m "docs: merge Tier 2 ledger fragments into master ledger

Mantine commit: 63dafbbf"
```

- [ ] **Step 5: Final smoke.**

```bash
bunx vitest run
bun run typecheck
bun run --filter @soribashi/playground build
```

All clean.

---

## Phase 3 — Tier 3 (single fast pass)

### Task 3.1: Tier 3 audit

**Files in scope:**
- All 14 blocks (`Box.tsx`, `Stack.tsx`, ..., `Title.tsx`) — `.tsx` files only (CSS already covered by V1)
- All 8 utility helpers under `packages/blocks/src/utils/`
- Grid math helpers: `packages/blocks/src/Grid/{get-column-flex-basis,get-column-flex-grow,get-column-max-width,get-column-offset,Grid.context}.ts`
- `packages/core/src/index.ts`

**Worktree branch:** `worktree-tier3`

**Deliverables:**
- Single rolled-up audit report: `docs/superpowers/audits/2026-04-25-tier-3-blocks-and-utils.md`
- Affirmative coverage statement linking back to V1 (CSS parity) and V4 (browser parity) as evidence.
- Coverage manifest rows for every file.

**Note:** This phase does NOT add new tests. The existing V1 parity script + V4 browser-parity tests + the wrapper-style-merge regression test already provide the evidence. This phase confirms coverage and walks each `.tsx` once to catch any port-fidelity drift not surfaced by the existing tooling.

- [ ] **Step 1: Create worktree.**

```bash
cd /Users/matt/Documents/GitHub/soribashi
git worktree add -b worktree-tier3 .claude/worktrees/tier3 main
cd .claude/worktrees/tier3
```

- [ ] **Step 2: Re-run V1 CSS parity audit.**

```bash
bunx tsx packages/blocks/scripts/css-parity-audit.ts
```

Confirm output matches the prior run (counts in the existing report). If the script has drifted, update.

- [ ] **Step 3: Re-run V4 browser-parity tests.**

```bash
bun run test:browser
```

Expected: 46 passing.

- [ ] **Step 4: Re-run the wrapper-style-merge regression test.**

```bash
bunx vitest run packages/blocks/test/Box/wrapper-style-merge.test.tsx
```

Expected: 8 passing.

- [ ] **Step 5: Walk each block's .tsx file against its Mantine analog.**

For each of the 14 blocks: read soribashi `<Block>.tsx` and Mantine `core/components/<Block>/<Block>.tsx`. Note any line-level drift (prop default, render-time logic, mod construction, attribute forwarding) not previously surfaced.

For each finding: classify per the recipe. If `BUG` / `HALLUCINATION` / `INCONSISTENCY`, fix via TDD using existing test files (`packages/blocks/test/blocks.test.tsx` or per-block test files).

- [ ] **Step 6: Walk each utility helper against its Mantine analog.**

For each of the 8 utils + the 5 Grid math helpers: read soribashi + Mantine. Note any drift. Findings most likely already covered by Batch C (utils) of the post-adaptation pass; this is confirmation.

- [ ] **Step 7: Write the rolled-up audit report.**

Create `docs/superpowers/audits/2026-04-25-tier-3-blocks-and-utils.md`:

```markdown
# Tier 3 Audit — Blocks and Utilities

**Pinned to:** `mantinedev/mantine@63dafbbf5f0135eb36455b7add4c0ddcd0f3240a`

## Coverage statement

This Tier 3 audit relies on prior validation evidence:
- CSS structural parity for all 14 blocks: `docs/superpowers/audits/2026-04-25-css-parity.md` (V1 audit, 28 IDENTICAL / 1 TOKEN_DIFF / 5 DECL_DIFF [allowlisted] / ...)
- Browser computed-style parity for all 14 blocks: `tests/browser-parity/blocks-computed-styles.spec.ts` (V4 audit, 46 passing)
- Block-wrapper style-merge regression: `packages/blocks/test/Box/wrapper-style-merge.test.tsx` (8 passing)
- Utils parity test: `packages/blocks/test/utils.test.ts` (existing)

## Walk-through findings

### Blocks (.tsx files)

| File | Mantine analog | Drift found in this pass | Classification |
|---|---|---|---|
| Box.tsx | core/Box/Box.tsx | (covered by Batch T2-D) | — |
| Stack.tsx | components/Stack/Stack.tsx | none | matches |
| Group.tsx | components/Group/Group.tsx | (note any drift) | matches / drift fixed |
| ... | ... | ... | ... |

### Utilities

| File | Mantine analog | Drift found in this pass | Classification |
|---|---|---|---|
| utils/rem.ts | core/utils/rem/rem.ts | none (covered by post-adaptation Batch C) | matches |
| utils/get-spacing.ts | ... | ... | ... |
| ... | ... | ... | ... |

### Grid math helpers

| File | Mantine analog | Classification |
|---|---|---|
| Grid/get-column-flex-basis.ts | components/Grid/get-column-flex-basis.ts | matches (Batch B port) |
| ... | ... | ... |

## Findings requiring fixes

(none / list with file:line and fix commit SHA)
```

- [ ] **Step 8: Update coverage manifest with all Tier 3 file rows.**

- [ ] **Step 9: Verification.**

```bash
cd /Users/matt/Documents/GitHub/soribashi
bunx vitest run
bun run typecheck
bun run --filter @soribashi/playground build
bun run test:browser
```

All clean.

- [ ] **Step 10: Commit.**

```bash
git add docs/superpowers/audits/2026-04-25-tier-3-blocks-and-utils.md docs/superpowers/audits/2026-04-25-coverage-manifest.md
git commit -m "audit(blocks): Tier 3 affirmative coverage of blocks and utils

Mantine commit: 63dafbbf"
```

- [ ] **Step 11: Orchestrator integrates worktree.**

```bash
cd /Users/matt/Documents/GitHub/soribashi
git merge --no-ff worktree-tier3 -m "merge: Tier 3 — blocks and utils audit"
git worktree remove .claude/worktrees/tier3
git branch -D worktree-tier3
```

---

## Phase 4 — Consolidation (orchestrator only)

The orchestrator (the engineer reading this plan, not a sub-agent) executes Phase 4 directly on `main`.

### Task 4.1: Coverage manifest finalization

- [ ] **Step 1: Verify the manifest covers every in-scope file.**

```bash
# List every TS/TSX file under packages/*/src/ excluding tests, barrels, and audit infrastructure
find packages/*/src -type f \( -name "*.ts" -o -name "*.tsx" \) \
  | grep -v "/test/" \
  | grep -v "/index.ts$" \
  | grep -v "/scripts/" \
  | sort > /tmp/in-scope-files.txt

# Extract the file column from the manifest
grep "| packages/" docs/superpowers/audits/2026-04-25-coverage-manifest.md \
  | awk -F'|' '{print $2}' | sed 's/^ //;s/ $//' | sort > /tmp/manifest-files.txt

# Diff
diff /tmp/in-scope-files.txt /tmp/manifest-files.txt
```

Expected: identical. If a file is in the source list but not the manifest, that's a coverage gap. Investigate (was it audited under another name, or genuinely missed?). If a file is in the manifest but not the source list, that's a stale manifest entry.

- [ ] **Step 2: For each gap found in Step 1: add a manifest row** (with reference to the audit doc and ledger entry, if any) or remove the stale entry. The expectation is zero gaps.

- [ ] **Step 3: Commit (if any rows changed).**

```bash
git add docs/superpowers/audits/2026-04-25-coverage-manifest.md
git commit -m "audit: finalize coverage manifest for full audit pass"
```

---

### Task 4.2: Roadmap doc

- [ ] **Step 1: Sweep audit reports for (e) findings.**

```bash
grep -r "(e)\|missing port\|MISSING_PORT\|roadmap" docs/superpowers/audits/2026-04-25-tier-* | head
```

For each (e) finding referenced in any tier audit, ensure it has a row in `docs/superpowers/roadmap/mantine-derivable-future-work.md`.

- [ ] **Step 2: For each row, fill in:**
  - Mantine source path
  - Brief description (what the helper / utility does)
  - Why it might be useful for soribashi consumers
  - Estimated implementation effort: S (a function), M (a small module), L (a subsystem)
  - Surfaced in audit: which audit doc surfaced it

- [ ] **Step 3: Commit.**

```bash
git add docs/superpowers/roadmap/mantine-derivable-future-work.md
git commit -m "docs: populate Mantine-derivable roadmap from audit findings"
```

---

### Task 4.3: Master ledger consolidation

This was largely done at the end of Phase 2 (Task 2.6). This task is a final pass to ensure organization.

- [ ] **Step 1: Verify the master ledger has one section per phase.**

Open `docs/superpowers/divergences/mantine-master.md`. Confirm there is a single top-level section "Full audit pass — 2026-04-25" with sub-sections organized by file or by package. Each ledger entry must reference:
- File path
- Mantine source path + commit SHA `63dafbbf`
- Mantine behavior
- Soribashi behavior
- Reason
- Disposition (Keep / Aligned / Hybrid)
- Test reference (parity test file path or "covered by audit doc X")

- [ ] **Step 2: If duplicate entries from earlier passes exist (e.g., the ledger had `factory()` from an earlier pass and now has it again from Task 1.1), consolidate** by keeping the more recent / more thorough entry and noting the supersession in a footnote.

- [ ] **Step 3: Commit (if any reorganization happened).**

```bash
git add docs/superpowers/divergences/mantine-master.md
git commit -m "docs: consolidate master ledger after full audit pass"
```

---

### Task 4.4: STATUS + Hard Rule 13 update

- [ ] **Step 1: Update `STATUS.md` with the new test counts.**

After Phase 3 the test surface includes the Tier 1 parity tests + any new tests added during Phase 2 fixes. Update the test count in the STATUS header.

- [ ] **Step 2: Add a section to STATUS.md describing the full audit pass.**

```markdown
## Full audit pass — 2026-04-25

Hard Rule 13 enforcement complete across every soribashi file derivable from Mantine. Validation pinned to `mantinedev/mantine@63dafbbf`. Coverage manifest at `docs/superpowers/audits/2026-04-25-coverage-manifest.md`. New ledger entries under "Full audit pass — 2026-04-25" in `docs/superpowers/divergences/mantine-master.md`. Roadmap of (e) "missing port" candidates at `docs/superpowers/roadmap/mantine-derivable-future-work.md`.

Phases: 1 (Tier 1 — load-bearing factory primitives, X parity tests committed) → 2 (Tier 2 — theme + provider + factory-additions + Box style-props + codegen, 5 batches in parallel) → 3 (Tier 3 — blocks + utils, affirmative coverage via existing V1/V4 audits) → 4 (consolidation, manifest, roadmap, ledger).
```

(Replace `X` with the actual count after running the test suite.)

- [ ] **Step 3: Update Hard Rule 13 in `docs/superpowers/specs/2026-04-25-soribashi-design.md` § 13.**

Append to the existing Hard Rule 13 paragraph:

```markdown
**Validated:** Full audit pass completed 2026-04-25 against Mantine commit `63dafbbf5f0135eb36455b7add4c0ddcd0f3240a`. Coverage manifest at `docs/superpowers/audits/2026-04-25-coverage-manifest.md`.
```

- [ ] **Step 4: Commit.**

```bash
git add STATUS.md docs/superpowers/specs/2026-04-25-soribashi-design.md
git commit -m "docs: update STATUS and Hard Rule 13 for full audit pass completion"
```

---

### Task 4.5: Final smoke

- [ ] **Step 1: Run all test surfaces.**

```bash
cd /Users/matt/Documents/GitHub/soribashi
bunx vitest run
```

Expected: all green; test count increased from pre-audit baseline.

- [ ] **Step 2: Typecheck.**

```bash
bun run typecheck
```

Expected: clean.

- [ ] **Step 3: Codegen + playground build.**

```bash
bun run codegen
bun run --filter @soribashi/playground build
```

Expected: no warnings, no missing-token errors.

- [ ] **Step 4: Browser-parity tests.**

```bash
bun run test:browser
```

Expected: 46+ passing.

- [ ] **Step 5: CSS parity script.**

```bash
bunx tsx packages/blocks/scripts/css-parity-audit.ts
```

Expected: matches prior known-good output (allowlist intact).

- [ ] **Step 6: `--mantine-` lint check.**

```bash
grep -r "\-\-mantine\-" packages/blocks/src/ packages/factory/src/ packages/theme/src/ packages/codegen/src/ apps/playground/src/ 2>&1 \
  | grep -v ".test." \
  | grep -v "Adapted from" \
  | grep -v "Source:" \
  | grep -v "Token names" \
  | grep -v "substitution" \
  | head
```

Expected: empty (no live `--mantine-*` CSS-var references; only attribution-comment mentions).

- [ ] **Step 7: Final commit.**

```bash
git commit --allow-empty -m "audit: Mantine full-audit pass complete — Hard Rule 13 fully enforced as of 63dafbbf"
```

---

### Task 4.6: Worktree and branch cleanup

- [ ] **Step 1: Confirm no audit worktrees remain.**

```bash
git worktree list
```

Expected: only `main`.

- [ ] **Step 2: Confirm no audit branches remain.**

```bash
git branch | grep -E "worktree-tier" || echo "clean"
```

Expected: `clean`.

- [ ] **Step 3: Remove any leftover audit fragments.**

```bash
find docs/superpowers/audits -name "*-ledger-fragment.md" -delete
```

- [ ] **Step 4: Final tree status.**

```bash
git status --short
```

Expected: clean (or only contains user's pre-existing WIP, untouched).

---

## Acceptance criteria

The audit is complete when ALL hold:

1. ✅ Coverage manifest at `docs/superpowers/audits/2026-04-25-coverage-manifest.md` lists every TS/TSX file under `packages/*/src/` (excluding test, barrel, scripts) with a populated status column.
2. ✅ Every Tier 1 file has a parity test file at `packages/factory/test/<file>-parity.test.tsx`; tests pass.
3. ✅ Every Tier 2 batch has an audit report at `docs/superpowers/audits/2026-04-25-tier-2-<batch>.md`; ledger fragments merged into master ledger; fragment files deleted.
4. ✅ Tier 3 rolled-up report at `docs/superpowers/audits/2026-04-25-tier-3-blocks-and-utils.md` references V1/V4 evidence and walks each block + util.
5. ✅ Master ledger at `docs/superpowers/divergences/mantine-master.md` has a "Full audit pass — 2026-04-25" section with one entry per divergence (kept or aligned).
6. ✅ Roadmap doc at `docs/superpowers/roadmap/mantine-derivable-future-work.md` has at least one row per (e) finding surfaced.
7. ✅ Every reimplemented `@mantine/hooks` utility has been replaced inline; no `@deprecated` aliases.
8. ✅ `bunx vitest run` clean.
9. ✅ `bun run typecheck` clean.
10. ✅ `bun run --filter @soribashi/playground build` clean.
11. ✅ `bun run test:browser` clean (46+ tests).
12. ✅ `--mantine-` lint check returns no live CSS-var references in compiled source.
13. ✅ `STATUS.md` updated with the full-audit-pass summary and new test count.
14. ✅ Hard Rule 13 in `soribashi-design.md` § 13 updated with the validation date.
15. ✅ No leftover audit worktrees, branches, or fragment files.
16. ✅ Atomic git history: `git log --oneline` shows one commit per Tier 1 file, one per Tier 2 batch merge, one for Tier 3, plus Phase 4 consolidation commits.
