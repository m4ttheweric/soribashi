# core-radix Conversion Playbook (Wave 1 partial)

**Status:** Wave 1 complete — pure-styled-primitive category covered. Future waves extend.
**Date:** 2026-04-26
**Spec:** `docs/superpowers/specs/2026-04-26-token-consolidation-and-button-pilot-design.md`
**Pilots:**
- `docs/superpowers/pilots/2026-04-26-token-consolidation.md`
- `docs/superpowers/pilots/2026-04-26-button-conversion.md`

## How to read this playbook

The playbook is the synthesis layer over the pilot journals. The journals are the raw evidence — what was tried, what surfaced, what design choices were made and why. The playbook abstracts that into transferable methodology and recommended patterns.

The playbook is designed to extend, not be rewritten. Each future wave (Tooltip, Tabs, Select) appends its category-specific authoring pattern to § 2 and contributes additional gaps to § 3.

## 1. Token consolidation methodology

The methodology is a 6-step loop that takes a fragmented design system and outputs a single focused soribashi theme. Wave 1 ran it against CVI; the same loop applies to any other library.

### Step 1: Inventory

Enumerate every token. For CSS-var-driven systems: read every `--*` declaration in your styles + every reference in your Tailwind config. Capture: name, light value, dark value, where defined, where used (rough usage count).

**Output:** a table — one row per token. (See `docs/superpowers/pilots/2026-04-26-token-consolidation.md` § 1 for the Wave 1 example.)

**Why:** classification needs evidence. Without the full inventory you'll miss duplicates and shadows.

### Step 2: Classify

Tag each token as:
- **signal** — real design intent. Kept.
- **hack** — tooling artifacts (shadcn defaults, framework defaults that were never customized intentionally). Dropped.
- **duplication** — same value under multiple names. Collapsed to one canonical.
- **deferred** — chart colors, ad-hoc one-offs. Documented but out of scope for this consolidation pass.

**Output:** add a `Class` column to the inventory table. Surface open questions in a separate section. (See journal § 2 for distribution stats and § 4 for the deprecation list grouped by class.)

**Why:** without forcing classification, "everything is signal" creeps in and the consolidation loses value.

### Step 3: Express

Build the soribashi theme via `createTheme()`. Express:
- Brand/intent **scales** as `tokens.colors.{family}.{50..950}` — regenerate any scales that don't ramp coherently.
- **Semantic tokens** via `semantic.{text, surface, border}` references to scale anchors — never parallel hand-set values.
- **Dark variants** via the `dark` partial.

**Output:** `theme/index.ts` — the consolidated theme. (See journal § 3 for the Wave 1 decisions: families included, scale regenerations, duplicates collapsed, semantic surface choices.)

**Why:** soribashi's intent resolver gives you a clean home for "semantic name → scale lookup." Resist the urge to hand-set semantic colors.

### Step 4: Codegen

Run `soribashi codegen build --config <pilot>/soribashi.config.ts`. Produces `theme.css` (vars) + `tailwind.config.generated.js` (Tailwind partial).

Wire into the host's `tailwind.config.js` via the compose pattern (Option C — see § 3 for the C → A roadmap):

```js
const generated = require('./src/generated/tailwind.config.generated.js');
module.exports = {
  ...generated,
  content: [...],
  darkMode: 'class', // or your scope
  corePlugins: { preflight: false }, // mirror your host's setting
  plugins: [...(generated.plugins ?? []), require('tailwindcss-animate')],
};
```

**Output:** generated files committed; styles.css imports them; Tailwind utilities resolve from the consolidated theme.

### Step 5: Review

Build a `TokenReview` swatch page (every consolidated token rendered as a labeled swatch in light + dark) and a `ScreenReplica` (static markup of one representative screen using only consolidated tokens). Compare the replica against a screenshot of the original.

**Output:** visual review findings in the journal. (See journal § 7 for the Wave 1 intent-parity sign-off, expected drift, and unexpected drift findings.)

**Why:** **intent parity, not pixel parity.** Drift wherever consolidation deliberately changed something is expected and good. Drift you didn't expect is a finding.

### Step 6: Decide

For every open design question surfaced during steps 2-5: pick a defensible default, document the rationale, flag for human design review. The pilot doesn't block on design's blessing — the playbook escalates.

