# Library Authoring Hygiene Kickoff — Shared Vocabulary + CSS Modules

> **For the next agent session.** Paste this entire file as the first message in a fresh session. Working directory: `/Users/matt/Documents/GitHub/soribashi/`. Read this whole handoff before any tool calls. Suggested: create an isolated worktree (`superpowers:using-git-worktrees`) since this touches `packages/core` exports + every shipped recipe.

This handoff bundles two related "library authoring hygiene" gaps that both surfaced 2026-05-12 as sidebars to the Wave 3 PR review. They are independent but share a single PR because they both touch the same three recipe files (Button / Tooltip / Tabs).

## Where things stand

Waves 1-3 shipped (Button pilot, Tooltip pilot, Tabs pilot). The recipes work and are well-tested. But two cross-cutting authoring conventions that should have been settled before Wave 1 weren't:

1. **No shared vocabulary types.** Each recipe declares its own `Variant` / `Intent` / `Size` unions locally. Nothing forces `Button.size` and `Badge.size` to use the same scale.
2. **Plain CSS with prefixed global class names.** Recipes use `.cr-Button-root` / `.cr-Tooltip-content` / `.cr-Tabs-trigger` in plain `.css` files. The `cr-` prefix is convention, not build-time scoping.

Mantine settled both conventions early. This handoff briefs the next session on the gaps and the battle-tested Mantine patterns to mirror.

## Gap 1 — Shared vocabulary types

### What's missing

| Type | Current state | Mantine equivalent |
|---|---|---|
| `Size` (xs/sm/md/lg/xl) | Each recipe redeclares. Button has only `'sm' \| 'md' \| 'lg'` (3, not 5). | `MantineSize = 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` |
| `Intent` (primary/neutral/success/warning/danger/info) | Button declares locally; no other recipe needs it yet. | Mantine uses `MantineColor` (theme-derived) — see "Decision 2" below for the soribashi-specific divergence. |
| Eject pattern (`Size \| string \| number`) | Button's `size` is strictly `'sm' \| 'md' \| 'lg'` — no escape hatch. | Per-concept: `MantineRadius = _Radius \| number`, `MantineSpacing = _Spacing \| number`, etc. NOT a single `MantineNumberSize` (that was my earlier hand-wave — corrected after reading the source). |

**What's NOT a gap:** `Variant`. Tooltip's `'default' \| 'subtle'` and Tabs' `'default' \| 'outline' \| 'pills'` describe visual treatment unique to those compounds. Mantine has no shared `MantineVariant` either — `ButtonVariant`, `TabsVariant`, etc. all live next to their components. Leave variants alone.

### Mantine evidence (battle-tested anchors)

Path root: `/Users/matt/Documents/GitHub/mantine/packages/@mantine/core/src/`

- **`core/MantineProvider/theme.types.ts:159`** — `export type MantineSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';` and `export type DefaultMantineSize = MantineSize;`. Single canonical type, used everywhere a size prop appears.

- **`core/MantineProvider/theme.types.ts:174-181`** — `MantineFontSize`. Uses the `MantineThemeSizesOverride` interface-augmentation trick: `MantineThemeSizesOverride extends { fontSizes: Record<infer Custom, string> } ? Custom : MantineSize) | (string & {})`. Consumers can extend the size vocabulary by declaration-merging into `MantineThemeSizesOverride`.

- **`core/MantineProvider/theme.types.ts:183-196`** — `MantineRadius` and `MantineSpacing` add `| number` to the base type. This is how the eject pattern reaches numeric values (which then convert to rem at the boundary).

- **`core/MantineProvider/theme.types.ts:259-279`** — `DefaultMantineColor` is the canonical "default-values + eject" idiom:
  ```ts
  export type DefaultMantineColor =
    | 'dark' | 'gray' | 'red' | 'pink' | 'grape' | 'violet'
    | 'indigo' | 'blue' | 'cyan' | 'green' | 'lime' | 'yellow'
    | 'orange' | 'teal'
    | (string & {});
  ```
  The `(string & {})` keeps autocomplete on the known values while accepting any string. Soribashi's `Intent` type can mirror this shape directly.

