# Wave 2 — Tooltip Pilot (Transient Overlay Compound) — Design Spec

**Status:** Draft
**Date:** 2026-05-04
**Audience:** Implementation engineers
**Target host (read-only reference):** `/Users/matt/Documents/GitHub/assured/assured-primary/apps/adjuster/src/components/ClaimViewIslands` ("CVI")
**Wave:** 2 of N. Sequenced after Wave 1 (`docs/superpowers/specs/2026-04-26-token-consolidation-and-button-pilot-design.md`).

---

## 1. Why This Exists

Wave 1 proved soribashi can author a **pure styled primitive** (Button) by extending `definePolymorphicComponent` over the consolidated theme. Wave 2 takes the next category in the playbook — **transient overlay compound** — using Tooltip as the vehicle. Two architecturally-distinct things have to land for the wave to count:

1. **Compound-authoring API.** soribashi today has `defineComponent`, `definePolymorphicComponent`, `defineGenericComponent`. None expresses the multi-part, shared-context, slot-styled shape that Tooltip / Popover / Tabs / Select / Combobox all share. Wave 2 adds the missing primitive.
2. **Q11 surface↔foreground decision.** Wave 1 deferred whether to formalize per-surface foreground tokens. The token-consolidation journal § 5 Q11 explicitly tagged this decision as gated on "the first wave with a meaningfully different surface." Tooltip is that wave — its **default variant** deliberately lives on a surface with opposite lightness from the page (matching shadcn's `bg-foreground` pattern). A `subtle` variant opts in to page-surface styling.

soribashi is the authoring framework, not a component library. Two distinct DX surfaces matter:

- **Authoring DX** — the design-system author writing Tooltip in their library (analog: a Mantine core team member). Wave 2's deliverable is shaped around making this pleasant.
- **Consuming DX** — the application engineer composing `<Tooltip><Tooltip.Trigger>...</Tooltip.Trigger></Tooltip>` in their app code. The pilot proves the API enables a pleasant composition.

The pilot library (`apps/core-radix-pilot/`) plays the role of a hypothetical downstream consumer of soribashi — analogous to CVI's `core-radix/` directory. It chooses to wrap `@radix-ui/react-tooltip` for its headless substrate. soribashi itself ships zero new runtime dependencies; the Radix dep lives only in the pilot app.

---

## 2. Scope

**Ships in Wave 2:**

| Layer | Surface |
|---|---|
| `packages/factory/` | `defineCompound` factory — public API |
| `packages/factory/` | `Slot` component — public API; substrate-agnostic asChild merge |
| `packages/factory/` | `Component.withDefaults({...})` method on every `defineComponent` / `defineCompound` output — public API; reference-keyed theme registration |
| `packages/factory/` | `compound: true` flag on `defineComponent` config — internal substrate, not exported |
| `packages/factory/` | `createSafeContext` helper — internal use, not exported |
| `packages/theme/` | `SemanticSurfaceValue` extended to support `string \| { value, foreground? }` |
| `packages/theme/` | `surface.floating` semantic-token slot |
| `packages/theme/` | `createTheme({ components: [...] })` accepts an array of `withDefaults`-tagged entries; legacy `Record<string, ComponentThemeConfig>` form remains for back-compat |
| `packages/codegen/` | Codegen emits paired `--surface-{name}-foreground` when the object form is used |
| `apps/core-radix-pilot/` | `Tooltip` recipe wrapping `@radix-ui/react-tooltip`, demonstrating `defineCompound` + `Slot` + the floating-surface formalization |
| `apps/core-radix-pilot/src/pages/` | `TooltipMatrix.tsx` page |
| `apps/core-radix-pilot/src/pages/` | `ScreenReplica.tsx` integration of Tooltips at relevant points |
| `docs/superpowers/specs/.../core-radix-conversion-playbook.md` | § 2.2 populated; § 4 / § 5 entries for floating-surface pattern |

**Out of scope (deferred to later waves or other projects):**

- Wave 3 (Tabs), Wave 4 (Select).
- Eject-per-part (option C from the brainstorm). Backwards-compatible to add when a future wave hits a config-shape wall.
- IconButton, ButtonDropdown, other Wave-1-category siblings (post-Wave-4 sweep).
- CVI integration / migration to Wave 2 patterns (separate integration project).
- Wholesale per-surface foreground formalization for Wave-1 surfaces (`canvas`/`default`/`raised`/`sunken`/`scrim`). Stays informal; gradual opt-in per future surface.
- A `Tooltip.Group` part. Radix's Provider already covers the shared-delay use case.
- Animation primitives. Pilot's Tooltip uses inline `@keyframes`; future may extract.
- `useFloatingPosition` hook. Radix wraps Floating UI; soribashi never touches positioning.
- Polymorphic root parts. Root must own context creation; if a future wave needs a polymorphic root, design space opens then.

---

## 3. `defineCompound` — the compound-authoring primitive

### 3.1 Config shape

```ts
defineCompound({
  name: 'Tooltip',
  variants: ['default', 'subtle'] as const,
  classes: {                             // keys are SLOTS, not parts
    root:    'cr-Tooltip-root',
    trigger: 'cr-Tooltip-trigger',
    content: 'cr-Tooltip-content',
    arrow:   'cr-Tooltip-arrow',         // slot without a part — see § 3.2
  },
  defaults: { variant: 'default', side: 'top' },
  vars: (theme, props) => ({ content: { /* per-slot CSS vars */ } }),
  context: (rootProps) => ({ side: rootProps.side, sideOffset: 4 }),
  parts: {                               // keys are PARTS — separately-exported components
    provider: { /* render — passthrough wraps RadixTooltip.Provider; no class */ },
    root:     { /* render — creates the safe-context */ },
    trigger:  { /* render — consumes ctx */ },
    content:  { /* render — consumes ctx; renders the arrow slot inside */ },
  },
})
```

Returns the Root component (`parts.root` by convention) with each non-root part attached as a static property: `Tooltip.Provider`, `Tooltip.Trigger`, `Tooltip.Content`. Matches Mantine's namespace convention (`packages/@mantine/core/src/components/Tabs/Tabs.tsx` lines `Tabs.Tab = TabsTab; Tabs.Panel = TabsPanel; Tabs.List = TabsList;`).

**Slots vs. parts** — distinct concepts:
- A **part** is a separately-exported sub-component (e.g., `Tooltip.Trigger`). Listed in `parts`.
- A **slot** is a named piece of styling addressable via `getStyles('slotName')`. Listed in `classes`.
- Slots are a superset of parts. Some slots correspond 1:1 to a part (`trigger`, `content`); others are sub-elements rendered inside a part's render (`arrow` — rendered inside `content`, no `Tooltip.Arrow` component exported). Some parts have no slot (`provider` — passthrough wrapping `RadixTooltip.Provider`, no DOM of its own).
- A part without an entry in `classes` has `getStyles()` return `{}` (no className, no style). Factory does not require 1:1 mapping.

### 3.2 Per-part config

A part value is either a `PartConfig` object or an already-built component (the latter is reserved for option-C eject and is *not* shipped in Wave 2 — see § 11.OQ-7).

`PartConfig` shape:

```ts
type PartConfig = StandardPartConfig | PolymorphicPartConfig;

interface StandardPartConfig {
  render: (ctx: PartRenderCtx) => React.ReactNode;
  defaults?: Partial<TPartProps>;
}

interface PolymorphicPartConfig {
  polymorphic: true;
  defaultElement: keyof JSX.IntrinsicElements;
  render: (ctx: PolymorphicPartRenderCtx) => React.ReactNode;
  defaults?: Partial<TPartProps>;
}
```

`PartRenderCtx` exposes:

- `props` — *merged*, post-`useProps`. Resolution order: recipe-internal `defaults` → theme `components[name].defaultProps` (set via `withDefaults` — see § 3.5) → consumer-passed instance props (with `undefined` filtered out so it never clobbers a default). By the time `render` runs, `props.variant` reflects the final value, including theme overrides.
- `getStyles(opts?)` — defaults to current part's slot. `getStyles({ part: 'arrow' })` targets a sibling slot; the part-name argument is type-checked against `keyof typeof config.parts`.
- `ctx` — the compound's safe-context value. Factory injects `{ variant, getStyles }` plus whatever `config.context()` returns.
- `children` — convenience accessor; also at `props.children`.

Polymorphic parts additionally receive `Element` (the resolved element type) and `ref` (the forwarded ref). Threading is unchanged from `definePolymorphicComponent`.

**`config.context()` runs inside Root's render** — at the same call site as `useProps`. It receives the *merged* root props and may call React hooks (`useFloating`, `useId`, etc.). This is the same idiom Mantine uses for compounds wrapping Floating UI: Popover's Root calls `usePopover(props)` directly in render and threads the result through context. soribashi's `context()` callback is the typed seam for that pattern.

### 3.3 What the factory does internally

For a config with N parts:

1. Generate a `createSafeContext<TCtxValue>('<name> parts must be inside <Root>')`. The error message embeds `config.name`.
2. Compile each part as a `defineComponent` (or `definePolymorphicComponent`) with an internal `compound: true` flag. The flag drops `unstyled` and `attributes` from the prop type to match Mantine's `CompoundStylesApiProps` (Mantine source: `packages/@mantine/core/src/core/styles-api/styles-api.types.ts`).
3. The `parts.root` component, in addition to its own render, wraps the rendered output in the context Provider with value `{ ...config.context(rootProps), variant, getStyles }`.
4. Other parts read `getStyles` from the context inside their render — author never wires it manually.
5. Assemble namespace via `Object.assign(Root, { ...nonRootParts })`.

### 3.4 Three classes of part the API supports

The pilot Tooltip exercises all three; `defineCompound` does not enforce which class a part belongs to — the classification is purely a property of what the render does:

1. **Root** (`parts.root` by convention) — the part that creates the safe-context. Exactly one per compound. Owns variant resolution, `vars` evaluation, and the styles-API surface that flows into context.
2. **Context-consuming parts** — parts whose render reads `ctx.getStyles` or other context fields. These throw at render time if mounted outside Root. Tooltip's `trigger` and `content` are both class-2.
3. **Independent / passthrough parts** — parts whose render does *not* touch `ctx`. They live in the namespace for ergonomic reasons (consumer-facing API symmetry) but have no context dependency. Tooltip's `provider` is the canonical class-3 part — it wraps `RadixTooltip.Provider` and is mounted at app root, above any `<Tooltip>`.

The factory does not statically partition parts into the three classes; the classification is observational. This is intentional — adding a "must declare class" config field would be ceremony with no compile-time benefit (a misclassified part fails at render time today, with the safe-context's named error).

### 3.5 Theme-level defaults — `withDefaults` and the array form

Each component the factory produces — every `defineComponent` output, and every part of a `defineCompound` output — gets a `withDefaults({...})` method. The method returns a tagged record carrying the component's internal `name` plus the consumer-supplied defaults. Consumers register defaults by passing these tagged records to `createTheme({ components: [...] })`:

```ts
import { Tooltip } from 'core-radix-pilot';
import { Button } from 'core-radix-pilot';

const theme = createTheme({
  tokens, semantic,
  components: [
    Tooltip.withDefaults({ variant: 'subtle' }),
    Tooltip.Provider.withDefaults({ delayDuration: 500, skipDelayDuration: 150 }),
    Tooltip.Content.withDefaults({ sideOffset: 8, withArrow: false }),
    Button.withDefaults({ size: 'sm' }),
  ],
});
```

**What this fixes** vs. Mantine's flat-string-key shape:

- **No string key written by the consumer.** `Tooltip.Provider.withDefaults(...)` is the only access path. Misspelling impossible — would have to import a non-existent component.
- **Per-call type-safety.** `Tooltip.Provider.withDefaults({ ... })` autocompletes/checks against `TooltipProviderProps`. `Tooltip.Content.withDefaults({...})` against `TooltipContentProps`. The component reference carries its own type.
- **Refactor-safe.** Renaming the recipe's `Tooltip` to `Popover` breaks at the consumer's import line, not silently at `useProps` runtime.
- **Discoverable.** IDE autocomplete on `Tooltip.` shows `Provider`, `Trigger`, `Content`, `withDefaults`. Consumer doesn't read docs to learn naming conventions.

**Implementation footprint** — small:

```ts
// packages/factory/src/define-component.tsx (extension)
Component.withDefaults = (defaults: Partial<TProps>) => ({
  __soribashiThemeEntry: true as const,
  name: config.name,
  defaultProps: defaults,
});
```

```ts
// packages/theme/src/create-theme.ts (extension to existing normalization)
function normalizeComponents(input):
  Record<string, ComponentThemeConfig> {
  if (Array.isArray(input)) {
    const out: Record<string, ComponentThemeConfig> = {};
    for (const entry of input) out[entry.name] = { defaultProps: entry.defaultProps };
    return out;
  }
  return input ?? {};
}
```

`createTheme`'s `components` field type widens to `(Record<string, ComponentThemeConfig>) | ThemeEntry[]`. The runtime is unchanged: `useProps('Tooltip', ...)` still reads `theme.components['Tooltip']?.defaultProps`. Only the consumer-facing constructor changes.

**Naming inside the factory.** Compound parts internally register under flattened names matching Mantine's convention — `Tooltip.Provider`'s registered name is `'TooltipProvider'`, `Tooltip.Content`'s is `'TooltipContent'`. Consumers never see these strings; the `withDefaults` reference-keyed API hides them entirely.

**Backward compatibility — `.extend` and the record form remain.** soribashi's existing `Component.extend = identity` (returning `{ defaultProps }` directly) keeps working alongside the new path. The two coexist:

```ts
// Legacy record form — still works
const theme = createTheme({
  components: {
    Tooltip: Tooltip.extend({ defaultProps: { variant: 'subtle' } }),
  },
});

// New array form — recommended
const theme = createTheme({
  components: [
    Tooltip.withDefaults({ variant: 'subtle' }),
  ],
});
```

`createTheme` normalizes both shapes into the same internal `Record<string, ComponentThemeConfig>`. Documentation directs new consumers at the array form. `.extend` is not deprecated — it's structurally fine for the record form; the array form is just a strictly nicer surface.

### 3.6 What `defineCompound` does *not* support in Wave 2

- **Eject-per-part.** A `parts.foo: Component` form (where `Component` is a pre-built `defineComponent` result) is *not* accepted in Wave 2. Adding this is a backward-compatible widening of the part-value type and will land in whichever future wave first hits a config-shape wall.
- **Per-part variants.** Variants are declared at Root level only. Parts read `ctx.variant`. Matches Mantine — see `packages/@mantine/core/src/components/Tabs/TabsTab/TabsTab.tsx` (no `variant` field in `TabsTabFactory` payload; consumes `ctx.variant`).
- **Multiple safe-contexts.** A compound has exactly one context. Per-item context patterns (Mantine's `AccordionItem.context.ts` alongside `Accordion.context.ts`) are author's responsibility — they wire a second context with `createSafeContext` directly. `createSafeContext` will be promoted to public export when this need first appears.
- **Polymorphic root.** Root must own context creation; conflating that with element-type polymorphism opens unsolved questions. Root is always a non-polymorphic component in Wave 2.

---

## 4. `Slot` — substrate-agnostic asChild slot-merging

### 4.1 Why ship our own

`packages/factory/` has zero Radix dependencies today. The compound-authoring API needs to support `asChild` slot-merging for parts that wrap headless primitives, but tying soribashi's authoring layer to `@radix-ui/react-slot` couples the framework to one substrate at the wrong altitude. Three dozen lines of code is cheap; the canonical merge logic is well-documented public-domain (Radix's Slot is itself ~50 lines of merge logic plus a fragment-Slot variant).

The pilot Tooltip wraps Radix and therefore relies on Radix's *own* Slot for cloning at `RadixTooltip.Trigger asChild`. soribashi's Slot is shipped because Wave 3 (Tabs) and Wave 4 (Select) — and any non-Radix consumer — will reach for it. The two Slots coexist without conflict; consumers using Radix can also pull `@radix-ui/react-slot` in their own package if they prefer.

### 4.2 Surface

```tsx
import { Slot } from '@soribashi/core';

// Inside a part's render:
<Slot {...slotPropsThatGetMergedOntoChild}>{children}</Slot>
```

Single-child enforcement via `Children.only`. Merge semantics:

- `className`: composed via `clsx` (slot first, child overrides if the same class wins).
- `style`: shallow-spread; child wins on key collisions.
- Event handlers (`onClick`, `onKeyDown`, etc.): composed — slot handler runs first, then child. Matches Radix's event-merge order.
- `ref`: composed via a small `mergeRefs` helper.
- All other props: child wins.

### 4.3 Pilot Tooltip's asChild flow

The pilot's `parts.trigger.render` does *not* use soribashi's Slot — it forwards `asChild` to `RadixTooltip.Trigger`, which uses Radix's Slot internally. soribashi's Slot is exercised by the unit tests (`packages/factory/src/slot.test.tsx`) and documented in playbook § 2.2 for non-Radix substrate authors.

---

## 5. Surface-token model — `surface.floating` + gradual formalization

### 5.1 Decision

Q11 (token-consolidation journal § 5) asked whether to formalize per-surface foreground pairings. Wave 2 answers: **gradually**. Add `surface.floating` as a new semantic slot with object-form value supporting an optional formalized foreground; keep Wave-1 surfaces (`canvas`/`default`/`raised`/`sunken`/`scrim`) on string-form (informal pairing — author writes `text.default` over them).

Future waves opt new surfaces into formalization at introduction time. Wave-1 surfaces are *not* migrated; the cost (rename every `text.default` reference to `surface.X-foreground`) is not justified by Wave 2's needs and does not need to be paid retroactively.

### 5.2 Type extension

```ts
// packages/theme/src/types.ts
export type SemanticSurfaceValue =
  | SemanticReference                                         // existing string form
  | { value: SemanticReference; foreground?: SemanticReference };  // new object form

export interface SemanticSurfaces {
  canvas?:   SemanticSurfaceValue;
  default?:  SemanticSurfaceValue;
  raised?:   SemanticSurfaceValue;
  sunken?:   SemanticSurfaceValue;
  scrim?:    SemanticSurfaceValue;
  floating?: SemanticSurfaceValue;  // new slot
}
```

### 5.3 Codegen behavior

- **String form** (existing): emits `--surface-{name}` only. Backward-compat — all Wave-1 themes unchanged.
- **Object form, `foreground` present**: emits `--surface-{name}` and `--surface-{name}-foreground`. Both vars participate in dark-mode emission under the configured selector.
- **Object form, `foreground` absent**: emits `--surface-{name}` only. Behaves as string form — explicitly supported so an author can use object form for forward-compat without committing to a foreground value.
- **Tailwind dual-emit (Wave-1 Gap-1 resolution):** the `--__hsl-` companion is emitted for both the value and foreground vars when in object form. Tailwind alpha utilities (`bg-surface-floating/90`) work for both.

### 5.4 Pilot theme value

```ts
// apps/core-radix-pilot/src/theme/index.ts (extension)
semantic: {
  surface: {
    canvas:  'neutral.50',
    default: 'neutral.0',
    raised:  'neutral.0',
    sunken:  'neutral.100',
    scrim:   'neutral.950',
    floating: { value: 'neutral.900', foreground: 'neutral.0' },  // NEW — meaningfully inverted
    // dark-mode equivalents flip via the existing dark-mode emission mechanism
  },
}
```

The pilot's choice to make `surface.floating` *inverted* from `surface.default` is deliberate. A non-inverted floating value (alias to `surface.default`) would not exercise the formalization — the formalized foreground is only load-bearing when the surfaces actually differ. CVI's integration project may later override `surface.floating` to a non-inverted value (e.g., `{ value: 'neutral.0', foreground: 'neutral.700' }`); both are expressible in the same model.

### 5.5 Convention added to playbook

New entry in playbook § 3 (or a new playbook section if § 3 doesn't fit):

> **Gradual surface↔foreground formalization.** When introducing a semantic surface whose lightness diverges meaningfully from `surface.default`, declare it as `{ value, foreground }`. This emits a paired CSS var that consumers must use as the text color over that surface. When introducing a surface that lives in the page's normal contrast band (canvas/default/raised/sunken layers), keep it as a string and pair informally with `text.default`. Existing Wave-1 surfaces are not retroactively formalized — the migration cost is not justified.

---

## 6. Pilot Tooltip recipe

### 6.1 Files

```
apps/core-radix-pilot/src/recipes/Tooltip/
  Tooltip.tsx
  Tooltip.css
  Tooltip.test.tsx
apps/core-radix-pilot/src/pages/
  TooltipMatrix.tsx               (new)
  ScreenReplica.tsx               (modified — adds Tooltip integrations)
apps/core-radix-pilot/src/App.tsx (modified — mounts <Tooltip.Provider> at app root)
```

### 6.2 Anatomy exposed

| Part | Class (per § 3.4) | Notes |
|---|---|---|
| `Tooltip.Provider` | independent / passthrough | Wraps `RadixTooltip.Provider`. Mounted once at app root. Carries `delayDuration`, `skipDelayDuration`, `disableHoverableContent`. No soribashi-context coupling. |
| `Tooltip` (Root) | root | Wraps `RadixTooltip.Root`. Owns `variant`, `side`, `open`/`defaultOpen`/`onOpenChange`. Creates the safe-context. |
| `Tooltip.Trigger` | context-consuming | Wraps `RadixTooltip.Trigger`. Forwards `asChild` to Radix. |
| `Tooltip.Content` | context-consuming | Wraps `RadixTooltip.Portal` + `RadixTooltip.Content`. Conditionally renders `RadixTooltip.Arrow` based on `withArrow` prop (default `true`). |

### 6.3 Recipe sketch

```tsx
import * as RadixTooltip from '@radix-ui/react-tooltip';
import { defineCompound } from '@soribashi/core';
import './Tooltip.css';

type Variant = 'default' | 'subtle';
type Side = 'top' | 'right' | 'bottom' | 'left';

export const Tooltip = defineCompound({
  name: 'Tooltip',
  variants: ['default', 'subtle'] as const,
  classes: {
    root: 'cr-Tooltip-root',
    trigger: 'cr-Tooltip-trigger',
    content: 'cr-Tooltip-content',
    arrow: 'cr-Tooltip-arrow',
  },
  defaults: { variant: 'default', side: 'top' },
  vars: (_theme, props) => ({
    content: {
      '--cr-tooltip-bg':    props.variant === 'subtle' ? 'var(--surface-raised)' : 'var(--surface-floating)',
      '--cr-tooltip-color': props.variant === 'subtle' ? 'var(--text-default)'    : 'var(--surface-floating-foreground)',
    },
  }),
  context: (rootProps) => ({ side: rootProps.side ?? 'top', sideOffset: 4 }),
  parts: {
    provider: {
      render: ({ props, children }) => (
        <RadixTooltip.Provider {...props}>{children}</RadixTooltip.Provider>
      ),
    },
    root: {
      render: ({ props, children }) => (
        <RadixTooltip.Root
          defaultOpen={props.defaultOpen}
          open={props.open}
          onOpenChange={props.onOpenChange}
        >
          {children}
        </RadixTooltip.Root>
      ),
    },
    trigger: {
      render: ({ getStyles, props }) => (
        <RadixTooltip.Trigger asChild={props.asChild} {...getStyles()}>
          {props.children}
        </RadixTooltip.Trigger>
      ),
    },
    content: {
      render: ({ getStyles, props, ctx, children }) => (
        <RadixTooltip.Portal>
          <RadixTooltip.Content side={ctx.side} sideOffset={ctx.sideOffset} {...getStyles()}>
            {children}
            {props.withArrow !== false && (
              <RadixTooltip.Arrow {...getStyles({ part: 'arrow' })} />
            )}
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      ),
    },
  },
});
```

### 6.4 CSS shape

```css
/* Tooltip.css — exhaustive enough to demonstrate all the slot styling */
.cr-Tooltip-content {
  background: var(--cr-tooltip-bg);
  color: var(--cr-tooltip-color);
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  line-height: 1.4;
  box-shadow: var(--shadow-md);
  animation: cr-Tooltip-fadeIn 150ms cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 50;
  max-width: 18rem;
}

.cr-Tooltip-arrow {
  fill: var(--cr-tooltip-bg);
}

@keyframes cr-Tooltip-fadeIn {
  from { opacity: 0; transform: translateY(2px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### 6.5 Consumer-side API

**Mounting + per-instance use** — composition stays close to Radix:

```tsx
// App.tsx — Provider mounts once at the React tree top
<Tooltip.Provider>
  <App />
</Tooltip.Provider>

// downstream — per-tooltip JSX
<Tooltip>
  <Tooltip.Trigger asChild>
    <Button>Save</Button>
  </Tooltip.Trigger>
  <Tooltip.Content>Saves your changes</Tooltip.Content>
</Tooltip>

<Tooltip variant="subtle" side="right">
  <Tooltip.Trigger asChild>
    <Button variant="ghost">?</Button>
  </Tooltip.Trigger>
  <Tooltip.Content>Shortcut: ⌘S</Tooltip.Content>
</Tooltip>
```

**Theme-set defaults** — global behavior configured once, no per-instance prop threading (per § 3.5):

```ts
// app theme setup
import { createTheme } from '@soribashi/core';
import { Tooltip, Button } from 'core-radix-pilot';

export const theme = createTheme({
  tokens, semantic,
  components: [
    Tooltip.Provider.withDefaults({ delayDuration: 500, skipDelayDuration: 150 }),
    Tooltip.Content.withDefaults({ sideOffset: 8 }),
    // ...other components
  ],
});
```

With those defaults set, `<Tooltip.Provider>` mounts with no props in JSX; per-instance `<Tooltip.Content>` likewise inherits `sideOffset: 8` without the consumer writing it on every tooltip. Per-instance overrides still work — `<Tooltip.Content sideOffset={2}>` wins per the standard `useProps` precedence.

### 6.6 `TooltipMatrix.tsx`

Full `variant × side` matrix (2 × 4 = 8 cells), plus three special cases: long content (forces wrapping), `withArrow={false}`, controlled open via `open`/`onOpenChange`. Mirrors Wave 1's `ButtonMatrix.tsx` in structural pattern.

### 6.7 `ScreenReplica.tsx` integration

Adds Tooltips wherever CVI uses them in production: icon-only buttons (e.g., the activity-panel filter row's IconButton equivalents), truncated text with overflow ellipses, status indicators. Used as the visual-review fixture for the design owner.

---

## 7. Failure modes + error handling

| Failure | Surfaces at | Caught by | Behavior |
|---|---|---|---|
| Author calls `getStyles({ part: 'typo' })` | compile time | TS — part name bound to `keyof typeof config.parts` | won't compile |
| Consumer renders `<Tooltip.Trigger>` outside `<Tooltip>` | runtime, render | safe-context throw | error: `"Tooltip parts must be inside <Tooltip>"` (factory uses `name` from config) |
| Consumer renders `<Tooltip>` outside `<Tooltip.Provider>` | runtime, on hover | Radix's own console error | tooltip doesn't open. Pilot README documents the expected mount of `Tooltip.Provider` at app root. |
| Consumer passes `asChild` with multiple children | runtime, render | `Children.only()` (Slot) and Radix's own check | error from whichever guards first |
| Consumer passes `asChild` with non-element child (text node) | runtime, render | `isValidElement` check in Slot | renders `null` from Slot; Radix may also throw |
| Codegen sees `surface.X` object form with `foreground` referencing an undefined token | codegen time | existing token-resolver | thrown with path like `surface.floating.foreground → neutral.999 (not found)` |
| Author marks `parts.root` polymorphic | factory startup | runtime check in factory | error: `"Compound root part cannot be polymorphic; declare polymorphism on a child part instead."` |

**Refused-to-handle:** controlled-but-undefined-`open` toggling, weird Radix asChild edge cases (`asChild` with a fragment), portal-target customization beyond Radix defaults, multi-Provider hierarchies with conflicting delay state. Pilot stays out; consumers handle at integration.

---

## 8. Testing strategy

Mirrors Wave 1's three-layer model + factory unit tests + codegen tests.

### 8.1 Factory unit tests (new)

`packages/factory/src/define-compound.test.tsx`:
- Generated namespace: `Compound.Foo` is a real component
- Context provider wraps Root render; child parts see context
- Each part's `getStyles` reads from context (not a fresh `useStyles` call)
- Polymorphic part flag works (renders correct element, forwards refs)
- Passthrough part (no `ctx` consumption) renders without throwing outside Root
- Context-consuming part throws outside Root with the configured error message
- `getStyles({ part: 'sibling' })` resolves to sibling slot's class
- `defaults` apply at part level + Root level
- `vars` resolver output lands as inline custom properties on the right slot
- `config.context()` receives merged props (post-`useProps`) and may call hooks
- `Compound.Foo.withDefaults({...})` returns a tagged record carrying the part's flat name (`'CompoundFoo'`)

`packages/factory/src/define-component.test.tsx` (additions):
- `Component.withDefaults({...})` returns `{ __soribashiThemeEntry: true, name, defaultProps }`
- The flat name matches `config.name` (so `defineCompound` parts register as `'TooltipProvider'`, `'TooltipContent'`, etc.)
- Type-level: `withDefaults`'s argument is `Partial<TProps>` — passing an unknown prop is a compile error

`packages/factory/src/slot.test.tsx`:
- Single child enforced (`Children.only` throws on multiple)
- `className` composes (slot + child, both present)
- `style` merges (child wins on key collisions)
- Event handlers compose (slot first, child second; both called)
- Refs compose (both refs receive the node)
- DOM attributes pass through

### 8.2 Pilot Tooltip tests (new)

`apps/core-radix-pilot/src/recipes/Tooltip/Tooltip.test.tsx`:
- Renders `Tooltip.Provider + Root + Trigger + Content` together
- Hover trigger → content appears (`userEvent.hover` + Radix's open lifecycle)
- Click outside or escape → content disappears
- `asChild` forwards onto a `<Button>` (computed-style assertion: button has trigger's class)
- Default variant → content has `--cr-tooltip-bg: var(--surface-floating)` resolved (the new "out of the box" inverted-style)
- `variant="subtle"` → content has `--cr-tooltip-bg: var(--surface-raised)` resolved
- `withArrow` toggles arrow rendering
- Content renders inside a portal (asserted via `document.body` query, not container)
- Trigger/Content thrown outside Root → safe-context error

### 8.3 Browser parity (new)

`tests/browser-parity/tooltip-computed-styles.spec.ts`:
- Loads `TooltipMatrix.tsx` in real Chromium
- Per cell of the 2 × 4 matrix: opens tooltip, asserts computed styles per slot match `vars()` output
- Captures screenshot per cell for visual-review baseline
- Validates dark-mode toggle: switch theme → re-assert per cell (proves dual-emit + dark-mode-selector wiring carries floating tokens)

### 8.4 Codegen tests (new)

`packages/codegen/test/emit-css-surface-foreground.test.ts`:
- String-form surface emits one `--surface-{name}` var
- Object-form surface emits both `--surface-{name}` and `--surface-{name}-foreground`
- Object form with `foreground` absent: emits only the value var (back-compat)
- Dark-mode block emits the foreground pair under the configured selector
- Object-form surface generates the right Tailwind alpha companion (`--__hsl-` dual-emit) for both vars

`packages/theme/test/semantic-surface-foreground.test.ts`:
- Type-level: `SemanticSurfaceValue` accepts both string and object forms
- Runtime: `createTheme` round-trips both forms through the resolved theme shape

`packages/theme/test/create-theme-components-array.test.ts` (new):
- `createTheme({ components: [Component.withDefaults({...}), ...] })` normalizes to the existing `Record<string, ComponentThemeConfig>` shape
- `createTheme({ components: { Tooltip: ... } })` (legacy record form) still works
- `useProps('Tooltip', ...)` reads the merged defaults regardless of registration form
- Two `withDefaults` entries for the same component: last write wins (documents the dedup behavior)

### 8.5 Visual review (manual, journaled)

- `TooltipMatrix.tsx` rendered light + dark, screenshot grid captured in journal
- `ScreenReplica.tsx` with Tooltips integrated — captured for design-owner review (gates moving to Wave 3)

---

## 9. Sequencing notes

The implementation plan (separate document, produced via writing-plans) sequences this. The dependency graph at the design-doc level:

1. `packages/theme/` type extension (smallest, no consumers yet) — enables `surface.floating` declarations.
2. `packages/theme/` `createTheme` array-form normalization (small; no breaking change to existing record form). Independent of phase 1 but bundled here.
3. `packages/codegen/` emit-css extension + tests — enables `--surface-floating-foreground` var.
4. `packages/factory/` — `Component.withDefaults` method on `defineComponent` output (small; uses phase 2's normalization), `Slot` (independent), `compound: true` flag on `defineComponent` (substrate), `defineCompound` (top-level). `defineCompound` depends on the flag; `Slot` and `withDefaults` are independent.
5. `apps/core-radix-pilot/` — theme update with `surface.floating`, Tooltip recipe, Tooltip tests, TooltipMatrix page, App.tsx Provider mount, ScreenReplica integration. The pilot's theme also exercises the array-form `components: [...]` registration with `Tooltip.Provider.withDefaults({...})` etc.
6. Playbook § 2.2 + § 3 + new gradual-formalization convention.

Phases 1-3 + the codegen test slice can land first as a small standalone PR if useful. Phases 4-6 form the bulk of the wave.

---

## 10. Cross-references

- **Wave 1 spec:** `docs/superpowers/specs/2026-04-26-token-consolidation-and-button-pilot-design.md`
- **Wave 1 playbook:** `docs/superpowers/specs/2026-04-26-core-radix-conversion-playbook.md` (§ 2.2 to be populated by Wave 2; § 5 Q11 the surface-token decision this resolves)
- **Token-consolidation journal:** `docs/superpowers/pilots/2026-04-26-token-consolidation.md` § 5 Q11 (surface↔foreground), § 5 Q1 (popover/card collapse — fed into floating-surface decision), the `surface.scrim` rename note that explicitly reserved "overlay/floating" naming for Wave 2
- **Button conversion journal:** `docs/superpowers/pilots/2026-04-26-button-conversion.md` (Wave-1 recipe authoring patterns this extends)
- **Wave 1 handoff:** `docs/superpowers/sessions/2026-04-28-handoff.md` (Wave 2 = option A in next-task menu)
- **Mantine source references** (for design-doc justification, not runtime dep):
  - `packages/@mantine/core/src/core/factory/factory.tsx` — `FactoryPayload`, `compound: true` flag
  - `packages/@mantine/core/src/core/styles-api/styles-api.types.ts` — `CompoundStylesApiProps`
  - `packages/@mantine/core/src/core/utils/create-safe-context/create-safe-context.tsx` — substrate primitive (verbatim 11-line import path)
  - `packages/@mantine/core/src/components/Popover/` — canonical compound exemplar (target/dropdown/portal split)
  - `packages/@mantine/core/src/components/Tabs/` — simpler 4-part compound

---

## 11. Open design questions

- **OQ-1.** `surface.floating` light-mode default value. Pilot picks `neutral.900` to deliberately exercise the inverted case; CVI integration may pick a non-inverted value. Pilot's choice acceptable, or should pilot match CVI's actual tooltip surface (non-inverted)? Net: visual demo only — token model handles both.
- **OQ-2.** Should `Tooltip.Provider`'s props pass through to `RadixTooltip.Provider` 1:1, or trim/rename? Pilot default: 1:1 passthrough (least surprising for Radix users). With theme-set defaults via `Tooltip.Provider.withDefaults({...})` (§ 3.5) absorbing most of the configuration burden, the per-instance prop surface mostly serves "Radix transparency" rather than ergonomics — reinforcing the 1:1 default.
- **OQ-3.** Naming for the new surface slot — `surface.floating` vs `surface.popover` vs `surface.overlay`. Wave-1 token-consolidation journal already reserved "overlay/floating" naming for Wave 2 when renaming the modal-backdrop slot from `surface.overlay` → `surface.scrim`. Spec picks `surface.floating` (matches Floating UI's vocabulary; doesn't presume the surface is for popovers vs tooltips vs menus). Confirm.
- **OQ-4.** `Slot` lives in `packages/factory/src/slot.tsx` and is exported from `@soribashi/core`. Right module placement, or should it sit in a `@soribashi/utils` package (does not currently exist)? Spec default: `packages/factory/`.
- **OQ-5.** Should `defineCompound` allow per-part `vars` resolvers (each part defines its own), or only Root-level `vars` keyed by part name (current design)? Mantine takes the keyed-by-slot approach. Spec default: Root-level keyed-by-part. Authors who need per-part split can refactor inside the resolver.
- **OQ-6.** Should `createSafeContext` be promoted to public export in Wave 2 (preemptively, so authors who need a per-item secondary context have it)? Spec default: no — keep internal until first concrete need. Adding a public export is backward-compatible.
- **OQ-7.** Eject-per-part timing. Spec defers until first wave that hits a config-shape wall. Wave 3 (Tabs) might be that wave (per-item context for Trigger active-state); if so, eject-per-part is the natural Wave-3 addition. If Wave 3 fits into the current `defineCompound` shape, defer further.
- **OQ-8.** Auto-mounting library Providers from `SoribashiProvider` (e.g., `<SoribashiProvider providers={[Tooltip.Provider]}>`). **Considered and rejected.** `Tooltip.Provider` is a *library-authored* compound part (lives in the consumer's library, not in soribashi). For `SoribashiProvider` to auto-mount it would mean soribashi taking a position on a substrate it doesn't ship — a clean layer violation. The right place to consolidate "mount these providers once" is a library-level `<AppShell>` component the library author writes, composing `<SoribashiProvider>` + their library's providers. Not soribashi's concern. Recorded so we don't relitigate cold next wave.
- **OQ-9.** ~~Per-part prop typing in `defineCompound`.~~ **RESOLVED in-Wave-2 (commit `32dbb05`).** The factory's `PartsNamespace` mapped type was using `React.ForwardRefExoticComponent<any>` for static properties, erasing per-part TProps. Resolved by introducing an `ExtractPartProps<C>` conditional that pulls TProps out of each part's `PartConfig<TProps, TCtxExtra>` and threading it through to: (a) `Tooltip.Provider` etc.'s component prop type, (b) the Root's prop type via `ExtractPartProps<TParts['root']>`, (c) `defaults` / `vars` / `context` callback signatures. Recipe-side: each part's render takes `({ props, ... }: PartRenderCtx<TooltipXProps, TooltipCtxExtras>)` — TS infers TProps from the destructure annotation. Two workarounds removed from `Tooltip.tsx`: the `as unknown as` cast at the bottom of the file, AND the `(props as TooltipXProps)` casts inside each part's render. Public API gains `PartRenderCtx`, `PolymorphicPartRenderCtx`, `StandardPartConfig`, `PolymorphicPartConfig`, `PartConfig` exports.

---

## 12. Glossary

- **Slot / Part** — Mantine calls them slots; Radix calls them parts. Same concept: a named subtree of a compound component, addressed by name in styles API and rendered (for compounds) as a separately-exported sub-component.
- **Safe-context** — a React context whose `useContext` hook throws an error if consumed outside its Provider. Surfaces wiring mistakes at first render rather than via `undefined` access. `packages/@mantine/core/src/core/utils/create-safe-context/create-safe-context.tsx` is the 11-line canonical implementation; soribashi's `defineCompound` uses the same pattern internally.
- **`asChild`** — Radix idiom: `<Tooltip.Trigger asChild><Button /></Tooltip.Trigger>` clones the child element and merges the parent's props onto it, instead of rendering the parent's own DOM element. Soribashi's `Slot` provides the merge primitive substrate-agnostically; Radix's parts use Radix's own Slot internally.
- **Floating surface** — a surface for transient UI that floats over the page (tooltip, popover, menu, dropdown). The semantic-token slot introduced in Wave 2.
- **Formalized foreground** — a surface declared as `{ value, foreground }` whose paired text color is named in the token vocabulary. Codegen emits both `--surface-{name}` and `--surface-{name}-foreground`. Opt-in per surface; existing Wave-1 surfaces remain on informal pairing.
