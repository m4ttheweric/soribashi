# Vocabulary Rails Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the vocabulary rails architecture — `defineVocabulary()` tool, theme rename (`semantic` split into `vocabulary` + `semanticTokens`), `Recipe.extend()` replacing `withDefaults()`, `createSoribashiBuilders(theme)` factory, `vocabularyAxes` recipe opt-in, and dev-only Zod runtime validation — without yet migrating the pilot's three recipes (that's the next PR).

**Architecture:** Pure type-level + runtime-validation rails. Soribashi exports zero opinions on vocabulary values (no bare `Size` / `Intent` types reachable). The theme is the single source of truth for vocabulary values via `defineVocabulary()`. The factory's builders, when constructed via `createSoribashiBuilders(theme)`, inject vocabulary-typed props for opt-in axes and validate them at render time using Zod schemas registered from the theme. `Recipe.extend({ vocabulary: ... })` provides per-component overrides with both replace-mode (pass a `Vocabulary`) and extend-mode (pass `(current) => Vocabulary`) dispatch.

**Tech Stack:** TypeScript (strict + `noUncheckedIndexedAccess`), Zod 3.x (new runtime dep), React 18, Vite 5, Vitest 2, bun workspaces.

**Spec:** `docs/superpowers/specs/2026-05-12-vocabulary-rails-design.md`

**Baseline (must match before starting):**
- `bun run typecheck` clean
- `bun run --filter '@soribashi/*' test`:
  - `@soribashi/theme` — 62 passed
  - `@soribashi/codegen` — 137 passed
  - `@soribashi/factory` — 461 passed
  - `@soribashi/blocks` — 244 passed
- `cd apps/pilot && bunx vitest run` — 47 passed

After this plan completes: test counts grow (new tests for `defineVocabulary`, `extend()`, `createSoribashiBuilders`, Zod validation). Existing tests' counts may shift slightly as `semantic.*` → `vocabulary` + `semanticTokens` renames flow through. Pilot tests stay at 47 (pilot recipes are NOT migrated in this PR — only the pilot's `theme.ts` updates to keep building).

**Out of scope (deferred to the pilot-migration PR):**
- Pilot recipes (Button / Tooltip / Tabs) adopting `vocabularyAxes` and dropping their local `Intent` / `Variant` / `Size` declarations
- The pilot's `builders.ts` file calling `createSoribashiBuilders(theme)`
- Recipe-level vocabulary overrides for Tooltip + Tabs in the pilot's `theme.components`

---

## Phase A: defineVocabulary tool

The atomic unit of vocabulary declaration. Wraps Zod internally, returns a branded object that the rest of the system can recognize.

### Task 1: Add `defineVocabulary` to `@soribashi/theme` with tests

**Files:**
- Create: `packages/theme/src/define-vocabulary.ts`
- Create: `packages/theme/test/define-vocabulary.test.ts`
- Modify: `packages/theme/package.json` (add `zod` dependency)
- Modify: `packages/theme/src/index.ts` (export the new symbols)

- [ ] **Step 1.1: Add `zod` to `@soribashi/theme` dependencies**

