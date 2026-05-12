# Shared Vocabulary Kickoff — Sizes, Intents, Eject Pattern

> **For the next agent session.** Paste this entire file as the first message in a fresh session. Working directory: `/Users/matt/Documents/GitHub/soribashi/`. Read this whole handoff before any tool calls. Suggested: create an isolated worktree (`superpowers:using-git-worktrees`) since this touches `packages/core` exports.

## Where things stand

Waves 1-3 shipped (Button pilot, Tooltip pilot, Tabs pilot). Each recipe declares its own `Variant` / `Intent` / `Size` unions locally. There is no shared vocabulary export from `@soribashi/core` — so two recipes could legally type `size` differently (`'sm' | 'md' | 'lg'` vs `'small' | 'medium' | 'large'` vs the watermelon-cookie absurdity) and TypeScript would not complain.

Tokens are consolidated. The pilot's `theme.css` emits `--font-size-xs/sm/md/lg/xl`, `--radius-xs/...xl`, `--spacing-xs/...xl`. The *value* scale exists. The *type-level vocabulary* that recipe authors pull from when typing `size?: ...` does not.

Mantine is the canonical reference: `MantineSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'` exported from `@mantine/core`, used by every recipe. Plus `MantineNumberSize = MantineSize | (string & {}) | number` — the **eject pattern** that lets consumers escape to `'24px'` or `16` when the canon doesn't fit.

## The gap, concretely

Three issues, surfaced 2026-05-12:

1. **No shared `Size` union exported.** `apps/core-radix-pilot/src/recipes/Button/Button.tsx:17` declares `type Size = 'sm' | 'md' | 'lg'` locally — only 3 sizes, not even the full `xs|sm|md|lg|xl` scale the theme provides. A future `Badge` or `IconButton` would redeclare its own and probably diverge.

2. **No shared `Intent` union exported.** Same file line 15: `type Intent = 'primary' | 'neutral' | 'success' | 'warning' | 'danger' | 'info'`. This is a universal vocabulary — every feedback/status component would want it. Currently nothing forces consistency.

3. **No eject pattern.** Button's `size` is strictly `'sm' | 'md' | 'lg'`. Consumers cannot pass `'24px'` or `16` for fine-grained control. `packages/blocks/src/Title/get-title-size.ts` already uses the eject shape locally (`TitleSize = h${1-6} | string | number`) — the pattern exists in the repo but is not generalized.

**What's NOT a gap:** `Variant`. Tooltip's `'default' | 'subtle'` and Tabs' `'default' | 'outline' | 'pills'` are genuinely component-specific — they describe visual treatment unique to that compound. Leave variants alone. Mantine also lets each recipe declare its own variant union; only the universal vocabulary (size, intent, color, radius) is shared.

## Files to read first (before brainstorming)

- `apps/core-radix-pilot/src/recipes/Button/Button.tsx` — the only existing offender. Lines 15-17 are where the local unions are declared. Lines 44-50 set defaults. The render destructures these as data-attributes.
- `apps/core-radix-pilot/src/recipes/Button/Button.css` — the data-attribute selectors (`[data-intent='primary'][data-variant='filled']` etc.) that the recipe pairs with. Size shows up as `[data-size='md']`. ~30 cells in the matrix.
- `packages/blocks/src/Title/get-title-size.ts` — the existing eject pattern in soribashi (`SCALE | string | number`). Reuse this shape, generalize it.
- `apps/core-radix-pilot/src/recipes/Tooltip/Tooltip.tsx` and `apps/core-radix-pilot/src/recipes/Tabs/Tabs.tsx` — confirm their `Variant` unions are component-specific and should NOT be migrated. They're examples of "this stays local."
- `apps/core-radix-pilot/src/generated/theme.css` — confirm the `xs/sm/md/lg/xl` value scale exists across `--font-size-*`, `--radius-*`, `--spacing-*`. (It does.)
- `packages/factory/src/index.ts` — current exports. The new shared types belong here (or in a new `packages/factory/src/types/vocabulary.ts` re-exported from index).
- Mantine reference: `/Users/matt/Documents/GitHub/mantine/packages/@mantine/core/src/core/MantineProvider/theme.types.ts` — see how `MantineSize` / `MantineNumberSize` / `MantineColor` are declared and consumed.

