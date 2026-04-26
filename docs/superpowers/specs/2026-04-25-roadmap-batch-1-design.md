# Roadmap Batch 1 — Design Spec

**Status:** Draft
**Date:** 2026-04-25
**Audience:** Implementation engineers
**Scope:** Five items from `docs/superpowers/roadmap/mantine-derivable-future-work.md`.

---

## 1. What This Builds

Five small additions across three packages, each ported from Mantine and adapted to soribashi conventions:

| # | Item | Mantine source | Package |
|---|---|---|---|
| 1 | `CompoundStylesApiProps<P>` type | `core/styles-api/styles-api.types.ts` | `@soribashi/factory` |
| 2 | `removeDefaultVariables` (codegen dedup) | `core/MantineProvider/MantineCssVariables/remove-default-variables.ts` | `@soribashi/codegen` |
| 3 | `cssVariablesResolver` escape hatch | `core/MantineProvider/MantineProvider.tsx` (provider prop) | `@soribashi/codegen` |
| 4 | `fontFamilyResolver` (`ff` style prop) | `core/Box/style-props/resolvers/font-family-resolver/font-family-resolver.ts` | `@soribashi/blocks/Box` |
| 5 | `borderResolver` (`bd` style prop) | `core/Box/style-props/resolvers/border-resolver/border-resolver.ts` | `@soribashi/blocks/Box` |

These are all from `docs/superpowers/roadmap/mantine-derivable-future-work.md`. Each was surfaced as an (e) "missing port" candidate during the 2026-04-25 full audit pass.

---

## 2. Architecture

Three independent surfaces:

1. **Type addition** — one new exported type alias in `@soribashi/factory`.
2. **Codegen pluggability** — extend `emitCss()` with optional second arg `EmitCssOptions` carrying `cssVariablesResolver` and `removeDefaultVariables`. Plumb both through `loadConfig()` so `soribashi.config.ts` can declare them.
3. **Box style-prop resolvers** — two new resolver functions wired into the existing `STYLE_PROPS_DATA` rows for `ff` and `bd` (currently identity per the audit).

No package boundaries cross. No runtime/build-time bridges. Items can ship in any order.

---

## 3. Item 1 — `CompoundStylesApiProps<P>`

**Soribashi file:** `packages/factory/src/types/props.ts` (extend with new export)
**Barrel:** `packages/factory/src/index.ts` re-export

### Type definition

```ts
export interface CompoundStylesApiProps<TPayload extends FactoryPayload>
  extends Omit<StylesApiProps<TPayload>, 'unstyled' | 'attributes'> {}
```

Compound subcomponents (e.g., `Tabs.List`, `Accordion.Item`) inherit Styles API surface from their parent and shouldn't redeclare `unstyled` or `attributes`. This type captures that shape.

### Why it's safe

Pure type — zero runtime cost. No callers in current soribashi codebase (no compound components ship yet). Adding now lets future compound-component authors use it idiomatically.

### Test

One type-fixture test in `packages/factory/test/types/compound-styles-api-props.test-d.ts` (or extend an existing types test file) that compiles when `CompoundStylesApiProps<F>` is used in a fixture interface.

---

## 4. Item 2 — `removeDefaultVariables` (codegen dedup)

**Soribashi files:**
- Create: `packages/codegen/src/remove-default-variables.ts`
- Modify: `packages/codegen/src/emit-css.ts` (accept new `EmitCssOptions.removeDefaultVariables: boolean`)
- Modify: `packages/codegen/src/load-config.ts` (allow the option in `soribashi.config.ts`)
- Test: `packages/codegen/test/remove-default-variables.test.ts` (new) + extend `emit-css.test.ts`

### Behavior

`removeDefaultVariables(theme: ResolvedTheme): ResolvedTheme` returns a "diff theme" — same shape, but with token entries that match `defaultTokens` (or `defaultDarkTokens` for dark overrides) removed. `emitCss(diffTheme)` then emits a smaller CSS file.

When `emitCss(theme, { removeDefaultVariables: true })` is called, `emitCss` first runs the dedup pass, then runs the normal emit pipeline on the dedup'd theme. Default is `false` (no dedup).

### Dedup baseline

**Only `defaultTokens` (and `defaultDarkTokens`) — not the user's `extends` chain.** Matches Mantine's behavior. The `extends` chain is composed *into* the resolved theme; once composed, dedup compares against the framework's defaults, not against any user-defined ancestor.

### Edge cases

