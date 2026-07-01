# Pilot Vocabulary-Rails Wiring (PR #11) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the three pilot recipes (Button, Tooltip, Tabs) to the vocabulary rails shipped in PR #10 — local builders, runtime Zod validation, and per-recipe variant vocabularies — without changing any rendered output.

**Architecture:** PR #11 touches only `apps/pilot` (plus one spec addendum). The factory already ships `createSoribashiBuilders`, `vocabularyAxes`, and `validateVocabularyProps`. We add `src/builders.ts` (registers the theme's vocab and re-exports the builders), declare a `size` axis + per-recipe `variant` vocabularies in the theme, switch each recipe to import from `../../builders`, opt each into `vocabularyAxes`, and prove runtime validation fires with one test per recipe.

**Tech Stack:** TypeScript, React 18, Vitest + Testing Library, Bun, Zod (dev-only validation), Radix UI.

---

## Two settled decisions (locked before planning)

1. **Variant is per-recipe (option B).** The global theme vocabulary holds only `size` + `intent`. Every recipe — Button included — declares its own `variant` vocabulary. Rationale: the "variant stays local" brainstorm decision (vocab-rails spec §3 non-goals). `variant` describes per-component visual treatment; there is no shared variant canon.

2. **Type-threading is deferred to PR #12.** Injected `size`/`intent` props stay `string`-typed in PR #11. Restoring compile-time narrowing requires making `createTheme`/`ResolvedTheme` generic (the literal vocab types are erased at `createTheme`'s return — `ResolvedTheme.vocabulary` is the fixed `ThemeVocabulary = { size: Vocabulary<string>; ... }`). That is a `@soribashi/theme` core-type change across 93 references / 5 packages; spec §14.2 says prototype it first. Out of scope here. Runtime Zod still enforces values in PR #11.

## Critical implementation constraint — the import cycle

`.extend()` **cannot** be used inside the pilot's own theme. The dependency edges are:

```
recipe (Button.tsx)  --imports-->  builders.ts  --imports-->  theme/index.ts
```

If `theme/index.ts` imported a recipe to call `Recipe.extend(...)`, the cycle `theme → recipe → builders → theme` would be **fatal**: `builders.ts` calls `createSoribashiBuilders(theme)` at module-eval time, but `theme` is still mid-initialization when the recipe (pulled in by the theme) triggers `builders.ts`. The recipe would see `definePolymorphicComponent === undefined`, or `createSoribashiBuilders(undefined)` would throw.

**Resolution:** declare per-component variant overrides using the supported **Record form** of `ThemeDefinition['components']`:

```ts
components: {
  Button:  { vocabulary: { variant: defineVocabulary([...]) } },
  Tooltip: { vocabulary: { variant: defineVocabulary([...]) } },
  Tabs:    { vocabulary: { variant: defineVocabulary([...]) } },
}
```

`theme/index.ts` imports only `defineVocabulary` (no recipes), so there is no cycle. `normalizeComponents` passes the Record through unchanged (`packages/theme/src/normalize-components.ts:136`), and `createSoribashiBuilders` registers each component's vocab from `theme.components` (`packages/factory/src/create-builders.ts:48-57`) — runtime validation works identically to the array/`.extend()` form.

This is a deviation from spec §12 steps 8-9 (which prescribe `.extend()`) and is recorded as a finding in the §17 addendum task.

## File structure

