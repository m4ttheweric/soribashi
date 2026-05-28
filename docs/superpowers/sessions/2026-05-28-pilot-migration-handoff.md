# Pilot Migration Kickoff — Wire the Recipes to the Vocabulary Rails

> **For the next agent session.** Paste this entire file as the first message in a fresh session. Working directory: `/Users/matt/Documents/GitHub/soribashi/`. Read this whole handoff before any tool calls. Suggested: create an isolated worktree (`superpowers:using-git-worktrees`) — this touches every shipped recipe + the pilot theme + the pilot entry point.

This is **PR #11**, the third and final PR in the library-authoring-hygiene rollout (see `docs/superpowers/specs/2026-05-12-vocabulary-rails-design.md` § 13). The two predecessors are merged to `main`:

- **PR #9 (`2cc0494`)** — CSS modules migration. All three recipes use `.module.css` with plain `.root`/`.trigger` selectors.
- **PR #10 (`ef99d35`)** — Vocabulary rails core. `defineVocabulary`, theme `vocabulary` + `semanticTokens` split, `Recipe.extend()` replacing `withDefaults()`, `createSoribashiBuilders(theme)`, `vocabularyAxes` opt-in, dev-only Zod validation.

PR #10 built all the rails but **deliberately did not wire the pilot recipes to them** — that's this PR. Right now the rails exist and are tested in isolation, but no recipe actually uses `vocabularyAxes` or `createSoribashiBuilders`. This PR makes the pilot consume its own infrastructure.

## Where things stand

`main` is at `ef99d35`. Baseline (verify before starting):

```bash
bun install
bun run typecheck                              # clean
bun run --filter '@soribashi/*' test           # theme 82, codegen 137, factory 472, blocks 244
cd apps/core-radix-pilot && bunx vitest run     # 47 pilot
```

Current pilot state (post-merge):

- **`apps/core-radix-pilot/src/theme/index.ts`** — already uses `createTheme({ vocabulary: { intent, variant }, semanticTokens: {...} })`. NOTE: it declares `intent` and `variant` but **NOT `size`**. The `variant` vocab is currently set to Button's five-value list (`filled|outline|subtle|ghost|link`) — see the "key decision" below, because that global value collides with Tooltip's and Tabs' variant sets.
- **`apps/core-radix-pilot/src/recipes/Button/Button.tsx`** — imports `definePolymorphicComponent` from `@soribashi/core` directly. Declares local `type Intent`, `type Variant`, `type Size = 'xs'|'sm'|'md'|'lg'|'xl'`. No `vocabularyAxes`.
- **`apps/core-radix-pilot/src/recipes/Tooltip/Tooltip.tsx`** — imports `defineCompound` from `@soribashi/core`. Local `type Variant = 'default' | 'subtle'`.
- **`apps/core-radix-pilot/src/recipes/Tabs/Tabs.tsx`** — imports `defineCompound` from `@soribashi/core`. Local `type Variant` (`default | outline | pills`).
- **No `apps/core-radix-pilot/src/builders.ts` exists yet.**
- **No recipe references `createSoribashiBuilders`, `vocabularyAxes`, or `Recipe.extend()`.**

## What this PR ships

The migration plan is spelled out in `docs/superpowers/specs/2026-05-12-vocabulary-rails-design.md` § 12 (steps 5-9). Concretely:

1. **`apps/core-radix-pilot/src/builders.ts`** — new file:
   ```ts
   import { createSoribashiBuilders } from '@soribashi/core';
   import { theme } from './theme';

   export const {
     defineComponent,
     definePolymorphicComponent,
     defineCompound,
     defineGenericComponent,
   } = createSoribashiBuilders(theme);
   ```
   This registers the theme's vocab in the runtime registry (so Zod validation fires) and returns the builders.

2. **Theme: add the `size` axis** to `theme.vocabulary` in `apps/core-radix-pilot/src/theme/index.ts`:
   ```ts
   vocabulary: {
     size: defineVocabulary(['xs', 'sm', 'md', 'lg', 'xl']),
     intent: defineVocabulary([...]),    // existing
     variant: defineVocabulary([...]),   // existing — but see key decision
   },
   ```

