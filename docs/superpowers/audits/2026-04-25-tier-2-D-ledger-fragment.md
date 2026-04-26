# Tier 2 Batch T2-D — Ledger Fragment

**For:** `docs/superpowers/divergences/mantine-master.md` → "Full audit pass — 2026-04-25"
**Batch:** T2-D (Box style-props)
**Date:** 2026-04-25
**Mantine commit:** `63dafbbf5f0135eb36455b7add4c0ddcd0f3240a`

---

## Aligned (fixed in this audit)

### `getBoxMod` — numeric `0` filter (GBM-Z1) → Aligned

- **File:** `packages/blocks/src/Box/get-box-mod.ts`
- **Mantine source:** `packages/@mantine/core/src/core/Box/get-box-mod/get-box-mod.ts` (commit 63dafbbf)
- **Mantine behavior:** `getMod` filters: `undefined | '' | false | null`. Does NOT filter numeric `0`. `mod={{ count: 0 }}` produces `{ 'data-count': 0 }`.
- **Soribashi previous behavior:** Also filtered `v === 0`, silently dropping `mod={{ count: 0 }}` entries.
- **Fix:** Removed `|| v === 0` from the filter guard.
- **Classification:** `BUG` → aligned
- **Disposition:** Aligned
- **Test:** `packages/blocks/test/Box/get-box-mod-zero.test.ts` — GBM-Z1a through GBM-Z1g

### `parseStyleProps` — base-only `{ base: value }` treated as non-responsive (PSP-B1) → Aligned

- **File:** `packages/blocks/src/Box/style-props/parse-style-props.ts`
- **Mantine source:** `packages/@mantine/core/src/core/Box/style-props/parse-style-props/parse-style-props.ts` (commit 63dafbbf)
- **Mantine behavior:** `hasResponsiveStyles(styleProp)` returns `false` when the style prop object has exactly one key and that key is `'base'`. The value is resolved as a flat inline style.
- **Soribashi previous behavior:** `isResponsiveValue({ base: 'md' })` returned `true` because the `k === 'base'` check triggered. This caused an unnecessary `<InlineStyles>` tag and random class name to be generated even when no actual breakpoint-based styles were needed.
- **Fix:** Added early return in `isResponsiveValue`: `if (keys.length === 1 && keys[0] === 'base') return false`. Added `getBaseValue()` helper to extract the base value for the non-responsive path.
- **Classification:** `BUG` → aligned
- **Disposition:** Aligned
- **Test:** `packages/blocks/test/Box/parse-style-props-base-only.test.ts` — PSP-B1a through PSP-B1e

---

## Kept (deliberate divergences confirmed in this audit)

### `getBoxMod` — returns `{}` vs Mantine's `null` for falsy input

- **File:** `packages/blocks/src/Box/get-box-mod.ts`
- **Mantine source:** `packages/@mantine/core/src/core/Box/get-box-mod/get-box-mod.ts` (commit 63dafbbf)
- **Mantine behavior:** `getBoxMod(!mod)` returns `null` (spread as `{...null}` → `{}`).
- **Soribashi behavior:** Returns `{}` directly.
- **Reason:** Cosmetically different; functionally identical (spreading `null` and `{}` are equivalent). Soribashi's `{}` is marginally clearer.
- **Disposition:** Keep as-is.

### `style-props-data.ts` — function references vs type strings

- **File:** `packages/blocks/src/Box/style-props/style-props-data.ts`
- **Mantine source:** `packages/@mantine/core/src/core/Box/style-props/style-props-data.ts` (commit 63dafbbf)
- **Mantine behavior:** Each entry has `type: 'spacing' | 'color' | ...` (a string key); resolvers are looked up from a `resolvers` map at call time.
- **Soribashi behavior:** Each entry has `resolver: getSpacing | getThemeColor | ...` (a direct function reference); no indirection.
- **Reason:** Soribashi's approach avoids the resolver registry indirection, is more tree-shakeable, and aligns with TypeScript's preference for explicit imports. Observable behavior is identical.
- **Disposition:** Keep soribashi's direct function references.