| File | Change | Responsibility |
|------|--------|----------------|
| `apps/pilot/src/builders.ts` | **Create** | Calls `createSoribashiBuilders(theme)`; re-exports the four builders. Importing it (transitively, via any recipe) populates the vocab registry. |
| `apps/pilot/src/theme/index.ts` | Modify | Add `size` axis; remove the global `variant` declaration; add `components` Record with per-recipe variant vocabularies. |
| `apps/pilot/src/recipes/Button/Button.tsx` | Modify | Import builder from `../../builders`; drop local `Intent`/`Variant`/`Size`; drop `intent`/`variant`/`size` from `ButtonOwnProps`; add `vocabularyAxes`; widen render ctx annotation. |
| `apps/pilot/src/recipes/Tooltip/Tooltip.tsx` | Modify | Import builder from `../../builders`; hoist `variants` const; derive local `Variant` from it; add `vocabularyAxes: ['variant']`. |
| `apps/pilot/src/recipes/Tabs/Tabs.tsx` | Modify | Same shape as Tooltip. |
| `apps/pilot/src/recipes/Button/Button.test.tsx` | Modify | Add one vocabulary-validation test. |
| `apps/pilot/src/recipes/Tooltip/Tooltip.test.tsx` | Modify | Add one vocabulary-validation test (+ import `vi`). |
| `apps/pilot/src/recipes/Tabs/Tabs.test.tsx` | Modify | Add one vocabulary-validation test (+ import `vi` if missing). |
| `docs/superpowers/specs/2026-05-12-vocabulary-rails-design.md` | Modify | Append §17 recording PR #11's settled decisions + the cycle finding. |

**Builder vs. type imports:** `builders.ts` re-exports only the four builder *functions*. Recipes import the builder function from `../../builders` and the render-context *types* (`PolymorphicRenderCtx`, `PartRenderCtx`, `PolymorphicPartRenderCtx`) from `@soribashi/core`. Type-only imports are erased and create no runtime cycle.

---

## Baseline (run once before Task 1)

- [ ] **Confirm green baseline**

Run:
```bash
bun install
bun run typecheck
bun run --filter '@soribashi/*' test
cd apps/pilot && bunx vitest run --reporter=basic
```
Expected: typecheck clean; theme 82, codegen 137, factory 472, blocks 244; pilot 47. (The Tabs test prints a `<TabsList> must be inside <Tabs>` stack trace — that is an asserted error path, not a failure.)

---

## Task 1: Builders + theme foundation

**Files:**
- Create: `apps/pilot/src/builders.ts`
- Modify: `apps/pilot/src/theme/index.ts`

No new test in this task — it is enabling infrastructure that is unused until a recipe imports it. The gate is typecheck + the full unchanged suite.

- [ ] **Step 1: Create `builders.ts`**

```ts
// apps/pilot/src/builders.ts
/**
 * Local builder entry point for the pilot.
 *
 * `createSoribashiBuilders(theme)` registers the theme's global vocabulary and
 * every per-component override (theme.components) with the runtime registry,
 * then returns the four builders. Recipes import from here instead of
 * '@soribashi/core' so that (a) the registry is populated before any recipe
 * renders, and (b) PR #12 can swap these for theme-typed builders without
 * touching recipe import sites.
 */
import { createSoribashiBuilders } from '@soribashi/core';
import { theme } from './theme/index.ts';

export const {
  defineComponent,
  definePolymorphicComponent,
  defineCompound,
  defineGenericComponent,
} = createSoribashiBuilders(theme);
```

- [ ] **Step 2: Edit the theme `vocabulary` block**

In `apps/pilot/src/theme/index.ts`, replace the current `vocabulary` block (around lines 329-332):

```ts
  vocabulary: {
    intent: defineVocabulary(['primary', 'neutral', 'success', 'warning', 'danger', 'info']),
    variant: defineVocabulary(['filled', 'outline', 'subtle', 'ghost', 'link']),
  },
```

with (add `size`; remove the global `variant` — option B, variant is per-recipe):

```ts
  // Option B: variant is per-recipe, declared in `components` below — NOT here.
  // The global vocabulary holds only the genuinely-shared axes.
  vocabulary: {
    size: defineVocabulary(['xs', 'sm', 'md', 'lg', 'xl']),
    intent: defineVocabulary(['primary', 'neutral', 'success', 'warning', 'danger', 'info']),
  },
```

- [ ] **Step 3: Add the `components` Record**

In the same `createTheme({...})` call, add a `components` field (place it right after the `semanticTokens` block, before the closing `})`). Per-recipe variant vocabularies, Record form (cycle-free):

