# Mantine Validation Pass — Design Spec

**Status:** Draft
**Date:** 2026-04-25
**Audience:** Implementation engineers; satisfies Hard Rule 13 of the Soribashi spec.
**Scope:** Full pass — every soribashi primitive validated against actual Mantine source on master.

---

## 1. Why This Exists

The original Soribashi v1 implementation was largely complete after Plans 1–5, but only some pieces were validated against the actual Mantine source code as Hard Rule 13 requires. Specifically validated:

- `factory.tsx` — read full source
- `defaultVariantColorsResolver` — read full source
- `Button.tsx` — read full source for shape reference

Implemented from documentation only:

- `useProps`
- `useStyles`
- `MantineProvider` / context / theme normalization
- Polymorphic factory + types
- Generic factory + types
- Layout block patterns (Box, Stack, Group, Paper, Text, Title, etc.)

This is a Hard Rule 13 violation: "All implementation MUST validate against Mantine's actual published source code, not high-level documentation, not this spec's summaries, not inferred behavior." The validation pass corrects that.

---

## 2. Scope

### In scope

Every soribashi primitive that has a Mantine analog:

| Soribashi file | Mantine source to validate against |
|---|---|
| `packages/factory/src/factory.tsx` | `packages/@mantine/core/src/core/factory/factory.tsx` |
| `packages/factory/src/with-props.tsx` | inline `withProps` in factory.tsx |
| `packages/factory/src/hooks/use-props.ts` | `packages/@mantine/core/src/core/Box/use-props/use-props.ts` |
| `packages/factory/src/hooks/use-styles.ts` | `packages/@mantine/core/src/core/styles-api/use-styles/use-styles.ts` |
| `packages/factory/src/provider/context.ts` | `packages/@mantine/core/src/core/MantineProvider/Mantine.context.ts` |
| `packages/factory/src/provider/provider.tsx` | `packages/@mantine/core/src/core/MantineProvider/MantineProvider.tsx` |
| `packages/factory/src/define-polymorphic-component.tsx` | `polymorphic-factory.tsx` + `create-polymorphic-component.ts` |
| `packages/factory/src/define-generic-component.tsx` | `genericFactory` in factory.tsx |
| `packages/factory/src/types/polymorphic.ts` | Mantine's polymorphic prop types |
| `packages/factory/src/auto-vars.ts` | (no Mantine analog — soribashi addition; no validation needed) |
| `packages/factory/src/define-component.tsx` | (no direct Mantine analog — daily-use sugar; validate the pieces it composes) |
| `packages/theme/src/create-theme.ts` | `packages/@mantine/core/src/core/MantineProvider/create-theme/create-theme.ts` |
| `packages/blocks/src/Box/*` | `packages/@mantine/core/src/components/Box/*` |
| `packages/blocks/src/Stack/*` | `packages/@mantine/core/src/components/Stack/*` |
| `packages/blocks/src/Group/*` | `packages/@mantine/core/src/components/Group/*` |
| `packages/blocks/src/Flex/*` | `packages/@mantine/core/src/components/Flex/*` |
| `packages/blocks/src/Grid/*` | `packages/@mantine/core/src/components/Grid/*` |
| `packages/blocks/src/SimpleGrid/*` | `packages/@mantine/core/src/components/SimpleGrid/*` |
| `packages/blocks/src/Container/*` | `packages/@mantine/core/src/components/Container/*` |
| `packages/blocks/src/Center/*` | `packages/@mantine/core/src/components/Center/*` |
| `packages/blocks/src/AspectRatio/*` | `packages/@mantine/core/src/components/AspectRatio/*` |
| `packages/blocks/src/Space/*` | `packages/@mantine/core/src/components/Space/*` |
| `packages/blocks/src/Paper/*` | `packages/@mantine/core/src/components/Paper/*` |
| `packages/blocks/src/Text/*` | `packages/@mantine/core/src/components/Text/*` |
| `packages/blocks/src/Title/*` | `packages/@mantine/core/src/components/Title/*` |

### Out of scope

