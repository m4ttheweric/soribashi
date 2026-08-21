---
name: authoring-a-recipe
description: Use when adding or modifying a component recipe in packages/ui
---

# Authoring a Recipe

Instructions for adding or changing a component recipe under `packages/ui/src/recipes/`. Follow every section; the gates described in section 8 and 9 fail loudly, by design, when a step is skipped.

## 1. The four-file layout, plus room for a helper module

Every recipe has exactly these four files in `packages/ui/src/recipes/<Name>/`, same names every time:

- `<Name>.tsx`: the recipe itself.
- `<Name>.module.css`: the recipe's stylesheet.
- `<Name>.test.tsx`: browser tier, render, interaction, and a11y assertions.
- `<Name>.visual.test.tsx`: visual tier, screenshot baselines.

`packages/ui/scripts/derive.ts` reads exactly these four fixed paths per recipe name when it builds the agent-facing manifest (`derive.ts:118-120`); a missing or renamed one of these four breaks derivation, and none of them may be split across additional files.

A recipe MAY carry additional helper modules beyond these four when it genuinely needs one: `packages/ui/src/recipes/Select/` ships `items.ts` (pure item-resolution logic, no JSX) and `items.test.ts` (its Node-tier unit tests) alongside the four fixed files, because that resolution logic is substantial enough, and independent enough of rendering, to warrant its own module and its own fast (non-browser) test tier. This is not something `derive.ts` or any other gate can see or enforce either way -- it reads only the four fixed paths -- so the discipline is: reach for a helper module only when a real seam like Select's exists (non-JSX logic with its own test surface), not as a place to shrink an oversized `<Name>.tsx` for its own sake.

## 2. Builder selection

Pick the builder by the recipe's authoring category (from `docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md`):