```ts
  // Per-recipe variant vocabularies (option B). Record form — NOT Recipe.extend() —
  // because the theme cannot import the recipes without creating a fatal module
  // cycle (theme -> recipe -> builders -> theme). normalizeComponents passes this
  // through unchanged and createSoribashiBuilders registers each for Zod validation.
  components: {
    Button: { vocabulary: { variant: defineVocabulary(['filled', 'outline', 'subtle', 'ghost', 'link']) } },
    Tooltip: { vocabulary: { variant: defineVocabulary(['default', 'subtle']) } },
    Tabs: { vocabulary: { variant: defineVocabulary(['default', 'outline', 'pills']) } },
  },
```

- [ ] **Step 4: Verify nothing regressed**

The recipes still import from `@soribashi/core` at this point, so `builders.ts` is not yet imported and the registry stays empty — all existing behavior is unchanged.

Run:
```bash
bun run typecheck
cd apps/pilot && bunx vitest run --reporter=basic
```
Expected: typecheck clean; pilot still 47 passed.

- [ ] **Step 5: Sanity-check there are no other `vocabulary.variant` consumers**

Run:
```bash
grep -rn "vocabulary\.variant" apps/pilot/src packages --include="*.ts" --include="*.tsx" | grep -v "create-builders\|node_modules"
```
Expected: no pilot/app code reads `theme.vocabulary.variant.values` for rendering (codegen does not emit from vocabulary — spec §11). If a hit appears in app code, stop and reassess; the global `variant` now resolves to the soribashi default rather than Button's explicit set.

- [ ] **Step 6: Commit**

