---
name: visual-parity-check
description: Compare shadcn-starter recipes against shadcn/ui originals in Chrome for visual parity. Use when a recipe is added or changed and needs visual verification against the donor component.
---

# Visual Parity Check

Verify that shadcn-starter recipes visually match their shadcn/ui donor components by extracting and diffing computed CSS styles from both sites. The bar is zero computed-style diffs on the properties that define visual identity.

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

- Tab 1 (ours): `http://localhost:5175/`
- Tab 2 (shadcn): `https://ui.shadcn.com/docs/components/<component>`

### 2. PRIMARY METHOD: Computed style extraction and diff

This is the autonomous feedback loop. Do NOT rely on screenshots for visual comparison -- they are not precise enough to catch 2px height differences, font-weight mismatches, or subtle border-color differences.

#### Step A: Extract shadcn's actual classes from the DOM

On the shadcn tab, run JavaScript to find the component element and extract its full class list:

```javascript
// Find the component by data-slot attribute (shadcn v4 convention)
const el = document.querySelector('[data-slot="badge"]'); // or button, etc.
JSON.stringify({
  className: el?.getAttribute('class'),
  // also get computed values for verification
  ...(() => {
    const cs = getComputedStyle(el);
    return {
      fontSize: cs.fontSize, fontWeight: cs.fontWeight, lineHeight: cs.lineHeight,
      paddingTop: cs.paddingTop, paddingRight: cs.paddingRight,
      paddingBottom: cs.paddingBottom, paddingLeft: cs.paddingLeft,
      borderRadius: cs.borderRadius, borderWidth: cs.borderWidth,
      borderColor: cs.borderColor, backgroundColor: cs.backgroundColor,
      color: cs.color, height: cs.height, display: cs.display,
      justifyContent: cs.justifyContent, alignItems: cs.alignItems,
      whiteSpace: cs.whiteSpace, overflow: cs.overflow,
      boxShadow: cs.boxShadow, opacity: cs.opacity,
    };
  })()
}, null, 2);
```

**The className string is the source of truth.** Copy shadcn's actual Tailwind classes and use them as the basis for our recipe's band-1 structural literals.

#### Step B: Extract our component's computed styles

On our tab, run the same extraction:

```javascript
const el = document.querySelector('[data-variant="filled"][data-intent="primary"]'); // adjust selector per component
const cs = getComputedStyle(el);
JSON.stringify({
  fontSize: cs.fontSize, fontWeight: cs.fontWeight, lineHeight: cs.lineHeight,
  paddingTop: cs.paddingTop, paddingRight: cs.paddingRight,
  paddingBottom: cs.paddingBottom, paddingLeft: cs.paddingLeft,
  borderRadius: cs.borderRadius, borderWidth: cs.borderWidth,
  borderColor: cs.borderColor, backgroundColor: cs.backgroundColor,
  color: cs.color, height: cs.height, display: cs.display,
  justifyContent: cs.justifyContent, alignItems: cs.alignItems,
  whiteSpace: cs.whiteSpace, overflow: cs.overflow,
  boxShadow: cs.boxShadow, opacity: cs.opacity,
}, null, 2);
```

#### Step C: Diff the values

Compare each property. Build a diff table:

```javascript
// Run on our tab after capturing shadcn's values
const shadcn = { /* paste shadcn values here */ };
const el = document.querySelector('[data-variant="filled"]');
const cs = getComputedStyle(el);
const diffs = [];
for (const [key, expected] of Object.entries(shadcn)) {
  const actual = cs[key];
  if (actual !== expected) diffs.push({ property: key, expected, actual });
}
JSON.stringify({ totalDiffs: diffs.length, diffs }, null, 2);
```

#### Step D: Fix until diffs = 0

For each diff:
1. Identify which Tailwind class causes the mismatch
2. Update the recipe's class string in the `.tsx` file
3. Run `bun run test` to verify no regressions
4. Re-run the diff to confirm the fix

**Loop until `totalDiffs: 0`.**

#### Properties to compare (the parity-critical set)

| Property | What it catches |
|----------|----------------|
| fontSize | text-xs vs text-sm mismatch |
| fontWeight | font-medium (500) vs font-semibold (600) |
| height | explicit h-5 vs padding-only |
| paddingTop/Right/Bottom/Left | px-2 vs px-2.5, py-0.5 vs py-1 |
| borderRadius | rounded-md vs rounded-full vs rounded-lg |
| borderWidth | border vs border-0 |
| borderColor | border-transparent vs visible border |
| backgroundColor | fill color correctness |
| color | text color correctness |
| display | flex vs inline-flex |
| justifyContent | center vs start |
| whiteSpace | nowrap vs normal |
| overflow | hidden vs visible |
| boxShadow | shadow presence/absence |

