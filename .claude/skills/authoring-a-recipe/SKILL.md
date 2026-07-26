---
name: authoring-a-recipe
description: Use when adding or modifying a component recipe in packages/ui
---

# Authoring a Recipe

Instructions for adding or changing a component recipe under `packages/ui/src/recipes/`. Follow every section; the gates described in section 8 and 9 fail loudly, by design, when a step is skipped.

## 1. The four-file layout

Every recipe is exactly four files in `packages/ui/src/recipes/<Name>/`, same names every time, no exceptions:

- `<Name>.tsx`: the recipe itself.
- `<Name>.module.css`: the recipe's stylesheet.
- `<Name>.test.tsx`: browser tier, render, interaction, and a11y assertions.
- `<Name>.visual.test.tsx`: visual tier, screenshot baselines.

Do not add a fifth file to the recipe directory, and do not split one of the four across additional files. `packages/ui/scripts/derive.ts` reads exactly these four paths per recipe name when it builds the agent-facing manifest; a missing or renamed file breaks derivation.

## 2. Builder selection

Pick the builder by the recipe's authoring category (from `docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md`):

- **Category 1, pure styled primitive** (Button-shaped: one element, style slots, variants): use `definePolymorphicComponent` when the recipe needs `as`/`component` polymorphism; use `defineComponent` when polymorphism is senseless for the recipe (there is no other element it would ever render as).
- **Category 2, transient overlay compound** (Tooltip/Popover-shaped: mounts and unmounts, Base UI owns open/close lifecycle) and **category 3, persistent navigational compound** (Tabs-shaped: parts stay mounted, switch active/open state): use `defineCompound` over Base UI parts for both.
- **Category 4, generic/form control** (Select-shaped: data-driven, needs real generic type inference): use `defineGenericComponent`.

Every recipe module must export its category as a literal:

```ts
export const recipeCategory = 1 as const; // 1 | 2 | 3 | 4
```

This is not derivable from `RecipeMeta` or the CSS: it records an authoring decision, not a fact recoverable from source. `derive.ts` throws, and the manifest/registry generation fails, if a recipe module has no valid `recipeCategory` export. Add it before anything else compiles.

Give the export a doc comment, not a bare literal. Button's form is the standard going forward:

```ts
/**
 * Authoring category from the recipe conversion playbook's four categories
 * (docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md § 2):
 * 1 = pure styled primitive (§ 2.1, Wave 1, this recipe is the pilot).
 * Read by packages/ui/scripts/derive.ts to build the agent-facing manifest;
 * not itself derived, since it records an authoring decision, not a fact
 * recoverable from RecipeMeta or the CSS.
 */
export const recipeCategory = 1 as const;
```

Today's recipes are mixed: about half carry this full comment and half are a bare `export const recipeCategory = N as const;` line, an artifact of the layout sweep landing fast. That split is not a second sanctioned style; it is not yet cleaned up. Write the full comment on every new or touched recipe rather than matching whichever bare neighbour happens to be closest.

**Generic-params trap.** When a recipe declares `vocabularyAxes`, spell out every type parameter the builder call takes; do not let them be inferred. `defineComponent` needs all four (`TOwnProps, TSelectors, TVariants, TVocabAxes`):

```ts
export const Container = defineComponent<
  ContainerProps,
  readonly ['root'],
  readonly [],
  readonly ['size']
>({ /* ... */ });
```

`definePolymorphicComponent` needs all five (`TOwnProps, TDefaultAs, TSelectors, TVariants, TVocabAxes`):

```ts
export const Text = definePolymorphicComponent<
  TextProps,
  'p',
  readonly ['root'],
  readonly [],
  readonly ['size']
>({ /* ... */ });
```

Leaving these to inference has been observed to silently drop the vocabulary-axis typing: the recipe still compiles, but `size`/`intent`/`variant` narrowing quietly disappears from the prop surface, with no error pointing at the cause. Container pins the four-param form and Text pins the five-param form; follow whichever one matches the builder any time a recipe opts into `vocabularyAxes`.

## 3. The two invariants

These are CLAUDE.md's project invariants, verbatim, and they bind every recipe:

1. `Recipe.extend()` is first-class public API and must not be bypassed. Never work around it (e.g. via the Record component form) or break `.extend({ defaultProps: { size } })` threading.
2. Vocabulary (`size` / `intent` / `variant` values) is theme-declared via `defineVocabulary`. Soribashi itself has no opinion on the values; never hardcode a vocabulary into the framework.