- **`core/MantineProvider/theme.types.ts:284`** — `export type MantineColor = keyof MantineThemeColors;` — the theme-derived flavor (color names are whatever the theme registers).

- **`components/Button/Button.tsx:37`** — `export type ButtonSize = MantineSize | \`compact-${MantineSize}\` | (string & {});`. Shows how a recipe extends the shared vocabulary with a component-specific modifier: keep `MantineSize` as the base, add `compact-*` for Button's compact mode, allow `(string & {})` eject. The component-specific type is exported alongside the recipe for consumers who want to type a ref or wrapper.

- **`core/utils/get-size/get-size.ts`** — the runtime resolver:
  ```ts
  export function getSize(size: unknown, prefix = 'size', convertToRem = true): string | undefined {
    if (size === undefined) return undefined;
    return isNumberLike(size)
      ? convertToRem ? rem(size) : (size as string)
      : `var(--${prefix}-${size})`;
  }
  ```
  Same file defines `getSpacing`, `getRadius`, `getFontSize`, `getLineHeight`, `getShadow` — each just calls `getSize(size, '<prefix>')` with the right CSS-var prefix. The number-vs-string-vs-eject dispatch lives in one place.

- **No `MantineVariant`** — `Button.tsx:40-48` declares `ButtonVariant` locally; same for `TabsVariant`, `PopoverVariant`, etc. Confirms variant-stays-local across the library.

### Recommended soribashi shape

