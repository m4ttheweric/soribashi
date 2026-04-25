# Mantine Blocks Adaptation — Design Spec

**Status:** Draft
**Date:** 2026-04-25
**Audience:** Implementation engineers
**Local Mantine clone:** `/Users/matt/Documents/GitHub/mantine`
**Mantine commit validated:** master @ `63dafbbf` (2026-04-25)

---

## 1. Why This Exists

The Mantine validation pass surfaced that `@soribashi/blocks` is a stripped-down implementation: ~30-50% of the features Mantine ships in equivalent components. Many of the gaps are real engineering Mantine has done over years (responsive `StyleProp<T>` machinery, `lineClamp`, Container's grid strategy + breakout, AspectRatio's children-aware pattern, Group's `grow`+`preventGrowOverflow`, SimpleGrid container queries, etc.).

Rather than reinvent these, we adapt Mantine's source — Mantine is MIT-licensed and explicitly designed to be forked. We copy verbatim where the pattern is correct as-is, adapt only where soribashi's framework or naming conventions require it, and preserve attribution + license per MIT terms.

**This pass is a faithful adaptation, not a reinvention.** The goal is: a soribashi user reading our block source should recognize Mantine's structure but see soribashi's imports, types, and theme-token names.

---

## 2. Scope

### In scope

**Box and the style-prop machinery (the foundation):**
- `packages/blocks/src/Box/Box.tsx` — full polymorphic Box with style props
- `packages/blocks/src/Box/Box.module.css` — layout-only structural styles
- `packages/blocks/src/Box/Box.types.ts` — `BoxProps`, `BoxComponentProps`, `BoxMod`, etc.
- `packages/blocks/src/Box/get-box-style.ts` — extracts style from props
- `packages/blocks/src/Box/get-box-mod.ts` — converts `mod` array to `data-*` attrs
- `packages/blocks/src/Box/style-props/` — the parser and table of style-prop → CSS-property mappings:
  - `parse-style-props.ts`
  - `style-props-data.ts`
  - `style-types.ts` (`StyleProp<T>` etc.)
- `packages/factory/src/inline-styles/InlineStyles.tsx` — emits `<style>` block with media queries for responsive style props
- `packages/factory/src/use-random-class-name.ts` — unique-per-instance class name (uses `useId`)
- `packages/factory/src/hash-style-props.ts` — deterministic hash of responsive styles for SSR-safe deduplication
- Helper utilities: `get-size.ts`, `get-spacing.ts`, `get-radius.ts`, `get-shadow.ts`, `get-font-size.ts`, `get-line-height.ts`, `get-gradient.ts` — port from Mantine's `core/utils`

**The 13 other blocks (full feature parity):**
- `Stack` — gap, align, justify (gap accepts any spacing token, not enum)
- `Group` — gap, align, justify, wrap, **grow**, **preventGrowOverflow** (with `childWidth` ctx), filterFalsyChildren utility
- `Flex` — full responsive `StyleProp<T>` for gap/rowGap/columnGap/align/justify/wrap/direction
- `Grid` + `Grid.Col` — `grow`, `gap`/`rowGap`/`columnGap`, container-query type, custom breakpoints, `<GridProvider>`, responsive col `span`/`offset`/`order`/`align-self`, `GridVariables` component
- `SimpleGrid` — container queries, `auto-fill`/`auto-fit` via `--sg-min-col-width`, responsive cols
- `Container` — block + grid strategies, `data-breakout` support, `fluid`, container-size scale (Mantine's xs=540, sm=720, md=960, lg=1140, xl=1320 + soribashi's existing 2xl/3xl extension)
- `Center` — inline mode using `:where([data-inline])` zero-specificity pattern
- `AspectRatio` — fixed pattern: aspect-ratio applied to children via `& > :where(*:not(style))` plus `object-fit: cover` for img/video
- `Space` — re-implemented as 1-line `<Box w={w} h={h} miw={miw ?? w} mih={mih ?? h}>` (relies on Box's style props)
- `Paper` — withBorder via `:where([data-with-border])`, `outline: 0`, `-webkit-tap-highlight-color: transparent`, `touch-action: manipulation`, light/dark border colors
- `Text` — `lineClamp` (multi-line truncation), `inherit` mode, `inline` mode, gradient variant, RTL `data-truncate='start'`
- `Title` — `lineClamp`, `text-wrap` (`wrap | nowrap | balance | pretty | stable`), separate heading font-family, `getTitleSize` order→size mapping

**Theme additions** (in `@soribashi/theme`):
- `tokens.fontFamily.heading` (default: same as `sans` for now; teams override)
- `tokens.fontWeight` map: `regular`, `medium`, `semibold`, `bold`
- `tokens.lineHeight` map: `xs`, `sm`, `md`, `lg`, `xl`
- `tokens.heading` map (Mantine's `theme.headings.sizes.h1`-`h6`): per-order `fontSize`, `fontWeight`, `lineHeight`, `textWrap`

**License + attribution:**
- `THIRD-PARTY-LICENSES.md` at repo root containing Mantine's MIT license
- Per-file attribution comment at top of every adapted file pointing to the original Mantine path

### Out of scope

- The current minimal `Box` (replaced wholesale)
- Mantine-specific helpers we don't need: `__staticSelector`, `__size`, `useRespectReduceMotion`, color scheme manager, `MantineCssVariables`
- Application components Mantine has but soribashi explicitly doesn't ship (Button, Input, etc.)
- The Tailwind-class-based block styling we currently have — entirely replaced by CSS files following Mantine's structure (CSS variables for theme-driven values, attribute selectors for variant logic)

---

## 3. License + Attribution

Mantine is MIT-licensed:
> Copyright (c) 2021 Vitaly Rtishchev

MIT permits unrestricted use, modification, and distribution provided the license notice and copyright attribution are preserved.

### What we add

#### `THIRD-PARTY-LICENSES.md` at repo root

Contains Mantine's full MIT license text with the copyright notice. This is the canonical attribution record.

#### Per-file attribution

Every adapted file gets this comment at the top:

```ts
/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/components/Stack/Stack.tsx
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 */
```

For files with substantial soribashi-specific changes, append:

```ts
 * Soribashi changes:
 *   - Imports retargeted from '../../core' to '@soribashi/factory' / '@soribashi/theme'
 *   - Token names: --mantine-* → --soribashi-equivalent (see § 4)
 *   - mod API replaced with explicit data-* attributes
```

For files copied wholesale (e.g., a `getSpacing` utility that's pure logic), the comment still goes at the top — readers should always be able to trace any code back to its source.

### Attribution coverage

A pre-commit lint rule (or just convention enforced in PR review) verifies every file under `packages/blocks/src/`, `packages/factory/src/inline-styles/`, `packages/factory/src/use-random-class-name.ts`, etc., has the attribution header.

---

## 4. Token Name Mapping

Mantine's CSS uses `--mantine-*` prefixed tokens. Soribashi uses unprefixed semantic names. The substitutions when adapting Mantine's CSS:

| Mantine token | Soribashi token | Notes |
|---|---|---|
| `--mantine-spacing-{key}` | `--spacing-{key}` | `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl` |
| `--mantine-color-{family}-{shade}` | `--color-{family}-{shade}` | All color families |
| `--mantine-radius-{key}` | `--radius-{key}` | All radius keys |
| `--mantine-radius-default` | `--radius-md` | Mantine's default → soribashi's md |
| `--mantine-color-body` | `--surface-default` | semantic alias |
| `--mantine-color-text` | `--text-default` | semantic alias |
| `--mantine-font-size-{key}` | `--font-size-{key}` | All sizes |
| `--mantine-line-height-{key}` | `--line-height-{key}` | New: added to theme |
| `--mantine-font-weight-{key}` | `--font-weight-{key}` | New: added to theme (regular/medium/semibold/bold) |
| `--mantine-font-family` | `--font-family-sans` | |
| `--mantine-font-family-monospace` | `--font-family-mono` | |
| `--mantine-font-family-headings` | `--font-family-heading` | New: added to theme |
| `--mantine-shadow-{key}` | `--shadow-{key}` | All shadow keys |

`@mixin light` / `@mixin dark` (Mantine's postcss-mixins helpers) are replaced with standard CSS:

```css
/* Mantine */
@mixin light { --paper-border-color: var(--mantine-color-gray-3); }
@mixin dark  { --paper-border-color: var(--mantine-color-dark-4); }

/* Soribashi adapted */
:root           { --paper-border-color: var(--color-neutral-300); }
.dark           { --paper-border-color: var(--color-neutral-700); }
```

`rem(Npx)` (Mantine's postcss-rem helper) becomes literal `Npx` or hand-converted rem (`1px` stays `1px`; `8px` becomes `0.5rem` if context warrants).

---

## 5. Architecture

### File structure (new + modified)

```
soribashi/
  THIRD-PARTY-LICENSES.md                                (new)
  packages/
    factory/src/
      inline-styles/                                     (new)
        InlineStyles.tsx
        InlineStyles.test.tsx
      use-random-class-name.ts                           (new — wraps useId)
      hash-style-props.ts                                (new)
      index.ts                                           (export new APIs)
    theme/src/
      tokens/default-tokens.ts                           (modified — add fontWeight, lineHeight, fontFamily.heading)
      types.ts                                           (modified — extend ThemeTokens type)
    blocks/src/
      Box/                                               (rewritten — full Mantine-faithful Box)
        Box.tsx
        Box.module.css
        Box.types.ts
        get-box-style.ts
        get-box-mod.ts
        style-props/
          parse-style-props.ts
          style-props-data.ts
          style-types.ts
      utils/                                             (new — Mantine helper functions ported)
        get-size.ts
        get-spacing.ts
        get-radius.ts
        get-shadow.ts
        get-font-size.ts
        get-line-height.ts
        get-gradient.ts
        rem.ts
      Stack/Stack.tsx + Stack.module.css                 (rewritten)
      Group/Group.tsx + Group.module.css + filter-falsy-children.ts (rewritten)
      Flex/Flex.tsx + Flex.module.css + flex-props.ts    (rewritten — full responsive)
      Grid/                                              (rewritten — full Mantine fidelity)
        Grid.tsx
        Grid.module.css
        Grid.context.ts
        Grid.variables.tsx
        GridCol/GridCol.tsx
      SimpleGrid/SimpleGrid.tsx + SimpleGrid.module.css + simple-grid.variables.tsx (rewritten)
      Container/Container.tsx + Container.module.css     (rewritten — block + grid strategies)
      Center/Center.tsx + Center.module.css              (rewritten)
      AspectRatio/AspectRatio.tsx + AspectRatio.module.css  (rewritten — children-aware)
      Space/Space.tsx                                    (rewritten — 1-line, no own CSS)
      Paper/Paper.tsx + Paper.module.css                 (rewritten — a11y defaults)
      Text/Text.tsx + Text.module.css                    (rewritten — lineClamp, gradient, etc.)
      Title/Title.tsx + Title.module.css + get-title-size.ts (rewritten)
      style.css                                          (modified — drop Title.css; everything else still imported)
      index.ts                                           (modified — re-export shape preserved)
```

### Dependency direction

```
@soribashi/theme  (token types, defaults; new fontFamily.heading, fontWeight, lineHeight)
       ↑
@soribashi/factory  (factory/defineComponent + new InlineStyles, useRandomClassName, hashStyleProps)
       ↑
@soribashi/blocks  (Box + 13 blocks, all adapted from Mantine)
       ↑
@soribashi/core  (re-exports as before)
```

No circular dependencies. The new factory utilities (`InlineStyles`, `useRandomClassName`, `hashStyleProps`) live in factory because they're the runtime infrastructure that any future component (not just blocks) might use for responsive style props.

### Box style-prop pipeline

```
User writes: <Box p="md" mt={{ base: 'xs', md: 'lg' }} bg="raised">
                ↓
parseStyleProps reads each prop, looks up its CSS property + token source via STYLE_PROPS_DATA
                ↓
Splits into:
  - inline styles (static values, e.g., padding: var(--spacing-md))
  - responsive styles (per-breakpoint media query values)
                ↓
If responsive styles present:
  - useRandomClassName generates a unique class for this instance
  - <InlineStyles> renders a <style> block with @media queries scoped to that class
                ↓
Box renders:
  - <div className={className} style={inlineStyles}>
  - (with InlineStyles sibling if needed)
```

This is Mantine's exact approach. We adapt the imports and token names; logic copies wholesale.

---

## 6. Testing Strategy

### What gets a new test

Every adapted block gets its existing test updated to cover the new features. Specifically:

- `Box` — every style prop in STYLE_PROPS_DATA (sample): `p`, `mt`, `bg`, `c`, `bdrs`, `fz`, `lh`, `lts`, `opacity`, `ta`. Plus responsive variant: `p={{ base: 'xs', md: 'md' }}` produces an InlineStyles sibling and the right media queries.
- `Stack` / `Group` — gap accepts theme keys AND raw CSS values
- `Group` — `grow={true}` adds `flex-grow: 1` to children; `preventGrowOverflow` computes correct childWidth
- `Flex` — responsive `StyleProp<T>` for all 7 supported props
- `Grid` — `grow`, responsive `Grid.Col span={{ base: 12, md: 6 }}`, `offset`, `order`, container-query mode
- `SimpleGrid` — `cols={{ base: 1, sm: 2, md: 3 }}`, `auto-fill`/`auto-fit` mode
- `Container` — `strategy='grid'` + `<div data-breakout>` child renders correctly
- `Center` — `:where([data-inline])` selector applies inline-flex
- `AspectRatio` — multiple children, image children get object-fit
- `Paper` — withBorder, a11y defaults present in computed styles
- `Text` — `lineClamp={3}`, `inline`, `inherit`, gradient variant (variant='gradient')
- `Title` — `order={1..6}`, `size='h2'`, `lineClamp`, `textWrap='balance'`
- `Space` — uses Box style props (w/h/miw/mih)

### What stays as-is

- All current 28 block tests in `packages/blocks/test/blocks.test.tsx` continue to pass (modified to match the new shapes; existing assertions about default behavior should remain green).
- All 155 framework + theme + codegen tests pass unchanged.
- The playground builds and renders the Theme Lab + Blocks Demo without regressions.

### Key integration test

A new test in `packages/blocks/test/parity.test.tsx` exercises the most complex Mantine features end-to-end:

```tsx
it('Group with grow + preventGrowOverflow computes child width correctly', () => {
  // 3 children with gap='md' (var(--spacing-md))
  // Expected childWidth: calc(33.333% - (var(--spacing-md) - var(--spacing-md) / 3))
  ...
});

it('Flex with responsive gap emits an InlineStyles block with breakpoint media queries', () => {
  // <Flex gap={{ base: 'xs', md: 'md' }}>
  // Expected: a <style> sibling with @media (min-width: ...md...) rule
  ...
});

it('Box with style props maps p/m/bg/etc. to correct CSS variable references', () => {
  // <Box p="md" mt="lg" bg="raised">
  // Expected: style attribute contains padding, margin-top, background with var() references
  ...
});
```

### Performance check

The `<InlineStyles>` machinery generates a `<style>` block per instance with responsive style props. Mantine's `useMantineDeduplicateInlineStyles` flag dedupes identical style blocks across multiple instances. For v1 we adopt the same approach (off by default; opt-in via context flag) — this matches Mantine's posture. Performance regressions in mass-rendered lists (e.g., 1000 `<Group>` instances) should be the same as Mantine's, since we're literally running their code.

---

## 7. Acceptance Criteria

The adaptation is complete when:

1. **Every file in scope (§ 2) has the per-file attribution comment.**
2. **`THIRD-PARTY-LICENSES.md` exists at repo root** with Mantine's full license text.
3. **All 13 blocks render with feature parity** to Mantine — every feature documented in `docs/superpowers/divergences/mantine-master.md` as a "kept divergence" in the layout-blocks section is now closed (and that section in the ledger is rewritten to reflect the new state).
4. **Box style-prop machinery works** — including responsive `StyleProp<T>` syntax — verified by integration test.
5. **Theme has the new tokens** (`fontWeight`, `lineHeight`, `fontFamily.heading`) and codegen emits them as CSS variables.
6. **All existing tests pass** + **new tests for new features pass**. Total tests > 200.
7. **Playground builds and renders** Theme Lab + Blocks Demo without visual regressions in the existing demo content.
8. **`bun run typecheck` clean.**
9. **Updated divergence ledger** marks the layout-block divergences as closed, and lists any new divergences introduced by the adaptation (likely zero, since this pass is faithful).
10. **`git log` shows atomic commits** per logical unit (one for THIRD-PARTY-LICENSES, one for theme tokens, one for Box + style props, one for InlineStyles + helpers, then one per block).

---

## 8. Out-of-Scope Future Work

- Porting Mantine's full Box style-prop responsive machinery is included; porting the broader Mantine `theme` shape (`other`, `respectReducedMotion`, `cursorType`, `focusRing`, etc.) is not. Soribashi's theme stays intentionally smaller.
- Color scheme management (Mantine's `useMantineColorScheme`, `localStorageColorSchemeManager`) — soribashi keeps the consumer-managed approach (toggle `.dark` class).
- Static class name prefix system — soribashi continues to use stable `sb-{Component}-{selector}` names.

---

## 9. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Porting Mantine's parse-style-props machinery introduces bugs | Copy logic verbatim; only change imports + token names. Add unit tests covering each style prop. |
| Token name substitutions miss a CSS reference somewhere | Grep for `--mantine-` in adapted files post-migration; CI lint can enforce no `--mantine-` references in soribashi source. |
| Mantine's `@mixin light`/`@mixin dark` postcss extensions don't have a 1:1 standard CSS equivalent | Replace with `:root` / `.dark` selectors that match the soribashi theme scope. The translation is mechanical. |
| Mantine's blocks expect `Box` to handle `mod` arrays; we need to port that | Port `getBoxMod` verbatim; mod becomes a first-class Box prop. |
| Test breakage from changed component shapes | Adapt existing tests to the new Box-wrapped pattern; some tests will need to look at `style` attributes instead of `data-*` for properties that now flow through Box's style-prop parser. |
| Bundle size grows materially | Acceptable cost — we're shipping more capability. Tree-shaking ensures unused style props don't ship if a consumer only uses `<Stack>`. |
| User-facing API changes for blocks (e.g., Stack.gap was enum, now any token) | This is an intentional API broadening — accepting more inputs, not less. Existing call sites continue to work. |

---

## 10. Hard Rules

1. **No code without attribution.** Every file under the adapted set must have the source-pointer comment at the top.
2. **Token name substitutions must be 100% complete.** No `--mantine-*` references in compiled soribashi output. Grep at end of each block port.
3. **Logic copies verbatim where possible.** When deviating, the file's "Soribashi changes" comment block must enumerate every change (imports, token names, mod handling, factory call, etc.).
4. **No regressions.** All existing tests must pass; new tests must pass; playground must build and render.
5. **No new top-level dependencies.** We re-implement helpers (`getSpacing`, `useRandomClassName`, etc.) in soribashi packages; we do not add `@mantine/core` as a runtime dep.
6. **The local Mantine clone at `/Users/matt/Documents/GitHub/mantine` is the canonical source** for this adaptation. Read files there directly when adapting.
