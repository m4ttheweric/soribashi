# CSS Parity Audit: soribashi blocks vs. Mantine

**Generated:** 2026-04-25
**Mantine commit:** `63dafbbf`
**Script:** `packages/blocks/scripts/css-parity-audit.ts`

---

## Legend

| Kind | Meaning |
|------|---------|
| `IDENTICAL` | Post-normalization, all declarations match |
| `TOKEN_DIFF` | Declarations differ only in token substitution (per spec § 4) |
| `SELECTOR_DIFF` | Same declarations, different selector specificity |
| `DECL_DIFF` | Declaration set differs in a way not explained by tokens |
| `MISSING_IN_SORIBASHI` | Mantine has a rule with no soribashi equivalent |
| `EXTRA_IN_SORIBASHI` | soribashi has a rule with no Mantine equivalent |

---

## Top-level Summary

**Total rules examined:** 39  
**IDENTICAL:** 28  
**TOKEN_DIFF:** 1  
**SELECTOR_DIFF:** 0  
**DECL_DIFF (action required):** 5  
**MISSING_IN_SORIBASHI (action required):** 5  
**EXTRA_IN_SORIBASHI (additions):** 5  

---

## Per-Block Summary

| Block | IDENTICAL | TOKEN_DIFF | SELECTOR_DIFF | DECL_DIFF | MISSING | EXTRA |
|-------|-----------|------------|---------------|-----------|---------|-------|
| Box | 0 | 0 | 0 | 0 | 0 | 1 |
| Stack | 1 | 0 | 0 | 0 | 0 | 0 |
| Group | 2 | 0 | 0 | 0 | 0 | 0 |
| Flex | 0 | 0 | 0 | 1 | 0 | 0 |
| Grid | 3 | 0 | 0 | 0 | 1 | 0 |
| GridCol | 1 | 0 | 0 | 0 | 0 | 0 |
| SimpleGrid | 0 | 0 | 0 | 1 | 3 | 2 |
| Container | 6 | 0 | 0 | 0 | 1 | 1 |
| Center | 2 | 0 | 0 | 0 | 0 | 0 |
| AspectRatio | 3 | 0 | 0 | 0 | 0 | 0 |
| Space | 0 | 0 | 0 | 0 | 0 | 1 |
| Paper | 2 | 1 | 0 | 1 | 0 | 0 |
| Text | 7 | 0 | 0 | 1 | 0 | 0 |
| Title | 1 | 0 | 0 | 1 | 0 | 0 |

---

## Box

**Summary:** IDENTICAL: 0 / TOKEN_DIFF: 0 / SELECTOR_DIFF: 0 / DECL_DIFF: 0 / MISSING: 0 / EXTRA: 1

### EXTRA_IN_SORIBASHI — soribashi additions

| Soribashi selector | Declarations |
|-------------------|--------------|
| `.root` |   box-sizing: border-box |

## Stack

**Summary:** IDENTICAL: 1 / TOKEN_DIFF: 0 / SELECTOR_DIFF: 0 / DECL_DIFF: 0 / MISSING: 0 / EXTRA: 0

No findings — all Mantine rules are present and match.

## Group

**Summary:** IDENTICAL: 2 / TOKEN_DIFF: 0 / SELECTOR_DIFF: 0 / DECL_DIFF: 0 / MISSING: 0 / EXTRA: 0

No findings — all Mantine rules are present and match.

## Flex

**Summary:** IDENTICAL: 0 / TOKEN_DIFF: 0 / SELECTOR_DIFF: 0 / DECL_DIFF: 1 / MISSING: 0 / EXTRA: 0

### DECL_DIFF — declaration mismatches

| Selector | Snippet |
|----------|---------|
| `.root` |   - mantine: (missing) ↵   + soribashi: flex-direction: var(--flex-direction, row) ↵   - mantine: (missing) ↵   + soribashi: flex-wrap: var(--flex-wrap, nowrap) ↵   - mantine: (missing) ↵   + soribashi: gap: var(--flex-gap) ↵   - mantine: (missing) ↵   + soribashi: row-gap: var(--flex-row-gap) ↵   - mantine: (missing) ↵   + soribashi: column-gap: var(--flex-column-gap) ↵   - mantine: (missing) ↵   + soribashi: align-items: var(--flex-align) |

## Grid

**Summary:** IDENTICAL: 3 / TOKEN_DIFF: 0 / SELECTOR_DIFF: 0 / DECL_DIFF: 0 / MISSING: 1 / EXTRA: 0

### MISSING_IN_SORIBASHI

| Mantine selector | Declarations |
|-----------------|--------------|
| `.container` |   container: mantine-grid / inline-size |

## GridCol

**Summary:** IDENTICAL: 1 / TOKEN_DIFF: 0 / SELECTOR_DIFF: 0 / DECL_DIFF: 0 / MISSING: 0 / EXTRA: 0

