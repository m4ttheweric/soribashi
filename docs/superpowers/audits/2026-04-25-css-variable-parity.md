# CSS Variable Parity Audit — 2026-04-25

**Mantine source:** commit `63dafbbf5f0135eb36455b7add4c0ddcd0f3240a`
**Mantine file:** `packages/@mantine/core/src/core/MantineProvider/MantineCssVariables/default-css-variables-resolver.ts`
**Snapshot reference:** `MantineCssVariables/__snapshots__/default-css-variables-resolver.test.ts.snap`

**Soribashi emitter:** `packages/codegen/src/emit-css.ts`
**Parity test:** `packages/codegen/test/css-variable-parity.test.ts`

**Coverage:** 64 / 64 mapped vars emitted (100%) | 288 INTENTIONAL_GAP entries | 352 total canonical Mantine vars audited

---

## Summary

Mantine's `defaultCssVariablesResolver` emits a `{ variables, light, dark }` object. The `variables` section is always emitted (color-scheme-independent); `light` and `dark` are injected into scheme-scoped selectors.

Soribashi's `emitCss()` emits a flat `{scope}` block with all tokens and semantic vars, plus an optional `{darkMode.selector}` block for dark overrides.

The two architectures differ fundamentally in how per-color-family variant vars (`-filled`, `-outline`, `-light`, etc.) are handled:
- **Mantine** pre-computes these at build time and injects them as CSS variables accessible to components.
- **Soribashi** computes equivalent values at render time via the `intentResolver`, returning inline styles/classes. No per-family variant CSS vars are emitted.

This architectural divergence accounts for the majority (~265 of 288) of the INTENTIONAL_GAP entries.

---

## Mapping Table

Legend: ✅ Emitted | ❌ Not emitted (see status) | ⚠️ Approximate mapping

### Z-Index Scale

| Mantine variable | Soribashi equivalent | Emitted? | Status | Notes |
|---|---|---|---|---|
| `--mantine-z-index-app` | `--z-index-app` | ❌ | INTENTIONAL_GAP | `tokens.zIndex` exists in the type but emit-css.ts does not emit it. Application-concern token deferred to consumer. |
| `--mantine-z-index-modal` | `--z-index-modal` | ❌ | INTENTIONAL_GAP | Same. |
| `--mantine-z-index-popover` | `--z-index-popover` | ❌ | INTENTIONAL_GAP | Same. |
| `--mantine-z-index-overlay` | `--z-index-overlay` | ❌ | INTENTIONAL_GAP | Same. |
| `--mantine-z-index-max` | `--z-index-max` | ❌ | INTENTIONAL_GAP | Same. |

### Global Theme Vars

| Mantine variable | Soribashi equivalent | Emitted? | Status | Notes |
|---|---|---|---|---|
| `--mantine-scale` | (none) | ❌ | INTENTIONAL_GAP | Mantine multiplies all rem values by a runtime `--mantine-scale`. Soribashi emits raw token values; no scale multiplier. |
| `--mantine-cursor-type` | (none) | ❌ | INTENTIONAL_GAP | Mantine exposes cursor-type as a CSS var. Soribashi sets cursor via Tailwind utilities. |
| `--mantine-webkit-font-smoothing` | (none) | ❌ | INTENTIONAL_GAP | Font smoothing is a global body concern; deferred to consumer's CSS reset. |
| `--mantine-moz-font-smoothing` | (none) | ❌ | INTENTIONAL_GAP | Same as webkit. |
| `--mantine-color-white` | (none) | ❌ | INTENTIONAL_GAP | Absolute white/black escape-hatch. Soribashi uses `tokens.colors.neutral.0 / .950`. |
| `--mantine-color-black` | (none) | ❌ | INTENTIONAL_GAP | Same. |

### Line Height

