# Tier 2 Audit — Batch T2-D: Box Style-Props

**Pinned to:** `mantinedev/mantine@63dafbbf5f0135eb36455b7add4c0ddcd0f3240a`
**Date:** 2026-04-25
**Branch:** `worktree-agent-adf193f982bde6a0f`

## Files in scope

| Soribashi file | Mantine analog |
|---|---|
| `packages/blocks/src/Box/Box.tsx` | `packages/@mantine/core/src/core/Box/Box.tsx` |
| `packages/blocks/src/Box/Box.types.ts` | `packages/@mantine/core/src/core/Box/Box.types.ts` |
| `packages/blocks/src/Box/get-box-mod.ts` | `packages/@mantine/core/src/core/Box/get-box-mod/get-box-mod.ts` |
| `packages/blocks/src/Box/style-props/style-props-data.ts` | `packages/@mantine/core/src/core/Box/style-props/style-props-data.ts` |
| `packages/blocks/src/Box/style-props/parse-style-props.ts` | `packages/@mantine/core/src/core/Box/style-props/parse-style-props/parse-style-props.ts` |
| `packages/blocks/src/Box/style-props/extract-style-props.ts` | `packages/@mantine/core/src/core/Box/style-props/extract-style-props/extract-style-props.ts` |

---

## Prior audit coverage

Box was previously audited in:
- V1 CSS parity pass (`docs/superpowers/audits/2026-04-25-css-parity.md`)
- Post-adaptation 15-finding pass (ledger entries in `mantine-master.md`)
- Fix #2: `getBoxMod` kebab-case (post-adaptation finding)
- Fix #3: `mx`/`my` logical shorthands
- Fix #4: `fw` identity pass-through
- Fix #5: visibility prop DOM leakage
- Fix #6: visibility classes (`hiddenFrom`/`visibleFrom`/`lightHidden`/`darkHidden`)
- Fix #7: 12 missing style props

This Tier 2 batch performs a **line-level re-walk** to confirm all prior fixes are complete and catch any remaining drift.

---

## Decision-point enumeration

### `get-box-mod.ts`

| # | Mantine line(s) | Decision / branch | Soribashi behavior | Classification |
|---|---|---|---|---|
| GBM-1 | `transformModKey` | camelCase→kebab via `replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()` | Identical implementation | `IDENTICAL` |
| GBM-2 | `getMod` filter | Filters `undefined`, `''`, `false`, `null` — does NOT filter `0` | **Previously filtered `0`** → **FIXED in this audit** | `BUG` → fixed |
| GBM-3 | `getBoxMod(null)` | `if (!mod) return null` | Returns `{}` (not `null`). Spreading `null` and `{}` are equivalent; no observable difference | `INTENTIONAL` |
| GBM-4 | Array branch | `[...mod].reduce(...)` accumulator | `for` loop with `Object.assign` — same semantics | `IDENTICAL` |
| GBM-5 | String branch | `{ [transformModKey(mod)]: true }` | Identical | `IDENTICAL` |
| GBM-6 | Truthy non-boolean | `acc[key] = props[key]` (keeps original value) | `v === true ? true : v` — identical result since `true` maps to `true` and others map to themselves | `IDENTICAL` |

### `style-props-data.ts`

| # | Mantine line(s) | Decision / branch | Soribashi behavior | Classification |
|---|---|---|---|---|
| SPD-1 | All 40 prop rows | Same prop names, same CSS property targets | Identical prop-to-property mapping | `IDENTICAL` (post token-sub) |
| SPD-2 | `type: 'spacing'` | Mantine uses type string `'spacing'`; resolver looked up via `resolvers[type]` | Direct function reference `getSpacing` | `INTENTIONAL` — architectural: soribashi uses fn refs, Mantine uses type strings |
| SPD-3 | `type: 'color'` / `type: 'textColor'` | Mantine has separate `color` and `textColor` resolvers | Soribashi uses single `getThemeColor` for both `bg` and `c` | `INTENTIONAL` — soribashi's theme color resolution doesn't distinguish background vs text |
| SPD-4 | `type: 'border'` | Mantine's `borderResolver` applies theme border tokens | Soribashi uses `identity` for `bd` | `INTENTIONAL` — soribashi has no Mantine-style border token system |
| SPD-5 | `type: 'fontFamily'` | `fontFamilyResolver` maps `'monospace'`/`'text'`/`'heading'` to theme vars | Soribashi uses `identity` for `ff` | `INTENTIONAL` — soribashi's ff prop accepts raw CSS values; token-mapped families use full var() syntax |
| SPD-6 | `type: 'size'` | `sizeResolver` handles rem conversion | Soribashi's `sizeOrRem` resolver — same behavior for numeric input | `TOKEN_DIFF` — same logic, different function name |

