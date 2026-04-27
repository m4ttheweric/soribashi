# Button Conversion Pilot — Journal

**Wave:** 1
**Date started:** 2026-04-26
**Spec:** `docs/superpowers/specs/2026-04-26-token-consolidation-and-button-pilot-design.md`

## 1. Legacy Button surface inventory (Task 1.2)

### 1.1 Variants (visual style)

CVI's variant set: `primary`, `secondary`, `outline`, `ghost`, `danger`, `success`.

**Inconsistency:** The variant prop in CVI's Button mixes visual style (`outline`, `ghost`) with semantic role (`primary`, `secondary`, `danger`, `success`) — three are visual, three are intent-shaped. This conflates two orthogonal axes.

**Wave 1 consolidation:** Split into:
- `variant` (visual): `filled`, `outline`, `subtle`, `ghost`, `link`
- `intent` (semantic role): `primary`, `neutral`, `success`, `warning`, `danger`, `info`

Rationale: matches the existing soribashi convention (see `apps/playground/src/components/Button/Button.tsx` and the playground theme). Lets one component express ALL the (variant × intent) cells without an explosion of one-off variants.

**Migration map for CVI's existing usages** (informational — actual migration is the integration project's work):
- `<Button variant="primary">` → `<Button intent="primary" variant="filled">`
- `<Button variant="secondary">` → `<Button intent="neutral" variant="filled">` (or `subtle` — see § 4)
- `<Button variant="outline">` → `<Button intent="neutral" variant="outline">`
- `<Button variant="ghost">` → `<Button intent="neutral" variant="ghost">`
- `<Button variant="danger">` → `<Button intent="danger" variant="filled">`
- `<Button variant="success">` → `<Button intent="success" variant="filled">`

### 1.2 Sizes

CVI: `sm`, `md`, `lg`. Wave 1: same.

### 1.3 States