- **Leaf-level equality.** Each token leaf is the equality unit. For `tokens.heading.sizes.h1.fontSize`, the unit is the `fontSize` string. If `h1.fontSize` matches default but `h1.fontWeight` doesn't, only `h1.fontWeight` is retained.
- **Color scales.** Each `tokens.colors.primary[500]` shade is a leaf.
- **Dark overrides.** A separate dedup pass runs on `dark` against `defaultDarkTokens`.

### Surface

```ts
emitCss(theme, { removeDefaultVariables: true });
```

Or via config:

```ts
// soribashi.config.ts
export default {
  theme: createTheme({ ... }),
  emit: { removeDefaultVariables: true },
};
```

### Tests

- `removeDefaultVariables(theme)` where `theme === defaultTokens` → returns a theme with all token maps empty.
- `removeDefaultVariables(theme)` where one spacing key is overridden → returns a theme containing only that one spacing entry.
- `removeDefaultVariables(theme)` where one heading.sizes.h1.fontSize is overridden but other h1 leaves match defaults → returns a theme with only the overridden leaf.
- `emitCss(defaultTheme, { removeDefaultVariables: true })` → output contains no `--*` token vars (only the `:root { color-scheme }` shell or analogous boilerplate).
- `emitCss(theme, { removeDefaultVariables: true })` → output is shorter than `emitCss(theme)` for any non-trivial overlap with defaults.

### Soribashi divergence note

Mantine's `removeDefaultVariables` operates on `ConvertCSSVariablesInput` (`{variables, light, dark}`). Soribashi's operates on `ResolvedTheme` (the in-memory token tree) and produces a diff'd `ResolvedTheme` that the existing `emitCss` pipeline consumes. Equivalent semantics, different layer.

---

## 5. Item 3 — `cssVariablesResolver` escape hatch

**Soribashi files:**
- Modify: `packages/codegen/src/emit-css.ts` (accept `EmitCssOptions.cssVariablesResolver`)
- Modify: `packages/codegen/src/load-config.ts` (allow the option in `soribashi.config.ts`)
- Modify: `packages/codegen/src/types.ts` (export the resolver type)
- Test: extend `packages/codegen/test/emit-css.test.ts`

### Behavior

Optional consumer-pluggable function that returns additional CSS variables to emit alongside the default token-emission output:

```ts
type CssVariablesAddition = {
  root?: Record<string, string>;  // additional :root { ... } vars
  dark?: Record<string, string>;  // additional .dark { ... } vars
  scopes?: Record<string, { root?: Record<string, string>; dark?: Record<string, string> }>;
};

type CssVariablesResolver = (theme: ResolvedTheme) => CssVariablesAddition;
```

The resolver runs at codegen time — once per `emitCss()` invocation. Its output is appended to the corresponding blocks in the emitted CSS string. Consumer-emitted vars override default-emitted vars on key conflict (CSS cascade — they emit later within the same selector block).

### Surface

```ts
emitCss(theme, {
  cssVariablesResolver: (theme) => ({
    root: { '--my-app-spacing-xs': '4px', '--my-app-radius-pill': '9999px' },
    dark: { '--my-app-shadow': '0 1px 2px rgba(0,0,0,0.5)' },
  }),
});
```

### Soribashi divergence from Mantine

| Aspect | Mantine | Soribashi |
|---|---|---|
| When it runs | Provider render time | Codegen build time |
| Color-scheme awareness | Yes (resolver receives current scheme) | No (resolver always emits both `:root` and `.dark`) |
| Scope | Single `:root` block produced by provider | Per-tenant scope blocks supported via the `scopes` field |

Documented as INTENTIONAL in the audit ledger (new entry under "Full audit pass — 2026-04-25" or a follow-up section).

### Tests

- Resolver returning `root: { '--my-custom': 'red' }` → emitted CSS contains `--my-custom: red;` inside `:root { ... }`.
- Resolver returning `dark: { '--my-custom': 'blue' }` → emitted CSS contains `--my-custom: blue;` inside `.dark { ... }`.
- Resolver returning a key that matches a default-emitted var → consumer's value wins (later in same block).
- Resolver returning `scopes: { 'tenant-a': { root: { '--scoped': 'green' } } }` → emitted CSS contains the scoped block with that var.
- No resolver passed → emitted CSS unchanged from current behavior.

---

## 6. Item 4 — `fontFamilyResolver`

