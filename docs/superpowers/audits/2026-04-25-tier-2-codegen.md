# Tier 2 Audit — Batch T2-E: Codegen Emitters

**Pinned to:** `mantinedev/mantine@63dafbbf5f0135eb36455b7add4c0ddcd0f3240a`

**Mantine spiritual analogs:**
- `packages/@mantine/core/src/core/MantineProvider/MantineCssVariables/default-css-variables-resolver.ts`
- `packages/@mantine/core/src/core/MantineProvider/MantineCssVariables/MantineCssVariables.tsx`
- `packages/@mantine/core/src/core/MantineProvider/convert-css-variables/convert-css-variables.ts`

**Note:** These are *spiritual* analogs. Mantine doesn't ship a "codegen" package — its CSS variables are emitted at runtime by `MantineCssVariables` via `convertCssVariables`. Soribashi's codegen is a build-time utility that produces static files (theme.css, Tailwind config). See `SORIBASHI_ADDITION` entry for `load-config.ts`.

**Variable surface parity:** Already covered in V3 audit (`docs/superpowers/audits/2026-04-25-css-variable-parity.md`). This audit covers EMITTER LOGIC only.

---

## File: `packages/codegen/src/emit-css.ts`

**Mantine spiritual analog:** `default-css-variables-resolver.ts` + `MantineCssVariables.tsx` + `convert-css-variables.ts`

### Decision-point enumeration

| # | Mantine behavior | Soribashi behavior | Classification |
|---|---|---|---|
| E-CSS-1 | `assignSizeVariables()` iterates all token maps via `keys(sizes).forEach()` — no explicit sort | `emitTokenLines()` uses `.sort(byKey)` (localeCompare alphabetical) at every iteration | `INTENTIONAL` — deterministic build output requires stable sort; Mantine relies on JS object key insertion order which is non-deterministic across environments |
| E-CSS-2 | Mantine emits colors as `--mantine-color-{family}-{index}` using numeric 0–9 indices | `emitTokenLines()` emits `--color-{family}-{shade}` using string shade keys (50, 100, …, 950) | `TOKEN_DIFF` — token-name substitution per design spec; the iteration pattern (nested family/shade loops) is identical |
| E-CSS-3 | Mantine produces a `{ variables, light, dark }` object; `convertCssVariables()` wraps them in `:root { }`, `:root[data-mantine-color-scheme="dark"] { }` | `emitCss()` emits a single light block (`theme.scope`) and a single dark block (`theme.darkMode.selector`) | `INTENTIONAL` — soribashi's dark mode is class-based (`.dark` on `<html>`), not attribute-based; one dark block vs. separate light/dark blocks |
| E-CSS-4 | Mantine emits `--mantine-heading-font-weight` as a single global heading weight | `emitTokenLines()` emits per-heading-level `--heading-{h1-h6}-font-weight` | `INTENTIONAL` — soribashi supports independent per-level weights; the global Mantine heading weight is split into 6 per-level vars (more expressive) |
| E-CSS-5 | Mantine emits `--mantine-heading-text-wrap` unconditionally (from `theme.headings.textWrap`) | Soribashi emits `--heading-text-wrap` only when `tokens.heading.textWrap !== undefined` | `INTENTIONAL` — soribashi's heading textWrap is optional; conditional guard avoids emitting a variable with `undefined` value |
| E-CSS-6 | Mantine emits `--mantine-h1-font-weight = headings[heading].fontWeight \|\| theme.headings.fontWeight` (fallback to global) | Soribashi emits `--heading-h1-font-weight` only when `size.fontWeight !== undefined` (no global fallback) | `INTENTIONAL` — soribashi tokens are explicit; no implicit fallback chain. Consumers use CSS cascade for defaults |
| E-CSS-7 | Mantine emits `--mantine-scale`, `--mantine-cursor-type`, `--mantine-webkit-font-smoothing`, z-index vars, and white/black absolutes unconditionally | Soribashi does not emit these | `INTENTIONAL` — documented in V3 audit as INTENTIONAL_GAP |
| E-CSS-8 | Mantine emits per-color-family variant vars (`-filled`, `-outline`, etc.) via `getCSSColorVariables()` for each color family in both light and dark schemes | Soribashi does not emit any per-family variant vars | `INTENTIONAL` — documented in V3 audit; soribashi's intent resolver handles this at render time |
| E-CSS-9 | Mantine's dark section emits scheme-scoped semantic vars only (`--mantine-color-text`, `--mantine-color-body`, etc.) via scheme-specific `light` / `dark` objects | Soribashi's `emitDarkTokenLines()` emits raw token overrides in the dark block (colors, radius, spacing, fontSize, shadow + added: fontFamily, fontWeight, lineHeight, breakpoint, heading via BUG-E-2 fix) | `INTENTIONAL` — architectures differ fundamentally; Mantine uses a "scheme-select" CSS attribute to switch between two full variable sets; soribashi overlays only the dark-overridden tokens on top of the base |
| **E-CSS-BUG-1** | Mantine emits `--mantine-breakpoint-{key}` from `assignSizeVariables(result.variables, theme.breakpoints, 'breakpoint')` | Soribashi's `emitTokenLines()` was MISSING the breakpoint iteration block | **`BUG` — FIXED** (see below) |
| **E-CSS-BUG-2** | Mantine emits all token categories in both light and dark schemes | Soribashi's `emitDarkTokenLines()` covered only: colors, radius, spacing, fontSize, shadow — silently dropping fontFamily, fontWeight, lineHeight, breakpoint, heading dark overrides | **`BUG` — FIXED** (see below) |
| E-CSS-10 | Mantine's `semanticToVar` equivalent: colors are referenced as `var(--mantine-color-{family}-{shade})` | Soribashi's `semanticToVar()` resolves dot-path refs to `var(--color-*)`, `var(--radius-*)`, `var(--spacing-*)`, `var(--font-size-*)` | `IDENTICAL` — same pattern, TOKEN_DIFF names |
| E-CSS-11 | Mantine emits color-scheme semantic vars in both light and dark | Soribashi emits `--text-*`, `--surface-*`, `--border-*` semantic vars in the base (light) scope; dark overrides of semantics are done via dark-mode token overrides | `INTENTIONAL` — soribashi uses a layer-based approach: base semantic vars reference color tokens; dark overrides of color tokens flow through to semantic vars automatically via CSS `var()` cascading |
| E-CSS-12 | `byKey` sort comparator | Both use `a.localeCompare(b)` | `IDENTICAL` |

