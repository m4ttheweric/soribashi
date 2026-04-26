# Tier 1 Audit — `hash-style-props.ts` + `use-random-class-name.ts`

**Audit date:** 2026-04-25
**Auditor:** IMPLEMENTER agent (Task 1.6 — Mantine full audit pass)
**Pinned to:** `mantinedev/mantine@63dafbbf5f0135eb36455b7add4c0ddcd0f3240a`

## Files in scope

| Soribashi file | Mantine analog |
|---|---|
| `packages/factory/src/hash-style-props.ts` | `packages/@mantine/core/src/core/InlineStyles/hash-styles.ts` |
| `packages/factory/src/use-random-class-name.ts` | `packages/@mantine/core/src/core/Box/use-random-classname/use-random-classname.ts` |

---

## Part 1 — `use-random-class-name.ts`

### Hook-replacement determination

Per the Task 1.6 spec, the first step is to check whether `@mantine/hooks` exports `useRandomClassName`.

**Search result:**

```bash
grep -r "useRandomClassName\|RandomClassName\|random-class" \
  /Users/matt/Documents/GitHub/mantine/packages/@mantine/hooks/src/ 2>&1
# → (empty)
```

`useRandomClassName` is **NOT exported by `@mantine/hooks`**. It lives only inside
`@mantine/core/src/core/Box/use-random-classname/` (not in the public hooks package).

**Decision: soribashi KEEPS its own implementation.** No hook replacement. Classification
proceeds to `IDENTICAL` / `TOKEN_DIFF` / `INTENTIONAL` per the per-file recipe.

### Mantine source — `use-random-classname.ts` (complete)

```ts
import { useId } from 'react';

export function useRandomClassName() {
  const id = useId().replace(/[:«»]/g, '');
  return `__m__-${id}`;
}
```

6 lines. Calls `React.useId()`, strips invalid CSS-class characters (colons + React 19
guillemet markers), returns with `__m__-` prefix.

### Soribashi source — `use-random-class-name.ts` (complete)

```ts
import { useId } from 'react';

export function stripIdMarkers(id: string): string {
  return id.replace(/[:«»]/g, '');
}

export function useRandomClassName(): string {
  const id = useId();
  return `sb-${stripIdMarkers(id)}`;
}
```

Splits into two exported functions. `stripIdMarkers` is extracted purely for testability.

### Decision-point enumeration

| # | Mantine line(s) | Decision / branch | Soribashi behavior | Classification |
|---|---|---|---|---|
| U1 | `use-random-classname.ts:1` | `useId` imported from `'react'` | Same | `IDENTICAL` |
| U2 | `use-random-classname.ts:3` | `useRandomClassName` is the single export | Exports two symbols: `useRandomClassName` + `stripIdMarkers` | `INTENTIONAL` — extra export for testability |
| U3 | `use-random-classname.ts:4` | `.replace(/[:«»]/g, '')` inlined in the function body | Same regex, extracted to `stripIdMarkers` helper (same regex: `/[:«»]/g`) | `IDENTICAL` (observable behavior) |
| U4 | `use-random-classname.ts:5` | Output prefix `__m__-` | Output prefix `sb-` | `TOKEN_DIFF` — prefix follows soribashi naming convention (same as `sb-h-` prefix in `hashStyleProps`) |
| U5 | (both) | No explicit React 19 guillemet handling call-out | Comment in soribashi file header explains React 18 vs React 19 ID format | `IDENTICAL` (same regex handles both) |
| U6 | (both) | No unit test for the inline `.replace` in Mantine | Mantine has its own test `use-random-classname.test.ts`; soribashi splits the regex into `stripIdMarkers` and tests it in `use-random-class-name.test.ts` | `INTENTIONAL` — soribashi extension (testability) |

### Findings

- **No `BUG`, `HALLUCINATION`, `INCONSISTENCY`, or `HOOK_REIMPL`** findings.
- U2 + U6: `stripIdMarkers` is a soribashi-only addition; it is a testability aid with no Mantine equivalent. Classified `INTENTIONAL`. Already reflected in the post-adaptation validation pass ledger entry #12.
- U4: Prefix `sb-` vs `__m__-` is a `TOKEN_DIFF`, consistent with the substitution table.