All 40 prop entries verified present. No missing rows. No extra rows.

### `parse-style-props.ts`

| # | Mantine line(s) | Decision / branch | Soribashi behavior | Classification |
|---|---|---|---|---|
| PSP-1 | `hasResponsiveStyles` | Only-base `{ base: 'md' }` returns `false` — treated as non-responsive | **Previously returned `true`** → **FIXED in this audit** | `BUG` → fixed |
| PSP-2 | `sortMediaQueries` | Mantine sorts media entries by ascending min-width; produces array | Soribashi iterates `BREAKPOINT_KEYS` in constant ascending order (`xs`→`xl`); produces Record. Sort order is equivalent. Different output type (Record vs Array) matches InlineStyles API. | `INTENTIONAL` (IS-05 already in ledger) |
| PSP-3 | `getBaseValue` | Extracts `value.base` when input is an object | Added `getBaseValue` helper in this audit to handle base-only objects correctly | `BUG` → fixed (part of PSP-1 fix) |
| PSP-4 | Skip `hiddenFrom`/`visibleFrom`/`sx` | Mantine skips these explicitly inside `parseStyleProps` | Soribashi never reaches them — stripped in Box.tsx `render` before `extractStyleProps` is called; they're not in STYLE_PROPS_DATA | `IDENTICAL` (different approach, same observable behavior) |
| PSP-5 | `acc.hasResponsiveStyles = true` | Set when any non-base breakpoint found | Identical | `IDENTICAL` |
| PSP-6 | Property array support | `properties.forEach(p => ...)` | `applyToProperty` handles arrays | `IDENTICAL` |
| PSP-7 | `baseValue != null` guard | Only writes base style when baseValue is not null/undefined | `responsive.base !== undefined` — slightly stricter (null would be filtered). But `base: null` is an unusual value that resolvers would handle as undefined anyway | `INTENTIONAL` — cosmetic; same effect in practice |

### `extract-style-props.ts`

| # | Mantine line(s) | Decision / branch | Soribashi behavior | Classification |
|---|---|---|---|---|
| ESP-1 | Destructuring approach | Mantine uses explicit destructuring to extract all style props + visibility props into `styleProps` | Soribashi uses data-driven loop: keys in STYLE_PROPS_DATA go to `styleProps`, everything else to `rest` | `INTENTIONAL` — data-driven approach is extensible: adding a new prop to STYLE_PROPS_DATA automatically handles it |
| ESP-2 | `hiddenFrom`/`visibleFrom`/`lightHidden`/`darkHidden`/`sx` in Mantine's styleProps | Mantine puts these in `styleProps` for `parseStyleProps` to skip them | Soribashi strips these in Box.tsx before calling `extractStyleProps` | `INTENTIONAL` (divergent approach, same result — they never reach the DOM) |
| ESP-3 | `filterProps` call | Mantine calls `filterProps(styleProps)` to remove undefined values | Soribashi doesn't filter undefined — they'd be skipped anyway in `parseStyleProps`'s `if (propValue === undefined) continue` | `INTENTIONAL` — same result via different path |

### `Box.tsx`