### Bugs Fixed

#### BUG-E-1: Missing breakpoint emission in `emitTokenLines()`

- **Symptom:** `tokens.breakpoint` was not iterated in `emitTokenLines()`. `--breakpoint-xs` through `--breakpoint-xl` were never emitted.
- **Impact:** Any CSS that references `var(--breakpoint-md)` (e.g., the `visibility.css` mediaQuery-based hiddenFrom/visibleFrom system) would receive `undefined` at runtime.
- **Mantine analog:** `assignSizeVariables(result.variables, theme.breakpoints, 'breakpoint')` — always called.
- **Fix:** Added `if (tokens.breakpoint) { for (const [key, value] of Object.entries(tokens.breakpoint).sort(byKey)) lines.push(...) }` after the shadow block.
- **Tests:** `packages/codegen/test/emit-css-emitter-logic.test.ts` — "BUG-E-1: breakpoint emission" suite (3 tests).

#### BUG-E-2: `emitDarkTokenLines()` incomplete — silently drops fontFamily, fontWeight, lineHeight, breakpoint, heading dark overrides

- **Symptom:** `PartialThemeTokens` includes `fontFamily`, `fontWeight`, `lineHeight`, `breakpoint`, `heading` fields. `emitDarkTokenLines()` only handled `colors`, `radius`, `spacing`, `fontSize`, `shadow`. A theme configuration with dark-mode font or heading overrides would silently produce incorrect output.
- **Impact:** Consumers providing dark-mode font-family or heading-size overrides would see light-mode values used in dark mode.
- **Mantine analog:** Mantine's dark object includes all scheme-specific vars including typography.
- **Fix:** Added handling for all five missing token types in `emitDarkTokenLines()` with `undefined` guards matching the existing pattern.
- **Tests:** `packages/codegen/test/emit-css-emitter-logic.test.ts` — "BUG-E-2: dark override completeness" suite (6 tests).