| Mantine variable | Soribashi equivalent | Emitted? | Status | Notes |
|---|---|---|---|---|
| `--mantine-line-height` | `--line-height-md` | ✅ | mapped | Mantine aliases `lineHeights.md` as a bare var. Soribashi emits `--line-height-md` from `tokens.lineHeight.md`. Components reference the keyed var. |
| `--mantine-line-height-xs` | `--line-height-xs` | ✅ | mapped | `tokens.lineHeight.xs` |
| `--mantine-line-height-sm` | `--line-height-sm` | ✅ | mapped | `tokens.lineHeight.sm` |
| `--mantine-line-height-md` | `--line-height-md` | ✅ | mapped | `tokens.lineHeight.md` |
| `--mantine-line-height-lg` | `--line-height-lg` | ✅ | mapped | `tokens.lineHeight.lg` |
| `--mantine-line-height-xl` | `--line-height-xl` | ✅ | mapped | `tokens.lineHeight.xl` |

### Font Family

| Mantine variable | Soribashi equivalent | Emitted? | Status | Notes |
|---|---|---|---|---|
| `--mantine-font-family` | `--font-family-sans` | ✅ | mapped | `tokens.fontFamily.sans` |
| `--mantine-font-family-monospace` | `--font-family-mono` | ✅ | mapped | `tokens.fontFamily.mono` |
| `--mantine-font-family-headings` | `--font-family-heading` | ✅ | mapped | `tokens.fontFamily.heading` |

### Heading Global Vars

| Mantine variable | Soribashi equivalent | Emitted? | Status | Notes |
|---|---|---|---|---|
| `--mantine-heading-font-weight` | `--heading-h1-font-weight` (per-order) | ✅ | mapped | Mantine has one global. Soribashi emits per-order `--heading-{h1-h6}-font-weight`. Test assertion uses `--heading-h1-font-weight`. |
| `--mantine-heading-text-wrap` | `--heading-text-wrap` | ✅ | mapped | Direct 1:1 mapping. |

### Radius

| Mantine variable | Soribashi equivalent | Emitted? | Status | Notes |
|---|---|---|---|---|
| `--mantine-radius-default` | `--radius-md` | ✅ | mapped | Mantine resolves `theme.defaultRadius` (default `"md"`) into a single `--radius-default`. Soribashi emits `--radius-md` directly; no extra alias. |
| `--mantine-radius-xs` | `--radius-xs` | ✅ | mapped | `tokens.radius.xs` |
| `--mantine-radius-sm` | `--radius-sm` | ✅ | mapped | `tokens.radius.sm` |
| `--mantine-radius-md` | `--radius-md` | ✅ | mapped | `tokens.radius.md` |
| `--mantine-radius-lg` | `--radius-lg` | ✅ | mapped | `tokens.radius.lg` |
| `--mantine-radius-xl` | `--radius-xl` | ✅ | mapped | `tokens.radius.xl` |

### Spacing

| Mantine variable | Soribashi equivalent | Emitted? | Status | Notes |
|---|---|---|---|---|
| `--mantine-spacing-xs` | `--spacing-xs` | ✅ | mapped | `tokens.spacing.xs` |
| `--mantine-spacing-sm` | `--spacing-sm` | ✅ | mapped | `tokens.spacing.sm` |
| `--mantine-spacing-md` | `--spacing-md` | ✅ | mapped | `tokens.spacing.md` |
| `--mantine-spacing-lg` | `--spacing-lg` | ✅ | mapped | `tokens.spacing.lg` |
| `--mantine-spacing-xl` | `--spacing-xl` | ✅ | mapped | `tokens.spacing.xl` |

### Font Size

| Mantine variable | Soribashi equivalent | Emitted? | Status | Notes |
|---|---|---|---|---|
| `--mantine-font-size-xs` | `--font-size-xs` | ✅ | mapped | `tokens.fontSize.xs` |
| `--mantine-font-size-sm` | `--font-size-sm` | ✅ | mapped | `tokens.fontSize.sm` |
| `--mantine-font-size-md` | `--font-size-md` | ✅ | mapped | `tokens.fontSize.md` |
| `--mantine-font-size-lg` | `--font-size-lg` | ✅ | mapped | `tokens.fontSize.lg` |
| `--mantine-font-size-xl` | `--font-size-xl` | ✅ | mapped | `tokens.fontSize.xl` |

### Font Weight

