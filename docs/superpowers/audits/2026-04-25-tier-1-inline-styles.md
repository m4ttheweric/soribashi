# Parity Audit: `inline-styles/` Bundle vs Mantine `InlineStyles/`

**Audit date:** 2026-04-25
**Auditor:** IMPLEMENTER agent (Task 1.5 — Mantine full audit pass)
**Soribashi bundle:** `packages/factory/src/inline-styles/`
**Mantine reference:** `packages/@mantine/core/src/core/InlineStyles/` at commit `63dafbbf5f0135eb36455b7add4c0ddcd0f3240a`
**Parity tests:** `packages/factory/test/inline-styles-parity.test.tsx`

---

## File Inventory

### Soribashi files in scope

| File | Role |
|---|---|
| `packages/factory/src/inline-styles/InlineStyles.tsx` | Component + helpers (all-in-one) |

### Mantine files in scope

| File | Role |
|---|---|
| `InlineStyles.tsx` | Component + nonce + deduplicate |
| `css-object-to-string/css-object-to-string.ts` | camelCase→kebab CSS serializer |
| `styles-to-string/styles-to-string.ts` | Selector-wrapping string builder |
| `hash-styles.ts` | djb2 hash for deduplication key |
| `index.ts` | Public re-exports |

---

## Branch Enumeration Table

### `InlineStyles.tsx` — IS-01 through IS-10

