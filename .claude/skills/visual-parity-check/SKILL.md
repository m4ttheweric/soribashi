---
name: visual-parity-check
description: Compare shadcn-starter recipes against shadcn/ui originals in Chrome for visual parity. Use when a recipe is added or changed and needs visual verification against the donor component.
---

# Visual Parity Check

Verify that shadcn-starter recipes visually match their shadcn/ui donor components. The bar is intent parity (same visual language), not pixel parity.

## Prerequisites

- Chrome browser extension connected (`mcp__claude-in-chrome__list_connected_browsers`)
- Dev server running (`bun run dev:shadcn-starter` on port 5175)
- Load browser tools via ToolSearch: `select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__read_page,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__browser_batch,mcp__claude-in-chrome__javascript_tool`

## Process

### 1. Set up two tabs

```
tabs_context_mcp({ createIfEmpty: true })
tabs_create_mcp()  // second tab for shadcn docs
```

- Tab 1: `http://localhost:5175/` (our app)
- Tab 2: `https://ui.shadcn.com/docs/components/<component>` (shadcn original)

### 2. For each component, check ALL of the following

#### A. Static appearance (light mode)

1. Navigate to our component's gallery page (click nav item)
2. Navigate to shadcn's component doc page
3. Take zoomed screenshots of both at the same scale
4. Compare:
   - **Border radius** (rounded-md vs rounded-full vs rounded-lg)
   - **Padding/spacing** (compact vs tall)
   - **Typography** (font size, weight)
   - **Colors** (bg, text, border -- compare against shadcn's default/secondary/destructive/outline/ghost)
   - **Shadow** (present/absent, intensity)
   - **Border** (visible/transparent, color)

#### B. Static appearance (dark mode)

1. Click the Dark/Light toggle in our app's nav
2. Repeat the same visual checks
3. Key things that break in dark mode:
   - Semantic var flipping (surface, text, border tokens)
   - Contrast on inverted components (tooltip, badge filled)
   - Border visibility

#### C. Hover states

1. Hover over each variant of the component
2. Take screenshot while hovering
3. Compare hover bg/opacity change against shadcn
4. shadcn patterns:
   - Default button: `hover:bg-primary/80` (slightly lighter)
   - Outline/Ghost: `hover:bg-accent` (subtle highlight)
   - Destructive: `hover:bg-destructive/80`
   - Link: `hover:underline`

#### D. Focus states

1. Tab to the component to trigger focus-visible ring
2. Screenshot the focus ring
3. Compare ring color and offset against shadcn's `ring-ring ring-offset-2`

#### E. Active/pressed states

1. Click and hold (where applicable)
2. Check for any pressed visual feedback

#### F. Interactive behavior (component-specific)

For each component type, verify these interactions:

**Button:** hover all variants, verify link variant underlines on hover
**Badge:** verify all variants render (filled, outline, subtle), check sizes scale correctly
**Card:** verify shadow, border, padding on all sub-parts
**Tooltip:** hover trigger, verify tooltip appears with correct position/styling/animation
**Dialog:** click trigger, verify overlay backdrop (black/80), content centered, X button in corner, close on X/Escape/overlay click
**DropdownMenu:** click trigger, verify menu appears with items/shortcuts/separators, hover items for highlight, check checkbox items toggle, verify sub-menu opens on hover
**Tabs:** click each tab, verify active state switches, check all variants (default/outline/pills) look distinct
**Accordion:** click each trigger, verify expand/collapse animation, chevron rotation, only one open in single mode
**Checkbox:** click to toggle, verify check icon appears, verify disabled state, verify with Field composition
**Select:** click trigger, verify dropdown with items, select an item, verify disabled items

### 3. Known intentional differences (not bugs)

These differ from shadcn by design (soribashi vocabulary extensions):
- 6 intents (primary, neutral, success, warning, danger, info) vs shadcn's 3 (default, secondary, destructive)
- 5 sizes (xs-xl) vs shadcn's fewer
- `variant=subtle` does not exist in shadcn
- `as` prop replaces shadcn's `asChild`
- Colors route through soribashi's intent resolver, not hardcoded

### 4. Common failure patterns (from prior sessions)

These are bugs we've actually hit. Check for them:

1. **`@theme` clobbers Tailwind defaults.** Named utilities like `max-w-sm`, `max-w-lg`, `max-w-xl` resolve to garbage because our `@theme` block replaces the entire Tailwind theme. Fix: use arbitrary values like `max-w-[24rem]`.

2. **Tooltip invisible.** If tooltip content uses `bg-(--surface-floating)` it blends into the page. shadcn tooltips use inverted colors (`bg-primary text-primary-foreground`).

3. **Badge not pill-shaped.** shadcn badges use `rounded-full`. If ours use `rounded-md` they look boxy.

4. **Compound parts not full-width.** Accordion/Field content wrapping per-word means something is constraining width (often the `@theme` issue above).

5. **Dialog close button positioning leak.** If `Dialog.Close` (consumer-facing) shares the same classes slot as the internal X button, it inherits `absolute right-4 top-4`. Fix: split into `close` and `closeButton` slots.

6. **Checkbox/Select in Field layout.** Field's `space-y-2` stacks vertically. Checkbox+label should be inline (flex row) -- don't use Field's `label` prop for checkboxes; put the label inline next to the checkbox.

### 5. Reporting

After checking all components, produce a findings table:

```markdown
| Component | Light | Dark | Hover | Focus | Behavior | Issues |
|-----------|-------|------|-------|-------|----------|--------|
| Button    | OK    | OK   | OK    | OK    | OK       | none   |
| Badge     | OK    | OK   | -     | OK    | -        | none   |
| ...       |       |      |       |       |          |        |
```

For each issue found:
1. Screenshot the problem (ours)
2. Screenshot the reference (shadcn)
3. Identify the CSS class or var causing the difference
4. Suggest the fix (which file, which class string to change)

### 6. Fixing issues

After the audit:
1. Fix all issues in recipe files or demo pages
2. Run `bun run typecheck && bun run test`
3. Re-verify in browser
4. Commit with: `fix(shadcn-starter): visual parity fixes from audit`

## Component-to-URL mapping

| Component    | Our nav label  | shadcn URL path                              |
|-------------|----------------|----------------------------------------------|
| Button      | Button         | /docs/components/button                      |
| Badge       | Badge          | /docs/components/badge                       |
| Card        | Card           | /docs/components/card                        |
| Tooltip     | Tooltip        | /docs/components/tooltip                     |
| Dialog      | Dialog         | /docs/components/dialog                      |
| DropdownMenu| DropdownMenu   | /docs/components/dropdown-menu               |
| Tabs        | Tabs           | /docs/components/tabs                        |
| Accordion   | Accordion      | /docs/components/accordion                   |
| Checkbox    | Checkbox       | /docs/components/checkbox                    |
| Select      | Select         | /docs/components/select                      |