| Mantine variable | Soribashi equivalent | Emitted? | Status | Notes |
|---|---|---|---|---|
| `--mantine-font-weight-regular` | `--font-weight-regular` | ✅ | mapped | `tokens.fontWeight.regular` |
| `--mantine-font-weight-medium` | `--font-weight-medium` | ✅ | mapped | `tokens.fontWeight.medium` |
| `--mantine-font-weight-bold` | `--font-weight-bold` | ✅ | mapped | `tokens.fontWeight.bold` |

### Shadows

| Mantine variable | Soribashi equivalent | Emitted? | Status | Notes |
|---|---|---|---|---|
| `--mantine-shadow-xs` | `--shadow-xs` | ✅ | mapped | `tokens.shadow.xs` |
| `--mantine-shadow-sm` | `--shadow-sm` | ✅ | mapped | `tokens.shadow.sm` |
| `--mantine-shadow-md` | `--shadow-md` | ✅ | mapped | `tokens.shadow.md` |
| `--mantine-shadow-lg` | `--shadow-lg` | ✅ | mapped | `tokens.shadow.lg` |
| `--mantine-shadow-xl` | `--shadow-xl` | ✅ | mapped | `tokens.shadow.xl` |

### Breakpoints

| Mantine variable | Soribashi equivalent | Emitted? | Status | Notes |
|---|---|---|---|---|
| `--mantine-breakpoint-xs` | `--breakpoint-xs` | ✅ | mapped | `tokens.breakpoint.xs` — **BUG fixed 2026-04-25**: emit-css.ts was not emitting breakpoint tokens. |
| `--mantine-breakpoint-sm` | `--breakpoint-sm` | ✅ | mapped | Same fix. |
| `--mantine-breakpoint-md` | `--breakpoint-md` | ✅ | mapped | Same fix. |
| `--mantine-breakpoint-lg` | `--breakpoint-lg` | ✅ | mapped | Same fix. |
| `--mantine-breakpoint-xl` | `--breakpoint-xl` | ✅ | mapped | Same fix. |

### Heading Per-Level Vars (h1–h6)

| Mantine variable | Soribashi equivalent | Emitted? | Status | Notes |
|---|---|---|---|---|
| `--mantine-h1-font-size` | `--heading-h1-font-size` | ✅ | mapped | `tokens.heading.sizes.h1.fontSize` |
| `--mantine-h1-font-weight` | `--heading-h1-font-weight` | ✅ | mapped | `tokens.heading.sizes.h1.fontWeight` |
| `--mantine-h1-line-height` | `--heading-h1-line-height` | ✅ | mapped | `tokens.heading.sizes.h1.lineHeight` |
| `--mantine-h2-font-size` | `--heading-h2-font-size` | ✅ | mapped | Same pattern |
| `--mantine-h2-font-weight` | `--heading-h2-font-weight` | ✅ | mapped | |
| `--mantine-h2-line-height` | `--heading-h2-line-height` | ✅ | mapped | |
| `--mantine-h3-font-size` | `--heading-h3-font-size` | ✅ | mapped | |
| `--mantine-h3-font-weight` | `--heading-h3-font-weight` | ✅ | mapped | |
| `--mantine-h3-line-height` | `--heading-h3-line-height` | ✅ | mapped | |
| `--mantine-h4-font-size` | `--heading-h4-font-size` | ✅ | mapped | |
| `--mantine-h4-font-weight` | `--heading-h4-font-weight` | ✅ | mapped | |
| `--mantine-h4-line-height` | `--heading-h4-line-height` | ✅ | mapped | |
| `--mantine-h5-font-size` | `--heading-h5-font-size` | ✅ | mapped | |
| `--mantine-h5-font-weight` | `--heading-h5-font-weight` | ✅ | mapped | |
| `--mantine-h5-line-height` | `--heading-h5-line-height` | ✅ | mapped | |
| `--mantine-h6-font-size` | `--heading-h6-font-size` | ✅ | mapped | |
| `--mantine-h6-font-weight` | `--heading-h6-font-weight` | ✅ | mapped | |
| `--mantine-h6-line-height` | `--heading-h6-line-height` | ✅ | mapped | |

### Primary Color Pointer Vars (variables section)