3. **Button** — switch the import from `@soribashi/core` to `'../../builders'`, drop the local `Intent` and `Size` declarations (they come from the theme now), add `vocabularyAxes: ['size', 'intent', 'variant'] as const`, and drop those three keys from `ButtonOwnProps` (the builder injects them). Keep `loading`/`fullWidth`/`leftIcon`/`rightIcon`/`children` as recipe-local own props.

4. **Tooltip** — import from `'../../builders'`, add `vocabularyAxes: ['variant'] as const`, drop local `type Variant`. Add a per-component override in the theme's `components` array:
   ```ts
   Tooltip.extend({ vocabulary: { variant: defineVocabulary(['default', 'subtle']) } })
   ```

5. **Tabs** — same shape: `vocabularyAxes: ['variant'] as const`, drop local `type Variant`, add:
   ```ts
   Tabs.extend({ vocabulary: { variant: defineVocabulary(['default', 'outline', 'pills']) } })
   ```

6. **Tests** — recipes import from `'../../builders'` now, so test imports may need updating. The Zod validation path (dev-only) is now live for these recipes; add at least one test per recipe proving an out-of-vocabulary value triggers the `console.error` (mirror `packages/factory/test/vocabulary-validation.test.tsx`).

7. **Verify** — typecheck clean; test counts hold or grow (new validation tests add to the count; no existing test should break). Run the dev playground (`cd apps/core-radix-pilot && bun run dev`) and confirm Button/Tooltip/Tabs render identically — this is a wiring change, not a visual one.

## Key decision to settle FIRST (before writing code)

**Is `variant` a global vocabulary axis, or strictly per-recipe?**

The pilot theme currently has `vocabulary.variant = defineVocabulary(['filled','outline','subtle','ghost','link'])` — that's Button's variant set, sitting in the *global* slot. But Tooltip's variant is `default|subtle` and Tabs' is `default|outline|pills`. Three recipes, three different variant vocabularies.

During the original brainstorm (captured in the vocab-rails spec § 3 non-goals), we established **"variant stays local per recipe"** — Mantine has no shared `MantineVariant` because each component's variant describes visual treatment unique to it. The current global `vocabulary.variant` is a wart inherited from PR #10's mechanical `semantic.variant` → `vocabulary.variant` move (it just relocated the old array; nobody designed it as "global").

Two coherent options:

- **(A) Keep `variant` global, Button uses it, Tooltip/Tabs override via `extend()`.** Literally what § 12 says. Button gets variant from the global; the other two override. Downside: the global `variant` value is arbitrarily "Button's set," which is conceptually muddy — why is Button privileged?

- **(B) Remove `variant` from the global vocabulary entirely; every recipe declares its own via `Recipe.extend({ vocabulary: { variant: ... } })`.** Matches the "variant stays local" principle cleanly. The global vocabulary holds only the genuinely-shared axes (`size`, `intent`). Each of Button/Tooltip/Tabs gets a `.extend({ vocabulary: { variant: ... } })` entry. Downside: more `extend()` calls; the global vocab no longer answers "what variants exist" (correct, because that question is recipe-specific).

**Recommendation: (B).** It's the honest expression of the design. But this is a real call with the user — surface it early, don't just pick. If the user wants minimal churn, (A) is defensible.

Whichever is chosen affects step 2 (whether the theme keeps `vocabulary.variant`) and steps 3-5 (whether Button also needs an `extend()` for variant).

## Second decision: does `vocabularyAxes` give real autocomplete yet?

PR #10 typed the builder-injected vocab props as `string` (lossy), with a note that "the pilot-migration PR can add tighter type inference via a separate hook" (spec § 9 / `packages/factory/src/types/vocabulary-axes.ts`). After this migration, recipe authors will write `<Button size="md">` with `size` typed as `string`, not `'xs'|'sm'|...`. Runtime Zod catches bad values, but there's no compile-time autocomplete.