- `@soribashi/codegen` — no Mantine analog (Mantine doesn't ship codegen).
- `@soribashi/theme` `defaultIntentResolver` — already validated against Mantine's `defaultVariantColorsResolver`.
- `@soribashi/factory` `auto-vars.ts` — soribashi-only convenience layer; no Mantine analog.
- `defineComponent` itself — daily-use sugar that composes already-validated primitives; validation flows through them.
- All test files — they test our behavior, not Mantine's; they don't need source-level alignment.

---

## 3. Mantine Version

Master branch (`https://github.com/mantinedev/mantine/tree/master`) at the time the validation runs. We tag the validation date in each divergence note so future audits can re-validate against newer versions.

---

## 4. Validation Process Per File

For each file in scope:

### Step 1: Fetch Mantine source

Use `curl` against `https://raw.githubusercontent.com/mantinedev/mantine/master/<path>` to get the actual file contents. Cache in a local validation workspace (NOT committed) to avoid repeated fetches.

### Step 2: Read and analyze

Compare line-by-line against the soribashi implementation. Identify:

- **Behavioral divergences** — different observable behavior (different prop merge order, different return shape, different default values, etc.)
- **Implementation divergences** — same observable behavior, different internal approach (forwardRef wrapping, helper extraction, etc.)
- **API divergences** — different exported names, different type shapes
- **Bug-inducing divergences** — places where my implementation has a bug that Mantine doesn't (or vice versa)

### Step 3: Decide for each divergence

Three options:

**a) Align to Mantine** — change soribashi to match. Use when:
   - Mantine's behavior is correct and ours is buggy
   - Mantine's behavior is more standard/expected
   - The divergence has no clear soribashi rationale
   - Tests for the new behavior pass

**b) Keep ours, document the divergence** — leave soribashi as-is, add to divergence ledger. Use when:
   - Soribashi's behavior is intentional (e.g., own-props-win polymorphic types)
   - Soribashi's behavior addresses a real Mantine pain (e.g., not requiring CSS modules)
   - Aligning would break soribashi's design contract
   - The behavior is documented in this spec or the original design spec

**c) Hybrid: change behavior, document the change** — use when:
   - Mantine has a subtle bug that we want to fix in soribashi (e.g., undefined override in withProps)
   - The change is small but observable; we want both the fix and a record of why we don't match Mantine

### Step 4: Update code (if applicable)

Make the alignment change. Add or update tests to lock in the new behavior. Run all tests; ensure no regressions.

### Step 5: Add to divergence ledger

Every divergence (kept OR fixed) gets an entry in `docs/superpowers/divergences/mantine-v8.md` (Mantine is approaching v8 on master). Format:

```markdown
### `factory()` — `forwardRef` wrap

- **File:** `packages/factory/src/factory.tsx`
- **Mantine source:** `packages/@mantine/core/src/core/factory/factory.tsx` (master, 2026-04-25)
- **Mantine behavior:** Casts `ui` to `any` and returns it directly; the function signature implicitly takes `props` only (no separate ref arg).
- **Soribashi behavior:** Wraps the render function in `React.forwardRef`; render function signature is `(props, ref) => ReactNode`.
- **Reason for divergence:** Soribashi's render API exposes `ref` as a parameter for ergonomic forwarding. Mantine relies on the consumer using ref-aware patterns inside their render. Both are valid; soribashi's is slightly more explicit.
- **Decision:** Keep soribashi's wrap.
```

---

## 5. Output Artifacts

### 5.1 Updated source files

Where alignment is decided, the corresponding `packages/*/src/*.ts(x)` files are updated. Tests covering the changed behavior are added or updated. All 152 existing tests continue to pass; new tests bring the total higher.

### 5.2 Divergence ledger

A new committed document at:

```
docs/superpowers/divergences/mantine-v8.md
```

Contains:

- **Header**: validation date, Mantine commit SHA validated against, list of files validated.
- **One section per divergence**: file, Mantine source link, Mantine behavior, Soribashi behavior, reason, decision (kept/aligned/hybrid).
- **Coverage statement**: "All files in scope (see § 2 of validation spec) were source-validated on YYYY-MM-DD."