### `style-props-data.ts` — `bd` uses `identity` resolver vs Mantine's `borderResolver`

- **File:** `packages/blocks/src/Box/style-props/style-props-data.ts`
- **Mantine source:** `packages/@mantine/core/src/core/Box/style-props/resolvers/border-resolver/border-resolver.ts` (commit 63dafbbf)
- **Mantine behavior:** `bd` uses `borderResolver` which understands Mantine's color token syntax for border colors (e.g., `'1px solid red.6'`).
- **Soribashi behavior:** `bd` uses `identity` — accepts raw CSS border values as-is.
- **Reason:** Soribashi has no Mantine-style color index system. Consumers write full CSS values or use `var(--color-...)` syntax explicitly.
- **Disposition:** Keep soribashi's identity resolver for `bd`.

### `style-props-data.ts` — `ff` uses `identity` vs Mantine's `fontFamilyResolver`

- **File:** `packages/blocks/src/Box/style-props/style-props-data.ts`
- **Mantine source:** `packages/@mantine/core/src/core/Box/style-props/resolvers/font-family-resolver/font-family-resolver.ts` (commit 63dafbbf)
- **Mantine behavior:** `fontFamilyResolver` maps `'monospace'` → `var(--mantine-font-family-monospace)`, `'text'` → `var(--mantine-font-family)`, `'heading'` → `var(--mantine-font-family-headings)`.
- **Soribashi behavior:** `ff` uses `identity` — accepts raw CSS values. Consumers write `var(--font-family-mono)` or `var(--font-family-sans)` explicitly.
- **Reason:** Soribashi's `ff` token shortcuts (`'mono'`, `'heading'`, `'sans'`) were not implemented as resolver magic because the API would require updating the resolver when new font families are added. Explicit `var()` references are more transparent.
- **Disposition:** Keep soribashi's identity resolver for `ff`. This is a candidate (e) "missing port" for a future enhancement: add a `fontFamilyResolver` that maps soribashi token names.

### `parse-style-props.ts` — `media` output type: `Record` vs sorted `Array`

- **File:** `packages/blocks/src/Box/style-props/parse-style-props.ts`
- **Mantine source:** `packages/@mantine/core/src/core/Box/style-props/parse-style-props/sort-media-queries.ts` (commit 63dafbbf)
- **Mantine behavior:** `parseStyleProps` calls `sortMediaQueries` which converts the media `Record` to a sorted `Array<{ query, styles }>` in ascending min-width order. Mantine's `InlineStyles` expects an array.
- **Soribashi behavior:** `parseStyleProps` outputs `media: Record<string, Record<string, string>>`. Breakpoints are added in BREAKPOINT_KEYS order (`xs`→`xl`), which is already ascending. Soribashi's `InlineStyles` accepts a `Record`. Sort is implicitly correct by insertion order.
- **Reason:** IS-05 (already in ledger) — soribashi's `InlineStyles` uses a Record API, which is more ergonomic for the box's call sites. The effective CSS output order is the same.
- **Disposition:** Keep soribashi's Record approach (matches IS-05 ledger entry).

### `extract-style-props.ts` — data-driven loop vs explicit destructuring

- **File:** `packages/blocks/src/Box/style-props/extract-style-props.ts`
- **Mantine source:** `packages/@mantine/core/src/core/Box/style-props/extract-style-props/extract-style-props.ts` (commit 63dafbbf)
- **Mantine behavior:** Explicit destructuring enumerates every known style prop key + visibility props. Result is passed through `filterProps` to remove undefined.
- **Soribashi behavior:** Data-driven loop over `STYLE_PROPS_DATA` keys. Visibility props (`hiddenFrom`/`visibleFrom`/`lightHidden`/`darkHidden`/`sx`) are not in the data table, so they always land in `rest`. They're also stripped before `extractStyleProps` is called in Box.tsx.
- **Reason:** Soribashi's approach is extensible — adding a new prop to STYLE_PROPS_DATA automatically handles it in `extractStyleProps`. Mantine's approach requires updating the destructuring in two places (STYLE_PROPS_DATA and extract-style-props).
- **Disposition:** Keep soribashi's data-driven approach.

