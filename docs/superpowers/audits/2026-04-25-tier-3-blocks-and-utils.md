# Tier 3 Audit — Blocks and Utilities

**Pinned to:** `mantinedev/mantine@63dafbbf5f0135eb36455b7add4c0ddcd0f3240a`

**Audit date:** 2026-04-25

**Auditor task:** Task 3.1 — confirmatory fast pass; deep CSS/browser work done by prior V1/V4 audits.

---

## Coverage statement

This Tier 3 audit relies on prior validation evidence:

- **CSS structural parity for all 14 blocks:** `docs/superpowers/audits/2026-04-25-css-parity.md` (V1 audit)
  - Script re-run confirmed: 28 IDENTICAL / 1 TOKEN_DIFF / 0 SELECTOR_DIFF / 5 DECL_DIFF (all allowlisted) / 5 MISSING (all allowlisted) / 5 EXTRA (all allowlisted)
- **Browser computed-style parity for all 14 blocks:** `tests/browser-parity/blocks-computed-styles.spec.ts` (V4 audit, 46 passing — re-confirmed this pass)
- **Block-wrapper style-merge regression:** `packages/blocks/test/Box/wrapper-style-merge.test.tsx` (8 passing — re-confirmed this pass)
- **Utils parity:** `packages/blocks/test/utils.test.ts` (passing)
- **Grid math:** `packages/blocks/test/Grid-math.test.tsx` (passing)

---

## Tool re-runs

### V1 CSS parity script

```
bunx tsx packages/blocks/scripts/css-parity-audit.ts
```

Output (matches prior known-good):
```
✓ Box          IDENTICAL: 0 / TOKEN_DIFF: 0 / SELECTOR_DIFF: 0 / DECL_DIFF: 0 / MISSING: 0 / EXTRA: 1
✓ Stack        IDENTICAL: 1 / TOKEN_DIFF: 0 / SELECTOR_DIFF: 0 / DECL_DIFF: 0 / MISSING: 0 / EXTRA: 0
✓ Group        IDENTICAL: 2 / TOKEN_DIFF: 0 / SELECTOR_DIFF: 0 / DECL_DIFF: 0 / MISSING: 0 / EXTRA: 0
⚠ Flex         IDENTICAL: 0 / TOKEN_DIFF: 0 / SELECTOR_DIFF: 0 / DECL_DIFF: 1 / MISSING: 0 / EXTRA: 0
⚠ Grid         IDENTICAL: 3 / TOKEN_DIFF: 0 / SELECTOR_DIFF: 0 / DECL_DIFF: 0 / MISSING: 1 / EXTRA: 0
✓ GridCol      IDENTICAL: 1 / TOKEN_DIFF: 0 / SELECTOR_DIFF: 0 / DECL_DIFF: 0 / MISSING: 0 / EXTRA: 0
⚠ SimpleGrid   IDENTICAL: 0 / TOKEN_DIFF: 0 / SELECTOR_DIFF: 0 / DECL_DIFF: 1 / MISSING: 3 / EXTRA: 2
⚠ Container    IDENTICAL: 6 / TOKEN_DIFF: 0 / SELECTOR_DIFF: 0 / DECL_DIFF: 0 / MISSING: 1 / EXTRA: 1
✓ Center       IDENTICAL: 2 / TOKEN_DIFF: 0 / SELECTOR_DIFF: 0 / DECL_DIFF: 0 / MISSING: 0 / EXTRA: 0
✓ AspectRatio  IDENTICAL: 3 / TOKEN_DIFF: 0 / SELECTOR_DIFF: 0 / DECL_DIFF: 0 / MISSING: 0 / EXTRA: 0
✓ Space        IDENTICAL: 0 / TOKEN_DIFF: 0 / SELECTOR_DIFF: 0 / DECL_DIFF: 0 / MISSING: 0 / EXTRA: 1
⚠ Paper        IDENTICAL: 2 / TOKEN_DIFF: 1 / SELECTOR_DIFF: 0 / DECL_DIFF: 1 / MISSING: 0 / EXTRA: 0
⚠ Text         IDENTICAL: 7 / TOKEN_DIFF: 0 / SELECTOR_DIFF: 0 / DECL_DIFF: 1 / MISSING: 0 / EXTRA: 0
⚠ Title        IDENTICAL: 1 / TOKEN_DIFF: 0 / SELECTOR_DIFF: 0 / DECL_DIFF: 1 / MISSING: 0 / EXTRA: 0

Total: IDENTICAL: 28 / TOKEN_DIFF: 1 / DECL_DIFF: 5 / MISSING: 5 / EXTRA: 5
```