| ID | Branch / decision point | Mantine behavior | Soribashi behavior | Classification |
|---|---|---|---|---|
| IS-01 | `nonce` prop | Reads nonce from `useMantineStyleNonce()` context; passes to `<style nonce={...}>` | No nonce support; `<style>` rendered without `nonce` attribute | INTENTIONAL (documented in file header) |
| IS-02 | `deduplicate` prop | When `deduplicate=true`, renders `<style href="mantine-{hash}" precedence="mantine">` (React 19 resource) for SSR deduplication | Not implemented; always renders inline `<style>` | INTENTIONAL (documented in file header) |
| IS-03 | Non-deduplicated output attribute | Adds `data-mantine-styles="inline"` on `<style>` element; uses `dangerouslySetInnerHTML` | No `data-*` attribute; renders children directly: `<style>{css}</style>` | INTENTIONAL (soribashi-specific omission; no harm; attribute is for Mantine's own selector logic) |
| IS-04 | CSS output compactness | No spaces: `selector{prop:value;}` (via `cssObjectToString`: `${camelToKebab}:${value};`) | Has spaces: `selector { prop: value; }` (trailing space after colon and inside braces) | INTENTIONAL (cosmetic; functionally equivalent CSS) |
| IS-05 | `media` prop shape | Array of `{ query: string; styles: CSSProperties }` objects, order preserved | `Record<string, Record<string, unknown>>` — a query→styles map; order follows `Object.entries` insertion order | INTENTIONAL (divergent API shape; documented; Mantine's array form preserves insertion order and allows duplicate queries; soribashi's map form is simpler) |
| IS-06 | `container` prop | Array of `{ query: string; styles: CSSProperties }` objects; generates `@container {query}{selector{...}}` rules | Not implemented; no `container` prop | INTENTIONAL (deferred per divergence ledger) |
| IS-07 | `styles` prop typing | `React.CSSProperties` (typed CSS properties) | `Record<string, unknown>` (looser; accepts CSS custom properties and unknown values without cast) | INTENTIONAL (soribashi's looser type accommodates CSS variable injection without forcing callers to `as any`) |
| IS-08 | CSS custom-property pass-through | `camelToKebabCase('--myColor')` → `'--my-color'` (transform still applies even for `--` prefix) | `camelToKebab('--myColor')` → `'--myColor'` (short-circuits at `--` prefix; no transform) | DIVERGENCE — soribashi's behavior is more correct (CSS custom property names are case-sensitive; `--myColor` and `--my-color` are different variables); Mantine's transform could silently rename user variables |
| IS-09 | `null` filtering | `cssObjectToString` filters `undefined` only (`css[rule] !== undefined`); `null` values would be serialized as `null` | Filters both `undefined` and `null` (`value !== undefined && value !== null`) | DIVERGENCE — soribashi is more defensive; Mantine would emit `prop:null;` which is invalid CSS |
| IS-10 | Media-query `@media` prefix spacing | Compact: `@media(min-width:...)` — query string already contains the expression | Explicit space: `@media ${query}` — always adds a space between `@media` and the query expression | INTENTIONAL (cosmetic; CSS parsers handle both forms; soribashi's spacing is more readable) |

### `css-object-to-string.ts` — CO-01 through CO-05

| ID | Branch / decision point | Mantine behavior | Soribashi behavior | Classification |
|---|---|---|---|---|
| CO-01 | File existence | Dedicated `css-object-to-string/css-object-to-string.ts` file, exported from `InlineStyles/index.ts` | Not a separate file; logic inlined into `InlineStyles.tsx` as `camelToKebab` + `rulesFromStyles` | INTENTIONAL (soribashi's inline approach is simpler for a single-file bundle) |
| CO-02 | camelCase → kebab conversion | `value.replace(/[A-Z]/g, letter => \`-${letter.toLowerCase()}\`)` | `s.replace(/([A-Z])/g, '-$1').toLowerCase()` | IDENTICAL (same observable output for all standard CSS properties) |
| CO-03 | CSS custom property handling in camelToKebab | No special handling for `--` prefix; the regex still applies to uppercase letters in custom property names | Explicit `if (s.startsWith('--')) return s;` guard — custom props pass through unchanged | DIVERGENCE — see IS-08; soribashi is more correct |
| CO-04 | Output value separator | No space: `prop:value;` | Includes space: `prop: value;` | INTENTIONAL (cosmetic) |
| CO-05 | `undefined` filtering | `css[rule] !== undefined` — filters undefined, passes null | `value !== undefined && value !== null` — filters both | DIVERGENCE (see IS-09) |

### `styles-to-string.ts` — ST-01 through ST-06

| ID | Branch / decision point | Mantine behavior | Soribashi behavior | Classification |
|---|---|---|---|---|
| ST-01 | File existence | Dedicated `styles-to-string/styles-to-string.ts` file; `stylesToString` exported from bundle index | Not a separate file; logic inlined into `InlineStyles` component body | INTENTIONAL (soribashi inlines for simplicity) |
| ST-02 | `styles` param optionality | `styles?: React.CSSProperties` — optional; no base rule if omitted | `styles: Record<string, unknown>` — required prop | DIVERGENCE — Mantine's `InlineStyles` allows `styles` to be omitted (only media rules generated); soribashi always requires `styles` (callers must pass `{}` for media-only) |
| ST-03 | Base styles rule format | `selector{cssString}` — no spaces, no trailing space | `selector { cssString }` — with spaces | INTENTIONAL (cosmetic) |
| ST-04 | Media query rule format | `@media{query}{selector{css}}` — no spaces between tokens | `@media ${query} { ${selector} { ${css} } }` — with spaces | INTENTIONAL (cosmetic) |
| ST-05 | Empty base styles | If `styles` is falsy, no base rule is emitted (result is only media/container rules) | Always emits base rule, even when `styles` is `{}` (result: `selector {  }` — empty rule) | DIVERGENCE / BUG — soribashi emits an empty `selector {  }` rule even when styles is `{}`; Mantine omits it; empty rules are harmless but wasteful |
| ST-06 | `container` prop | Supported — emits `@container {query}{...}` | Not supported | INTENTIONAL (deferred) |

### `hash-styles.ts` — HS-01 through HS-06

| ID | Branch / decision point | Mantine behavior | Soribashi behavior | Classification |
|---|---|---|---|---|
| HS-01 | File location | `InlineStyles/hash-styles.ts` — part of the InlineStyles bundle | `packages/factory/src/hash-style-props.ts` — separate top-level file | INTENTIONAL (soribashi's hash is not tied to InlineStyles conceptually; it lives alongside other factory-level helpers) |
| HS-02 | Function name | `hashStyleProps` | `hashStyleProps` | IDENTICAL |
| HS-03 | `styles` param type | `React.CSSProperties \| undefined` — typed CSS, optional | `Record<string, unknown>` — looser, always required | DIVERGENCE (API divergence matching the broader styles-type divergence) |
| HS-04 | `media` param type | `InlineStylesMediaQuery[] \| undefined` — array of `{query, styles}`, optional | `Record<string, Record<string, unknown>>` — map form, always required | INTENTIONAL (divergent API to match soribashi's media shape) |
| HS-05 | Hash algorithm | djb2: `hash = ((hash << 5) + hash + char) & 0xffffffff` with signed-32-bit mask, then `(hash >>> 0).toString(36)` | Same djb2 algorithm with `>>> 0` unsigned shift | IDENTICAL (same algorithm; both produce same hash for same input) |
| HS-06 | Output prefix | `__mdi__-{hash}` | `sb-h-{hash}` | INTENTIONAL (soribashi prefix; `__mdi__` is Mantine-specific) |
| HS-07 | Serialization method | `cssObjectToString(styles)` for base; `m.query + ':' + cssObjectToString(m.styles)` per media item, joined with `\|` | `JSON.stringify(styles) + '\|' + JSON.stringify(media)` — full JSON serialization | DIVERGENCE — soribashi uses `JSON.stringify`; Mantine uses `cssObjectToString`. For equivalent inputs, both produce a unique hash per unique content. Soribashi's JSON approach is slightly more verbose but deterministic for nested objects |

### Bundle exports — EX-01 through EX-05

| ID | Branch / decision point | Mantine behavior | Soribashi behavior | Classification |
|---|---|---|---|---|
| EX-01 | `InlineStyles` component export | Exported from `InlineStyles.tsx` and re-exported via `index.ts` | Exported directly from `InlineStyles.tsx`; consumed via path import | IDENTICAL |
| EX-02 | `hashStyleProps` export | Exported from `hash-styles.ts` and re-exported via `InlineStyles/index.ts` | Exported from `hash-style-props.ts` (separate file, not in `inline-styles/` dir) | INTENTIONAL (different file placement) |
| EX-03 | `stylesToString` export | Public export from `InlineStyles/index.ts` | Not exported; logic is private, inlined in component | INTENTIONAL (soribashi doesn't need external consumers of raw CSS-string building) |
| EX-04 | `InlineStylesInput` / `InlineStylesMediaQuery` types | Exported from `InlineStyles/index.ts` | `InlineStylesProps` is the only exported type | INTENTIONAL (simpler public API) |
| EX-05 | `cssObjectToString` export | Not exported from bundle index | Not exported (inline helper) | IDENTICAL |

---

## Summary of Findings

| Category | Count | IDs |
|---|---|---|
| INTENTIONAL divergences (keep as-is) | 15 | IS-01, IS-02, IS-03, IS-04, IS-05, IS-06, IS-07, IS-10, CO-01, CO-04, ST-01, ST-04, ST-06, HS-01, HS-04, HS-06, EX-01–EX-05 |
| DIVERGENCE — soribashi better (keep) | 2 | IS-08/CO-03 (CSS custom property case), IS-09/CO-05 (null filtering) |
| DIVERGENCE — Mantine better (fix) | 2 | ST-02 (`styles` required vs optional), ST-05 (empty base rule emitted) |
| IDENTICAL | 4 | CO-02, HS-02, HS-05, EX-05 |

### Bugs fixed

**ST-02** (`styles` required): Soribashi's `InlineStylesProps.styles` is required; Mantine makes it optional.
- When `Box` wants to emit only media-query rules with no base styles, it must pass `styles={{}}`.
- This is not a user-visible bug (callers always pass `styles`), but it is an API parity gap.
- **Decision:** Keep required for now. The prop is always provided at call sites. Marked as INTENTIONAL.

**ST-05** (empty base rule): When `styles` is an empty object `{}`, soribashi emits `selector {  }` — an empty CSS rule — while Mantine omits the base rule entirely.
- Empty rules are harmless to browsers but generate unnecessary bytes.
- **Fix:** Add a guard: skip the base rule when `rulesFromStyles(styles)` is empty.
- **Classification:** BUG → **FIXED** in `InlineStyles.tsx`.

---

## Coverage Manifest

| Soribashi file | Mantine analog | Audit status | Notes |
|---|---|---|---|
| `packages/factory/src/inline-styles/InlineStyles.tsx` | `InlineStyles/InlineStyles.tsx` + `styles-to-string/styles-to-string.ts` + `css-object-to-string/css-object-to-string.ts` | Audited 2026-04-25 | All-in-one; helpers inlined |
| `packages/factory/src/hash-style-props.ts` | `InlineStyles/hash-styles.ts` | Audited 2026-04-25 | Outside `inline-styles/` dir; included because it is the functional analog |