### `Box.tsx` — `sx` prop consumed but not applied

- **File:** `packages/blocks/src/Box/Box.tsx`
- **Mantine source:** `packages/@mantine/core/src/core/Box/Box.tsx` (commit 63dafbbf) — `useMantineSxTransform()(styleProps.sx)` applies sx CSS-in-JS object
- **Mantine behavior:** Applies sx via a configurable sx transform, result merged into className.
- **Soribashi behavior:** `sx` is destructured and discarded (`sx: _sx`). The prop exists in BoxOwnProps to prevent DOM leakage.
- **Reason:** Soribashi uses static CSS classes + inline style vars; no runtime CSS-in-JS. `sx` is preserved as an escape hatch type for later integration.
- **Disposition:** Keep as-is. (Pre-existing intentional divergence, fix #5 in post-adaptation pass.)

### `Box.tsx` — no `renderRoot` prop

- **File:** `packages/blocks/src/Box/Box.tsx`
- **Mantine source:** `packages/@mantine/core/src/core/Box/Box.tsx` (commit 63dafbbf) — `renderRoot` renders via a provided function instead of an element
- **Mantine behavior:** When `renderRoot` is a function, calls it with the merged props instead of rendering `<Element>`.
- **Soribashi behavior:** No `renderRoot` prop. Polymorphism is handled at the `as` prop level via `definePolymorphicComponent`.
- **Reason:** Soribashi's polymorphic factory provides equivalent capability via the `as` prop and the `render` callback. `renderRoot` is an escape hatch for exotic portal-style patterns not yet encountered in soribashi's usage.
- **Disposition:** Keep as-is.

### `Box.tsx` — no `__vars`, `__size`, `size` props

- **File:** `packages/blocks/src/Box/Box.tsx`
- **Mantine source:** `packages/@mantine/core/src/core/Box/Box.tsx` (commit 63dafbbf)
- **Mantine behavior:** `__vars` injects CSS custom properties; `__size` sets the `size` HTML attribute; `size` sets `data-size` (when not number-like).
- **Soribashi behavior:** None of these props are present on soribashi's Box.
- **Reason:** `__vars` → soribashi's `varsResolver` in `useStyles` handles CSS var injection; `__size`/`size` → Mantine-internal plumbing for component variants; no equivalent system in soribashi.
- **Disposition:** Keep as-is.

### `Box.types.ts` — soribashi-only props (`sx`, `lightHidden`, `darkHidden`)

- **File:** `packages/blocks/src/Box/Box.types.ts`
- **Mantine source:** `packages/@mantine/core/src/core/Box/Box.tsx` (commit 63dafbbf) — `lightHidden`/`darkHidden` are in Mantine's `BoxProps`; `sx` is in Mantine's `BoxProps` via the extract-style-props destructuring.
- **Mantine behavior:** Both present in BoxProps.
- **Soribashi behavior:** Both present in BoxOwnProps. No divergence for `lightHidden`/`darkHidden`/`sx`. The `sx` type in soribashi is `Record<string, unknown>` vs Mantine's implicit `any` type — intentionally typed to prevent escape hatch abuse.
- **Disposition:** Keep soribashi's explicit `sx: Record<string, unknown>` typing.

---

## (e) Missing-port candidates

| Mantine feature | Description | Soribashi value | Effort |
|---|---|---|---|
| `fontFamilyResolver` in style-props | Maps `'mono'`/`'heading'`/`'sans'` to soribashi's CSS var names for the `ff` prop | Ergonomic: `ff="mono"` instead of `ff="var(--font-family-mono)"` | S |
| `borderResolver` in style-props | Understands soribashi color token syntax in `bd` values | Ergonomic: `bd="1px solid primary.300"` | M |
| `sortMediaQueries` as standalone export | Sorts a Record of breakpoint queries into ascending order | Useful for any consumer building a custom responsive prop system | S |