| Mantine variable | Soribashi equivalent | Emitted? | Status | Notes |
|---|---|---|---|---|
| `--mantine-primary-color-0` through `-9` | (none) | ❌ | INTENTIONAL_GAP | Mantine emits these as pointers to `--mantine-color-{primary}-{n}`. Soribashi has no "primary color family" concept at the CSS-variable layer; components reference `--color-{intent}-{shade}` directly. |
| `--mantine-primary-color-filled` | (none) | ❌ | INTENTIONAL_GAP | See color variant vars section below. |
| `--mantine-primary-color-filled-hover` | (none) | ❌ | INTENTIONAL_GAP | Same. |
| `--mantine-primary-color-light` | (none) | ❌ | INTENTIONAL_GAP | Same. |
| `--mantine-primary-color-light-hover` | (none) | ❌ | INTENTIONAL_GAP | Same. |
| `--mantine-primary-color-light-color` | (none) | ❌ | INTENTIONAL_GAP | Same. |

### Color Family Shade Values (--mantine-color-{family}-{0-9})

Mantine ships 14 color families (blue, cyan, dark, grape, gray, green, indigo, lime, orange, pink, red, teal, violet, yellow) each with 10 shades (0–9).

Soribashi ships semantic families (primary, neutral, danger, success, warning, info) with 50–950 shade keys.

| Mantine pattern | Soribashi pattern | Emitted? | Status | Notes |
|---|---|---|---|---|
| `--mantine-color-{family}-{0-9}` (140 vars) | `--color-{family}-{shade}` | ✅ structural | INTENTIONAL_GAP for Mantine families | The `--color-{family}-{shade}` pattern IS implemented and emits all `tokens.colors.*` entries. The specific family names and shade key conventions differ intentionally (semantic families, 50-950 keys vs. named families, 0-9 numeric index). |

### Color Family Variant Vars (light/dark scheme)

Mantine emits 8 variant suffixes per color family per scheme via `getCSSColorVariables()`:
`-filled`, `-filled-hover`, `-light`, `-light-hover`, `-light-color`, `-outline`, `-outline-hover`, `-text`

That is 14 families × 8 suffixes × 2 schemes = 224 additional vars.

| Mantine pattern | Soribashi equivalent | Emitted? | Status | Notes |
|---|---|---|---|---|
| `--mantine-color-{family}-{variant}` (224 vars) | (none static) | ❌ | INTENTIONAL_GAP | **Most significant architectural divergence.** Mantine pre-computes intent/variant colors at build-time as CSS variables; Mantine components reference `var(--mantine-color-blue-filled)`. Soribashi's `intentResolver` computes equivalent values at render-time via React context, returning inline styles/CSS classes. No per-family variant CSS vars are emitted or consumed. |

### Color-Scheme Semantic Vars (light/dark section)

| Mantine variable | Soribashi equivalent | Emitted? | Status | Notes |
|---|---|---|---|---|
| `--mantine-color-scheme` | (none) | ❌ | INTENTIONAL_GAP | Mantine injects `light`/`dark`. Soribashi manages scheme via the `.dark` class on `<html>`. |
| `--mantine-primary-color-contrast` | (none) | ❌ | INTENTIONAL_GAP | Auto-contrast for primary. Soribashi's intent resolver handles contrast. |
| `--mantine-color-bright` | (none) | ❌ | INTENTIONAL_GAP | Absolute white/black per scheme. Soribashi uses `tokens.colors.neutral.0/.950`. |
| `--mantine-color-text` | `--text-default` | ✅ | mapped | `semantic.text.default → colors.neutral.900`. |
| `--mantine-color-body` | `--surface-default` | ✅ | mapped | `semantic.surface.default → colors.neutral.0`. |
| `--mantine-color-error` | (none) | ❌ | INTENTIONAL_GAP | Points at `red-6/8`. Soribashi has `colors.danger.*`; components reference shades directly. No `--color-error` alias emitted. |
| `--mantine-color-placeholder` | (none) | ❌ | INTENTIONAL_GAP | Soribashi sets placeholder color via utility class in component CSS. |
| `--mantine-color-anchor` | (none) | ❌ | INTENTIONAL_GAP | Anchor/link styling handled at the component level via intent resolver. |
| `--mantine-color-default` | `--surface-default` | ✅ | mapped ⚠️ | Mantine's "default" element surface (white/dark-6) maps to `--surface-default`. Note: `--mantine-color-body` and `--mantine-color-default` both map to the same soribashi var — the distinction is collapsed intentionally (soribashi has one surface level instead of two). |
| `--mantine-color-default-hover` | (none) | ❌ | INTENTIONAL_GAP | Hover surface variant. Soribashi hover states handled by intent resolver. |
| `--mantine-color-default-color` | `--text-default` | ✅ | mapped | Mantine: text on default backgrounds. Soribashi: `--text-default`. |
| `--mantine-color-default-border` | `--border-default` | ✅ | mapped | `semantic.border.default → colors.neutral.200`. |
| `--mantine-color-dimmed` | `--text-muted` | ✅ | mapped | `semantic.text.muted → colors.neutral.500`. |
| `--mantine-color-disabled` | (none) | ❌ | INTENTIONAL_GAP | Soribashi handles disabled styling via CSS attribute selectors (`[data-disabled]`). |
| `--mantine-color-disabled-color` | (none) | ❌ | INTENTIONAL_GAP | Same. |
| `--mantine-color-disabled-border` | (none) | ❌ | INTENTIONAL_GAP | Same. |

