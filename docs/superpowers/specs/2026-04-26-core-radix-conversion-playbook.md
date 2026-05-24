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

**Output:** add a `Class` column to the inventory table. Surface open questions in a separate section. (See consolidation journal § 2 for distribution stats and § 4 for the deprecation list grouped by class.)

**Why:** without forcing classification, "everything is signal" creeps in and the consolidation loses value.

### Step 3: Express

Build the soribashi theme via `createTheme()`. Express:
- Brand/intent **scales** as `tokens.colors.{family}.{50..950}` — regenerate any scales that don't ramp coherently.
- **Semantic tokens** via `semantic.{text, surface, border}` references to scale anchors — never parallel hand-set values.
- **Dark variants** via the `dark` partial.

**Output:** `theme/index.ts` — the consolidated theme. (See consolidation journal § 3 for the Wave 1 decisions: families included, scale regenerations, duplicates collapsed, semantic surface choices.)

**Why:** soribashi's intent resolver gives you a clean home for "semantic name → scale lookup." Resist the urge to hand-set semantic colors.

### Step 4: Codegen

Run `soribashi codegen build --config <pilot>/soribashi.config.ts`. Produces `theme.css` (vars) + `tailwind.config.generated.js` (Tailwind partial).

Wire into the host's `tailwind.config.js` via the compose pattern (Option C — the canonical integration model; see § 3):

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

**Output:** visual review findings in the journal. (See consolidation journal § 7 for the Wave 1 intent-parity sign-off, expected drift, and unexpected drift findings.)

**Why:** **intent parity, not pixel parity.** Drift wherever consolidation deliberately changed something is expected and good. Drift you didn't expect is a finding.

### Step 6: Decide

For every open design question surfaced during steps 2-5: pick a defensible default, document the rationale, flag for human design review. The pilot doesn't block on design's blessing — the playbook escalates.

**Output:** the open-questions section of the journal, ready for design owner review. (See consolidation journal § 5 for the Wave 1 questions Q1-Q10.)

### What this methodology assumes

- The host's design system is at least partly token-driven (CSS vars, Tailwind config, etc.). Hand-set hex values everywhere makes consolidation harder; you'll need a preliminary "extract tokens from inline styles" pass first.
- You can run the host's codebase (or a recent screenshot of it) for visual review.
- A human design owner exists and can answer escalated questions.

If any of these don't hold, the methodology is still valuable but produces less confident output.

## 2. Authoring patterns by category

### 2.0 Pilot app test scaffolding (transferable across waves)

Every recipe pilot needs a vitest config that runs jsdom and wires `@testing-library/jest-dom/vitest` so jest-dom matchers (`toBeDisabled`, `toBeInTheDocument`, `toHaveAttribute`, …) work. This convention is already in place for the `packages/*` projects that need it (`packages/factory`, `packages/blocks`) but did not propagate to the `apps/*` boundary in Wave 1's plan template — Task 1.5 stumbled when the first jest-dom matcher failed and added the wiring as a workaround. To prevent every Wave 2-4 pilot from rediscovering the same gap, copy the canonical three-file template below verbatim when scaffolding a new pilot app.

**Canonical `apps/{pilot-name}/vitest.config.ts`:**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./test/setup.ts'],
  },
});
```

**Canonical `apps/{pilot-name}/test/setup.ts`:**

```ts
import '@testing-library/jest-dom/vitest';
```

**Workspace registration** — append the new config to `vitest.workspace.ts` at repo root:

```ts
export default [
  './packages/theme/vitest.config.ts',
  './packages/codegen/vitest.config.ts',
  './packages/factory/vitest.config.ts',
  './packages/blocks/vitest.config.ts',
  './apps/core-radix-pilot/vitest.config.ts',
  './apps/{pilot-name}/vitest.config.ts',  // new entry
];
```

**Dev deps the pilot needs** (add to `apps/{pilot-name}/package.json` and re-run `bun install`):

```
"jsdom"
"@testing-library/react"
"@testing-library/jest-dom"
"@vitejs/plugin-react"
"vitest"
```

(Conversion journal § 4 Gap 3 — DOCUMENTED post-Wave-1.)

### 2.1 Pure styled primitive (Wave 1 — Button)

Pattern for components with no Radix anatomy, no portal, no controlled state — just styled markup that responds to props.

**Examples in core-radix:** Button, Badge, Chip, Dot, Skeleton, Card.

#### Recipe shape

1. **API split: variant × intent.** Always. `variant` is visual style (`filled`, `outline`, `subtle`, `ghost`, `link`). `intent` is semantic role (`primary`, `neutral`, `success`, `warning`, `danger`, `info`). Never mix them on a single prop. Conflating them produces the variant-explosion + meaning-collision the Button pilot caught in CVI (where `primary`/`secondary` are role and `outline`/`ghost` are style on the same axis — see `docs/superpowers/pilots/2026-04-26-button-conversion.md` § 1.1).
2. **Authoring primitive:** `definePolymorphicComponent` whenever `as=` is plausible (buttons-as-links is the canonical case). `defineComponent` only for components that genuinely have one element (Skeleton, Dot). The polymorphic primitive is more typesafe than CVI's `asChild` + `Slot` and avoids CVI's silent-ignore footgun (see conversion journal § 1.4) where `asChild` is dropped when combined with `isLoading` / `leftIcon` / `rightIcon`. **Type-param order is `<TOwnProps, TDefaultAs>`** — the reverse compiles but produces confusing-but-not-erroring types (conversion journal § 3 Hard).
3. **Selectors:** keep a small, named parts list. For Button: `['root', 'label', 'icon', 'spinner']`. Each part gets its own class (`.root`, `.label`, … inside `Button.module.css`) so downstream styling targets parts, not deep selector chains. CSS module scoping makes the class names globally unique at build time without manual prefixes.
4. **Defaults:** set sensible defaults so consumers can drop the component in without ceremony. Wave 1's Button defaults: `intent: 'primary', variant: 'filled', size: 'md', loading: false, fullWidth: false`.

#### Style approach

Use CSS data-attribute rules over local CSS variables. For each (variant, intent) pair, set 4-5 local `--cr-{component}-*` vars; the root rule pulls from those vars. Avoid Tailwind class concatenation across the matrix — 30 cells of `cva` produces a class-name explosion that's hard to inspect in DevTools and impossible for designers to edit.

```css
/* Button.module.css — plain selectors; scoped by the CSS module compiler */

/* root: pulls from local vars */
.root {
  background: var(--cr-button-bg);
  color: var(--cr-button-color);
  border-color: var(--cr-button-border);
  /* ... */
}