- `Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'` — exact mirror of `MantineSize`. Exported from `@soribashi/factory`, re-exported via `@soribashi/core`.
- `SizeValue = Size | (string & {})` — autocomplete-preserving eject for strings.
- `SizeValueWithNumber = SizeValue | number` — adds numeric eject (used for radius / spacing where `16` is meaningful).
- `Intent = 'primary' | 'neutral' | 'success' | 'warning' | 'danger' | 'info' | (string & {})` — fixed-default + eject (matches `DefaultMantineColor` idiom; differs from soribashi's current Button which lacks the eject).
- Optional later: a soribashi equivalent of `getSize` if/when a recipe needs runtime resolution.

## Gap 2 — CSS modules

### What's missing

Recipes use plain `.css` files with `cr-`-prefixed global class names. Mantine uses `.module.css` per component with locally-scoped class names. The prefix is convention; CSS modules are enforcement.

| Concern | Plain CSS + `cr-` prefix (current) | `.module.css` (Mantine) |
|---|---|---|
| Class-name collisions | Convention-only; two soribashi-derived libraries shipping `.cr-Button-root` would collide | Build-time scoped; impossible to collide |
| Consumer accidentally targets internal classes | Possible — `.cr-Button-root` is a literal string in the bundle | Impossible — consumer doesn't know the generated name |
| Refactor-safe tests | `expect(el.className).toContain('cr-Tabs-trigger')` breaks if class renamed | `expect(el.className).toContain(classes.trigger)` survives any rename |
| Consumer override pattern | Consumer passes string class names via `className` prop (string literals) | Consumer passes their own `.module.css` import via `classNames={{ root: myStyles.root }}` (typed, refactor-safe) |
| Data-attribute selectors (`[data-variant='pills']`) | Work | Work (modules transform class names, not attribute selectors) |

### Mantine evidence

Path root: `/Users/matt/Documents/GitHub/mantine/packages/@mantine/core/src/`

- **90 `.module.css` files** across `components/` — every shipped component has its own module. Confirmed via `find ... -name '*.module.css' | wc -l`. Not selective; universal.

- **`components/Button/Button.module.css`** — class names inside are plain (`.root`, `.inner`, `.label`, `.section`, `.loader`). NO `cr-` or `Button-` prefix. The CSS module system scopes them at build time.

- **`components/Button/Button.tsx:36`** — `import classes from './Button.module.css';`. Default import. Module's exports are a `Record<string, string>` mapping declared class names to scoped names.

- **`components/Button/Button.tsx:183-195`** — recipe wires the module into `useStyles`:
  ```ts
  const getStyles = useStyles<ButtonFactory>({
    name: 'Button',
    props, classes, // ← the imported module
    className, style, classNames, styles, unstyled, attributes,
    vars, varsResolver,
  });
  ```

- **`core/styles-api/use-styles/use-styles.ts:28`** — `classes` typing:
  ```ts
  classes: Payload['stylesNames'] extends string ? Record<string, string> : never;
  ```
  Exactly the shape a CSS-module default export gives you. Zero adapter code; the module slots in directly.

- **`core/styles-api/styles-api.types.ts`** — consumer-side `classNames` prop:
  ```ts
  export type ClassNames<Payload extends FactoryPayload> = StylesApiRecord<Payload, string>;
  ```
  Same `Record<slotName, string>` shape. Consumer passes their own module's exports.

- **Data-attribute selectors inside modules** — `Button.module.css:49-67` shows `.root:where([data-block])`, `.root:where(:disabled:not([data-loading]), ...)`, etc. The `:where()` wrapper keeps specificity low and the data-attribute selectors compose with the scoped class name. Pattern transfers cleanly.

### Recommended soribashi shape

- Rename `Button.css` → `Button.module.css`; classes inside become `.root`, `.inner`, `.label`, etc. (no `cr-` prefix).
- In `Button.tsx`: replace the string-literal `classes` map with `import classes from './Button.module.css'`.
- `definePolymorphicComponent` / `defineCompound` / `defineComponent` configs accept `classes: Record<string, string>` — already do. Verify that wiring; if not, add types.
- Same for Tooltip and Tabs.
- Tests update from `toContain('cr-X-root')` to `toContain(classes.root)` — refactor-safe.
- Verify Vite + Vitest's default CSS module pipeline picks up `.module.css` automatically (it does — `@vitejs/plugin-react` handles this out of the box).
- Verify the data-attribute selector pattern from Wave 1 (`[data-variant='filled'][data-intent='primary']`) still works inside a module — Mantine confirms it does (`.root:where([data-block])` in Button.module.css). Local class scoping doesn't affect attribute matching.

## Files to read first (before brainstorming)

soribashi side:

- `apps/pilot/src/recipes/Button/Button.tsx` (lines 15-17 local unions; line 13 plain-CSS import) — the only existing vocabulary offender, and the recipe with the most CSS-module surface to migrate.
- `apps/pilot/src/recipes/Button/Button.css` — the `[data-attribute]` selector matrix. ~30 cells.
- `apps/pilot/src/recipes/Tooltip/Tooltip.{tsx,css,test.tsx}` — confirm Tooltip's variant stays local; second target for CSS module migration.
- `apps/pilot/src/recipes/Tabs/Tabs.{tsx,css,test.tsx}` — confirm Tabs' variant stays local; third target.
- `packages/blocks/src/Title/get-title-size.ts` — the existing in-repo eject pattern (`TitleSize = h${1-6} | string | number`). Reuse the shape.
- `apps/pilot/src/generated/theme.css` — confirm the `xs/sm/md/lg/xl` value scale exists for font-size, radius, spacing. (It does — `--font-size-xs/sm/md/lg/xl`, `--radius-xs/...xl`, `--spacing-xs/...xl`.)
- `packages/factory/src/index.ts` — current public surface; the new shared types belong here (probably in a new `packages/factory/src/types/vocabulary.ts` re-exported).
- `packages/factory/src/define-component.tsx`, `define-polymorphic-component.tsx`, `define-compound.tsx` — find the `classes` field's type in each config. Confirm they accept `Record<string, string>` so a CSS-module default export slots in without adapters.
- `apps/pilot/vite.config.ts` — sanity-check CSS modules work out of the box (Vite supports them natively; should require no config).

Mantine side (READ-ONLY, permitted via existing `additionalDirectories`):

- `/Users/matt/Documents/GitHub/mantine/packages/@mantine/core/src/core/MantineProvider/theme.types.ts` — lines 159 (`MantineSize`), 174-196 (`MantineFontSize` / `MantineRadius` / `MantineSpacing` and the `MantineThemeSizesOverride` mechanism), 259-284 (`DefaultMantineColor`, `MantineColor`).
- `/Users/matt/Documents/GitHub/mantine/packages/@mantine/core/src/core/utils/get-size/get-size.ts` — the runtime resolver pattern.
- `/Users/matt/Documents/GitHub/mantine/packages/@mantine/core/src/components/Button/Button.tsx` — full recipe showing `import classes from './Button.module.css'` + `useStyles({ classes, ... })` + `ButtonSize = MantineSize | \`compact-${MantineSize}\` | (string & {})`.
- `/Users/matt/Documents/GitHub/mantine/packages/@mantine/core/src/components/Button/Button.module.css` — plain class names (`.root`, `.inner`, etc.), data-attribute selectors via `:where([data-X])`.
- `/Users/matt/Documents/GitHub/mantine/packages/@mantine/core/src/core/styles-api/use-styles/use-styles.ts` (lines 25-40) — `UseStylesInput.classes: Record<string, string>`, confirms the module-export shape is the contract.

## Architectural decisions to validate during brainstorm

### Vocabulary decisions

1. **Where do the types live?** `@soribashi/factory` (alongside `definePolymorphicComponent`)? `@soribashi/theme` (alongside `createTheme`)? Recommendation: `@soribashi/factory`, re-exported via `@soribashi/core`, matching where `Slot`, `defineCompound`, etc. live. Probably a new `packages/factory/src/types/vocabulary.ts`.

2. **Is `Intent` a fixed union or theme-derived?** Mantine uses theme-derived (`MantineColor = keyof MantineThemeColors`) — flexible but couples the type to runtime theme shape. soribashi's distinction between `intent` (semantic role: primary/danger/success) and `color` (token reference: primary-500/red-700) is a deliberate divergence from Mantine. Recommendation: **(a) fixed-default + eject**, mirroring `DefaultMantineColor`'s shape:
   ```ts
   type Intent = 'primary' | 'neutral' | 'success' | 'warning' | 'danger' | 'info' | (string & {});
   ```
   Simpler than theme-derived, supports autocomplete on the known set, escapes to any string. Defer theme-derivation until a consumer asks for it.

3. **`SizeValue` vs `Size`.** Two exported types:
   - `Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'` — the strict scale (use for variant-style props where only the scale makes sense).
   - `SizeValue = Size | (string & {})` — string eject (use for size props where '24px' or '1.5rem' might be passed).
   - `SizeValueWithNumber = SizeValue | number` — adds numeric eject (use for radius / spacing where unitless integers are meaningful and get converted to rem).
   - Match Mantine's per-concept approach: don't conflate into one mega-type.

4. **Runtime resolver helper?** Mantine's `getSize(size, prefix)` resolves `'md'` → `var(--{prefix}-md)`, `16` → `'1rem'`. Wave 1 Button currently uses `data-size` + CSS rules (`[data-size='md'] { --cr-button-px: 0.75rem; }`) — no runtime resolution; CSS handles it all. The numeric/string eject case would need runtime. **Recommendation: defer.** Ship type-only first; introduce the resolver when the first recipe genuinely needs runtime size-prop dispatch (probably Wave 4 Select for its dropdown's width).

