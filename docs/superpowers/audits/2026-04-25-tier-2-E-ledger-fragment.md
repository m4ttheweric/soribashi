# Tier 2 Batch T2-E — Ledger Fragment

**For orchestrator:** Merge this file into `docs/superpowers/divergences/mantine-master.md` under the "Full audit pass — 2026-04-25" section during Phase 4 consolidation, then delete this file.

---

## Aligned (soribashi corrected to match Mantine / complete expected behavior)

### `emit-css.ts` — missing breakpoint token emission (BUG-E-1)

- **File:** `packages/codegen/src/emit-css.ts`
- **Mantine source:** `packages/@mantine/core/src/core/MantineProvider/MantineCssVariables/default-css-variables-resolver.ts` (commit 63dafbbf) — `assignSizeVariables(result.variables, theme.breakpoints, 'breakpoint')`
- **Mantine behavior:** Always emits `--mantine-breakpoint-{xs|sm|md|lg|xl}` in the shared variables block.
- **Soribashi previous behavior:** `emitTokenLines()` had no `tokens.breakpoint` iteration block. `--breakpoint-*` vars were never emitted.
- **Soribashi new behavior:** `if (tokens.breakpoint)` block added after the shadow block; emits `--breakpoint-{key}: {value}` for all breakpoint entries.
- **Reason for drift:** Omission during initial implementation — breakpoints were typed but the emission loop was not added.
- **Disposition:** Aligned.
- **Test:** `packages/codegen/test/emit-css-emitter-logic.test.ts` — "BUG-E-1: breakpoint emission" suite (3 tests).
- **Also tracked in:** `docs/superpowers/audits/2026-04-25-css-variable-parity.md` BUG-1 (the V3 audit documented this finding; this batch closes it in the emitter-logic audit and confirms the fix is present).

### `emit-css.ts` — `emitDarkTokenLines()` incomplete token coverage (BUG-E-2)

- **File:** `packages/codegen/src/emit-css.ts`
- **Mantine source:** `packages/@mantine/core/src/core/MantineProvider/MantineCssVariables/default-css-variables-resolver.ts` (commit 63dafbbf) — the `dark` section includes all scheme-specific vars including typography.
- **Mantine behavior:** The dark section of the CSS variables output covers all token categories that have scheme-specific values.
- **Soribashi previous behavior:** `emitDarkTokenLines()` handled only: `colors`, `radius`, `spacing`, `fontSize`, `shadow`. Dark overrides for `fontFamily`, `fontWeight`, `lineHeight`, `breakpoint`, and `heading` were silently dropped.
- **Soribashi new behavior:** `emitDarkTokenLines()` now handles all `PartialThemeTokens` fields, including the five previously missing ones. Each uses the same undefined-guard pattern as the existing code.
- **Reason for drift:** Incremental implementation — the five token categories were added to `ThemeTokens` / `PartialThemeTokens` after the initial dark-mode emission code was written and the dark emitter was not updated.
- **Disposition:** Aligned.
- **Test:** `packages/codegen/test/emit-css-emitter-logic.test.ts` — "BUG-E-2: dark override completeness" suite (6 tests).

---

## Kept (deliberate divergences from Mantine)

### `emit-css.ts` — deterministic sort order vs. insertion-order iteration

- **File:** `packages/codegen/src/emit-css.ts`
- **Mantine source:** `default-css-variables-resolver.ts` (commit 63dafbbf) — uses `keys(sizes).forEach()` without explicit sort.
- **Mantine behavior:** Iterates object keys in JS insertion order (effectively: the order the theme was built).
- **Soribashi behavior:** All token iteration uses `.sort(byKey)` (localeCompare alphabetical) for deterministic output regardless of input key order.
- **Reason for divergence:** Soribashi is a build-time codegen tool; CSS output must be byte-identical across runs on any runtime. JS insertion order is non-deterministic in some edge cases and across different Object.keys() implementations.
- **Disposition:** Keep soribashi's sorted output.
- **Test:** `packages/codegen/test/emit-css-emitter-logic.test.ts` — "sort order" suite.

### `emit-css.ts` — single dark-class block vs. Mantine's attribute-scheme blocks

- **File:** `packages/codegen/src/emit-css.ts`
- **Mantine source:** `convert-css-variables.ts` (commit 63dafbbf) — produces `:root[data-mantine-color-scheme="dark"] { ... }` and `:root[data-mantine-color-scheme="light"] { ... }` blocks.
- **Mantine behavior:** Color scheme is toggled by setting `data-mantine-color-scheme` attribute on the root element.
- **Soribashi behavior:** Color scheme is toggled by adding/removing the `.dark` class on `<html>`. The dark CSS block is `{darkMode.selector}` (default `.dark`).
- **Reason for divergence:** Soribashi integrates with Tailwind's dark mode strategy (`class` mode). The `.dark` class on `<html>` is the Tailwind convention and aligns with Soribashi's Tailwind-first design.
- **Disposition:** Keep soribashi's class-based dark mode selector.
- **Test:** `packages/codegen/test/emit-css-emitter-logic.test.ts` — "conditional dark block emission" suite.