### Additional tests added (coverage of existing correct behavior)

All branches of `emitTokenLines()`, `emitDarkTokenLines()`, and `semanticToVar()` are now covered:
- Sort order (family-then-shade alphabetical)
- Conditional dark block emission (only when `theme.dark` is non-empty)
- Custom `darkMode.selector` propagation
- Edge cases: empty tokens, undefined heading props, undefined dark values skipped
- All four `semanticToVar()` resolution paths (colors, radius, spacing, fontSize) + passthrough fallback

---

## File: `packages/codegen/src/emit-tailwind-v3.ts`

**Mantine spiritual analog:** No direct Mantine analog. Mantine doesn't generate a Tailwind v3 config. Soribashi maps its token structure to Tailwind v3's `theme.extend` shape.

### Decision-point enumeration

| # | Decision point | Soribashi behavior | Classification |
|---|---|---|---|
| TW3-1 | Color output format | Uses `hsl(var(--color-{family}-{shade}) / <alpha-value>)` pattern — enables opacity modifier utilities (`bg-primary-500/50`) | `SORIBASHI_ADDITION` — Mantine has no v3 Tailwind output; this is the canonical Tailwind v3 alpha-value pattern for CSS variables |
| TW3-2 | Empty colors skip | `if (Object.keys(theme.tokens.colors).length > 0)` guards the color block | `SORIBASHI_ADDITION` — avoids emitting an empty `colors: {}` block |
| TW3-3 | Breakpoints → `screens` | `if (theme.tokens.breakpoint)` emits breakpoints under the `screens` key with raw values (not `var()` refs) | `SORIBASHI_ADDITION` — canonical Tailwind v3 breakpoint config pattern; v3 reads raw values from `screens`, not CSS vars |
| TW3-4 | `emitVarMap` skips empty | `if (Object.keys(source).length === 0) return` — omits sections for empty token sets | `SORIBASHI_ADDITION` — prevents empty `borderRadius: {}`, `spacing: {}` etc. in output |
| TW3-5 | `quoteIfNeeded` | Quotes keys that fail `/^[a-zA-Z_$][a-zA-Z0-9_$]*$/` (e.g. `'50'`, `'500'`, `'2xl'`) | `SORIBASHI_ADDITION` — valid JS identifier check; prevents syntax errors for numeric-like shade keys |
| TW3-6 | Sort order | `byKey` (localeCompare) applied everywhere | `IDENTICAL` to emit-css.ts sort strategy |
| TW3-7 | Token-to-config-key mapping | `radius` → `borderRadius`, `spacing` → `spacing`, `fontSize` → `fontSize`, `fontFamily` → `fontFamily`, `fontWeight` → `fontWeight`, `lineHeight` → `lineHeight`, `shadow` → `boxShadow` | `SORIBASHI_ADDITION` — maps soribashi token keys to standard Tailwind v3 config keys |
| TW3-8 | CSS var references | Non-color tokens use `var(--{prefix}-{key})` format matching the emit-css.ts var names | `IDENTICAL` — consistent naming between CSS emitter and Tailwind v3 emitter |

### No bugs found in emit-tailwind-v3.ts

All tested behavior is correct: 32 tests in the emitter-logic suite pass on the first run with no changes to the source file.

---

## File: `packages/codegen/src/emit-tailwind-v4.ts`

**Mantine spiritual analog:** No direct Mantine analog. Mantine doesn't generate Tailwind v4 `@theme` blocks.

### Decision-point enumeration