**Soribashi files:**
- Create: `packages/blocks/src/Box/style-props/resolvers/font-family-resolver.ts`
- Modify: `packages/blocks/src/Box/style-props/style-props-data.ts` (wire into `ff` row)
- Modify: `packages/blocks/src/Box/style-props/index.ts` (re-export if exports public API)
- Test: `packages/blocks/test/Box/font-family-resolver.test.ts` (new) + extend the existing Box style-props integration test

### Implementation

```ts
const values: Record<string, string> = {
  text:      'var(--font-family-sans)',
  sans:      'var(--font-family-sans)',
  mono:      'var(--font-family-mono)',
  monospace: 'var(--font-family-mono)',
  heading:   'var(--font-family-heading)',
  headings:  'var(--font-family-heading)',
};

export function fontFamilyResolver(value: unknown): unknown {
  if (typeof value === 'string' && value in values) return values[value as keyof typeof values];
  return value;
}
```

### Wiring

Replace the identity resolver on the `ff` row in `STYLE_PROPS_DATA` with `fontFamilyResolver`.

### Tests

- `<Box ff="mono">` → resolved style includes `font-family: var(--font-family-mono)`.
- `<Box ff="sans">` → `var(--font-family-sans)`.
- `<Box ff="heading">` → `var(--font-family-heading)`.
- `<Box ff='"Inter", sans-serif'>` → passes through unchanged.
- `<Box ff="serif">` → passes through unchanged (not in the alias map).

### Soribashi divergence

- Mantine's `text` and `headings` keys map to `var(--mantine-font-family)` and `var(--mantine-font-family-headings)`. Soribashi's map: `text/sans` → `--font-family-sans`, `heading/headings` → `--font-family-heading`. TOKEN_DIFF per the substitution table.
- Soribashi adds `sans` as an alias (matches `tokens.fontFamily.sans` directly). Documented in the file's attribution header.

---

## 7. Item 5 — `borderResolver`

**Soribashi files:**
- Create: `packages/blocks/src/Box/style-props/resolvers/border-resolver.ts`
- Modify: `packages/blocks/src/Box/style-props/style-props-data.ts` (wire into `bd` row)
- Test: `packages/blocks/test/Box/border-resolver.test.ts` (new) + extend the existing Box style-props integration test

### Implementation

```ts
import { rem } from '../../../utils/rem.ts';
import { getThemeColor } from '../../../utils/get-theme-color.ts';

export function borderResolver(value: unknown): unknown {
  if (typeof value === 'number') return rem(value);
  if (typeof value === 'string') {
    const parts = value.split(' ').filter((v) => v.trim() !== '');
    if (parts.length === 0) return value;
    const [size, style, ...colorTuple] = parts;
    const sizeOut = rem(size as string | number) ?? size;
    let result = String(sizeOut);
    if (style) result += ` ${style}`;
    if (colorTuple.length > 0) {
      const resolved = getThemeColor(colorTuple.join(' '));
      if (resolved !== undefined) result += ` ${resolved}`;
    }
    return result.trim();
  }
  return value;
}
```

### Wiring

Replace the identity resolver on the `bd` row in `STYLE_PROPS_DATA` with `borderResolver`.

### Tests