### 5.3 Updated STATUS.md

Update the existing `STATUS.md` at the repo root to reflect:

- Mantine validation pass complete
- Pointer to the divergence ledger

### 5.4 Updated soribashi design spec

Add a section to `docs/superpowers/specs/2026-04-25-soribashi-design.md` confirming Hard Rule 13 has been satisfied, with a pointer to the divergence ledger.

---

## 6. Test Strategy

### 6.1 Behavior preservation

Every existing test must continue to pass after the validation pass. If alignment to Mantine breaks an existing test, that's a forced decision point: either the test is wrong (update it) or the alignment is wrong (revert and document instead).

### 6.2 New test coverage for validated behavior

For each file where I align to Mantine, add tests that lock in the Mantine-matched behavior. Example: if I change `useProps` to handle some edge case the way Mantine does, add a test that exercises that edge case.

### 6.3 Divergence tests

For each documented divergence (kept-as-is), add a test that explicitly asserts soribashi's (different) behavior. This prevents future "fixes" from accidentally aligning to Mantine and breaking the deliberate divergence.

### 6.4 Mantine parity smoke

For 2–3 critical primitives (`useProps`, `useStyles`, `withProps`), add a parity smoke test: a fixture component that should behave identically across both Mantine and soribashi. Validate the soribashi implementation produces identical observable behavior to what Mantine would.

(This last item is optional — it's expensive to set up. Skip if time is constrained.)

---

## 7. Process Constraints

- **No new dependencies** introduced by this pass. We don't add `@mantine/core` as a dependency just for validation. Source comparison is offline / via curl.
- **No regressions** in any existing test.
- **Atomic commits** per file validated, with the divergence ledger entries committed alongside the code changes they describe.
- **Each commit message** references the Mantine source path + commit SHA used for validation, e.g., `validate(factory): align withProps semantics against mantine factory.tsx@abc123`.

---

## 8. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Mantine source has changed since the start of soribashi (Mantine moves fast) | Capture the commit SHA when validating each file; future audits know the baseline |
| Aligning to Mantine breaks the soribashi design (e.g., re-introducing CSS-module hard-coupling) | Each alignment decision must explicitly check: does this preserve soribashi's design principles? If not, document as divergence instead |
| Validation reveals fundamental architectural mistakes | Plan addresses individual files atomically — fundamental issues become a separate decision (revert? rebuild? defer to v2?) and don't block other files' validation |
| Layout blocks are too numerous (13 files) and divergence is mostly cosmetic | Bucket layout blocks: validate the polymorphic-block pattern once via Box, then validate Stack as the canonical defineComponent block, then spot-check the rest. Don't write 13 essentially-identical divergence entries. |

---

## 9. Success Criteria

The validation pass is complete when:

1. Every file in § 2 has been opened in Mantine source and read in full.
2. Every divergence (intentional and accidental) is recorded in the ledger.
3. Every alignment decision has corresponding test coverage.
4. All existing tests pass; new tests pass.
5. The divergence ledger is committed.
6. STATUS.md updated.
7. Soribashi design spec § 13 (Hard Rules) gets an addendum confirming validation date.

---

## 10. Out-of-Scope Future Work

- Re-running validation on Mantine v8 stable (when released)
- Adding a CI check that validates against a pinned Mantine commit
- Mantine compatibility test suite (running Mantine's own test cases against soribashi)

These are documented for future consideration but not part of this pass.

---

## 11. Hard Rules

1. **No alignment without source review.** Every change must be traceable to a specific Mantine file at a specific commit.
2. **No silent divergence.** Every divergence (kept) must be in the ledger with a written reason.
3. **No regressions.** All 152 existing tests must continue passing throughout the pass.
4. **Atomic commits.** Each file gets its own validation commit (or small group of related files for the layout blocks).
5. **Document, don't argue.** The ledger records what is, not what should be. If a divergence is wrong, fix the code; the ledger captures the resulting state.