Edit `packages/theme/package.json`. In the `"dependencies"` block (create the block if it doesn't exist), add:

```json
"dependencies": {
  "zod": "^3.23.0"
}
```

(If `"dependencies"` already exists with other entries, preserve them and add `zod` alongside.)

Then install:
```bash
cd /Users/matt/Documents/GitHub/soribashi/.claude/worktrees/vocabulary-rails-core
bun install
```
Expected: zod installed, lockfile updated. Confirm `bun pm ls @soribashi/theme | grep zod` shows it.

- [ ] **Step 1.2: Write the failing test**

Create `packages/theme/test/define-vocabulary.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { defineVocabulary } from '../src/define-vocabulary.ts';

describe('defineVocabulary', () => {
  it('returns an object with __vocab brand, schema, and values', () => {
    const v = defineVocabulary(['xs', 'sm', 'md']);
    expect(v.__vocab).toBe(true);
    expect(v.values).toEqual(['xs', 'sm', 'md']);
    expect(typeof v.schema.safeParse).toBe('function');
  });

  it('schema accepts declared values', () => {
    const v = defineVocabulary(['compact', 'standard', 'comfortable']);
    expect(v.schema.safeParse('compact').success).toBe(true);
    expect(v.schema.safeParse('standard').success).toBe(true);
    expect(v.schema.safeParse('comfortable').success).toBe(true);
  });

  it('schema rejects undeclared values', () => {
    const v = defineVocabulary(['safe', 'critical']);
    const result = v.schema.safeParse('warning');
    expect(result.success).toBe(false);
  });

  it('preserves literal types via const-asserted generic', () => {
    const v = defineVocabulary(['primary', 'secondary']);
    // The inferred type of values should be readonly ['primary', 'secondary'],
    // not readonly string[]. We can't directly assert types at runtime, but
    // we can verify by trying to safeParse — if the inferred enum is too wide,
    // safeParse would accept any string.
    expect(v.schema.safeParse('tertiary').success).toBe(false);
  });

  it('exposes the optional `type` phantom as undefined at runtime', () => {
    const v = defineVocabulary(['a', 'b']);
    // The `type` field is type-only (phantom); at runtime it's undefined.
    // This test exists to document the runtime contract.
    expect(v.type).toBeUndefined();
  });
});
```

- [ ] **Step 1.3: Verify the test fails**

```bash
cd /Users/matt/Documents/GitHub/soribashi/.claude/worktrees/vocabulary-rails-core
bun run --filter '@soribashi/theme' test 2>&1 | tail -20
```
Expected: failure — `defineVocabulary` is not defined yet.

- [ ] **Step 1.4: Implement `defineVocabulary`**

Create `packages/theme/src/define-vocabulary.ts`:

```ts
import { z } from 'zod';

/**
 * Branded vocabulary container. The product of `defineVocabulary()`.
 *
 * Conventions:
 *   - `__vocab` brand prevents arbitrary objects from being mistaken for vocabularies.
 *   - `schema` is a Zod enum that validates incoming values at render time.
 *   - `values` is the readonly tuple of accepted strings; preserved as literal types
 *     via the `const` modifier on the generic parameter.
 *   - `type` is a phantom (`undefined` at runtime); reachable only via TypeScript's
 *     `typeof vocab['type']` for type extraction.
 *
 * NOT directly constructible — consumers must go through `defineVocabulary()` so
 * the Zod schema and values stay in lockstep.
 */
export interface Vocabulary<T extends string = string> {
  readonly __vocab: true;
  readonly schema: z.ZodEnum<[T, ...T[]]>;
  readonly values: readonly T[];
  /** Phantom type — never set at runtime. Use `typeof vocab['type']` for type extraction. */
  readonly type?: T;
}

/**
 * The only sanctioned way to declare a vocabulary.
 *
 * The `const` modifier on the generic preserves literal types so
 * `defineVocabulary(['compact', 'standard'])` infers `Vocabulary<'compact' | 'standard'>`
 * rather than `Vocabulary<string>`. Consumers don't need to write `as const`.
 *
 * @example
 * const sizeVocab = defineVocabulary(['xs', 'sm', 'md', 'lg', 'xl']);
 * type Size = typeof sizeVocab['type'];  // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
 * sizeVocab.schema.safeParse('xs');  // { success: true, data: 'xs' }
 * sizeVocab.schema.safeParse('huge');  // { success: false, ... }
 */
export function defineVocabulary<const T extends string>(
  values: readonly [T, ...T[]],
): Vocabulary<T> {
  return {
    __vocab: true,
    schema: z.enum(values as unknown as [T, ...T[]]),
    values,
  };
}
```

- [ ] **Step 1.5: Export from `@soribashi/theme`**

In `packages/theme/src/index.ts`, add (preserve existing exports):

```ts
export { defineVocabulary } from './define-vocabulary.ts';
export type { Vocabulary } from './define-vocabulary.ts';
```

- [ ] **Step 1.6: Verify tests pass**

```bash
bun run --filter '@soribashi/theme' test 2>&1 | tail -10
```
Expected: all 5 new tests pass. Existing 62 theme tests still pass (total: 67).

- [ ] **Step 1.7: Typecheck**

```bash
bun run typecheck 2>&1 | tail -3
```
Expected: clean.

- [ ] **Step 1.8: Commit**

```bash
git add packages/theme/package.json bun.lock packages/theme/src/define-vocabulary.ts packages/theme/src/index.ts packages/theme/test/define-vocabulary.test.ts
git commit -m "$(cat <<'EOF'
feat(theme): add defineVocabulary() — the only sanctioned vocabulary constructor

Returns a branded { __vocab, schema, values, type } object. The schema
is a Zod enum derived from the same `values` tuple, so runtime validation
and the inferred TypeScript type are guaranteed to stay aligned.

The `const` modifier on the generic preserves literal types — callers
don't need `as const` to get a narrow union.

Refs: docs/superpowers/specs/2026-05-12-vocabulary-rails-design.md § 5
EOF
)"
```

---

### Task 2: Add internal default vocabularies (non-exported)

Defaults exist for ergonomics when the consumer omits an axis from `createTheme()`. They MUST NOT be exported — consumers reach them only through the tool.

**Files:**
- Create: `packages/theme/src/default-vocabularies.ts`

- [ ] **Step 2.1: Create the defaults module**

Create `packages/theme/src/default-vocabularies.ts`:

```ts
import { defineVocabulary, type Vocabulary } from './define-vocabulary.ts';

/**
 * Internal-only default vocabularies. Used by createTheme() when the consumer
 * omits an axis from `vocabulary`. NOT exported from `packages/theme/src/index.ts`
 * — consumers reach these values only by calling createTheme() without overriding
 * the relevant axis. There is no other path.
 *
 * Soribashi has no opinion on what these values should be. The defaults exist
 * solely so a consumer who hasn't yet declared their vocabulary can still get
 * a working theme.
 */

export const DEFAULT_VOCABULARIES = {
  size: defineVocabulary(['xs', 'sm', 'md', 'lg', 'xl']),
  intent: defineVocabulary([
    'primary',
    'neutral',
    'success',
    'warning',
    'danger',
    'info',
  ]),
  variant: defineVocabulary([
    'filled',
    'outline',
    'subtle',
    'ghost',
    'link',
  ]),
} as const satisfies Record<string, Vocabulary>;
```

- [ ] **Step 2.2: Confirm the module is NOT exported from the public barrel**

```bash
grep -n "default-vocabularies" packages/theme/src/index.ts || echo "(correctly NOT exported)"
```
Expected: `(correctly NOT exported)`.

- [ ] **Step 2.3: Verify the module loads correctly**

There's no test file — Task 5's `createTheme` updates will exercise these. For now, run the existing tests to confirm we haven't broken anything:

```bash
bun run --filter '@soribashi/theme' test 2>&1 | tail -5
```
Expected: 67 passed (62 original + 5 from Task 1).

- [ ] **Step 2.4: Typecheck**

```bash
bun run typecheck 2>&1 | tail -3
```
Expected: clean.

- [ ] **Step 2.5: Commit**

```bash
git add packages/theme/src/default-vocabularies.ts
git commit -m "$(cat <<'EOF'
feat(theme): add internal default vocabularies (size/intent/variant)

Used by createTheme() when the consumer omits an axis from `vocabulary`.
Intentionally NOT exported from the public barrel — consumers reach these
defaults only by calling createTheme() without overriding the relevant axis.
No bare-importable opinions.

Refs: docs/superpowers/specs/2026-05-12-vocabulary-rails-design.md § 5
EOF
)"
```

---

### Task 3: Re-export `defineVocabulary` from `@soribashi/core`

`@soribashi/core` is the consumer's main entry point. The vocab tool must be importable from there.

**Files:**
- Modify: `packages/core/src/index.ts`

- [ ] **Step 3.1: Add the re-export**

In `packages/core/src/index.ts`, find the existing `@soribashi/theme` re-export block (it currently re-exports `createTheme`, `defaultIntentResolver`, etc.). Add `defineVocabulary` and its type:

```ts
export { createTheme, defaultIntentResolver, defaultTokens, defaultDarkTokens, defineVocabulary } from '@soribashi/theme';

export type { ResolvedTheme, ThemeDefinition, IntentResolver, Vocabulary } from '@soribashi/theme';
```

(Preserve any other existing exports in those statements.)

- [ ] **Step 3.2: Verify typecheck**

```bash
bun run typecheck 2>&1 | tail -3
```
Expected: clean.

- [ ] **Step 3.3: Verify tests still pass**

```bash
bun run --filter '@soribashi/*' test 2>&1 | grep "Tests" | head -5
```
Expected: theme 67, codegen 137, factory 461, blocks 244.

- [ ] **Step 3.4: Commit**

```bash
git add packages/core/src/index.ts
git commit -m "$(cat <<'EOF'
feat(core): re-export defineVocabulary + Vocabulary from @soribashi/theme

Consumers reach defineVocabulary via @soribashi/core (their main entry).

Refs: docs/superpowers/specs/2026-05-12-vocabulary-rails-design.md § 5
EOF
)"
```

---

## Phase B: Theme structure rename

Split the old `semantic` field into `vocabulary` (enums) and `semanticTokens` (role aliases). Hard cutover — no back-compat shim. Pre-1.0; this is fine. All theme + codegen tests will need updating.

### Task 4: Add new `vocabulary` and `semanticTokens` field types to `ThemeDefinition`

**Files:**
- Modify: `packages/theme/src/types.ts`

- [ ] **Step 4.1: Read the current types file**

```bash
head -180 packages/theme/src/types.ts
```

Identify the `SemanticTokens` interface (currently around line 86) and the `ThemeDefinition` interface (currently around line 151).

- [ ] **Step 4.2: Add new type definitions, keep old types temporarily**

In `packages/theme/src/types.ts`, ABOVE the existing `SemanticTokens` interface, add:

```ts
import type { Vocabulary } from './define-vocabulary.ts';

/**
 * Per-axis vocabulary definitions. Each axis is optional in the input;
 * createTheme() fills missing axes from DEFAULT_VOCABULARIES.
 */
export interface ThemeVocabulary {
  size: Vocabulary;
  intent: Vocabulary;
  variant: Vocabulary;
}

export type PartialThemeVocabulary = {
  size?: Vocabulary;
  intent?: Vocabulary;
  variant?: Vocabulary;
};

/**
 * Role-name aliases. Emitted as CSS custom properties at codegen time.
 * Structurally identical to the old `semantic.text/surface/border/accent`.
 */
export interface SemanticTokensConfig {
  text: Record<string, SemanticReference>;
  surface: Record<string, SemanticSurfaceValue>;
  border: Record<string, SemanticReference>;
  accent?: Record<string, SemanticReference>;
}

export type PartialSemanticTokensConfig = {
  text?: Record<string, SemanticReference>;
  surface?: Record<string, SemanticSurfaceValue>;
  border?: Record<string, SemanticReference>;
  accent?: Record<string, SemanticReference>;
};
```

(The import of `Vocabulary` goes at the top of the file with existing imports.)

The old `SemanticTokens` interface stays in place for now — Task 6's createTheme update will route through both. Task 8 deletes the old interface.

- [ ] **Step 4.3: Add `vocabulary` and `semanticTokens` to `ThemeDefinition`**

In `packages/theme/src/types.ts`, find the `ThemeDefinition` interface. Add the two new fields just before the existing `semantic` field:

```ts
export interface ThemeDefinition {
  tokens: ThemeTokens;
  dark?: PartialThemeTokens;

  /** Declared vocabularies (size/intent/variant). createTheme() fills missing axes from defaults. */
  vocabulary?: PartialThemeVocabulary;

  /** Role-name aliases (text/surface/border/accent) — emitted as CSS vars. */
  semanticTokens?: PartialSemanticTokensConfig;

  /** @deprecated — use `vocabulary` for size/intent/variant and `semanticTokens` for text/surface/border/accent. Removed in Task 8. */
  semantic?: Partial<SemanticTokens>;

  intentResolver?: IntentResolver;
  components?: Record<string, ComponentThemeConfig> | readonly ThemeComponentEntry[];
  scope?: string;
  darkMode?: { selector: string };
  extends?: ThemeDefinition;
  name?: string;
}
```

- [ ] **Step 4.4: Add `vocabulary` and `semanticTokens` to `ResolvedTheme`**

In the `ResolvedTheme` interface (just below ThemeDefinition), add both as fully-resolved (non-optional):

```ts
export interface ResolvedTheme {
  tokens: ThemeTokens;
  dark: PartialThemeTokens;
  vocabulary: ThemeVocabulary;        // fully resolved
  semanticTokens: SemanticTokensConfig; // fully resolved
  /** @deprecated — kept temporarily for codegen back-compat during the rename. Removed in Task 8. */
  semantic: SemanticTokens;
  intentResolver: IntentResolver;
  components: Record<string, ComponentThemeConfig>;
  scope: string;
  darkMode: { selector: string };
  name: string;
}
```

- [ ] **Step 4.5: Export the new types from the public barrel**

In `packages/theme/src/index.ts`, add to the existing `export type {...}` block:

```ts
export type {
  // ... existing exports ...
  ThemeVocabulary,
  PartialThemeVocabulary,
  SemanticTokensConfig,
  PartialSemanticTokensConfig,
} from './types.ts';
```

- [ ] **Step 4.6: Typecheck**

```bash
bun run typecheck 2>&1 | tail -3
```
Expected: clean. The new fields are optional in ThemeDefinition; the required versions in ResolvedTheme will be populated by createTheme in Task 6.

- [ ] **Step 4.7: Run tests**

```bash
bun run --filter '@soribashi/theme' test 2>&1 | tail -5
```
Expected: 67 passed (no behavioral change yet — Task 6 hooks up the new fields).

- [ ] **Step 4.8: Commit**

```bash
git add packages/theme/src/types.ts packages/theme/src/index.ts
git commit -m "$(cat <<'EOF'
feat(theme): add vocabulary + semanticTokens field types alongside semantic

Adds ThemeVocabulary, PartialThemeVocabulary, SemanticTokensConfig,
PartialSemanticTokensConfig type interfaces. ThemeDefinition and
ResolvedTheme gain new `vocabulary` and `semanticTokens` fields.

The old `semantic` field stays in place for now (marked @deprecated) so
createTheme + codegen continue to work mid-rename. Task 6 wires the new
fields into createTheme; Task 8 deletes the deprecated semantic field
after all internal call sites have migrated.

Refs: docs/superpowers/specs/2026-05-12-vocabulary-rails-design.md § 6
EOF
)"
```

---

### Task 5: Write `createTheme` tests for the new field shapes

TDD: confirm what we expect createTheme to do BEFORE changing it.

**Files:**
- Create: `packages/theme/test/create-theme-vocabulary.test.ts`

- [ ] **Step 5.1: Write the failing tests**

Create `packages/theme/test/create-theme-vocabulary.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createTheme } from '../src/create-theme.ts';
import { defineVocabulary } from '../src/define-vocabulary.ts';

const minimalTokens = {
  colors: {},
  radius: {},
  spacing: {},
  fontSize: {},
};

describe('createTheme — vocabulary field', () => {
  it('uses caller-provided vocabulary axes', () => {
    const customSize = defineVocabulary(['compact', 'standard', 'comfortable']);
    const theme = createTheme({
      tokens: minimalTokens,
      vocabulary: { size: customSize },
    });
    expect(theme.vocabulary.size.values).toEqual(['compact', 'standard', 'comfortable']);
  });

  it('falls back to default vocabularies when an axis is omitted', () => {
    const theme = createTheme({
      tokens: minimalTokens,
      vocabulary: { size: defineVocabulary(['s', 'm', 'l']) },
      // intent + variant omitted → defaults
    });
    expect(theme.vocabulary.size.values).toEqual(['s', 'm', 'l']);
    expect(theme.vocabulary.intent.values).toEqual([
      'primary', 'neutral', 'success', 'warning', 'danger', 'info',
    ]);
    expect(theme.vocabulary.variant.values).toEqual([
      'filled', 'outline', 'subtle', 'ghost', 'link',
    ]);
  });

  it('falls back to all defaults when vocabulary is entirely omitted', () => {
    const theme = createTheme({
      tokens: minimalTokens,
    });
    expect(theme.vocabulary.size.values).toEqual(['xs', 'sm', 'md', 'lg', 'xl']);
    expect(theme.vocabulary.intent.values.length).toBe(6);
    expect(theme.vocabulary.variant.values.length).toBe(5);
  });

  it('vocabulary values pass Zod validation through the schema', () => {
    const theme = createTheme({
      tokens: minimalTokens,
      vocabulary: { size: defineVocabulary(['compact', 'standard']) },
    });
    expect(theme.vocabulary.size.schema.safeParse('compact').success).toBe(true);
    expect(theme.vocabulary.size.schema.safeParse('huge').success).toBe(false);
  });
});

describe('createTheme — semanticTokens field', () => {
  it('uses caller-provided semanticTokens', () => {
    const theme = createTheme({
      tokens: minimalTokens,
      semanticTokens: {
        text: { default: 'colors.gray.900', muted: 'colors.gray.600' },
        surface: { default: 'colors.gray.0' },
        border: { default: 'colors.gray.200' },
      },
    });
    expect(theme.semanticTokens.text.default).toBe('colors.gray.900');
    expect(theme.semanticTokens.surface.default).toBe('colors.gray.0');
  });

  it('falls back to defaults when semanticTokens omitted', () => {
    const theme = createTheme({ tokens: minimalTokens });
    expect(theme.semanticTokens.text.default).toBe('colors.neutral.900');
    expect(theme.semanticTokens.surface.canvas).toBe('colors.neutral.50');
  });

  it('partial semanticTokens merges with defaults per-key', () => {
    const theme = createTheme({
      tokens: minimalTokens,
      semanticTokens: { text: { default: 'colors.gray.900' } },
    });
    expect(theme.semanticTokens.text.default).toBe('colors.gray.900');
    // surface + border still come from defaults
    expect(theme.semanticTokens.surface.canvas).toBe('colors.neutral.50');
    expect(theme.semanticTokens.border.default).toBe('colors.neutral.200');
  });
});
```

- [ ] **Step 5.2: Run tests — verify they fail**

```bash
bun run --filter '@soribashi/theme' test 2>&1 | tail -20
```
Expected: the new tests fail (`theme.vocabulary` is undefined, `theme.semanticTokens` is undefined). The pre-existing 67 tests still pass.

- [ ] **Step 5.3: No commit yet** — Task 6 makes these pass, then we commit together.

---

### Task 6: Update `createTheme` to populate `vocabulary` and `semanticTokens`

**Files:**
- Modify: `packages/theme/src/create-theme.ts`

- [ ] **Step 6.1: Update `createTheme` to populate the new fields**

Edit `packages/theme/src/create-theme.ts`. Add imports at the top:

```ts
import { DEFAULT_VOCABULARIES } from './default-vocabularies.ts';
import type { ThemeVocabulary, SemanticTokensConfig } from './types.ts';
```

In the `createTheme` function body, AFTER the existing `semantic` resolution and BEFORE the `return` statement, add resolution for the two new fields. Note that we read `merged.vocabulary?.X` (the new field) and fall back to defaults — we do NOT read the old `merged.semantic.intent` for vocabulary, because the new model is the authoritative source after this PR:

```ts
const vocabulary: ThemeVocabulary = {
  size: merged.vocabulary?.size ?? DEFAULT_VOCABULARIES.size,
  intent: merged.vocabulary?.intent ?? DEFAULT_VOCABULARIES.intent,
  variant: merged.vocabulary?.variant ?? DEFAULT_VOCABULARIES.variant,
};

const semanticTokens: SemanticTokensConfig = {
  text: merged.semanticTokens?.text ?? DEFAULT_TEXT,
  surface: merged.semanticTokens?.surface ?? DEFAULT_SURFACE,
  border: merged.semanticTokens?.border ?? DEFAULT_BORDER,
  ...(merged.semanticTokens?.accent ? { accent: merged.semanticTokens.accent } : {}),
};
```

Then update the return value to include both new fields:

```ts
return {
  tokens: merged.tokens,
  dark: merged.dark ?? {},
  vocabulary,
  semanticTokens,
  semantic,  // ← kept for now (Task 8 removes)
  intentResolver: merged.intentResolver ?? defaultIntentResolver,
  components: normalizeComponents(merged.components),
  scope: merged.scope ?? ':root',
  darkMode: merged.darkMode ?? { selector: '.dark' },
  name: merged.name ?? 'default',
};
```

- [ ] **Step 6.2: Verify Task 5's tests pass**

```bash
bun run --filter '@soribashi/theme' test 2>&1 | tail -10
```
Expected: all tests pass (67 original + 7 new from Task 5 = 74). If any pre-existing test fails, that means a `theme.X` field shifted unexpectedly — investigate before continuing.

- [ ] **Step 6.3: Typecheck**

```bash
bun run typecheck 2>&1 | tail -3
```
Expected: clean.

- [ ] **Step 6.4: Commit (covers Tasks 5 + 6)**

```bash
git add packages/theme/src/create-theme.ts packages/theme/test/create-theme-vocabulary.test.ts
git commit -m "$(cat <<'EOF'
feat(theme): wire createTheme() to resolve vocabulary + semanticTokens

createTheme now populates the new ResolvedTheme.vocabulary and
ResolvedTheme.semanticTokens fields. Per-axis fallback to internal
DEFAULT_VOCABULARIES when omitted. Per-key merge for semanticTokens
(any omitted text/surface/border slot falls back to its existing default).

The deprecated `semantic` field is still populated by createTheme so
codegen and consumers mid-migration keep working. Task 8 removes it.

Refs: docs/superpowers/specs/2026-05-12-vocabulary-rails-design.md § 6
EOF
)"
```

---

### Task 7: Update `composeTheme` for `vocabulary` + `semanticTokens`

`composeTheme` merges a child theme onto a base theme (for the `extends` pattern). Without an update, child themes won't override the new fields correctly.

**Files:**
- Modify: `packages/theme/src/compose-theme.ts`
- Create or extend: `packages/theme/test/compose-theme-vocabulary.test.ts`

- [ ] **Step 7.1: Read the current composeTheme**

```bash
cat packages/theme/src/compose-theme.ts
```

Understand the existing merge pattern — how it handles `semantic`, what's deep-merged vs shallow-merged.

- [ ] **Step 7.2: Write the failing tests**

Create `packages/theme/test/compose-theme-vocabulary.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createTheme } from '../src/create-theme.ts';
import { defineVocabulary } from '../src/define-vocabulary.ts';

const tokens = { colors: {}, radius: {}, spacing: {}, fontSize: {} };

describe('composeTheme via extends — vocabulary', () => {
  it('child theme overrides base theme vocabulary per-axis', () => {
    const base = createTheme({
      tokens,
      vocabulary: {
        size: defineVocabulary(['xs', 'sm', 'md', 'lg', 'xl']),
        intent: defineVocabulary(['primary', 'secondary']),
      },
    });
    const child = createTheme({
      tokens,
      extends: base,
      vocabulary: {
        intent: defineVocabulary(['safe', 'critical']),
        // size omitted — inherits from base
      },
    });
    expect(child.vocabulary.size.values).toEqual(['xs', 'sm', 'md', 'lg', 'xl']);
    expect(child.vocabulary.intent.values).toEqual(['safe', 'critical']);
  });

  it('child theme overrides base theme semanticTokens per-slot', () => {
    const base = createTheme({
      tokens,
      semanticTokens: {
        text: { default: 'colors.gray.900', muted: 'colors.gray.500' },
        surface: { default: 'colors.gray.0' },
        border: { default: 'colors.gray.200' },
      },
    });
    const child = createTheme({
      tokens,
      extends: base,
      semanticTokens: {
        text: { default: 'colors.zinc.900' },  // overrides default; muted inherits
      },
    });
    expect(child.semanticTokens.text.default).toBe('colors.zinc.900');
    expect(child.semanticTokens.text.muted).toBe('colors.gray.500');
    expect(child.semanticTokens.surface.default).toBe('colors.gray.0');
  });
});
```

- [ ] **Step 7.3: Run tests to verify they fail**

```bash
bun run --filter '@soribashi/theme' test 2>&1 | tail -15
```
Expected: the two new tests fail because composeTheme doesn't yet handle vocabulary + semanticTokens.

- [ ] **Step 7.4: Update `composeTheme` to merge the new fields**

In `packages/theme/src/compose-theme.ts`, locate the merge function. After the existing `semantic` merge (or alongside it), add:

```ts
// Vocabulary: per-axis replace (no per-axis merge; vocabularies are atomic units)
const vocabulary = {
  ...base.vocabulary,
  ...(child.vocabulary ?? {}),
};

// SemanticTokens: per-slot deep merge (text/surface/border/accent each merge their keys)
const semanticTokens = {
  text: { ...base.semanticTokens?.text, ...(child.semanticTokens?.text ?? {}) },
  surface: { ...base.semanticTokens?.surface, ...(child.semanticTokens?.surface ?? {}) },
  border: { ...base.semanticTokens?.border, ...(child.semanticTokens?.border ?? {}) },
  ...((base.semanticTokens?.accent || child.semanticTokens?.accent) && {
    accent: { ...base.semanticTokens?.accent, ...(child.semanticTokens?.accent ?? {}) },
  }),
};
```

Then add `vocabulary` and `semanticTokens` to the returned merged-theme object.

Read the file first to understand the exact structure; the snippets above show the merge shape, not necessarily the exact lines to add.

- [ ] **Step 7.5: Verify tests pass**

```bash
bun run --filter '@soribashi/theme' test 2>&1 | tail -10
```
Expected: 76 passed (74 + 2 new).

- [ ] **Step 7.6: Typecheck**

```bash
bun run typecheck 2>&1 | tail -3
```
Expected: clean.

- [ ] **Step 7.7: Commit**

```bash
git add packages/theme/src/compose-theme.ts packages/theme/test/compose-theme-vocabulary.test.ts
git commit -m "$(cat <<'EOF'
feat(theme): composeTheme handles vocabulary + semanticTokens

Vocabulary axes merge per-axis (replace, not deep-merge — vocabularies
are atomic units; you can't "extend" a Vocabulary except via the
extend() function form, which is recipe-level not theme-level).

SemanticTokens merge per-slot deep (text/surface/border/accent each
inherit their base keys and override individual entries).

Refs: docs/superpowers/specs/2026-05-12-vocabulary-rails-design.md § 6
EOF
)"
```

---

### Task 8: Hard-remove the deprecated `semantic` field; migrate internal callers

Now that the new fields work end-to-end, delete the old `semantic` field from theme types and update all consumers (codegen, tests, the pilot's theme.ts).

**Files:**
- Modify: `packages/theme/src/types.ts` (remove SemanticTokens, semantic field)
- Modify: `packages/theme/src/create-theme.ts` (remove semantic resolution + return)
- Modify: `packages/theme/src/compose-theme.ts` (remove semantic merge if any)
- Modify: `packages/codegen/src/emit-css.ts` (read semanticTokens instead of semantic)
- Modify: existing theme tests that use `theme.semantic.X` (grep + update)
- Modify: existing codegen tests that use `theme.semantic.X` (grep + update)
- Modify: `apps/pilot/src/theme/*.ts` (update theme builder to use new field names — does NOT migrate recipes)

- [ ] **Step 8.1: Find all internal call sites that reference `theme.semantic`**

```bash
grep -rn "theme\.semantic\|theme\?\.semantic\|\.semantic\." --include="*.ts" --include="*.tsx" packages/ apps/ | grep -v "node_modules\|dist\|\.test\." | head -30
```

This identifies the runtime call sites that must migrate. Note: also check test files separately:

```bash
grep -rn "\.semantic\.\|semantic:" --include="*.test.ts" --include="*.test.tsx" packages/ apps/ | head -30
```

- [ ] **Step 8.2: Update codegen to read `semanticTokens` instead of `semantic`**

In `packages/codegen/src/emit-css.ts` (or wherever it reads role aliases), replace:

```ts
// OLD
theme.semantic.text  →  theme.semanticTokens.text
theme.semantic.surface  →  theme.semanticTokens.surface
theme.semantic.border  →  theme.semanticTokens.border
theme.semantic?.accent  →  theme.semanticTokens.accent
```

For `intent` / `variant` references — those WERE in semantic but they aren't CSS-emitted (they're type-level vocabularies now). If codegen reads them for anything, remove that code or migrate to `theme.vocabulary.{intent,variant}.values`.

- [ ] **Step 8.3: Update theme tests that use the old field name**

For each grep hit in `packages/theme/test/*.ts` that references `.semantic.text/surface/border/accent`, update to `.semanticTokens.text/surface/border/accent`. For each hit that references `.semantic.intent/variant`, update to `.vocabulary.intent.values` (or similar — depends on what the test asserts).

- [ ] **Step 8.4: Update codegen tests similarly**

Same kind of edit across `packages/codegen/test/*.ts`. Many tests likely construct a fake theme — they need their `semantic` blocks renamed to `semanticTokens` and `intent/variant` lifted to `vocabulary`.

- [ ] **Step 8.5: Update the pilot's theme.ts**

In `apps/pilot/src/theme/index.ts` (or wherever the pilot's theme is constructed), find the `semantic: { ... }` block. Split it:

```ts
// BEFORE
export const theme = createTheme({
  tokens,
  semantic: {
    intent: [...],
    variant: [...],
    text: {...},
    surface: {...},
    border: {...},
  },
});

// AFTER
import { defineVocabulary } from '@soribashi/core';

export const theme = createTheme({
  tokens,
  vocabulary: {
    intent: defineVocabulary([... same values ...]),
    variant: defineVocabulary([... same values ...]),
  },
  semanticTokens: {
    text: {...},      // unchanged
    surface: {...},   // unchanged
    border: {...},    // unchanged
  },
});
```

Recipes that read `theme.semantic.intent.includes(...)` or similar (if any) update to `theme.vocabulary.intent.values.includes(...)`. The pilot's recipes themselves are NOT migrated to vocabularyAxes — that's the next PR.

- [ ] **Step 8.6: Remove the deprecated `semantic` field from types**

In `packages/theme/src/types.ts`:
- Delete the `SemanticTokens` interface
- Delete the `semantic?: Partial<SemanticTokens>` field from `ThemeDefinition`
- Delete the `semantic: SemanticTokens` field from `ResolvedTheme`

In `packages/theme/src/create-theme.ts`:
- Delete the `DEFAULT_INTENTS` / `DEFAULT_VARIANTS` constants (the vocabularies now live in DEFAULT_VOCABULARIES)
- Delete the `semantic` resolution block
- Delete `semantic` from the returned object
- Delete the `DEFAULT_TEXT` / `DEFAULT_SURFACE` / `DEFAULT_BORDER` constants if Task 6 didn't already replace their use

Actually — Task 6 still uses DEFAULT_TEXT etc. for fallbacks. Keep them; they're internal defaults for semanticTokens fallback, conceptually similar to DEFAULT_VOCABULARIES.

In `packages/theme/src/compose-theme.ts`:
- Delete any `semantic` merge code

In `packages/theme/src/index.ts`:
- Delete `SemanticTokens` from the type exports

- [ ] **Step 8.7: Run all tests + typecheck**

```bash
bun run typecheck 2>&1 | tail -5
bun run --filter '@soribashi/*' test 2>&1 | grep "Tests" | head -5
cd apps/pilot && bunx vitest run --reporter=basic 2>&1 | tail -4
cd /Users/matt/Documents/GitHub/soribashi/.claude/worktrees/vocabulary-rails-core
```
Expected:
- Typecheck clean
- theme: 76 (62 → 67 after Task 1 → 74 after Task 5/6 → 76 after Task 7)
- codegen: 137 (unchanged — internal refactor only)
- factory: 461 (untouched in Phase B)
- blocks: 244 (untouched)
- pilot: 47 (untouched — pilot's theme.ts updated to new field names but recipes use it the same way)

If any test fails because of a missed `.semantic.X` reference, find and update it.

- [ ] **Step 8.8: Commit**

```bash
git add -A packages/theme/ packages/codegen/ apps/pilot/src/theme/
git commit -m "$(cat <<'EOF'
refactor(theme): hard-remove deprecated semantic field — vocabulary + semanticTokens are canonical

Deletes SemanticTokens interface and theme.semantic field from
ThemeDefinition + ResolvedTheme. Migrates all internal callers:

- packages/theme/src/create-theme.ts: deletes semantic resolution
- packages/theme/src/compose-theme.ts: deletes semantic merge
- packages/codegen/src/emit-css.ts: reads theme.semanticTokens
- packages/theme/test/*: tests updated to use new field names
- packages/codegen/test/*: tests updated to use new field names
- apps/pilot/src/theme/index.ts: theme uses
  vocabulary + semanticTokens instead of semantic. defineVocabulary
  used for intent + variant axes (preserves the previous values).

Pilot recipes (Button/Tooltip/Tabs) are NOT migrated in this PR —
they continue to use local Variant/Intent/Size declarations. The
pilot's theme.ts update is the minimum required to keep the app
building. Recipe migration happens in the pilot-migration PR.

Pre-1.0 breaking change. No back-compat shim.

Refs: docs/superpowers/specs/2026-05-12-vocabulary-rails-design.md § 6
EOF
)"
```

---

## Phase C: `Recipe.extend()` replaces `withDefaults()`

The static method that returns a `ThemeComponentEntry` for the theme's `components` array. Adds per-component vocabulary overrides on top of what `withDefaults` did.

### Task 9: Define `ComponentExtendConfig` and `VocabularyOverride` types

**Files:**
- Create: `packages/factory/src/types/component-extend.ts`
- Modify: `packages/factory/src/index.ts`

- [ ] **Step 9.1: Create the type module**

Create `packages/factory/src/types/component-extend.ts`:

```ts
import type { CSSProperties } from 'react';
import type { ResolvedTheme, Vocabulary } from '@soribashi/theme';

/**
 * A vocabulary override is either:
 *   - A Vocabulary value (replace mode): the recipe's axis becomes that vocab.
 *   - A function (current: Vocabulary) => Vocabulary (extend mode): receives the
 *     theme-resolved global vocab for that axis and returns a new vocab.
 *
 * Evaluated once during createTheme()'s entry resolution; the resulting concrete
 * Vocabulary is stored on the ThemeComponentEntry for runtime lookup.
 */
export type VocabularyOverride =
  | Vocabulary
  | ((current: Vocabulary) => Vocabulary);

/**
 * Configuration passed to `Recipe.extend()`. Replaces the prior `withDefaults`
 * API with a richer surface that includes per-component vocabulary overrides,
 * default props, slot classNames/styles/vars/attributes.
 */
export interface ComponentExtendConfig<TOwnProps = Record<string, unknown>> {
  /** Per-component vocabulary overrides keyed by axis name. */
  vocabulary?: {
    size?: VocabularyOverride;
    intent?: VocabularyOverride;
    variant?: VocabularyOverride;
  };

  /** Default props applied when the consumer doesn't pass the prop. */
  defaultProps?: Partial<TOwnProps>;

  /** Per-slot class names applied to every render. */
  classNames?:
    | Record<string, string>
    | ((theme: ResolvedTheme, props: TOwnProps) => Record<string, string>);

  /** Per-slot inline styles. */
  styles?:
    | Record<string, CSSProperties>
    | ((theme: ResolvedTheme, props: TOwnProps) => Record<string, CSSProperties>);

  /** Per-slot CSS custom property declarations. */
  vars?: (theme: ResolvedTheme, props: TOwnProps) => Record<string, Record<string, string>>;

  /** Per-slot HTML attribute overrides. */
  attributes?: Record<string, Record<string, unknown>>;
}
```

- [ ] **Step 9.2: Export from the factory's public barrel**

In `packages/factory/src/index.ts`, add:

```ts
export type { ComponentExtendConfig, VocabularyOverride } from './types/component-extend.ts';
```

- [ ] **Step 9.3: Re-export from `@soribashi/core`**

In `packages/core/src/index.ts`, add to the type re-export block from `@soribashi/factory`:

```ts
export type { ComponentExtendConfig, VocabularyOverride } from '@soribashi/factory';
```

- [ ] **Step 9.4: Typecheck**

```bash
bun run typecheck 2>&1 | tail -3
```
Expected: clean.

- [ ] **Step 9.5: Commit**

```bash
git add packages/factory/src/types/component-extend.ts packages/factory/src/index.ts packages/core/src/index.ts
git commit -m "$(cat <<'EOF'
feat(factory): add ComponentExtendConfig + VocabularyOverride types

Public types for the new Recipe.extend() static method. VocabularyOverride
is a union of Vocabulary (replace) and (current: Vocabulary) => Vocabulary
(extend-via-function). TypeScript dispatches on shape — no mode flag.

Refs: docs/superpowers/specs/2026-05-12-vocabulary-rails-design.md § 7
EOF
)"
```

---

### Task 10: Update `ThemeComponentEntry` to carry the new config

The entry shape that gets stored in `theme.components` and read at render time.

**Files:**
- Modify: `packages/theme/src/theme-component-entry.ts`
- Modify: `packages/factory/src/theme-component-entry.ts` (or wherever the factory re-exports it)

- [ ] **Step 10.1: Read the current entry type**

```bash
cat packages/theme/src/theme-component-entry.ts
cat packages/factory/src/theme-component-entry.ts
```

The current shape is something like:
```ts
export interface ThemeComponentEntry<TProps = unknown> {
  __soribashiThemeEntry: true;
  name: string;
  defaultProps?: Partial<TProps>;
}
```

- [ ] **Step 10.2: Widen the entry to carry the full ComponentExtendConfig**

In `packages/theme/src/theme-component-entry.ts`, update the interface (preserve existing fields):

```ts
import type { Vocabulary } from './define-vocabulary.ts';

export interface ThemeComponentEntry<TProps = unknown> {
  __soribashiThemeEntry: true;
  name: string;
  /** Per-component vocabulary overrides — function-form values resolved at createTheme() time. */
  vocabulary?: {
    size?: Vocabulary;
    intent?: Vocabulary;
    variant?: Vocabulary;
  };
  defaultProps?: Partial<TProps>;
  classNames?: unknown;
  styles?: unknown;
  vars?: unknown;
  attributes?: unknown;
}
```

(The `classNames`/`styles`/`vars`/`attributes` types are intentionally `unknown` at this layer — the factory's render path narrows them when consumed. The factory-level type adds more precision.)

The `isThemeComponentEntry` helper stays as-is — it just checks the brand.

- [ ] **Step 10.3: Typecheck**

```bash
bun run typecheck 2>&1 | tail -3
```
Expected: clean. Existing callers that only set `defaultProps` are unaffected (new fields are optional).

- [ ] **Step 10.4: Run tests**

```bash
bun run --filter '@soribashi/*' test 2>&1 | grep "Tests" | head -5
```
Expected: no count changes; this is a type-shape extension.

- [ ] **Step 10.5: Commit**

```bash
git add packages/theme/src/theme-component-entry.ts packages/factory/src/theme-component-entry.ts
git commit -m "$(cat <<'EOF'
feat(theme): widen ThemeComponentEntry to carry vocabulary + slot overrides

Adds optional vocabulary / classNames / styles / vars / attributes
fields to ThemeComponentEntry. Existing entries (from withDefaults)
remain backward-compatible because the new fields are all optional.

Refs: docs/superpowers/specs/2026-05-12-vocabulary-rails-design.md § 7
EOF
)"
```

---

### Task 11: Add `extend()` and remove `withDefaults()` from `defineComponent`

Replace the existing static method.

**Files:**
- Modify: `packages/factory/src/define-component.tsx`
- Modify: existing tests that reference `withDefaults`

- [ ] **Step 11.1: Locate the `withDefaults` block**

```bash
grep -n "withDefaults" packages/factory/src/define-component.tsx
```

Find the assignment like `(Component as any).withDefaults = (defaults) => ({ ... })`. Around line 80-95 in the current code.

- [ ] **Step 11.2: Replace with `extend()`**

In `packages/factory/src/define-component.tsx`, replace the `withDefaults` block:

```ts
// REMOVE
(Component as any).withDefaults = (defaults) => ({
  __soribashiThemeEntry: true,
  name: config.name,
  defaultProps: defaults,
});

// REPLACE WITH
import type { ComponentExtendConfig, VocabularyOverride } from './types/component-extend.ts';
import type { ThemeComponentEntry } from './theme-component-entry.ts';

(Component as any).extend = (
  extendConfig: ComponentExtendConfig<TOwnProps & StylesApiProps<any>>,
): ThemeComponentEntry<TOwnProps & StylesApiProps<any>> => ({
  __soribashiThemeEntry: true,
  name: config.name,
  vocabulary: extendConfig.vocabulary as any, // function-form resolved later in createTheme
  defaultProps: extendConfig.defaultProps,
  classNames: extendConfig.classNames,
  styles: extendConfig.styles,
  vars: extendConfig.vars,
  attributes: extendConfig.attributes,
});
```

Also update the return-type assertion at the bottom of the function. Find the section like:

```ts
return Component as unknown as React.ForwardRefExoticComponent<...> & {
  extend: (cfg: any) => any;
  withProps: (...) => ...;
  withDefaults: (defaults: ...) => ThemeComponentEntry<...>;
  classes?: ...;
  displayName?: string;
};
```

Replace with:

```ts
return Component as unknown as React.ForwardRefExoticComponent<...> & {
  withProps: (...) => ...;
  extend: (
    config: ComponentExtendConfig<TOwnProps & StylesApiProps<any>>,
  ) => ThemeComponentEntry<TOwnProps & StylesApiProps<any>>;
  classes?: ...;
  displayName?: string;
};
```

(Note: the previous `extend: (cfg: any) => any` field was an internal identity helper used by some Mantine-style extension code. If it's referenced elsewhere in the codebase, leave the identity helper renamed to `__internalExtend` or similar. Verify via grep before deleting.)

- [ ] **Step 11.3: Find and update callers of `withDefaults`**

```bash
grep -rn "\.withDefaults(" packages/ apps/ --include="*.ts" --include="*.tsx" | head -20
```

For each call site, replace `Recipe.withDefaults({ ...props })` with `Recipe.extend({ defaultProps: { ...props } })`. Most likely call sites:
- The pilot's theme.ts (component entries)
- Tests in `packages/factory/test/`

- [ ] **Step 11.4: Run factory + pilot tests**

```bash
bun run --filter '@soribashi/factory' test 2>&1 | grep -E "Tests|FAIL" | head -10
cd apps/pilot && bunx vitest run --reporter=basic 2>&1 | tail -4
cd /Users/matt/Documents/GitHub/soribashi/.claude/worktrees/vocabulary-rails-core
```
Expected: factory 461 (unchanged), pilot 47 (unchanged).

If a test fails because it referenced `.withDefaults()` — update the call site per Step 11.3.

- [ ] **Step 11.5: Typecheck**

```bash
bun run typecheck 2>&1 | tail -3
```
Expected: clean.

- [ ] **Step 11.6: Commit**

```bash
git add packages/factory/src/define-component.tsx packages/factory/test/ apps/pilot/src/
git commit -m "$(cat <<'EOF'
feat(factory): defineComponent — extend() replaces withDefaults()

Recipe.extend(config) accepts ComponentExtendConfig with vocabulary,
defaultProps, classNames, styles, vars, attributes. Replaces the prior
narrow withDefaults() API which only carried defaultProps.

Migration for all internal call sites:
  Recipe.withDefaults({ x: 1 })  →  Recipe.extend({ defaultProps: { x: 1 } })

Pre-1.0 breaking change.

Refs: docs/superpowers/specs/2026-05-12-vocabulary-rails-design.md § 7
EOF
)"
```

---

### Task 12: Add `extend()` and remove `withDefaults()` from `definePolymorphicComponent`

Same shape as Task 11, applied to the polymorphic builder.

**Files:**
- Modify: `packages/factory/src/define-polymorphic-component.tsx`

- [ ] **Step 12.1: Find the existing `withDefaults` in `define-polymorphic-component.tsx`**

```bash
grep -n "withDefaults" packages/factory/src/define-polymorphic-component.tsx
```

- [ ] **Step 12.2: Replace with extend()**

Use the same shape as Task 11, but with the polymorphic-specific prop types. The `extend()` config accepts polymorphic-flavored ownProps (the `DefinePolymorphicProps` type from that file).

- [ ] **Step 12.3: Update callers + tests**

Grep for `.withDefaults(` again — should only catch new sites or tests that specifically use the polymorphic builder. Update them.

- [ ] **Step 12.4: Run tests + typecheck**

```bash
bun run --filter '@soribashi/factory' test 2>&1 | grep "Tests" | head -3
bun run typecheck 2>&1 | tail -3
```
Expected: 461 passed, typecheck clean.

- [ ] **Step 12.5: Commit**

```bash
git add packages/factory/src/define-polymorphic-component.tsx packages/factory/test/
git commit -m "$(cat <<'EOF'
feat(factory): definePolymorphicComponent — extend() replaces withDefaults()

Same migration shape as Task 11 applied to the polymorphic builder.
ComponentExtendConfig is parameterized by the polymorphic ownProps shape.

Refs: docs/superpowers/specs/2026-05-12-vocabulary-rails-design.md § 7
EOF
)"
```

---

### Task 13: Add `extend()` and remove `withDefaults()` from `defineCompound`

**Files:**
- Modify: `packages/factory/src/define-compound.tsx`

- [ ] **Step 13.1: Find the existing `withDefaults` on the root compound + each part**

```bash
grep -n "withDefaults" packages/factory/src/define-compound.tsx
```
Expected: multiple matches — both the Root and each non-root Part get a `withDefaults` static method.

- [ ] **Step 13.2: Replace all `withDefaults` assignments with `extend()`**

For each match, swap to the `extend()` shape that returns a ThemeComponentEntry carrying ComponentExtendConfig fields. Parts use compound part naming convention: `entry.name` is `${compoundName}${capitalize(partKey)}`.

- [ ] **Step 13.3: Update callers + tests**

```bash
grep -rn "\.withDefaults(" packages/ apps/ --include="*.ts" --include="*.tsx" | head -10
```
Should now return zero results across the whole tree if Tasks 11 + 12 + 13 caught everything.

- [ ] **Step 13.4: Tests + typecheck**

```bash
bun run --filter '@soribashi/factory' test 2>&1 | grep "Tests" | head -3
bun run typecheck 2>&1 | tail -3
```
Expected: 461 passed, typecheck clean.

- [ ] **Step 13.5: Commit**

```bash
git add packages/factory/src/define-compound.tsx packages/factory/test/
git commit -m "$(cat <<'EOF'
feat(factory): defineCompound — extend() replaces withDefaults() for root + parts

Both the compound Root and each non-root Part now expose extend() in
place of withDefaults(). Each part's ThemeComponentEntry uses the
compound part name (e.g. "TooltipContent") so per-part overrides
remain addressable in theme.components.

Refs: docs/superpowers/specs/2026-05-12-vocabulary-rails-design.md § 7
EOF
)"
```

---

### Task 14: Add `extend()` to `defineGenericComponent` (or remove the builder if unused)

**Files:**
- Modify: `packages/factory/src/define-generic-component.tsx`

- [ ] **Step 14.1: Find usage of `defineGenericComponent` in the repo**

```bash
grep -rn "defineGenericComponent" packages/ apps/ --include="*.ts" --include="*.tsx" | head -10
```

If only the factory package itself defines it but no recipe uses it → consider deprecating or just leaving as-is. If anything uses it → migrate to `extend()`.

- [ ] **Step 14.2: If used, apply the same extend() migration as Task 11**

Replace `withDefaults` with `extend()`. Update callers.

- [ ] **Step 14.3: If unused, mark as `@deprecated` in JSDoc but leave functional**

If no consumer uses it, skip the migration. Add a JSDoc note:
```ts
/** @deprecated — no current consumers; will be removed in a future release if no use case emerges. */
```

- [ ] **Step 14.4: Tests + typecheck**

```bash
bun run --filter '@soribashi/factory' test 2>&1 | grep "Tests" | head -3
bun run typecheck 2>&1 | tail -3
```
Expected: 461 passed, typecheck clean.

- [ ] **Step 14.5: Commit (only if a change was made)**

```bash
git add packages/factory/src/define-generic-component.tsx
git commit -m "$(cat <<'EOF'
feat(factory): defineGenericComponent — extend() (or @deprecated if unused)

Migrates the fourth builder to the new extend() API for parity, OR
marks it @deprecated if no consumer exists.

Refs: docs/superpowers/specs/2026-05-12-vocabulary-rails-design.md § 7
EOF
)"
```

---

### Task 15: Resolve `VocabularyOverride` function-form at `createTheme()` time

Function-form overrides need the global vocab as input. Resolve them when the theme is constructed so runtime lookup sees concrete vocabularies.

**Files:**
- Modify: `packages/theme/src/normalize-components.ts` (the function that processes the components array)

- [ ] **Step 15.1: Read the current normalize-components**

```bash
cat packages/theme/src/normalize-components.ts
```

Understand how it currently converts the `components` array/record into the ResolvedTheme.components shape.

- [ ] **Step 15.2: Add vocabulary resolution**

In `packages/theme/src/normalize-components.ts`, when processing each `ThemeComponentEntry`, resolve any function-form vocabulary overrides against the theme's global vocabulary:

```ts
import type { ThemeVocabulary } from './types.ts';
import type { ThemeComponentEntry } from './theme-component-entry.ts';
import type { VocabularyOverride } from '@soribashi/factory'; // or move VocabularyOverride to @soribashi/theme to avoid cross-package import

function resolveVocabOverride(
  override: VocabularyOverride | undefined,
  current: Vocabulary | undefined,
): Vocabulary | undefined {
  if (override === undefined) return undefined;
  if (typeof override === 'function') {
    if (current === undefined) {
      throw new Error('Vocabulary function-form override needs a global vocabulary to extend from');
    }
    return override(current);
  }
  // It's already a Vocabulary
  return override;
}

function resolveEntryVocabulary(entry: ThemeComponentEntry, vocab: ThemeVocabulary) {
  if (!entry.vocabulary) return entry;
  return {
    ...entry,
    vocabulary: {
      size: resolveVocabOverride(entry.vocabulary.size as VocabularyOverride, vocab.size),
      intent: resolveVocabOverride(entry.vocabulary.intent as VocabularyOverride, vocab.intent),
      variant: resolveVocabOverride(entry.vocabulary.variant as VocabularyOverride, vocab.variant),
    },
  };
}
```

Note: `VocabularyOverride` lives in `@soribashi/factory`. Cross-package import works because factory depends on theme already — but to avoid a circular import, you may need to move `VocabularyOverride` to `@soribashi/theme/src/types.ts` instead. Do that move as part of this task if a cycle appears.

- [ ] **Step 15.3: Pass `vocab` from createTheme to normalize-components**

In `packages/theme/src/create-theme.ts`, find the call to `normalizeComponents(merged.components)`. Update its signature to also pass the resolved vocabulary:

```ts
components: normalizeComponents(merged.components, vocabulary),
```

Update `normalizeComponents` signature accordingly.

- [ ] **Step 15.4: Write a test for the function-form override**

Append to `packages/theme/test/create-theme-vocabulary.test.ts`:

```ts
import { defineVocabulary } from '../src/define-vocabulary.ts';
import type { ThemeComponentEntry } from '../src/theme-component-entry.ts';

describe('createTheme — function-form vocabulary overrides resolve', () => {
  it('replace-mode: passes Vocabulary directly', () => {
    const customVariant = defineVocabulary(['default', 'subtle']);
    const entry: ThemeComponentEntry = {
      __soribashiThemeEntry: true,
      name: 'Tooltip',
      vocabulary: { variant: customVariant },
    };
    const theme = createTheme({
      tokens: minimalTokens,
      components: [entry],
    });
    const tooltip = (theme.components as any).Tooltip ?? theme.components;
    // The component entry's vocabulary should be present and unmodified
    // (exact shape depends on how normalizeComponents stores entries —
    // adjust the assertion to match the actual ResolvedTheme.components shape)
    expect(tooltip).toBeDefined();
  });

  it('extend-mode: function receives current and returns new vocabulary', () => {
    const entry: ThemeComponentEntry = {
      __soribashiThemeEntry: true,
      name: 'Button',
      vocabulary: {
        size: ((current: Vocabulary) =>
          defineVocabulary([...current.values, 'jumbo'] as [string, ...string[]])) as unknown as Vocabulary,
      },
    };
    const theme = createTheme({
      tokens: minimalTokens,
      vocabulary: { size: defineVocabulary(['xs', 'sm', 'md']) },
      components: [entry],
    });
    // The resolved entry should have a size vocabulary that includes 'jumbo'
    // plus the global size values
    const button = (theme.components as any).Button ?? theme.components;
    expect(button).toBeDefined();
    // Detailed shape check depends on normalizeComponents structure
  });
});
```

(The test details may need refinement after you see normalizeComponents' actual output shape. The point is to exercise the resolution path.)

- [ ] **Step 15.5: Tests + typecheck**

```bash
bun run --filter '@soribashi/theme' test 2>&1 | grep "Tests" | head -3
bun run typecheck 2>&1 | tail -3
```
Expected: theme test count grows by 2; typecheck clean.

- [ ] **Step 15.6: Commit**

```bash
git add packages/theme/src/ packages/theme/test/
git commit -m "$(cat <<'EOF'
feat(theme): resolve VocabularyOverride function-form at createTheme() time

normalizeComponents now receives the resolved global vocabulary and
invokes function-form overrides with the correct global vocab as input.
Replace-mode pass-through is unchanged.

VocabularyOverride may move to @soribashi/theme to avoid a circular
import between factory and theme.

Refs: docs/superpowers/specs/2026-05-12-vocabulary-rails-design.md § 7
EOF
)"
```

---

## Phase D: `createSoribashiBuilders` factory

The entry point for vocab-aware builders. Returns typed builders + registers the theme's Zod schemas for runtime validation.

### Task 16: Create the registry module

Where Zod schemas live for runtime lookup.

**Files:**
- Create: `packages/factory/src/vocabulary-registry.ts`
- Create: `packages/factory/test/vocabulary-registry.test.ts`

- [ ] **Step 16.1: Write the failing test**

Create `packages/factory/test/vocabulary-registry.test.ts`:

```ts
import { describe, expect, it, beforeEach } from 'vitest';
import {
  resetRegistry,
  registerComponentVocabularies,
  resolveVocab,
} from '../src/vocabulary-registry.ts';
import { defineVocabulary } from '@soribashi/theme';

describe('vocabulary-registry', () => {
  beforeEach(() => {
    resetRegistry();
  });

  it('returns undefined when no registration exists', () => {
    expect(resolveVocab('UnknownComponent', 'size')).toBeUndefined();
  });

  it('returns registered vocabulary for the right axis', () => {
    const sizeVocab = defineVocabulary(['small', 'large']);
    registerComponentVocabularies('Button', { size: sizeVocab });
    expect(resolveVocab('Button', 'size')).toBe(sizeVocab);
    expect(resolveVocab('Button', 'intent')).toBeUndefined();
  });

  it('falls back to the global vocab when no per-component registration exists', () => {
    const globalIntent = defineVocabulary(['safe', 'critical']);
    registerComponentVocabularies('__global__', { intent: globalIntent });
    expect(resolveVocab('Button', 'intent')).toBe(globalIntent);
  });

  it('per-component vocab beats the global vocab', () => {
    const globalSize = defineVocabulary(['xs', 'md', 'xl']);
    const buttonSize = defineVocabulary(['small', 'large']);
    registerComponentVocabularies('__global__', { size: globalSize });
    registerComponentVocabularies('Button', { size: buttonSize });
    expect(resolveVocab('Button', 'size')).toBe(buttonSize);
    expect(resolveVocab('OtherComponent', 'size')).toBe(globalSize);
  });
});
```

- [ ] **Step 16.2: Verify the test fails**

```bash
bun run --filter '@soribashi/factory' test 2>&1 | tail -15
```
Expected: failures — module doesn't exist yet.

- [ ] **Step 16.3: Implement the registry**

Create `packages/factory/src/vocabulary-registry.ts`:

```ts
import type { Vocabulary } from '@soribashi/theme';

export type VocabularyAxis = 'size' | 'intent' | 'variant';

/**
 * Module-level registry of vocabularies, keyed by component name (or `__global__`
 * for the theme-wide defaults). Populated by createSoribashiBuilders() once at
 * app startup; read by builders' useProps during render.
 *
 * Single-tenant: assumes ONE theme per process. Multi-tenant SSR scenarios are
 * out of scope (see spec § 14 risk 5).
 */
type ComponentVocabularies = Partial<Record<VocabularyAxis, Vocabulary>>;

const GLOBAL_KEY = '__global__';

let registry = new Map<string, ComponentVocabularies>();

/** Reset registry. Used by tests; never called from production code. */
export function resetRegistry(): void {
  registry = new Map();
}

/**
 * Register vocabularies for a component (or `__global__` for theme-wide defaults).
 * Idempotent — re-registering a component name replaces its prior entry.
 */
export function registerComponentVocabularies(
  componentName: string,
  vocab: ComponentVocabularies,
): void {
  registry.set(componentName, { ...registry.get(componentName), ...vocab });
}

/**
 * Resolve which vocabulary applies for a (component, axis) pair.
 * Lookup order:
 *   1. Per-component registration
 *   2. __global__ registration
 *   3. undefined (caller decides what to do — typically skip validation)
 */
export function resolveVocab(componentName: string, axis: VocabularyAxis): Vocabulary | undefined {
  const componentVocab = registry.get(componentName);
  if (componentVocab?.[axis]) return componentVocab[axis];
  return registry.get(GLOBAL_KEY)?.[axis];
}
```

- [ ] **Step 16.4: Verify tests pass**

```bash
bun run --filter '@soribashi/factory' test 2>&1 | grep "Tests" | head -3
```
Expected: factory count grows by 4 (461 → 465).

- [ ] **Step 16.5: Typecheck**

```bash
bun run typecheck 2>&1 | tail -3
```
Expected: clean.

- [ ] **Step 16.6: Commit**

```bash
git add packages/factory/src/vocabulary-registry.ts packages/factory/test/vocabulary-registry.test.ts
git commit -m "$(cat <<'EOF'
feat(factory): add vocabulary-registry — single-tenant module-level Zod store

Module-level Map of vocabularies keyed by component name plus a
__global__ slot for theme-wide defaults. Populated by
createSoribashiBuilders() at app startup; read by builders' useProps
during render for Zod validation lookup.

Single-tenant — assumes one theme per process. Multi-tenant SSR is
out of scope (spec § 14 risk 5).

Refs: docs/superpowers/specs/2026-05-12-vocabulary-rails-design.md § 10
EOF
)"
```

---

### Task 17: Implement `createSoribashiBuilders(theme)`

Reads the theme's vocab + per-component overrides, registers them, and returns typed builders.

**Files:**
- Create: `packages/factory/src/create-builders.ts`
- Modify: `packages/factory/src/index.ts`
- Create: `packages/factory/test/create-builders.test.ts`

- [ ] **Step 17.1: Write the failing test**

Create `packages/factory/test/create-builders.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createTheme, defineVocabulary } from '@soribashi/theme';
import { createSoribashiBuilders } from '../src/create-builders.ts';
import { resolveVocab, resetRegistry } from '../src/vocabulary-registry.ts';

const minimalTokens = { colors: {}, radius: {}, spacing: {}, fontSize: {} };

describe('createSoribashiBuilders', () => {
  it('returns four builder functions', () => {
    resetRegistry();
    const theme = createTheme({ tokens: minimalTokens });
    const builders = createSoribashiBuilders(theme);
    expect(typeof builders.defineComponent).toBe('function');
    expect(typeof builders.definePolymorphicComponent).toBe('function');
    expect(typeof builders.defineCompound).toBe('function');
    expect(typeof builders.defineGenericComponent).toBe('function');
  });

  it('registers the theme\'s global vocabulary in the registry', () => {
    resetRegistry();
    const customSize = defineVocabulary(['compact', 'standard']);
    const theme = createTheme({
      tokens: minimalTokens,
      vocabulary: { size: customSize },
    });
    createSoribashiBuilders(theme);
    expect(resolveVocab('AnyComponent', 'size')).toBe(customSize);
  });

  it('registers per-component vocabularies from theme.components', () => {
    resetRegistry();
    const buttonSize = defineVocabulary(['compact', 'jumbo']);
    const theme = createTheme({
      tokens: minimalTokens,
      vocabulary: { size: defineVocabulary(['xs', 'md', 'xl']) },
      components: [{
        __soribashiThemeEntry: true,
        name: 'Button',
        vocabulary: { size: buttonSize },
      }],
    });
    createSoribashiBuilders(theme);
    expect(resolveVocab('Button', 'size')).toBe(buttonSize);
    expect(resolveVocab('OtherComponent', 'size')?.values).toEqual(['xs', 'md', 'xl']);
  });
});
```

- [ ] **Step 17.2: Verify the test fails**

```bash
bun run --filter '@soribashi/factory' test 2>&1 | tail -15
```
Expected: failures — module doesn't exist.

- [ ] **Step 17.3: Implement createSoribashiBuilders**

Create `packages/factory/src/create-builders.ts`:

```ts
import type { ResolvedTheme } from '@soribashi/theme';
import { defineComponent } from './define-component.tsx';
import { definePolymorphicComponent } from './define-polymorphic-component.tsx';
import { defineCompound } from './define-compound.tsx';
import { defineGenericComponent } from './define-generic-component.tsx';
import { registerComponentVocabularies } from './vocabulary-registry.ts';

/**
 * Builder factory — the consumer's entry point for vocab-aware builders.
 *
 * Registers the theme's global vocabulary + per-component vocabulary overrides
 * with the runtime registry, then returns the standard four builders. The
 * builders are the SAME implementation regardless — vocab validation is keyed
 * off the registry rather than per-builder configuration.
 *
 * Consumers wire this once in their app:
 *
 *   // apps/my-app/src/builders.ts
 *   import { createSoribashiBuilders } from '@soribashi/core';
 *   import { theme } from './theme';
 *   export const { defineComponent, definePolymorphicComponent, defineCompound } =
 *     createSoribashiBuilders(theme);
 *
 * Then recipes import from '../builders' instead of '@soribashi/core' directly.
 */
export function createSoribashiBuilders(theme: ResolvedTheme) {
  // Register the global vocabulary under __global__
  registerComponentVocabularies('__global__', {
    size: theme.vocabulary.size,
    intent: theme.vocabulary.intent,
    variant: theme.vocabulary.variant,
  });

  // Register per-component vocabularies from theme.components
  // theme.components shape is either Record<string, ComponentThemeConfig> OR
  // a normalized object — handle both. After Task 15's normalize-components
  // update, function-form overrides are already resolved.
  if (Array.isArray(theme.components)) {
    for (const entry of theme.components) {
      if (entry.vocabulary) {
        registerComponentVocabularies(entry.name, entry.vocabulary);
      }
    }
  } else if (typeof theme.components === 'object' && theme.components !== null) {
    for (const [name, config] of Object.entries(theme.components)) {
      if ('vocabulary' in config && config.vocabulary) {
        registerComponentVocabularies(name, config.vocabulary as any);
      }
    }
  }

  return {
    defineComponent,
    definePolymorphicComponent,
    defineCompound,
    defineGenericComponent,
  };
}
```

- [ ] **Step 17.4: Export from factory + core**

In `packages/factory/src/index.ts`:
```ts
export { createSoribashiBuilders } from './create-builders.ts';
```

In `packages/core/src/index.ts` (add to the factory re-export block):
```ts
export { createSoribashiBuilders } from '@soribashi/factory';
```

- [ ] **Step 17.5: Verify tests pass**

```bash
bun run --filter '@soribashi/factory' test 2>&1 | grep "Tests" | head -3
```
Expected: 468 passed (465 from prior + 3 new from this task).

- [ ] **Step 17.6: Typecheck**

```bash
bun run typecheck 2>&1 | tail -3
```
Expected: clean.

- [ ] **Step 17.7: Commit**

```bash
git add packages/factory/src/create-builders.ts packages/factory/src/index.ts packages/core/src/index.ts packages/factory/test/create-builders.test.ts
git commit -m "$(cat <<'EOF'
feat(factory): add createSoribashiBuilders(theme) — vocab-aware builder factory

Returns the standard four builders (defineComponent, definePolymorphicComponent,
defineCompound, defineGenericComponent) after registering the theme's
vocabulary in the runtime registry. Consumers call this once in their
app's builders.ts, then recipes import from '../builders' rather than
'@soribashi/core' directly.

The builders themselves are unchanged — vocab validation is keyed off
the runtime registry, not per-builder configuration. This keeps the
builder implementations simple.

Refs: docs/superpowers/specs/2026-05-12-vocabulary-rails-design.md § 8
EOF
)"
```

---

## Phase E: Vocabulary axes + Zod validation in builders

The wiring that makes the rails enforce vocab at render time.

### Task 18: Add `vocabularyAxes` config support + builder-injected prop typing

**Files:**
- Modify: `packages/factory/src/define-component.tsx`
- Modify: `packages/factory/src/define-polymorphic-component.tsx`
- Modify: `packages/factory/src/define-compound.tsx`
- Modify: `packages/factory/src/types/factory-payload.ts` (or equivalent)

- [ ] **Step 18.1: Define the vocabulary-injected prop types**

In `packages/factory/src/types/vocabulary-axes.ts` (new file):

```ts
import type { Vocabulary } from '@soribashi/theme';

export type VocabularyAxis = 'size' | 'intent' | 'variant';

/**
 * Type-level prop shape injected by builders for opted-in axes.
 *
 * Caveat: with single-tenant module-level registration, the consumer's theme
 * type isn't reachable at builder definition time without a separate type bridge.
 * In this PR, the injected prop is typed as `string` (lossy) — the pilot-migration
 * PR can add tighter type inference via a separate hook (e.g., re-exporting typed
 * builders from createSoribashiBuilders that read the theme's vocab type).
 *
 * The runtime Zod check still enforces values; this typing decision affects only
 * autocomplete in recipe authoring, not safety.
 */
export type InjectedVocabularyProps<TAxes extends readonly VocabularyAxis[]> = {
  [K in TAxes[number]]?: string;
};
```

- [ ] **Step 18.2: Update `DefineComponentConfig` to accept `vocabularyAxes`**

In `packages/factory/src/define-component.tsx`, update the config interface:

```ts
export interface DefineComponentConfig<
  TOwnProps,
  TSelectors extends readonly string[],
  TVariants extends readonly string[],
  TVocabAxes extends readonly VocabularyAxis[] = readonly [],
> {
  name: string;
  element?: keyof JSX.IntrinsicElements;
  vocabularyAxes?: TVocabAxes;
  selectors: TSelectors;
  variants?: TVariants;
  classes?: Partial<Record<TSelectors[number], string>>;
  defaults?: Partial<TOwnProps & InjectedVocabularyProps<TVocabAxes>>;
  vars?: (...) => ...;
  render: (ctx: {
    props: TOwnProps & InjectedVocabularyProps<TVocabAxes> & StylesApiProps<any> & ...;
    getStyles: ...;
    ref: ...;
  }) => React.ReactNode;
}
```

The key changes: add `TVocabAxes` generic, add `vocabularyAxes?: TVocabAxes`, intersect `InjectedVocabularyProps<TVocabAxes>` into both `defaults` and `render`'s `props` type.

Repeat similar changes for `definePolymorphicComponent` and `defineCompound`.

- [ ] **Step 18.3: Add runtime: read vocabularyAxes from config; store on Component for later use**

Inside each builder, persist the axes so the render path can iterate:

```ts
(Component as any).__vocabularyAxes = config.vocabularyAxes ?? [];
```

(This is read in Task 19's Zod validation.)

- [ ] **Step 18.4: Existing tests should still pass**

```bash
bun run --filter '@soribashi/factory' test 2>&1 | grep "Tests" | head -3
```
Expected: factory count unchanged (468).

- [ ] **Step 18.5: Typecheck**

```bash
bun run typecheck 2>&1 | tail -3
```
Expected: clean.

- [ ] **Step 18.6: Commit**

```bash
git add packages/factory/src/
git commit -m "$(cat <<'EOF'
feat(factory): add vocabularyAxes config + builder-injected prop typing

Builders accept an optional vocabularyAxes tuple. Props for the listed
axes are intersected into TOwnProps in the render context, typed as
`string` (lossy single-tenant signal — autocomplete tightening deferred
to the pilot-migration PR via a per-recipe type bridge).

Runtime Zod check (Task 19) enforces actual values regardless of
type tightness.

Refs: docs/superpowers/specs/2026-05-12-vocabulary-rails-design.md § 9
EOF
)"
```

---

### Task 19: Wire Zod runtime validation into builder render paths (dev-only)

**Files:**
- Modify: `packages/factory/src/hooks/use-props.ts` (or wherever the merge happens)
- Modify: `packages/factory/src/define-component.tsx`
- Modify: `packages/factory/src/define-polymorphic-component.tsx`
- Modify: `packages/factory/src/define-compound.tsx`

- [ ] **Step 19.1: Add the validation helper**

In `packages/factory/src/validate-vocabulary-props.ts` (new file):

```ts
import { resolveVocab, type VocabularyAxis } from './vocabulary-registry.ts';

const isDev = (): boolean => {
  // Vite + Vitest both set NODE_ENV; bundlers tree-shake the branch in prod.
  return (
    typeof process !== 'undefined' &&
    process.env?.NODE_ENV !== 'production'
  );
};

/**
 * Validate vocabulary-axis props against the registry's Zod schemas.
 * Dev-only — production bundles eliminate the call via the isDev() check.
 */
export function validateVocabularyProps(
  componentName: string,
  axes: readonly VocabularyAxis[],
  props: Record<string, unknown>,
): void {
  if (!isDev()) return;
  for (const axis of axes) {
    const value = props[axis];
    if (value === undefined) continue;
    const vocab = resolveVocab(componentName, axis);
    if (!vocab) continue; // No registration → no validation (back-compat path)
    const result = vocab.schema.safeParse(value);
    if (!result.success) {
      // eslint-disable-next-line no-console
      console.error(
        `[soribashi] <${componentName} ${axis}=${JSON.stringify(value)}> — value is not in the declared vocabulary.\n` +
          `  Allowed: ${vocab.values.join(', ')}\n` +
          `  Declared at: theme.components.${componentName}.${axis} or theme.vocabulary.${axis}.\n` +
          `  To allow this value, extend the component's vocabulary:\n` +
          `    ${componentName}.extend({ vocabulary: { ${axis}: (cur) => defineVocabulary([...cur.values, ${JSON.stringify(value)}]) } })`,
      );
    }
  }
}
```

- [ ] **Step 19.2: Call the validator inside each builder's render path**

In each builder (`define-component.tsx`, `define-polymorphic-component.tsx`, `define-compound.tsx`), find where `useProps` returns the merged props. Right after:

```ts
const merged = useProps(...);
validateVocabularyProps(config.name, config.vocabularyAxes ?? [], merged as Record<string, unknown>);
```

For `defineCompound`, the root call uses `config.name`; for parts inside the compound, use the part's resolved name (e.g., `${config.name}${capitalize(partKey)}`).

- [ ] **Step 19.3: Write integration tests**

Create `packages/factory/test/vocabulary-validation.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { createTheme, defineVocabulary } from '@soribashi/theme';
import { createSoribashiBuilders } from '../src/create-builders.ts';
import { resetRegistry } from '../src/vocabulary-registry.ts';
import { SoribashiProvider } from '../src/provider/provider.tsx';

const tokens = { colors: {}, radius: {}, spacing: {}, fontSize: {} };

describe('vocabulary runtime validation', () => {
  beforeEach(() => {
    resetRegistry();
  });

  it('does not warn for vocabulary values in the declared set', () => {
    const theme = createTheme({
      tokens,
      vocabulary: { size: defineVocabulary(['small', 'large']) },
    });
    const { defineComponent } = createSoribashiBuilders(theme);
    const Button = defineComponent({
      name: 'TestButton',
      vocabularyAxes: ['size'] as const,
      selectors: ['root'] as const,
      render: ({ props }: any) => <button data-size={props.size}>x</button>,
    });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<SoribashiProvider theme={theme}><Button size="small">x</Button></SoribashiProvider>);
    expect(errSpy).not.toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('warns when a vocabulary-axis prop is outside the declared set', () => {
    const theme = createTheme({
      tokens,
      vocabulary: { size: defineVocabulary(['small', 'large']) },
    });
    const { defineComponent } = createSoribashiBuilders(theme);
    const Button = defineComponent({
      name: 'TestButton',
      vocabularyAxes: ['size'] as const,
      selectors: ['root'] as const,
      render: ({ props }: any) => <button data-size={props.size}>x</button>,
    });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Cast past TS to simulate the runtime-only failure mode
    render(<SoribashiProvider theme={theme}><Button size={'medium' as any}>x</Button></SoribashiProvider>);
    expect(errSpy).toHaveBeenCalled();
    expect((errSpy.mock.calls[0][0] as string)).toContain("not in the declared vocabulary");
    expect((errSpy.mock.calls[0][0] as string)).toContain("small");
    expect((errSpy.mock.calls[0][0] as string)).toContain("large");
    errSpy.mockRestore();
  });

  it('per-component override beats global vocab', () => {
    const buttonSize = defineVocabulary(['compact', 'jumbo']);
    const theme = createTheme({
      tokens,
      vocabulary: { size: defineVocabulary(['s', 'm', 'l']) },
      components: [{
        __soribashiThemeEntry: true,
        name: 'TestButton',
        vocabulary: { size: buttonSize },
      }],
    });
    const { defineComponent } = createSoribashiBuilders(theme);
    const Button = defineComponent({
      name: 'TestButton',
      vocabularyAxes: ['size'] as const,
      selectors: ['root'] as const,
      render: ({ props }: any) => <button data-size={props.size}>x</button>,
    });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<SoribashiProvider theme={theme}><Button size="compact">x</Button></SoribashiProvider>);
    expect(errSpy).not.toHaveBeenCalled();
    render(<SoribashiProvider theme={theme}><Button size={'s' as any}>x</Button></SoribashiProvider>);
    // 's' is in global but NOT in button's override — should warn
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});
```

- [ ] **Step 19.4: Run tests**

```bash
bun run --filter '@soribashi/factory' test 2>&1 | grep "Tests" | head -3
```
Expected: factory count grows by 3 (468 → 471).

- [ ] **Step 19.5: Typecheck**

```bash
bun run typecheck 2>&1 | tail -3
```
Expected: clean.

- [ ] **Step 19.6: Pilot tests still pass**

```bash
cd apps/pilot && bunx vitest run --reporter=basic 2>&1 | tail -4
cd /Users/matt/Documents/GitHub/soribashi/.claude/worktrees/vocabulary-rails-core
```
Expected: 47 passed. Pilot recipes haven't opted into `vocabularyAxes` so validation is a no-op for them.

- [ ] **Step 19.7: Commit**

```bash
git add packages/factory/src/validate-vocabulary-props.ts packages/factory/src/define-component.tsx packages/factory/src/define-polymorphic-component.tsx packages/factory/src/define-compound.tsx packages/factory/test/vocabulary-validation.test.tsx
git commit -m "$(cat <<'EOF'
feat(factory): wire Zod runtime validation into builder render paths

Each builder calls validateVocabularyProps(name, axes, mergedProps)
right after useProps merges. Lookup hits the runtime registry — per-component
override beats global vocab beats no-registration-found (skip).

Dev-only: process.env.NODE_ENV !== 'production' guard means production
bundles tree-shake the call. No production cost.

The error message names the offending value, the allowed set, the
declaration site, and how to extend it via Recipe.extend().

Refs: docs/superpowers/specs/2026-05-12-vocabulary-rails-design.md § 10
EOF
)"
```

---

## Phase F: Pilot keeps building

Minimal pilot update so the test suite continues to pass. Recipes do NOT migrate to vocabularyAxes — that's the next PR.

### Task 20: Verify pilot builds + tests pass after all changes

By this point the pilot's `theme.ts` was already updated in Task 8 (rename to vocabulary + semanticTokens). The pilot's recipes haven't changed, so they should continue to work as-is. This task confirms.

**Files:**
- No file changes — verification only.

- [ ] **Step 20.1: Run all tests**

```bash
bun run typecheck 2>&1 | tail -3
bun run --filter '@soribashi/*' test 2>&1 | grep "Tests" | head -5
cd apps/pilot && bunx vitest run --reporter=basic 2>&1 | tail -4
cd /Users/matt/Documents/GitHub/soribashi/.claude/worktrees/vocabulary-rails-core
```

Expected counts (approximate — may shift slightly based on test additions):
- typecheck: clean
- theme: 78+ (62 baseline + 5 from Task 1 + 7 from Task 5 + 2 from Task 7 + 2 from Task 15)
- codegen: 137 (unchanged)
- factory: 471 (461 baseline + 4 from Task 16 + 3 from Task 17 + 3 from Task 19)
- blocks: 244 (unchanged)
- pilot: 47 (unchanged)

- [ ] **Step 20.2: Start the dev server and verify manually**

```bash
cd apps/pilot && bun run dev
```

Open `http://localhost:5174`. Visually verify Button / Tooltip / Tabs still render correctly. Pilot recipes haven't migrated to vocabularyAxes yet, so their visual surface is unchanged from main.

If anything is broken in the dev playground (not in tests), the most likely cause is a `theme.semantic.X` reference that escaped the Task 8 migration. Grep for it:

```bash
grep -rn "semantic\." apps/pilot/src/ --include="*.ts" --include="*.tsx" | grep -v "semanticTokens"
```

Anything matching is a bug — fix and re-test.

Stop the dev server.

- [ ] **Step 20.3: No commit this task** — verification only.

---

## Phase G: Final verification and PR readiness

### Task 21: Full integration sanity + cleanup

**Files:**
- No file changes — final checks.

- [ ] **Step 21.1: Confirm no `withDefaults` remains in non-test code**

```bash
grep -rn "withDefaults" packages/ apps/ --include="*.ts" --include="*.tsx" | grep -v "\.test\." | grep -v "node_modules" | grep -v "dist" || echo "(no remaining withDefaults — good)"
```
Expected: `(no remaining withDefaults — good)`. If matches appear, migrate them to `extend()`.

- [ ] **Step 21.2: Confirm no `theme.semantic` references in non-test code**

```bash
grep -rn "theme\.semantic\.\|\.semantic\." packages/ apps/ --include="*.ts" --include="*.tsx" | grep -v "semanticTokens" | grep -v "node_modules" | grep -v "dist" | grep -v "\.test\." || echo "(no semantic.X — good)"
```
Expected: `(no semantic.X — good)`.

- [ ] **Step 21.3: Confirm no bare `Size` / `Intent` / `Variant` types exported from soribashi**

```bash
grep -rn "export type.*\b\(Size\|Intent\|Variant\)\b" packages/factory/src/index.ts packages/theme/src/index.ts packages/core/src/index.ts || echo "(no bare type exports — good)"
```
Expected: `(no bare type exports — good)`. The only exports related to these axes should be `Vocabulary` (the container) and `defineVocabulary` (the constructor). No `Size`, `Intent`, `Variant` aliases.

- [ ] **Step 21.4: Full test run**

```bash
bun run typecheck 2>&1 | tail -3
bun run --filter '@soribashi/*' test 2>&1 | grep "Tests" | head -5
cd apps/pilot && bunx vitest run --reporter=basic 2>&1 | tail -4
cd /Users/matt/Documents/GitHub/soribashi/.claude/worktrees/vocabulary-rails-core
```
Expected: all clean, all counts as in Task 20.

- [ ] **Step 21.5: Final git log review**

```bash
git log --oneline main..HEAD
```

Should show ~20 commits across the 21 tasks (some tasks are verification-only). Verify each commit message is descriptive and references the spec.

---

## After all tasks complete

The vocab rails are in place:
- `defineVocabulary()` available
- Theme uses `vocabulary` + `semanticTokens` (no `semantic`)
- `Recipe.extend({ vocabulary })` works with replace + extend-via-function modes
- `createSoribashiBuilders(theme)` registers vocab and returns builders
- `vocabularyAxes` opt-in on builders; dev-only Zod validation enforces values
- Pilot continues to build (recipes not yet migrated)

**Next PR (pilot migration):**
1. Create `apps/pilot/src/builders.ts` calling `createSoribashiBuilders(theme)`
2. Pilot recipes (Button / Tooltip / Tabs) switch imports from `@soribashi/core` to `'../builders'`
3. Pilot recipes add `vocabularyAxes: [...]` and drop local `Intent` / `Variant` / `Size` declarations
4. Tooltip + Tabs get `Recipe.extend({ vocabulary: { variant: defineVocabulary([...]) } })` entries in `theme.components`

**Hand off to user for:**
- PR creation (push branch, `gh pr create`)
- Manual visual sanity in dev playground
- Code review