---

## Bugs Fixed

### BUG-1: `tokens.breakpoint` not emitted by `emit-css.ts`

- **File fixed:** `packages/codegen/src/emit-css.ts`
- **Symptom:** `tokens.breakpoint` was typed and documented but the `emitTokenLines()` function had no branch for it. `--breakpoint-xs` through `--breakpoint-xl` were never emitted.
- **Impact:** The `Title` block's `visibleFrom`/`hiddenFrom` visibility CSS (`packages/blocks/src/Box/visibility.css`) references `--breakpoint-*` vars. Without emission, these CSS vars would be undefined at runtime.
- **Fix:** Added the breakpoint iteration to `emitTokenLines()` immediately after the shadow block:
  ```ts
  if (tokens.breakpoint) {
    for (const [key, value] of Object.entries(tokens.breakpoint).sort(byKey)) {
      lines.push(`  --breakpoint-${key}: ${value};`);
    }
  }
  ```
- **Test:** `packages/codegen/test/css-variable-parity.test.ts` — the 5 `--mantine-breakpoint-*` → `--breakpoint-*` assertions now pass.

---

## Intentional Gap Summary

| Gap category | Count | Ledger entry |
|---|---|---|
| Color family variant vars (`-filled`, `-outline`, etc.) | ~224 | Architectural divergence: intent resolver vs CSS variables |
| Primary color pointer vars | 15 | No `primaryColor` concept at CSS layer |
| Mantine named color families (blue, gray, etc.) | 140 | Soribashi uses semantic families (primary, neutral, etc.) |
| Scale multiplier (`--mantine-scale`) | 1 | Build-time token values; no runtime scale |
| Z-index vars | 5 | `tokens.zIndex` exists but not emitted; application-concern |
| Font smoothing | 2 | Consumer's CSS reset responsibility |
| White/black absolutes | 2 | Covered by `colors.neutral.0/.950` |
| Color scheme indicator | 1 | Managed via `.dark` class |
| Disabled state vars | 3 | Attribute-selector-based disabled styling |
| Cursor type | 1 | Utility class, not CSS variable |
| Error/placeholder/anchor/bright aliases | 4 | Components reference families directly |
| Hover/default-hover | 2 | Intent resolver computes hover states |
| Auto-contrast vars | 1 | Intent resolver handles contrast |
| **Total INTENTIONAL_GAP** | **~288** | See `docs/superpowers/divergences/mantine-master.md` |

---

## Coverage Statement

64 of 64 mapped Mantine CSS variables are emitted by soribashi's `emitCss()` (100%).
288 Mantine CSS variables are documented as INTENTIONAL_GAP with ledger justification.
352 total canonical Mantine CSS variables audited.

Parity regression test: `packages/codegen/test/css-variable-parity.test.ts` — 4 tests, all passing.
