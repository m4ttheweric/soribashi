# Soribashi: Implementation Status

> **Current as of 2026-07-27.** Slice 4 (below) is the current top record: the themed-builders spike lands (public `size`/`intent` now narrow to the theme's vocabulary literals), cross-recipe registry dependencies are derived and proven through the real shadcn CLI, and eleven new recipes ship, including the Field anatomy contract four form controls compose against, taking `@soribashi/ui` from seventeen recipes to twenty-eight. It sits above the slice 3 record, the slice 2 record, the slice 1b record, the recipe-pilot record (2026-07-01), and the v1 Mantine-adaptation foundation record (2026-04-25), all kept unchanged further down this file.

## Slice 4: the themed-builders spike, cross-recipe registry dependencies, the Field anatomy contract, and eleven new recipes (2026-07-27)

Slice 3 (below) closed at seventeen recipes across all four authoring categories but left two framework-level gaps recorded as future work: `size`/`intent` were bare `string` on every recipe's public type (no recipe called `makeBuilders`), and nothing derived a cross-recipe dependency when one recipe's `.tsx` imported another. Slice 4 opens by closing both, then lands eleven new recipes, five of them (Field itself, plus TextInput, Textarea, Switch, and RadioGroup) built on a new shared anatomy contract, taking `@soribashi/ui` from seventeen recipes to twenty-eight. Branch `feat/slice-4-components`, from `main` @ `7022c21` (slice 3 merged), 25 commits, 14 numbered tasks executed in order: a P0 debt sweep (task 1, closing out three items slice 3's whole-branch review left open), the two framework prerequisites (tasks 2-3), the five Field-anatomy recipes (tasks 4-8), three more Base-UI-backed compounds/controls (tasks 9-11), three more category-1 primitives (task 12), the workshop (task 13), and this closing docs task (task 14).

### What landed

- **The themed-builders spike landed (task 2), resolving slice 3's recorded narrowing gap.** `packages/ui/src/builders.ts` calls `makeBuilders<typeof uiTheme>()` (a type-only import of `uiTheme`: no runtime edge, no import cycle, and deliberately no `registerTheme` call anywhere in this package) and re-exports the four builder functions with `uiTheme`'s vocabulary literals baked into their return types. All 28 recipes in the package import their builder function from `'../../builders.ts'`, never `@soribashi/core` directly (every other framework export a recipe needs, `autoVars`, `type PartRenderCtx`, and so on, is unaffected and still comes from `@soribashi/core`). `packages/ui/test/vocabulary-narrowing.typecheck.tsx` is the compile-time pin (never executed; `bun run typecheck` is the gate): four `@ts-expect-error` assertions, one per builder kind, that fail loudly ("Unused '@ts-expect-error' directive") the moment narrowing regresses. Two follow-on effects: `generate-registry.ts`'s new `rewriteBuildersImport` rewrites a registry item's embedded `.tsx` content's import to `'../builders.ts'` (the path a vendored consumer's copy actually needs, one directory up from `'../../builders.ts'`) without touching the committed recipe source itself; and `registry-smoke.ts`'s new `buildConsumerBuildersTs` writes a consumer-side builders module into the scratch project (vocabulary interpolated live from the committed `packages/ui/manifest.json`), the same shape a real vendoring consumer would author by hand.
- **Cross-recipe registry dependencies are derived and proven through the real CLI (task 3).** `derive.ts`'s new `extractRecipeDependencies` scans a recipe's `.tsx` source for the mandated sibling-relative, single-quoted form (`from '../<Name>/...'`) and lowercases every match into that recipe's `ManifestEntry.registryDependencies`, which `generate-registry.ts` copies into the registry item's own `registryDependencies` field. TextInput was the first recipe with a non-empty one, `["field"]` (task 5, which also wired the smoke chain below); Textarea, Switch, and RadioGroup each import `Field` the same way and carry the identical `["field"]` dependency, so four of the 28 recipes have a non-empty `registryDependencies` at this branch's HEAD, all pointing at the same dependency. Only TextInput is exercised through `registry-smoke.ts`, since it is the sole one of the four in `SMOKE_ITEMS`. The empirical CLI verdict this task established as fact: shadcn 4.15.0 resolves a bare-name `registryDependencies` entry REMOTELY against the hosted shadcn registry and hard-fails the WHOLE `add` (exit 1, zero files written, even for the requesting item) the instant that lookup 404s, even when the dependency's own file is separately, explicitly co-listed on the same invocation; the relative-path form resolves LOCALLY and succeeds, with the CLI vendoring the dependency's files itself. Because of that verdict, `registry-smoke.ts` never touches the committed registry files: it rewrites its own scratch copies of `registryDependencies` to the relative-path form (`scratchRegistryDependencies`) and computes and vendors the full transitive dependency closure of `SMOKE_ITEMS` (`resolveDependencyClosure`), asserting bundle markers for `SMOKE_ITEMS` only (`field` proves itself structurally, via the vendored `TextInput.tsx`'s import resolving and the build succeeding, not a bundle-marker check).
- **Field (task 4), the compound form-field anatomy substrate, and the two-mode contract four form controls now share.** `Field` (`defineCompound`, four slots that are simultaneously real Base UI parts and real style slots: `root`/`label`/`description`/`error`) is both a public compound a consumer can hand-compose directly and the internal substrate TextInput/Textarea/Switch/RadioGroup render for themselves. Every anatomy-capable control renders ONLY the bare control when none of `label`/`description`/`error` are present, and `Field.Root` wrapping the full anatomy only when at least one is; giving a control anatomy props while nested inside a hand-composed ancestor `Field.Root` triggers a dev-only warning (does not suppress the control's own internal `Field.Root`, which is the actually-observed, pinned behaviour, not silent auto-correction). `FieldAnatomyContext` (a plain `createContext(false)`, exported from `Field.tsx` only, not the barrel) is the detection seam. `data-layout="row"` (Field owns two layouts, selected by a data attribute rather than a prop specifically so CSS specificity, not source order, decides the winner) is Switch's own addition to the shared contract.
- **TextInput (task 5), the reference implementation**, plus **Textarea (task 6, multiline via `<Input render={<textarea />} />` since Base UI ships no separate Textarea export; its `value`/`defaultValue` stay typed against `Input.Props`, an input-shaped type, even though a real `<textarea>` is what mounts)**, **Switch (task 7, `data-layout="row"`'s one consumer)**, and **RadioGroup (task 8, category 4's second data-driven control after Select)** round out the five Field-anatomy recipes. RadioGroup started on `defineGenericComponent` during authoring, then was converted to `defineComponent` against a fixed `RadioGroupItem` type per a locked spec decision (fix round 1 additionally constrained its public `getValue` override to return `string`, closing a real silent-runtime-break gap a reviewer found: the inherited accessor type allowed a non-string return with no compile or runtime warning).
- **Three more Base-UI-backed compounds, each a fresh data point on how much ARIA Base UI provides per component.** Tooltip (task 9, category 2, the second transient overlay after Popover): Base UI's `TooltipTrigger` wires NEITHER `aria-describedby` NOR `aria-labelledby` to its popup at all, so the recipe hand-wires the standard WAI-ARIA tooltip pattern itself, gated on live open state (fix round 1 gated it correctly on open state and added axe coverage). Dialog (task 10, category 2, the package's first MODAL overlay): Base UI provides its whole ARIA surface for free (title/description association via a live two-way store binding, full focus containment via `FloatingFocusManager`), the recipe adds nothing. Accordion (task 11, category 3, the second persistent compound after Tabs): a genuine mix of both precedents, providing the trigger/panel ARIA association for free but wiring NONE of the arrow-key movement between headers (Base UI's installed version dropped that piece of the pattern; `AccordionRootProps.orientation`/`.loopFocus` are both `@deprecated` per the APG guidance update removing roving focus), so the recipe owns arrow-key navigation itself.
- **Three more category-1 primitives (task 12, batched): Avatar, Skeleton, Divider.** Avatar's `SMALL_COVERAGE` contrast cell deliberately mounts fallback-only (no `src`), the only composition with zero dependency on network/timer behaviour across environments. Skeleton is the first recipe whose stylesheet carries a perpetually-running `animation` rather than only a one-shot `transition`; `Skeleton.visual.test.tsx` freezes it with its own local style block (`transition: none !important` AND `animation: none !important`, both needed since they are separate CSS mechanisms), distinct from the a11y matrix tier's own `installNoTransitionStyle()` (transitions only). Divider uses plain DOM, not Base UI's `separator` part (a single non-semantic `<div>` with no label anatomy, so using it would save nothing); a fix round corrected a `biome-ignore-all` suppression that had been placed at file scope for one of three needed a11y rule exemptions to a correctly-scoped line-level one, after a reviewer falsified the original placement's stated justification empirically.
- **The `colour-via:` exemption format governs all three of this task's new colour-adjacent exemptions.** Field's exemption points at TextInput's/Textarea's own `SMALL_COVERAGE` cells (which render Field's label/description/error parts and measure them on their real backdrops); Skeleton's points at its own visual test (a decorative surface with no text has no foreground/background pairing for the contrast matrix to measure); Divider's points at Text's `dimmed` `SMALL_COVERAGE` cells (the same `--text-muted`-on-canvas pairing Divider's own optional label renders). Each points at a different KIND of proof; the guard only requires pointing at where the proof lives.
- **The workshop (task 13) gained a page per new recipe**, plus a `FormPage` proving the two-mode contract side by side (a hand-composed `Field.Root` column next to a convenience-props column, pixel-identical anatomy in both), and a `Dialog` block added to each tenant card on the multi-tenant demo (confirmed by eye: Acme's dialog popup carries a visibly larger/softer corner radius than Contoso's, the same scoped-token mechanism already proven for Popover/Select; the third, extra-`.dark`-wrapped tenant card's Dialog renders fully dark independent of the page-level toggle). The same task's eyeball pass is also the source of the Switch thumb finding recorded below.
- **`@soribashi/ui` now has 28 recipes across all four authoring categories**: 16 category-1 styled primitives (Alert, AspectRatio, Avatar, Badge, Box, Button, Center, Container, Divider, Grid, Group, Paper, Skeleton, Stack, Text, Title), 3 category-2 transient overlay compounds (Dialog, Popover, Tooltip), 2 category-3 persistent compounds (Accordion, Tabs), and 7 category-4 form controls (Checkbox, Field, RadioGroup, Select, Switch, Textarea, TextInput).
- **The authoring skill (`.claude/skills/authoring-a-recipe/SKILL.md`) is current with the above.** Its old "known limitation: size/intent are bare string" section (now wrong, since the spike landed) is rewritten to describe the resolved mechanism instead; three new sections cover the two-mode Field anatomy pattern, cross-recipe registry dependencies, and Skeleton's frozen-animation visual idiom; the `colour-via:` bullet gained the three worked examples above; two new Traps bullets cover the stale-Vite-dep-cache false negative (hit twice this slice, first on Field's `@base-ui/react/field` import, again on Avatar's `@base-ui/react/avatar` import; fix: `rm -rf node_modules/.vite packages/ui/node_modules/.vite`) and Base UI's per-component ARIA-provision variance (the Tooltip/Dialog/Accordion data points above).

### Gate state (2026-07-27, branch `feat/slice-4-components`, fresh full run at the end of this task)

- `bun run test`: 1478 tests passed across 126 files.
- `bun run typecheck`: clean.
- `bun run lint`: 0 errors, 440 baseline warnings (identical to slice 3's baseline; pre-existing `noExplicitAny`, not part of this slice's scope).
- `bun run smoke:registry`: run at this task's HEAD, **PASS**, vendoring path `cli` (the real shadcn CLI, no fallback). `SMOKE_ITEMS` is now `[button, stack, checkbox, textinput]` (grown from three to four since slice 3, per task 5); the dependency closure adds `field` (not asserted, not on the CLI invocation itself, proven structurally by `textinput`'s vendored import resolving and the build succeeding). All four asserted bundle markers (`--sb-button-h`, `--sb-stack-gap`, `--sb-checkbox-size`, `--sb-textinput-h`) were found in both the built CSS and JS.
- `bun run test:visual`: **not run this task.** Eleven new recipes' visual baselines exist only as gitignored local (darwin) screenshots created and reviewed, then deleted, during tasks 4-12's own implementation passes (per the authoring skill's rule against committing non-Linux baselines); none are committed. Regenerating and committing Linux baselines for slice 4's eleven recipes via the pinned Docker image is the next task, not this one; reporting that explicitly rather than implying a visual sweep happened here.

### Deliberately future (not yet done)

- **Checkbox's future Field migration (recorded decision).** Checkbox predates the Field anatomy contract and was not migrated to it this slice: it still has no `description`/`error` slots and uses its own hand-rolled `<label>` containment for label association (`Checkbox.tsx` imports neither `Field` nor `FieldAnatomyContext`), unlike TextInput/Textarea/Switch/RadioGroup. Recorded here as a real gap, not an oversight; migrating it is future work.
- **Switch's unchecked-thumb light-mode visibility, confirmed by workshop eyeball, still open at this HEAD.** Task 13's eyeball pass over `SwitchPage` found the unchecked thumb (`color: var(--surface-default)`, an off-white) "faint, close to invisible" against the light canvas, distinguishable mainly by the track's 1px border; dark mode reads better but still low-contrast. Reported, not fixed (out of scope for task 13's own brief). Queued for this slice's fix wave; if that fix wave resolves it, this record should be updated in place rather than left stale.
- **Dialog's `.popup` centering loses its side gutter below a 384px (`--breakpoint-xs`) viewport.** The percentage-free `position: fixed; inset: 0; margin: auto; max-inline-size/max-block-size: var(--breakpoint-xs)` technique (`Dialog.module.css`, documented in its own comment) only re-solves the auto margins to an even split once `max-*-size` actually clamps the natural fill dimension. Below 384px on either axis, the natural fill (100% of the viewport) is already under the clamp, so it never engages: the popup fills edge-to-edge with zero margin instead of degrading gracefully with a minimum inset. Content overflow itself is still handled (`overflow: auto` on `.popup`); this is a lost gutter, not clipped content. Not yet addressed; a `min()`-based responsive inset is the likely fix.
- **Overlay `Content` parts silently discard a consumer's raw `className`/`style`, on all three composed-overlay compounds (Popover, Tooltip, AND Dialog).** Each recipe's `content` part destructures `className`/`style` off `props` and never applies them anywhere (`Popover.tsx`/`Tooltip.tsx`/`Dialog.tsx`, each around their own `content` part's render). Structurally understandable, since `Content` composes more than one DOM element (Positioner+Popup+Arrow for Popover/Tooltip, Backdrop+Popup for Dialog) and there is no single natural target for a bare `className`/`style` the way the Styles API's own `classNames`/`styles` config prop has, but the discard is currently silent, with no dev warning. Not yet addressed.
- **Cross-recipe import detection is single-quoted-only, by construction.** `derive.ts`'s `extractRecipeDependencies` regex matches literally `from '../<Uppercase-Name>/'`; a double-quoted import or a barrel import goes undetected. Real, known, not yet hardened.
- **Textarea's `value`/`defaultValue` stay typed against `Input.Props`, an input-shaped type, even though a real `<textarea>` is what mounts.** Base UI ships no separate Textarea export; both sanctioned routes (`Input.Props`, `Field.Control.Props`) fix their `ElementType` generic to `'input'` regardless of what `render` actually mounts, so neither declares `rows`/`cols` (Textarea adds `rows` itself) and the value-prop typing stays input-shaped rather than textarea-shaped. Documented in `Textarea.tsx`'s own doc comment as a real looseness, not fixed this slice.
- **Still open from earlier slices, unchanged:** the three `as any` `stylePropsStyle` casts in `define-component.tsx`/`define-polymorphic-component.tsx`/`define-generic-component.tsx`; `defineCompound` not stripping Base UI's `render` prop itself (every compound still strips it by hand, per-part); the `fw` identity resolver silently no-oping an invalid token-key string; the contrast matrix's light-scheme measurement relying on declaration order (Popover's `SMALL_COVERAGE` cell); and publishing (`@soribashi/core`/`@soribashi/ui` still `version: 0.0.0`, `private: true`, unpublished).

---

## Slice 3: Alert, Badge, Checkbox, Tabs, Select, completing the four authoring categories (2026-07-26)

Slice 2 (below) shipped ten native layout recipes and closed out category 1's layout surface, but `@soribashi/ui` still only reached two of the four authoring categories (1, pure styled primitive, and 2, transient overlay compound via Popover). Slice 3 lands one recipe per remaining shape plus two more category-1 colour-bearing recipes, taking the package from twelve recipes to seventeen and, with Tabs (category 3) and Select (category 4), proving every authoring category in `@soribashi/ui` itself rather than only at the framework level.

Branch `feat/slice-3-components`, from `main` @ `0bc37ac`, 34 commits merged to main, all 12 planned tasks executed in strict order: the 9 recipe/workshop tasks, this closing docs task, task 11 (committing Linux visual baselines for the five new recipes), and task 12 (the whole-branch review). (This section's original count, 23, was taken at this closing docs task, before task 11's baseline commit, task 12's whole-branch review, its fix wave, and the user-requested hover-wash work that followed all landed; see the post-review addendum below for what those added.) Task 11 landed 14 new baselines; 30 Linux baselines are tracked across the package in total, 0 darwin (darwin baselines are gitignored, per the platform-suffix rule in the authoring skill).

### What landed

- **Two framework prerequisites, resolved before any recipe landed (tasks 1 and 2).** `defineCompound` gained a runtime slot-key source distinct from its parts map (`slotKeys`, backed by a `const SLOT_KEYS = [...] as const` array a compound declares itself), closing the gap flagged in slice 1b's future list ("compound slot metadata needs a runtime source on `defineCompound`"). `bun run smoke:registry`'s scratch `pkg.dependencies` now derives from `item.dependencies` instead of hardcoding `@soribashi/core`, closing the gap flagged in slice 2's future list. Separately, later in the slice (task 6, alongside Checkbox), rewriting the smoke's vendored `workspace:*` deps to `file:` made the real `shadcn` CLI path work for a Base UI-backed item for the first time; not one of the two prerequisites itself, but the same registry-smoke machinery.
- **Alert** (category 1, `defineComponent`, 5 style slots: `root`/`icon`/`title`/`body`/`close`) and **Checkbox** (category 4, `defineComponent`, 4 slots) are the package's first multi-slot recipes that are not compounds; see the authoring skill's new "multi-slot single-component pattern" section. **Badge** (category 1, `definePolymorphicComponent`, a single `root` slot) is not part of that pattern; it is genuinely polymorphic (`defaultElement: 'span'`, a full `TDefaultAs` generic), the same builder Button uses. Alert and Badge each declare their own three-value variant subset (`filled`/`outline`/`subtle`), not the theme's five, since `ghost`/`link` have no sane rendering for either. Both ride the theme's `primary`/`filled` intent-resolver pairing, which measures 4.5617:1 in both schemes, 0.0617 above the 4.5 AA floor; see "deliberately future" below.
- **Checkbox** (category 4, `defineComponent`, 4 slots: `root`/`control`/`indicator`/`label`) is category 4's first member that needs no generic type parameter, no floating dropdown, and no state machine beyond a boolean/mixed value, qualifying on the category's own "Form control" name rather than on genericity; the playbook's § 2.5 description is widened accordingly (see below). An implementation detour tried `defineGenericComponent` for it, which forced hand-declaring `size`/`intent` as bare `string` rather than theme-narrowed; that was reverted back to `defineComponent` per the spec's locked decision before this task started.
- **Tabs** (category 3, `defineCompound`, the package's first persistent navigational compound, 5 slots including the composed `indicator` underline) surfaced a contrast-measurement bug, not a Tabs defect: a hover/selection colour transition produced a 2.396:1 reading taken mid-interpolation. The first fix attempt removed the transition from Tabs' own CSS, which was the wrong layer (Button transitions colour too and only gets away with it because the full-grid harness already disables transitions during measurement). The real fix extended `matrix-harness.tsx` with an exported `NO_TRANSITION_CLASS`/`installNoTransitionStyle()`, installed on `document.body` in both the grid and small-coverage paths so it reaches portalled targets too; Tabs kept its legitimate transition.
- **Select** (category 4, `defineGenericComponent`) completes the four authoring categories in `@soribashi/ui`. It is the first recipe to combine a vocabulary axis with a `root` that renders no DOM (Base UI's `Select.Root` is a context provider), which means it emits no `data-size` anywhere; see "deliberately future" below for the design gap this exposes in `defineGenericComponent` itself.
- **The workshop** (`apps/workshop`) gained a page per new recipe. The multi-tenant demo's re-skin proof is real and independently checked: Contoso's popup measured `border-radius: 4px` (Contoso's own scoped `--radius-md`), distinguishable from the default theme's 6px and Acme's 10px.
- **Checkbox's indeterminate state now reads differently from checked.** Task 9's workshop verification found that indeterminate rendered the identical checkmark glyph as checked; ARIA was already correct (`aria-checked="mixed"`) but a sighted user could not distinguish "some selected" from "all selected". Fixed as this task's folded-in commit: both a checkmark and a new dash SVG (`M2.5 6h7`) always mount inside `Checkbox.Indicator`; CSS toggles which is visible off the `data-indeterminate` attribute Base UI already stamps on the same element (`.indicator[data-indeterminate] .check { display: none }` and the inverse for `.dash`). Contrast is unaffected: `contrast-matrix.test.tsx`'s small-coverage cells read computed `color`/`background-color`, not rendered pixels, and both the checked and indeterminate cells measure the same 4.5617:1 before and after, in both schemes. A behavioural regression test (asserting computed `display` on the two candidate SVGs, not just that a `data-*` attribute exists) now covers it in `Checkbox.test.tsx`.
- **The authoring skill (`.claude/skills/authoring-a-recipe/SKILL.md`) is current with the above** plus the const-array `slotKeys` convention, the multi-slot single-component pattern, the variant-tuple-vs-`extend({vocabulary})` distinction (the manifest/registry entry and dev validation's recipe-local check both key on the tuple; `data-variant` stamping does not key on the tuple alone, it is an OR with the recipe's declared `vocabularyAxes`), the per-recipe variant subset convention, the portal-escapes-scope obligation, the mount-time-only rule for stateful contrast cells, the no-transition contrast-measurement mechanism, reading Base UI's installed types over memory, and behavioural-over-emissive test assertions (Grid's slice 2 Critical as the worked example). The playbook's § 2.5 "Form control" description is widened to match its own title rather than defining the category by genericity, since Checkbox has none of the three traits (generic type parameter, floating dropdown, state machine) the old description required.

### Gate state (2026-07-26, branch `feat/slice-3-components`, fresh full run at the end of this task)

- `bun run test`: 1305 tests passed across 114 files.
- `bun run typecheck`: clean.
- `bun run lint`: 0 errors, 440 baseline warnings (pre-existing `noExplicitAny`; not part of this slice's scope). One real formatter error surfaced during this task, in this task's own new Checkbox regression test, and was fixed before this count.
- `bun run test:visual` and `bun run smoke:registry`: **not run as of this task (task 10).** This gate-state note describes task 10's own HEAD; it predates task 11. Linux visual baselines for the five new recipes were committed in task 11, immediately after this task (committing baselines captured before the Checkbox indeterminate fix would have frozen the wrong glyph, which is why that fix had to land in this task rather than after); see the task-11 addendum immediately below for that task's own gate numbers. `smoke:registry` remains not run as of either task: network-dependent and slow, and nothing in this task or task 11 touches the registry beyond regenerating it via `generate:ui`. Reporting this rather than implying a clean sweep across gates that were not actually run.

**Task-11 addendum (committing Linux visual baselines).** `bun run test:visual` was run against the pinned Docker image documented in `.github/workflows/visual-baselines.yml` and its 14 new baselines (Alert x3, Badge x3, Checkbox x3, Select x3, Tabs x2) committed; the task's own review confirmed, by diffing every tracked `*-chromium-linux.png` before and after, that no pre-existing baseline (Button, Popover, or the ten layout recipes) changed. `bun run smoke:registry` was still not run in task 11 either, for the same reason given above.

**Post-review addendum (task 12's whole-branch review, its fix wave, and the user-requested hover-wash work that followed).** A user-reported finding after the review landed, holistically: the `ghost`/`outline`/`subtle` hover wash was invisible (neutral) or too faint (every other intent) because the near-canvas ramp shades those variants used to look up (`v('50')`/`v('100')`) sit almost indistinguishably close to `--surface-canvas`, itself `--color-neutral-50`. The fix, in `packages/theme/src/default-intent-resolver.ts`, replaces those lookups with an opaque `color-mix(in oklab, var(--color-{intent}-500) {weight}%, var(--surface-canvas))` wash anchored on the canvas itself rather than a fixed ramp shade: 12% weight for `ghost`/`outline` hover, 15% weight for `subtle`'s resting background. The same change narrows the resolver's scale contract: every scale the resolver touches now needs only `500`/`600`/`700`/`800`/`foreground`; `50`/`100`/`200` are no longer referenced by the resolver (they remain in use by semantic surface/border tokens elsewhere). Re-measuring after the wash fix surfaced two new near-floor AA margins, both accepted: light-scheme `info`/`subtle` at 4.699:1 and dark-scheme `warning`/`subtle` at 4.891:1 (see the recorded decision under "Deliberately future" below). Final merged gate state for the whole branch: `bun run test` 1314 tests across 114 files, `bun run typecheck` clean, `bun run lint` 0 errors (440 baseline warnings), `bun run test:visual` 30/30 with committed Linux baselines for every scenario, and `bun run smoke:registry` PASS through the real `shadcn` CLI path with `@base-ui/react@1.6.0` genuinely npm-installed.

### Deliberately future (not yet done)

- ~~Compound slot metadata needs a runtime source on `defineCompound`~~ resolved this slice: `defineCompound` now takes an explicit `slotKeys` array, distinct from its parts map (see "What landed" above). *(Originally listed in slice 1b's future list, below.)*
- ~~Registry smoke's scratch `pkg.dependencies` hardcodes `@soribashi/core`~~ resolved this slice: it now derives from `item.dependencies` (see "What landed" above). *(Originally listed in slice 2's future list, below.)*
- **Near-floor contrast margin, now shared by three recipes.** `primary`/`filled` measures 4.5617:1 against the 4.5 floor, 0.0617 of margin. Button already rode this pairing; Alert and Badge now ride the same one, so three full grids go red together on any future nudge to that token. The margin comes from the theme's shared `defaultIntentResolver`, not from any one recipe's own choices. The token itself is unchanged (this remains a theme-level decision, deliberately not slice-3's job); the whole-branch review's fix wave added one named tripwire test (`contrast-matrix.test.tsx`) pinning this exact pairing at its known-tightest measured ratio, so a future nudge to the token fails there first, with a clear diagnosis, before the three grids turn red with none.
- **Recorded decision: no tripwire for the new subtle near-floor margins.** The post-review hover-wash fix's re-measurement found light-scheme `info`/`subtle` at 4.699:1 and dark-scheme `warning`/`subtle` at 4.891:1. Both margins are at least 0.19 above the 4.5 floor, roughly thirty times the 0.0617 margin that justified the primary/filled tripwire above. Decided, not dropped: a margin this wide does not need a dedicated tripwire to catch a future token nudge before the grid does.
- **`defineGenericComponent`'s no-DOM-root `data-size` gap.** Data attributes are stamped only on the `root` selector. Select combines a vocabulary axis with a `root` that renders no DOM (Base UI's context-provider `Select.Root`), so it emits no `data-size` anywhere, and a `Recipe.extend()` consumer cannot write `.trigger[data-size="lg"]` for it the way they can for Button. Select's sizing works through the vars/dimension-record path instead. Recorded as a known limitation for the next generic-component author whose `root` also has no DOM, not yet fixed at the framework level.
- **`defineCompound` still does not strip Base UI's `render` prop.** Popover, Tabs, and Select (where relevant) each strip it by hand at the type level and in their runtime destructure; unchanged framework hardening candidate from slice 1b.
- ~~An open flake~~ resolved by the whole-branch review's fix wave: the Task 8 axe failure was never a leak in Select's own diff (that hunt correctly found nothing). The mechanism is that the axe assertion (in both Select's and the pre-existing Popover's "zero violations" tests) sampled the popup mid-enter-transition, fully transparent, which axe-core's colour-contrast check silently skips rather than flags. The fix reuses `matrix-harness.tsx`'s `installNoTransitionStyle()` and polls for Base UI's own mount-entry state to clear before measuring; verified stable across 25 runs and verified to still catch a real colour-contrast violation once settled.
- ~~A lead worth checking, not yet investigated~~ investigated and answered by the whole-branch review: the `Button.tsx` generic-params lead is a false alarm (explicit generic params make zero difference to narrowing, on any recipe). The `defineComponent`/theme-independent-typing lead is confirmed, and broader than recorded: `size`/`intent` are bare `string` on every recipe in the package (not just Alert/Badge/Checkbox), because no recipe in `packages/ui` calls `makeBuilders`/`createSoribashiBuilders`; `variant` narrows correctly everywhere regardless, via each recipe's own `variants` tuple. The real narrowing trap is dropping `as const` from a `variants` tuple, not omitting generic params. The authoring skill's "generic-params trap" section is rewritten accordingly (now a "known limitation" section, since the underlying gap is foundational, predates this branch, and is explicitly not this slice's job to fix -- only its documentation is corrected here). ~~The underlying gap itself (size/intent bare `string` package-wide)~~ resolved in slice 4 (task 2, the deferred spike): `packages/ui/src/builders.ts` now wraps `makeBuilders<typeof uiTheme>()` and every recipe in the package imports its builder function from `'../../builders.ts'` instead of `@soribashi/core` directly; `size`/`intent` narrow to the theme's vocabulary literals on public types, pinned by `packages/ui/test/vocabulary-narrowing.typecheck.tsx`. `variant`'s narrowing was never part of the gap and is unaffected.
- ~~Popover's popup has no explicit font~~ resolved by slice 4 task 1: `.popup` now declares `font-family: var(--font-family-sans)` and `font-size: var(--font-size-sm)`, mirroring Select's fix; its 2 Linux baselines were regenerated via the pinned Docker image, hash-verified so no other baseline moved.
- ~~No regression test pins the Tabs raw-attribute strip~~ resolved by slice 4 task 1: `Tabs.test.tsx` asserts `data-variant` is stamped and the raw `variant` attribute is absent on the rendered root, verified RED against the pre-fix code before this test's assertions were confirmed GREEN against the fixed code.
- ~~No test pins neutral-wash-vs-canvas distinctness~~ resolved by slice 4 task 1: `Button.test.tsx` renders a neutral ghost button, drives a real pointer hover, and polls until the computed background is neither transparent nor equal to the resolved canvas colour. The first version of this test (matching the task brief's sketch verbatim) turned out to pass whether or not the bug was present: Button's background-color transition interpolates only the alpha channel while holding the target RGB constant, so any mid-transition sample differs from both endpoints purely by alpha, satisfying a loose poll on its first tick regardless of the settled colour. Fixed by installing `matrix-harness.tsx`'s `installNoTransitionStyle()`/`NO_TRANSITION_CLASS` before hovering (the same mechanism already used for grid and small-coverage contrast reads), which removes the interpolation race without touching whether `:hover` matches. Verified RED against a reverted resolver (3 consecutive runs) and GREEN against the fix (5 consecutive runs).
- **Still open from earlier slices, unchanged:** the three `as any` `stylePropsStyle` casts in `define-component.tsx`/`define-polymorphic-component.tsx`/`define-generic-component.tsx`; the `fw` identity resolver silently no-oping an invalid token-key string; the contrast matrix's light-scheme measurement relying on declaration order (Popover's `SMALL_COVERAGE` cell); and publishing (`@soribashi/core`/`@soribashi/ui` still `version: 0.0.0`, `private: true`, unpublished).

---

## Slice 2: layout recipes, universal style props, and the deletion of blocks (2026-07-25)

Slice 1b (below) shipped `@soribashi/ui` with two recipes, Button and Popover, and restored `@soribashi/blocks`' Playwright browser-parity fixtures alongside the workshop app just to have something for `apps/workshop` to point codegen at. That left two parallel component surfaces: a real, three-tier-verified `@soribashi/ui` recipe pair, and a 14-primitive Mantine-adapted blocks package with its own, separate Playwright parity tier. Slice 2 closes that split: the blocks package's style-prop engine moves into `@soribashi/factory` where every builder resolves it the same way, ten of blocks' 14 layout shapes come back as native `@soribashi/ui` recipes (Grid's new `cols`/`minChildWidth` prop absorbs what Grid.Col and SimpleGrid did; `Flex` and `Space` did not get a new-recipe port this slice), and `@soribashi/blocks` plus the parity tier that verified it are deleted outright. `@soribashi/core` now exports the framework only, no components.

Branch `feat/slice-2-layout`, 20 commits ahead of `main` (merge-base `140e2315`), 11 numbered tasks executed in strict order plus this closing task and a whole-branch-review fix wave.

### What landed

- **The style-prop engine moved from blocks into factory.** `extractStyleProps`/`parseStyleProps`/`STYLE_PROPS_DATA` and their per-property resolvers now live under `packages/factory/src/style-props/`, called from exactly one place, `packages/factory/src/style-props/use-style-props.tsx`'s `useStyleProps` hook, itself called from inside all four builders (`defineComponent`, `definePolymorphicComponent`, `defineGenericComponent`, `defineCompound`'s Root part). A recipe never calls the extraction functions itself; the Box-style props (`m`/`p`/`bg`/`fz`/`fw`/...) and the four visibility props (`hiddenFrom`/`visibleFrom`/`lightHidden`/`darkHidden`) arrive on every recipe for free.
- **Visibility utilities now come from codegen, not a hardcoded stylesheet.** `emitCss` gained a `soribashi.utilities` cascade layer that generates `.sb-hidden-from-*`, `.sb-visible-from-*`, `.sb-light-hidden`, and `.sb-dark-hidden` straight from the theme's own breakpoint tokens and dark-mode selector, closing a `2xl`/`3xl` gap the old hardcoded `blocks/src/Box/visibility.css` never covered.
- **Ten native layout recipes in `@soribashi/ui`:** `Box`, `Stack`, `Group`, `Center`, `AspectRatio`, `Grid`, `Container`, `Paper`, `Text`, `Title`, alongside the existing `Button` and `Popover` (twelve recipes total). Each is the same fixed four-file layout as Button and Popover, each declares `recipeCategory` (eleven are category 1, Popover stays category 2), and two of them (`Button`'s `BUTTON_HEIGHTS`, `Container`'s `CONTAINER_WIDTHS`) establish the dimension-record pattern for a size-keyed CSS variable that isn't a spacing/radius/font-size token.
- **The contrast matrix grew a classification guard.** `packages/ui/src/a11y/matrix-classification.ts`'s `MATRIX_CLASSIFICATION` map now requires every recipe, colour-bearing or not, to declare itself `'covered'` (Button's full grid, or a `SMALL_COVERAGE` cell for Paper/Popover/Text/Title) or `{ exempt: '<reason>' }` (the seven geometry-only layout recipes), guarded by name in `matrix-guard.test.ts`. Adding that coverage surfaced a real AA failure and a controller ruling: Text's `dimmed` state (`--text-muted`, then `colors.neutral.500`) measured 4.490:1 against `--surface-canvas` and 4.288:1 against `--surface-raised` in light scheme, both below the 4.5:1 floor. `text.muted` was remapped to `colors.neutral.600`; every muted/dimmed cell was re-measured in both schemes afterward, and the lowest of them (dimmed text on `--surface-raised`, light scheme) came in at 6.810:1, comfortably clear.
- **`@soribashi/blocks` and its Playwright browser-parity tier are deleted.** Nothing in `packages/ui` or `packages/factory` imports `@soribashi/blocks`; the package, `tests/browser-parity`, and the root `test:browser` script are gone. `@soribashi/core` no longer depends on it and exports framework primitives only (builders, hooks, theme/style-prop utilities, types), never a component.
- **Registry smoke now covers a layout recipe.** `bun run smoke:registry` vendors `button` and `stack` together through the real `shadcn` CLI in one throwaway project, generalizing the bundle-marker check to a recipe-name-prefixed custom property (`--sb-button-h`, `--sb-stack-gap`) instead of a same-named CSS Modules class, since both recipes declare a `.root` selector.
- **Linux visual baselines.** Every new visual scenario got a committed `*-chromium-linux.png`, generated via the pinned Docker command in `.github/workflows/visual-baselines.yml` (`mcr.microsoft.com/playwright:v1.59.1-noble`); see the gate state below for counts.
- **The authoring skill (`.claude/skills/authoring-a-recipe/SKILL.md`) and this repo's prose are current with the above.** Style props and visibility props arriving free, `mod` being Box-only, the dimension-record pattern, the generic-params trap, the `MATRIX_CLASSIFICATION`/`RESKIN_FIXTURES` registration obligations, and the collapse to three test tiers are all documented there now.

### Gate state (2026-07-25, branch `feat/slice-2-layout`, fresh full run at the end of this task)

- `bun run test`: 1190 tests passed across 106 files.
- `bun run typecheck`: clean.
- `bun run lint`: 0 errors, 441 baseline warnings (pre-existing `noExplicitAny`, not part of this slice's scope).
- `bun run test:visual`: 16/16 tests passed across 12 files (darwin baselines locally; advisory only, per the skill). Linux baselines: 16 committed `*-chromium-linux.png` files match the 16 darwin baselines one for one; 10 are new (AspectRatio, Box, Center, Container, Grid, Group, Paper, Stack, Text, Title), Popover's 2 existing baselines changed (the `text.muted` remap legitimately shifted the description colour), and Button's 4 existing baselines are confirmed byte-identical to the prior commit.
- `bun run smoke:registry`: PASS (`button` and `stack` vendored together via the real `shadcn` CLI).

### Deliberately future (not yet done)

- **Three `as any` casts for `stylePropsStyle`** in `define-component.tsx`/`define-polymorphic-component.tsx`/`define-generic-component.tsx`. `defineCompound`'s `CSSProperties | null` pattern is the fix; not applied to the other three builders this slice.
- **Group has no grow-formula test at `n=1`/`n=0` children.** The grow-distribution math is covered at typical child counts; the edge counts are untested.
- **`fw`'s identity resolver silently no-ops an invalid token-key string** instead of erroring (`packages/factory/src/style-props/style-props-data.ts`). A real font-weight token resolver, rather than `String(v)` passthrough, would close that DX trap.
- ~~Registry smoke's scratch `pkg.dependencies` hardcodes `@soribashi/core`~~ resolved in slice 3: it now derives the dependency list from `item.dependencies`.
- **The contrast matrix's light-scheme measurement relies on declaration order** (a pre-existing fragility inherited, not introduced, this slice): Popover's `SMALL_COVERAGE` cell measures the title's `--text-default`, not the description's `--text-muted`.
- **Publishing.** Unchanged from slice 1b: packages are still `version: 0.0.0`, `private: true`, unpublished; `smoke:registry` vendors against a local, in-repo copy rather than a real `bun add`.
- **More components.** Categories 3 (persistent compound, e.g. Tabs) and 4 (generic/form, e.g. Select) are proven at the framework level from the earlier recipe-pilot work but still have no `@soribashi/ui` recipe. Within category 1 itself, `Flex` and `Space` (two of the old blocks package's 14 primitives) did not get a new-recipe port this slice; no decision has been made on whether they're still wanted. *(Resolved in slice 3: Tabs and Select shipped, completing all four categories.)*

---

## Slice 1b: `@soribashi/ui`, the workshop, and the verification story (2026-07-25)

Slice 1a (2026-07-24, its own record lives in `docs/superpowers/sessions/`) rebuilt codegen for a real target and removed the last apps that predated the vocabulary rails (`apps/pilot`, `apps/playground`, `apps/shadcn-starter`), leaving no consumer app and codegen erroring with nothing to point at. Slice 1b closes that gap: a real package, a real app to view it in, and a verification story that makes "fully re-themeable through the theme alone" a checked fact rather than a claim.

### What landed

- **Two recipes in `@soribashi/ui`.** `Button` (category 1, pure styled primitive, `definePolymorphicComponent`) and `Popover` (category 2, transient overlay compound, `defineCompound` over `@base-ui/react`'s `Popover`). Each is the fixed four-file layout: `<Name>.tsx`, `<Name>.module.css`, `<Name>.test.tsx`, `<Name>.visual.test.tsx`, at `packages/ui/src/recipes/<Name>/`. Every recipe declares `export const recipeCategory` so the manifest derivation can classify it without guessing.
- **`apps/workshop`.** A restored consumer app (`bun run dev:workshop`): a showcase page per recipe across its full intent x variant x size surface in light and dark, a token reference page, and a multi-tenant theming demo (two brand themes, each scoped to its own class selector, one with an extra `.dark` wrapper proving scoped dark mode works independent of any other subtree on the same page). Browser-parity fixtures were restored alongside it; the `browser` CI job (`tests/browser-parity`, 46 Playwright computed-style tests over the 14 blocks) was un-gated again at this point. (Superseded by slice 2, below: `@soribashi/blocks` and this Playwright parity tier were both deleted; the layout shapes it tested moved into `@soribashi/ui` as native recipes verified by the same three-tier story as every other recipe.)
- **Three verification tiers**, wired into `packages/ui`'s own vitest configs: tier 1 logic (Node, `vitest.config.ts`), tier 2 browser (real Chromium via `@vitest/browser-playwright`, `vitest.browser.config.ts`, render/interaction/accessibility per recipe), tier 3 visual (`vitest.visual.config.ts`, screenshot baselines, run via `bun run test:visual`). Tiers 1 and 2 run under the root `bun run test`; tier 3 is separate because its baselines are platform-sensitive (see below).
- **Two conformance gates.** `packages/ui/test/no-hardcoded-values.test.ts` scans every recipe stylesheet for colour or length literals that didn't arrive via `var(...)` (short allowlist: `0`/`1px`/`2px`/`100%`, unitless/time values). `packages/ui/src/conformance/reskin.test.tsx` renders every recipe under a second, deliberately garish theme with zero recipe-source changes and asserts the computed background/foreground/radius actually moved; a recipe without a matching `RESKIN_FIXTURES` entry fails the guard by name.
- **A WCAG AA contrast matrix.** `packages/ui/src/a11y/contrast-matrix.test.tsx` checks >= 4.5:1 across every intent x variant x size combination (6 x 5 x 5 = 150 combinations for Button), in both light and dark scheme, using a canvas-based colour normalizer (this theme's `oklch()`/`light-dark()` tokens don't reliably serialize to `rgb()` via `getComputedStyle` on the pinned Chromium build). The matrix passes 300/300 cells across both schemes.
- **A visual oracle.** Per-recipe screenshot baselines under `__screenshots__/`, generated exclusively by the `visual-baselines` GitHub Actions workflow (`workflow_dispatch`) or the pinned Docker command it documents, never committed from a local (darwin) machine, since Vitest suffixes baseline filenames by platform and a `-chromium-darwin.png` is a different file from the `-chromium-linux.png` CI actually compares against. The `visual` CI job compares only; it never updates.
- **A derived manifest and a shadcn-compatible registry.** `bun run generate:ui` (`packages/ui/scripts/generate-manifest.ts` + `generate-registry.ts`, both thin writers over the shared `derive.ts`) reads every recipe's frozen metadata and CSS to produce `packages/ui/manifest.json` (name, category, builder, slots, vocabulary axes, variants, defaults, file paths, theme token dependencies) and `packages/ui/registry/*.json` (a `registry:ui` item per recipe, shadcn-schema-compatible). Nothing in either file is hand-authored; `manifest-drift.test.ts` rebuilds through the same functions and the `codegen-drift` CI job fails on any diff against what's committed.
- **A registry install smoke check.** `bun run smoke:registry` scaffolds a throwaway Vite + React project, drives the real `shadcn` CLI (`bunx shadcn@latest add ./registry/button.json`) against the generated registry, installs, builds, and asserts the recipe's own CSS-module class name made it into both the built CSS and JS bundles. It's its own CI job (`registry-smoke`) because it's network-dependent and takes minutes.
- **The `authoring-a-recipe` skill.** `.claude/skills/authoring-a-recipe/SKILL.md` replaces the stale `visual-parity-check` skill (which targeted the now-removed `apps/shadcn-starter`) with the agent-facing checklist for adding or changing a `packages/ui` recipe: four-file layout, builder selection, the two CLAUDE.md invariants, CSS rules, data-attribute conventions, per-tier test expectations, the post-authoring manifest regen step, and the traps that have already bitten someone once.
- **README reframed** around what this repo actually demonstrates: soribashi the authoring tool, `@soribashi/ui` the thing built with it, and the verification story that backs its claims.

### Gate state (2026-07-25, branch `feat/slice-1b-vertical`, at the end of the final review fix wave)

- `bun run test`: 1233 tests passed across 107 files (tiers 1 + 2 across every package, including the contrast matrix, reskin guard, and no-hardcoded-values scan; the count dropped by one when the final fix wave merged two hardcoded registry drift tests into one manifest-derived test with identical byte-comparison coverage).
- `bun run typecheck`: clean.
- `bun run lint`: 0 errors, 479 baseline warnings (pre-existing `noExplicitAny` in Mantine-adapted block internals; not part of this slice's scope).
- `bun run test:browser`: 46/46 Playwright browser-parity tests passed.
- All five CI jobs (`checks`, `codegen-drift`, `registry-smoke`, `browser`, `visual`) are live and un-gated; none are skipped or marked allow-failure.

### Deliberately future (not yet done)

- **Publishing.** `@soribashi/core`, `@soribashi/ui`, and their siblings are still `version: 0.0.0`, `private: true`, and unpublished. The registry smoke check vendors against a local, in-repo copy of the packages rather than a real `bun add @soribashi/core`; that gap only closes once publishing exists. There is no hosted registry URL.
- **More components.** Two of the four authoring categories are represented in `@soribashi/ui` (category 1 via Button, category 2 via Popover). Categories 3 (persistent compound, e.g. Tabs) and 4 (generic/form, e.g. Select) are proven at the framework level from the earlier recipe-pilot work (below) but have no `@soribashi/ui` recipe yet. The ~20-component conversion sweep outlined in the playbook (§5) remains future work. *(Resolved in slice 3: Tabs and Select shipped, completing all four categories.)*
- **`primary.700`'s dark chroma was gamut-clamped** (0.2153 to 0.1682, ~22% desaturation vs light); design pass to accept or redesign.
- **`subtle`'s dark-mode appearance changed** for success/danger/warning/info (light chip to dark tinted chip, matching primary); review against the committed dark baseline PNG.
- **Tenant themes brand only their light primaries**; tenant dark ramps fall back to the default blue; branding them is future design.
- **The `ui` theme emits no `--accent-*` tokens**; Button's focus ring rides a var fallback; decide whether accent becomes a real semantic family.
- ~~Popover has no contrast-ratio coverage of its own yet~~ resolved in slice 2: Popover has a `SMALL_COVERAGE` cell in the contrast matrix now.
- ~~Compound slot metadata needs a runtime source on `defineCompound`~~ resolved in slice 3: `defineCompound` now takes an explicit `slotKeys` array (see `packages/factory/src/recipe-meta.ts`), distinct from its parts map. Slice 2 did not add a compound and left this open; Tabs, slice 3's new compound, is what forced it.
- **`defineCompound` does not strip Base UI's `render` prop itself**; recipes do it manually; framework hardening candidate.
- **Spec sections 6.1/6.2 promised `@property` registration of recipe-local `--sb-*` vars**; not implemented this slice (set inline, never registered); recorded here as a deliberate narrowing.
- **First real push contingency:** if the visual CI job fails with only text-metric diffs, dispatch `visual-baselines.yml` on real Actions and recommit (Docker-generated baselines may differ from ubuntu-latest fonts).

---

> **Recorded 2026-07-01.** The v1 Mantine-adaptation foundation (2026-04-25, recorded below) is complete and stable. Since then the project has been building the **recipe pilot** (adapting real component recipes: Button, Tooltip, Tabs, Select, on top of the foundation) and hardening the recipe-authoring conventions. This section tracks that post-v1 work; the v1 record follows unchanged below.

## Post-v1: recipe pilot + library authoring hygiene

### Recipe pilots (Waves 1-4): SHIPPED

The `apps/pilot` app ports real components from the host codebase onto soribashi, one category at a time:

- **Wave 1: Button** (`#1`): pure-styled-primitive category via `definePolymorphicComponent`. Token consolidation (dropped shad-* layer, renamed error→danger, collapsed surfaces). Journal: `docs/superpowers/pilots/2026-04-26-button-conversion.md`.
- **Wave 2: Tooltip** (`#7`): transient-overlay compound via the new `defineCompound` primitive. Wraps Radix, adds the `surface.floating` formalized foreground pairing. Journal: `docs/superpowers/pilots/2026-05-04-tooltip-pilot.md`.
- **Wave 3: Tabs** (`#8`): persistent-navigational compound with a polymorphic Trigger part.
- **Wave 4: Select** (4A `e5c0699` + 4B `#12` squash `5e4b2aa`, merged 2026-07-01): data-driven generic form control. Wave 4A landed the `defineGenericComponent` generic-signature builder substrate; Wave 4B shipped the Select pilot on top of it. Completes the playbook's four authoring categories. Plans: `docs/superpowers/plans/2026-06-22-wave-4a-generic-builder-substrate.md`, `docs/superpowers/plans/2026-06-23-wave-4b-select-pilot.md`.

### Library authoring hygiene (PR #9 + PR #10): MERGED 2026-05-28

Two cross-cutting authoring conventions that should have been settled before Wave 1, surfaced during the Wave 3 review and shipped as a 3-PR rollout:

- **PR #9: CSS modules** (squash `2cc0494`): all three recipes migrated from plain `.css` with `cr-Recipe-slot` global prefixes to `.module.css` with plain `.root`/`.trigger`/`.content` selectors. Build-time scoping replaces convention-only prefixing. Added `vite-env.d.ts` for typed module imports; `:global(.dark)` for the dark-mode rule; `:where(:disabled, [aria-disabled])` for polymorphic disabled state. Playbook §§ 2.1-2.4 codify the pattern. Spec: `docs/superpowers/specs/2026-05-12-css-modules-migration-design.md`.
- **PR #10: vocabulary rails** (squash `ef99d35`): soribashi has **no opinion** on `size`/`intent`/`variant` *values*; developers declare their own vocabulary. New surface:
  - `defineVocabulary(values)`: the only sanctioned vocabulary constructor; wraps Zod so the inferred type and the runtime schema can't drift.
  - Theme `semantic` field split into `vocabulary` (size/intent/variant enums) + `semanticTokens` (text/surface/border/accent aliases). Hard cutover, no shim.
  - `Recipe.extend({ vocabulary, defaultProps, classNames, styles, vars, attributes })` replaces `withDefaults()` across all four builders. Vocabulary overrides support replace-mode (a `Vocabulary`) and extend-mode (`(current) => Vocabulary`), resolved at `createTheme()` time.
  - `createSoribashiBuilders(theme)`: consumer entry point; registers theme vocab in a module-level Zod registry (idempotent) and returns the builders.
  - `vocabularyAxes` recipe opt-in + dev-only Zod runtime validation with actionable error messages.
  - Spec: `docs/superpowers/specs/2026-05-12-vocabulary-rails-design.md`.

### PR #11: pilot vocab-rails wiring + type threading (MERGED 2026-06-06, squash `b2fc3cc`)

PR #10 built the rails; PR #11 wired the pilot to them and threaded the types: a `builders.ts` entry point using the generic `createTheme` plus `makeBuilders`/`registerTheme`, recipes opting into `vocabularyAxes`, and variant vocabularies declared per-recipe via `Recipe.extend()`. Delivers compile-time size/intent narrowing and cycle-free in-theme `.extend()`. Original briefing: `docs/superpowers/sessions/2026-05-28-pilot-migration-handoff.md`.

### Next: component sweep

All four authoring categories are proven; next is the ~20-component conversion sweep (playbook §5: `docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md`).

### Post-v1 test counts (on `main` @ `5e4b2aa`)

| Package | Tests |
|---|---|
| `@soribashi/theme` | 82 |
| `@soribashi/codegen` | 137 |
| `@soribashi/factory` | 473 |
| `@soribashi/blocks` | 244 (package deleted in slice 2; see that section) |
| `apps/pilot` | 86 |

Typecheck clean. (The 785-total figure in the v1 record below predates the pilot + hygiene work and the per-package growth since.)

---

# Soribashi v1: Implementation Status (foundation record)

**As of 2026-04-25**

All 5 original plans executed end-to-end, the Mantine blocks adaptation pass is complete, **and** three full audits (two early validation passes plus the comprehensive Hard-Rule-13 full audit) have closed all known divergences against Mantine `63dafbbf`. **739 vitest tests** across 54 files plus **46 Playwright browser-parity tests** = 785 total. Playground app builds, typecheck clean. Coverage manifest covers every TS/TSX file under `packages/*/src/`. See `docs/superpowers/divergences/mantine-master.md`, `docs/superpowers/audits/2026-04-25-coverage-manifest.md`, `docs/superpowers/roadmap/mantine-derivable-future-work.md`, and `THIRD-PARTY-LICENSES.md`.

## Mantine full audit pass: COMPLETE (2026-04-25)

Hard Rule 13 enforcement complete across every soribashi file derivable from Mantine. Pinned to `mantinedev/mantine@63dafbbf5f0135eb36455b7add4c0ddcd0f3240a`.

- **Coverage manifest:** `docs/superpowers/audits/2026-04-25-coverage-manifest.md`: every file in scope listed with status and audit-doc link.
- **Master ledger:** `docs/superpowers/divergences/mantine-master.md`: 1090 lines, ~50 divergence entries split across `Aligned` / `Kept` / `Closed` / `Full audit pass: 2026-04-25` (Tier 1 + Tier 2 entries) / `Validated and matching` sections.
- **Per-tier audit docs:** Tier 1 (`tier-1-{factory,polymorphic,generic,with-props,inline-styles,hash-and-classname}.md`), Tier 2 (`tier-2-{theme,provider-types,factory-additions,box-style-props,codegen}.md`), Tier 3 (`tier-3-blocks-and-utils.md`).
- **Roadmap:** `docs/superpowers/roadmap/mantine-derivable-future-work.md`: 12 (e) "missing port" candidates surfaced, sized S/M/L for follow-up consideration.

### Bugs caught by the full audit (11 total across all phases)

Real behavioral bugs found and fixed via TDD across the audit:

1. `useStyles`: `undefined` CSS variable values rendered as the string `"undefined"` (V2 / pre-pass; US-29)
2. `InlineStyles`: empty `selector { }` rule emitted when `styles={}` (Tier 1 / Task 1.5; ST-05)
3. `makeWithProps`: `withProps()` result missing `extend` propagation (Tier 1 / Task 1.1; B4)
4. `makeWithProps`: `withProps()` result missing recursive `withProps` chaining (Tier 1 / Task 1.2; P17c)
5. `composeTheme.mergeTokens`: silently dropping `fontWeight` / `lineHeight` / `heading` fields when child themes extend a base (Tier 2 / T2-A; CT-BUG-1..5)
6. `getBoxMod`: numeric-`0` mod values silently dropped (`mod={{ count: 0 }}` lost) (Tier 2 / T2-D; GBM-Z1)
7. `parseStyleProps`: `{ base: 'md' }` (only-base) treated as responsive, emitting unnecessary `<InlineStyles>` (Tier 2 / T2-D; PSP-B1)
8. `emit-css.ts`: `tokens.breakpoint` declared in types but never emitted as `--breakpoint-*` vars (V3 + Tier 2 / T2-E; BUG-E-1)
9. `emit-css.ts`: `emitDarkTokenLines` only handled 5 of 10 token-type fields (silent loss of fontFamily/fontWeight/lineHeight/breakpoint/heading dark overrides) (Tier 2 / T2-E; BUG-E-2)
10. Block wrapper style-merge: consumer's inline `style` prop overwrote `vars()` output across 13 blocks (V4 / pre-pass)
11. `--breakpoint-*` emission gap surfaced + fixed (V3 / pre-pass)

### Audit phases

- ✅ **Phase 1 (Tier 1, sequential):** 6 load-bearing factory primitive audits with parity tests: `factory.tsx`, polymorphic + define-polymorphic, define-generic, with-props, inline-styles bundle, hash + use-random-class-name. 161+ new parity tests.
- ✅ **Phase 2 (Tier 2, parallel):** 5 batches over theme / provider+types / factory-additions / Box-style-props / codegen. Audit reports + ledger fragments + TDD bug fixes. 5 fragments merged into master ledger.
- ✅ **Phase 3 (Tier 3, fast):** Confirmatory pass over 14 blocks + utils + Grid math + core barrel using existing V1/V4 infrastructure. 0 new bugs.
- ✅ **Phase 4 (consolidation):** Coverage manifest finalized, roadmap doc populated, master ledger consolidated, STATUS + Hard Rule 13 updated, final smoke clean.

## Mantine blocks adaptation: COMPLETE

**Plan:** `docs/superpowers/plans/2026-04-25-plan-mantine-blocks-adaptation.md`. All 14 layout primitives are now full Mantine adaptations, MIT-attributed.

### Phase status

- ✅ **Phase 0:** Attribution / `THIRD-PARTY-LICENSES.md`
- ✅ **Phase 1:** Theme tokens (`fontWeight`, `lineHeight`, `fontFamily.heading`, `heading.sizes`)
- ✅ **Phase 2:** Helper utilities (`rem`, `getSpacing`, `getRadius`, `getSize`, `getFontSize`, `getLineHeight`, `getShadow`, `getThemeColor`)
- ✅ **Phase 3:** Factory infrastructure (`useRandomClassName`, `hashStyleProps`, `<InlineStyles>`)
- ✅ **Phase 4:** Box style-props machinery (`STYLE_PROPS_DATA`, `parseStyleProps`, `extractStyleProps`, `getBoxMod`)
- ✅ **Phase 5:** Box: full style-prop pipeline + responsive `StyleProp<T>`
- ✅ **Phase 6:** Stack, Group (grow + preventGrowOverflow + filterFalsyChildren), Center (`:where([data-inline])` pattern), AspectRatio (children-aware fix), Space (1-line Box wrapper), Paper (a11y defaults + light/dark border)
- ✅ **Phase 7:** Flex, Grid + Grid.Col, SimpleGrid, Container (block strategy)
- ✅ **Phase 8:** Text (lineClamp, gradient, inline, inherit, RTL truncate, span shorthand) + Title (`order`, `size` accepts `h1`-`h6` token, `lineClamp`, `textWrap`, `getTitleSize` reading `theme.tokens.heading.sizes`)
- ✅ **Phase 9:** Divergence ledger refreshed (`docs/superpowers/divergences/mantine-master.md`); `--mantine-` lint clean (only attribution-comment references remain); final smoke (`bunx vitest run`, `bun run typecheck`, `bun run --filter @soribashi/playground build`) all green
- ✅ **Validation pass 1 (post-Phase 9):** 15 residual divergences against Mantine `63dafbbf` closed in a parallel-batch fix run: Grid math parameterized on `columns`, full Box style-prop parity (`hiddenFrom`/`visibleFrom`/12 missing props/logical-shorthand `mx`/`my`), `getBoxMod` kebab-cases mod keys, utility resolvers drop the `STANDARD_KEYS` allowlist, `rem` accepts px-strings, codegen emits `--heading-text-wrap`, `useRandomClassName` handles React 19 IDs, Paper border var scoped, SimpleGrid renames + selector specificity. See `mantine-master.md` § "Post-adaptation validation pass" for the full table.
- ✅ **Validation pass 2 (4 evidence-based audits):** Four parallel agents produced runnable artifacts and caught 5 more real bugs:
  - **V1: CSS structural diff:** parser-based audit script (`packages/blocks/scripts/css-parity-audit.ts`) + parity test with allowlist. Found 28 IDENTICAL / 1 TOKEN_DIFF / 5 DECL_DIFF / 5 MISSING / 5 EXTRA across 14 blocks; fixed missing `--grid-column-gap`/`--grid-row-gap` defaults on `.sb-Grid-root` and missing `[dir="rtl"]` override on Text `truncate='start'`.
  - **V2: Factory parity:** enumerated 42 decision branches in `useStyles` + `useProps`; wrote 74 parity tests (one per branch); 41/42 confirmed equivalent to Mantine. Fixed US-29: `undefined` CSS-variable values were not filtered from the merged style object (would have rendered the literal string "undefined" to DOM).
  - **V3: Codegen variable parity:** mapped 64/64 canonical Mantine vars to soribashi equivalents (100%); documented 288 intentional gaps (mostly Mantine's pre-computed color-variant vars which soribashi computes at render time via the intent resolver). Fixed silent `--breakpoint-*` emission gap that would have broken `visibility.css` at runtime.
  - **V4: Browser-parity smoke:** 46 Playwright computed-style tests across all 14 blocks; surfaced and led to fixing a systemic bug across 13 blocks where consumer's inline `style` prop overwrote `vars()` output (test: `packages/blocks/test/Box/wrapper-style-merge.test.tsx`). (This suite and the `@soribashi/blocks` package it covered were deleted in slice 2, below; the file path is historical.)

### Deferred (acknowledged, not yet implemented)

Tracked in the divergence ledger under "Deferred":

- Responsive `StyleProp<T>` for non-Box blocks (Flex / Grid / SimpleGrid)
- `GridProvider` context for responsive col span / offset / order
- `Container` grid strategy (with `data-breakout` children)
- `SimpleGrid` `type='container'` mode

**Blocks adapted from Mantine**: all 14 layout primitives now full Mantine fidelity, MIT-attributed, see `docs/superpowers/divergences/mantine-master.md` and `THIRD-PARTY-LICENSES.md`.

## What was built

### Plans (all written first, then executed)

- `docs/superpowers/plans/2026-04-25-plan-1-foundation.md`: workspace + theme + codegen
- `docs/superpowers/plans/2026-04-25-plan-2-factory.md`: `@soribashi/factory` core framework
- `docs/superpowers/plans/2026-04-25-plan-3-generic-polymorphic.md`: generic + polymorphic + escape hatches
- `docs/superpowers/plans/2026-04-25-plan-4-blocks.md`: 14 layout primitives
- `docs/superpowers/plans/2026-04-25-plan-5-playground.md`: `@soribashi/core` barrel + playground + Button

### Packages

| Package | Purpose | Tests |
|---|---|---|
| `@soribashi/theme` | `createTheme`, intent resolver, default tokens, composition | 29 |
| `@soribashi/codegen` | theme → CSS variables + Tailwind v3/v4 config; CLI | 32 |
| `@soribashi/factory` | `defineComponent`, `useProps`, `useStyles`, `cn`, generic + polymorphic, escape hatches | 63 |
| `@soribashi/blocks` | Box, Stack, Group, Flex, Grid, Grid.Col, SimpleGrid, Container, Center, AspectRatio, Space, Paper, Text, Title | 28 |
| `@soribashi/core` | Public barrel | n/a |

**Total: 152 tests across 23 files**

### App

- `apps/playground`: Vite + React + TS + Tailwind v3
  - Theme defined in `apps/playground/src/theme/index.ts`
  - Codegen produces `apps/playground/src/generated/theme.css` and `tailwind.config.generated.js` from the theme
  - Real `Button` component built using `defineComponent` from `@soribashi/core`
  - **Theme Lab** page: 6 intents × 5 variants matrix + 3 sizes + states (loading/disabled/fullWidth)
  - **Blocks Demo** page: Stack, Group, Grid, SimpleGrid, Typography, Center
  - Dark mode toggle wired to `.dark` class
  - Builds: 24KB CSS + 184KB JS gzipped (58KB)
  - Dev server boots and serves HTML

## Try it

```bash
bun install
bun run codegen        # regenerate theme.css + tailwind.config.generated.js
bun run dev:playground # open http://localhost:5173
bun test               # run all tests via vitest
```

Or for the full dev loop:

```bash
bun run dev            # codegen + playground in sequence
```

## Key wins from the design that landed

- **Theme is the contract**: every component accesses tokens through `theme`; codegen ensures Tailwind config matches.
- **`defineComponent({...})`**: single config object, types inferred. The `Button` component implementation in `apps/playground/src/components/Button/Button.tsx` is ~70 lines (vs Mantine's ~280 for the equivalent).
- **Auto-vars for intent × variant**: components declaring `variants` automatically get `--{name}-bg/-color/-border/-hover/-active` on root via the theme's `intentResolver`. No manual `varsResolver` needed for the standard case.
- **Surface elevation** as first-class: `bg="raised"` etc. resolves to `var(--surface-raised)`. Avoids the Mantine workaround documented in console-archive (manual `--mantine-color-background-1..4` injection).
- **Substrate-agnostic styling**: `defineComponent` accepts CSS module classes, Tailwind/CVA recipes, or plain class names. `Button` uses plain CSS that references `var(--button-bg)` etc.
- **Layered token composition**: `createTheme({ extends: baseTheme, ... })` works; tested in roundtrip.
- **Generic component support**: `defineGenericComponent<SelectOwnProps<T>>` preserves the type parameter.
- **Polymorphic component support**: `definePolymorphicComponent` with `as` prop; `Box`, `Text` use it.
- **Codegen drift impossible**: Tailwind config is generated from the theme; you cannot reference a token that doesn't exist.

## Not yet done (deferred from the spec)

- Playwright visual tests (post-v1, can be added once playground is stable)
- Host library integration in the consuming codebase (separate effort)
- Per-tenant scope codegen for multi-tenant apps (works in `createTheme({ scope: ... })` but the playground doesn't demo it)
- Tailwind v4 mode tested end-to-end (codegen supports it; playground uses v3)
- The `tailwindPassthrough` escape hatch for libraries like Tremor (open question #3 in the spec)
- Lint rule for color classes inside soribashi-component recipes (open question #2)

## Known cosmetic gaps

- The playground's nav header buttons don't use the Button component (just raw `<button>` with default browser styling): a minor cosmetic loose end.
- Some redundant prop destructure in block render functions (`classNames, styles, vars, attributes, unstyled, className, style` are pulled out and discarded). Could be extracted into a helper but the duplication is intentional and clear for now.

## Git history

All work committed in atomic commits per task. `git log --oneline` shows the progression:

```
chore: initialize repository with docs and gitignore
chore: add Bun workspace, base TS config, and biome
feat(theme): add @soribashi/theme with createTheme, intent resolver, default tokens, composition
feat(codegen): add @soribashi/codegen with build/watch + CLI + roundtrip tests
chore: Plan 1 (foundation) complete: 61 tests passing across theme + codegen
feat(factory): add @soribashi/factory with defineComponent, useProps, useStyles, autoVars
feat(factory): add definePolymorphicComponent, defineGenericComponent, escape hatches
feat(blocks): add @soribashi/blocks with 14 layout primitives
feat(playground): add @soribashi/core barrel + Vite playground with Button + Theme Lab + Blocks Demo
```