5. **Migration scope (vocab).** Button is the only existing offender. Migrate Button in this PR: import the new types, drop the local declarations, expand `Size` to the full 5-value scale, add eject. Tooltip and Tabs (no `size` / `intent` props) don't need changes. Future recipes inherit the discipline via the playbook entry.

### CSS modules decisions

6. **Migration ordering.** Three recipes need migration: Button (biggest, ~30 CSS cells), Tooltip, Tabs. Recommendation: one PR, one commit per recipe, plus a final commit for tests + playbook. Single-PR cohesion makes the review story easier.

7. **Test rewrite strategy.** Tests currently assert string literals (`toContain('cr-Tabs-trigger')`). Two options:
   - (a) Import the module in each test file: `import classes from '../recipes/Tabs/Tabs.module.css'`; assert `toContain(classes.trigger)`. Refactor-safe; requires the test to know which module to import.
   - (b) Add a `data-soribashi-part` attribute to each part (e.g., `data-soribashi-part="trigger"`) and query by that. Decouples tests from CSS scoping entirely.
   - **Recommendation: (a).** Lower test churn; preserves the existing "assert on what consumers see" mental model. The module import is a one-line addition per test file.

8. **Consumer override pattern (forward-looking).** With modules in place, consumers can write their own `.module.css` and pass `classNames={{ root: myStyles.root, content: myStyles.content }}`. The factory's existing `useStyles` already merges instance `classNames` (Wave 2 verified this). No factory change needed; just document the pattern in the playbook.