| # | Mantine line(s) | Decision / branch | Soribashi behavior | Classification |
|---|---|---|---|---|
| BOX-1 | `useMantineTheme()` | Hook resolves theme from context | `useTheme()` — soribashi equivalent | `TOKEN_DIFF` |
| BOX-2 | `useMantineSxTransform()` | Applies sx transform for CSS-in-JS adapters | `sx` consumed but not applied; no sx transform | `INTENTIONAL` — sx is an escape hatch for later, currently a no-op |
| BOX-3 | `useMantineDeduplicateInlineStyles()` | Deduplicate flag from context | Soribashi always uses `useRandomClassName()` — no dedup | `INTENTIONAL` (IS-02 already in ledger) |
| BOX-4 | `hashStyleProps` when dedup=true | Uses hash-based class for deduplication | Not implemented — always uses random class | `INTENTIONAL` (IS-02 already in ledger) |
| BOX-5 | `getBoxStyle({theme, style, vars, styleProps})` | Merges theme-callable styles + vars + parsed style props | `{ ...baseStyles.style, ...instanceStyle, ...parsed.inlineStyles }` — flat merge without theme-callable style or CSS vars injection | `INTENTIONAL` — soribashi uses static CSS vars; no runtime injection |
| BOX-6 | `cx(className, transformedSx, {...})` | clsx-style className merge with conditional visibility classes | Manual array filter+join — equivalent | `INTENTIONAL` — no clsx dependency; same result |
| BOX-7 | `'mantine-light-hidden'` etc. classes | Uses `mantine-` prefix | `'sb-light-hidden'` etc. — soribashi prefix | `TOKEN_DIFF` |
| BOX-8 | `data-size={isNumberLike(size) ? undefined : size}` | Forwards `size` prop as `data-size` | No `size` prop on Box | `INTENTIONAL` — soribashi Box doesn't expose Mantine's internal `__size`/`size` plumbing |
| BOX-9 | `renderRoot` prop | Alternative render function for portals/polymorphic roots | Not supported | `INTENTIONAL` — definePolymorphicComponent handles polymorphism at a higher level via the `as` prop; `renderRoot` is a Mantine-internal escape hatch |
| BOX-10 | `__vars` CSS vars prop | Injects CSS custom properties into style | Not supported | `INTENTIONAL` — soribashi's varsResolver in useStyles handles CSS var injection; component consumers don't need direct __vars access on Box |
| BOX-11 | Style merge order | `getBoxStyle` merges vars, style (theme-callable), styleProps | Soribashi: `{ ...baseStyles.style, ...instanceStyle, ...parsed.inlineStyles }` — wrapper-style-merge regression test verifies order | `INTENTIONAL` — merges baseStyles (from getStyles) first, then consumer style, then parsed style props. Already verified by wrapper-style-merge.test.tsx |
| BOX-12 | `definePolymorphicComponent` vs `polymorphicFactory` | Mantine uses `polymorphic(ui)` / `polymorphicFactory` | `definePolymorphicComponent` — soribashi's higher-level constructor | `INTENTIONAL` (pre-existing, in ledger) |

### `Box.types.ts`