/* per-cell: just sets the local vars */
.root[data-variant='filled'][data-intent='primary'] {
  --cr-button-bg: var(--color-primary-500);
  --cr-button-color: var(--color-neutral-0);
  --cr-button-border: var(--color-primary-500);
  --cr-button-hover-bg: var(--color-primary-600);
  --cr-button-active-bg: var(--color-primary-700);
}
```

This collapses 30 (variant × intent) cells to: one root rule + 30 four-line override blocks. If any cell needs more than that, it's a smell — re-evaluate. (Wave 1 reference: `apps/core-radix-pilot/src/recipes/Button/Button.module.css`.)

> **Codegen pattern (Gap 1 — RESOLVED post-Wave-1):** the codegen emits **two** CSS vars per color: the canonical wrapped var (`--color-primary-500: hsl(221.2 83.2% 53.3%);`) for direct CSS use, and a `--__hsl-` companion (`--__hsl-color-primary-500: 221.2 83.2% 53.3%;`) for Tailwind's `<alpha-value>` pattern and any consumer needing alpha (`hsl(var(--__hsl-color-X-Y) / 0.5)`). The Tailwind config wires the `--__hsl-` companion automatically, so `bg-primary-500/50` works out of the box. **Recipe authors:** prefer the canonical var for opaque chrome; reach for the `--__hsl-` companion (or the Tailwind alpha utility) for translucent surfaces, focus rings, and hover tints. Wave 1's Button.css predates the fix and uses only the canonical pattern — that's still correct, just no longer the only option. (Conversion journal § 4 Gap 1 — RESOLVED.)

#### State handling

- `disabled` and `loading` should both be visually distinguishable from default. Loading must propagate the `disabled` attribute and suppress click handlers **in the recipe** — don't push that to the consumer. Wave 1's Button computes `isDisabled = disabled || loading` and short-circuits `onClick` before delegating.
- **Polymorphic + disabled:** when `as` is non-button, use `aria-disabled={true}` and `e.preventDefault()` to suppress click. The HTML `disabled` attribute is button-only (anchor tags ignore it). Wave 1's Button branches on `Element === 'button'` to emit `disabled` vs `aria-disabled`; copy the pattern.
- **Destructure the seven styles-API framework keys alongside your own props** (see § "Render body destructure" below). Spreading the merged `props` object directly onto an `<Element>` would surface React unknown-prop warnings.

#### Token consumption

- ONLY consolidated theme tokens. Never hand-set hex; never reference legacy fragmented tokens (no `--background`, no shad-* vars, no `claimview-islands.css` vars).
- Hover and active states walk one step deeper in the scale (e.g., `500` default → `600` hover → `700` active for filled; `50` → `100` → `200` for subtle).
- Subtle/ghost variants consume the lighter shades (50/100 backgrounds, 700/800 text).
- **Ref forwarding is mandatory and silent (Gap 7 — runtime RESOLVED post-Wave-1):** `definePolymorphicComponent` provides `ref: Ref<unknown>` in the render ctx — the recipe MUST destructure it AND pass `ref={ref}` to the rendered `<Element>`. Forgetting either step makes consumer `<Button ref={...}>` a silent no-op (no warning, no type error, no runtime hint). Wave 1's Button shipped this bug — codex review caught it. Pattern:
  ```tsx
  render: ({ Element, props, getStyles, ref }) => {  // destructure ref
    // ...
    return <Element ref={ref} {...getStyles('root')} {...rest}>...</Element>;
  }
  ```
  Add a vitest test asserting `ref.current.tagName` for both the default element and at least one polymorphic `as=` path. The polymorphic-ref type is currently a tangled intersection — see Gap 7 for the type-ergonomics remainder.

- **Focus-indicator pattern (Gap 4 — RESOLVED post-Wave-1):** routing the focus outline through the same `--cr-{component}-bg` var that powers the background makes the outline disappear whenever bg is `transparent` (ghost / link / outline variants). Resolved via a variant-scoped override that re-routes the outline to `--cr-{component}-color` (the cell's text color, always opaque) for transparent variants only:

  ```css
  /* Button.module.css */
  .root:focus-visible {
    outline: 2px solid var(--cr-button-bg);
    outline-offset: 2px;
  }
  .root[data-variant='ghost']:focus-visible,
  .root[data-variant='link']:focus-visible,
  .root[data-variant='outline']:focus-visible {
    outline-color: var(--cr-button-color);
  }
  ```

  Filled and subtle keep the bg-coherent ring; transparent variants get the text-coherent ring. Reuse this pattern in IconButton, ButtonDropdown, and any future primitive with a transparent variant set. (Conversion journal § 4 Gap 4 — RESOLVED.)

#### Render body destructure

Inside `render`, type the parameter via `PolymorphicRenderCtx<TOwnProps, TDefaultAs, TSelectors, TVariants>` and destructure the seven styles-API framework keys (`className`, `style`, `classNames`, `styles`, `unstyled`, `attributes`, `vars`) **in the same block as your own recipe props** (`variant`, `intent`, `size`, etc.), then spread `...rest` onto the rendered `<Element>`. Don't pass the merged `props` object to `<Element>` directly — the framework keys would surface as React unknown-prop warnings on a DOM node.

```tsx
import { definePolymorphicComponent, type PolymorphicRenderCtx } from '@soribashi/core';

render: ({
  Element,
  props,
  getStyles,
  ref,
}: PolymorphicRenderCtx<ButtonOwnProps, 'button', readonly ['root', 'inner', 'label', 'icon', 'spinner']>) => {
  const {
    // own props
    variant, intent, size, loading, disabled, fullWidth,
    leftIcon, rightIcon, children, onClick,
    // styles-API framework keys (consumed by the factory; not forwarded)
    className, style, classNames, styles, unstyled, attributes, vars,
    ...rest
  } = props;

  return (
    <Element ref={ref} {...getStyles('root')} {...rest}>
      {/* ... */}
    </Element>
  );
},
```

`PolymorphicRenderCtx` types `props` as the intersection of `TOwnProps`, the styles-API framework keys (properly typed against the factory payload), HTML attributes for `TDefaultAs` (so `disabled`, `onClick`, etc. for `<button>` are automatically present), and the variant/intent fields. **No `as` casts inside the render body** — destructuring is fully typed; `...rest` spreads onto `<Element>` cleanly.

This matches Mantine's convention. Every recipe in `@mantine/core` (`Button`, `Anchor`, `ActionIcon`, `UnstyledButton`, …) destructures the framework keys alongside its own props and spreads `...rest` — see `Button.tsx` in `mantinedev/mantine` for a canonical example. **Don't expect the factory to pre-strip:** recipes that compose another soribashi primitive (the way Mantine's `Button` wraps `UnstyledButton`) need to *forward* `unstyled` / `classNames` / `styles` to the inner primitive, which factory-level auto-stripping would break.

If a recipe has zero own props (rare), the destructure block reduces to the seven framework keys plus `...rest`. A `splitStylesApiProps()` helper from `@soribashi/factory` could shorten that case but isn't worth shipping for the volume — most recipes destructure their own props anyway.

(Conversion journal § 4 Gap 2 — DOCUMENTED AS CONVENTION post-Wave-1, refined in Wave 2 by introducing `PolymorphicRenderCtx` so the destructure is fully typed without the prior `as ButtonOwnProps & { ... [k: string]: unknown }` cast block.)

#### Tests

- **Vitest behavior** (Wave 1 reference: `apps/core-radix-pilot/src/recipes/Button/Button.test.tsx` — 11 tests): rendering, default props, click handling **in both directions** (disabled/loading suppression AND default fires), icon ordering, polymorphic `as="a"`, fullWidth, spinner present + disabled set on loading. Pilot test harness (vitest config + jest-dom setup file) is documented in § 2.0 above — copy the three-file template before writing tests.
- **Playwright parity** (Wave 1 reference: `apps/core-radix-pilot/tests/Button.parity.spec.ts`): smoke the high-frequency cells, not all 30. For Button: filled × all six intents (computed `background-color`); three sizes (computed height); disabled (opacity); loading (spinner present + disabled set).
- Don't aim for 30-cell exhaustiveness in Playwright — the parity tests are smoke for the pattern, not exhaustive proof. **Visual review remains non-optional**; the focus-ring regression (conversion journal § 3 Surprises) didn't surface in either test layer.

#### Recipe code snippet

```tsx
import classes from './Button.module.css';

type Variant = 'filled' | 'outline' | 'subtle' | 'ghost' | 'link';