Decide whether PR #11 also threads the theme's vocab *types* through `createSoribashiBuilders`'s return type so the injected props narrow to the declared literal unions. This is a type-system change to the factory (the return of `createSoribashiBuilders<TTheme>` would carry `TTheme`'s vocab literal types into the builders' config types). It's genuinely harder than the wiring and may deserve its own follow-up — but it's the payoff that makes the whole vocab-rails investment worth it for authoring ergonomics. At minimum, scope it explicitly: do it here, or file it as PR #12.

## Files to read first

- `apps/core-radix-pilot/src/theme/index.ts` — the vocab block is at the bottom (`vocabulary:` ~line 329, `semanticTokens:` ~line 333).
- `apps/core-radix-pilot/src/recipes/{Button,Tooltip,Tabs}/*.tsx` — the three recipes to migrate.
- `packages/factory/src/create-builders.ts` — what `createSoribashiBuilders` does (registers vocab, returns builders; idempotent).
- `packages/factory/src/types/vocabulary-axes.ts` — the `InjectedVocabularyProps` type (currently `string`-typed; relevant to the second decision).
- `packages/factory/src/validate-vocabulary-props.ts` — the dev-only Zod validator that fires for opted-in axes.
- `packages/factory/test/vocabulary-validation.test.tsx` — model for the per-recipe validation tests.
- `docs/superpowers/specs/2026-05-12-vocabulary-rails-design.md` — the full design; § 9 (vocabularyAxes), § 12 (pilot migration steps), § 13 (PR rollout).

## Process

1. Invoke `superpowers:brainstorming` ONLY to settle the two key decisions above (variant global-vs-local, and whether to thread vocab types for autocomplete). They're genuine design forks — don't guess.
2. If the decisions are small enough to not need a fresh spec, go straight to `superpowers:writing-plans` against this handoff + the vocab-rails spec § 12. The migration is mechanical once the decisions are made; sizing is **S–M**.
3. Execute (subagent-driven is fine — the work chunks per recipe).
4. `superpowers:finishing-a-development-branch` → push → PR #11.

## Suggested commit shape

- `feat(pilot): add builders.ts wiring createSoribashiBuilders(theme)`
- `feat(pilot): add size axis to theme vocabulary` (+ variant decision applied)
- `refactor(button): consume vocabularyAxes via local builders; drop local Intent/Size`
- `refactor(tooltip): vocabularyAxes + Tooltip.extend variant override`
- `refactor(tabs): vocabularyAxes + Tabs.extend variant override`
- `test(pilot): per-recipe vocabulary validation coverage`
- (optional, if scoped in) `feat(factory): thread theme vocab types through createSoribashiBuilders for injected-prop autocomplete`

## Sanity check the inheritance

Before writing code:

```bash
bun run typecheck
bun run --filter '@soribashi/*' test
cd apps/core-radix-pilot && bunx vitest run --reporter=basic
```

Expected: clean typecheck, 82 + 137 + 472 + 244 + 47. If red, fix before starting.

After migration the package counts hold; pilot test count grows by the new validation tests. No existing test should break — this is a wiring change. If a recipe's behavior changes visually, something is wrong.

## Reference paths

- soribashi: `/Users/matt/Documents/GitHub/soribashi/` (this working directory)
- Mantine (READ-ONLY): `/Users/matt/Documents/GitHub/mantine/` — `MantineThemeSizesOverride` augmentation is the reference for the autocomplete-threading decision, though soribashi uses the `createSoribashiBuilders` factory rather than module augmentation.

## Auto-memory

PR #9 + PR #10 merged to main on 2026-05-28 (squash; `2cc0494` and `ef99d35`). The vocab-rails design doc, plan, and both PRs' CodeRabbit review threads (all resolved, "No actionable comments") are the authoritative record. The "variant stays local" principle was a deliberate brainstorm decision — don't let the current `vocabulary.variant` global wart talk you out of it without a conscious call.