- **Category 1, pure styled primitive** (Button-shaped: one element, style slots, variants): use `definePolymorphicComponent` when the recipe needs `as`/`component` polymorphism; use `defineComponent` when polymorphism is senseless for the recipe (there is no other element it would ever render as).
- **Category 2, transient overlay compound** (Tooltip/Popover-shaped: mounts and unmounts, Base UI owns open/close lifecycle) and **category 3, persistent navigational compound** (Tabs-shaped: parts stay mounted, switch active/open state): use `defineCompound` over Base UI parts for both.
- **Category 4, generic/form control** (Select-shaped: data-driven form controls that need real generic type inference over an item type; the category's title is simply "Form control" and genericity characterizes its larger members without defining the category itself, so Checkbox, which needs no generic type parameter, is classified category 4 too, on `defineComponent`): use `defineGenericComponent` when the recipe does need generic type inference (Select), `defineComponent` when it does not (Checkbox).

  **`defineGenericComponent`'s no-DOM-root limitation.** Data attributes (`data-size`/`data-intent`/`data-variant`) are stamped only on the `root` selector's returned props. That's a no-op when a recipe's `root` maps to a Base UI part that renders no DOM of its own (a context provider, e.g. Select's `Select.Root`): the recipe emits no `data-size` anywhere, and a `Recipe.extend()` consumer cannot write `.trigger[data-size="lg"]` for it the way they can for Button, which has a real DOM root. Select works around this by threading sizing through vars and the dimension-record pattern instead of a `data-size` selector. Known limitation, not yet fixed at the framework level; a future generic-component author whose `root` also has no DOM should expect the same gap.

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

**Resolved: every recipe imports its builder from the package's own themed `builders.ts`, and `size`/`intent` narrow to the theme's vocabulary literals on public types.** Earlier slices left this open as a package-wide gap: every recipe imported its builder directly from `@soribashi/core`, which types every opted-in vocabulary axis as bare `string` via `InjectedVocabularyProps` (`packages/factory/src/types/vocabulary-axes.ts`). That gap is closed. `packages/ui/src/builders.ts` calls `makeBuilders<typeof uiTheme>()` (a type-only import of `uiTheme`: no runtime edge, no import cycle, and deliberately no `registerTheme` call anywhere in this package) and re-exports the four builder functions with `uiTheme`'s vocabulary literals baked into their return types, the literal-union narrowing (`size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'`) that only ever came from `ThemedVocabularyProps` (`packages/factory/src/types/themed-builders.ts`). Every recipe in this package imports its builder function from `'../../builders.ts'`, never `@soribashi/core` directly; every other framework export a recipe needs (`autoVars`, `type PartRenderCtx`, and so on) still comes from `@soribashi/core` as before, unaffected. `packages/ui/test/vocabulary-narrowing.typecheck.tsx` is the compile-time pin: never executed, `bun run typecheck` is the gate, and each `@ts-expect-error` line fails loudly ("Unused '@ts-expect-error' directive") the moment narrowing regresses on any of the four builder kinds.

Two follow-on effects worth knowing about when authoring or vendoring:

- **The registry rewrites the import for a vendored consumer.** A recipe's own `'../../builders.ts'` specifier resolves inside `packages/ui/src/recipes/<Name>/`, but a vendored copy sits one directory up (`components/soribashi/<Name>/<Name>.tsx` next to a consumer-owned `components/soribashi/builders.ts`), so `generate-registry.ts`'s `rewriteBuildersImport` rewrites the embedded `.tsx` content's import to `'../builders.ts'` before it is written into the registry item. Only the registry item's embedded copy is rewritten; the committed recipe source under `src/recipes/` is untouched.
- **The registry smoke writes a consumer-side builders module for itself.** `registry-smoke.ts`'s `buildConsumerBuildersTs` generates the same shape a real vendoring consumer would author by hand: a `defineVocabulary` declaration per axis (values read live from the committed `packages/ui/manifest.json`, never hardcoded, so the scaffold cannot drift from `packages/ui/src/theme.ts`'s actual vocabulary) plus a `makeBuilders<typeof theme>()` call, written to `src/components/soribashi/builders.ts` in the scratch project before the CLI vendors anything against it.

`variant` was never part of this gap: it has always narrowed correctly on every recipe that declares a `variants` tuple, with or without explicit generic params, via `VariantProp<TVariants>` (same file), independent of the theme-wrapper path entirely. **The real trap is still dropping `as const` from a `variants` tuple.** `VariantProp<TVariants>` collapses to `unknown` (an intersection no-op, so `variant` accepts anything) exactly when `TVariants[number]` has widened to plain `string` -- which is exactly what happens if a `variants` tuple loses its `as const`:

```ts
const VARIANTS = ['filled', 'outline']; // no `as const`: widens to string[]
// ...
variants: VARIANTS, // TVariants[number] is now `string`; VariantProp<TVariants> is `unknown`
```

With that widening, `<MyRecipe variant="nope" />` compiles silently, with no error pointing at the cause. Every recipe in this package declares its `variants` tuple with `as const` today (e.g. `const ALERT_VARIANTS = ['filled', 'outline', 'subtle'] as const;`); keep doing that.

Generic params are still worth spelling out explicitly for other reasons (readability, and `defineGenericComponent` specifically has no automatic vocabulary-axis composition at all -- see Select.test.tsx's compile-time pin on `SelectSignature`), but doing so does not, by itself, produce any narrowing that inference wouldn't already give you.

### Zero-axis recipes

Not every recipe has a `variant` or an `intent`/`size` axis at all. A pure wrapper with no themeable dimension of its own -- an SVG icon component is the clearest case, but any recipe that is genuinely just a styled pass-through with no size/intent/variant knobs qualifies -- declares none of the vocabulary machinery: no `variants` tuple on the builder config, no `vocabularyAxes` entry, and no `defaultProps` for an axis that was never declared in the first place (there is nothing for a default to default). This is a legitimate, final shape, not a recipe that forgot to opt in.

Two consequences follow mechanically, both already covered elsewhere in this file but worth stating together for the zero-axis case specifically, since it's easy to go looking for guidance that doesn't apply here:

- **`autoVars` never fires.** `autoVars` (section 4, and the traps in section 10) requires `hasVariants` to be true before it does anything at all; a recipe with an empty/absent `variants` tuple gets `{}` back unconditionally, every render. This is section 4's ordinary no-op path, not a bug and not something to special-case in the recipe -- just don't reach for `--{name}-bg`/`-color`/`-border` vars in a zero-axis recipe's CSS, since nothing will ever populate them.
- **Section 7's axis-prop destructure doesn't apply.** Section 7's rule (destructure `size`/`intent`/`variant` out of `props` before spreading onto the DOM element) exists because the builder doesn't strip vocabulary-axis props for you. A recipe with no `vocabularyAxes` and no `variants` tuple never receives those props as axis props in the first place, so there is nothing to destructure and no `data-size`/`data-intent`/`data-variant` will be stamped by `getStyles`. Don't add a defensive destructure for an axis the recipe never declared; it's dead code that suggests an axis exists where none does.

Style the recipe with ordinary CSS instead: fixed values, or the dimension-record pattern (section 6) if it genuinely varies by something other than a themed vocabulary axis (e.g. a raw `size` number prop that isn't the `size` vocabulary at all).

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
- If the recipe declares `variants` and the rendered instance has both `intent` and `variant` set, `defineComponent`/`definePolymorphicComponent`/`defineGenericComponent`'s automatic `autoVars` fallback gives the recipe, for free, on `root`: `--{lowercased-name}-bg`, `-color`, `-border`, and (when the intent resolver provides them) `-hover`, `-active`, `-hover-color`. Reach for these vars in the CSS (`var(--button-bg)`, `var(--button-hover, var(--button-bg))`) rather than re-deriving colour logic in the recipe. **`defineCompound` does not call `autoVars` at all** -- it is not imported in `define-compound.tsx`, and a compound's `varsResolver` is `config.vars` or `undefined`, with no fallback. A compound that declares `variants` (Tabs does) gets none of these vars automatically; if a compound needs them, its own `vars` resolver has to call `autoVars` explicitly, the same way Button/Badge do for the single-component builders (see the Traps section below).

## 5. Style props and visibility props arrive free

Every builder pipes merged props through `useStyleProps` (`packages/factory/src/style-props/use-style-props.tsx`) before a recipe's `render` ever sees them. The Box-style props (`m`, `p`, `bg`, `c`, `fz`, `fw`, and the rest of `STYLE_PROPS_DATA`) and the four visibility props (`hiddenFrom`, `visibleFrom`, `lightHidden`, `darkHidden`) are extracted, parsed, and turned into a responsive class name, an inline style, and visibility utility classes by that one shared hook, called from inside `defineComponent`, `definePolymorphicComponent`, `defineGenericComponent`, and `defineCompound`'s Root part alike.

A recipe must NEVER call `extractStyleProps` or `parseStyleProps` itself, hand-roll a style-prop extraction pass, or reimplement visibility classing. That pipeline is builder machinery, not something a recipe wires up; there is no per-recipe opt-out and no case where a recipe needs its own copy.

Trap: `fw` (font-weight) resolves through an identity resolver, not a token lookup (`STYLE_PROPS_DATA`'s `fw` entry in `packages/factory/src/style-props/style-props-data.ts`). A numeric value or a real CSS keyword (`700`, `'bold'`) passes straight through to `fontWeight`; a token-key-shaped string that isn't itself a valid CSS value silently no-ops instead of erroring, because the resolver is `String(v)`, not a token lookup. A consumer who wants a themed weight writes the CSS variable by hand: `fw="var(--font-weight-bold)"`.

## 6. The dimension-record pattern

A recipe that needs a dimension that isn't a spacing/radius/font-size token — a height, a max-width, an offset — owns that mapping itself: a plain `Record<string, string>`, declared once near the top of the recipe file and read from inside its `vars` resolver. The two exemplars are keyed on the theme's `size` vocabulary:

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

**The record may be keyed on ANY axis the recipe owns, vocabulary or not.** Both exemplars above happen to be size-keyed, which is not part of the pattern. A drawer that slides in from either edge keys the identical record on its own `side: 'left' | 'right'` prop, and reads it in `vars` exactly the same way (tui-kit's `src/recipes/SideDrawer/SideDrawer.tsx` is the worked example — an adopter kit built on soribashi):

```ts
// SideDrawer.tsx — keyed on the recipe's own `side` axis, not the size vocabulary
const SIDEDRAWER_WIDTHS: Record<string, string> = {
  right: 'min(460px, 92vw)',
  left: 'min(320px, 85vw)',
};
```

Do NOT promote a recipe-local axis into `vocabularyAxes` just to make it look like the size-keyed exemplars. `vocabularyAxes` opts the recipe into the THEME's shared `size`/`intent`/`variant` axes; `left`/`right` has no business in `tuiVocabulary.variant`, and promoting it would put a recipe-specific enum on every other recipe's vocabulary. The real question for a recipe-local axis is section 7's: hand-stamp it as a `data-*` attribute (`data-side`, the same shape as `data-order`/`data-fluid`), and key the dimension record on it. Section 4's `vocabularyAxes` guidance applies only to the three theme axes.

## 7. Data attributes `getStyles('root')` already emits

`getStyles('root')` (or the compound equivalent, see section 10) already stamps `data-variant`, `data-intent`, and `data-size` onto the element, gated on the recipe's own declared config rather than on prop presence alone: `data-intent`/`data-size` are emitted only when the recipe opted that axis into `vocabularyAxes` (`buildDataAttrs`, `packages/factory/src/data-attrs.ts:16-24`), and `data-variant` is emitted when the recipe's builder-config `variants` tuple is non-empty OR `'variant'` is in `vocabularyAxes` (see section 13 for the exact OR condition). Never hand-emit these attributes yourself. Vocabulary axis props (`size`/`intent`/`variant`) are not stripped from `props` by the builder before render, so destructure them out in the render body and do not spread them onto the DOM element as raw attributes; they're already represented via the `data-*` attributes `getStyles` produced. This applies to `defineCompound` too: it does not strip vocabulary-axis props from a part's `props` before render either, so every part's render body needs the same destructure, not just single-component recipes' (see Tabs.tsx's root part for the worked example after this was missed once).

`mod` is Box-only. Box's shorthand `mod` prop, and the `getBoxMod` conversion behind it, live entirely in `Box.tsx`; it is not framework machinery, and no other recipe receives, forwards, or should reach for a `mod` prop. Every other recipe that needs a boolean or enum reflected onto the DOM as a `data-*` attribute stamps it by hand in its own render body instead: `data-with-border` (Paper), `data-grow` (Group), `data-fluid` (Container), `data-inline` (Center), `data-order` (Title), and so on. Treat hand-stamping as the established pattern outside Box, not a workaround; do not invent a framework-level mod-like helper to avoid it.

## 8. Test expectations per tier

Today's verification runs across three tiers: `ui-logic` (Node, `vitest.config.ts`), `ui-browser` (real Chromium via `@vitest/browser-playwright`, `vitest.browser.config.ts`), and `ui-visual` (screenshot baselines, `vitest.visual.config.ts`). There is no fourth, Playwright Mantine-parity tier; that tier existed only for the now-deleted `@soribashi/blocks` package and was removed along with it.

Every colour-bearing or interactive recipe needs, at minimum:

- **An axe case.** Run `runAxe` (`packages/ui/src/a11y/axe.ts`) against the recipe's showcase states (every intent x variant, every size, disabled where applicable) and assert zero violations. `runAxe` runs axe-core's default ruleset; only add a rule exemption when it is evidence-backed (e.g. the existing `aria-hidden-focus` exemption, which fires on Base UI's own focus-guard sentinels, not on recipe markup). Do not narrow the ruleset to `color-contrast` alone; that makes the axe case redundant with the contrast matrix and proves nothing extra.
- **Membership in the contrast matrix, if the recipe is colour-bearing.** `packages/ui/src/a11y/contrast-matrix.test.tsx` asserts WCAG AA (>= 4.5:1) across every intent x variant x size combination, in both light and dark scheme. A colour-bearing recipe (anything rendering resolved foreground/background text) needs its own equivalent coverage, following the same pattern: normalize computed colour via canvas (`getComputedStyle` on this theme's `oklch()`/`light-dark()` tokens does not reliably serialize to `rgb()`), disable CSS transitions before reading computed styles after a scheme toggle, and resolve the canvas backdrop live for transparent-background variants. On the transitions point specifically: `matrix-harness.tsx` exports `NO_TRANSITION_CLASS` and `installNoTransitionStyle()`, and both the full-grid and small-coverage paths install it, scoped to `document.body` so the rule reaches portalled targets too. A recipe may keep a genuine colour transition in its own CSS; the harness's no-transition class is what makes measuring it safe. A real instance of getting this wrong: a colour transition once produced a 2.396:1 reading taken mid-interpolation before the harness read a stable, settled colour, and the wrong fix, deleting the transition from the recipe itself rather than fixing the measurement, was caught in review. Fix the measurement, not the recipe's legitimate transition.
- **A `MATRIX_CLASSIFICATION` entry, always, colour-bearing or not.** Every recipe joins the map in `packages/ui/src/a11y/matrix-classification.ts`: either `'covered'` (it has real rendered contrast cells, either Button's full intent x variant x size grid or a `SMALL_COVERAGE` entry added to `contrast-matrix.test.tsx` and listed in `SMALL_COVERAGE_NAMES`, so the two can't silently drift apart) or `{ exempt: '<reason>' }` for a recipe with no colour of its own (`{ exempt: 'geometry only' }` for a layout-only recipe like Stack, Grid, or Container). `matrix-guard.test.ts` fails by name if a manifest recipe has no entry at all. It also fails, as part of `bun run test`, when an `exempt` recipe's stylesheet still depends on a colour-family token (`--color-*`/`--text-*`/`--surface-*`/`--accent-*`) but the reason string doesn't start with `colour-via:` pointing at wherever that recipe's colour-contrast proof actually lives; honour that prefix convention whenever an exemption reason needs one, since this is a real gate, not an advisory one (the guard's own test title calls it "advisory:", which describes the check's non-blocking intent within the guard test file's own suite name, not its actual behaviour: the assertion throws and fails `bun run test` like any other). Three worked examples from `matrix-classification.ts`, each pointing at a different KIND of proof: Field's exemption reads `'colour-via: TextInput and Textarea SMALL_COVERAGE cells render Field label/description/error parts and measure their computed colours on their real backdrops'` (proof lives in two OTHER recipes' rendered contrast cells, since Field itself is never rendered standalone in the matrix); Skeleton's reads `'colour-via: decorative pulse surface renders no text; Skeleton.visual.test.tsx pins its appearance with the animation frozen'` (proof lives in the visual tier, not the contrast matrix, since a decorative surface with no text has no foreground/background pairing to measure); Divider's reads `'colour-via: the optional label renders --text-muted on the canvas, the exact pairing Text.dimmed SMALL_COVERAGE cells already measure in both schemes'` (proof lives in another recipe's cell, the same shape as Field's, but for a decorative label rather than a control). The prefix only requires pointing at where the proof lives; it does not mandate a fixed proof shape.
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
- A recipe-supplied `vars` resolver REPLACES the builder's automatic `autoVars` call; it does not layer on top of it (`config.vars ? config.vars(...) : autoVars(...)`, mutually exclusive, and only on the three single-component builders -- `defineCompound` has no automatic fallback at all, see section 4 above). A recipe that needs both the auto-derived `--{name}-bg/-color/-border/...` vars AND its own custom var (e.g. a size-driven dimension var) must invoke `autoVars` itself inside its `vars` resolver and merge the result in. See Button's `vars` function for the pattern. None of the ten layout recipes needs this merge: none of them declares `variants`, so a recipe with no `vars` key at all gets an automatic `autoVars` fallback that's a no-op, and a recipe that does declare its own `vars` resolver has no auto-derived `-bg/-color/-border` vars to preserve in the first place. Button and Badge are the two recipes today that genuinely need the merge-in pattern (both declare `variants` AND a custom dimension var -- Badge's `--sb-badge-h`); follow their `vars` function as the pattern. Alert's own `vars` resolver also explicitly re-invokes `autoVars` even though it has no extra dimension var to merge in, which is functionally identical to the automatic fallback it would get by omitting `vars` entirely -- worth knowing so you don't copy that redundancy into a new recipe that has nothing to merge either.
- `vitest-browser-react`'s `render` is async: it resolves a `Promise<RenderResult>`. Always `await render(...)`; a missing `await` produces a `RenderResult`-shaped promise, not the rendered screen, and every subsequent `screen.getByRole(...)` call breaks in confusing ways.
- **`vi.useFakeTimers()` + a state update fired inside the fake clock needs `act()`; a real driver click does not.** A `setState` made from inside a `setTimeout` callback the fake clock fires runs synchronously in the test's own JS turn, with no macrotask boundary for React's scheduler to flush against — React 19 schedules its commit via `MessageChannel`, so faking `setTimeout`/`clearTimeout` does not help. The same update triggered by a real Playwright/CDP-dispatched click crosses a genuine round trip and reads correctly with no `act()`. The failure mode is a real update-scheduled-but-not-yet-committed gap: the callback demonstrably ran, and the DOM still holds the old value when the assertion reads it. Wrap every advance in `act()` behind one helper, and set `globalThis.IS_REACT_ACT_ENVIRONMENT = true` once in the browser setup file (React 19 gates `act()`'s effect behind that flag):

  ```ts
  /** Advances the fake clock and flushes the React commit it triggers. */
  async function advance(ms: number): Promise<void> {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  }
  ```

  Use the `Async` variant, never the sync `advanceTimersByTime`: only the async one drains pending microtasks between simulated ticks, which a `promise.then(() => setState(...))` needs. Narrow `toFake` to just the globals the recipe itself calls, so the driver's own machinery stays on real timers, and restore with `vi.useRealTimers()` in a `finally`. Worked example: tui-kit's `src/recipes/CopyButton/CopyButton.test.tsx`. Residual cosmetic noise, not worth chasing: a couple of `console.error` "not configured to support act(...)" lines per run even with the global set.
- Compound `getStyles` takes an options object, never a bare string. A part styling its own slot calls `getStyles()` with no arguments; a part reaching across to style a sibling slot calls `getStyles({ part: 'siblingSlotName' })`. There is no bare-string form (`getStyles('root')` is `defineComponent`/`definePolymorphic`/`defineGeneric`'s API, not `defineCompound`'s).
- `defineCompound` does NOT strip Base UI's `render` prop from a part's prop surface. Every part that wraps a Base UI primitive must both `Omit<BaseUiPartProps, 'render'>` in its TypeScript prop type AND strip `render` in its destructure at runtime (see Popover's `stripFrameworkKeys`, which strips `render` alongside the Styles API's own `classNames`/`styles`/`vars`/`attributes`/`unstyled` keys). `as` is the only public polymorphism surface soribashi compound parts expose; never let Base UI's `render` leak through as a second, undocumented one.
- `defineCompound` also does NOT strip vocabulary-axis props (`size`/`intent`/`variant`) from a part's `props` before render, the same gap section 7's rule warns about for single-component recipes. A part with a real DOM root that spreads its remaining `props` onto that element (after stripping only the Styles API's own framework keys) leaks the raw attribute (`variant="line"`) onto the DOM if it doesn't also destructure the vocabulary axes out first. Tabs' root part hit exactly this (fixed by destructuring `variant`/`size`/`intent` alongside the framework keys); Popover's root has no DOM of its own so the leak was structurally impossible there, which is why no earlier compound surfaced it. Any future compound with both a real DOM root and a vocabulary axis needs the same destructure.
- A first-time import of a new `@base-ui/react/<subpath>` can produce a false-negative test failure that looks like a real bug, not a stale-cache one. The first recipe in this package to import a given Base UI subpath (Field, importing `@base-ui/react/field` for the first time in this repo) hit a stale Vite dependency-optimizer cache: the symptom was `Invalid hook call` / `TypeError: Cannot read properties of null (reading 'useId')` deep inside Base UI's own internals (`@base-ui/utils`'s `useId`/`LabelableProvider`), from a duplicated, desynchronized React module instance, not a defect in the recipe or the framework. Fix: `rm -rf node_modules/.vite packages/ui/node_modules/.vite` and re-run; no code change is needed or was made. CI always starts cache-cold, so this specific symptom is a local-dev-only trap; a green CI run does not rule it out for you locally, and a red local run on a brand-new Base UI import is worth ruling this out before chasing a "real" bug.
- **Hand-rolled compounds** (no `@base-ui/react` underneath) are a supported shape, and most of this section's compound advice is about the Base UI wrapper, not about `defineCompound`. What still applies, what falls away, and what only bites here:
  - **Still applies, unchanged:** the `<NAME>_SLOT_KEYS` const-array convention (section 11), the options-object `getStyles({ part })` form, the vocabulary-axis destructure above, and the absence of `autoVars` (section 4) — a hand-rolled compound that declares `variants` must call `autoVars` in its own `vars` resolver like any other compound.
  - **Falls away:** there is no Base UI `render` prop to strip, so `stripFrameworkKeys` shrinks to the five Styles API keys (`classNames`/`styles`/`vars`/`attributes`/`unstyled`) with no sixth. There is also no Base UI ARIA to inventory: the recipe owns the whole WAI-ARIA pattern, including whatever roving focus or key handling it needs.
  - **Only bites here:** hooks in a part's render body are legal — the builder calls `render` from inside its own `forwardRef` body, so a part may `useState`/`useEffect`/`useRef` freely. And a part that needs its own handle on its element names that element on the render ctx (`PartRenderCtx<Props, Ctx, Variants, Slots, HTMLDivElement>`) and merges the forwarded ref with `mergeRefs` from `@soribashi/core` — never a hand-written `if (typeof ref === 'function')` callback, and never a cast (SORI-21).
  - Worked example: tui-kit's `src/recipes/ContextMenu/ContextMenu.tsx`, a fully hand-rolled compound in an adopter kit that uses no Base UI at all.
- Base UI's own ARIA provision varies per component and must be read from the installed `.d.ts`/compiled source for that specific recipe, never assumed from another recipe's precedent. Three data points from this package, all read from the pinned `@base-ui/react@1.6.0`: Tooltip's `TooltipTrigger` wires NEITHER `aria-describedby` NOR `aria-labelledby` to its popup at all (its own docs tell consumers to add a redundant `aria-label` on the trigger instead), so Tooltip.tsx hand-wires the standard WAI-ARIA tooltip pattern itself; Dialog provides its whole ARIA surface for free (title/description association, focus containment via `FloatingFocusManager`), the recipe adds nothing; Accordion sits in between, providing the trigger/panel ARIA association (`aria-expanded`/`aria-controls`/`aria-labelledby`/`role="region"`) for free but wiring NONE of the arrow-key movement between headers (Base UI's installed version dropped that piece of the pattern; `AccordionRootProps.orientation`/`.loopFocus` are both marked `@deprecated`, following the APG guidance update that removed roving focus), so Accordion.tsx owns arrow-key navigation itself (`focusAdjacentTrigger`) the same way Tooltip owns its own ARIA-wiring gap, just for a different half of the pattern. Read the installed source for the specific part you're wrapping; do not extrapolate from whichever compound you touched last.

## 11. Slots vs parts on compounds, and the const-array `slotKeys` convention

A compound's Base UI **parts** (`Trigger`, `Content`, `Tab`, `Panel`, ...) are not the same set as its stylable **slots** (whatever `getStyles()` calls address). `RecipeMeta.slots` used to be derived from part names, which is wrong: `defineCompound` cannot recover the real slot set by unioning parts with CSS classes, because that union can neither add a slot that is styled but has no corresponding part, nor drop a part that has no style slot of its own. Popover proves both directions at once: its `positioner` is a real style slot (`getStyles()` wires it so a future `.extend({ classNames })` can target it) but is not a public part; its `content` is a public part but composes positioner/popup/arrow internally rather than being a style slot itself.

The convention: declare a `const SLOT_KEYS = [...] as const` array once, derive the slot-key type union from it, and pass the array itself as `slotKeys` to `defineCompound`, so the runtime value and the compile-time type cannot drift:

```ts
// Popover.tsx
const POPOVER_SLOT_KEYS = [
  'root', 'trigger', 'positioner', 'popup', 'arrow', 'title', 'description', 'close',
] as const;
type PopoverSlotKey = (typeof POPOVER_SLOT_KEYS)[number];

const PopoverCompound = defineCompound({
  name: 'Popover',
  classes,
  slotKeys: POPOVER_SLOT_KEYS,
  // ...
});
```

Tabs follows the identical shape (`TABS_SLOT_KEYS`, `indicator` is a styled slot Base UI's own `Tabs.Indicator` composes with no independent public part). Every future compound declares its own `<NAME>_SLOT_KEYS` const array; there is no way to make this derivable instead, so do not try.

## 12. The multi-slot single-component pattern

A recipe can be multi-slot (several `getStyles(slot)` targets styling several elements) without being a compound. Every multi-slot recipe before this slice was also a compound (Popover, Tabs); Alert and Checkbox broke that correlation: Alert renders one public element (`role="alert"`, category 1, `defineComponent`) with five style slots (`root`/`icon`/`title`/`body`/`close`), and Checkbox similarly (category 4, `defineComponent`, four slots: `root`/`control`/`indicator`/`label`). Neither has an open/close lifecycle or independently addressable parts a consumer could import separately (there is no `Alert.Icon`), which is exactly what would make it a compound instead. Don't reach for `defineCompound` just because a recipe needs more than one style target; reach for it only when the recipe has genuinely separate, independently-composable parts.

(Badge, landed the same slice, is not an instance of this pattern: it declares a single `root` slot, same as Button, and is genuinely polymorphic (`definePolymorphicComponent`, `defaultElement: 'span'`), not multi-slot.)

**A second, slot-targeted class prop goes through `getStyles`'s per-call `className` option.** The consumer's own `className` prop is folded into the `root` selector and nowhere else (`rootInstanceClass = isRoot ? config.className : ''` in `packages/factory/src/hooks/use-styles.ts`) — which is the fact that forces the "which element is root" decision in the first place. A multi-slot recipe that needs a class prop for a NON-root slot passes it as an option on that slot's own `getStyles` call, where `callSiteClass = options?.className ?? ''` merges it with the slot's own class rather than replacing it:

```tsx
// Modal.tsx (tui-kit) — `className` lands on the frame (root); the scrim gets its own prop
<div {...getStyles('overlay', { className: overlayClassName })} />
```

This is the sanctioned answer for any recipe with more than one class prop; do not hand-concatenate class names or reach for `cn()` around a `getStyles` result to get there. All of `GetStylesOptions` (`className`, `style`, `classNames`, `styles`, `active`, `variant`) is forwarded the same way, on the compound options-object form (`getStyles({ part: 'overlay', className })`) as well as the bare-string form above.

## 13. A recipe's variant set comes from the builder's `variants` tuple, not `extend({ vocabulary })`

A recipe declares which `variant` values it supports through its builder config's `variants` tuple, e.g. Alert/Badge's `['filled', 'outline', 'subtle']` or Tabs' `['line', 'pill', 'enclosed']`. `Recipe.extend({ vocabulary })` is the separate, consumer-side override mechanism (a theme author replacing or extending the vocabulary's *values* at `createTheme()` time); it is not how a recipe itself opts into a variant axis.

Two concrete things key on the builder-config tuple, not on `extend`:

1. **`RecipeMeta.variants`**, and therefore the generated manifest's and registry item's `variants` field (`config.variants ?? []` in every builder). A recipe that declares its variant set only via `Recipe.extend({ vocabulary })` and never populates the builder's own `variants` tuple reports an empty variants list to the manifest, even though the recipe visibly supports variants at runtime.
2. **Dev validation's recipe-local path** (`validateVocabularyProps` in `validate-vocabulary-props.ts`, called from every builder). Its `localVariants` parameter is fed straight from `config.variants`, and is checked *before* the registry's global vocabulary (`!resolveComponentVocab(componentName, 'variant')` guards the fallback to global). That ordering is what stops a recipe-local variant value from false-positiving against theme-wide `variant` values it was never meant to be validated against. A recipe with no local tuple falls through to the global check instead, which is the wrong vocabulary for a per-recipe axis.

`data-variant` stamping is NOT gated on the tuple alone, and the previous version of this section said otherwise; read `packages/factory/src/data-attrs.ts` directly rather than trusting this summary if you need certainty. The real gate is `if (hasVariants || axes.includes('variant'))`, an OR: `hasVariants` comes from the builder's `variants` tuple being non-empty, but a recipe that opts `'variant'` into `vocabularyAxes` gets `data-variant` stamped through the second branch regardless of whether it ever populates a `variants` tuple. So a recipe with `vocabularyAxes: ['variant']` and an empty (or absent) `variants` tuple still gets a `data-variant` attribute at runtime; what it loses is the manifest entry and the dev-validation guard above, not the attribute itself. Always declare the tuple on the builder config regardless, both because the manifest/registry need it and because dev validation needs it to check the right vocabulary.

## 14. Every new colour-bearing recipe declares its own variant subset

The theme's `variant` vocabulary has five values (`filled`/`outline`/`subtle`/`ghost`/`link`), but a new recipe should not inherit all five by default. Alert and Badge both ship `['filled', 'outline', 'subtle']`: `ghost` and `link` have no sane rendering for an alert banner or a badge chip. Inheriting the full five would commit CSS, contrast-matrix cells, and visual baselines to pairings no consumer actually wants. Decide the recipe's real variant subset first, the way Alert's `ALERT_VARIANTS` const documents the exclusion, and declare only that subset on the builder's `variants` tuple (section 13).

## 15. The portal-escapes-scope obligation

A portalled surface (Popover's popup, Select's listbox) renders under `<body>` by default, escaping any `.tenant-*` or `.dark` scoped wrapper an ancestor established. Every recipe with a portal exposes a `container` prop that forwards to the underlying Base UI `Portal`'s `container` (see Popover's `ContentProps.container` and Select's equivalent), so a consumer (or a fixture) can re-anchor the portal inside the scope it actually needs to render in.

This matters concretely for `RESKIN_FIXTURES` (`packages/ui/src/conformance/reskin-fixtures.tsx`): every fixture receives a `scopeEl` argument, and a fixture for a recipe with a portal MUST forward it into that part's `container` prop (see the `Popover`/`Select` entries there). If a fixture doesn't forward `scopeEl`, the portalled content renders outside the reskin guard's scoped wrapper entirely, and the guard ends up comparing the base theme against itself: it can pass even though the recipe's portalled content never actually re-skinned. This is a silent false pass, not a loud failure, so it's easy to miss without knowing to look for it.

## 16. Stateful contrast cells: mount-time props only

A `SMALL_COVERAGE` entry in `contrast-matrix.test.tsx` mounts once and is read twice: once in light scheme, once after toggling to dark. If a cell's state were established by an interaction inside one scheme's `it` (e.g. clicking a checkbox to check it), that interaction would leak into the other scheme's read (the same DOM element, still mounted) or be entirely missing from whichever scheme's `it` ran first. Express state through mount-time props only: `defaultChecked`, `indeterminate`, `defaultValue`, `defaultOpen`, never a simulated click/keypress inside the cell's own test body. Checkbox's own entry is the worked example: it renders one `<Checkbox defaultChecked>` and one `<Checkbox indeterminate>` side by side at mount, rather than rendering one checkbox and interacting with it to flip states.

## 17. Base UI part names and props are read off the installed types, never from memory

Every Base-UI-backed recipe in this package documents, in a comment near its type definitions, exactly which files under `node_modules/@base-ui/react/<component>/` were read to enumerate its real parts, props, and data attributes at implementation time (see Checkbox.tsx's comment citing `checkbox/{index.parts,root/CheckboxRoot,indicator/CheckboxIndicator}.d.ts`, and Popover's/Tabs' equivalents). Base UI's part surface, prop names, and data-attribute names are exactly what its shipped `.d.ts` files say for the pinned version in this repo's lockfile, not what a similar-sounding Radix or Headless UI API would suggest, and not what an earlier Base UI version had. Read the installed types before writing a part wrapper; do not guess from memory or from another library's naming.

## 18. Behavioural assertions over emissive assertions

A test that only asserts *what CSS text got emitted* (a class was applied, a `data-*` attribute exists, a style string contains a substring) can pass while the actual rendered behaviour is completely broken, because it never observes what the browser actually does with that CSS. Slice 2's Grid recipe is the worked example: a test asserting emitted style text on Grid's responsive `cols` prop passed across eleven task reviews while the responsive column count never actually took effect in a real layout, because nothing in the suite measured actual rendered geometry (computed `gridTemplateColumns`, actual element positions) at any viewport width.

Prefer assertions that observe real computed/rendered behaviour: `getComputedStyle(el).<property>` after a real DOM mount, an actual click/keypress and its resulting `aria-*` state, a real measured contrast ratio, a real screenshot. Checkbox's own indeterminate-vs-checked test in this slice follows the same rule: it asserts computed `display` on the two candidate SVGs and asserts the two states show visibly different glyphs, rather than asserting that a `data-indeterminate` attribute merely exists.

## 19. The two-mode Field anatomy pattern

`Field` (`packages/ui/src/recipes/Field/Field.tsx`) is two things at once: a public compound (`Field.Root`/`Field.Label`/`Field.Description`/`Field.Error`, `defineCompound` over `@base-ui/react/field`, four slots that are simultaneously real Base UI parts and real style slots) a consumer can hand-compose directly, AND the internal substrate every form control with label/description/error convenience props (TextInput, Textarea, Switch, RadioGroup) renders for itself, unexported and invisible to their own consumers. TextInput.tsx is this slice's reference implementation; the other three copy its render shape.

**The conditional `Field.Root` rule.** A control with `label`/`description`/`error` convenience props does NOT always render `Field.Root`. It renders ONLY the bare control (no wrapper at all) when none of the three props are present, and renders `Field.Root` wrapping `Field.Label`/the control/`Field.Description`/`Field.Error` (in that order) only when at least one is. This is a real branch in every consuming control's render body (`const hasAnatomy = label != null || description != null || error != null;`), not a cosmetic default. Known consequence of bare mode: with no `root` element, `getStyles('root')` is never called, so `data-size`/`data-intent` never land anywhere in bare mode either; sizing and colour still ride the control's own dimension/intent vars (`--sb-textinput-h`, `--sb-switch-checked-bg`, ...) regardless of whether the data attribute is present.

**Mutual exclusivity, enforced with a dev warning, not a suppression.** Giving a control anatomy props while it is already nested inside an ancestor `Field.Root` (a consumer hand-composing Field themselves) is a contract violation: the control does NOT suppress its own internal `Field.Root` in that case, which would silently nest two `Field.Root`s and break Base UI's label/control association. Instead it `console.warn`s in dev only (`process.env.NODE_ENV !== 'production'`), naming itself in the message (e.g. "TextInput received label/description/error inside a hand-composed Field.Root..."). This is the actually-observed, pinned behaviour (see TextInput.test.tsx's/Switch.test.tsx's nested-warning cases), not a description of intended-but-unbuilt behaviour.

**`FieldAnatomyContext`.** `createContext(false)`, exported from `Field.tsx` itself (deliberately NOT re-exported from the package barrel), set to `true` by `Field.Root`'s own render via `<FieldAnatomyContext.Provider value={true}>`. Every anatomy-capable control reads it with a bare `useContext(FieldAnatomyContext)` call directly inside its own `render` function body, legal despite `render` being a plain config callback rather than a component: the builder calls `config.render(...)` as an unconditional, synchronous function call from a fixed point in its own render body, functionally identical to inlining the hook call there (the same reasoning `defineCompound`'s own `useContext` calls inside each part's `forwardRef` render function already rely on). Soribashi's own context, not Base UI's internal field context: Base UI's is not a public import surface, and this package controls both ends of the contract anyway.

**`data-layout="row"`.** Field owns two layouts, a default column stack and a row layout (label beside the control, the natural reading order for a switch), selected by a plain data attribute rather than a `layout` prop, specifically so `Field.module.css`'s `.root[data-layout='row']` rule wins over the base `.root` rule by CSS specificity, never by source order (cross-file same-specificity order is not deterministic under Vite CSS module concatenation). Switch is the one recipe that stamps it today, on its own internal `Field.Root` in anatomy mode: `<Field.Root invalid={error != null} data-layout="row" {...getStyles('root')}>`.

Every anatomy-capable control also sets `invalid={error != null}` on its internal (or a consumer's hand-composed) `Field.Root`; Base UI propagates that down to a real `data-invalid` attribute on the nested control automatically (confirmed against the installed `@base-ui/react/input`/`field` `.d.ts` files; see TextInput.tsx's own doc comment), so a control's own `.input[data-invalid]`-style CSS rule keys on a real Base-UI-stamped attribute, not a soribashi-invented one.

## 20. Cross-recipe imports create registry dependencies

A recipe that imports another recipe (Field, so far the only one imported this way) does so with the mandated sibling-relative, single-quoted form: `from '../Field/Field.tsx'`, never a barrel import (`from '../../index.ts'` or `from '@soribashi/ui'`) and never double-quoted. `derive.ts`'s `extractRecipeDependencies` detects this with a regex matching literally `from '../<Uppercase-Name>/'` in the recipe's own `.tsx` source; a double-quoted import, a barrel import, or an import missing the sibling-directory shape goes undetected (the capture group requires an uppercase first path segment right after `../`, which is also what distinguishes a sibling-recipe import from `'../../builders.ts'`). **This detection is single-quote-only by construction, a real, known limitation, not a temporary gap** (see STATUS.md's future list).

Every sibling recipe name a `.tsx` imports this way ends up, lowercased, in that recipe's `ManifestEntry.registryDependencies`, which `generate-registry.ts` copies straight into the registry item's own `registryDependencies` field (the shadcn schema's own dependency-declaration field). TextInput was the first recipe in this package with a non-empty one: `registryDependencies: ["field"]`, because `TextInput.tsx` imports `Field`/`FieldAnatomyContext` from `'../Field/Field.tsx'`. Textarea, Switch, and RadioGroup each import `Field` the same way and carry the identical `["field"]` dependency; TextInput is simply the one of the four that is also a `SMOKE_ITEMS` member, so it is the one whose dependency chain the registry smoke actually exercises.

**The empirical CLI verdict, established fact as of this slice.** shadcn 4.15.0 resolves a BARE-NAME `registryDependencies` entry (e.g. `"field"`, the form the committed `registry/textinput.json` correctly keeps, since that is the right shape for the eventual published-registry story) REMOTELY, against the real hosted shadcn registry, and hard-fails the WHOLE `add` invocation (exit 1, zero files written, even for the requesting item) the instant that lookup 404s, even when the dependency's own file is separately, explicitly co-listed on the same CLI invocation. The relative-path form (`"./registry/field.json"`) resolves LOCALLY instead and succeeds, with the CLI vendoring the dependency's own files as part of the same invocation.

Because of that verdict, `registry-smoke.ts` never rewrites the committed registry files: it rewrites its own SCRATCH COPIES of every item's `registryDependencies` to the relative-path form (`scratchRegistryDependencies`) before writing them into the scratch project, and it computes and vendors the full transitive dependency closure of `SMOKE_ITEMS` (`resolveDependencyClosure`, a work-queue walk, not a fixed one-level lookup), not `SMOKE_ITEMS` alone. `field` itself is never in `SMOKE_ITEMS` and is never asserted or rendered directly; its own proof is structural (the vendored `TextInput.tsx`'s `'../Field/Field.tsx'` import resolving and the Vite build succeeding), not a bundle-marker check.

## 21. Skeleton's frozen-animation visual idiom

Skeleton is the first recipe whose `.module.css` carries a perpetually-running `animation` (the pulse) rather than only a one-shot enter/exit `transition`. `transition: none` alone does nothing for an `animation` declaration; they are separate CSS mechanisms, so a screenshot taken without freezing it would land on whatever opacity the keyframe happened to be interpolating through at that exact instant, different on every run. `Skeleton.visual.test.tsx` handles this with its own local `<style>` block (a `NO_TRANSITION_CLASS` constant local to that file, unrelated to any other file's constant of the same name) whose rule sets BOTH `transition: none !important` AND `animation: none !important` on the class and every descendant, pinning the capture to the animation's resting frame (`opacity: 1`, the keyframe's `from`).

This is a DIFFERENT mechanism from `installNoTransitionStyle()` in `packages/ui/src/a11y/matrix-harness.tsx`, which several recipes' own browser-tier `.test.tsx` files also reach for whenever they need a settled computed-style read (Button's neutral-wash test, Tooltip's/Dialog's/Popover's/Select's own settle-before-measuring cases, alongside `contrast-matrix.test.tsx` itself). No `.visual.test.tsx` file imports it, though: its installed rule covers `transition: none !important` only, no `animation` override, because no browser-tier or contrast-matrix use case before Skeleton ever needed one. A future colour-bearing recipe with its own perpetual `animation` (not just a `transition`) that needs contrast-matrix coverage would need the matrix harness extended the same way Skeleton's own visual test was; that extension does not exist yet.

## 22. Variant colors

A colour-bearing recipe never hand-writes per-variant color CSS. Variant colors come from the theme's intent resolver, threaded into the recipe's stylesheet via `autoVars` (section 4) — consume `--{component}-bg`/`-color`/`-border`/`-hover` in the `.module.css`, never a literal or a re-derived `color-mix` of your own.

**The canonical variant menu** — `filled` / `light` / `outline` / `subtle` / `default` / `transparent` / `link` — is Mantine-derived: `light` ≈ Mantine's `light`, `subtle` ≈ Mantine's `subtle`, and `default` is the neutral bordered-surface button (Mantine has no equivalent by that name). Section 14 covers picking a recipe's own subset of this menu; this section is about where the colours for whichever subset a recipe picks actually come from.

**Two resolver branches, both exported for extension.** `default-intent-resolver.ts` exports `rampVariantColors` (a multi-shade palette, derives hover/active by mixing the resolved background toward black) and `singleShadeVariantColors` (a palette with one tone per intent, no ramp to derive from). `defaultIntentResolver` picks between them per-intent by inspecting `theme.tokens.colors` at render time. A custom resolver that wants to add a variant, or tweak one, calls the relevant branch helper and patches the returned fields — it never re-derives the state math (`color-mix` weights, wash formulas) from scratch. See either branch's own doc comment for the exact per-variant weights before touching either.

**Hover changes background only.** `hover` is the sole background-transition channel; `hoverColor` is the sole text-transition channel, used only by variants whose text color doesn't already match hover's background contrast (`outline`, `link`). Never invent a second hover-background key or fold a color change into `hover`'s value.

**Registration, not optional.** Every recipe that declares a color-bearing variant registers in `packages/ui/src/a11y/matrix-classification.ts` (section 8) — `'covered'` with real contrast cells, or an `{ exempt: '...' }` reason. There is no third option; `matrix-guard.test.ts` fails by name on a recipe with neither.

**The contrast gate itself** lives at `@soribashi/core/testing` (the browser-tier harness: `describeColourGrid`, `installNoTransitionStyle`, `MIN_CONTRAST`) with the pure math split out at `@soribashi/core/testing/contrast` (`contrastRatio`, `relativeLuminance`, `parseColor`, `compositeOver`) so a consumer can reuse the math without pulling in a browser-only harness.