All warnings are in the CSS parity allowlist (`packages/blocks/test/css-parity-allowlist.ts`). No new findings.

### V4 browser-parity tests

```
bun run test:browser
```

Result: **46 passed** (matches expected count).

### Wrapper-style-merge regression test

```
bunx vitest run packages/blocks/test/Box/wrapper-style-merge.test.tsx
```

Result: **8 passed**.

---

## Walk-through findings

### Blocks (.tsx files)

| File | Mantine analog | Drift found in this pass | Classification |
|---|---|---|---|
| `Box/Box.tsx` | `core/Box/Box.tsx` | Covered by Batch T2-D | — (see 2026-04-25-tier-2-box-style-props.md) |
| `Stack/Stack.tsx` | `components/Stack/Stack.tsx` | None. Props: gap/align/justify match. Defaults: gap='md', align='stretch', justify='flex-start' match. Var names TOKEN_DIFF (--stack-gap, --stack-align, --stack-justify identical). | `matches` |
| `Group/Group.tsx` | `components/Group/Group.tsx` | None. Props/defaults/childWidth math/filterFalsyChildren match. mod=[{grow}] pattern equivalent. preventGrowOverflow default `true` matches. | `matches` |
| `Flex/Flex.tsx` | `components/Flex/Flex.tsx` | None. Flat-value gap/align/justify/wrap/direction vs Mantine's `StyleProp<T>` responsive is a pre-existing INTENTIONAL divergence documented in the file header. No new drift. | `matches` (responsive deferred — INTENTIONAL) |
| `Grid/Grid.tsx` (GridRoot) | `components/Grid/Grid.tsx` | None. Flat-value gap/columns/grow vs Mantine's responsive StyleProp + container-query `type` — INTENTIONAL v1 scope. Var names TOKEN_DIFF (e.g. --grid-columns = soribashi addition). Grid.Col rendered inline in same file (vs Mantine's separate GridCol/ directory). | `matches` (intentional divergences pre-documented) |
| `Grid/Grid.tsx` (GridCol) | `components/Grid/GridCol/GridCol.tsx` | None. Context-injected CSS vars for flex-basis/grow/max-width/offset match Mantine's math. `align` prop maps to `align-self` (Mantine parity). vars() runs outside React tree — handled by injecting inline styles in render, noted in code comment. | `matches` |
| `SimpleGrid/SimpleGrid.tsx` | `components/SimpleGrid/SimpleGrid.tsx` | None. flat-value cols/spacing + autoFlow/minColWidth/autoRows additions vs Mantine's responsive StyleProp — INTENTIONAL v1 scope. CSS vars TOKEN_DIFF (--sg-* vs Mantine's inline). | `matches` (intentional divergences pre-documented) |
| `Container/Container.tsx` | `components/Container/Container.tsx` | None. size/fluid/strategy props. TOKEN_DIFF: --container-size vs Mantine's --container-X. `strategy` prop is soribashi addition (block/grid layout strategy). | `matches` (strategy prop = soribashi addition) |
| `Center/Center.tsx` | `components/Center/Center.tsx` | None. inline prop, mod={inline}, matches Mantine's approach exactly. | `matches` |
| `AspectRatio/AspectRatio.tsx` | `components/AspectRatio/AspectRatio.tsx` | None. ratio prop, --ar-ratio var, child aspect-ratio via CSS rule (not wrapper). INTENTIONAL per file header. | `matches` (child-target approach = intentional) |
| `Space/Space.tsx` | `components/Space/Space.tsx` | None. Space delegates w/h/miw/mih to Box style props. Mantine does the same. miw defaults to w and mih to h — soribashi addition. | `matches` |
| `Paper/Paper.tsx` | `components/Paper/Paper.tsx` | None. shadow/radius/withBorder props match. TOKEN_DIFF: --paper-radius/--paper-shadow vs Mantine's --paper-radius/--paper-shadow (names happen to be identical; no --mantine- prefix differences at paper level). DECL_DIFF in CSS (allowlisted). | `matches` |
| `Text/Text.tsx` | `components/Text/Text.tsx` | None. Props: size/lineClamp/truncate/inline/inherit/variant/gradient/span. Defaults: inherit=false. Var names match. `getTextTruncate` logic matches Mantine. `buildGradient` helper is soribashi (Mantine delegates to `getGradient(gradient, theme)`; soribashi builds inline without theme). TOKEN_DIFF: uses --text-fz/--text-lh/--text-gradient/--text-line-clamp (same names as Mantine). | `matches` (buildGradient = soribashi addition, no theme lookup) |
| `Title/Title.tsx` | `components/Title/Title.tsx` | None. order/size/lineClamp/textWrap props match. Renders as `h{order}` via Box. Invalid order guard (returns null) matches Mantine. Var names match. | `matches` |