```bash
git add apps/pilot/src/builders.ts apps/pilot/src/theme/index.ts
git commit -m "$(cat <<'EOF'
feat(pilot): add builders.ts + theme size axis and per-recipe variant vocab

Record form (not .extend()) for per-component variant overrides avoids the
theme -> recipe -> builders -> theme module cycle. variant is per-recipe (option B).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Migrate Button + validation test

**Files:**
- Test: `apps/pilot/src/recipes/Button/Button.test.tsx`
- Modify: `apps/pilot/src/recipes/Button/Button.tsx`

- [ ] **Step 1: Write the failing validation test**

Append to `apps/pilot/src/recipes/Button/Button.test.tsx` (the file already imports `vi`, `wrap`, `Button`):

```ts
describe('Button — vocabulary validation (dev)', () => {
  it('warns when size is outside the declared vocabulary', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // `size` is string-typed (threading deferred to PR #12); runtime Zod catches it.
    wrap(<Button size="enormous">x</Button>);
    expect(
      errSpy.mock.calls.some((c) => String(c[0]).includes('not in the declared vocabulary')),
    ).toBe(true);
    errSpy.mockRestore();
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `cd apps/pilot && bunx vitest run src/recipes/Button/Button.test.tsx`
Expected: the new test FAILS (Button still imports `@soribashi/core` and has no `vocabularyAxes`, so no validation runs and `console.error` is never called).

- [ ] **Step 3: Migrate `Button.tsx`**

Edit the import (line 12) from:
```ts
import { definePolymorphicComponent, type PolymorphicRenderCtx } from '@soribashi/core';
```
to (builder from local module; type from core):
```ts
import { definePolymorphicComponent } from '../../builders.ts';
import type { PolymorphicRenderCtx } from '@soribashi/core';
```

Delete the three local type aliases (lines 15-17):
```ts
type Intent = 'primary' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';
type Variant = 'filled' | 'outline' | 'subtle' | 'ghost' | 'link';
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
```

Change `ButtonOwnProps` (lines 19-28) to drop the three vocab props (the builder injects them):
```ts
export interface ButtonOwnProps {
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
}
```

Add `vocabularyAxes` to the config (immediately after `defaultElement: 'button',`):
```ts
  vocabularyAxes: ['size', 'intent', 'variant'] as const,
```

Widen the render-context annotation (lines 45-50). The `props` destructure body is unchanged; only the type annotation gains the variants tuple + vocab axes so `props.size`/`props.intent`/`props.variant` remain typed:
```ts
  render: ({
    Element,
    props,
    getStyles,
    ref,
  }: PolymorphicRenderCtx<
    ButtonOwnProps,
    'button',
    readonly ['root', 'inner', 'label', 'icon', 'spinner'],
    readonly ['filled', 'outline', 'subtle', 'ghost', 'link'],
    readonly ['size', 'intent', 'variant']
  >) => {
```

Leave everything else (the `variants` config field, `selectors`, `classes`, `defaults`, the entire render body) unchanged. `variant` stays narrowed to the union via the `variants` field; `size`/`intent` are now `string` (runtime-validated).

- [ ] **Step 4: Run the validation test — now passes**

Run: `cd apps/pilot && bunx vitest run src/recipes/Button/Button.test.tsx`
Expected: PASS. Button now imports `builders.ts` (registry populated) and opts into `vocabularyAxes`, so `size="enormous"` (not in the global size vocab `xs..xl`) triggers `console.error`. All pre-existing Button tests still pass.

- [ ] **Step 5: Typecheck**

Run: `bun run typecheck`
Expected: clean. (If `props.size`/`props.intent` report errors, the render annotation's 5th type param is missing or misordered — re-check Step 3.)

- [ ] **Step 6: Commit**

```bash
git add apps/pilot/src/recipes/Button/Button.tsx apps/pilot/src/recipes/Button/Button.test.tsx
git commit -m "$(cat <<'EOF'
refactor(button): consume local builders + vocabularyAxes; drop local Intent/Variant/Size

size/intent are now theme-declared (string-typed until PR #12); variant stays
narrowed via the recipe's variants field. Runtime Zod validation covered by test.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Migrate Tooltip + validation test

**Files:**
- Test: `apps/pilot/src/recipes/Tooltip/Tooltip.test.tsx`
- Modify: `apps/pilot/src/recipes/Tooltip/Tooltip.tsx`

- [ ] **Step 1: Write the failing validation test**

In `apps/pilot/src/recipes/Tooltip/Tooltip.test.tsx`, add `vi` to the vitest import (currently `import { describe, expect, it } from 'vitest';`):
```ts
import { describe, expect, it, vi } from 'vitest';
```
Then append:
```ts
describe('Tooltip — vocabulary validation (dev)', () => {
  it('warns when variant is outside the declared vocabulary', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <SoribashiProvider theme={theme}>
        <Tooltip.Provider>
          <Tooltip variant={'flashy' as never}>
            <Tooltip.Trigger>x</Tooltip.Trigger>
            <Tooltip.Content>tip</Tooltip.Content>
          </Tooltip>
        </Tooltip.Provider>
      </SoribashiProvider>,
    );
    expect(
      errSpy.mock.calls.some((c) => String(c[0]).includes('not in the declared vocabulary')),
    ).toBe(true);
    errSpy.mockRestore();
  });
});
```
(`render`, `SoribashiProvider`, `theme`, `Tooltip` are already imported at the top of the file.)

- [ ] **Step 2: Run it and watch it fail**

Run: `cd apps/pilot && bunx vitest run src/recipes/Tooltip/Tooltip.test.tsx`
Expected: the new test FAILS (Tooltip still imports `@soribashi/core`, has no `vocabularyAxes`, registry empty → no warning).

- [ ] **Step 3: Migrate `Tooltip.tsx`**

Edit the import (line 18) from:
```ts
import { defineCompound, type PartRenderCtx } from '@soribashi/core';
```
to:
```ts
import { defineCompound } from '../../builders.ts';
import type { PartRenderCtx } from '@soribashi/core';
```

Replace the local variant type (line 21) — hoist a single-source `variants` const and derive the type from it:
```ts
const variants = ['default', 'subtle'] as const;
type Variant = (typeof variants)[number];
```

In the `defineCompound({...})` config, replace the inline variants array (line 58) `variants: ['default', 'subtle'] as const,` with a reference to the hoisted const and add `vocabularyAxes`:
```ts
  vocabularyAxes: ['variant'] as const,
  variants,
```

Leave `TooltipRootProps.variant?: Variant` (now derived from the const), `defaults`, `vars`, `context`, and all `parts` unchanged. The data-attribute / CSS styling is untouched — variant values are identical.

- [ ] **Step 4: Run the validation test — now passes**

Run: `cd apps/pilot && bunx vitest run src/recipes/Tooltip/Tooltip.test.tsx`
Expected: PASS. Tooltip's registered variant vocab is `default|subtle`; `variant="flashy"` triggers the warning. Pre-existing Tooltip tests still pass.

- [ ] **Step 5: Typecheck**

Run: `bun run typecheck`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add apps/pilot/src/recipes/Tooltip/Tooltip.tsx apps/pilot/src/recipes/Tooltip/Tooltip.test.tsx
git commit -m "$(cat <<'EOF'
refactor(tooltip): consume local builders + vocabularyAxes variant

variant vocab (default|subtle) declared per-recipe in the theme; recipe derives
its variant type from a single hoisted const. Runtime validation covered by test.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Migrate Tabs + validation test

**Files:**
- Test: `apps/pilot/src/recipes/Tabs/Tabs.test.tsx`
- Modify: `apps/pilot/src/recipes/Tabs/Tabs.tsx`

- [ ] **Step 1: Write the failing validation test**

First confirm the test file's imports include `vi`, `render`, `SoribashiProvider`, and `theme`:
```bash
sed -n '1,20p' apps/pilot/src/recipes/Tabs/Tabs.test.tsx
```
Add any missing symbol to the existing imports (add `vi` to the `vitest` import; ensure `render` from `@testing-library/react`, `SoribashiProvider` from `@soribashi/core`, and `theme` from `../../theme/index.ts` are imported). Then append:
```ts
describe('Tabs — vocabulary validation (dev)', () => {
  it('warns when variant is outside the declared vocabulary', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <SoribashiProvider theme={theme}>
        <Tabs variant={'zigzag' as never} defaultValue="a">
          <Tabs.List>
            <Tabs.Trigger value="a">A</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content</Tabs.Content>
        </Tabs>
      </SoribashiProvider>,
    );
    expect(
      errSpy.mock.calls.some((c) => String(c[0]).includes('not in the declared vocabulary')),
    ).toBe(true);
    errSpy.mockRestore();
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `cd apps/pilot && bunx vitest run src/recipes/Tabs/Tabs.test.tsx`
Expected: the new test FAILS (no `vocabularyAxes`, registry empty).

- [ ] **Step 3: Migrate `Tabs.tsx`**

Edit the import (lines 16-20) — builder from local module, types from core:
```ts
import { defineCompound } from '../../builders.ts';
import type {
  PartRenderCtx,
  PolymorphicPartRenderCtx,
} from '@soribashi/core';
```

Replace the local variant type (line 23):
```ts
const variants = ['default', 'outline', 'pills'] as const;
type Variant = (typeof variants)[number];
```

In the `defineCompound({...})` config, replace the inline `variants: ['default', 'outline', 'pills'] as const,` (line 55) and add `vocabularyAxes`:
```ts
  vocabularyAxes: ['variant'] as const,
  variants,
```

Leave `TabsRootProps.variant?: Variant`, `defaults`, `vars`, `context`, and all `parts` unchanged.

- [ ] **Step 4: Run the validation test — now passes**

Run: `cd apps/pilot && bunx vitest run src/recipes/Tabs/Tabs.test.tsx`
Expected: PASS. Tabs' registered variant vocab is `default|outline|pills`; `variant="zigzag"` triggers the warning. Pre-existing Tabs tests still pass (including the asserted `<TabsList> must be inside <Tabs>` error path).

- [ ] **Step 5: Typecheck**

Run: `bun run typecheck`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add apps/pilot/src/recipes/Tabs/Tabs.tsx apps/pilot/src/recipes/Tabs/Tabs.test.tsx
git commit -m "$(cat <<'EOF'
refactor(tabs): consume local builders + vocabularyAxes variant

variant vocab (default|outline|pills) declared per-recipe in the theme; recipe
derives its variant type from a single hoisted const. Runtime validation tested.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Full verification, visual parity, spec addendum

**Files:**
- Modify: `docs/superpowers/specs/2026-05-12-vocabulary-rails-design.md`

- [ ] **Step 1: Full suite green**

Run:
```bash
bun run typecheck
bun run --filter '@soribashi/*' test
cd apps/pilot && bunx vitest run --reporter=basic
```
Expected: typecheck clean; theme 82, codegen 137, factory 472, blocks 244 (all unchanged — no package source touched); pilot **50** (47 + 3 validation tests). No pre-existing test broken.

- [ ] **Step 2: Visual parity check (manual)**

Run the dev server and confirm Button, Tooltip, and Tabs render identically to before — this is a wiring change, not a visual one:
```bash
cd apps/pilot && bun run dev
```
Visit the Button matrix, Tooltip matrix, and Tabs matrix pages; toggle dark mode. Each variant/size/intent should look exactly as it did on `main`. If anything renders differently, a vocab value or the `variants` field was changed by mistake — stop and reconcile. If the environment cannot run a browser, state that explicitly rather than claiming visual parity.

- [ ] **Step 3: Append the spec addendum**

Append the following section to `docs/superpowers/specs/2026-05-12-vocabulary-rails-design.md`:

```markdown
## 17. PR #11 implementation decisions (2026-05-28)

The pilot migration settled two open forks and surfaced one architectural finding.

1. **Variant is per-recipe (option B).** The global theme vocabulary holds only
   `size` + `intent`. Button, Tooltip, and Tabs each declare their own `variant`
   vocabulary. This is the honest expression of the "variant stays local"
   principle (§3); the earlier §12 framing of variant as a global axis is
   superseded.

2. **Type-threading deferred to PR #12.** Injected `size`/`intent` props are
   `string`-typed in PR #11. The literal vocab types are erased at
   `createTheme`'s return (`ResolvedTheme.vocabulary` is the fixed
   `ThemeVocabulary`), so compile-time narrowing requires generic-izing
   `createTheme`/`ResolvedTheme` (93 references / 5 packages) — see §14.2.
   Runtime Zod enforcement is live now; compile-time narrowing for the shared
   axes lands in PR #12. `variant` keeps compile-time narrowing throughout (it
   is typed locally from each recipe's `variants` const).

3. **Finding — `.extend()` is unusable in a single-app consumer's own theme.**
   Because recipes import the local `builders.ts`, which imports the theme,
   having the theme import a recipe to call `Recipe.extend(...)` forms a fatal
   module cycle (`theme → recipe → builders → theme`; `builders.ts` consumes
   `theme` at eval time). PR #11 therefore declares per-component variant
   overrides via the **Record form** of `ThemeDefinition['components']`, which
   `normalizeComponents` and `createSoribashiBuilders` accept identically. A
   future fix that keeps `.extend()` usable would split builder creation from
   theme registration (e.g. `makeBuilders()` + a separate `registerTheme(theme)`
   called at app entry), so recipes no longer import the theme transitively.
   Consider bundling that with the PR #12 threading work.
```

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-05-12-vocabulary-rails-design.md
git commit -m "$(cat <<'EOF'
docs(spec): record PR #11 decisions — variant per-recipe, Record form, threading deferred

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Self-review checklist (run after all tasks)

- [ ] **Spec coverage:** handoff steps 1 (builders.ts) → Task 1; step 2 (size axis) → Task 1; steps 3-5 (recipe migrations) → Tasks 2-4; step 6 (validation tests) → Tasks 2-4; step 7 (verify + visual) → Task 5. Variant decision (B) applied in Task 1; threading decision (defer) reflected throughout + §17.
- [ ] **No package source changed:** `git diff --stat main -- packages/` is empty. PR #11 is pilot + spec only.
- [ ] **Counts:** packages 82/137/472/244 unchanged; pilot 47 → 50.
- [ ] **No `.extend()` in the pilot theme** (cycle); Record form used.
- [ ] **Visual parity** confirmed or explicitly flagged as unverifiable.

## Done = 

Typecheck clean, full suite green (pilot 50), visual parity confirmed, spec §17 written. Then: `superpowers:finishing-a-development-branch` → push → open PR #11.
