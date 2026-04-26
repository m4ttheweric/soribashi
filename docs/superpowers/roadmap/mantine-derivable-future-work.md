# Mantine-Derivable Future Work

This document captures (e) findings from the 2026-04-25 full audit pass — Mantine helpers / utilities / types soribashi could expose but currently doesn't. These are explicitly out of scope for the audit pass; they are candidates for follow-up consideration.

**Source pinned to:** `mantinedev/mantine@63dafbbf5f0135eb36455b7add4c0ddcd0f3240a`

Each entry includes:
- **Mantine source path** — where to look in `/Users/matt/Documents/GitHub/mantine`
- **Description** — what the helper / utility does in Mantine
- **Soribashi value** — why it might be useful for soribashi consumers
- **Effort** — rough sizing: S (a function), M (a small module), L (a subsystem)
- **Surfaced in** — which audit doc / phase surfaced the finding

| Mantine source | Description | Soribashi value | Effort | Surfaced in |
|---|---|---|---|---|
| `core/MantineProvider/merge-theme-overrides/merge-theme-overrides.ts` | Variadic `mergeThemeOverrides(...overrides)` utility for combining multiple partial theme overrides before passing to provider | Useful for plugin authors composing multiple partial themes; soribashi has the `extends` chain but no standalone variadic merger | S | tier-2-theme.md |
| `core/MantineProvider/default-theme.ts` (defaultGradient) | `defaultGradient` token field providing a default gradient preset | Useful if soribashi ever ships gradient-variant components (e.g., button gradient variant) | S | tier-2-theme.md |
| `core/MantineProvider/color-functions/get-contrast-color/` | Luminance-based `autoContrast` text color selection (white-on-dark / black-on-light) | Useful for adaptive button/badge text color when consumers add custom intents; soribashi currently has no auto-contrast utility | M | tier-2-theme.md |
| `core/MantineProvider/HeadlessMantineProvider` | A no-CSS-variable variant of the provider for headless usage | Soribashi is already effectively headless-first via static codegen; no clear consumer need identified | M | tier-2-provider-types.md |
| `core/MantineProvider/use-mantine-env` (`useMantineEnv`) | `'default' \| 'test'` env flag that disables CSS transitions | Useful for test-environment detection so animations don't flake tests | S | tier-2-provider-types.md |
| `core/styles-api/styles-api.types.ts` (CompoundStylesApiProps) | Typed StylesApiProps variant restricted to compound components | Improves type safety for compound-component authors (e.g., Tabs.List, Tabs.Tab) when those components are added — **DONE (Roadmap Batch 1, 2026-04-25)** | S | tier-2-provider-types.md |
| `core/MantineProvider/MantineCssVariables.tsx` (`removeDefaultVariables`) | Optionally deduplicates emitted CSS variables by removing those that match the default theme | Could reduce CSS payload when consumer themes extend a base theme without overriding many tokens — **DONE (Roadmap Batch 1, 2026-04-25)** | M | tier-2-codegen.md |
| `core/MantineProvider/cssVariablesResolver` escape hatch | User-pluggable hook for injecting custom CSS variables at codegen time | Flexibility for advanced consumers (e.g., adding tokens not in the standard token model) — **DONE (Roadmap Batch 1, 2026-04-25)** | M | tier-2-codegen.md |
| `core/Box/style-props/font-family-resolver` | Token-aware resolver for `ff` style prop that maps `'mono'` / `'heading'` / `'sans'` shortcuts | Convenience for `ff="mono"` instead of `ff="var(--font-family-mono)"` — **DONE (Roadmap Batch 1, 2026-04-25)** | S | tier-2-box-style-props.md |
| `core/Box/style-props/border-resolver` | Token-aware syntax for `bd` style prop (parses `1px solid {colorToken}` and resolves the token) | Lets consumers write `bd="1px solid primary.500"` instead of `bd="1px solid var(--color-primary-500)"` — **DONE (Roadmap Batch 1, 2026-04-25)** | M | tier-2-box-style-props.md |
| `core/InlineStyles/sortMediaQueries` | Standalone `sortMediaQueries` export | Useful for consumers building custom inline-styles emitters | S | tier-2-box-style-props.md |
| `core/styles-api/use-styles/VarsResolver` types | `VarsResolver` and `PartialVarsResolver` types for stricter vars-resolver typing | Useful for advanced consumers wanting stricter typing on their `vars` resolvers; soribashi's `Partial<Record<...>>` is sufficient for the common case | S | tier-2-factory-additions.md |