### Utilities

| File | Mantine analog | Drift found in this pass | Classification |
|---|---|---|---|
| `utils/rem.ts` | `core/utils/units-converters/rem.ts` | None beyond pre-existing intentional differences (no scale support, px-string parsing). Covered by post-adaptation Batch C + findings #10 #11. | `matches` (intentional divergences pre-documented) |
| `utils/get-size.ts` | `core/utils/get-size/get-size.ts` | None. `isRawCss` heuristic mirrors Mantine's `isNumberLike`. TOKEN_DIFF: `--${prefix}-` vs `--mantine-${prefix}-`. Open-ended (post-finding #10 fix). | `matches` |
| `utils/get-spacing.ts` | `core/utils/get-size/getSpacing` | None. Delegates to `getSize(v, 'spacing')`. TOKEN_DIFF: `--spacing-*` vs `--mantine-spacing-*`. | `matches` |
| `utils/get-radius.ts` | `core/utils/get-size/getRadius` | None. undefined → `var(--radius-md)` matches Mantine's `var(--mantine-radius-default)` (TOKEN_DIFF). Open-ended token resolution. | `matches` |
| `utils/get-font-size.ts` | `core/utils/get-size/getFontSize` | None. Delegates to `getSize(v, 'font-size')`. TOKEN_DIFF: `--font-size-*` vs `--mantine-font-size-*`. | `matches` |
| `utils/get-line-height.ts` | `core/utils/get-size/getLineHeight` | Soribashi uses KNOWN_KEYS set {xs/sm/md/lg/xl} vs Mantine's open `isNumberLike` heuristic. Numbers return as string (no rem conversion — matches Mantine's `convertToRem=false`). Known keys → `var(--line-height-{key})`. Non-known string keys pass through verbatim. This means custom line-height token names outside xs/sm/md/lg/xl would not resolve to CSS vars (limitation). | `INTENTIONAL` — soribashi design only defines xs/sm/md/lg/xl line-height tokens; open keys not needed |
| `utils/get-shadow.ts` | `core/utils/get-size/getShadow` | Soribashi uses KNOWN_KEYS set {sm/md/lg/xl} vs Mantine's `getSize(size, 'mantine-shadow', false)`. Known keys → `var(--shadow-{key})`; others pass through. Limitation: custom shadow token names outside sm/md/lg/xl would not resolve. | `INTENTIONAL` — soribashi design only defines sm/md/lg/xl shadow tokens |
| `utils/get-theme-color.ts` | `core/MantineProvider/color-functions/parse-theme-color/parse-theme-color.ts` | Soribashi uses dot-path pattern (family.shade or namespace.name) and returns a CSS string directly. Mantine returns an object with parsed color info. This is an INTENTIONAL architectural divergence documented in the file header. | `INTENTIONAL` (pre-existing, documented) |

