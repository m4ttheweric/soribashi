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
- **Unpleasant: spec § 7.1 step 3 (side-by-side rendering of the vendored CVI Button in `ButtonMatrix.tsx`) was deviated from.** The spec called for rendering the vendored CVI Button alongside the consolidated recipe so reviewers could eyeball the visual deltas per cell. Implementation skipped this: the vendored Button at `apps/core-radix-pilot/src/reference/core-radix-button/Button.tsx` imports `@assured/design-system`, `class-variance-authority`, `../lib/utils` (CVI's `cn` helper), and references shad-* tokens / hex colors / CVI's icon system — none of which the pilot installs. Making it run would require either shimming all four dependency surfaces (a non-trivial side-quest with no test value beyond the visual diff) or rendering a visually-broken element in pilot chrome (which would mislead reviewers more than it informs). Instead, `ButtonMatrix.tsx` ships an inline "Consolidation notes" callout (`pages/ButtonMatrix.tsx:71`) that enumerates the per-cell semantic deltas in prose. This is a documented spec deviation; future waves should weigh whether to ship the shim layer (one-time cost, recurring visual-diff payoff) or take the same prose-callout shortcut. The choice should be made wave-by-wave based on how many siblings reuse the same vendored dependency surface.

## 4. Soribashi gaps surfaced (Task 1.9)

The four entries below aggregate gaps surfaced during Phase 1 (Tasks 1.2 – 1.8). The codegen `hsl(...)` wrapper gap is the Button-recipe-side mirror of token-consolidation journal § 6's third bullet — cross-referenced rather than duplicated. CVI's `asChild` footgun (Task 1.2) is **not** a soribashi-framework gap and stays in § 1.4 above as a CVI finding.

### Gap 1: Codegen emits `hsl(...)`-wrapped var values — RESOLVED (post-Wave-1)

**Severity:** ~~important~~ → **resolved**
**Where surfaced:** Phase 0 Task 0.8 (TokenReview review); recurred as a tax in Phase 1 Tasks 1.5 (Button.css), 1.6 (ButtonMatrix), 1.8 (Playwright resolver)
**What we needed:** CSS vars whose values are bare HSL components (e.g. `--color-primary-500: 221.2 83.2% 53.3%;`) so consumer code can write `hsl(var(--color-primary-500))` for direct use and `hsl(var(--color-primary-500) / <alpha-value>)` for Tailwind alpha utilities.
**What soribashi had:** `packages/codegen/src/emit-css.ts` emitted each var value as a complete `hsl(...)` string. Consumers re-wrapping with `hsl(var(--x))` produced invalid `hsl(hsl(...))` resolving transparent. The Tailwind `<alpha-value>` pattern was unreachable from this format.
**Worked around by (during Wave 1):** Every Button-pilot consumer (`Button.css`, `ButtonMatrix.css`, the Playwright `getComputedStyle` resolver) wrote `var(--color-...)` directly without `hsl()` wrapping. Worked for opaque references; did not enable `bg-primary-500/50`-style alpha utilities.

**Resolution shipped (post-Wave-1):** Implemented as a **dual-emit** pattern rather than the bare-only switch originally proposed. The bare-only approach would have broken ~146 existing consumers across `packages/blocks` (Paper.css), `get-theme-color.ts`, and the Mantine-adapted code that all assume `--color-X-Y` resolves to a usable color. The codegen now emits **both** the canonical wrapped var AND a `-hsl` bare-component companion:
- `--color-primary-500: hsl(221.2 83.2% 53.3%);` (canonical, unchanged)
- `--color-primary-500-hsl: 221.2 83.2% 53.3%;` (companion, for alpha use)

The Tailwind config's `<alpha-value>` pattern uses the `-hsl` companion: `'500': 'hsl(var(--color-primary-500-hsl) / <alpha-value>)'`. **Zero breaking changes** to existing consumers. Tailwind alpha utilities (`bg-primary-500/50`) now work correctly. Implementation: `packages/codegen/src/emit-css.ts` (`stripHslWrapper` helper + dual-emit in `emitTokenLines` and `emitDarkTokenLines`); `packages/codegen/src/emit-tailwind-v3.ts` (companion-var reference). Tests added in `packages/codegen/test/emit-css.test.ts`. The C → A bridge in the playbook is unblocked.

**Implication for future waves:** Wave 2-4 recipes can use either pattern. Direct opaque colors stay simple (`var(--color-X-Y)`); alpha-needing surfaces (modal scrim, focus rings, hover tints) use the `-hsl` companion (`hsl(var(--color-X-Y-hsl) / 0.4)`) or Tailwind alpha utilities (`bg-X-Y/40`).

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

These are sketches, not implementations. The point is to confirm — before Phase 2's playbook synthesis — that the recipe shape arrived at in §§ 1 – 4 generalises to the next two CVI button siblings. If either sketch had required a new soribashi primitive or an awkward shape-twist, that would be a finding worth blocking on. Neither does.

### 5.1 IconButton

**Reference (vendored CVI):** `apps/core-radix-pilot/src/reference/core-radix-button/IconButton.tsx`

CVI's IconButton is a square Button with one mandatory icon and one mandatory `aria-label`. CVI's distinctive shape:
- Shares the focus-ring / disabled / transition base styles with Button but ships its own `cva` rather than composing the Button recipe.
- Adds an **XL size** (`h-12 w-12`) that the parent Button doesn't have.
- Adds a **dot indicator** (`dot` + `dotClassName` props) — an absolute-positioned slot in the top-right for unread/notification badges; only honored when `asChild` is false.
- Drops the `secondary` / `danger` / `success` variants — only `primary` / `outline` / `ghost`.
- Uses CVI's icon system (`IconKey` + `IconFlatRenderer`) so the consumer passes a key, not a node.

**Recipe shape (Wave 1 vocabulary):**
- **Reuses:** the entire intent × variant system from § 2's Button recipe; the `[data-variant][data-intent]` CSS rules over local `--cr-iconbutton-*` vars; the `disabled` / `loading` state handling; the polymorphic `as` prop story.
- **Constrains:** no `children`. One `icon: ReactNode` prop. `aria-label: string` is required at the type level. No `leftIcon` / `rightIcon` / `fullWidth` props (square; one icon only).
- **Adds:** square sizing (h = w; sm/md/lg/xl — picks up CVI's xl). An optional `dot?: ReactNode` slot rendered absolute-positioned in the root via a fourth selector. Aspect-ratio + padding routed through size-keyed CSS like Button's height tokens.
- **Slots / selectors:** `['root', 'icon', 'dot']`. (Button's `label` and `spinner` selectors don't apply — no label, and the spinner replaces the icon in-place rather than rendering alongside it.)
- **Defaults:** `intent: 'neutral', variant: 'outline', size: 'md', loading: false`. (CVI's `defaultVariants` are `outline` + `md` — keep that vibe; intent defaults to neutral because the dominant icon-button use is "secondary action in a toolbar".)

**Sketch:**

```tsx
type IconButtonOwnProps = {
  intent?: Intent;                 // reuse Button's Intent union
  variant?: Variant;               // reuse Button's Variant union
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon: ReactNode;                 // mandatory; one icon, no children
  'aria-label': string;            // mandatory at the type level
  loading?: boolean;
  dot?: ReactNode;                 // optional notification slot
};

export const IconButton = definePolymorphicComponent<IconButtonOwnProps, 'button'>({
  name: 'IconButton',
  defaultElement: 'button',
  selectors: ['root', 'icon', 'dot'] as const,
  variants: ['filled', 'outline', 'subtle', 'ghost'] as const, // no `link` for icon-only
  classes: {
    root: 'cr-IconButton-root',
    icon: 'cr-IconButton-icon',
    dot: 'cr-IconButton-dot',
  },
  defaults: { intent: 'neutral', variant: 'outline', size: 'md', loading: false },
  render: ({ Element, props, getStyles }) => {
    // styles-api destructure block per § 4 Gap 2 — same seven keys as Button.
    const { intent, variant, size, icon, loading, dot, disabled, onClick,
      /* + the seven styles-api keys */ ...rest } = props;

    const isDisabled = Boolean(disabled) || Boolean(loading);
    const isButton = Element === 'button';

    return (
      <Element
        type={isButton ? 'button' : undefined}
        {...getStyles('root')}
        {...rest}
        data-intent={intent}
        data-variant={variant}
        data-size={size}
        data-loading={loading ? 'true' : undefined}
        disabled={isButton ? isDisabled : undefined}
        aria-disabled={!isButton && isDisabled ? true : undefined}
        onClick={(e) => { if (isDisabled) { e.preventDefault(); return; } onClick?.(e); }}
      >
        <span {...getStyles('icon')} data-part="icon" aria-hidden>
          {loading ? <Spinner /> : icon}
        </span>
        {dot && (
          <span {...getStyles('dot')} data-part="dot" aria-hidden>
            {dot}
          </span>
        )}
      </Element>
    );
  },
});
```

**Conclusion:** the recipe shape extends cleanly. **No new soribashi primitives needed.** The XL size is one extra row in the size-keyed CSS; the `dot` slot is a fourth `selectors` entry. The pattern transfers without any factory-level change.

The same four soribashi gaps from § 4 will apply to this recipe (codegen `hsl(...)` wrapper, styles-API destructure, jest-dom wiring on the pilot template, focus indicator on transparent variants). None of them grow worse for IconButton; they just recur. That's evidence the gaps are pattern-level, not Button-specific — supporting their inclusion in the playbook (§ 3 of the playbook spec).

### 5.2 ButtonDropdown

**Reference (vendored CVI):** `apps/core-radix-pilot/src/reference/core-radix-button/ButtonDropdown.tsx`

CVI's ButtonDropdown is a Button with a chevron + a Radix DropdownMenu attached. Distinctive shape:
- Trigger is a `<button>` styled with the same `buttonVariants` `cva` as Button — composition by class-name reuse, not component reuse.
- Wraps `@radix-ui/react-dropdown-menu` (Root / Trigger / Portal / Content) with its own `dropdownContentVariants` for width (`sm`/`md`/`lg`/`auto`) and border color.
- Manages local `open` state to drive a `rotate-180` chevron animation.
- Forces a chevron icon (inline SVG), forbids `rightIcon`, forbids `asChild`.
- Receives the dropdown body as a `dropdownContent: ReactNode` prop — slot, not children.

**Recipe shape (Wave 1 vocabulary):**

The Button half: composes the existing Button recipe directly (`<Button rightIcon={<Chevron />} aria-expanded={open}>`). Reuses intent × variant × size × loading × disabled — no duplication. The chevron rotation is one CSS rule keyed on `[aria-expanded='true']`.

The Dropdown half: this is **the** Wave-2-or-later overlay-compound work. It needs:
- An overlay-compound authoring primitive for the soribashi factory (Trigger / Portal / Content / Item parts wired through `getStyles` and shared context).
- A converted `core-radix/DropdownMenu` recipe — Wave 1 doesn't have one, and authoring it inline inside ButtonDropdown would prejudge the overlay-compound playbook entry that Wave 2 is meant to write.
- A pattern for content-positioning props (`align`, `side`, `sideOffset`, `width`) that maps to Radix Popper without leaking Radix-specific types into the soribashi API.

**Sketch (Phase 2 / Wave 2 — illustrative only):**

```tsx
// Hypothetical — assumes a Wave 2 DropdownMenu recipe exists.
type ButtonDropdownOwnProps = Omit<ButtonOwnProps, 'rightIcon'> & {
  dropdownContent: ReactNode;
  dropdownAlign?: 'start' | 'end';
  width?: 'sm' | 'md' | 'lg' | 'auto';
};

export const ButtonDropdown = (props: ButtonDropdownOwnProps) => {
  const { dropdownContent, dropdownAlign = 'start', width = 'md', ...buttonProps } = props;
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <Button
          {...buttonProps}
          aria-expanded={open}
          rightIcon={<Chevron data-rotate={open ? 'true' : undefined} />}
        />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align={dropdownAlign} data-width={width}>
        {dropdownContent}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};
```

**Conclusion:** the recipe shape composes cleanly — Button stays untouched, ButtonDropdown is a thin wrapper. **But it depends on a converted DropdownMenu, which is the Wave 2 overlay-compound work.** Authoring ButtonDropdown today would either inline an ad-hoc Radix wrapper (which prejudges the overlay-compound pattern Wave 2 should derive from Tooltip first) or hand-import `@radix-ui/react-dropdown-menu` directly (which leaks Radix into the recipe layer). Neither is acceptable.

**Defer ButtonDropdown until Wave 2 lands the overlay-compound pattern.** Captured here as evidence that the pattern composes when the overlay primitive exists.

## 6. Recommended playbook entries — pure-styled-primitive category (Task 1.10)

These feed Phase 2 Task 2.3 (the playbook's § 2.1 — Pure styled primitive authoring pattern). Each entry below is grounded in a specific Wave 1 finding cited inline.

1. **API split: `variant` × `intent`. Always.** Visual style and semantic role are orthogonal axes; conflating them on a single prop produces the variant-explosion + meaning-collision that § 1.1 caught in CVI (`primary` / `secondary` are role; `outline` / `ghost` are style; `danger` / `success` are role). Wave 1's split: `variant` ∈ {filled, outline, subtle, ghost, link}; `intent` ∈ {primary, neutral, success, warning, danger, info}. One component expresses all 30 cells without a one-off variant per combination.

2. **Authoring primitive: `definePolymorphicComponent` whenever `as=` is plausible.** Buttons-as-links (`as="a"`) is the canonical case. Use `defineComponent` only for components that genuinely have one element (Skeleton, Dot). The polymorphic primitive is more typesafe than CVI's `asChild` + `Slot` and avoids CVI's silent-ignore footgun (§ 1.4) where `asChild` is dropped when combined with `isLoading` / `leftIcon` / `rightIcon`. **Type-param order is `<TOwnProps, TDefaultAs>`** — the reverse compiles but produces confusing-but-not-erroring types (§ 3 Hard).

3. **Style approach: CSS data-attribute rules over local CSS vars.** For each (variant, intent) pair, write one selector that sets 4-5 local `--cr-{component}-*` vars (bg, fg, border, hover-bg, active-bg). The root rule pulls from those vars. Avoid Tailwind class concatenation across the matrix — 30 cells of `cva` produces a class-name explosion that's hard to inspect in DevTools and impossible for designers to edit. Wave 1's Button.css collapses 30 cells to one root rule + 30 four-line override blocks (§ 3 Easy + § 3 Surprises).

4. **Token consumption: pick the right var by use case.** Codegen emits two vars per color (Gap 1, RESOLVED post-Wave-1):
    - **Canonical wrapped** (`--color-primary-500`): use directly for opaque chrome — `background: var(--color-primary-500)`. **Don't** wrap in `hsl()` — that produces `hsl(hsl(...))` and resolves transparent.
    - **Bare-component companion** (`--color-primary-500-hsl`): use when you need alpha — `background: hsl(var(--color-primary-500-hsl) / 0.4)`. Tailwind alpha utilities (`bg-primary-500/50`, `text-success-700/80`, `border-danger-500/30`) work out of the box because the generated config wires the `-hsl` companion into the `<alpha-value>` pattern.

    **Never hand-set hex; never reference legacy fragmented tokens.** Hover and active states either walk one step deeper in the scale (500 → 600 → 700 for filled; 50 → 100 → 200 for subtle) OR use a tinted alpha overlay (`hsl(var(--color-primary-500-hsl) / 0.1)` for subtle hover lift).

5. **State props: `disabled`, `loading`, plus component-specific (`fullWidth` for Button).** Loading must propagate `disabled` and suppress `onClick` *in the recipe* — don't push that to the consumer. **Polymorphic + disabled:** when `as` is non-button, use `aria-disabled={true}` + `e.preventDefault()` for click suppression; the HTML `disabled` attribute is button-only (anchor tags ignore it). Wave 1's Button does both branches correctly — copy the pattern.

6. **Slots / selectors: keep the parts list small and named.** Button's `['root', 'label', 'icon', 'spinner']` covers every override consumers actually need. Each part gets its own class (`cr-Button-root`, `cr-Button-label`, …) so downstream styling targets parts, not deep selector chains. **Strip the seven styles-API props before spreading `...rest` onto the rendered element** (`classNames`, `styles`, `vars`, `attributes`, `unstyled`, `className`, `style`) — this is implicit knowledge today and not enforced by types (Gap 2). Lift the destructure block verbatim from Wave 1's Button recipe until soribashi ships a `splitStylesApiProps` helper.

7. **Focus indicator on transparent variants is a recipe-authoring footgun.** Routing the focus outline through the same `--cr-{component}-bg` var that powers the background makes the outline disappear whenever bg is `transparent` (ghost / link / outline variants). Use a dedicated `--cr-{component}-focus-ring` var that falls back to the intent's border or text color on transparent variants. Wave 1's Button defers this for ghost / link / outline (browser default ring stays); a future polish pass should add the dedicated ring var (Gap 4). Don't repeat the mistake in IconButton or any sibling.

**Test scope for the category:**
- **Vitest behavior** (Wave 1 reference: `apps/core-radix-pilot/src/recipes/Button/Button.test.tsx` — 11 tests): default props, click handling in both directions (disabled / loading suppress; default fires), icon ordering, polymorphic `as="a"`, fullWidth, spinner present + disabled set on loading. Requires `@testing-library/jest-dom/vitest` wired via `setupFiles` (Gap 3) — copy the wiring from `packages/factory/test/setup.ts`.
- **Playwright parity** (Wave 1 reference: `apps/core-radix-pilot/tests/Button.parity.spec.ts`): smoke the high-frequency cells, not all 30. For Button: filled × all six intents (background-color), three sizes (height), disabled (opacity), loading (spinner present + disabled set). Reuses the matrix-snapshot pattern from Phase 0 Task 0.10 ScreenReplica — same `webServer`, same fixture style.
- Don't aim for 30-cell exhaustiveness in Playwright; the parity tests are smoke for the pattern, not exhaustive proof. **Visual review remains non-optional** — the focus-ring regression (§ 3 Surprises) didn't surface in either test layer.

The playbook (Phase 2 Task 2.3) will expand each of these with rationale and the corresponding code excerpts from `apps/core-radix-pilot/src/recipes/Button/`.