- `<Box bd={1}>` → `0.0625rem`.
- `<Box bd="1px solid primary.500">` → `0.0625rem solid var(--color-primary-500)`.
- `<Box bd="2px dashed surface.raised">` → `0.125rem dashed var(--surface-raised)` (semantic token via dot-path).
- `<Box bd="1px solid red">` → `0.0625rem solid var(--color-red-500)` (CSS-keyword-looking strings are token-resolved per `getThemeColor`'s heuristic).
- `<Box bd="1px solid #abc">` → `0.0625rem solid #abc` (hex passes through `getThemeColor`).
- `<Box bd="none">` → `none`. `rem("none")` passes the string through unchanged (per the rem implementation), so the resolver returns `"none"` as the sole `size` part. No color/style segments to process.
- `<Box bd="1px solid var(--my-color)">` → `0.0625rem solid var(--my-color)`.

### Soribashi divergence from Mantine

- Mantine's signature: `(value, theme) => string`. Soribashi's: `(value) => unknown`. The `theme` arg is unnecessary — `getThemeColor` resolves to CSS variable references that the runtime resolves at paint time.
- Color syntax: soribashi uses `primary.500` (50-950 shade scale); Mantine uses `primary.5` (0-9). Inherited from the existing `getThemeColor` contract.
- Documented as INTENTIONAL in a new ledger entry.

---

## 8. Test Strategy

| Item | Unit tests | Integration tests | Type-only tests |
|---|---|---|---|
| 1 CompoundStylesApiProps | — | — | 1 |
| 2 removeDefaultVariables | ~6 | 2 (via `emitCss`) | — |
| 3 cssVariablesResolver | — | ~4 (via `emitCss`) | — |
| 4 fontFamilyResolver | ~5 | 1 (via Box render) | — |
| 5 borderResolver | ~8 | 1 (via Box render) | — |
| **Total** | ~19 | ~8 | 1 |

All run under existing `bunx vitest run`. No new test infrastructure required.

---

## 9. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| `removeDefaultVariables` deep-equality on nested token shapes (`heading.sizes.h1.{fontSize, fontWeight, lineHeight}`) is fiddly | Treat each leaf string as the unit. One test case per token shape with at least one leaf differing. |
| `cssVariablesResolver` lets consumers emit invalid CSS (typos, undefined references) | Codegen does not validate user-emitted vars. Document in the ledger. Same convention as user-defined token values today. |
| Items 4/5 conflict with current `ff` / `bd` rows in `STYLE_PROPS_DATA` (identity resolvers per the audit) | Replace identity with the new resolvers. Update any tests that asserted identity behavior to assert the new resolver output. |
| `getThemeColor` is in `@soribashi/blocks/utils` — `borderResolver` lives in `@soribashi/blocks/Box/style-props/resolvers` and imports it. Local import path is fine within the same package. | No mitigation needed; just confirm the relative import works. |
| User's `soribashi.config.ts` could declare conflicting options across multiple call sites | Document precedence: explicit `emitCss(theme, opts)` args win over `soribashi.config.ts`. Test the precedence. |

---

## 10. Acceptance Criteria

The work is complete when:

1. `CompoundStylesApiProps<P>` is exported from `@soribashi/factory` and used in at least one type-fixture test that compiles.
2. `emitCss(theme, { removeDefaultVariables: true })` produces a strictly smaller CSS file for any theme that overlaps with defaults.
3. `emitCss(theme, { cssVariablesResolver: (t) => ({ root, dark, scopes }) })` emits the resolver's vars in the right blocks.
4. `<Box ff="mono">` renders with `font-family: var(--font-family-mono)`. `<Box ff="serif">` passes through.
5. `<Box bd="1px solid primary.500">` resolves to `0.0625rem solid var(--color-primary-500)`.
6. `bunx vitest run` clean.
7. `bun run typecheck` clean.
8. `bun run --filter @soribashi/playground build` clean.
9. `bun run test:browser` clean (existing 46 tests still pass).
10. Coverage manifest updated with rows for any new files.
11. Divergence ledger updated with the soribashi-divergent borderResolver signature and the codegen-time vs render-time `cssVariablesResolver` note.
12. Roadmap doc updated: items marked done, with pointers to the merged commits.

---

## 11. Out of Scope

Explicitly NOT in this batch:

- Any other roadmap item (`mergeThemeOverrides`, `defaultGradient`, `autoContrast`, `useMantineEnv`, `CompoundStylesApiProps` consumers like Tabs / Accordion themselves, `HeadlessMantineProvider`, `sortMediaQueries` standalone, `VarsResolver` types).
- Runtime variant of `cssVariablesResolver` (Mantine's render-time injection — soribashi codegen has no render-time injection point).
- Adapter from Mantine's `(value, theme)` resolver signature to soribashi's `(value)` — `getThemeColor` works without theme.
- Validation / linting of user-emitted CSS variables (consumer's responsibility).

---

## 12. Hard Rules

1. **No deviation from Mantine semantics without a ledger entry.** Every divergence (signature change, syntax change, scope difference) gets a ledger entry under "Full audit pass — 2026-04-25" or a new "Roadmap Batch 1 — 2026-04-25" sub-section.
2. **TDD discipline.** Failing test before implementation. Same standard as the audit pass.
3. **No deprecation shims.** When `STYLE_PROPS_DATA`'s `ff` / `bd` rows switch from identity to typed resolvers, any test that assumed identity is updated to the new behavior — no aliasing.
4. **Coverage manifest stays current.** New files (`remove-default-variables.ts`, `font-family-resolver.ts`, `border-resolver.ts`) get manifest rows.
5. **Atomic commits per item.** Five logical commits (or commit groups). Item 5's `STYLE_PROPS_DATA` wiring may be a separate commit from the resolver implementation if needed for TDD bisecting.
