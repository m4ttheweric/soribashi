---
name: visual-parity-check
description: Compare shadcn-starter recipes against the pinned shadcn/ui donor source for visual parity. Use when a recipe is added or changed and needs verification against the donor.
---

# Visual Parity Check

Verify that shadcn-starter recipes match their shadcn/ui donor components. The bar is: every structural class the donor sets is accounted for in our recipe, either matched or deliberately diverged.

## Read this first: do not measure ui.shadcn.com

The docs site renders demo previews inside its own page chrome, and the chrome uses the same components at different sizes. Sampling `[data-slot="button"]` on a docs page can return a nav or copy button rather than the demo.

This is not hypothetical. A prior audit measured the docs site and reported that shadcn's default button was `h-8 px-2.5` and that Card had migrated to a `--card-spacing` variable. Both were false. The donor's default button is `h-9 px-4 py-2` and Card was unchanged. The audit produced seven "blockers" that would have broken working parity had they been actioned.

**The donor source in the pinned checkout is the source of truth. The live site is not.**

## Prerequisites

A donor checkout pinned to the manifest's commit:

```bash
git clone https://github.com/shadcn-ui/ui.git ~/Documents/GitHub/shadcn-ui
git -C ~/Documents/GitHub/shadcn-ui checkout $(grep -o "DONOR_COMMIT = '[^']*'" apps/shadcn-starter/conversion/manifest.ts | cut -d"'" -f2)
```

Confirm the pin is intact before trusting any comparison:

```bash
bun run test -- donor-pin
```

If that fails, the checkout is off the pin or the donor moved. Resolve it first. A parity finding measured against the wrong donor version is worse than no finding.

## Step 1 (primary): class-string diff, offline

This catches nearly everything and costs no browser time.

- **Donor:** `~/Documents/GitHub/shadcn-ui/apps/v4/registry/new-york-v4/ui/{registryItem}.tsx`
- **Ours:** `apps/shadcn-starter/src/recipes/{Name}/{Name}.tsx`
- `registryItem` per component is in `apps/shadcn-starter/conversion/manifest.ts`.

Read both. For each donor `className` string, find the matching selector in our `classes` object and compare token by token. Our recipes split the donor string into three bands (structural literals, var-indirection, data-attribute variants), so expect our version to be reordered and to substitute `bg-(--button-bg)` where the donor has `bg-primary`. Reordering and var substitution are expected. **Missing tokens are the finding.**

Report per selector: tokens present in the donor and absent from ours, tokens we add that the donor lacks, and any token whose value differs (`py-4` vs `py-2.5`).

## Step 2: computed-style diff in the browser, only where step 1 is inconclusive

Class strings do not settle what a token resolves to once our theme's `@theme` block is in play. When a value is in question, measure ours and compare against the donor's declared intent.

Use Playwright MCP (`mcp__playwright__browser_*`). Never the Claude-in-Chrome tools. Delegate multi-step browser work to the `browser-driver` agent.

Dev server: `bun run dev:shadcn-starter` on port 5175. The app is a single page with client-side state routing, so navigate by clicking sidebar labels (`Button`, `Badge`, `Card`, `Tooltip`, `Dialog`, `DropdownMenu`, `Tabs`, `Accordion`, `Checkbox`, `Select`, `Tokens`, `Dashboard`), not URLs. The sidebar's top button toggles dark mode.

Our elements are found via `[data-variant]`, `[data-intent]`, `[data-size]`. Extract with `getComputedStyle` over the parity-critical set:

`fontSize, fontWeight, lineHeight, paddingTop/Right/Bottom/Left, borderRadius, borderWidth, borderColor, backgroundColor, color, height, display, justifyContent, alignItems, whiteSpace, overflow, boxShadow, opacity`

If you do open the docs site for a sanity check, scope every query to inside the demo preview container, and treat any result that contradicts the donor source as a sampling error until proven otherwise.

## Step 3: interaction states

These cannot be diffed from source. Drive them in the browser:

- **Overlays** (Tooltip, Dialog, DropdownMenu, Select): open, verify positioning, backdrop, and that content is legible against the page. Exercise submenus, checkbox items, radio groups.
- **Persistent compounds** (Tabs, Accordion): switch or expand, verify active/open styling and chevron rotation.
- **Controls** (Button, Checkbox): hover, focus-visible ring, disabled, checked.

## Known intentional differences (not defects)

- 6 intents (primary, neutral, success, warning, danger, info) vs the donor's 3 (default, secondary, destructive).
- `variant=subtle` has no donor equivalent.
- Our `as` prop replaces the donor's `asChild`.
- Colors resolve through soribashi's intent resolver via CSS vars (`--button-bg`). The resolved color should match; arriving via a var is expected.
- We emit `data-variant` / `data-intent` / `data-size`, which the donor lacks. They do not affect computed styles.
- Dimension vars (`--sb-button-h`) come from `BUTTON_DIMENSIONS` in `soribashi.config.ts`, keyed on the theme's size vocabulary. The donor's single default size maps to our `md`.

## Known failure patterns

1. **Named sizing utilities silently collapsed.** FIXED in the emitter; kept here because the workarounds it caused are still scattered through older recipes and demo pages.

   `max-w-sm`, `size-md`, `w-lg` and friends used to resolve to a few pixels. The cause was NOT that `@theme` replaces the Tailwind defaults; it merges, and there is no `--*: initial` in the generated CSS. It was that codegen emitted **named** spacing keys (`--spacing-xs/sm/md/lg/xl/2xl/3xl`), and Tailwind v4 resolves the sizing utilities off `--spacing-*` before `--container-*`, so `max-w-sm` compiled to `max-width: var(--spacing-sm)` (0.5rem) instead of 24rem. Numeric utilities were never affected: `h-9` compiles to `calc(var(--spacing) * 9)`.

   Re-declaring `--container-*` did not fix it, and neither did `--spacing-*: initial`. `emitTailwindV4` now withholds spacing keys that collide with Tailwind's `--container-*` scale (`3xs 2xs xs sm md lg xl 2xl…7xl`) and names them in a comment in the generated `tailwind.css`. Named sizing utilities are safe to use again and should match the donor verbatim.

   **What this means for parity work:** an arbitrary value where the donor has a named utility (`sm:max-w-[32rem]` against the donor's `sm:max-w-lg`) is a leftover workaround, not a deliberate divergence. Report it as `differs` and restore the donor token. Spacing utilities on colliding names (`p-md`, `gap-sm`) do not exist by design; recipes route spacing through `--sb-{component}-*` vars, and the donor uses numeric spacing anyway.
2. A compound part sharing a classes slot with an internal element inherits its positioning (this produced the Dialog close-button leak, fixed by splitting `close` from `closeButton`).
3. Donor conditional-sibling selectors (`[.border-t]:pt-6`, `[.border-b]:pb-6`) are easy to drop when splitting a class string into bands. Grep the donor string for `[.` before declaring a selector matched.

## Reporting

| Component | Selector | Donor token | Ours | Verdict |
|---|---|---|---|---|

Verdict: `missing` (donor sets it, we do not), `differs` (both set it, values disagree), `added` (ours only), `intentional`.

State which components you completed and which you did not. A complete pass over 7 beats a shallow pass over 10.

## Fixing

Recipe files only; do not adjust the donor. After changes: `bun run typecheck && bun run test`, then re-run step 1. Commit as `fix(shadcn-starter): <what> to match donor`.