### `emit-css.ts` — per-level heading vars vs. Mantine's single global heading-font-weight

- **File:** `packages/codegen/src/emit-css.ts`
- **Mantine source:** `default-css-variables-resolver.ts` — emits one `--mantine-heading-font-weight` from `theme.headings.fontWeight`.
- **Mantine behavior:** Single global heading font weight; per-level `--mantine-h1-font-weight` etc. still emitted but fall back to the global.
- **Soribashi behavior:** Emits `--heading-{h1-h6}-font-weight` per level only when the per-level `fontWeight` is defined. No implicit global fallback in the emitter (CSS cascade handles fallback).
- **Reason for divergence:** Soribashi's explicit-token-only approach avoids emitting vars with undefined values. The CSS cascade provides the equivalent of Mantine's global fallback.
- **Disposition:** Keep soribashi's per-level explicit emission.
- **Test:** `packages/codegen/test/emit-css-emitter-logic.test.ts` — "omits --heading-{n}-font-weight when size.fontWeight is undefined".

### `emit-css.ts` — soribashi emits color-scheme-independent base block; Mantine emits scheme-specific light/dark blocks for semantic vars

- **File:** `packages/codegen/src/emit-css.ts`
- **Mantine source:** `default-css-variables-resolver.ts` — `light` and `dark` sections each have full copies of semantic vars with scheme-specific values.
- **Mantine behavior:** `--mantine-color-text` is hardcoded per-scheme (black in light, `var(--mantine-color-dark-0)` in dark).
- **Soribashi behavior:** Semantic vars (`--text-*`, `--surface-*`, `--border-*`) are emitted once in the base scope, pointing at color token vars (e.g., `--text-default: var(--color-neutral-900)`). Dark mode flips are achieved by overriding the underlying color tokens in the `.dark` block.
- **Reason for divergence:** Soribashi uses CSS custom property cascade: dark-mode color tokens are overridden in the `.dark` scope, so semantic vars that reference them automatically get dark values without re-emitting the semantic vars. Cleaner, fewer total vars.
- **Disposition:** Keep soribashi's cascade-based approach.
- **Test:** `packages/codegen/test/emit-css-emitter-logic.test.ts` — "semanticToVar reference resolution" suite.

---

## Soribashi Additions (no Mantine analog)

### `load-config.ts` — build-time config loader

- **File:** `packages/codegen/src/load-config.ts`
- **Mantine analog:** None. Mantine is runtime-only via `<MantineProvider>`.
- **Justification:** Soribashi's codegen is a build-time tool that reads a config file from disk and generates static CSS/Tailwind output. `load-config.ts` is the file-loading bridge: it converts a path to a `file://` URL, dynamically imports the TS/JS config file (via Bun's native TS loader), and validates the required fields (`theme`, `output.css`). There is no Mantine equivalent because Mantine's "configuration" is always provided at runtime via React props.
- **Disposition:** Soribashi addition — justified by the build-time codegen architecture.

### `emit-tailwind-v3.ts` — Tailwind v3 config emitter

- **File:** `packages/codegen/src/emit-tailwind-v3.ts`
- **Mantine analog:** None. Mantine doesn't generate Tailwind configs.
- **Justification:** Soribashi supports Tailwind-first usage. The v3 emitter maps soribashi token keys to Tailwind v3 `theme.extend` keys, enabling utility classes like `bg-primary-500/50` (via the `<alpha-value>` pattern) and `rounded-md`, `p-lg`, etc. The emitter follows canonical Tailwind v3 conventions (colors with alpha-value, breakpoints as `screens`, numeric/dashed keys quoted).
- **Disposition:** Soribashi addition — no Mantine equivalent exists or is needed.

### `emit-tailwind-v4.ts` — Tailwind v4 `@theme` block emitter

- **File:** `packages/codegen/src/emit-tailwind-v4.ts`
- **Mantine analog:** None. Mantine doesn't generate Tailwind v4 `@theme` blocks.
- **Justification:** Soribashi supports Tailwind v4 usage. The v4 emitter uses Tailwind v4's CSS-as-source-of-truth model (`@theme { --color-*: ...; }`). Key namespace differences from emit-css.ts: `--text-*` for font sizes, `--font-*` for font families, `--leading-*` for line heights, `--breakpoint-*` for breakpoints — all matching Tailwind v4's built-in token resolution namespaces. No `hsl(var() / <alpha-value>)` wrapping needed because v4 handles opacity natively.
- **Disposition:** Soribashi addition — no Mantine equivalent exists or is needed.