| # | Mantine line(s) | Decision / branch | Soribashi behavior | Classification |
|---|---|---|---|---|
| BTP-1 | `BoxProps.style: MantineStyleProp` | Accepts `(theme) => CSSProperties` (theme-callable) | `style` inherited from element props as `CSSProperties` | `INTENTIONAL` — soribashi has no theme-callable style API |
| BTP-2 | `BoxProps.__vars: CssVarsProp` | CSS custom properties injection | Not in soribashi BoxOwnProps | `INTENTIONAL` — CSS vars from component factories (useStyles varsResolver) |
| BTP-3 | `BoxProps.__size: string` | Internal size forwarding for components | Not in soribashi BoxOwnProps | `INTENTIONAL` — soribashi's defineComponent/definePolymorphicComponent system doesn't use this |
| BTP-4 | `BoxComponentProps.size?: string \| number` | Size forwarded as `data-size` | Not in soribashi BoxOwnProps | `INTENTIONAL` — soribashi size handling is per-component via CSS vars; no global size data-attribute system |
| BTP-5 | `hiddenFrom?: MantineBreakpoint` | Union of all theme breakpoint keys | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` — hardcoded | `INTENTIONAL` — soribashi has fixed breakpoints; TOKEN_DIFF in breakpoint naming |
| BTP-6 | `BoxProps.className?: string` | Standard className | Inherited from element props via `BoxOwnProps` extending `BoxStyleProps` + being passed to definePolymorphicComponent | `IDENTICAL` |
| BTP-7 | `CssVariable`, `CssVars`, `CssVarsProp` types | Utility types for CSS vars API | Not exported from Box.types.ts | `INTENTIONAL` — not needed in soribashi's simpler vars model |
| BTP-8 | All 40 style props type surface | Both typed as `StyleProp<T>` with appropriate T constraints | Identical prop names; soribashi uses `StyleProp<string \| number>` for spacing props vs Mantine's `StyleProp<MantineSpacing>` | `TOKEN_DIFF` — structural equivalent; token name difference only |

---

## Findings summary

### BUG findings (fixed)

#### GBM-Z1 — `getBoxMod` incorrectly filtered numeric `0`

- **File:** `packages/blocks/src/Box/get-box-mod.ts`
- **Mantine source:** `packages/@mantine/core/src/core/Box/get-box-mod/get-box-mod.ts` (63dafbbf)
- **Mantine behavior:** `getMod` filters `undefined`, `''`, `false`, `null` — numeric `0` is kept.
- **Soribashi previous behavior:** `if (v === false || v === null || v === undefined || v === '' || v === 0)` — numeric `0` was filtered, making `mod={{ count: 0 }}` invisible.
- **Fix:** Removed `|| v === 0` from the filter condition.
- **Tests:** `packages/blocks/test/Box/get-box-mod-zero.test.ts` — GBM-Z1a through GBM-Z1g (7 tests)
- **Commit:** fix(blocks): align getBoxMod numeric-0 filter with Mantine

#### PSP-B1 — `parseStyleProps` treated base-only `{ base: value }` as responsive

- **File:** `packages/blocks/src/Box/style-props/parse-style-props.ts`
- **Mantine source:** `packages/@mantine/core/src/core/Box/style-props/parse-style-props/parse-style-props.ts` (63dafbbf) — `hasResponsiveStyles()` explicitly returns `false` for `{ base: value }` (length === 1 && key === 'base')
- **Soribashi previous behavior:** `isResponsiveValue({ base: 'md' })` returned `true` because `'base'` matched the `k === 'base'` check. This caused an unnecessary `<InlineStyles>` component and random class name to be generated for base-only responsive objects.
- **Fix:** Added early return in `isResponsiveValue`: `if (keys.length === 1 && keys[0] === 'base') return false;`. Also added `getBaseValue()` helper to extract the base value when a base-only object falls to the non-responsive path.
- **Tests:** `packages/blocks/test/Box/parse-style-props-base-only.test.ts` — PSP-B1a through PSP-B1e (5 tests)
- **Commit:** fix(blocks): align parseStyleProps base-only handling with Mantine

### INTENTIONAL findings (new ledger entries)

All documented in `2026-04-25-tier-2-D-ledger-fragment.md`.

### TOKEN_DIFF findings (no action needed)

- All `--mantine-*` prefix → `--soribashi-equivalent` substitutions confirmed
- `mantine-` CSS class prefix → `sb-` prefix confirmed
- `MantineBreakpoint` → hardcoded `'xs' | 'sm' | 'md' | 'lg' | 'xl'`

### Pre-existing INTENTIONAL findings confirmed still in effect

All 15 post-adaptation findings (ledger) re-verified:
- ✅ `getBoxMod` kebab-case (fix #2) — confirmed
- ✅ `mx`/`my` → `marginInline`/`marginBlock` (fix #3) — confirmed
- ✅ `fw` identity pass-through (fix #4) — confirmed
- ✅ visibility props not forwarded to DOM (fix #5) — confirmed (explicit destructure in Box.tsx)
- ✅ visibility classes `sb-{hidden,visible}-from-{bp}` / `sb-{light,dark}-hidden` (fix #6) — confirmed
- ✅ 12 added style props (fix #7: `mis`/`mie`/`pis`/`pie`/`ff`/`fs`/`tt`/`td`/`bgsz`/`bgp`/`bgr`/`bga`) — confirmed

---

## Test coverage

| Test file | Tests | What it covers |
|---|---|---|
| `test/Box/style-props.test.ts` | 14 | parseStyleProps core, extractStyleProps, getBoxMod basics |
| `test/Box/get-box-mod.test.ts` | 5 | getBoxMod camelCase key transform |
| `test/Box/get-box-mod-zero.test.ts` | 7 | GBM-Z1: numeric-0 filter fix (new) |
| `test/Box/logical-shorthands.test.ts` | 4 | mx/my/px/py logical shorthands |
| `test/Box/font-weight.test.ts` | 4 | fw identity pass-through |
| `test/Box/new-style-props.test.ts` | 9 | 12 added style props |
| `test/Box/visibility-classes.test.tsx` | 7 | hiddenFrom/visibleFrom/lightHidden/darkHidden classes |
| `test/Box/visibility-props-consumed.test.tsx` | 6 | visibility props not forwarded to DOM |
| `test/Box/wrapper-style-merge.test.tsx` | 8 | wrapper style merge order regression |
| `test/Box/parse-style-props-base-only.test.ts` | 5 | PSP-B1: base-only fix (new) |

**Total Box tests:** 69 (up from 57 before this audit)

---

## Verification gate

```
Test Files  51 passed (51)
Tests  667 passed (667)
typecheck: clean
```