9. **Playbook update.** `docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md` § 2.1 currently shows Button with string-literal `classes` and a plain CSS file. Update § 2.1 / § 2.2 / § 2.3 to show the `.module.css` pattern. Document the rule: **all recipes use CSS modules; class names inside the module are plain (`.root`, `.trigger`), not prefixed.**

10. **What if Vite/Vitest CSS-modules support isn't drop-in?** Sanity-check first. Run the tests after migrating ONE file (e.g., Tooltip) and see if everything works. If there's a config gap, it'll surface here and the next agent can patch the Vite/Vitest config in this same PR.

## Out of scope (explicit)

- **Variant unification across recipes.** Tooltip's `subtle`, Tabs' `pills` etc. stay local. Mantine confirms variant-stays-local.
- **Theme-level changes.** Value scales already exist; the vocabulary work is purely type-level. The CSS module work is purely build-pipeline-level.
- **Runtime size resolver.** Defer until first runtime-resolution use case.
- **Theme-derived `Intent`.** Defer until a consumer asks for it.
- **Wave 4 (Select).** This work must land BEFORE Wave 4 so Select inherits the conventions cleanly.
- **`createTheme` API changes.** No new theme fields needed.

## Recommended start sequence

1. Invoke `superpowers:brainstorming` against "Library authoring hygiene — shared vocabulary types + CSS modules. What ships?" Reference this handoff + the Mantine evidence files in particular (theme.types.ts, get-size.ts, Button.module.css).
2. Frame the brainstorm around the 10 decisions above. Decide each explicitly.
3. Spec at `docs/superpowers/specs/YYYY-MM-DD-library-authoring-hygiene-design.md`. Sizing: **M** (one PR, two distinct surfaces — types + CSS modules — both small individually, combined they touch every recipe).
4. Plan → executing (subagent-driven is fine; tasks naturally chunk per recipe).

Suggested commit shape (for the executor):
- `feat(factory): export Size, SizeValue, SizeValueWithNumber, Intent vocabulary types`
- `refactor(button): use shared Size + Intent; expand size scale to xs/sm/md/lg/xl; add eject`
- `refactor(button): migrate to Button.module.css`
- `refactor(tooltip): migrate to Tooltip.module.css`
- `refactor(tabs): migrate to Tabs.module.css`
- `test(pilot): switch test assertions from string literals to module imports`
- `docs(playbook): codify shared-vocabulary + CSS-modules conventions in § 2.1 / § 2.2 / § 2.3`

## Sanity check the inheritance

Before writing any new code:

```bash
bun run typecheck
bun run --filter '@soribashi/*' test
cd apps/pilot && bunx vitest run --reporter=basic
```

Expected after Wave 3 merges: clean typecheck, 461 factory + 244 blocks + 47 pilot. If red, fix before brainstorming.

After the migration, the same commands should pass with the SAME test counts (the CSS-module migration changes test assertions but not test count; the vocab migration adds no tests). If counts diverge, investigate.

## Reference paths

- soribashi: `/Users/matt/Documents/GitHub/soribashi/` (this working directory)
- Mantine (READ-ONLY per existing `additionalDirectories` allow): `/Users/matt/Documents/GitHub/mantine/`
- the host library host (READ-ONLY): `<host-library-path>/`

## Auto-memory

Wave 3 just shipped via PR #8 — assume merged by the time this kicks off. Both gaps surfaced during the 2026-05-12 Wave 3 PR review as sidebar conversations: the shared-vocabulary observation ("nothing stops Button from declaring size 'watermelon | cookie'") and the CSS-modules observation ("why are we not using Mantine's pattern"). No session memory captured those conversations; this handoff is the authoritative record. The Mantine references in this doc were researched against the local checkout on 2026-05-12 — trust them over any half-recalled detail from training data.
