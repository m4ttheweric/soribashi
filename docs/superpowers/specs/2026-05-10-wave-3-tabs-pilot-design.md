# Wave 3 — Tabs Pilot (Persistent Navigational Compound) — Design Spec

**Status:** Draft
**Date:** 2026-05-10
**Audience:** Implementation engineers
**Target host (read-only reference):** `apps/adjuster/src/components/the host component library` (the host library) — the path within the consuming repo
**Wave:** 3 of N. Sequenced after Wave 2 (`docs/superpowers/specs/2026-05-04-wave-2-tooltip-pilot-design.md`).

---

## 1. Why This Exists

Wave 2 shipped `defineCompound` and proved the compound-authoring API on a 4-part transient overlay (Tooltip). Wave 3 takes the next category in the playbook — **persistent navigational compound** — using Tabs as the vehicle. Three architecturally-distinct things are stressed:

1. **Higher part-count with content as a sibling, not a portal.** Tabs ships `Root / List / Trigger / Content` all in the same DOM tree. No portal. No transient open/close lifecycle. Content visibility is driven by controlled active-value comparison, not by Radix's `Presence` machinery.
2. **Controlled-state passthrough through the safe-context.** Active `value` flows from Root into Trigger (for `data-state` styling) and Content (for mount/visibility). The compound's `context()` callback is the typed seam where this lands. Wave 2 did not exercise controlled state — Tooltip's open/close was Radix's internal concern.
3. **The `PolymorphicPartConfig` API actually exercised.** Wave 2 exposed `polymorphic: true` part config on `defineCompound` but never used it (Tooltip's Trigger used `asChild` forwarding). Wave 3's `Tabs.Trigger` is declared polymorphic with `defaultElement: 'button'` so consumers can write `<Tabs.Trigger as="a" href="/foo">` without an `asChild` trampoline. The Wave 3 handoff explicitly flagged this as the wave's job — exercising an API that's typed and tested at the factory level but unused by any recipe.

Additionally, Wave 3 stresses **variant-driven structural CSS**: three Mantine-parity variants (`default | outline | pills`) push past Wave 2's token-only variants into structural style differences (border, padding, pill-shape). The `data-attribute selector + `vars` resolver` hybrid pattern from Wave 1 carries through.

soribashi is the authoring framework, not a component library. The pilot library (`apps/pilot/`) plays the role of a hypothetical downstream consumer of soribashi — analogous to the host library's `host/` directory. It chooses to wrap `@radix-ui/react-tabs` for its headless substrate. soribashi itself ships zero new runtime dependencies; the Radix dep lives only in the pilot app.

**the host library's actual host Tabs** (`<host-library-path>/Tab/Tab.tsx`) wraps `@radix-ui/react-tabs` with one variant (`default`, underline-on-active) and horizontal-only orientation. The pilot's `default` variant matches the host library's existing styling intentionally; `outline` and `pills` are the soribashi-design exemplars exercising additional variants.

---

## 2. Scope

**Ships in Wave 3:**

| Layer | Surface |
|---|---|
| `apps/pilot/` | `@radix-ui/react-tabs` added as a dependency |
| `apps/pilot/src/recipes/Tabs/` | `Tabs` recipe — `defineCompound` with 4 parts, polymorphic Trigger, 3 variants |
| `apps/pilot/src/pages/TabsMatrix.tsx` | new — variant matrix + edge-case cells |
| `apps/pilot/src/pages/ScreenReplica.tsx` | modified — Tabs region at a realistic location |
| `apps/pilot/src/App.tsx` | modified — `/tabs-matrix` route registered |
| `docs/superpowers/specs/.../recipe-conversion-playbook.md` | § 2.3 populated with the persistent-navigational-compound pattern |

**Out of scope (deferred to later waves or other projects):**

- **Vertical orientation.** the host library uses only horizontal. Vertical is a backward-compat add later via a new `orientation` prop on Root. Re-examine in the host library integration project.
- **Sub-slots inside Trigger** (`triggerLabel`, `triggerSection` for icons, à la Mantine's `tab` / `tabSection` / `tabLabel`). Radix and the host library don't have these; Trigger renders children verbatim.
- **`allowTabDeactivation`.** Radix doesn't support natively; not in the host library.
- **Per-item context** (Mantine Accordion-style secondary context per Item). Tabs is item-flat — Triggers compare own `value` to ctx (Radix does it under the hood); no second context needed. `createSafeContext` stays internal-only.
- **Polymorphic root.** Root must own context creation; conflating with element-polymorphism opens unsolved questions. Re-examined and re-deferred.
- **Eject-per-part (OQ-7).** `Tabs.Trigger`'s polymorphic config fits the standard `PartConfig` shape cleanly. No ejection needed in Wave 3. Wave 4 (Select) is the next candidate if its trigger requires behavior we can't accommodate.
- **Host integration / migration** (separate project; Wave 3 produces the recipe, integration project rewires the host library's `Tab/Tab.tsx` to use it).
- **Wave 4 (Select)** and beyond.

---

## 3. Anatomy & Parts Taxonomy

Four parts. All consume the safe-context (no class-3 passthrough — Radix Tabs has no equivalent of `RadixTooltip.Provider`).

| Part | Class (per Wave 2 § 3.4) | Substrate | Polymorphic | Role |
|---|---|---|---|---|
| `Tabs` (Root) | class-1, context-creator | `RadixTabs.Root` | no | Owns variant + controlled `value` / `defaultValue` / `onValueChange`. Establishes safe-context. Emits `data-variant` for descendant CSS. |
| `Tabs.List` | class-2, context-consumer | `RadixTabs.List` | no | Reads `ctx.variant` for variant-driven list styling. Renders `role="tablist"` (Radix). |
| `Tabs.Trigger` | class-2, context-consumer | `RadixTabs.Trigger` (asChild) | **yes** — `defaultElement: 'button'` | Has its own `value` prop. Reads `ctx.variant` for variant styling. Radix sets `data-state="active|inactive"` on the rendered element via Slot. Polymorphism via `as` prop; consumer writes `<Tabs.Trigger as="a" href="...">`. |
| `Tabs.Content` | class-2, context-consumer | `RadixTabs.Content` | no | Has its own `value` prop. Radix handles mount/hide based on Root's active value. `forceMount` is a passthrough opt-in for keep-mounted behavior. |

**No `Provider` part.** Radix Tabs has no app-level provider equivalent.

**No sub-slots inside parts** (e.g., no `Tabs.Trigger`-internal `triggerLabel`/`triggerSection`). Trigger renders children verbatim. Wave 2's cross-slot `getStyles({ part: 'arrow' })` already covers that authoring pattern.

---

## 4. `defineCompound` Recipe Shape

### 4.1 Config sketch

```ts
import * as RadixTabs from '@radix-ui/react-tabs';
import {
  defineCompound,
  type PartRenderCtx,
  type PolymorphicPartRenderCtx,
} from '@soribashi/core';
import './Tabs.css';

type Variant = 'default' | 'outline' | 'pills';

interface TabsRootProps {
  variant?: Variant;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
}
interface TabsListProps    { children?: React.ReactNode }
interface TabsTriggerOwnProps {
  value: string;
  disabled?: boolean;
  children?: React.ReactNode;
}
interface TabsContentProps {
  value: string;
  forceMount?: boolean;
  children?: React.ReactNode;
}

interface TabsCtxExtras {
  // No extras beyond what the factory injects (variant, getStyles).
  // active value is read by Radix internally; the compound doesn't surface it.
}

export const Tabs = defineCompound({
  name: 'Tabs',
  variants: ['default', 'outline', 'pills'] as const,
  classes: {
    root:    'cr-Tabs-root',
    list:    'cr-Tabs-list',
    trigger: 'cr-Tabs-trigger',
    content: 'cr-Tabs-content',
  },
  defaults: { variant: 'default' } as Partial<TabsRootProps>,
  vars: (_theme, props) => ({
    list: {
      // Variant-driven token vars used by Tabs.css's [data-variant='pills'] block
      // for the active-pill background/foreground. Other variants don't read these.
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
    // Root — class-1. Establishes the safe-context. Wraps RadixTabs.Root.
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

    // List — class-2. Reads ctx.variant for variant-driven styling.
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
        Element, ref, getStyles, ctx, props, children,
      }: PolymorphicPartRenderCtx<TabsTriggerOwnProps, 'button', TabsCtxExtras>) => (
        <RadixTabs.Trigger asChild value={props.value} disabled={props.disabled}>
          <Element ref={ref} data-variant={ctx.variant} {...getStyles()}>
            {children}
          </Element>
        </RadixTabs.Trigger>
      ),
    },

    // Content — class-2. Wraps RadixTabs.Content. forceMount passes through.
    content: {
      render: ({ getStyles, props, children }: PartRenderCtx<TabsContentProps, TabsCtxExtras>) => (
        <RadixTabs.Content
          value={props.value}
          forceMount={props.forceMount}
          {...getStyles()}
        >
          {children}
        </RadixTabs.Content>
      ),
    },
  },
});
```

### 4.2 Polymorphic Trigger detail

`Tabs.Trigger` is the wave's exercise of `PolymorphicPartConfig`. Three things to note:

1. **`asChild` is a recipe-internal detail, not a public Trigger prop.** The recipe always passes `asChild` to `RadixTabs.Trigger` so Radix's Slot can merge state-machine props onto the consumer's chosen `<Element>`. Public consumer API for polymorphism is `as`:
   ```tsx
   <Tabs.Trigger value="overview" as="a" href="/overview">Overview</Tabs.Trigger>
   <Tabs.Trigger value="settings" as={RouterLink} to="/settings">Settings</Tabs.Trigger>
   <Tabs.Trigger value="docs">Docs</Tabs.Trigger>  {/* defaults to <button> */}
   ```
2. **Why drop public `asChild`.** Wave 2's Tooltip exposed both `asChild` (Radix passthrough) and no `as`. Wave 3 inverts: `as` only. Reason — Tabs.Trigger's job is to render a *trigger element*, and `as` expresses "which element type" more directly. `asChild` is more useful when the consumer wants to wrap an arbitrary already-styled component, which is rarer for tab triggers. If a consumer wants the asChild pattern they can use `as={CustomComponent}` and Radix's Slot handles the merge. This is a deliberate API divergence from Wave 2 — the playbook entry will document the asymmetry and when to choose each.
3. **Polymorphic + disabled.** When `as="a"`, the rendered `<a>` doesn't natively support `disabled` (anchors ignore the attribute). Radix forwards `disabled` via Slot anyway. Pilot accepts this as a known edge case (the host library uses `<button>` only). Documented in playbook § 2.3 as "polymorphic Trigger with non-button elements requires consumer-side aria-disabled handling for full a11y parity."

### 4.3 What's wired through the safe-context

`config.context()` returns `{}` — no compound-specific extras. The factory still injects:
- `variant` — read by List and Trigger to drive variant styling
- `getStyles` — used by every part to resolve its slot's class + inline vars

Active `value` does **not** flow through the safe-context. Radix's `RadixTabs.Root` owns it; `RadixTabs.Trigger` and `RadixTabs.Content` read it via Radix's own internal context. The recipe never reads or writes active-value state itself. This is why `TabsCtxExtras` is empty — there's nothing the recipe needs to surface beyond what the factory injects.

### 4.4 Theme-set defaults

```ts
import { Tabs } from 'pilot';

export const theme = createTheme({
  tokens, semantic,
  components: [
    Tabs.withDefaults({ variant: 'pills' }),         // theme-default the variant
    Tabs.Content.withDefaults({ forceMount: true }), // pre-mount panels
  ],
});
```

Same array-form `withDefaults` pattern Wave 2 introduced. No new framework support needed.

---

## 5. Variant Styling Strategy

**Hybrid: data-attribute selectors for structural CSS + `vars` resolver for token values.** Same split Wave 2 used. Each variant's structural shape (border, padding, pill-radius) lives in `Tabs.css` keyed off `[data-variant]`; the `vars` resolver carries the per-variant *token* differences that CSS can't hardcode (the active-pill bg/fg, where the cell's tokens differ from the chrome above).

Each part's render emits `data-variant={ctx.variant}` (Root emits its own `data-variant={props.variant}`). CSS rules combine `[data-variant='X'][data-state='active']` for active-cell styling.

### 5.1 `Tabs.css` shape

```css
/* base — applies to all variants */
.cr-Tabs-list {
  display: flex;
  gap: 0.25rem;
}

.cr-Tabs-trigger {
  padding: 0.5rem 1rem;
  font-size: var(--font-size-sm);
  font-weight: 500;
  background: transparent;
  color: var(--text-muted);
  border: none;
  cursor: pointer;
  transition: color 150ms ease, border-color 150ms ease, background 150ms ease;
}
.cr-Tabs-trigger[data-state='active'] { color: var(--text-default); }
.cr-Tabs-trigger:disabled,
.cr-Tabs-trigger[data-disabled] { opacity: 0.5; cursor: not-allowed; }
.cr-Tabs-trigger:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

/* default — underline-on-active. Matches the host library's existing host style. */
.cr-Tabs-list[data-variant='default']    { border-bottom: 1px solid var(--border-default); }
.cr-Tabs-trigger[data-variant='default'] {
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}
.cr-Tabs-trigger[data-variant='default'][data-state='active'] {
  border-bottom-color: var(--text-default);
}

/* outline — bordered tabs sharing a list border-bottom. */
.cr-Tabs-list[data-variant='outline'] { border-bottom: 1px solid var(--border-default); }
.cr-Tabs-trigger[data-variant='outline'] {
  border: 1px solid transparent;
  border-bottom: none;
  border-top-left-radius: var(--radius-md);
  border-top-right-radius: var(--radius-md);
  margin-bottom: -1px;
}
.cr-Tabs-trigger[data-variant='outline'][data-state='active'] {
  border-color: var(--border-default);
  background: var(--surface-default);
}

/* pills — rounded button-shaped active. Reads --cr-tabs-active-bg/color from vars. */
.cr-Tabs-trigger[data-variant='pills'] {
  border-radius: var(--radius-full);
}
.cr-Tabs-trigger[data-variant='pills'][data-state='active'] {
  background: var(--cr-tabs-active-bg);
  color: var(--cr-tabs-active-color);
}

/* Variant-scoped focus override: pills' filled active state collides with the
 * default outline color (primary-500 on a primary-500 background). Re-route to
 * a contrast-coherent outline. */
.cr-Tabs-trigger[data-variant='pills'][data-state='active']:focus-visible {
  outline-color: var(--color-neutral-0);
  outline-offset: -2px;
}

/* Content — minimal styling; consumer composes inside. */
.cr-Tabs-content {
  margin-top: 1rem;
}
.cr-Tabs-content:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}
```

### 5.2 Why this split

`vars` carries values that vary per-variant *and* are token references; CSS handles structure. Hardcoding the pill bg in CSS would require a `var(--color-primary-500)` reference inside a `[data-variant='pills']` block — fine, but then changing the active-pill color through theme defaults requires a theme-CSS override rather than `Tabs.withDefaults({ ... })`. By routing it through `vars`, future theme defaults like `Tabs.withDefaults({ activeColor: 'success' })` would be a clean recipe-prop addition without CSS surgery. (Such a prop is **not** in Wave 3 scope — but the architecture leaves the door open.)

---

## 6. Pilot Tabs recipe

### 6.1 Files

```text
apps/pilot/src/recipes/Tabs/
  Tabs.tsx
  Tabs.css
  Tabs.test.tsx
apps/pilot/src/pages/
  TabsMatrix.tsx                  (new)
  ScreenReplica.tsx               (modified — Tabs region)
apps/pilot/src/App.tsx (modified — /tabs-matrix route)
apps/pilot/package.json (add @radix-ui/react-tabs)
```

### 6.2 Recipe sketch

See § 4.1 above. The full file follows that structure verbatim.

### 6.3 Consumer-side API

```tsx
// Default — uncontrolled, default variant.
<Tabs defaultValue="overview">
  <Tabs.List>
    <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
    <Tabs.Trigger value="usage">Usage</Tabs.Trigger>
    <Tabs.Trigger value="api">API</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="overview">…</Tabs.Content>
  <Tabs.Content value="usage">…</Tabs.Content>
  <Tabs.Content value="api">…</Tabs.Content>
</Tabs>

// Controlled with custom variant + a polymorphic anchor Trigger
<Tabs variant="pills" value={tab} onValueChange={setTab}>
  <Tabs.List>
    <Tabs.Trigger value="dashboard">Dashboard</Tabs.Trigger>
    <Tabs.Trigger value="docs" as="a" href="/docs">Docs</Tabs.Trigger>
    <Tabs.Trigger value="settings" disabled>Settings</Tabs.Trigger>
  </Tabs.List>
  …
</Tabs>
```

### 6.4 `TabsMatrix.tsx`

Matrix structure: 3 variants × 1 orientation = 3 cells, each with 3 tabs and 3 panels. Plus four edge-case cells:
- `disabled` Trigger
- `forceMount` Content (asserts inactive panel still in DOM)
- Polymorphic Trigger with `as="a"` (smoke-tests the polymorphic-part API end-to-end)
- Controlled-mode cell with external state + display of current `value`

Mirrors Wave 1's `ButtonMatrix.tsx` and Wave 2's `TooltipMatrix.tsx` in structural pattern.

### 6.5 `ScreenReplica.tsx` integration

Add a Tabs region at a realistic location. Two reasonable choices:
- a sidebar-panel region mirroring `PanelTabs.tsx` (the host library's RightToolbar tabs)
- a content-region tab-set mirroring the host library's contact-detail panel

Pick whichever sits naturally in the existing ScreenReplica structure. Use the `default` variant (matches the host library). Goal: visual review fixture for the design owner.

---

## 7. Failure Modes + Error Handling

| Failure | Surfaces at | Caught by | Behavior |
|---|---|---|---|
| Consumer renders `<Tabs.Trigger>` outside `<Tabs>` | runtime, render | safe-context throw | error: `"<Tabs.Trigger> must be inside <Tabs>"` (factory uses `name` from config) |
| Consumer renders `<Tabs.Content>` outside `<Tabs>` | runtime, render | safe-context throw | same shape |
| Consumer omits `value` on Trigger or Content | runtime | TS — `value: string` is required in `TabsTriggerOwnProps` / `TabsContentProps` | won't compile |
| Consumer's Trigger `value` doesn't match any Content `value` | runtime | none — Radix silently shows nothing | documented in playbook § 2.3 as a known consumer footgun |
| Two Triggers share the same `value` | runtime | Radix may warn; both will appear active | not the recipe's responsibility |
| `<Tabs.Trigger as="a" disabled>` | runtime | Radix forwards `disabled` to `<a>`, which ignores it | known edge case (§ 4.2 note 3); consumer can add `aria-disabled` manually |
| Author calls `getStyles({ part: 'typo' })` | compile time | TS — part name typed against slot-key union when `PartRenderCtx<TProps, TCtxExtras, TVariants, TSlotKeys>` is explicitly annotated | won't compile (with explicit annotation) |
| Polymorphic `as` resolves to a void element (`'br'`, `'hr'`, etc.) | runtime | React | renders the void element; children silently dropped. Not the recipe's responsibility to validate. |

**Refused-to-handle:** consumers passing controlled `value` with no matching Trigger; consumers using `forceMount` with side-effect-heavy panel content (mount-on-first-visit semantics); custom keyboard handlers that compete with Radix's roving-tabindex.

---

## 8. Testing Strategy

### 8.1 Pilot Tabs tests (new)

`apps/pilot/src/recipes/Tabs/Tabs.test.tsx`:

**Render lifecycle:**
- Renders Root + List + N Triggers + N Contents
- Default tab is `defaultValue`; only its Content is visible (or has `data-state='active'`)
- Clicking another Trigger fires `onValueChange` and switches `data-state` on Triggers + Contents

**Controlled mode:**
- `<Tabs value={x} onValueChange={fn}>` — consumer-controlled state round-trips correctly
- External setter changes which Content is visible

**Keyboard navigation (Radix passthrough smoke):**
- Arrow-Right on the active Trigger moves focus to the next Trigger and activates it
- Arrow-Left moves to the previous; loops at edges (Radix default)
- Disabled Trigger is skipped during arrow-key navigation

**Variants:**
- Each of `default`, `outline`, `pills` applies `data-variant` to List, Trigger, and Root
- `pills` variant gets the resolved `--cr-tabs-active-bg` / `--cr-tabs-active-color` vars on the active Trigger (computed-style assertion)
- `default` variant exposes underline via border-bottom (computed-style assertion on active Trigger)

**Polymorphic Trigger:**
- `<Tabs.Trigger as="a" href="/x">` renders an `<a href="/x">` element with the trigger class
- `<Tabs.Trigger>` defaults to `<button>` (renders a button element)
- ref forwarding: `<Tabs.Trigger ref={ref}>` — `ref.current` is the rendered button (mirrors Wave 1's ref-forwarding tests)
- Polymorphic ref forwarding: `<Tabs.Trigger as="a" ref={ref}>` — `ref.current.tagName === 'A'`

**`forceMount`:**
- `<Tabs.Content value="x" forceMount>` keeps the panel in DOM when inactive (asserted via `document.body.querySelector` or container query, depending on Radix's behavior)

**Safe-context:**
- `<Tabs.Trigger>` outside `<Tabs>` throws `<Tabs.Trigger> must be inside <Tabs>`
- Same for `<Tabs.Content>` and `<Tabs.List>`

**Styles-API plumbing:**
- `className` from instance props lands on the rendered element (List, Trigger, Content)
- `Tabs.Trigger.withDefaults({ className: '...' })` lands on every Trigger when registered via `createTheme`
- `Tabs.withDefaults({ variant: 'pills' })` makes `data-variant='pills'` the default

### 8.2 Browser parity (new)

`apps/pilot/tests/tabs-computed-styles.spec.ts` (or wherever Wave 2's parity tests live):
- Loads `TabsMatrix.tsx` in Chromium
- Per cell of the 3-variant matrix: clicks each Trigger, asserts computed styles match `vars()` output and the right `data-variant` rules apply
- Captures screenshot per variant for visual-review baseline
- Keyboard nav: Tab to first Trigger, ArrowRight cycle, asserts focused element + active state at each step
- Dark-mode toggle: switch theme → re-assert per cell

### 8.3 Factory tests (no additions expected)

`packages/factory/test/define-compound.test.tsx` already covers the seams Wave 3 exercises (4 parts, ctx flow, variants, `getStyles` per part, polymorphic part type-level). Wave 3 may add a runtime test for polymorphic-part-with-Slot-substrate if a regression surfaces during pilot work, but the factory tests at the type level should already constrain the shape.

### 8.4 Visual review (manual, journaled)

- `TabsMatrix.tsx` rendered light + dark, screenshot grid in journal
- `ScreenReplica.tsx` Tabs region — captured for design-owner review
- Keyboard navigation interaction (focus ring visible per variant; pills variant's contrast-coherent ring)

---

## 9. Sequencing notes

The implementation plan (separate document, produced via `superpowers:writing-plans`) sequences this. Dependency graph at the design-doc level:

1. `apps/pilot/package.json` — add `@radix-ui/react-tabs` dep, run `bun install`. Trivially small.
2. `apps/pilot/src/recipes/Tabs/Tabs.tsx` + `Tabs.css` — recipe + styling. Recipe code is mostly the § 4.1 sketch; CSS is the § 5.1 block.
3. `apps/pilot/src/recipes/Tabs/Tabs.test.tsx` — coverage per § 8.1.
4. `apps/pilot/src/pages/TabsMatrix.tsx` — matrix page per § 6.4.
5. `apps/pilot/src/App.tsx` — register `/tabs-matrix` route.
6. `apps/pilot/src/pages/ScreenReplica.tsx` — Tabs region per § 6.5.
7. `apps/pilot/tests/tabs-computed-styles.spec.ts` — browser-parity (deferable to a follow-up if browser-test infra is heavy; vitest covers most of the surface).
8. `docs/superpowers/specs/.../recipe-conversion-playbook.md` § 2.3 — populate the persistent-navigational-compound entry.

No `packages/factory/`, `packages/theme/`, or `packages/codegen/` changes are anticipated. If a factory-level limitation surfaces during pilot work, it gets its own sub-task.

Estimated sizing: M, per playbook § 5.

---

## 10. Cross-references

- **Wave 2 spec:** `docs/superpowers/specs/2026-05-04-wave-2-tooltip-pilot-design.md`
- **Wave 2 playbook entry:** `docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md` § 2.2
- **Wave 1 spec:** `docs/superpowers/specs/2026-04-26-token-consolidation-and-button-pilot-design.md`
- **Wave 3 handoff:** `docs/superpowers/sessions/2026-05-09-wave-3-handoff.md`
- **Mantine source references** (for design justification, not runtime dep):
  - `packages/@mantine/core/src/components/Tabs/Tabs.tsx` — Root with `useUncontrolled`, three variants
  - `packages/@mantine/core/src/components/Tabs/TabsList/TabsList.tsx` — class-2 list consuming ctx
  - `packages/@mantine/core/src/components/Tabs/TabsTab/TabsTab.tsx` — polymorphic-button class-2; uses `createScopedKeydownHandler` (we delegate to Radix instead)
  - `packages/@mantine/core/src/components/Tabs/TabsPanel/TabsPanel.tsx` — class-2 panel, `keepMounted` modes (we delegate to Radix's `forceMount`)
  - `packages/@mantine/core/src/components/Tabs/Tabs.context.ts` — context value shape (Mantine flows active value through ctx; we don't, since Radix owns it)
- **Host Tab references:**
  - `apps/adjuster/src/components/the host component library/Tab/Tab.tsx` — the host library's existing wrapper (single variant, horizontal, controlled state via Radix props verbatim)
  - `apps/adjuster/src/components/the host component library/islands/auto/RightToolbar/components/PanelTabs.tsx` — example consumer of the host library's Tab

---

## 11. Open Design Questions

- **OQ-1.** `Tabs.css` `:focus-visible` ring per variant. The pills variant's filled active state collides with the default `--color-primary-500` outline; the spec routes that case to `--color-neutral-0` (white outline inside the pill). Default and outline variants reuse the global focus ring. Confirm during CSS authoring; revise per visual review if needed.
- **OQ-2.** Whether to smoke-test polymorphic Trigger with a real router-link component (e.g., a stub `RouterLink` that accepts `to=`) in the matrix page, or only with a plain `<a href>`. Spec default: `<a href>` smoke-test only; deeper router integration is consumer's responsibility.
- **OQ-3.** Vertical orientation deferral. Re-examine in the host library integration project if a consumer surfaces the need; would be a backward-compatible Wave-3.5 add via `orientation: 'vertical'` Root prop + new CSS for column layout + side-by-side panel + arrow-up/down keyboard handling (Radix handles the keyboard side automatically).
- **OQ-4.** Whether to ship a `disabled` data-attribute / `aria-disabled` polyfill in the recipe's polymorphic Trigger when `as` is non-button. Spec default: no — rely on Radix's pass-through, document the edge case in playbook. the host library uses button-only.
- **OQ-5.** Whether the pilot's `default` variant should track the host library's exact tokens (`text-neutral-600` / `text-neutral-900` / `border-neutral-300`) or use the consolidated `text-muted` / `text-default` / `border-default` semantic tokens (which is what soribashi-design intent dictates). Spec picks consolidated semantic tokens — the integration project will then either (a) accept the slight visual drift, (b) override via `Tabs.withDefaults({ ... })` if a per-cell value can express it, or (c) override at CSS-var level in the host theme. The pilot is the soribashi-design exemplar, not a 1:1 visual replica.
- **OQ-6.** Whether to expose `RadixTabs.Trigger`'s `tabIndex` prop publicly. Spec default: no — Radix handles roving-tabindex internally; consumer overrides should be rare and can drop down via `as` + spread.
- **OQ-7.** Inference-erosion trade-off from in-wave factory fix. Wave 3 fixed `PolymorphicPartConfig.render` to take `PolymorphicPartRenderCtx<...>` directly (no `as unknown as` cast in recipes). The fix required changing `PartsRecord`'s bound from a `Standard | Polymorphic` union to a minimal `AnyPartConfig` with `render: (ctx: any) => ReactNode` because the union killed TS contextual inference for ~150 cases. **Trade-off:** un-annotated inline render functions no longer get `TVariants` / `TCtxExtra` inference — they get `any`. Real recipes always annotate (e.g., `PartRenderCtx<TabsListProps, TabsCtxExtras>`), so this is bounded — but it's a Wave-2-OQ-9 erosion. Cycle 7.11 in `define-compound.test.tsx` was renamed in-place to document the new shape, and a regression canary test was added so if/when inference is restored, the canary fires. Future work: restore the union bound without re-introducing the ~150 inference errors (likely requires deeper TS variance work). Tracked here so the Wave 4 (Select) plan can decide whether to fix or work around.

---

## 12. Glossary (delta from Wave 2)

- **Persistent navigational compound** — a compound whose parts coexist in the DOM and switch active-state without mounting/unmounting all peers. Tabs is the canonical example. Distinguishes from transient overlay (Tooltip — Wave 2) where Content is portaled and ephemeral.
- **Item-flat compound** — a compound where item-level state derives from a single Root context, not per-item context. Tabs is item-flat (each Trigger compares own value to active value). Contrast: Mantine's Accordion is item-nested (each Item has its own context).
- **Polymorphic part** — a part declared with `polymorphic: true` and `defaultElement` in its `PartConfig`. Consumer chooses the rendered element type via `as` prop; the factory threads `<Element>` and forwarded `ref` into the part's render. New in Wave 3 (the API existed in Wave 2 but was unused).