### Grid math helpers

| File | Mantine analog | Classification |
|---|---|---|
| `Grid/get-column-flex-basis.ts` | `GridCol/GridColVariables.tsx` (inline `getColumnFlexBasis`) | `matches` — logic is line-for-line identical to Mantine's inline function |
| `Grid/get-column-flex-grow.ts` | `GridCol/GridColVariables.tsx` (inline `getColumnFlexGrow`) | `matches` — logic is line-for-line identical |
| `Grid/get-column-max-width.ts` | `GridCol/GridColVariables.tsx` (inline `getColumnMaxWidth`) | `matches` — logic is line-for-line identical; delegates to getColumnFlexBasis |
| `Grid/get-column-offset.ts` | `GridCol/GridColVariables.tsx` (inline `getColumnOffset`) | `matches` — logic is line-for-line identical |
| `Grid/Grid.context.ts` | `Grid/Grid.context.ts` | `INTENTIONAL` — soribashi context has only {columns, grow}; Mantine adds {getStyles, breakpoints, type} (responsive/container-query infrastructure not in v1 scope). Uses React.createContext (soribashi addition — no `createSafeContext`). |

### Group utility

| File | Mantine analog | Classification |
|---|---|---|
| `Group/filter-falsy-children.ts` | `Group/filter-falsy-children/filter-falsy-children.ts` | `matches` — same logic; soribashi has explicit `ReactNode[]` return type vs Mantine's `ReactElement[]` cast (functionally identical) |

### Title utility

| File | Mantine analog | Classification |
|---|---|---|
| `Title/get-title-size.ts` | `Title/get-title-size.ts` | `INTENTIONAL` — TOKEN_DIFF: `--heading-h{N}-*` vs `--mantine-h{N}-*`; soribashi adds 2xl/3xl font-size key support beyond Mantine's xs/sm/md/lg/xl |

### `@soribashi/core` barrel

`packages/core/src/index.ts` re-exports:

| Export group | Source package | Re-exports |
|---|---|---|
| Authoring API | `@soribashi/factory` | `defineComponent`, `defineGenericComponent`, `definePolymorphicComponent`, `cn`, types `StylesApiProps`, `PolymorphicProps`, `PolymorphicRef` |
| Theme | `@soribashi/theme` | `createTheme`, `defaultIntentResolver`, `defaultTokens`, `defaultDarkTokens`, types `ResolvedTheme`, `ThemeDefinition`, `IntentResolver` |
| Provider | `@soribashi/factory` | `SoribashiProvider`, `useTheme` |
| Layout blocks | `@soribashi/blocks` | `Box`, `Flex`, `Stack`, `Group`, `Grid`, `SimpleGrid`, `Container`, `Center`, `AspectRatio`, `Space`, `Paper`, `Text`, `Title` |

All 13 layout blocks (excluding Box-as-primitive) are re-exported. Box is exported from `@soribashi/blocks` and included. Re-export surface is complete and intentional.

---

## Findings requiring fixes

**None.** No `BUG`, `HALLUCINATION`, `INCONSISTENCY`, or `HOOK_REIMPL` findings discovered in this pass.

All differences are either:
- Pre-existing INTENTIONAL divergences documented in the file headers and/or the master ledger
- TOKEN_DIFF items (token prefix substitution per the adaptation spec)
- Soribashi additions (soribashi-only features like `strategy` in Container, `2xl`/`3xl` in getTitleSize)

---

## Verification gate results

| Check | Result |
|---|---|
| `bunx tsx packages/blocks/scripts/css-parity-audit.ts` | Matches prior known-good output; all DECL_DIFF/MISSING in allowlist |
| `bun run test:browser` | 46 passed |
| `bunx vitest run packages/blocks/test/Box/wrapper-style-merge.test.tsx` | 8 passed |
| `bunx vitest run` (full suite) | 739 passed |
| `bun run typecheck` | Clean |
| `bun run --filter @soribashi/playground build` | Clean |