| # | Decision point | Soribashi behavior | Classification |
|---|---|---|---|
| TW4-1 | Output format | Emits `@theme { ... }` block — the Tailwind v4 source-of-truth format for design tokens | `SORIBASHI_ADDITION` — canonical Tailwind v4 convention |
| TW4-2 | fontSize namespace | Uses `--text-{key}` (Tailwind v4 convention) vs. `--font-size-{key}` (emit-css.ts) | `SORIBASHI_ADDITION` — TW4 reads font-size from `--text-*` automatically |
| TW4-3 | fontFamily namespace | Uses `--font-{key}` (Tailwind v4 convention) vs. `--font-family-{key}` (emit-css.ts) | `SORIBASHI_ADDITION` — TW4 reads font-family from `--font-*` |
| TW4-4 | lineHeight namespace | Uses `--leading-{key}` (Tailwind v4 convention) vs. `--line-height-{key}` (emit-css.ts) | `SORIBASHI_ADDITION` — TW4 reads line-height from `--leading-*` |
| TW4-5 | Color output | Emits `--color-{family}-{shade}: {value}` directly — no `hsl(var() / <alpha-value>)` wrapper | `SORIBASHI_ADDITION` — TW4 handles opacity natively; v3's alpha-value pattern not needed |
| TW4-6 | Sort order | `byKey` (localeCompare) at every iteration | `IDENTICAL` to emit-css.ts and emit-tailwind-v3.ts |
| TW4-7 | Breakpoints | Uses `--breakpoint-{key}: {value}` (Tailwind v4 custom property convention) vs. v3's `screens{}` raw values | `SORIBASHI_ADDITION` — v4 reads breakpoints from `--breakpoint-*` custom properties |
| TW4-8 | No alpha-value pattern | Values emitted verbatim | `SORIBASHI_ADDITION` — v4 opacity handling is built-in |

### No bugs found in emit-tailwind-v4.ts

All tested behavior is correct: passes the e2e Tailwind compile tests + 32 new emitter-logic tests on first run.

---

## File: `packages/codegen/src/load-config.ts`

**Mantine analog:** NONE — `load-config.ts` is a soribashi-only build-time utility.

### Justification (SORIBASHI_ADDITION)

Mantine doesn't ship a "codegen" concept. Its theme is configured at runtime via `<MantineProvider theme={...}>` — no config file, no file I/O. Soribashi's codegen package is a build-time tool that reads a config file from disk and generates static CSS/Tailwind output. `load-config.ts` provides the file-loading bridge.

**What it does:**
1. Converts an absolute path to a `file://` URL (for Node.js dynamic import compatibility with TypeScript files via Bun's native TS loader).
2. Validates the config has a `default` export.
3. Validates the config's `default.theme` field is present.
4. Validates the config's `default.output.css` field is present.
5. Returns the typed `CodegenConfig`.

**Why no Mantine analog is needed:**
Mantine's runtime theme injection (`<MantineProvider>`) is the equivalent of soribashi's config-file-reading, but at runtime vs. build time. Soribashi's build-time approach generates static CSS files, which is architecturally different (no React context, no runtime overhead).

**Existing tests:** `packages/codegen/test/load-config.test.ts` covers the three error paths (no default export, no theme field, no output.css field). No new tests needed.

---

## Coverage Summary

| File | Mantine analog | Status | Bugs found | Bugs fixed | Tests added |
|---|---|---|---|---|---|
| `emit-css.ts` | `default-css-variables-resolver.ts` + `MantineCssVariables.tsx` | `drift fixed` | 2 (BUG-E-1, BUG-E-2) | 2 | 24 |
| `emit-tailwind-v3.ts` | (no direct analog) | `soribashi addition` | 0 | 0 | 32 (coverage of existing correct behavior) |
| `emit-tailwind-v4.ts` | (no direct analog) | `soribashi addition` | 0 | 0 | 32 (shared with v3 test file) |
| `load-config.ts` | (no analog) | `soribashi addition` | 0 | 0 | 0 |

**Total new tests committed:** 56 (24 in `emit-css-emitter-logic.test.ts` + 32 in `emit-tailwind-emitter-logic.test.ts`)

---

## (e) Missing Port Candidates

| Mantine feature | Description | Soribashi value | Effort |
|---|---|---|---|
| `removeDefaultVariables.ts` | Mantine optionally deduplicates CSS variables by removing vars that match the default theme values (to reduce payload for nested providers) | Could reduce CSS payload when soribashi themes extend a base theme | M |
| `getMergedVariables.ts` | Mantine merges user-provided `cssVariablesResolver` with the default resolver | Soribashi currently has no escape hatch for custom CSS variable injection at codegen time; a `customVarsResolver` config field would be the equivalent | M |
| Virtual color (`virtual-color.ts`) | Mantine supports "virtual" color families that have different light/dark definitions | Soribashi's dark override system (`theme.dark.colors`) covers the same use case | — (already covered) |