| CVI prop | CVI behavior | Wave 1 prop |
|---|---|---|
| `isLoading` | Shows spinner, suppresses click | `loading` (renamed) |
| `disabled` | HTMLButton disabled | `disabled` (passthrough) |
| `fullWidth` | `w-full` class | `fullWidth` (kept) |
| `leftIcon` | IconKey or ReactElement; rendered before children | `leftIcon` (kept; ReactNode only — IconKey wrapping is the integration project's concern) |
| `rightIcon` | (same) | `rightIcon` (kept) |
| `asChild` | Renders children as a slot via Radix Slot | Polymorphic `as` prop instead — see § 1.4 |

### 1.4 Polymorphism

CVI uses Radix Slot (`asChild` prop). Wave 1 uses soribashi's `definePolymorphicComponent` with an `as` prop. Why the change: `as` is more typesafe, the soribashi convention, and removes the `Slot` runtime dependency from the recipe. Migration map:
- `<Button asChild><a href="/x">Link</a></Button>` → `<Button as="a" href="/x">Link</Button>`

This is a meaningful API divergence — flag in the journal as a finding for design review.

**CVI footgun:** `asChild` is silently ignored when combined with `isLoading`, `leftIcon`, or `rightIcon`. The implementation guard at `apps/core-radix-pilot/src/reference/core-radix-button/Button.tsx:144` reads `if (asChild && !isLoading && !leftIcon && !rightIcon)` — when any of those props is set, execution falls through to the regular `<button>` branch with no warning, no dev-mode log, no type error. The `as` prop replacement in Wave 1 avoids this class of bug because polymorphism is independent of icon/loading rendering — `<Button as="a" loading leftIcon={...}>` correctly renders an `<a>` with both leftIcon and a spinner.

## 2. Consolidated Button shape (Task 1.3)

_Populated as recipe is authored._

## 3. What was easy / what was hard (Task 1.9)

### Easy

- **`defineComponent` / `definePolymorphicComponent` carried the recipe shape end-to-end.** Going from CVI's hand-rolled `forwardRef` + `cva` + manual prop-merging to a soribashi recipe was largely a transcription exercise: the factory handles `ref` forwarding, the `getStyles` helper threads consumer overrides through `classNames`/`styles`/`vars`/`attributes`/`unstyled`, and the polymorphic variant gives a typed `as` prop without bespoke generics. Once the destructure-styles-API-props pattern was internalized (see § 4 Gap 2), authoring the recipe was mechanical.
- **Intent × variant via CSS data-attribute rules over local CSS vars.** Tailwind-class-explosion for 5 variants × 6 intents (30 cells) was avoided by emitting one `Button.css` keyed on `[data-variant]` / `[data-intent]` selectors and routing all colorization through `--cr-button-bg` / `--cr-button-fg` / `--cr-button-border` local vars. Adding/changing an intent is a CSS edit, not a recipe-API edit. This pattern composes cleanly with the consolidated theme tokens — every selector pulls from `var(--color-{family}-{step})` directly.
- **Parity-test pattern reuse.** Task 1.8's Playwright parity tests reused the matrix-snapshot pattern from Phase 0's ScreenReplica work (Task 0.10): drive a deterministic `ButtonMatrix` page, snapshot per-cell computed styles, assert against the consolidated theme expectations. No new harness needed — same Playwright project, same `webServer` block, same fixture style.
- **TDD loop held.** Task 1.4 RED → Task 1.5 GREEN ran clean: the failing tests mapped 1:1 to recipe behaviors, and once the jest-dom gap (§ 4 Gap 3) was patched all 11 tests went green without rework.
- **Polymorphism-as-`as`-prop replaced CVI's `asChild` cleanly.** The `definePolymorphicComponent` `as` API is more typesafe and sidesteps CVI's `asChild` footgun (silent ignore when combined with `isLoading`/`leftIcon`/`rightIcon`, see § 1.4) — `<Button as="a" loading leftIcon={...}>` correctly composes loading + icons + anchor element.

### Hard

- **`hsl(var(--color-...))` → `var(--color-...)` adaptation.** The codegen wraps every var value in `hsl(...)` already (logged in token-consolidation journal § 6), so consumer code that writes `hsl(var(--color-primary-500))` thinking the var is bare HSL components produces invalid `hsl(hsl(...))` and resolves transparent. Every Phase-1 recipe/test/snapshot file (Tasks 1.5 Button.css, 1.6 ButtonMatrix, 1.8 Playwright resolver) had to use the direct-var pattern. The plan-snippet templates for those tasks were patched mid-flight after Task 0.8 surfaced the issue. **Cost:** also blocks the Tailwind `<alpha-value>` pattern (`bg-primary-500/50`) — alpha utilities aren't expressible against the current emit format.
- **`definePolymorphicComponent`'s `render` ctx doesn't pre-strip styles-API props.** The `props` handed to `render({ Element, props, getStyles })` still contains `classNames`, `styles`, `vars`, `attributes`, `unstyled`, `className`, `style`. Spreading `...rest` onto a DOM element without first destructuring those seven keys throws React unknown-prop warnings (and at runtime sends non-DOM attrs through to the element). The Button recipe explicitly destructures all seven; the existing factory test (`packages/factory/test/define-polymorphic-component.test.tsx:18`) does the same with an `...rest as any` cast. Discoverable only by reading the test or by hitting the warning — no docs.
- **jest-dom setup gap in the pilot vitest config template.** Task 1.3's snippet for `apps/core-radix-pilot/vitest.config.ts` did not include `setupFiles`. Task 1.4's behavior tests use `expect(...).toBeDisabled()` (jest-dom matcher), so when Task 1.5 implementer ran the suite, 10/11 tests passed and the disabled-on-loading test failed with `Invalid Chai property: toBeDisabled`. Resolution: Task 1.5 added `apps/core-radix-pilot/test/setup.ts` (one line: `import '@testing-library/jest-dom/vitest';`) and wired it via `setupFiles: ['./test/setup.ts']`. Mirrors the existing convention at `packages/factory/test/setup.ts` and `packages/blocks/test/setup.ts` — the template just didn't carry it forward.
- **Focus indicator (`outline: 2px solid var(--cr-button-bg)`) is invisible on transparent variants.** Surfaced in Task 1.5 review: ghost / link / outline variants set `--cr-button-bg` to `transparent`, so the focus outline that derives from it disappears. Workaround for Wave 1: deferred (these variants still receive the browser's default `:focus-visible` ring; the recipe just doesn't draw an additional intent-tinted one for them). A proper fix routes the outline color through a separate `--cr-button-focus-ring` var that falls back to the intent border or text color on transparent variants. Documented as a recipe-authoring footgun in § 4 Gap 4.
- **`definePolymorphicComponent` type-param order is `<TOwnProps, TDefaultAs>`, not `<TDefaultAs, TOwnProps>`.** The plan's example originally had the order reversed. Caught and corrected mid-spec, but worth flagging for the playbook: the plan-snippet templates need a verifier pass against the actual factory signature before being copy-pasted into recipe authoring. The mistake compiles (both type params are flexible enough that swapping them yields confusing-but-not-erroring types) so it would have escaped TypeScript.

### Surprises

- **Pleasant: catching the codegen `hsl()`-wrapper bug in Task 0.8 paid recurring dividends.** Tasks 0.9 (ScreenReplica), 1.5 (Button.css), 1.6 (ButtonMatrix), and 1.8 (Playwright resolver) all hit the same mismatch in their plan-snippet templates. Because Task 0.8's review patched the upstream understanding (and the plan was edited in-place), every downstream task implementer started from the direct-`var()` pattern instead of rediscovering the bug five times. Single-source-of-truth journal § 6 worked as intended.
- **Pleasant: the data-attribute selector pattern collapsed the variant×intent matrix without `cva`.** CVI uses `class-variance-authority` to express the matrix as a class generator. The Wave 1 recipe writes `data-variant`/`data-intent` once on the rendered element and lets a static `Button.css` resolve the cell — fewer runtime concatenations, easier to inspect in DevTools, and the matrix lives in CSS where designers can edit it.
- **Unpleasant: the styles-API destructure list (7 keys) is implicit knowledge.** A first-time recipe author has no signal — types, jsdoc, runtime warning — that the `props` they receive in `render` still has framework-level keys. The seven-key destructure block in the Button recipe reads as an arbitrary incantation; a future author copying it forward will keep all seven even if they don't apply, and a future author *not* copying it forward will ship broken DOM attrs.
- **Unpleasant: the focus-indicator regression on transparent variants didn't surface in unit tests or in Playwright parity** — both kinds of test snapshot the resolved styles but neither asserts the focus outline is visible against the rendered backdrop. Visual review caught it. Reinforces that pixel-level visual review is non-optional even when a behavior + parity suite is green.

## 4. Soribashi gaps surfaced (Task 1.9)

The four entries below aggregate gaps surfaced during Phase 1 (Tasks 1.2 – 1.8). The codegen `hsl(...)` wrapper gap is the Button-recipe-side mirror of token-consolidation journal § 6's third bullet — cross-referenced rather than duplicated. CVI's `asChild` footgun (Task 1.2) is **not** a soribashi-framework gap and stays in § 1.4 above as a CVI finding.

### Gap 1: Codegen emits `hsl(...)`-wrapped var values

**Severity:** important
**Where surfaced:** Phase 0 Task 0.8 (TokenReview review); recurred as a tax in Phase 1 Tasks 1.5 (Button.css), 1.6 (ButtonMatrix), 1.8 (Playwright resolver)
**What we needed:** CSS vars whose values are bare HSL components (e.g. `--color-primary-500: 221.2 83.2% 53.3%;`) so consumer code can write `hsl(var(--color-primary-500))` for direct use and `hsl(var(--color-primary-500) / <alpha-value>)` for Tailwind alpha utilities.
**What soribashi has today:** `packages/codegen/src/emit-css.ts` emits each var value as a complete `hsl(...)` string (`--color-primary-500: hsl(221.2 83.2% 53.3%);`). Consumers that re-wrap with `hsl(var(--x))` produce invalid `hsl(hsl(...))` which resolves transparent. The Tailwind `<alpha-value>` pattern is unreachable from this format.
**Worked around by:** Every Button-pilot consumer (`Button.css`, `ButtonMatrix.css`, the Playwright `getComputedStyle` resolver) writes `var(--color-...)` directly without `hsl()` wrapping. Works for opaque references; does not enable `bg-primary-500/50`-style alpha utilities.
**Recommended resolution for soribashi:** Add a codegen emit mode (default it on after migration) that produces bare HSL components. Cross-references token-consolidation journal § 6 ("Codegen emits `hsl(...)`-wrapped var values") and the spec's C → A bridge in `docs/superpowers/specs/2026-04-26-token-consolidation-and-button-pilot-design.md` § 3.

### Gap 2: `definePolymorphicComponent` `render` does not strip styles-API props

**Severity:** important
**Where surfaced:** Phase 1 Task 1.5 (Button recipe GREEN)
**What we needed:** The `props` argument passed to `render({ Element, props, getStyles })` should arrive pre-stripped of styles-API framework keys (`classNames`, `styles`, `vars`, `attributes`, `unstyled`, `className`, `style`) so a recipe author can spread `...rest` onto a DOM element without surfacing React unknown-prop warnings.
**What soribashi has today:** Those seven keys still flow through to `render`. The Button recipe explicitly destructures all seven before spreading `...rest`. The factory's own test (`packages/factory/test/define-polymorphic-component.test.tsx:18`) hides the issue with a `...rest as any` cast. No type, jsdoc, runtime warning, or doc page calls out the requirement.
**Worked around by:** Hand-written destructure block at the top of the Button recipe's `render` body that pulls all seven keys out of `props` before spreading the remainder onto the polymorphic `Element`.
**Recommended resolution for soribashi:** Either (a) `useProps` / `useStyles` should consume those keys and the `render` ctx should expose a pre-cleaned `props`; or (b) ship a `splitStylesApiProps(props)` helper from `@soribashi/factory` plus a documented `render` snippet showing the destructure pattern. Option (a) is more ergonomic; option (b) is non-breaking.

### Gap 3: Pilot vitest config template missing jest-dom setup wiring

**Severity:** important
**Where surfaced:** Phase 1 Task 1.5 (10/11 tests green; `disabled-on-loading` failed with `Invalid Chai property: toBeDisabled`)
**What we needed:** The pilot-app vitest config template (Task 1.3 step) should include a `setupFiles` entry that imports `@testing-library/jest-dom/vitest`, so any test using jest-dom matchers (`toBeDisabled`, `toBeInTheDocument`, `toHaveAttribute`, etc.) works out of the box.
**What soribashi has today:** The convention is implemented at `packages/factory/test/setup.ts` and `packages/blocks/test/setup.ts` — every published-package vitest config wires it. The pilot-app template Task 1.3 carried did not propagate the wiring, so the pattern was dropped at the boundary between `packages/*` and `apps/*`.
**Worked around by:** Task 1.5 added `apps/core-radix-pilot/test/setup.ts` (one line: `import '@testing-library/jest-dom/vitest';`) and `setupFiles: ['./test/setup.ts']` in the pilot's `vitest.config.ts`.
**Recommended resolution for soribashi:** Update the pilot-app / consumer-app vitest config template (and any future scaffold) to include the setup wiring by default. This is harness wiring rather than a published-package gap, but it bites every recipe pilot that uses jest-dom matchers — which will be most of them.

### Gap 4: Focus indicator invisible on transparent recipe variants

**Severity:** nice-to-have
**Where surfaced:** Phase 1 Task 1.5 review; deferred from Task 1.5 GREEN
**What we needed:** A focus indicator pattern for recipes that publish a `--cr-{recipe}-bg` local var, that remains visible when `bg` resolves to `transparent` (ghost / link / outline variants).
**What soribashi has today:** No documented recipe-authoring guidance on focus indicators. The Button recipe's first cut wrote `outline: 2px solid var(--cr-button-bg)` which derives the focus color from the background — invisible whenever the background is transparent.
**Worked around by:** Wave 1 leaves the browser's default `:focus-visible` ring intact on the transparent variants and ships a tinted outline only on filled / subtle. Visible-on-keyboard but not intent-coded for the transparent set. Deferred polish.
**Recommended resolution for soribashi:** Treat this as a recipe-authoring footgun rather than a framework bug — document the pattern (route focus color through a dedicated `--cr-{recipe}-focus-ring` var that falls back to the intent's border or text color on transparent variants) in the playbook's pure-styled-primitive entry (Task 1.10 § 6). Not a soribashi-package gap; recorded here as input to the playbook only.

## 5. IconButton + ButtonDropdown extension sketch (Task 1.10)

_Populated below._

## 6. Recommended playbook entries — pure-styled-primitive category (Task 1.10)

_Populated below._