**Coverage manifest status: `intentional divergence`** (prefix + stripIdMarkers extraction).

---

## Part 2 — `hash-style-props.ts`

This file was partially covered by Task 1.5 (HS-01 through HS-07). Task 1.6 re-walks every
branch at the factory-root level (as opposed to the InlineStyles-bundle scope of Task 1.5)
and confirms or extends each finding.

### Mantine source — `hash-styles.ts` (complete)

```ts
import { cssObjectToString } from './css-object-to-string/css-object-to-string';
import type { InlineStylesMediaQuery } from './styles-to-string/styles-to-string';

function djb2Hash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0xffffffff;
  }
  return (hash >>> 0).toString(36);
}

export function hashStyleProps(
  styles: React.CSSProperties | undefined,
  media: InlineStylesMediaQuery[] | undefined
): string {
  const stylesStr = styles ? cssObjectToString(styles) : '';
  const mediaStr = Array.isArray(media)
    ? media.map((m) => `${m.query}:${cssObjectToString(m.styles)}`).join('|')
    : '';
  return `__mdi__-${djb2Hash(`${stylesStr}|${mediaStr}`)}`;
}
```

### Soribashi source — `hash-style-props.ts` (complete)

```ts
function hash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}

export function hashStyleProps(
  styles: Record<string, unknown>,
  media: Record<string, Record<string, unknown>>,
): string {
  const serialized = JSON.stringify(styles) + '|' + JSON.stringify(media);
  return `sb-h-${hash(serialized)}`;
}
```

### Decision-point enumeration