export const Button = definePolymorphicComponent<ButtonOwnProps, 'button'>({
  name: 'Button',
  defaultElement: 'button',
  selectors: ['root', 'label', 'icon', 'spinner'] as const,
  variants: ['filled', 'outline', 'subtle', 'ghost', 'link'] as const,
  classes,
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

Key points:
- `classes` is the CSS module's default export (`Readonly<Record<string, string>>`), slotted directly into the factory's `classes` config field via ES2015 shorthand.
- CSS selectors in `Button.module.css` are plain: `.root`, `.label`, `.icon`, `.spinner` — no `cr-Button-*` prefix needed.
- `Variant` stays local per recipe (visual treatment unique to Button).

See `apps/core-radix-pilot/src/recipes/Button/Button.tsx` for the full implementation (including the styles-API prop destructure and the polymorphic disabled branch).

### 2.2 Transient overlay compound (Wave 2 — Tooltip)

Pattern for components with Radix anatomy, a portal, and ephemeral show/hide lifecycle — tooltips, popovers, hover cards. Radix owns the open/close state machine; soribashi's job is slot styling and context propagation.

**Examples in core-radix:** Tooltip, HoverCard, Popover (all share this anatomy structure).

#### Recipe shape

Use `defineCompound` (from `@soribashi/core`, re-exported from `@soribashi/factory`). The config shape differs from `definePolymorphicComponent` in three ways: (1) `parts` is a keyed object where each part declares its own `render`; (2) `context` derives shared state from root props and makes it available to all parts; (3) `vars` is a per-slot resolver — an object whose keys are part names and whose values are `Record<string, string>` var maps.

**Parts taxonomy — Tooltip has four parts:**

| Part | CSS selector (in `Tooltip.module.css`) | Role |
|---|---|---|
| `provider` | — | Class-3 passthrough; wraps `RadixTooltip.Provider`. No soribashi context. |
| `root` | `.root` | Class-1 context-creator; establishes compound context via `RadixTooltip.Root`. |
| `trigger` | `.trigger` | Class-2 context-consumer; reads `ctx.getStyles()` to apply trigger class. |
| `content` | `.content` | Class-2 context-consumer; reads `ctx.side` + `ctx.sideOffset`; renders in a Portal. |

**Slot vs part — the `arrow` distinction:** `arrow` is declared in `classes` (`.arrow` inside `Tooltip.module.css`) so it participates in the var/class resolution system, but it is **not** exported as a separate part. It's a sub-element slot owned by the `content` part and reached via `getStyles({ part: 'arrow' })`. This is the slot-vs-part distinction: a _part_ is a separately-rendered, separately-exported piece of the compound; a _slot_ is a styling hook owned by another part.

#### Style approach

`classes` maps every part _and_ slot name to a CSS class. The `vars` resolver is an object keyed by part name; each key's value is a `Record<string, string>` of CSS custom-property overrides evaluated at render time.

```ts
vars: (_theme, props) => ({
  content: {
    '--cr-tooltip-bg':    props.variant === 'subtle' ? 'var(--surface-raised)' : 'var(--surface-floating)',
    '--cr-tooltip-color': props.variant === 'subtle' ? 'var(--text-default)'    : 'var(--surface-floating-foreground)',
  },
}),
```

Inside each part's `render`, `getStyles()` returns the class + inline vars for that part's own slot. To target a _different_ slot, pass the part name explicitly: `getStyles({ part: 'arrow' })` returns the class for the `arrow` slot. The content part uses this to render the optional `<RadixTooltip.Arrow>`.

#### State handling

Radix owns the open/close lifecycle entirely. `data-state="delayed-open"` / `data-state="closed"` attributes are emitted by Radix directly onto its own elements and propagate into the portal. The recipe has **no state-toggle code** — no `useState`, no `data-state` writes, no visibility classes toggled in `render`. CSS animations keyed to `data-state` in `Tooltip.module.css` handle the enter/exit transitions automatically.

This is the defining characteristic of the transient-overlay category: the recipe author handles styling; Radix handles lifecycle. Contrast with a pure-styled primitive (Wave 1 — Button) where the recipe is the entire render tree.

#### Token consumption

The Tooltip recipe introduces the `surface.floating` semantic token — a dark, inverted-contrast surface for overlays. Its `vars` resolver references:

- `var(--surface-floating)` — the floating surface background
- `var(--surface-floating-foreground)` — the guaranteed-contrast foreground for that surface

This exercises the **gradual surface↔foreground formalization** pattern (see § 3, "Gradual surface↔foreground formalization (Wave 2)"): because `surface.floating` diverges meaningfully from `surface.default` in lightness (it's a near-black `neutral.900` in light mode), it is declared as a `{ value, foreground }` pair in the theme. Codegen emits both `--surface-floating` and `--surface-floating-foreground`. The recipe pairs them — guaranteed-correct contrast regardless of theme overrides.

The Tooltip's **default variant** uses the formalized `surface.floating` pair (the inverted-style tooltip — guaranteed contrast against any page background, matches shadcn's `bg-foreground` choice). A `subtle` variant opts in to `var(--surface-raised)` + `var(--text-default)` — a slightly elevated tone above the page surface (so the tooltip never matches the page bg, even with a faded box-shadow) — for cases where a less prominent tooltip is wanted; consumer accepts responsibility for contrast at usage sites.

#### Three classes of part

Every `defineCompound` part falls into one of three classes:

- **Class 1 — Root (context-creator).** Calls `RadixTooltip.Root` to initialize Radix's state machine and establishes the soribashi compound context (via the `context` function). All variant/side/sideOffset resolution is done here. One Root per compound.
- **Class 2 — Context-consuming.** `Trigger` and `Content` call `getStyles()` to read the compound context and resolve their class + vars. If rendered outside a Root, `defineCompound` throws a meaningful error (safe context boundary). Use for every part that needs styling or context props.
- **Class 3 — Passthrough.** `Provider` wraps `RadixTooltip.Provider` without coupling to the soribashi compound context at all — it is valid outside a Root, which is the point (Radix's `TooltipProvider` wraps multiple Tooltip instances at the app boundary). Use for parts that are structurally outside the compound's context tree, or for thin delegation wrappers that need no styling.

When authoring a new compound: start with Class 2 for every part, then downgrade to Class 3 only if the part genuinely must exist outside the compound context tree.

#### Render body destructure

`defineCompound` parts receive a render ctx with `{ props, getStyles, ctx, children }`. For polymorphic parts, `Element` and `ref` are also present (same convention as `definePolymorphicComponent`).

Unlike the Wave 1 Button recipe — which destructures all seven styles-API framework keys at the top of one `render` — each part in a compound has its own `render` and destructures only what it needs. The convention is the same: destructure explicitly, spread `...rest` for unknown pass-through props, never forward the raw `props` object to a DOM element.

```tsx
// Content part — destructures own props alongside framework keys
content: {
  render: ({ getStyles, props, ctx, children }: PartRenderCtx<TooltipContentProps, TooltipCtxExtras>) => {
    const showArrow = props.withArrow !== false;
    return (
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={ctx.side}
          sideOffset={props.sideOffset ?? ctx.sideOffset}
          {...getStyles()}
        >
          {children}
          {showArrow && (
            <RadixTooltip.Arrow {...getStyles({ part: 'arrow' })} />
          )}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    );
  },
},
```

#### Tests

- **Vitest behavior** (Wave 2 reference: `apps/core-radix-pilot/src/recipes/Tooltip/Tooltip.test.tsx`): rendering with default props, `data-state` flow for open/close, `withArrow` prop, default + `variant='subtle'` CSS vars applied, `side` prop forwarded to content, Provider wrapping multiple Tooltip instances. Use the same vitest config + jest-dom setup template from § 2.0. Compound tests also exercise `getStyles({ part: 'arrow' })` producing the arrow class.
- **Playwright parity** (Wave 2 reference: `apps/core-radix-pilot/tests/tooltip-computed-styles.spec.ts`): open on hover (default variant — surface.floating bg, light foreground); subtle variant — surface.raised bg, text.default; arrow inherits content bg; dark mode flips the formalized foreground pairing.
- **Manual visual** — non-optional. Enter/exit animation, arrow alignment on all four sides, contrast legibility (default high-contrast + subtle low-contrast), focus-trigger behavior. Playwright does not catch animation drift or sub-pixel arrow misalignment.

Pilot harness is already wired from Wave 1 (§ 2.0 template was applied during pilot scaffolding).

#### Recipe code snippet

```tsx
/**
 * Tooltip recipe — Wave 2 pilot for the transient-overlay compound category.
 *
 * Authored with `defineCompound` from @soribashi/core (re-exported from
 * @soribashi/factory). Wraps @radix-ui/react-tooltip and exercises:
 *   - defineCompound with four parts: Provider, Root, Trigger, Content
 *   - surface.floating formalized foreground pairing (Wave 2 semantic token)
 *   - Passthrough part (Provider — class-3, renders outside compound context)
 *   - asChild forwarding via RadixTooltip.Trigger
 *   - Portal rendering via RadixTooltip.Portal
 *   - Optional arrow via getStyles({ part: 'arrow' }) cross-slot targeting
 *
 * Spec: docs/superpowers/specs/2026-05-04-wave-2-tooltip-pilot-design.md § 6
 * Journal: docs/superpowers/pilots/2026-05-04-tooltip-pilot.md
 */
import * as RadixTooltip from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';
import { defineCompound, type PartRenderCtx } from '@soribashi/core';
import classes from './Tooltip.module.css';

type Variant = 'default' | 'subtle';
type Side = 'top' | 'right' | 'bottom' | 'left';

export interface TooltipRootProps {
  variant?: Variant;
  side?: Side;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

export interface TooltipProviderProps {
  delayDuration?: number;
  skipDelayDuration?: number;
  disableHoverableContent?: boolean;
  children?: ReactNode;
}

export interface TooltipTriggerProps {
  asChild?: boolean;
  children?: ReactNode;
}

export interface TooltipContentProps {
  withArrow?: boolean;
  sideOffset?: number;
  children?: ReactNode;
}

interface TooltipCtxExtras {
  side: Side;
  sideOffset: number;
}

export const Tooltip = defineCompound({
  name: 'Tooltip',
  variants: ['default', 'subtle'] as const,
  classes,
  defaults: { variant: 'default', side: 'top' } as Partial<TooltipRootProps>,
  vars: (_theme, props) => ({
    // Default variant uses surface.floating + its formalized foreground —
    // guaranteed contrast against any page background. Matches shadcn's
    // bg-foreground / text-background pattern. The `subtle` variant opts in
    // to a page-aligned but slightly elevated surface (surface.raised); the
    // box-shadow alone wasn't enough to differentiate it from a same-color
    // page bg. Consumer accepts responsibility for contrast at usage sites.
    content: {
      '--cr-tooltip-bg':
        props.variant === 'subtle'
          ? 'var(--surface-raised)'
          : 'var(--surface-floating)',
      '--cr-tooltip-color':
        props.variant === 'subtle'
          ? 'var(--text-default)'
          : 'var(--surface-floating-foreground)',
    },
  }),
  context: (rootProps) => ({
    side: rootProps.side ?? 'top',
    sideOffset: 4,
  }),
  parts: {
    // Provider — class-3 passthrough: renders outside compound context without
    // throwing. Delegates to RadixTooltip.Provider for the delay-duration
    // state machine shared across multiple Tooltip instances.
    provider: {
      render: ({ props, children }: PartRenderCtx<TooltipProviderProps, TooltipCtxExtras>) => (
        <RadixTooltip.Provider
          delayDuration={props.delayDuration}
          skipDelayDuration={props.skipDelayDuration}
          disableHoverableContent={props.disableHoverableContent}
        >
          {children}
        </RadixTooltip.Provider>
      ),
    },
    // Root — establishes the compound context. Wraps RadixTooltip.Root for
    // open/close state management.
    root: {
      render: ({ props, children }: PartRenderCtx<TooltipRootProps, TooltipCtxExtras>) => (
        <RadixTooltip.Root
          defaultOpen={props.defaultOpen}
          open={props.open}
          onOpenChange={props.onOpenChange}
        >
          {children}
        </RadixTooltip.Root>
      ),
    },
    // Trigger — class-2 part. Reads ctx via getStyles (throws outside Root).
    // asChild merges trigger class onto the provided child element.
    trigger: {
      render: ({ getStyles, props, children }: PartRenderCtx<TooltipTriggerProps, TooltipCtxExtras>) => {
        if (props.asChild) {
          // asChild: Radix Trigger renders as a Slot, merging its props
          // (including our className) onto the single child element.
          return (
            <RadixTooltip.Trigger asChild {...getStyles()}>
              {children}
            </RadixTooltip.Trigger>
          );
        }
        return (
          <RadixTooltip.Trigger {...getStyles()}>
            {children}
          </RadixTooltip.Trigger>
        );
      },
    },
    // Content — class-2 part. Reads ctx for side + sideOffset. Renders inside
    // a Portal so content appears in document.body. Optional Arrow uses
    // cross-slot getStyles({ part: 'arrow' }).
    content: {
      render: ({ getStyles, props, ctx, children }: PartRenderCtx<TooltipContentProps, TooltipCtxExtras>) => {
        const showArrow = props.withArrow !== false;
        return (
          <RadixTooltip.Portal>
            <RadixTooltip.Content
              side={ctx.side}
              sideOffset={props.sideOffset ?? ctx.sideOffset}
              {...getStyles()}
            >
              {children}
              {showArrow && (
                <RadixTooltip.Arrow {...getStyles({ part: 'arrow' })} />
              )}
            </RadixTooltip.Content>
          </RadixTooltip.Portal>
        );
      },
    },
  },
});
```

Key points:
- `import classes from './Tooltip.module.css'` replaces the plain `import './Tooltip.css'`; the module default export slots directly into `classes,`.
- CSS selectors in `Tooltip.module.css` are plain: `.root`, `.trigger`, `.content`, `.arrow` — no `cr-Tooltip-*` prefix needed. The CSS module compiler scopes them at build time.
- `Variant` stays local (visual treatment unique to Tooltip).

See `apps/core-radix-pilot/src/recipes/Tooltip/Tooltip.tsx` for the live source (this snippet is verbatim as of Wave 2).

### 2.3 Persistent navigational compound (Wave 3 — Tabs)

Pattern for components with Radix anatomy, sibling parts in the same DOM tree (no portal), persistent active-state, and controlled-value passthrough — tabs, segmented controls, breadcrumb-like patterns.

**Examples in core-radix:** Tabs, SegmentedControl.

#### Recipe shape

Use `defineCompound` (from `@soribashi/core`). The config shape parallels Wave 2's Tooltip with three notable differences: (1) no `Provider` part — Radix Tabs has no app-level shared state, so the compound is item-flat with four parts (Root / List / Trigger / Content); (2) `Tabs.Trigger` is **polymorphic** via `PolymorphicPartConfig` — the wave's first recipe exercise of that API; (3) the safe-context's `context()` callback returns an empty extras object because Radix's Tabs.Root owns active-value internally, and Triggers/Contents read it through Radix's own context — no soribashi-side state to thread.

**Parts taxonomy — Tabs has four parts:**

| Part | CSS selector (in `Tabs.module.css`) | Role |
|---|---|---|
| `root` | `.root` | Class-1 context-creator. Establishes compound context via `RadixTabs.Root`. Owns `variant` + controlled `value` / `defaultValue` / `onValueChange`. Emits `data-variant` for descendant CSS. |
| `list` | `.list` | Class-2 context-consumer. Wraps `RadixTabs.List`. Reads `ctx.variant` for variant-driven list styling. |
| `trigger` | `.trigger` | Class-2 + polymorphic. Wraps `RadixTabs.Trigger` (asChild). Polymorphic with `defaultElement: 'button'`. Consumer chooses element via `as` prop; recipe never exposes Radix's `asChild` publicly. |
| `content` | `.content` | Class-2 context-consumer. Wraps `RadixTabs.Content`. `forceMount` passthrough for keep-mounted panels. |

#### Polymorphic part API (new in Wave 3)

Declared with `polymorphic: true` and `defaultElement: 'button'` in the `PolymorphicPartConfig`. The part's render function is typed via `PolymorphicPartRenderCtx<TOwnProps, TCtxExtras>` and destructures `Element`, `ref` alongside the usual `getStyles`, `ctx`, `props`, `children`. The emitted element is `<Element ref={ref} {...getStyles()}>{children}</Element>` — same shape as `definePolymorphicComponent` recipes.

This is the wave's first recipe exercise of `PolymorphicPartConfig`. The API was introduced in the Wave 3 in-wave factory fix (see "Render body destructure" below for the typing details).

#### Polymorphic + wrap-Radix interaction via Slot

`RadixTabs.Trigger` needs to be the element receiving Radix's state-machine props (`data-state`, `aria-selected`, click handler, keyboard handlers). When the consumer's `<Element>` is custom (e.g., `as="a"`), the recipe wraps the `<Element>` inside `<RadixTabs.Trigger asChild>{<Element>}</RadixTabs.Trigger>` — Radix's own Slot merges Radix's props onto `<Element>`.

This means `asChild` is a **recipe-internal detail**, not a public prop. Public polymorphism is via `as`; passing a custom component is also expressible via `as={CustomComponent}`. This is a deliberate API divergence from Wave 2's Tooltip (which kept public `asChild`): Tabs.Trigger's job is to render a trigger element, and `as` expresses that more directly than `asChild`.

#### Polymorphic Trigger with non-button elements

When `as="a"` (or any non-button), Radix forwards `disabled` onto the element. `<a disabled>` is non-spec — anchors ignore the attribute. Consumers using polymorphic Trigger with non-button elements should add `aria-disabled` manually if they need disabled semantics. The recipe doesn't poly-fill this — CVI uses button-only.

#### Style approach

Same `data-attribute selector + vars-resolver` hybrid Wave 1 used for Button. Each part emits `data-variant={ctx.variant}` (Root emits its own); CSS rules combine `[data-variant='X'][data-state='active']` for active-cell styling. The `vars` resolver carries only the per-variant token values that CSS can't hardcode (the active-pill bg/fg, where the cell's tokens differ from the chrome above).

```ts
vars: (_theme, props) => ({
  list: {
    '--cr-tabs-active-bg':
      props.variant === 'pills' ? 'var(--color-primary-500)' : 'transparent',
    '--cr-tabs-active-color':
      props.variant === 'pills'
        ? 'var(--surface-default-foreground, var(--color-neutral-0))'
        : 'var(--text-default)',
  },
}),
```

The pills variant's filled active state collides with the default `--color-primary-500` outline color. Variant-scoped focus override re-routes to a contrast-coherent outline:

```css
/* Tabs.module.css */
.trigger[data-variant='pills'][data-state='active']:focus-visible {
  outline-color: var(--color-neutral-0);
  outline-offset: -2px;
}
```

This is the same pattern Wave 1 used for Button's transparent variants — reuse for any future recipe with a filled active state that shares its color with the focus ring.

#### State handling

Radix Tabs owns active-value entirely. `data-state="active"` / `data-state="inactive"` attributes are emitted by Radix directly onto its own elements. The recipe has **no state-toggle code** — no `useState`, no `useUncontrolled`. The `config.context()` callback returns an empty extras object; active-value is not surfaced through soribashi's context because Triggers/Contents read it via Radix's internal context (Radix uses it to match `Trigger.value === Root.value` and emit `data-state`).

This is the defining characteristic of the persistent-navigational category as wrapped on top of Radix: the recipe author handles styling + variant routing + the polymorphic-Trigger seam; Radix handles state + keyboard + a11y. Contrast with Wave 2's Tooltip (transient overlay — Radix also owns the open/close lifecycle but soribashi's context surfaced `side` and `sideOffset` because the recipe needed them for Content placement).

#### Token consumption

The Tabs recipe consumes Wave-1 / Wave-2 semantic tokens unchanged — no new surface token needed. `surface.default` (pills active bg fallback), `text.default` / `text.muted` (trigger fg states), `border.default` (list bottom-border, outline variant), `color.primary.500` (focus ring + pills active bg), `radius.md` / `radius.full`. The pilot's `default` variant deliberately tracks CVI's existing styling so integration is a near-drop-in.

#### Three classes of part — recap

Same taxonomy as Wave 2:

- **Class 1 — Root.** `Tabs` (the Root part). Owns variant and controlled-value props; establishes the safe-context.
- **Class 2 — Context-consuming.** `Tabs.List`, `Tabs.Trigger`, `Tabs.Content` — all read `ctx.variant`. `Tabs.Trigger` additionally declares `polymorphic: true`.
- **Class 3 — Passthrough.** None in Tabs. Radix Tabs has no equivalent of `RadixTooltip.Provider`. The four-part anatomy is item-flat.

When authoring a new compound: start with Class 2 for every part; downgrade to Class 3 only if the part genuinely must live outside the compound context tree.

#### Render body destructure

`defineCompound` parts receive a render ctx with `{ props, getStyles, ctx, children }`. Polymorphic parts add `Element` and `ref`.

For **standard parts** (Root, List, Content), each destructures only what it needs from `props` and never forwards the raw `props` object to a DOM element.

For the **polymorphic Trigger**, the pattern extends the Wave 1 Button destructure-and-rest-spread convention — but with a critical structural difference: there is a **Radix wrapper layer** between the recipe and `<Element>`. The split-destination rule:

- The **Radix wrapper** (`RadixTabs.Trigger`) gets own props that feed the state machine (`value`, `disabled`).
- The **`<Element>`** gets `...rest` (pass-through HTML attrs like `href`, `aria-*`, `data-*`, `onClick`) + `{...getStyles()}` (class/style from the recipe).

The seven styles-API framework keys (`className`, `style`, `classNames`, `styles`, `unstyled`, `attributes`, `vars`) must be destructured out of `props` explicitly — the factory doesn't auto-strip them, and spreading them to a DOM element would surface React unknown-prop warnings.

`children` is available on the render ctx directly; it must be explicitly discarded from `...rest` (using the `_ignoredChildren` discard convention) to avoid passing `children` twice.

`{...rest}` comes BEFORE `{...getStyles()}` so recipe class/style wins over any consumer-supplied className in rest.

The cast intersection (`OwnProps & StylesApiProps & Record<string, unknown>`) is necessary because the factory's props type is opaque to the recipe at this layer.

Full destructure from the live Tabs.tsx Trigger render:

```tsx
trigger: {
  polymorphic: true,
  defaultElement: 'button',
  render: ({
    Element,
    ref,
    getStyles,
    ctx,
    props,
    children,
  }: PolymorphicPartRenderCtx<TabsTriggerOwnProps, TabsCtxExtras>) => {
    const {
      value,
      disabled,
      // styles-API framework keys (consumed by useStyles via getStyles)
      className,
      style,
      classNames,
      styles,
      unstyled,
      attributes,
      vars,
      // children is in the render ctx directly; drop from rest
      children: _ignoredChildren,
      ...rest
    } = props as TabsTriggerOwnProps & {
      className?: string;
      style?: React.CSSProperties;
      classNames?: unknown;
      styles?: unknown;
      unstyled?: unknown;
      attributes?: unknown;
      vars?: unknown;
    } & Record<string, unknown>;
    const Tag = Element as ElementType;
    return (
      <RadixTabs.Trigger asChild value={value} disabled={disabled}>
        <Tag
          ref={ref}
          data-variant={ctx.variant}
          {...rest}
          {...getStyles()}
        >
          {children}
        </Tag>
      </RadixTabs.Trigger>
    );
  },
},
```

**Type-annotation requirement (OQ-7).** The Wave 3 in-wave factory fix made `PolymorphicPartConfig` standalone (no longer extending `StandardPartConfig`) and changed `PartsRecord`'s constraint to a minimal `AnyPartConfig` — necessary because the prior `extends StandardPartConfig` inheritance forced a contravariant subtype relationship TS rejects (TS2430), and the union constraint killed contextual inference for ~150 cases. Trade-off: un-annotated inline render functions lose `TVariants` / `TCtxExtras` inference (they get `any`). Recipe authors must annotate render parameters explicitly with `PartRenderCtx<TProps, TCtxExtras>` or `PolymorphicPartRenderCtx<TProps, TCtxExtras>` — `TVariants` / `TCtxExtras` do not auto-flow into un-annotated inline renders. Real recipes always annotate (as Tabs.tsx does throughout), so this is bounded in practice. Wave 4 (Select) inherits the decision; see Wave 3 spec § 11 OQ-7 for the full trade-off analysis (referred to as OQ-9 erosion in the Wave 2 spec).

#### Tests

- **Vitest behavior** (Wave 3 reference: `apps/core-radix-pilot/src/recipes/Tabs/Tabs.test.tsx` — 23 tests): render lifecycle (`defaultValue` / `data-state`); controlled mode round-trip; keyboard arrow-nav + skip-disabled; three variants apply `data-variant`; pills vars resolve; polymorphic Trigger renders `<button>` by default and `<a>` with `as="a"`; ref forwarding to both default and polymorphic elements; disabled Trigger skipped by nav + clicks; `forceMount` keeps inactive Content in DOM; safe-context throws for each part rendered outside Root; `className` from instance props lands; `Tabs.withDefaults` + `Tabs.Content.withDefaults` round-trip through `createTheme`.
- **Playwright parity** (Wave 3 reference: deferable; vitest covers ~95% of the surface). If wired, per-variant computed-style assertions across the matrix + keyboard nav + dark-mode toggle.
- **Manual visual** — non-optional. Variant matrix in light + dark; focus-ring visibility per variant (especially the pills active-state contrast-coherent override); polymorphic anchor Trigger in DevTools (verifies real `<a>` element); dark-mode toggle redraws all cells correctly.

Pilot harness is already wired from Wave 1 (§ 2.0 template was applied during pilot scaffolding).

#### Recipe code snippet

```tsx
/**
 * Tabs recipe — Wave 3 pilot for the persistent-navigational-compound category.
 *
 * Authored with `defineCompound` from @soribashi/core. Wraps
 * @radix-ui/react-tabs and exercises:
 *   - defineCompound with four parts: Root, List, Trigger, Content
 *   - Polymorphic Trigger via PolymorphicPartConfig (defaultElement: 'button')
 *   - Three variants: default | outline | pills
 *   - Controlled active-value via Radix Tabs (no soribashi-side state)
 *   - data-attribute + vars-resolver hybrid for variant styling
 *
 * Spec: docs/superpowers/specs/2026-05-10-wave-3-tabs-pilot-design.md
 */
import * as RadixTabs from '@radix-ui/react-tabs';
import type { CSSProperties, ElementType, ReactNode } from 'react';
import {
  defineCompound,
  type PartRenderCtx,
  type PolymorphicPartRenderCtx,
} from '@soribashi/core';
import classes from './Tabs.module.css';

type Variant = 'default' | 'outline' | 'pills';

export interface TabsRootProps {
  variant?: Variant;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children?: ReactNode;
}

export interface TabsListProps {
  children?: ReactNode;
}

export interface TabsTriggerOwnProps {
  value: string;
  disabled?: boolean;
  children?: ReactNode;
}

export interface TabsContentProps {
  value: string;
  forceMount?: boolean;
  children?: ReactNode;
}

interface TabsCtxExtras {
  // No extras beyond what the factory injects (variant, getStyles).
}

export const Tabs = defineCompound({
  name: 'Tabs',
  variants: ['default', 'outline', 'pills'] as const,
  classes,
  defaults: { variant: 'default' } as Partial<TabsRootProps>,
  vars: (_theme, props) => ({
    // Variant-driven token vars used by Tabs.module.css's [data-variant='pills']
    // block for the active-pill background/foreground. Other variants
    // don't read these but the resolver still emits sentinel values so
    // tests can assert the per-variant routing.
    list: {
      '--cr-tabs-active-bg':
        props.variant === 'pills' ? 'var(--color-primary-500)' : 'transparent',
      '--cr-tabs-active-color':
        props.variant === 'pills'
          ? 'var(--surface-default-foreground, var(--color-neutral-0))'
          : 'var(--text-default)',
    },
  }),
  context: (_rootProps) => ({} as TabsCtxExtras),
  parts: {
    root: {
      render: ({ props, children }: PartRenderCtx<TabsRootProps, TabsCtxExtras>) => (
        <RadixTabs.Root
          value={props.value}
          defaultValue={props.defaultValue}
          onValueChange={props.onValueChange}
          data-variant={props.variant}
        >
          {children}
        </RadixTabs.Root>
      ),
    },
    list: {
      render: ({ getStyles, ctx, children }: PartRenderCtx<TabsListProps, TabsCtxExtras>) => (
        <RadixTabs.List data-variant={ctx.variant} {...getStyles()}>
          {children}
        </RadixTabs.List>
      ),
    },
    // Trigger — class-2 AND polymorphic. defaultElement: 'button'.
    // Internally always uses RadixTabs.Trigger with asChild so Radix's
    // state-machine props (data-state, aria-selected, click handler,
    // keyboard handlers) merge onto whatever <Element> the consumer chose.
    // Public API: <Tabs.Trigger as="a" href="/foo" value="x">label</Tabs.Trigger>.
    // No public asChild — `as` is the canonical polymorphism mechanism here.
    trigger: {
      polymorphic: true,
      defaultElement: 'button',
      render: ({
        Element,
        ref,
        getStyles,
        ctx,
        props,
        children,
      }: PolymorphicPartRenderCtx<TabsTriggerOwnProps, TabsCtxExtras>) => {
        // Destructure own props + the styles-API framework keys so they don't
        // get spread onto <Element>. Wave 1 playbook § 2.1 "Render body
        // destructure" — same pattern adapted to a polymorphic compound part.
        const {
          value,
          disabled,
          // styles-API framework keys (consumed by useStyles via getStyles)
          className,
          style,
          classNames,
          styles,
          unstyled,
          attributes,
          vars,
          // children is in the render ctx directly; drop from rest
          children: _ignoredChildren,
          ...rest
        } = props as TabsTriggerOwnProps & {
          className?: string;
          style?: CSSProperties;
          classNames?: unknown;
          styles?: unknown;
          unstyled?: unknown;
          attributes?: unknown;
          vars?: unknown;
        } & Record<string, unknown>;
        const Tag = Element as ElementType;
        return (
          <RadixTabs.Trigger asChild value={value} disabled={disabled}>
            <Tag
              ref={ref}
              data-variant={ctx.variant}
              {...rest}
              {...getStyles()}
            >
              {children}
            </Tag>
          </RadixTabs.Trigger>
        );
      },
    },
    content: {
      render: ({
        getStyles,
        props,
        children,
      }: PartRenderCtx<TabsContentProps, TabsCtxExtras>) => (
        <RadixTabs.Content
          value={props.value}
          forceMount={props.forceMount || undefined}
          {...getStyles()}
        >
          {children}
        </RadixTabs.Content>
      ),
    },
  },
});
```

Key points:
- `import classes from './Tabs.module.css'` replaces the plain `import './Tabs.css'`; the module default export slots directly into `classes,`.
- CSS selectors in `Tabs.module.css` are plain: `.root`, `.list`, `.trigger`, `.content` — no `cr-Tabs-*` prefix needed. The CSS module compiler scopes them at build time.
- `Variant` stays local (visual treatment unique to Tabs).

See `apps/core-radix-pilot/src/recipes/Tabs/Tabs.tsx` for the live source (this snippet is verbatim as of Wave 3).

### 2.4 CSS modules

Every recipe uses a `RecipeName.module.css` file. Class names inside the module are plain — `.root`, `.trigger`, `.content` — NOT prefixed with `.cr-Recipe-`. The CSS module compiler scopes them at build time.

**Recipe pattern:**

```ts
import classes from './Button.module.css';

export const Button = definePolymorphicComponent({
  name: 'Button',
  // ...
  classes,
  // ...
});
```

The module's default export is `Readonly<Record<string, string>>` mapping each declared class name to its build-time-scoped form. It slots directly into the factory's `classes?: Partial<Record<TSelectors[number], string>>` config field.

**Data-attribute selectors compose unchanged.** `.root[data-variant='filled']` inside the module becomes `.{scoped-root}[data-variant='filled']` — CSS modules transform class names only, never attribute selectors.

**Global parent classes via `:global()`.** When a recipe needs to react to a global parent class (e.g., `.dark`), wrap the parent in `:global()` so the CSS module compiler doesn't try to scope it:

```css
:global(.dark) .root::before {
  background-color: rgba(0, 0, 0, 0.15);
}
```

The `.root` selector remains locally scoped; only `:global(.dark)` is exempt.

**Keyframes and CSS custom properties are NOT scoped.** `@keyframes cr-button-spin` and `--cr-button-bg` stay verbatim — CSS modules transform class names only.

**Consumer override pattern.** Consumers can pass their own CSS module's exports via the recipe's `classNames` prop:

```tsx
import myStyles from './my-tooltip.module.css';

<Tooltip classNames={{ root: myStyles.root, content: myStyles.content }}>
  ...
</Tooltip>
```

The factory's `useStyles` already merges instance-level `classNames` on top of recipe-level + theme-level entries — no factory change was required.

**Test pattern.** Tests import the same CSS module and assert against `classes.slot`:

```ts
import classes from '../recipes/Tooltip/Tooltip.module.css';

expect(content.className).toContain(classes.content);
expect(document.body.querySelector(`.${classes.content}`)).not.toBeNull();
```

Refactor-safe: renaming `.content` to `.bubble` in the module breaks the test at compile time, not at runtime.

**Vite + Vitest support.** Native, no config change. Add `apps/core-radix-pilot/src/vite-env.d.ts` containing `/// <reference types="vite/client" />` so TypeScript knows the `*.module.css` default-export shape.

### 2.5 Form control (Wave 4 — Select)

_To be populated by Wave 4._

## 3. Soribashi gaps surfaced

Every gap surfaced during Wave 1 Phases 0 + 1 is collected here, deduplicated across the two journals, and tagged with severity. The "Integration model" subsection at the end notes which entries are correctness fixes that apply under Option C (the canonical integration model — see spec § 3) and what's been dropped from the original "C → A bridge" framing.

**Severity rubric:**
- **blocking** — would have prevented the pilot from completing without a workaround that hides the gap. Future waves WILL hit this gap; needs to be fixed in soribashi before a sane rollout.
- **important** — surfaced friction; workaround was viable for Wave 1 but the gap will compound. Fix before Wave 4 (Select) at the latest.
- **nice-to-have** — surfaced but the workaround is fine indefinitely. Optional cleanup.

Wave 1 surfaced no `blocking` gaps in its own implementation pass — every gap had a viable in-pilot workaround. Three `important` and three `nice-to-have` made the cut. A seventh gap (Gap 7 — recipes silently drop forwarded refs) was caught later by independent code review (codex, PR #1, see `docs/superpowers/reviews/2026-04-27-pr-1-review.md`); it's recorded retroactively because the same recipe-author-discipline lessons apply to future waves. **All seven entries have been closed post-Wave-1:** Gap 1 (codegen `hsl(...)` wrapper) via dual-emit codegen change enabling Tailwind alpha utilities; Gap 6 (focus indicator on transparent variants) via a variant-scoped focus override in Button.css; Gap 7 (ref forwarding runtime + type ergonomics) via a Button.tsx fix + 3 new ref-forwarding tests + dropping the redundant `RefAttributes` intersection from `PolymorphicComponentProps`; Gap 4 (`accent.feedback` slot) by extending `SemanticTokens` with an optional `accent?: Record<string, SemanticReference>` slot + conditional codegen emit; Gap 2 (styles-API destructure) reframed as a documented convention (§ 2.1 "Render body destructure") after surveying Mantine's recipes; Gap 3 (pilot vitest template) documented as a transferable scaffold in § 2.0 ("Pilot app test scaffolding"); Gap 5 (border-default reset) decided architecturally — codegen will not emit a universal `*` reset; `semantic.border.default` is a default value for hand-applied rules, with the CVI integration project switching to Tailwind preflight (v3) or per-container scoped rules (v4).

| # | Gap | Severity | Surfaced in | Recommended resolution |
|---|---|---|---|---|
| 1 | Codegen emits `hsl(...)`-wrapped var values; bare-HSL emit needed for Tailwind `<alpha-value>` and `hsl(var(--x))` consumer patterns | ~~important~~ → **resolved** | Consolidation journal § 6 (third bullet) AND conversion journal § 4 Gap 1 — same root cause, surfaced first in Phase 0 Task 0.8 (TokenReview), recurred as a tax in Phase 1 Tasks 1.5 / 1.6 / 1.8 | **RESOLVED post-Wave-1.** Implemented as a **dual-emit** pattern (rather than the bare-only switch originally proposed, which would have broken ~146 existing consumers): codegen now emits both the canonical wrapped var (`--color-primary-500: hsl(...)`) AND a `--__hsl-` bare-component companion (`--__hsl-color-primary-500: ...`). Tailwind config's `<alpha-value>` pattern uses the `--__hsl-` companion. Zero breaking changes; `bg-primary-500/50` and friends now work. Implementation: `packages/codegen/src/emit-css.ts` (`stripHslWrapper` helper) + `packages/codegen/src/emit-tailwind-v3.ts`. Note: this was originally framed as "the C → A bridge's gating gap"; on review it's actually an alpha-utility correctness fix that applies under Option C just as it would have under A — see "Integration model" subsection below for the integration-model reversal. |
| 2 | `definePolymorphicComponent` `render` ctx surfaces the seven styles-API framework keys (`classNames`, `styles`, `vars`, `attributes`, `unstyled`, `className`, `style`) on `props`, requiring a hand-written destructure block before spreading `...rest` onto a DOM element | ~~important~~ → **documented as convention** | Conversion journal § 4 Gap 2 — Phase 1 Task 1.5 (Button recipe GREEN). Hidden in the factory's own test by a `...rest as any` cast (`packages/factory/test/define-polymorphic-component.test.tsx:18`) | **Reframed post-Wave-1.** Reviewing Mantine showed every `@mantine/core` recipe (Button, Anchor, ActionIcon, UnstyledButton, …) destructures the framework keys *in the same block* as its own props and spreads `...rest` — they don't auto-strip in `polymorphicFactory` either. Auto-stripping was rejected because (a) recipes destructure their own props anyway, so the framework keys add ~5 lines, not a 7-line standalone tax; (b) recipes that compose another soribashi primitive need to forward `unstyled` / `classNames` / `styles` to the inner primitive (Mantine's `Button` → `UnstyledButton` does this), which factory-level stripping would break. **Documented in playbook § 2.1 "Render body destructure"** with a canonical block. A `splitStylesApiProps()` helper remains a possible future addition for zero-own-prop recipes but isn't worth shipping for the volume. |
| 3 | Pilot-app vitest config template lacks `setupFiles` wiring for `@testing-library/jest-dom/vitest`; jest-dom matchers (`toBeDisabled`, `toBeInTheDocument`, etc.) fail with `Invalid Chai property` until manually wired | ~~important~~ → **documented** | Conversion journal § 4 Gap 3 — Phase 1 Task 1.5 (10/11 tests green; `disabled-on-loading` failed). Convention exists at `packages/factory/test/setup.ts` and `packages/blocks/test/setup.ts` but did not propagate across the `packages/*` → `apps/*` boundary | **DOCUMENTED post-Wave-1.** Canonical three-file scaffolding template (`vitest.config.ts` with `setupFiles`, `test/setup.ts` with the jest-dom import, `vitest.workspace.ts` registration) lives in playbook § 2.0 "Pilot app test scaffolding." Future Wave 2-4 plan templates should copy from there rather than re-deriving from `packages/*` configs. No tooling change — the repo only has 5 vitest configs total and the duplication isn't enough to justify a shared preset. |
| 4 | `accent.feedback` semantic token has no clean home in the soribashi `SemanticTokens` shape (`text`, `surface`, `border` only — no `accent` slot) | ~~nice-to-have~~ → **resolved** | Consolidation journal § 6 (first bullet) — Phase 0 Task 0.4 (theme expression). Wave 1 omits the token; pilot doesn't render the feedback UI | **RESOLVED post-Wave-1.** Chose option (a): extended `SemanticTokens` with an optional `accent?: Record<string, SemanticReference>` slot symmetrical with `text` / `surface` / `border`. Codegen `emitSemanticLines` emits `--accent-{key}` CSS vars when `theme.semantic.accent` is provided; emits nothing when omitted (zero impact on existing themes). Implementation: `packages/theme/src/types.ts` (slot), `packages/theme/src/create-theme.ts` (conditional pass-through, no default), `packages/codegen/src/emit-css.ts` (conditional emit). Two new vitest tests cover the present + absent cases. Rejected option (b) (sibling top-level family) because `accent` is a *semantic* role, not a token family; rejected option (c) (decorative namespace) as premature given no consumer need. The CVI integration project's `accent.feedback` token is now expressible. |
| 5 | Border-default reset has no in-theme expression: CVI's `colors.borderColor.DEFAULT` Tailwind-config bug is currently worked around via a universal-selector reset in `claimview-islands.css`; the soribashi theme expresses `semantic.border.default → colors.neutral.200` but doesn't emit a corresponding universal `border-color` reset | ~~nice-to-have~~ → **decided (no codegen change)** | Consolidation journal § 6 (second bullet) — Phase 0 Task 0.4 (theme expression); cross-references consolidation journal § 5 Q7 | **DECIDED post-Wave-1.** Codegen does **not** emit a universal `* { border-color: ... }` reset. `semantic.border.default` is a *default value* for hand-applied / utility-driven `border-color` rules, not a global preflight. Reasoning: (a) Tailwind v3's preflight already handles the universal border reset; soribashi emitting a competing `*` rule would fight Tailwind's cascade. (b) Tailwind v4 deliberately dropped the global border reset as a breaking change — emitting one from soribashi would re-introduce the behavior consumers opted out of. (c) Universal selectors are aggressive and clash with consumer-scoped overrides. (d) The CVI-migration story is to switch from `claimview-islands.css`'s universal reset to either Tailwind preflight (v3) or per-container scoped rules (v4); soribashi shouldn't bake in either choice. Documented as architectural decision; no code change. |
| 6 | Focus indicator authoring footgun: routing focus color through the same `--cr-{recipe}-bg` var that powers the background makes the outline invisible whenever bg resolves to `transparent` (ghost / link / outline variants) | ~~nice-to-have~~ → **resolved** | Conversion journal § 4 Gap 4 — Phase 1 Task 1.5 review. Wave 1 originally shipped browser default `:focus-visible` ring on the transparent variants; tinted outline only on filled / subtle | **RESOLVED post-Wave-1.** Variant-scoped override in `Button.css` reroutes `outline-color` to `--cr-button-color` (the intent-coherent text color, always opaque) for ghost / link / outline. Four lines, no per-cell edits. Pattern documented in playbook § 2.1 for reuse in IconButton, ButtonDropdown, and any future recipe with transparent variants. |
| 7 | `definePolymorphicComponent` `render` ctx surfaces `ref` but recipes silently drop it — consumers' `<Button ref={...}>` becomes a no-op. Plus the polymorphic-ref type is a tangled intersection that doesn't accept `createRef<T>()` ergonomically. | ~~important~~ → **resolved (runtime + type ergonomics)** | Conversion journal § 4 Gap 7 — caught by codex code review of PR #1 (`docs/superpowers/reviews/2026-04-27-pr-1-review.md` finding P2). NOT surfaced by Wave 1's own implementation pass; three test layers (vitest behavior, Playwright parity, visual review) all missed it because none asserted `ref.current !== null` | **Runtime RESOLVED post-Wave-1.** Button.tsx now destructures `ref` from the render ctx and passes `ref={ref}` to `<Element>`. Three new vitest tests cover ref forwarding to default `<button>`, polymorphic `as="a"`, and imperative focus. **Type ergonomics RESOLVED post-Wave-1.** `PolymorphicComponentProps` previously intersected `PolymorphicProps & RefAttributes<PolymorphicRef<TAs>>` — the redundant `RefAttributes` (since `ComponentPropsWithRef<TAs>` already provides `ref?`) produced a tangled `RefObject<T> & RefObject<callback \| RefObject<T> \| null>` type that rejected `createRef<T>()` without casts. Dropped the intersection so `PolymorphicComponentProps = PolymorphicProps`. The `refProp(ref)` cast helper in Button tests was deleted; consumers now pass `ref={createRef<HTMLButtonElement>()}` directly. Implementation: `packages/factory/src/types/polymorphic.ts`. |

### Integration model: Option C is canonical

Wave 1 shipped against Option C — soribashi emits a Tailwind partial; the host's `tailwind.config.js` composes it with host-policy concerns (preflight setting, plugin set, content globs, dark-mode selector). An earlier draft framed Option A (soribashi owns the entire Tailwind config) as the north star, but on review (2026-05-02) that framing was reversed:

- **Substrate-agnosticism wins.** Foundational soribashi-design spec § 3.2 positions CSS custom properties as the primary output and Tailwind config as "an optional second output." CSS Modules consumers don't use a Tailwind config at all. Owning the full Tailwind config conflicts with that principle.
- **Host-policy concerns belong to the host.** Content globs (host-specific file structure), plugins (analytics / animations / custom utilities), and preflight (depends on coexisting CSS systems) are not soribashi's call. Composition is the correct seam.
- **The single-line consumer config was aesthetic.** Hiding host-policy declarations under a soribashi indirection doesn't reduce what the host owns; it just moves declarations between files.

See foundational spec § 3 ("Integration model") for the full reasoning + the history of the reversal.

**What remains from the original "C → A bridge" gap list:**

- **Gap 1 (codegen `hsl(...)` wrapper) — RESOLVED post-Wave-1.** Tailwind's `<alpha-value>` pattern requires bare HSL components so the utility can splice alpha in (`bg-primary-500/50` → `hsl(var(--__hsl-color-X-Y) / 0.5)`). Resolved via dual-emit: codegen emits both the canonical wrapped var (`--color-X-Y`) for direct CSS use and a `--__hsl-` bare-component companion for Tailwind alpha. Zero breaking changes; alpha utilities now work. This was always an alpha-utility correctness fix, not an integration-model concern — it applies under Option C.

- **Configurable dark-mode selector — already implemented (verified 2026-05-02).** `ThemeDefinition.darkMode.selector` defaults to `.dark` and is read by `emitCss` at `packages/codegen/src/emit-css.ts:36` (dark block) and `:59` (scoped dark blocks). Consumers like CVI can pass `darkMode: { selector: '.dark .claim-view-islands' }` to `createTheme` and get the right scope emitted. Two existing tests verify: `packages/codegen/test/emit-css.test.ts:120` exercises CVI's exact selector; `packages/codegen/test/emit-css-emitter-logic.test.ts:324` exercises `[data-theme="dark"]`. The original Wave-1-era claim that "codegen hardcodes `.dark`" was incorrect — the configurability has been wired in since well before Wave 1. No codegen change is needed before the CVI integration project.

- ~~**Config-level pass-through for `corePlugins.preflight`, plugins, content globs**~~ — **dropped.** These are host-policy concerns under Option C; consumers compose them in their own `tailwind.config.js` and that's the right seam.

The other Wave 1 gaps (#2 styles-API destructure convention, #3 vitest scaffold, #4 accent.feedback, #5 border-default reset, #6 focus indicator) are about recipe authoring ergonomics, theme-shape coverage, or harness wiring — none of them depend on integration model.

### Gradual surface↔foreground formalization (Wave 2)

**Convention:** when introducing a semantic surface whose lightness diverges
meaningfully from `surface.default`, declare it as `{ value, foreground }`.
Codegen emits both `--surface-{name}` and `--surface-{name}-foreground`.
Consumers pair the two — guaranteed-correct contrast.

When introducing a surface that lives in the page's normal contrast band
(canvas / default / raised / sunken), keep the string form and pair informally
with `text.default`.

**Existing Wave-1 surfaces are not retroactively formalized.** The migration
cost (rename every `text.default` reference to `surface.X-foreground`) is
not justified by Wave 2's needs and does not need to be paid retroactively.
Future surfaces are formalized at introduction time.

**Wave 2 example:** the pilot's `surface.floating` is declared as
`{ value: 'neutral.900', foreground: 'neutral.0' }`. The Tooltip recipe's
`vars` resolver then references `var(--surface-floating)` and
`var(--surface-floating-foreground)` for the inverted variant — a guaranteed
contrast pair regardless of theme overrides.

## 4. Legacy-token migration strategy stub

**Scope:** the integration project's job — migrate CVI's existing 115 importers from fragmented tokens to the consolidated vocabulary. Sized here, not designed.

### Migration surface

Pull from `docs/superpowers/pilots/2026-04-26-token-consolidation.md` § 4 (deprecation list — 71 deprecated rows across `hack` / `duplication` / `deferred` classes plus the 22-row informational `error → danger` family rename in § 4.4). Every dropped or collapsed token has a named target written in the consolidated theme's vocabulary. The migration is fundamentally a find/replace at the token-name level, plus visual review.

### Phasing (rough sizing)

- **Phase A — `shad-*` rip-out (S/M).** Every reference to the 39 shad-layer tokens cataloged in consolidation journal § 4.1 (CSS vars `--background`, `--foreground`, `--primary`, `--card`, `--popover`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--radius` and their `colors.shad.*` Tailwind aliases). Each row in § 4.1 carries an explicit migration target. Mostly mechanical. ~50 file touches estimated.
- **Phase B — Scale renames (S).** `--color-error-*` → `--color-danger-*` and `colors.error.*` → `colors.danger.*` (the family rename per consolidation journal § 4.4 — 22 informational rows). Plus the duplication-class `DEFAULT` collapses from consolidation journal § 4.2 (e.g. `colors.primary.DEFAULT` → `colors.primary.500`). All mechanical.
- **Phase C — Variant taxonomy migration on Button usages (M).** Every `<Button variant="primary">` becomes `<Button intent="primary" variant="filled">` (and analogous splits across the 30-cell intent × variant matrix the Wave 1 recipe lands — see § 2.1 and `docs/superpowers/pilots/2026-04-26-button-conversion.md` § 1.1). Codemod-friendly. ~80-100 call sites.
- **Phase D — Visual review per page (M/L).** After A-C, render each CVI page in the consolidated theme; capture findings; iterate. Mirrors the Wave 1 Phase 0 Task 0.10 visual-review loop, but at CVI-page scale rather than a single ScreenReplica.
- **Phase E — Deprecation of the legacy `claimview-islands.css` var declarations (S).** Once nothing references the legacy vars, delete them from the CVI host CSS and from the Tailwind config's `theme.extend` block.

The integration project gets its own brainstorm + spec + plan. This stub is the input — it sizes the work and points to the row-by-row migration targets in the journal, but does not design the project.

## 5. Future waves outlined

Each wave reuses the consolidated theme from Wave 1. None redoes the token work. Each produces its own pilot + journal + playbook extension (added to § 2.X above). Cross-reference: this list mirrors and extends `docs/superpowers/specs/2026-04-26-token-consolidation-and-button-pilot-design.md` § 11.

### Wave 2 — Tooltip (transient overlay compound)

**Why:** answers "how do I author a Radix-anatomy compound" — the open question Wave 1 deliberately deferred. Forces soribashi to address slot styling, portal handling, `data-state`-driven styling, and surface tokens (popover bg / border / shadow).

**Pre-work:** likely needs a soribashi compound-authoring helper. Design-and-spec is part of Wave 2, not Wave 1.

**Sizing:** M.

### Wave 3 — Tabs (persistent navigational compound)

**Why:** tests slot story at higher part-count (Root / List / Trigger / Content) and with controlled state passthrough.

**Pre-work:** Wave 2 lands the compound primitive; Wave 3 stresses it.

**Sizing:** M.

### Wave 4 — Select (form control)

**Why:** the heaviest anatomy in core-radix. Field composition (label / help / error slots), controlled state, keyboard a11y, trigger-vs-content surface tokens, option rendering.

**Pre-work:** Waves 2 and 3 lock the compound + slot patterns. Wave 4 also exercises field composition (label / help / error slots).

**Sizing:** L.

### After Wave 4

The playbook covers all four authoring categories. The remaining ~20 core-radix component groups can be sequenced as a sweep, leaning on the pattern most appropriate per category. Pure-styled-primitive siblings of Wave 1's Button (IconButton, ButtonDropdown — sketched in conversion journal § 5) slot directly into the § 2.1 pattern without further authoring research; they're sequencing for that sweep, not playbook extensions. Bundling vs one-by-one is a sequencing question for that project.