#### Finding component elements on shadcn's docs

shadcn v4 uses `data-slot` attributes:
- `[data-slot="badge"]`
- `[data-slot="button"]`
- `[data-slot="card"]`
- `[data-slot="accordion"]`, `[data-slot="accordion-item"]`, `[data-slot="accordion-trigger"]`, `[data-slot="accordion-content"]`
- `[data-slot="checkbox"]`
- `[data-slot="select-trigger"]`
- `[data-slot="tabs-list"]`, `[data-slot="tabs-trigger"]`, `[data-slot="tabs-content"]`
- `[data-slot="dialog-overlay"]`, `[data-slot="dialog-content"]`, `[data-slot="dialog-title"]`
- `[data-slot="dropdown-menu-content"]`, `[data-slot="dropdown-menu-item"]`
- `[data-slot="tooltip-content"]`

If `data-slot` doesn't exist, fall back to finding elements inside the demo preview containers on the docs page.

#### Finding component elements in our app

Our components use `data-variant`, `data-intent`, `data-size` attributes:
- `[data-variant="filled"][data-intent="primary"]` for default-state components
- Compound parts: query by Radix's `data-state`, `role`, or the element's position in the DOM

### 3. SECONDARY METHOD: Interactive behavior verification

After computed styles match, verify interactive states. These can't be diffed numerically -- use screenshots.

#### Hover states
1. Hover over component on our tab, take screenshot
2. Hover over component on shadcn tab, take screenshot
3. Compare visually (opacity change, bg shift, underline)

#### Focus states
1. Tab to component, screenshot the focus ring
2. Compare ring color/width/offset

#### Open/close behavior (overlays, menus, dialogs)
1. Click trigger on our tab, screenshot the opened state
2. Click trigger on shadcn tab, screenshot the opened state
3. Compare: positioning, backdrop, animation, content layout

### 4. Known intentional differences (not bugs)

These differ from shadcn by design (soribashi vocabulary extensions):
- 6 intents (primary, neutral, success, warning, danger, info) vs shadcn's 3 (default, secondary, destructive)
- `variant=subtle` does not exist in shadcn
- `as` prop replaces shadcn's `asChild`
- Colors route through soribashi's intent resolver (`--badge-bg`, `--button-bg`), not hardcoded. The resolved COLOR should match, but the CSS property name will differ (our `background-color` comes from a var, theirs is direct).
- Our components emit `data-variant`/`data-intent`/`data-size` attributes that shadcn doesn't have. These don't affect computed styles.

### 5. Common failure patterns (from prior sessions)

1. **`@theme` clobbers Tailwind defaults.** Named utilities like `max-w-sm`, `max-w-lg`, `max-w-xl` resolve to garbage because our `@theme` block replaces the entire Tailwind theme. Fix: use arbitrary values like `max-w-[24rem]`.

2. **Tooltip invisible.** If tooltip content uses `bg-(--surface-floating)` it blends into the page. shadcn tooltips use inverted colors.

3. **Badge dimensions wrong.** shadcn badges use explicit `h-5` + `px-2 py-0.5 text-xs font-medium`. Dimension vars that deviate from these make badges visibly different.

4. **Compound parts not full-width.** Accordion/Field content wrapping per-word means something is constraining width (often the `@theme` issue above).

5. **Dialog close button positioning leak.** If `Dialog.Close` (consumer-facing) shares the same classes slot as the internal X button, it inherits `absolute right-4 top-4`. Fix: split into `close` and `closeButton` slots.

6. **Checkbox/Select in Field layout.** Field's `space-y-2` stacks vertically. Checkbox+label should be inline (flex row).

### 6. Reporting

After checking all components, produce a findings table:

```markdown
| Component | Computed Diffs | Interactive | Issues |
|-----------|---------------|-------------|--------|
| Badge     | 0             | OK          | none   |
| Button    | 0             | OK          | none   |
| ...       |               |             |        |
```

### 7. Fixing issues

After the audit:
1. Fix all issues in recipe files or demo pages
2. Run `bun run typecheck && bun run test`
3. Re-run the computed-style diff to confirm zero diffs
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