| # | Mantine line(s) | Decision / branch | Soribashi behavior | Classification |
|---|---|---|---|---|
| H1 | `hash-styles.ts:1-2` | Imports `cssObjectToString` and `InlineStylesMediaQuery` | No imports (self-contained; uses `JSON.stringify`) | `INTENTIONAL` — soribashi's serialization strategy removes the dep on `cssObjectToString` |
| H2 | `hash-styles.ts:4-9` | djb2 inner loop: `hash = ((hash << 5) + hash + charCode) & 0xffffffff` (signed 32-bit mask) then `(hash >>> 0).toString(36)` | Same djb2 seed (5381) and loop; inner operation uses `>>> 0` directly: `h = ((h << 5) + h + charCode) >>> 0` | `IDENTICAL` — `x & 0xffffffff` followed by `>>> 0` produces the same unsigned result as `x >>> 0` applied once. Verified by running both with test strings. |
| H3 | `hash-styles.ts:11` | `styles: React.CSSProperties \| undefined` — typed CSS, optional | `styles: Record<string, unknown>` — looser, always required | `INTENTIONAL` (HS-03 from Task 1.5; API divergence matching broader styles-type convention) |
| H4 | `hash-styles.ts:12` | `media: InlineStylesMediaQuery[] \| undefined` — array of `{query, styles}`, optional | `media: Record<string, Record<string, unknown>>` — map form, always required | `INTENTIONAL` (HS-04 from Task 1.5; API divergence matching soribashi's media shape) |
| H5 | `hash-styles.ts:14` | `styles ? cssObjectToString(styles) : ''` — serializes via CSS string (`prop:value;` format); short-circuits on falsy `styles` | `JSON.stringify(styles)` — full JSON; no short-circuit needed (always a defined object at runtime) | `INTENTIONAL` (HS-07 from Task 1.5; different serialization; both uniquely identify content) |
| H6 | `hash-styles.ts:15-17` | `Array.isArray(media) ? media.map(m => m.query+':'+cssObjectToString(m.styles)).join('|') : ''` — handles undefined; ordered by insertion | `JSON.stringify(media)` — serializes the whole Record; order follows insertion order of JS object keys | `INTENTIONAL` (HS-04/HS-07; map form vs array form; both produce unique strings for unique content) |
| H7 | `hash-styles.ts:18` | Output prefix `__mdi__-` | Output prefix `sb-h-` | `TOKEN_DIFF` (HS-06 from Task 1.5; soribashi prefix convention) |
| H8 | (both) | Stability under key reordering: Mantine's `cssObjectToString` iterates `Object.keys(styles)` in insertion order; reordering keys produces different strings → different hash | Soribashi's `JSON.stringify` also iterates `Object.keys` in insertion order; same sensitivity to key order | `IDENTICAL` — neither implementation normalizes key order; both treat `{a:1,b:2}` and `{b:2,a:1}` as different inputs. This is intentional: style objects are built deterministically by `parseStyleProps`, so key order is stable. |
| H9 | (both) | Collision handling: none. Pure positional hash. No linked-list or chaining | Same — no collision handling. Hash is used as a CSS class identifier, not a lookup key. Collisions are cosmetically visible (two different style sets sharing one class) but not functionally broken (both render into the same `<InlineStyles>` block, last-write wins for CSS cascade order). | `IDENTICAL` — neither adds collision handling; same risk profile |
| H10 | `hash-styles.ts` | Function name `hashStyleProps` | Function name `hashStyleProps` | `IDENTICAL` (HS-02 from Task 1.5) |
| H11 | `hash-styles.ts` | File location inside `InlineStyles/` bundle | File at `packages/factory/src/hash-style-props.ts` (factory root, separate file) | `INTENTIONAL` (HS-01 from Task 1.5; organizational choice) |

### Findings

- **No `BUG`, `HALLUCINATION`, `INCONSISTENCY`, or `HOOK_REIMPL`** findings.
- H2: The hash algorithm is `IDENTICAL` despite different parenthesization. Verified computationally.
- H5–H6: JSON serialization vs `cssObjectToString` is an `INTENTIONAL` divergence. Both are deterministic for the same input; collision risk is equivalent.
- H8: Neither implementation is stable under key reordering. This is acceptable because `parseStyleProps` builds the style object deterministically.
- All HS-0x entries from Task 1.5 are **confirmed** and do not require changes.

**Coverage manifest status: `intentional divergence`** (serialization method, types, prefix, file location).

---

## Summary of all findings (both files)

| ID | File | Classification | Description | Fix? |
|---|---|---|---|---|
| U1 | `use-random-class-name.ts` | `IDENTICAL` | `useId` import from `'react'` | — |
| U2 | `use-random-class-name.ts` | `INTENTIONAL` | `stripIdMarkers` exported separately for testability | Keep |
| U3 | `use-random-class-name.ts` | `IDENTICAL` | Same regex `/[:«»]/g` strips invalid class-name chars | — |
| U4 | `use-random-class-name.ts` | `TOKEN_DIFF` | Prefix `sb-` vs `__m__-` | Keep |
| U5 | `use-random-class-name.ts` | `IDENTICAL` | Regex covers both React 18 (`:`) and React 19 (`«»`) IDs | — |
| H2 | `hash-style-props.ts` | `IDENTICAL` | djb2 algorithm produces same hash as Mantine | — |
| H3 | `hash-style-props.ts` | `INTENTIONAL` | `styles` type `Record<string,unknown>` vs `CSSProperties\|undefined` | Keep |
| H4 | `hash-style-props.ts` | `INTENTIONAL` | `media` type Record vs array | Keep |
| H5–H6 | `hash-style-props.ts` | `INTENTIONAL` | JSON.stringify vs cssObjectToString serialization | Keep |
| H7 | `hash-style-props.ts` | `TOKEN_DIFF` | Prefix `sb-h-` vs `__mdi__-` | Keep |
| H8 | `hash-style-props.ts` | `IDENTICAL` | Key-order sensitivity (same for both) | — |
| H9 | `hash-style-props.ts` | `IDENTICAL` | No collision handling in either | — |

**No bugs found. No hook replacements. No fixes required.**

---

## Hook-replacement verdict

`useRandomClassName` is **not** in `@mantine/hooks`; it lives only in `@mantine/core`.
Hard Rule 14 permits importing from `@mantine/hooks` only. Since the upstream lives in
`@mantine/core`, soribashi's own implementation must be kept. No replacement performed.

---

## Parity tests

Located at: `packages/factory/test/hash-and-classname-parity.test.tsx`

See that file for:
- `use-random-class-name.ts`: U2 (`stripIdMarkers` isolation), U3 (regex coverage),
  U4 (prefix), stable-per-instance, CSS-safe output.
- `hash-style-props.ts`: H2 (hash determinism), H5/H6 (different inputs → different hashes),
  H7 (prefix), H8 (key-order sensitivity), H9 (no collision handling needed — deterministic
  inputs confirmed).