A recipe under `packages/ui` is a consumer, not the framework: it is where a vocabulary gets declared (`packages/ui/src/theme.ts`'s `uiVocabulary`), which is allowed and required. Never push a vocabulary decision down into `packages/factory`, `packages/theme`, or `packages/codegen`.

## 4. CSS rules

- The `.module.css` file's first non-comment statement must open `@layer soribashi.recipes { ... }`. Everything the recipe declares lives inside that layer.
- Every colour value and every length value must arrive via `var(--...)`, including inside a fallback (`var(--a, var(--b, 1rem))` is fine; a bare `1rem` outside any `var()` is not).
- The only literals exempt from that rule: the length allowlist `0`, `1px`, `2px`, `100%`; unitless numbers (`opacity`, `line-height`, `font-weight`, `z-index`); and time values (`ms`/`s`) for transitions. `transparent`, `currentColor`, and `inherit` are the only allowed named-colour keywords; `white` and every other named colour, every hex literal, and every colour function (`rgb`, `rgba`, `hsl`, `hsla`, `oklch`, `oklab`, `lab`, `lch`, `color()`) outside a `var()` is a violation.
- This is mechanically enforced: `packages/ui/test/no-hardcoded-values.test.ts` scans every `.module.css` under `src/recipes/` and fails on any literal it finds. Write to the rule from the start rather than discovering it at test time.
- Emitted theme token names a recipe's stylesheet may depend on: `--color-*`, `--radius-*`, `--spacing-*`, `--font-size-*`, `--font-family-*`, `--font-weight-*`, `--line-height-*`, `--shadow-*`, `--breakpoint-*`, `--z-index-*`, `--text-*`, `--surface-*`, `--border-*`, `--accent-*`. A recipe's own local vars (`--sb-*`) and its `autoVars`-derived vars (see next bullet) never collide with this list, so they need no separate exclusion.
- If the recipe declares `variants` and the rendered instance has both `intent` and `variant` set, the builder's `autoVars` call gives the recipe, for free, on `root`: `--{lowercased-name}-bg`, `-color`, `-border`, and (when the intent resolver provides them) `-hover`, `-active`, `-hover-color`. Reach for these vars in the CSS (`var(--button-bg)`, `var(--button-hover, var(--button-bg))`) rather than re-deriving colour logic in the recipe.

## 5. Style props and visibility props arrive free

Every builder pipes merged props through `useStyleProps` (`packages/factory/src/style-props/use-style-props.tsx`) before a recipe's `render` ever sees them. The Box-style props (`m`, `p`, `bg`, `c`, `fz`, `fw`, and the rest of `STYLE_PROPS_DATA`) and the four visibility props (`hiddenFrom`, `visibleFrom`, `lightHidden`, `darkHidden`) are extracted, parsed, and turned into a responsive class name, an inline style, and visibility utility classes by that one shared hook, called from inside `defineComponent`, `definePolymorphicComponent`, `defineGenericComponent`, and `defineCompound`'s Root part alike.

A recipe must NEVER call `extractStyleProps` or `parseStyleProps` itself, hand-roll a style-prop extraction pass, or reimplement visibility classing. That pipeline is builder machinery, not something a recipe wires up; there is no per-recipe opt-out and no case where a recipe needs its own copy.

Trap: `fw` (font-weight) resolves through an identity resolver, not a token lookup (`STYLE_PROPS_DATA`'s `fw` entry in `packages/factory/src/style-props/style-props-data.ts`). A numeric value or a real CSS keyword (`700`, `'bold'`) passes straight through to `fontWeight`; a token-key-shaped string that isn't itself a valid CSS value silently no-ops instead of erroring, because the resolver is `String(v)`, not a token lookup. A consumer who wants a themed weight writes the CSS variable by hand: `fw="var(--font-weight-bold)"`.

## 6. The dimension-record pattern

A recipe that needs a size-keyed dimension, a height, a max-width, anything that isn't a spacing/radius/font-size token, owns that mapping itself: a plain `Record<string, string>` keyed on the theme's `size` vocabulary values, declared once near the top of the recipe file and read from inside its `vars` resolver. The two exemplars:

```ts
// Button.tsx
const BUTTON_HEIGHTS: Record<string, string> = {
  xs: '1.75rem',
  sm: '2rem',
  md: '2.25rem',
  lg: '2.5rem',
  xl: '2.75rem',
};
```

```ts
// Container.tsx
const CONTAINER_WIDTHS: Record<string, string> = {
  xs: '30rem',
  sm: '40rem',
  md: '48rem',
  lg: '64rem',
  xl: '80rem',
};
```

Both live in the recipe, not the framework, because `@soribashi/ui` is a consumer and owns these values (CLAUDE.md invariant 2: soribashi itself has no opinion on vocabulary values). Both stay theme-overridable two ways: per-instance via `Recipe.extend({ vars })` overriding the derived CSS variable directly, or via `Recipe.extend({ defaultProps: { size } })` changing which key of the record gets read at render time. Reach for this pattern instead of hardcoding a dimension inline in CSS or bending a spacing-token lookup to fit a value it wasn't meant for.

## 7. Data attributes `getStyles('root')` already emits

`getStyles('root')` (or the compound equivalent, see section 10) already stamps `data-variant`, `data-intent`, and `data-size` onto the element whenever the corresponding prop is set. Never hand-emit these attributes yourself. Vocabulary axis props (`size`/`intent`/`variant`) are not stripped from `props` by the builder before render, so destructure them out in the render body and do not spread them onto the DOM element as raw attributes; they're already represented via the `data-*` attributes `getStyles` produced.

`mod` is Box-only. Box's shorthand `mod` prop, and the `getBoxMod` conversion behind it, live entirely in `Box.tsx`; it is not framework machinery, and no other recipe receives, forwards, or should reach for a `mod` prop. Every other recipe that needs a boolean or enum reflected onto the DOM as a `data-*` attribute stamps it by hand in its own render body instead: `data-with-border` (Paper), `data-grow` (Group), `data-fluid` (Container), `data-inline` (Center), `data-order` (Title), and so on. Treat hand-stamping as the established pattern outside Box, not a workaround; do not invent a framework-level mod-like helper to avoid it.

## 8. Test expectations per tier

Today's verification runs across three tiers: `ui-logic` (Node, `vitest.config.ts`), `ui-browser` (real Chromium via `@vitest/browser-playwright`, `vitest.browser.config.ts`), and `ui-visual` (screenshot baselines, `vitest.visual.config.ts`). There is no fourth, Playwright Mantine-parity tier; that tier existed only for the now-deleted `@soribashi/blocks` package and was removed along with it.

Every colour-bearing or interactive recipe needs, at minimum:

- **An axe case.** Run `runAxe` (`packages/ui/src/a11y/axe.ts`) against the recipe's showcase states (every intent x variant, every size, disabled where applicable) and assert zero violations. `runAxe` runs axe-core's default ruleset; only add a rule exemption when it is evidence-backed (e.g. the existing `aria-hidden-focus` exemption, which fires on Base UI's own focus-guard sentinels, not on recipe markup). Do not narrow the ruleset to `color-contrast` alone; that makes the axe case redundant with the contrast matrix and proves nothing extra.
- **Membership in the contrast matrix, if the recipe is colour-bearing.** `packages/ui/src/a11y/contrast-matrix.test.tsx` asserts WCAG AA (>= 4.5:1) across every intent x variant x size combination, in both light and dark scheme. A colour-bearing recipe (anything rendering resolved foreground/background text) needs its own equivalent coverage, following the same pattern: normalize computed colour via canvas (`getComputedStyle` on this theme's `oklch()`/`light-dark()` tokens does not reliably serialize to `rgb()`), disable CSS transitions before reading computed styles after a scheme toggle, and resolve the canvas backdrop live for transparent-background variants.
- **A `MATRIX_CLASSIFICATION` entry, always, colour-bearing or not.** Every recipe joins the map in `packages/ui/src/a11y/matrix-classification.ts`: either `'covered'` (it has real rendered contrast cells, either Button's full intent x variant x size grid or a `SMALL_COVERAGE` entry added to `contrast-matrix.test.tsx` and listed in `SMALL_COVERAGE_NAMES`, so the two can't silently drift apart) or `{ exempt: '<reason>' }` for a recipe with no colour of its own (`{ exempt: 'geometry only' }` for a layout-only recipe like Stack, Grid, or Container). `matrix-guard.test.ts` fails by name if a manifest recipe has no entry at all. It also fails, as part of `bun run test`, when an `exempt` recipe's stylesheet still depends on a colour-family token (`--color-*`/`--text-*`/`--surface-*`/`--accent-*`) but the reason string doesn't start with `colour-via:` pointing at wherever that recipe's colour-contrast proof actually lives; honour that prefix convention whenever an exemption reason needs one, since this is a real gate, not an advisory one.
- **A `RESKIN_FIXTURES` entry.** Add `packages/ui/src/conformance/reskin-fixtures.tsx[meta.name]`: a minimal, force-visible rendering of the recipe with its most visually representative slot tagged `classNames={{ <slot>: 'reskin-target' }}`. The reskin guard test (`reskin.test.tsx`) fails BY NAME, not silently, if a recipe with `recipeMeta` has no matching fixture. The guard's snapshot reads the fixture's computed `backgroundColor`, `color`, `borderRadius`, `gap`, and `padding` and asserts at least one of the five actually differs between the real theme and the deliberately garish reskin theme, so pick the tagged slot accordingly: a slot with no background, foreground, radius, gap, or padding of its own can't prove anything moved. If any part of the recipe renders through a portal (compound content, an overlay), forward the fixture's `scopeEl` argument into that part's container prop (see Popover's fixture forwarding `scopeEl` into `Content`'s `container`); otherwise the portalled content escapes the reskin test's scoped wrapper and the test silently compares the base theme against itself.
- **Visual baselines.** Regenerate `<Name>.visual.test.tsx`'s `__screenshots__` only via the `visual-baselines` GitHub Actions workflow (`workflow_dispatch`, needs a pushed branch) or, if that workflow cannot be dispatched, the pinned Docker command recorded at the top of `.github/workflows/visual-baselines.yml` (matches the repo's pinned `@playwright/test` version). Never commit baselines generated on a non-Linux machine: Vitest suffixes baseline filenames with browser and platform, so a locally generated `-chromium-darwin.png` is a different file from the CI-committed `-chromium-linux.png`, and darwin baselines are gitignored. A local `bun run test:visual` run is advisory only.

## 9. After authoring

A new or changed recipe carries registration obligations beyond its own four files, all landing in the same commit:

1. **The barrel.** Export the recipe, and its `<name>Theme = Recipe.extend({})` convenience export, from `packages/ui/src/index.ts`.
2. **`RECIPE_DESCRIPTIONS`.** Add the recipe's name to the map in `packages/ui/scripts/generate-registry.ts`; the generator fails loudly, by design, without one.
3. **`RESKIN_FIXTURES` and `MATRIX_CLASSIFICATION`.** Both described in section 8, above; both are guarded by name, not silently skippable.
4. **`derive.test.ts`'s recipe-name assertion.** `packages/ui/test/derive.test.ts` asserts the manifest's recipe names against a literal array; add the new name in alphabetical order.
5. **`bun run generate:ui`.** Run it and commit the regenerated `packages/ui/manifest.json` and `packages/ui/registry/*.json` alongside everything else. `packages/ui/test/manifest-drift.test.ts` (local) and the `codegen-drift` CI job both rebuild the manifest and registry the same way and fail on any diff against what's committed. There is no partial-credit path here: a new or changed recipe without a regenerated manifest/registry fails CI even if every other gate is green.

## 10. Traps

- Always `bun run test`. Plain `bun test` invokes Bun's own test runner, not vitest, and will not run this package's suites.
- `light-dark()` is colour-only. It is a `<color>` production (CSS Color 5); substituting it into a registered `<length>` custom property (`--radius-md`, `--spacing-md`, `--font-size-md`) is invalid at computed-value time. Never propose a `light-dark()` dark override for a non-colour token.
- Never register colour tokens with `@property`. Registration makes the custom property's value computed at the declaring element, which freezes `light-dark()` to that element's `color-scheme` and silently breaks scoped, multi-tenant dark mode. Only non-colour tokens (`radius`, `spacing`, `font-size`) are registered.
- `inherits` is always `true` on every `@property` registration. `inherits: false` would stop a descendant from picking up an ancestor's scoped token override (the mechanism `createTheme({ scope })` and the multi-tenant demo rely on), falling back to the registered `initial-value` instead.
- A recipe-supplied `vars` resolver REPLACES the builder's automatic `autoVars` call; it does not layer on top of it (`config.vars ? config.vars(...) : autoVars(...)`, mutually exclusive). A recipe that needs both the auto-derived `--{name}-bg/-color/-border/...` vars AND its own custom var (e.g. a size-driven dimension var) must invoke `autoVars` itself inside its `vars` resolver and merge the result in. See Button's `vars` function for the pattern. None of the ten layout recipes needs this merge: none of them declares `variants`, so a recipe with no `vars` key at all gets an automatic `autoVars` fallback that's a no-op, and a recipe that does declare its own `vars` resolver has no auto-derived `-bg/-color/-border` vars to preserve in the first place. Button is the only recipe today with both `variants` and a custom dimension var, which is exactly why it's the one that needs the merge-in pattern.
- `vitest-browser-react`'s `render` is async: it resolves a `Promise<RenderResult>`. Always `await render(...)`; a missing `await` produces a `RenderResult`-shaped promise, not the rendered screen, and every subsequent `screen.getByRole(...)` call breaks in confusing ways.
- Compound `getStyles` takes an options object, never a bare string. A part styling its own slot calls `getStyles()` with no arguments; a part reaching across to style a sibling slot calls `getStyles({ part: 'siblingSlotName' })`. There is no bare-string form (`getStyles('root')` is `defineComponent`/`definePolymorphic`/`defineGeneric`'s API, not `defineCompound`'s).
- `defineCompound` does NOT strip Base UI's `render` prop from a part's prop surface. Every part that wraps a Base UI primitive must both `Omit<BaseUiPartProps, 'render'>` in its TypeScript prop type AND strip `render` in its destructure at runtime (see Popover's `stripFrameworkKeys`, which strips `render` alongside the Styles API's own `classNames`/`styles`/`vars`/`attributes`/`unstyled` keys). `as` is the only public polymorphism surface soribashi compound parts expose; never let Base UI's `render` leak through as a second, undocumented one.