## Architectural decisions to validate during brainstorm

1. **Where do the types live?** `@soribashi/factory` (alongside `definePolymorphicComponent`)? `@soribashi/theme` (alongside `createTheme`)? A new `@soribashi/vocabulary`? Recommendation: `@soribashi/factory` re-exported via `@soribashi/core`, matching how `Slot`, `defineCompound`, etc. live.

2. **Is `Intent` a fixed union or theme-derived?** Mantine treats colors as `string` typed against `theme.colors` keys. soribashi could:
   - (a) Hardcode `Intent = 'primary' | 'neutral' | 'success' | 'warning' | 'danger' | 'info'` (matches Button's current set, locks vocabulary).
   - (b) Derive from `theme.semantic` or `theme.tokens.colors` keys via a type-level extract.
   - (a) is simpler and matches "shared vocabulary"; (b) is more flexible but couples the type to runtime theme shape. Decide during brainstorm.

3. **`SizeValue` shape.** Spec target: `Size | (string & {}) | number`. The `(string & {})` trick preserves autocomplete on the union while accepting any string. Apply this consistently to every size-shaped prop (size, radius, spacing if exposed).

4. **Runtime resolver helper?** Mantine has `getSize(size, theme.spacing)` that resolves `'md'` → CSS-var ref. Do we need a soribashi equivalent, or do recipes hardcode the resolution? Wave 1 Button currently uses `data-size` + CSS rules (`[data-size='md'] { --cr-button-px: 0.75rem; }`) — no runtime resolution needed. Eject case (`size={16}`) would need runtime — but is that case rare enough to defer? Recommendation: defer runtime resolver until first recipe genuinely needs it; ship type-only first.

5. **Migration scope.** Button is the only existing offender. Refactor in this PR. Tooltip and Tabs (variants only — local & specific) don't need changes. Future recipes inherit the discipline via the playbook entry.

6. **Playbook update.** `docs/superpowers/specs/2026-04-26-core-radix-conversion-playbook.md` § 2.1 currently shows Button declaring `Intent`/`Variant`/`Size` locally. Update to show the import-and-use pattern. The convention to document: "intent and size are universal — import from `@soribashi/core`. variant is recipe-specific — declare locally."

## Out of scope (explicit)

- Variant unification across recipes (Tooltip's `subtle`, Tabs' `pills` etc. stay local).
- Color tokens. The intent set is sufficient; recipes resolve intent to theme colors as they already do.
- Theme-level changes. Value scales already exist; this is a type-vocabulary surface only.
- Cross-recipe behavior helpers (e.g., disable/loading state). Different concern.

## Recommended start sequence

1. Invoke `superpowers:brainstorming` against "Shared vocabulary — Size, Intent, eject pattern. What ships, what stays local?" Reference this handoff + the Mantine vocabulary file.
2. Frame the brainstorm around the 6 decisions above. Decide each explicitly so the spec doesn't get ambiguous.
3. Spec goes at `docs/superpowers/specs/YYYY-MM-DD-shared-vocabulary-design.md`. Sizing: **S** (a single PR — types added to factory, Button refactored, playbook § 2.1 updated). Probably one merged commit covering all three.
4. Plan → executing (subagent-driven if you like, but this is small enough that inline execution is fine too).

## Sanity check the inheritance

Before writing any new code:

```bash
bun run typecheck
bun run --filter '@soribashi/*' test
cd apps/core-radix-pilot && bunx vitest run --reporter=basic
```

Expected after Wave 3 merges: clean typecheck, 461 factory + 244 blocks + 47 pilot. If red, fix before brainstorming.

## Reference paths

- Mantine: `/Users/matt/Documents/GitHub/mantine/` (handoff-permitted READ-ONLY per existing `additionalDirectories` allow)
- CVI host: `/Users/matt/Documents/GitHub/assured/assured-primary/apps/adjuster/src/components/ClaimViewIslands/` (READ-ONLY)

## Auto-memory

Wave 3 just shipped via PR #8 — assume merged by the time this kicks off. The conversation that surfaced this gap was on 2026-05-12, sidebar to the PR review. No session memory captured the discussion; the salient details are in this handoff. Trust this over any half-recalled detail from the Wave 3 session.