**Output:** the open-questions section of the journal, ready for design owner review. (See journal § 5 for the Wave 1 questions Q1-Q10.)

### What this methodology assumes

- The host's design system is at least partly token-driven (CSS vars, Tailwind config, etc.). Hand-set hex values everywhere makes consolidation harder; you'll need a preliminary "extract tokens from inline styles" pass first.
- You can run the host's codebase (or a recent screenshot of it) for visual review.
- A human design owner exists and can answer escalated questions.

If any of these don't hold, the methodology is still valuable but produces less confident output.

## 2. Authoring patterns by category

### 2.1 Pure styled primitive (Wave 1 — Button)

Pattern for components with no Radix anatomy, no portal, no controlled state — just styled markup that responds to props.

**Examples in core-radix:** Button, Badge, Chip, Dot, Skeleton, Card.

#### Recipe shape

1. **API split: variant × intent.** Always. `variant` is visual style (`filled`, `outline`, `subtle`, `ghost`, `link`). `intent` is semantic role (`primary`, `neutral`, `success`, `warning`, `danger`, `info`). Never mix them on a single prop. Conflating them produces the variant-explosion + meaning-collision the Button pilot caught in CVI (where `primary`/`secondary` are role and `outline`/`ghost` are style on the same axis — see `docs/superpowers/pilots/2026-04-26-button-conversion.md` § 1.1).
2. **Authoring primitive:** `definePolymorphicComponent` whenever `as=` is plausible (buttons-as-links is the canonical case). `defineComponent` only for components that genuinely have one element (Skeleton, Dot). The polymorphic primitive is more typesafe than CVI's `asChild` + `Slot` and avoids CVI's silent-ignore footgun (see journal § 1.4) where `asChild` is dropped when combined with `isLoading` / `leftIcon` / `rightIcon`. **Type-param order is `<TOwnProps, TDefaultAs>`** — the reverse compiles but produces confusing-but-not-erroring types (journal § 3 Hard).
3. **Selectors:** keep a small, named parts list. For Button: `['root', 'label', 'icon', 'spinner']`. Each part gets its own class (`cr-Button-root`, `cr-Button-label`, …) so downstream styling targets parts, not deep selector chains.
4. **Defaults:** set sensible defaults so consumers can drop the component in without ceremony. Wave 1's Button defaults: `intent: 'primary', variant: 'filled', size: 'md', loading: false, fullWidth: false`.

#### Style approach

Use CSS data-attribute rules over local CSS variables. For each (variant, intent) pair, set 4-5 local `--cr-{component}-*` vars; the root rule pulls from those vars. Avoid Tailwind class concatenation across the matrix — 30 cells of `cva` produces a class-name explosion that's hard to inspect in DevTools and impossible for designers to edit.

```css
/* root: pulls from local vars */
.cr-Button-root {
  background: var(--cr-button-bg);
  color: var(--cr-button-color);
  border-color: var(--cr-button-border);
  /* ... */
}

/* per-cell: just sets the local vars */
.cr-Button-root[data-variant='filled'][data-intent='primary'] {
  --cr-button-bg: var(--color-primary-500);
  --cr-button-color: var(--color-neutral-0);
  --cr-button-border: var(--color-primary-500);
  --cr-button-hover-bg: var(--color-primary-600);
  --cr-button-active-bg: var(--color-primary-700);
}
```

This collapses 30 (variant × intent) cells to: one root rule + 30 four-line override blocks. If any cell needs more than that, it's a smell — re-evaluate. (Wave 1 reference: `apps/core-radix-pilot/src/recipes/Button/Button.css`.)

> **Codegen quirk (Gap 1):** the current codegen emits CSS vars whose values are already complete `hsl(...)` strings (e.g., `--color-primary-500: hsl(221.2 83.2% 53.3%);`). Reference them as `var(--color-...)` directly — wrapping in `hsl(var(...))` produces invalid `hsl(hsl(...))` and resolves to transparent. The Tailwind `bg-primary-500/50` alpha-utility pattern is unreachable from this emit format until soribashi ships a bare-HSL emit mode (journal § 4 Gap 1).

#### State handling