No findings — all Mantine rules are present and match.

## SimpleGrid

**Summary:** IDENTICAL: 0 / TOKEN_DIFF: 0 / SELECTOR_DIFF: 0 / DECL_DIFF: 1 / MISSING: 3 / EXTRA: 2

### DECL_DIFF — declaration mismatches

| Selector | Snippet |
|----------|---------|
| `.root` |   - mantine: grid-template-columns: repeat(var(--sg-cols), minmax(0, 1fr)) ↵   + soribashi: grid-template-columns: repeat(var(--sg-cols, 1), minmax(0, 1fr)) |

### MISSING_IN_SORIBASHI

| Mantine selector | Declarations |
|-----------------|--------------|
| `.container` |   container: simple-grid / inline-size |
| `.root[data-auto-cols="auto-fill"]` |   grid-template-columns: repeat(auto-fill, minmax(var(--sg-min-col-width), 1fr)) |
| `.root[data-auto-cols="auto-fit"]` |   grid-template-columns: repeat(auto-fit, minmax(var(--sg-min-col-width), 1fr)) |

### EXTRA_IN_SORIBASHI — soribashi additions

| Soribashi selector | Declarations |
|-------------------|--------------|
| `.root[data-auto-flow="auto-fill"]` |   grid-template-columns: repeat(auto-fill, minmax(var(--sg-min-col-width, 12rem), 1fr)) |
| `.root[data-auto-flow="auto-fit"]` |   grid-template-columns: repeat(auto-fit, minmax(var(--sg-min-col-width, 12rem), 1fr)) |

## Container

**Summary:** IDENTICAL: 6 / TOKEN_DIFF: 0 / SELECTOR_DIFF: 0 / DECL_DIFF: 0 / MISSING: 1 / EXTRA: 1

### MISSING_IN_SORIBASHI

| Mantine selector | Declarations |
|-----------------|--------------|
| `.root:where([data-strategy="block"]):where([data-fluid])` |   max-width: 100% |

### EXTRA_IN_SORIBASHI — soribashi additions

| Soribashi selector | Declarations |
|-------------------|--------------|
| `.root:where([data-strategy="block"][data-fluid])` |   max-width: 100% |

## Center

**Summary:** IDENTICAL: 2 / TOKEN_DIFF: 0 / SELECTOR_DIFF: 0 / DECL_DIFF: 0 / MISSING: 0 / EXTRA: 0

No findings — all Mantine rules are present and match.

## AspectRatio

**Summary:** IDENTICAL: 3 / TOKEN_DIFF: 0 / SELECTOR_DIFF: 0 / DECL_DIFF: 0 / MISSING: 0 / EXTRA: 0

No findings — all Mantine rules are present and match.

## Space

**Summary:** IDENTICAL: 0 / TOKEN_DIFF: 0 / SELECTOR_DIFF: 0 / DECL_DIFF: 0 / MISSING: 0 / EXTRA: 1

### EXTRA_IN_SORIBASHI — soribashi additions

| Soribashi selector | Declarations |
|-------------------|--------------|
| `(none)` | Space: no CSS file in either Mantine or soribashi — Space is implemented as a Box wrapper. This is intentional. |

## Paper

**Summary:** IDENTICAL: 2 / TOKEN_DIFF: 1 / SELECTOR_DIFF: 0 / DECL_DIFF: 1 / MISSING: 0 / EXTRA: 0

### DECL_DIFF — declaration mismatches

| Selector | Snippet |
|----------|---------|
| `.root` |   - mantine: (missing) ↵   + soribashi: --paper-border-color: var(--color-neutral-200) |

### TOKEN_DIFF — expected token substitutions

| Mantine selector | Soribashi selector | Notes |
|-----------------|-------------------|-------|
| `:root .root` | `.root` | @mixin light → declarations found on root selector (.root) instead of :root scope |

## Text

**Summary:** IDENTICAL: 7 / TOKEN_DIFF: 0 / SELECTOR_DIFF: 0 / DECL_DIFF: 1 / MISSING: 0 / EXTRA: 0

### DECL_DIFF — declaration mismatches

| Selector | Snippet |
|----------|---------|
| `.root` |   - mantine: font-weight: var(--font-weight-regular) ↵   + soribashi: font-weight: var(--font-weight-regular, 400) |

## Title

**Summary:** IDENTICAL: 1 / TOKEN_DIFF: 0 / SELECTOR_DIFF: 0 / DECL_DIFF: 1 / MISSING: 0 / EXTRA: 0

### DECL_DIFF — declaration mismatches

| Selector | Snippet |
|----------|---------|
| `.root` |   - mantine: text-wrap: var(--title-text-wrap, var(--heading-text-wrap)) ↵   + soribashi: text-wrap: var(--title-text-wrap, var(--heading-text-wrap, wrap)) |
