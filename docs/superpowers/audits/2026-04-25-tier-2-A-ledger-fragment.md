# Tier 2 Batch T2-A — Ledger Fragment

> This fragment is merged into `docs/superpowers/divergences/mantine-master.md` by the orchestrator during Phase 4.

**Pinned to:** `mantinedev/mantine@63dafbbf5f0135eb36455b7add4c0ddcd0f3240a`

---

## Full audit pass — 2026-04-25 — Batch T2-A (Theme)

### `composeTheme` / `mergeTokens` — missing `fontWeight`, `lineHeight`, `heading` fields (BUG — FIXED)

- **File:** `packages/theme/src/compose-theme.ts`
- **Mantine source:** `packages/@mantine/core/src/core/MantineProvider/merge-mantine-theme/merge-mantine-theme.ts` (commit 63dafbbf) — uses `deepMerge` which handles all fields generically
- **Mantine behavior:** `mergeMantineTheme` uses `deepMerge(currentTheme, themeOverride)` — a generic recursive merge that handles every property in the theme object without an explicit list.
- **Soribashi previous behavior:** `mergeTokens()` had an explicit list of fields to merge (`colors`, `radius`, `spacing`, `fontSize`, `fontFamily`, `shadow`, `breakpoint`, `zIndex`) but was missing `fontWeight`, `lineHeight`, and `heading`. These fields exist in `ThemeTokens` but were silently dropped when a child theme extended a base theme.
- **Soribashi new behavior:** `mergeTokens()` now includes `fontWeight` (shallow merge), `lineHeight` (shallow merge), and `heading` (merged via `mergeHeadingTokens()` which shallow-merges `sizes` per heading level and takes child `textWrap` over base).
- **Classification:** `BUG` — fields added to `ThemeTokens` during the blocks adaptation pass were not added to `mergeTokens`, causing silent data loss in extended themes.
- **Disposition:** Aligned — fixed.
- **Tests:** `packages/theme/test/compose-theme.test.ts` — CT-BUG-1 through CT-BUG-5

---

### `createTheme` — full normalization on creation (confirmation: already in ledger)

- **File:** `packages/theme/src/create-theme.ts`
- **Mantine source:** `packages/@mantine/core/src/core/MantineProvider/create-theme/create-theme.ts` (commit 63dafbbf)
- **Status:** Already documented in master ledger under "Kept (deliberate divergences from Mantine) / `createTheme` — full normalization on creation." This audit confirms the entry is still accurate.
- **Disposition:** Keep — no change needed.

---

### `createTheme` — `extends` field for recursive theme inheritance

- **File:** `packages/theme/src/create-theme.ts`
- **Mantine source:** `packages/@mantine/core/src/core/MantineProvider/merge-theme-overrides/merge-theme-overrides.ts` (commit 63dafbbf) — Mantine provides `mergeThemeOverrides(...overrides)` as the compositing utility; no `extends` keyword on the theme object itself
- **Mantine behavior:** Consumers pass multiple `MantineThemeOverride` objects to `mergeThemeOverrides(overrideA, overrideB, ...)` which deep-merges them left-to-right. There is no declarative `extends` relationship.
- **Soribashi behavior:** `ThemeDefinition.extends?: ThemeDefinition` — a child theme declares its base theme inline. `createTheme` recursively resolves the chain: `createTheme(definition.extends)` first, then `composeTheme(base, definition)`.
- **Reason for divergence:** Soribashi's `extends` pattern is more declarative and tracks the inheritance relationship inside the theme object. Useful for codegen tooling that needs to traverse the inheritance chain. Mantine's `mergeThemeOverrides` is equivalent in capability but the chain is opaque after composition.
- **Disposition:** Keep soribashi's `extends` approach.
- **Test:** `packages/theme/test/compose-theme.test.ts` — "extending a theme inherits base tokens", "child tokens override base tokens by key"

---

### `composeTheme` — component config replaced wholesale vs Mantine's deep-merge

- **File:** `packages/theme/src/compose-theme.ts`
- **Mantine source:** `packages/@mantine/core/src/core/MantineProvider/merge-mantine-theme/merge-mantine-theme.ts` (commit 63dafbbf) — uses `deepMerge` which merges component configs key-by-key
- **Mantine behavior:** Deep-merging a component override will merge each key of the component config (`classNames`, `styles`, `vars`, `defaultProps`) individually.
- **Soribashi behavior:** `{ ...base.components, ...(child.components ?? {}) }` — child entry for a component name REPLACES the entire base entry for that component.
- **Reason for divergence:** Soribashi's per-component replacement is simpler and more predictable. Deep-merging nested component configs (e.g., `defaultProps` within `components.Button`) can produce surprising partial-override results. A component author who overrides `components.Button` in a child theme typically intends to fully control that component's config.
- **Disposition:** Keep soribashi's replacement approach.
- **Test:** `packages/theme/test/compose-theme.test.ts` — "child component config replaces base component config"

---

### `defaultIntentResolver` — variant set adapted (confirmation: already in ledger)

- **File:** `packages/theme/src/default-intent-resolver.ts`
- **Mantine source:** `packages/@mantine/core/src/core/MantineProvider/color-functions/default-variant-colors-resolver/default-variant-colors-resolver.ts` (commit 63dafbbf)
- **Status:** Already documented in master ledger under "Validated and matching / `defaultIntentResolver`." This audit confirms the entry is still accurate.
- **Summary:** Soribashi's variant set `['filled', 'outline', 'subtle', 'ghost', 'link']` vs Mantine's `['filled', 'light', 'outline', 'subtle', 'transparent', 'white', 'gradient', 'default', 'none']`. Soribashi adds `ghost` and `link`; drops Mantine-specific variants. The CSS variable naming follows the substitution table.
- **Disposition:** Keep — intentional and documented.

---

### `defaultTokens` — semantic color families vs Mantine's named palette (confirmation + addition)

- **File:** `packages/theme/src/tokens/default-tokens.ts`
- **Mantine source:** `packages/@mantine/core/src/core/MantineProvider/default-colors.ts` + `default-theme.ts` (commit 63dafbbf)
- **Status:** The CSS Variable Layer audit (2026-04-25) already documents the color naming divergence as INTENTIONAL_GAP. This audit confirms that finding still holds.
- **Additional finding:** Mantine's `fontWeights.medium` is `'600'` (same as `semibold`). Soribashi sets `fontWeight.medium = '500'` (standard semantic weight) and adds `fontWeight.semibold = '600'`. This is a soribashi correction of what appears to be an unusual default in Mantine.
- **Disposition:** Keep soribashi's values. The `medium: '500'` / `semibold: '600'` distinction follows standard CSS font-weight semantics.

---

### `types.ts` — `ResolvedTheme` vs `MantineTheme` (architectural divergence)

- **File:** `packages/theme/src/types.ts`
- **Mantine source:** `packages/@mantine/core/src/core/MantineProvider/theme.types.ts` (commit 63dafbbf)
- **Mantine behavior:** `MantineTheme` is a runtime configuration object with runtime fields (`focusRing`, `scale`, `cursorType`, `respectReducedMotion`, etc.) used by components and the provider at render time.
- **Soribashi behavior:** `ResolvedTheme` is a build-time token + semantic configuration object. No runtime fields. Consumed by `@soribashi/codegen` (no React) and the minimal `SoribashiProvider` (React context only).
- **Reason for divergence:** Soribashi's design separates static token configuration (resolved at build time by codegen) from runtime component configuration (handled by the minimal provider context). Mantine conflates both because its CSS variables are emitted at runtime.
- **Disposition:** Keep soribashi's design. This is fundamental to the architecture.