- `disabled` and `loading` should both be visually distinguishable from default. Loading must propagate the `disabled` attribute and suppress click handlers **in the recipe** — don't push that to the consumer. Wave 1's Button computes `isDisabled = disabled || loading` and short-circuits `onClick` before delegating.
- **Polymorphic + disabled:** when `as` is non-button, use `aria-disabled={true}` and `e.preventDefault()` to suppress click. The HTML `disabled` attribute is button-only (anchor tags ignore it). Wave 1's Button branches on `Element === 'button'` to emit `disabled` vs `aria-disabled`; copy the pattern.
- **Strip the seven styles-API props before spreading `...rest` onto the rendered element** (`classNames`, `styles`, `vars`, `attributes`, `unstyled`, `className`, `style`). This is implicit knowledge today and not enforced by types (journal § 4 Gap 2). Lift the destructure block verbatim from Wave 1's Button recipe until soribashi ships a `splitStylesApiProps` helper.

#### Token consumption

- ONLY consolidated theme tokens. Never hand-set hex; never reference legacy fragmented tokens (no `--background`, no shad-* vars, no `claimview-islands.css` vars).
- Hover and active states walk one step deeper in the scale (e.g., `500` default → `600` hover → `700` active for filled; `50` → `100` → `200` for subtle).
- Subtle/ghost variants consume the lighter shades (50/100 backgrounds, 700/800 text).
- **Focus-indicator footgun:** routing the focus outline through the same `--cr-{component}-bg` var that powers the background makes the outline disappear whenever bg is `transparent` (ghost / link / outline variants). Use a dedicated `--cr-{component}-focus-ring` var that falls back to the intent's border or text color on transparent variants. Wave 1's Button defers this for ghost / link / outline (browser default ring stays); a future polish pass should add the dedicated ring var (journal § 4 Gap 4). Don't repeat the mistake in IconButton or any sibling primitive.

#### Tests

- **Vitest behavior** (Wave 1 reference: `apps/core-radix-pilot/src/recipes/Button/Button.test.tsx` — 11 tests): rendering, default props, click handling **in both directions** (disabled/loading suppression AND default fires), icon ordering, polymorphic `as="a"`, fullWidth, spinner present + disabled set on loading. Requires `@testing-library/jest-dom/vitest` wired via `setupFiles` (journal § 4 Gap 3) — copy the wiring from `packages/factory/test/setup.ts`.
- **Playwright parity** (Wave 1 reference: `apps/core-radix-pilot/tests/Button.parity.spec.ts`): smoke the high-frequency cells, not all 30. For Button: filled × all six intents (computed `background-color`); three sizes (computed height); disabled (opacity); loading (spinner present + disabled set).
- Don't aim for 30-cell exhaustiveness in Playwright — the parity tests are smoke for the pattern, not exhaustive proof. **Visual review remains non-optional**; the focus-ring regression (journal § 3 Surprises) didn't surface in either test layer.

#### Recipe code snippet

```tsx
export const Button = definePolymorphicComponent<ButtonOwnProps, 'button'>({
  name: 'Button',
  defaultElement: 'button',
  selectors: ['root', 'label', 'icon', 'spinner'] as const,
  variants: ['filled', 'outline', 'subtle', 'ghost', 'link'] as const,
  classes: {
    root: 'cr-Button-root',
    label: 'cr-Button-label',
    icon: 'cr-Button-icon',
    spinner: 'cr-Button-spinner',
  },
  defaults: {
    intent: 'primary',
    variant: 'filled',
    size: 'md',
    loading: false,
    fullWidth: false,
  },
  render: ({ Element, props, getStyles }) => { /* ... */ },
});
```

See `apps/core-radix-pilot/src/recipes/Button/Button.tsx` for the full implementation (including the styles-API prop destructure and the polymorphic disabled branch).

### 2.2 Transient overlay compound (Wave 2 — Tooltip)

_To be populated by Wave 2._

### 2.3 Persistent navigational compound (Wave 3 — Tabs)

_To be populated by Wave 3._

### 2.4 Form control (Wave 4 — Select)

_To be populated by Wave 4._

## 3. Soribashi gaps surfaced

_Populated in Task 2.4._

## 4. Legacy-token migration strategy stub

_Populated in Task 2.5._

## 5. Future waves outlined

_Populated in Task 2.5._
