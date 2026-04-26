# Roadmap Batch 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port five small Mantine features into soribashi: `CompoundStylesApiProps<P>` type, `removeDefaultVariables` codegen dedup, `cssVariablesResolver` codegen escape hatch, `fontFamilyResolver` for `ff` style prop, and `borderResolver` for `bd` style prop.

**Architecture:** Three independent surfaces. (1) One type alias added to `@soribashi/factory`. (2) `emitCss(theme, opts)` extended with two opt-in codegen knobs (dedup + custom resolver) — keeps the theme pure (Hard Rule 3). (3) Two `STYLE_PROPS_DATA` rows in Box (`ff`, `bd`) switch from identity to typed resolvers; existing tests asserting identity behavior get updated.

**Tech Stack:** TypeScript, React 18+, Vitest, jsdom, Bun workspace. Mantine source pinned to `mantinedev/mantine@63dafbbf5f0135eb36455b7add4c0ddcd0f3240a` at `/Users/matt/Documents/GitHub/mantine`.

**Reference docs:**
- Spec: `docs/superpowers/specs/2026-04-25-roadmap-batch-1-design.md`
- Roadmap: `docs/superpowers/roadmap/mantine-derivable-future-work.md`
- Coverage manifest: `docs/superpowers/audits/2026-04-25-coverage-manifest.md`
- Master ledger: `docs/superpowers/divergences/mantine-master.md`

---

## Conventions (read once before any task)

### Verification gate (run before EVERY commit)

```bash
cd /Users/matt/Documents/GitHub/soribashi
bunx vitest run
bun run typecheck
```

Both must be clean.

### Commit message convention

- `feat(<package>): <description>` — for new features (the 5 items)
- `test(<package>): <description>` — when adding tests in isolation
- `docs: <description>` — for ledger / manifest / roadmap updates

Each commit message references the Mantine source path + commit SHA `63dafbbf` where applicable.

### TDD discipline

For each item: failing test → minimal implementation → confirm test passes → commit. Steps in this plan enforce that order.

### Existing types

`StylePropResolver` (already defined in `packages/blocks/src/Box/style-props/style-types.ts`):

```ts
export type StylePropResolver = (value: unknown) => string | undefined;
```

The two new resolvers (`fontFamilyResolver`, `borderResolver`) implement this exact signature.

---

## Phase A — Item 1: `CompoundStylesApiProps<P>` (type addition)

### Task A.1: Add `CompoundStylesApiProps` type

**Files:**
- Modify: `packages/factory/src/types/props.ts`
- Modify: `packages/factory/src/index.ts`
- Test: `packages/factory/test/compound-styles-api-props.test-d.ts` (new)

- [ ] **Step 1: Read the existing `StylesApiProps` definition.**

```bash
grep -A10 "interface StylesApiProps" packages/factory/src/types/props.ts
```

Expected: see the interface with fields including `unstyled`, `attributes`, plus standard styles-API fields.

- [ ] **Step 2: Write the failing test (compile-time only).**

Create `packages/factory/test/compound-styles-api-props.test-d.ts`:

```ts
import { describe, expectTypeOf, it } from 'vitest';
import type { CompoundStylesApiProps, StylesApiProps } from '../src/index.ts';
import type { FactoryPayload } from '../src/types/factory-payload.ts';

interface TestPayload extends FactoryPayload {
  props: { x: string };
  stylesNames: 'root';
}

describe('CompoundStylesApiProps', () => {
  it('omits `unstyled` and `attributes` from StylesApiProps', () => {
    type Compound = CompoundStylesApiProps<TestPayload>;
    expectTypeOf<Compound>().not.toHaveProperty('unstyled');
    expectTypeOf<Compound>().not.toHaveProperty('attributes');
  });

  it('retains `classNames`, `styles`, `vars` from StylesApiProps', () => {
    type Compound = CompoundStylesApiProps<TestPayload>;
    type Full = StylesApiProps<TestPayload>;
    expectTypeOf<Compound['classNames']>().toEqualTypeOf<Full['classNames']>();
    expectTypeOf<Compound['styles']>().toEqualTypeOf<Full['styles']>();
    expectTypeOf<Compound['vars']>().toEqualTypeOf<Full['vars']>();
  });
});
```

- [ ] **Step 3: Run test to verify it fails.**

```bash
bunx vitest run packages/factory/test/compound-styles-api-props.test-d.ts
```

Expected: FAIL with `Module '"../src/index.ts"' has no exported member 'CompoundStylesApiProps'`.

- [ ] **Step 4: Add the type definition.**

Append to `packages/factory/src/types/props.ts`:

```ts
/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/styles-api/styles-api.types.ts (commit 63dafbbf)
 *
 * Variant of StylesApiProps for compound subcomponents (e.g., Tabs.List, Accordion.Item).
 * Compound subcomponents inherit Styles API surface from their parent and shouldn't
 * redeclare `unstyled` (set on the parent) or `attributes` (also set on the parent).
 */
export interface CompoundStylesApiProps<TPayload extends FactoryPayload>
  extends Omit<StylesApiProps<TPayload>, 'unstyled' | 'attributes'> {}
```

- [ ] **Step 5: Re-export from the factory barrel.**

Edit `packages/factory/src/index.ts` to add (or extend) the existing types re-export:

```ts
export type { StylesApiProps, CompoundStylesApiProps, ClassNames, Styles, Attributes } from './types/props.ts';
```

(Match the existing re-export's style — only add `CompoundStylesApiProps` to the existing exported list; do not duplicate.)

- [ ] **Step 6: Run test to verify it passes.**

```bash
bunx vitest run packages/factory/test/compound-styles-api-props.test-d.ts
```

Expected: PASS.

- [ ] **Step 7: Run full smoke gate.**

```bash
bunx vitest run
bun run typecheck
```

Both clean.

- [ ] **Step 8: Commit.**

```bash
git add packages/factory/src/types/props.ts packages/factory/src/index.ts packages/factory/test/compound-styles-api-props.test-d.ts
git commit -m "feat(factory): add CompoundStylesApiProps type for compound subcomponents

Mantine source: packages/@mantine/core/src/core/styles-api/styles-api.types.ts
Mantine commit: 63dafbbf"
```

---

## Phase B — Item 4: `fontFamilyResolver` for `ff` style prop

### Task B.1: Implement `fontFamilyResolver`

**Files:**
- Create: `packages/blocks/src/Box/style-props/resolvers/font-family-resolver.ts`
- Test: `packages/blocks/test/Box/font-family-resolver.test.ts` (new)

- [ ] **Step 1: Create the resolvers directory.**

```bash
mkdir -p packages/blocks/src/Box/style-props/resolvers
ls packages/blocks/src/Box/style-props/resolvers
```

Expected: empty directory exists.

- [ ] **Step 2: Write the failing tests.**

Create `packages/blocks/test/Box/font-family-resolver.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { fontFamilyResolver } from '../../src/Box/style-props/resolvers/font-family-resolver.ts';

describe('fontFamilyResolver', () => {
  it('text → var(--font-family-sans)', () => {
    expect(fontFamilyResolver('text')).toBe('var(--font-family-sans)');
  });
  it('sans → var(--font-family-sans)', () => {
    expect(fontFamilyResolver('sans')).toBe('var(--font-family-sans)');
  });
  it('mono → var(--font-family-mono)', () => {
    expect(fontFamilyResolver('mono')).toBe('var(--font-family-mono)');
  });
  it('monospace → var(--font-family-mono)', () => {
    expect(fontFamilyResolver('monospace')).toBe('var(--font-family-mono)');
  });
  it('heading → var(--font-family-heading)', () => {
    expect(fontFamilyResolver('heading')).toBe('var(--font-family-heading)');
  });
  it('headings → var(--font-family-heading)', () => {
    expect(fontFamilyResolver('headings')).toBe('var(--font-family-heading)');
  });
  it('non-alias string passes through (e.g., "serif")', () => {
    expect(fontFamilyResolver('serif')).toBe('serif');
  });
  it('full font-family stack passes through', () => {
    expect(fontFamilyResolver('"Inter", sans-serif')).toBe('"Inter", sans-serif');
  });
  it('undefined returns undefined', () => {
    expect(fontFamilyResolver(undefined)).toBeUndefined();
  });
  it('null returns undefined', () => {
    expect(fontFamilyResolver(null)).toBeUndefined();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail.**

```bash
bunx vitest run packages/blocks/test/Box/font-family-resolver.test.ts
```

Expected: FAIL with `Cannot find module '../../src/Box/style-props/resolvers/font-family-resolver.ts'`.

- [ ] **Step 4: Implement the resolver.**

Create `packages/blocks/src/Box/style-props/resolvers/font-family-resolver.ts`:

```ts
/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/Box/style-props/resolvers/font-family-resolver/font-family-resolver.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Token names: --mantine-font-family → --font-family-sans (per substitution table)
 *   - Token names: --mantine-font-family-monospace → --font-family-mono
 *   - Token names: --mantine-font-family-headings → --font-family-heading
 *   - Adds 'sans' as an alias (matches soribashi tokens.fontFamily.sans key)
 */
import type { StylePropResolver } from '../style-types.ts';

const aliases: Record<string, string> = {
  text: 'var(--font-family-sans)',
  sans: 'var(--font-family-sans)',
  mono: 'var(--font-family-mono)',
  monospace: 'var(--font-family-mono)',
  heading: 'var(--font-family-heading)',
  headings: 'var(--font-family-heading)',
};

export const fontFamilyResolver: StylePropResolver = (value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string' && value in aliases) return aliases[value];
  return String(value);
};
```

- [ ] **Step 5: Run tests to verify they pass.**

```bash
bunx vitest run packages/blocks/test/Box/font-family-resolver.test.ts
```

Expected: PASS, 10 tests.

- [ ] **Step 6: Run full smoke gate.**

```bash
bunx vitest run
bun run typecheck
```

Both clean.

- [ ] **Step 7: Commit.**

```bash
git add packages/blocks/src/Box/style-props/resolvers/font-family-resolver.ts packages/blocks/test/Box/font-family-resolver.test.ts
git commit -m "feat(blocks/box): add fontFamilyResolver for ff style prop

Mantine source: packages/@mantine/core/src/core/Box/style-props/resolvers/font-family-resolver/font-family-resolver.ts
Mantine commit: 63dafbbf"
```

---

### Task B.2: Wire `fontFamilyResolver` into `STYLE_PROPS_DATA`

**Files:**
- Modify: `packages/blocks/src/Box/style-props/style-props-data.ts`
- Test: extend `packages/blocks/test/Box/style-props.test.ts` (existing)

- [ ] **Step 1: Find the existing `ff` entry.**

```bash
grep -n "ff:" packages/blocks/src/Box/style-props/style-props-data.ts
```

Expected: a line like `  ff: { property: 'fontFamily', resolver: identity },`.

- [ ] **Step 2: Write the failing integration test.**

Append to `packages/blocks/test/Box/style-props.test.ts` (add tests inside the existing `describe` block — find a logical group like "Box style-props" or add a new sub-describe):

```ts
describe('ff resolver — fontFamily aliases', () => {
  it('ff="mono" → font-family: var(--font-family-mono)', () => {
    const { container } = wrap(<Box ff="mono">X</Box>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.fontFamily).toBe('var(--font-family-mono)');
  });
  it('ff="heading" → font-family: var(--font-family-heading)', () => {
    const { container } = wrap(<Box ff="heading">X</Box>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.fontFamily).toBe('var(--font-family-heading)');
  });
  it('ff="serif" passes through', () => {
    const { container } = wrap(<Box ff="serif">X</Box>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.fontFamily).toBe('serif');
  });
});
```

(If the test file already imports `Box`, `wrap`, etc., reuse them. Otherwise mirror the imports from existing tests in the file.)

- [ ] **Step 3: Run the test to verify it fails.**

```bash
bunx vitest run packages/blocks/test/Box/style-props.test.ts -t "ff resolver"
```

Expected: FAIL — `ff="mono"` produces `mono` (or empty), not `var(--font-family-mono)`, because the current `ff` resolver is identity.

- [ ] **Step 4: Wire the resolver into `STYLE_PROPS_DATA`.**

Edit `packages/blocks/src/Box/style-props/style-props-data.ts`:

1. Add the import at the top (after the existing imports):

```ts
import { fontFamilyResolver } from './resolvers/font-family-resolver.ts';
```

2. Replace the `ff` row:

```ts
ff: { property: 'fontFamily', resolver: fontFamilyResolver },
```

(Was: `ff: { property: 'fontFamily', resolver: identity },`)

- [ ] **Step 5: Run the new tests to verify they pass.**

```bash
bunx vitest run packages/blocks/test/Box/style-props.test.ts -t "ff resolver"
```

Expected: PASS, 3 tests.

- [ ] **Step 6: Run full smoke gate.**

```bash
bunx vitest run
bun run typecheck
bun run --filter @soribashi/playground build
```

All clean. If any pre-existing test for `ff` asserted identity behavior (e.g., `ff="bold"` returning `"bold"`), it should now still pass because `bold` isn't in the alias map.

- [ ] **Step 7: Commit.**

```bash
git add packages/blocks/src/Box/style-props/style-props-data.ts packages/blocks/test/Box/style-props.test.ts
git commit -m "feat(blocks/box): wire fontFamilyResolver into ff style prop

Mantine source: packages/@mantine/core/src/core/Box/style-props/resolvers/font-family-resolver/font-family-resolver.ts
Mantine commit: 63dafbbf"
```

---

## Phase C — Item 5: `borderResolver` for `bd` style prop

### Task C.1: Implement `borderResolver`

**Files:**
- Create: `packages/blocks/src/Box/style-props/resolvers/border-resolver.ts`
- Test: `packages/blocks/test/Box/border-resolver.test.ts` (new)

- [ ] **Step 1: Verify `getThemeColor` and `rem` exports.**

```bash
grep -n "export" packages/blocks/src/utils/index.ts | grep -E "getThemeColor|rem"
```

Expected: both names appear in the export list.

- [ ] **Step 2: Write the failing tests.**

Create `packages/blocks/test/Box/border-resolver.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { borderResolver } from '../../src/Box/style-props/resolvers/border-resolver.ts';

describe('borderResolver', () => {
  it('numeric input is rem-converted', () => {
    expect(borderResolver(1)).toBe('0.0625rem');
    expect(borderResolver(2)).toBe('0.125rem');
  });
  it('"1px solid primary.500" → "0.0625rem solid var(--color-primary-500)"', () => {
    expect(borderResolver('1px solid primary.500')).toBe(
      '0.0625rem solid var(--color-primary-500)',
    );
  });
  it('"2px dashed surface.raised" → semantic-token color resolution', () => {
    expect(borderResolver('2px dashed surface.raised')).toBe(
      '0.125rem dashed var(--surface-raised)',
    );
  });
  it('"1px solid red" → token-resolved (red as a color family alias)', () => {
    expect(borderResolver('1px solid red')).toBe('0.0625rem solid var(--color-red-500)');
  });
  it('"1px solid #abc" → hex passes through getThemeColor unchanged', () => {
    expect(borderResolver('1px solid #abc')).toBe('0.0625rem solid #abc');
  });
  it('"1px solid var(--my-color)" → CSS var passes through', () => {
    expect(borderResolver('1px solid var(--my-color)')).toBe(
      '0.0625rem solid var(--my-color)',
    );
  });
  it('"none" passes through (no dimensions, no color)', () => {
    expect(borderResolver('none')).toBe('none');
  });
  it('"1px solid transparent" → keyword passes through', () => {
    expect(borderResolver('1px solid transparent')).toBe('0.0625rem solid transparent');
  });
  it('undefined returns undefined', () => {
    expect(borderResolver(undefined)).toBeUndefined();
  });
  it('null returns undefined', () => {
    expect(borderResolver(null)).toBeUndefined();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail.**

```bash
bunx vitest run packages/blocks/test/Box/border-resolver.test.ts
```

Expected: FAIL with `Cannot find module '../../src/Box/style-props/resolvers/border-resolver.ts'`.

- [ ] **Step 4: Implement the resolver.**

Create `packages/blocks/src/Box/style-props/resolvers/border-resolver.ts`:

```ts
/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/Box/style-props/resolvers/border-resolver/border-resolver.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Signature: (value) instead of Mantine's (value, theme).
 *     Mantine's colorResolver requires a theme argument because it consults
 *     theme.colors at render time. Soribashi's getThemeColor returns CSS
 *     variable references resolved at paint time — no theme arg needed.
 *   - Color syntax: 'primary.500' (50–950 shade scale) instead of Mantine's
 *     'primary.5' (0–9 shade scale). Inherited from getThemeColor.
 */
import { rem } from '../../../utils/rem.ts';
import { getThemeColor } from '../../../utils/get-theme-color.ts';
import type { StylePropResolver } from '../style-types.ts';

export const borderResolver: StylePropResolver = (value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') return rem(value);
  if (typeof value !== 'string') return String(value);

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
};
```

- [ ] **Step 5: Run tests to verify they pass.**

```bash
bunx vitest run packages/blocks/test/Box/border-resolver.test.ts
```

Expected: PASS, 10 tests.

- [ ] **Step 6: Run full smoke gate.**

```bash
bunx vitest run
bun run typecheck
```

Both clean.

- [ ] **Step 7: Commit.**

```bash
git add packages/blocks/src/Box/style-props/resolvers/border-resolver.ts packages/blocks/test/Box/border-resolver.test.ts
git commit -m "feat(blocks/box): add borderResolver for bd style prop

Mantine source: packages/@mantine/core/src/core/Box/style-props/resolvers/border-resolver/border-resolver.ts
Mantine commit: 63dafbbf
Soribashi divergence: signature is (value) without theme arg, since
getThemeColor returns CSS var refs that the runtime resolves at paint."
```

---

### Task C.2: Wire `borderResolver` into `STYLE_PROPS_DATA`

**Files:**
- Modify: `packages/blocks/src/Box/style-props/style-props-data.ts`
- Test: extend `packages/blocks/test/Box/style-props.test.ts`

- [ ] **Step 1: Write the failing integration test.**

Append to `packages/blocks/test/Box/style-props.test.ts` (sub-describe block for clarity):

```ts
describe('bd resolver — border parsing + token resolution', () => {
  it('bd={1} → border: 0.0625rem', () => {
    const { container } = wrap(<Box bd={1}>X</Box>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.border).toBe('0.0625rem');
  });
  it('bd="1px solid primary.500" resolves to themed CSS var', () => {
    const { container } = wrap(<Box bd="1px solid primary.500">X</Box>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.border).toBe('0.0625rem solid var(--color-primary-500)');
  });
  it('bd="2px dashed surface.raised" resolves semantic token', () => {
    const { container } = wrap(<Box bd="2px dashed surface.raised">X</Box>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.border).toBe('0.125rem dashed var(--surface-raised)');
  });
  it('bd="none" passes through', () => {
    const { container } = wrap(<Box bd="none">X</Box>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.border).toBe('none');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail.**

```bash
bunx vitest run packages/blocks/test/Box/style-props.test.ts -t "bd resolver"
```

Expected: FAIL — current `bd` row uses identity.

- [ ] **Step 3: Wire the resolver into `STYLE_PROPS_DATA`.**

Edit `packages/blocks/src/Box/style-props/style-props-data.ts`:

1. Add the import at the top (after the existing imports):

```ts
import { borderResolver } from './resolvers/border-resolver.ts';
```

2. Replace the `bd` row:

```ts
bd: { property: 'border', resolver: borderResolver },
```

(Was: `bd: { property: 'border', resolver: identity },`)

- [ ] **Step 4: Run new tests to verify they pass.**

```bash
bunx vitest run packages/blocks/test/Box/style-props.test.ts -t "bd resolver"
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Run full smoke gate.**

```bash
bunx vitest run
bun run typecheck
bun run --filter @soribashi/playground build
```

All clean. If any pre-existing test asserted `bd="..."` identity behavior, it must now be updated. The most likely failure pattern: a test that did `expect(el.style.border).toBe('1px solid red')` now needs to expect `'0.0625rem solid var(--color-red-500)'`. Update such tests in place.

- [ ] **Step 6: Commit.**

```bash
git add packages/blocks/src/Box/style-props/style-props-data.ts packages/blocks/test/Box/style-props.test.ts
git commit -m "feat(blocks/box): wire borderResolver into bd style prop

Mantine source: packages/@mantine/core/src/core/Box/style-props/resolvers/border-resolver/border-resolver.ts
Mantine commit: 63dafbbf"
```

---

## Phase D — Item 2: `removeDefaultVariables` codegen dedup

### Task D.1: Define `EmitCssOptions` + `CssVariablesResolver` types

**Files:**
- Modify: `packages/codegen/src/types.ts`
- Modify: `packages/codegen/src/index.ts`

- [ ] **Step 1: Read the existing `types.ts` file.**

```bash
cat packages/codegen/src/types.ts
```

- [ ] **Step 2: Add the new types.**

Append to `packages/codegen/src/types.ts`:

```ts
/**
 * Additional CSS variables to inject into the emit output.
 *
 *   root  — vars added inside the `:root { ... }` block
 *   dark  — vars added inside the `.dark { ... }` block
 *   scopes — per-scope additions (when consumer themes use scope codegen)
 */
export interface CssVariablesAddition {
  root?: Record<string, string>;
  dark?: Record<string, string>;
  scopes?: Record<string, { root?: Record<string, string>; dark?: Record<string, string> }>;
}

/**
 * Consumer-pluggable hook for injecting additional CSS variables at codegen time.
 * Runs once per `emitCss()` invocation. Output is appended to the corresponding
 * blocks; on key conflict, consumer-emitted vars override defaults via the CSS
 * cascade (they emit later within the same selector block).
 *
 * Differs from Mantine's `cssVariablesResolver` (which runs at render time and
 * receives a color-scheme argument). Soribashi's runs at build time and emits
 * both `:root` and `.dark` blocks together; consumers handle scheme via the
 * separate fields.
 */
export type CssVariablesResolver = (theme: ResolvedTheme) => CssVariablesAddition;

/**
 * Options for `emitCss(theme, opts)`. All fields are optional.
 */
export interface EmitCssOptions {
  /**
   * If true, removes token entries that exactly match the soribashi default theme
   * before emitting. Reduces CSS payload for themes that mostly inherit from defaults.
   * @default false
   */
  removeDefaultVariables?: boolean;

  /**
   * Optional consumer-pluggable resolver. Called once per emit; output is appended
   * to `:root`, `.dark`, and (optionally) per-scope blocks.
   */
  cssVariablesResolver?: CssVariablesResolver;
}
```

- [ ] **Step 3: Re-export the new types from the package barrel.**

Edit `packages/codegen/src/index.ts` to add to the existing `export type { ... } from './types.ts';` line (or add a new export type line):

```ts
export type {
  CodegenConfig,
  CodegenOutput,
  TailwindOutput,
  EmitCssOptions,
  CssVariablesAddition,
  CssVariablesResolver,
} from './types.ts';
```

(Match the existing re-export style; only add the three new names.)

- [ ] **Step 4: Run typecheck.**

```bash
bun run typecheck
```

Expected: clean.

- [ ] **Step 5: Commit.**

```bash
git add packages/codegen/src/types.ts packages/codegen/src/index.ts
git commit -m "feat(codegen): add EmitCssOptions, CssVariablesAddition, CssVariablesResolver types

Foundation for removeDefaultVariables and cssVariablesResolver knobs on emitCss()."
```

---

### Task D.2: Implement `removeDefaultVariables`

**Files:**
- Create: `packages/codegen/src/remove-default-variables.ts`
- Test: `packages/codegen/test/remove-default-variables.test.ts` (new)

- [ ] **Step 1: Read the soribashi default tokens to understand the shape.**

```bash
grep -n "export const defaultTokens\|export const defaultDarkTokens" packages/theme/src/tokens/default-tokens.ts
```

Expected: both exports exist.

- [ ] **Step 2: Write the failing tests.**

Create `packages/codegen/test/remove-default-variables.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createTheme } from '@soribashi/theme';
import { removeDefaultVariables } from '../src/remove-default-variables.ts';

describe('removeDefaultVariables', () => {
  it('returns a theme with empty token maps when input matches defaults', () => {
    const theme = createTheme({});
    const dedup = removeDefaultVariables(theme);
    expect(Object.keys(dedup.tokens.spacing ?? {})).toHaveLength(0);
    expect(Object.keys(dedup.tokens.colors ?? {})).toHaveLength(0);
    expect(Object.keys(dedup.tokens.radius ?? {})).toHaveLength(0);
  });

  it('retains overridden spacing keys', () => {
    const theme = createTheme({
      tokens: { spacing: { md: '20px' } },
    });
    const dedup = removeDefaultVariables(theme);
    expect(dedup.tokens.spacing?.md).toBe('20px');
    // Other spacing keys (e.g., xs, sm) match defaults, so they should NOT appear:
    expect(dedup.tokens.spacing?.xs).toBeUndefined();
  });

  it('retains overridden color shade leaves; drops matching ones', () => {
    const theme = createTheme({
      tokens: {
        colors: {
          primary: { 500: '#ff0000' },
        },
      },
    });
    const dedup = removeDefaultVariables(theme);
    expect(dedup.tokens.colors?.primary?.['500']).toBe('#ff0000');
  });

  it('retains overridden heading.sizes leaves at the leaf level', () => {
    const theme = createTheme({
      tokens: {
        heading: {
          sizes: {
            h1: { fontSize: '4rem' }, // override only fontSize, not the whole h1
          },
        },
      },
    });
    const dedup = removeDefaultVariables(theme);
    expect(dedup.tokens.heading?.sizes?.h1?.fontSize).toBe('4rem');
    // h1.fontWeight, h1.lineHeight match defaults — should be dropped from h1:
    expect(dedup.tokens.heading?.sizes?.h1?.fontWeight).toBeUndefined();
    expect(dedup.tokens.heading?.sizes?.h1?.lineHeight).toBeUndefined();
  });

  it('retains overridden dark token entries', () => {
    const theme = createTheme({
      dark: { colors: { primary: { 500: '#0000ff' } } },
    });
    const dedup = removeDefaultVariables(theme);
    expect(dedup.dark?.colors?.primary?.['500']).toBe('#0000ff');
  });

  it('preserves scope (the dedup theme keeps its scope name)', () => {
    const theme = createTheme({ name: 'test', scope: '.test-theme' });
    const dedup = removeDefaultVariables(theme);
    expect(dedup.scope).toBe('.test-theme');
  });
});
```

- [ ] **Step 3: Run tests to verify they fail.**

```bash
bunx vitest run packages/codegen/test/remove-default-variables.test.ts
```

Expected: FAIL with `Cannot find module '../src/remove-default-variables.ts'`.

- [ ] **Step 4: Implement `removeDefaultVariables`.**

Create `packages/codegen/src/remove-default-variables.ts`:

```ts
/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/MantineProvider/MantineCssVariables/remove-default-variables.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Operates on ResolvedTheme (the in-memory token tree) rather than Mantine's
 *     ConvertCSSVariablesInput shape ({variables, light, dark}). Same semantics,
 *     different layer.
 *   - Returns a diff'd ResolvedTheme that the existing `emitCss` pipeline consumes.
 *   - Dedup baseline is the soribashi default tokens (defaultTokens / defaultDarkTokens),
 *     not the user's `extends` chain. Matches Mantine.
 */
import type { ResolvedTheme, PartialThemeTokens, ThemeTokens } from '@soribashi/theme';
import { defaultTokens, defaultDarkTokens } from '@soribashi/theme';

function dedupRecord(
  current: Record<string, string> | undefined,
  base: Record<string, string> | undefined,
): Record<string, string> {
  if (!current) return {};
  if (!base) return { ...current };
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(current)) {
    if (base[key] !== value) result[key] = value;
  }
  return result;
}

function dedupColorScale(
  current: Record<string, Record<string, string>> | undefined,
  base: Record<string, Record<string, string>> | undefined,
): Record<string, Record<string, string>> {
  if (!current) return {};
  const result: Record<string, Record<string, string>> = {};
  for (const [family, shades] of Object.entries(current)) {
    const baseShades = base?.[family];
    const dedupedShades = dedupRecord(shades, baseShades);
    if (Object.keys(dedupedShades).length > 0) result[family] = dedupedShades;
  }
  return result;
}

function dedupHeading(
  current: ThemeTokens['heading'] | undefined,
  base: ThemeTokens['heading'] | undefined,
): ThemeTokens['heading'] | undefined {
  if (!current) return undefined;
  const sizes: Partial<NonNullable<ThemeTokens['heading']>['sizes']> = {};
  if (current.sizes) {
    for (const [order, size] of Object.entries(current.sizes)) {
      const baseSize = base?.sizes?.[order as keyof typeof base.sizes];
      const dedupedSize: Partial<NonNullable<ThemeTokens['heading']>['sizes']['h1']> = {};
      let hasOverride = false;
      for (const [key, value] of Object.entries(size ?? {})) {
        if (baseSize?.[key as keyof typeof baseSize] !== value) {
          (dedupedSize as Record<string, string>)[key] = value as string;
          hasOverride = true;
        }
      }
      if (hasOverride) (sizes as Record<string, unknown>)[order] = dedupedSize;
    }
  }
  const textWrap = current.textWrap === base?.textWrap ? undefined : current.textWrap;
  if (Object.keys(sizes).length === 0 && textWrap === undefined) return undefined;
  return { sizes: sizes as NonNullable<ThemeTokens['heading']>['sizes'], textWrap };
}

function dedupTokens(current: ThemeTokens, base: ThemeTokens): ThemeTokens {
  return {
    colors: dedupColorScale(current.colors, base.colors),
    radius: dedupRecord(current.radius, base.radius),
    spacing: dedupRecord(current.spacing, base.spacing),
    fontSize: dedupRecord(current.fontSize, base.fontSize),
    fontFamily: dedupRecord(current.fontFamily, base.fontFamily),
    fontWeight: dedupRecord(current.fontWeight, base.fontWeight),
    lineHeight: dedupRecord(current.lineHeight, base.lineHeight),
    shadow: dedupRecord(current.shadow, base.shadow),
    breakpoint: dedupRecord(current.breakpoint, base.breakpoint),
    zIndex: dedupRecord(current.zIndex, base.zIndex),
    heading: dedupHeading(current.heading, base.heading),
  };
}

function dedupPartialTokens(
  current: PartialThemeTokens | undefined,
  base: PartialThemeTokens | undefined,
): PartialThemeTokens | undefined {
  if (!current) return undefined;
  if (!base) return current;
  // Same dedup logic as full tokens but treating undefined keys as absent
  return dedupTokens(current as ThemeTokens, base as ThemeTokens);
}

/**
 * Returns a "diff theme" — same shape as the input, but with token entries that
 * match the soribashi default tokens removed. `emitCss(diffTheme)` produces a
 * smaller CSS file.
 */
export function removeDefaultVariables(theme: ResolvedTheme): ResolvedTheme {
  return {
    ...theme,
    tokens: dedupTokens(theme.tokens, defaultTokens),
    dark: dedupPartialTokens(theme.dark, defaultDarkTokens),
  };
}
```

- [ ] **Step 5: Run tests to verify they pass.**

```bash
bunx vitest run packages/codegen/test/remove-default-variables.test.ts
```

Expected: PASS, 6 tests.

- [ ] **Step 6: Run full smoke gate.**

```bash
bunx vitest run
bun run typecheck
```

Both clean.

- [ ] **Step 7: Commit.**

```bash
git add packages/codegen/src/remove-default-variables.ts packages/codegen/test/remove-default-variables.test.ts
git commit -m "feat(codegen): add removeDefaultVariables helper for emit dedup

Mantine source: packages/@mantine/core/src/core/MantineProvider/MantineCssVariables/remove-default-variables.ts
Mantine commit: 63dafbbf
Soribashi divergence: operates on ResolvedTheme (in-memory token tree)
rather than Mantine's ConvertCSSVariablesInput shape."
```

---

### Task D.3: Wire `removeDefaultVariables` into `emitCss`

**Files:**
- Modify: `packages/codegen/src/emit-css.ts`
- Test: extend `packages/codegen/test/emit-css.test.ts`

- [ ] **Step 1: Write the failing tests.**

Append to `packages/codegen/test/emit-css.test.ts`:

```ts
describe('emitCss with EmitCssOptions.removeDefaultVariables', () => {
  it('produces no token vars when theme exactly matches defaults', () => {
    const theme = createTheme({});
    const css = emitCss(theme, { removeDefaultVariables: true });
    // Should still have the :root shell, but no --spacing-*, --color-*, etc.
    expect(css).not.toContain('--spacing-md:');
    expect(css).not.toContain('--color-primary-500:');
    expect(css).not.toContain('--radius-md:');
  });

  it('produces only overridden vars when one token is overridden', () => {
    const theme = createTheme({ tokens: { spacing: { md: '20px' } } });
    const css = emitCss(theme, { removeDefaultVariables: true });
    expect(css).toContain('--spacing-md: 20px;');
    expect(css).not.toContain('--spacing-xs:'); // matches default — dedup'd
  });

  it('default (no opts) emits the full theme as before', () => {
    const theme = createTheme({});
    const css = emitCss(theme);
    expect(css).toContain('--spacing-md:');
  });

  it('removeDefaultVariables: false is equivalent to omitting opts', () => {
    const theme = createTheme({});
    const cssA = emitCss(theme, { removeDefaultVariables: false });
    const cssB = emitCss(theme);
    expect(cssA).toBe(cssB);
  });
});
```

- [ ] **Step 2: Run the new tests to verify they fail.**

```bash
bunx vitest run packages/codegen/test/emit-css.test.ts -t "removeDefaultVariables"
```

Expected: FAIL because `emitCss` doesn't accept a second arg yet.

- [ ] **Step 3: Update `emitCss` to accept `EmitCssOptions`.**

Edit `packages/codegen/src/emit-css.ts`:

1. Add the import at the top:

```ts
import type { EmitCssOptions } from './types.ts';
import { removeDefaultVariables } from './remove-default-variables.ts';
```

2. Update the function signature and add the dedup call at the start of the function body:

```ts
export function emitCss(theme: ResolvedTheme, opts: EmitCssOptions = {}): string {
  const effectiveTheme = opts.removeDefaultVariables ? removeDefaultVariables(theme) : theme;
  const lines: string[] = [HEADER, ''];

  lines.push(`${effectiveTheme.scope} {`);
  // ...
```

Then replace every other reference to `theme` inside the function body with `effectiveTheme`. (The existing function body iterates `theme.tokens.*` and `theme.dark.*`; rename the variable consistently.)

- [ ] **Step 4: Run the new tests to verify they pass.**

```bash
bunx vitest run packages/codegen/test/emit-css.test.ts -t "removeDefaultVariables"
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Run the full `emit-css.test.ts` to ensure no regression.**

```bash
bunx vitest run packages/codegen/test/emit-css.test.ts
```

Expected: all existing tests still pass.

- [ ] **Step 6: Run full smoke gate.**

```bash
bunx vitest run
bun run typecheck
bun run --filter @soribashi/playground build
```

All clean.

- [ ] **Step 7: Commit.**

```bash
git add packages/codegen/src/emit-css.ts packages/codegen/test/emit-css.test.ts
git commit -m "feat(codegen): wire removeDefaultVariables into emitCss(theme, opts)

emitCss now accepts EmitCssOptions as a second arg. When
{ removeDefaultVariables: true }, the theme is dedup'd against
soribashi's default tokens before emission.

Mantine source: packages/@mantine/core/src/core/MantineProvider/MantineCssVariables/remove-default-variables.ts
Mantine commit: 63dafbbf"
```

---

## Phase E — Item 3: `cssVariablesResolver` codegen escape hatch

### Task E.1: Wire `cssVariablesResolver` into `emitCss`

**Files:**
- Modify: `packages/codegen/src/emit-css.ts`
- Test: extend `packages/codegen/test/emit-css.test.ts`

- [ ] **Step 1: Write the failing tests.**

Append to `packages/codegen/test/emit-css.test.ts`:

```ts
describe('emitCss with EmitCssOptions.cssVariablesResolver', () => {
  it('appends `root` vars to the :root block', () => {
    const theme = createTheme({});
    const css = emitCss(theme, {
      cssVariablesResolver: () => ({ root: { '--my-custom': 'red' } }),
    });
    expect(css).toContain('--my-custom: red;');
    // Should be inside the :root block (matches scope), so before first .dark { ... }
    const rootBlock = css.split('.dark')[0];
    expect(rootBlock).toContain('--my-custom: red;');
  });

  it('appends `dark` vars to the .dark block', () => {
    const theme = createTheme({});
    const css = emitCss(theme, {
      cssVariablesResolver: () => ({ dark: { '--my-custom-dark': 'blue' } }),
    });
    // Should be inside the .dark block, not the :root block
    expect(css).toContain('--my-custom-dark: blue;');
    const rootBlock = css.split('.dark')[0];
    expect(rootBlock).not.toContain('--my-custom-dark:');
  });

  it('consumer var overrides default-emitted var on key conflict (later wins via cascade)', () => {
    const theme = createTheme({});
    const css = emitCss(theme, {
      cssVariablesResolver: () => ({ root: { '--spacing-md': '99px' } }),
    });
    // Both lines exist in the :root block; the later one (consumer's) is the cascade winner.
    const rootBlock = css.split('.dark')[0];
    const lastIndex = rootBlock.lastIndexOf('--spacing-md:');
    const lastLine = rootBlock.substring(lastIndex).split(';')[0];
    expect(lastLine).toBe('--spacing-md: 99px');
  });

  it('no resolver passed → emit output is identical to current behavior', () => {
    const theme = createTheme({});
    const cssA = emitCss(theme);
    const cssB = emitCss(theme, {});
    expect(cssA).toBe(cssB);
  });

  it('resolver receives the resolved theme', () => {
    const theme = createTheme({ name: 'my-theme' });
    let received: { name?: string } | null = null;
    emitCss(theme, {
      cssVariablesResolver: (t) => {
        received = t;
        return {};
      },
    });
    expect(received).not.toBeNull();
    expect(received?.name).toBe('my-theme');
  });
});
```

- [ ] **Step 2: Run the new tests to verify they fail.**

```bash
bunx vitest run packages/codegen/test/emit-css.test.ts -t "cssVariablesResolver"
```

Expected: FAIL — emitCss doesn't yet handle the resolver.

- [ ] **Step 3: Update `emitCss` to call the resolver and append output.**

Edit `packages/codegen/src/emit-css.ts`. The current function body is:

```ts
export function emitCss(theme: ResolvedTheme): string {
  const lines: string[] = [HEADER, ''];

  lines.push(`${theme.scope} {`);
  emitTokenLines(lines, theme.tokens);
  emitSemanticLines(lines, theme);
  lines.push('}');

  if (Object.keys(theme.dark).length > 0) {
    lines.push('');
    lines.push(`${theme.darkMode.selector} {`);
    emitDarkTokenLines(lines, theme.dark);
    lines.push('}');
  }

  return `${lines.join('\n')}\n`;
}
```

Replace it with:

```ts
export function emitCss(theme: ResolvedTheme, opts: EmitCssOptions = {}): string {
  const effectiveTheme = opts.removeDefaultVariables ? removeDefaultVariables(theme) : theme;
  const additions = opts.cssVariablesResolver ? opts.cssVariablesResolver(effectiveTheme) : undefined;

  const lines: string[] = [HEADER, ''];

  // :root block
  lines.push(`${effectiveTheme.scope} {`);
  emitTokenLines(lines, effectiveTheme.tokens);
  emitSemanticLines(lines, effectiveTheme);
  if (additions?.root) {
    for (const [key, value] of Object.entries(additions.root)) {
      lines.push(`  ${key}: ${value};`);
    }
  }
  lines.push('}');

  // .dark block — emitted if there are dark token overrides OR consumer dark vars
  const hasDarkTokens = Object.keys(effectiveTheme.dark).length > 0;
  const hasDarkAdditions = additions?.dark && Object.keys(additions.dark).length > 0;
  if (hasDarkTokens || hasDarkAdditions) {
    lines.push('');
    lines.push(`${effectiveTheme.darkMode.selector} {`);
    if (hasDarkTokens) emitDarkTokenLines(lines, effectiveTheme.dark);
    if (additions?.dark) {
      for (const [key, value] of Object.entries(additions.dark)) {
        lines.push(`  ${key}: ${value};`);
      }
    }
    lines.push('}');
  }

  // Optional scopes — flat blocks for each scope name
  if (additions?.scopes) {
    for (const [scopeName, scopeVars] of Object.entries(additions.scopes)) {
      if (scopeVars.root && Object.keys(scopeVars.root).length > 0) {
        lines.push('');
        lines.push(`${scopeName} {`);
        for (const [key, value] of Object.entries(scopeVars.root)) {
          lines.push(`  ${key}: ${value};`);
        }
        lines.push('}');
      }
      if (scopeVars.dark && Object.keys(scopeVars.dark).length > 0) {
        lines.push('');
        lines.push(`${effectiveTheme.darkMode.selector} ${scopeName} {`);
        for (const [key, value] of Object.entries(scopeVars.dark)) {
          lines.push(`  ${key}: ${value};`);
        }
        lines.push('}');
      }
    }
  }

  return `${lines.join('\n')}\n`;
}
```

Key adaptations (vs the original sketch):
- Uses `effectiveTheme.darkMode.selector` (the actual property name on `ResolvedTheme`).
- Preserves the existing trailing newline (`return \`${lines.join('\n')}\n\``).
- Preserves `emitSemanticLines(lines, effectiveTheme)` between `emitTokenLines` and the resolver-root block (current behavior).
- Dark block emits when **either** `theme.dark` has keys OR consumer added `dark` vars — preserves the existing "no dark block emitted if no overrides" behavior while still allowing consumer-only dark additions.
- Scope-dark blocks use the theme's `darkMode.selector` pattern (e.g., `.dark .my-scope`) for consistency.

- [ ] **Step 4: Run the new tests to verify they pass.**

```bash
bunx vitest run packages/codegen/test/emit-css.test.ts -t "cssVariablesResolver"
```

Expected: PASS, 5 tests.

- [ ] **Step 5: Run the full `emit-css.test.ts` to ensure no regression.**

```bash
bunx vitest run packages/codegen/test/emit-css.test.ts
```

Expected: all existing tests still pass.

- [ ] **Step 6: Run full smoke gate.**

```bash
bunx vitest run
bun run typecheck
bun run --filter @soribashi/playground build
```

All clean.

- [ ] **Step 7: Commit.**

```bash
git add packages/codegen/src/emit-css.ts packages/codegen/test/emit-css.test.ts
git commit -m "feat(codegen): wire cssVariablesResolver escape hatch into emitCss

Consumer-pluggable resolver runs at codegen time. Output is appended
to :root, .dark, and (optionally) per-scope blocks; consumer-emitted
vars override defaults via CSS cascade.

Mantine source: packages/@mantine/core/src/core/MantineProvider/MantineProvider.tsx (cssVariablesResolver prop)
Mantine commit: 63dafbbf
Soribashi divergence: build-time vs Mantine's render-time. Documented
in the divergence ledger."
```

---

### Task E.2: Plumb both options through `loadConfig`

**Files:**
- Modify: `packages/codegen/src/load-config.ts`
- Modify: `packages/codegen/src/types.ts` (extend `CodegenConfig` with optional `emit`)
- Modify: `packages/codegen/src/build.ts` (read `config.emit` and pass to `emitCss`)
- Test: extend `packages/codegen/test/load-config.test.ts`

- [ ] **Step 1: Read the existing `CodegenConfig` and `build` flow.**

```bash
grep -A8 "interface CodegenConfig" packages/codegen/src/types.ts
grep -A20 "export function build\|emitCss" packages/codegen/src/build.ts | head -40
```

- [ ] **Step 2: Write the failing test for `loadConfig` accepting `emit` options.**

Append to `packages/codegen/test/load-config.test.ts` (or whatever the existing test pattern is — adapt as needed):

```ts
describe('loadConfig with emit options', () => {
  it('accepts emit.removeDefaultVariables in soribashi.config', async () => {
    const cfg = await loadConfig({
      theme: createTheme({}),
      output: { css: './out.css' },
      emit: { removeDefaultVariables: true },
    });
    expect(cfg.emit?.removeDefaultVariables).toBe(true);
  });
  it('accepts emit.cssVariablesResolver as a function', async () => {
    const resolver = () => ({ root: { '--x': 'y' } });
    const cfg = await loadConfig({
      theme: createTheme({}),
      output: { css: './out.css' },
      emit: { cssVariablesResolver: resolver },
    });
    expect(typeof cfg.emit?.cssVariablesResolver).toBe('function');
  });
});
```

(The existing `loadConfig.test.ts` will show the actual pattern — read it and adapt the test to match.)

- [ ] **Step 3: Run tests to verify they fail.**

```bash
bunx vitest run packages/codegen/test/load-config.test.ts -t "emit options"
```

Expected: FAIL — `CodegenConfig` doesn't yet have an `emit` field.

- [ ] **Step 4: Add `emit` to `CodegenConfig`.**

Edit `packages/codegen/src/types.ts`:

```ts
export interface CodegenConfig {
  theme: ResolvedTheme;
  output: CodegenOutput;
  watch?: string[];
  /** Optional codegen knobs passed to emitCss. */
  emit?: EmitCssOptions;
}
```

- [ ] **Step 5: Update `build.ts` to thread `config.emit` through to `emitCss`.**

Find the `emitCss(...)` call in `build.ts` and update to pass `config.emit`:

```ts
const css = emitCss(config.theme, config.emit);
```

(If `build.ts` calls `emitCss` more than once, update each call.)

- [ ] **Step 6: Run tests to verify they pass.**

```bash
bunx vitest run packages/codegen/test/load-config.test.ts -t "emit options"
bunx vitest run packages/codegen/test/build.test.ts
```

Both must pass.

- [ ] **Step 7: Run full smoke gate.**

```bash
bunx vitest run
bun run typecheck
```

Both clean.

- [ ] **Step 8: Commit.**

```bash
git add packages/codegen/src/types.ts packages/codegen/src/load-config.ts packages/codegen/src/build.ts packages/codegen/test/load-config.test.ts
git commit -m "feat(codegen): plumb EmitCssOptions through CodegenConfig.emit

Consumers can declare removeDefaultVariables and cssVariablesResolver
in soribashi.config.ts; build() passes them to emitCss(theme, opts)."
```

---

## Phase F — Wrap-up: ledger, manifest, roadmap, smoke

### Task F.1: Update divergence ledger

**Files:**
- Modify: `docs/superpowers/divergences/mantine-master.md`

- [ ] **Step 1: Open the ledger and find the "Full audit pass — 2026-04-25" section.**

```bash
grep -n "^## Full audit pass" docs/superpowers/divergences/mantine-master.md
```

- [ ] **Step 2: Add a new top-level section after the existing audit pass section.**

Append to `docs/superpowers/divergences/mantine-master.md`:

```markdown

---

## Roadmap Batch 1 — 2026-04-25

Five items from `docs/superpowers/roadmap/mantine-derivable-future-work.md` ported into soribashi. Spec: `docs/superpowers/specs/2026-04-25-roadmap-batch-1-design.md`.

### `CompoundStylesApiProps<P>` — direct port

- **File:** `packages/factory/src/types/props.ts`
- **Mantine source:** `packages/@mantine/core/src/core/styles-api/styles-api.types.ts` (commit 63dafbbf)
- **Mantine behavior:** `Omit<StylesApiProps, 'unstyled' | 'attributes'>` — variant for compound subcomponents.
- **Soribashi behavior:** Identical port. Same `Omit`, same purpose.
- **Disposition:** Aligned (added)
- **Test:** `packages/factory/test/compound-styles-api-props.test-d.ts`

### `removeDefaultVariables` — operates on `ResolvedTheme` not `ConvertCSSVariablesInput`

- **File:** `packages/codegen/src/remove-default-variables.ts`
- **Mantine source:** `packages/@mantine/core/src/core/MantineProvider/MantineCssVariables/remove-default-variables.ts` (commit 63dafbbf)
- **Mantine behavior:** Diffs `ConvertCSSVariablesInput` (`{variables, light, dark}`) against the default theme's emit output, key by key.
- **Soribashi behavior:** Diffs a `ResolvedTheme` (the in-memory token tree) against soribashi's `defaultTokens` / `defaultDarkTokens`. Returns a diff'd `ResolvedTheme` that the existing `emitCss` pipeline consumes.
- **Reason for divergence:** Soribashi's codegen runs at build time and operates on the in-memory token tree. Mantine's runs at render time on the post-emit CSS-var shape. Equivalent semantics, different layer.
- **Disposition:** Aligned (added)
- **Test:** `packages/codegen/test/remove-default-variables.test.ts` + `emit-css.test.ts` integration tests.

### `cssVariablesResolver` — build-time escape hatch (not render-time)

- **File:** `packages/codegen/src/emit-css.ts` (option) + `packages/codegen/src/types.ts` (type export)
- **Mantine source:** `packages/@mantine/core/src/core/MantineProvider/MantineProvider.tsx` (`cssVariablesResolver` prop, commit 63dafbbf)
- **Mantine behavior:** Provider prop. Runs at render time, receives the theme and current color scheme, returns `{ variables, light, dark }`. Mantine merges the result with its default resolver's output.
- **Soribashi behavior:** `EmitCssOptions.cssVariablesResolver: (theme: ResolvedTheme) => CssVariablesAddition`. Runs at codegen build time. Output is appended to the `:root`, `.dark`, and (optionally) per-scope blocks in the emitted CSS string.
- **Reason for divergence:** Soribashi's codegen runs at build time, not render time. There is no provider hook to run a resolver from. The emit-time escape hatch achieves the same goal (consumer-injected vars) at the appropriate architectural layer.
- **Disposition:** Kept (intentional architectural divergence)
- **Test:** `packages/codegen/test/emit-css.test.ts` — `cssVariablesResolver` describe block.

### `fontFamilyResolver` — soribashi-tokenname adaptation

- **File:** `packages/blocks/src/Box/style-props/resolvers/font-family-resolver.ts`
- **Mantine source:** `packages/@mantine/core/src/core/Box/style-props/resolvers/font-family-resolver/font-family-resolver.ts` (commit 63dafbbf)
- **Mantine behavior:** Alias map for `text/mono/monospace/heading/headings` keys → corresponding Mantine font-family CSS vars.
- **Soribashi behavior:** Same shape. Token names: `text/sans` → `var(--font-family-sans)`, `mono/monospace` → `var(--font-family-mono)`, `heading/headings` → `var(--font-family-heading)`. Soribashi adds `sans` as an alias to match the soribashi `tokens.fontFamily.sans` key.
- **Disposition:** Aligned (TOKEN_DIFF + soribashi alias addition)
- **Test:** `packages/blocks/test/Box/font-family-resolver.test.ts`

### `borderResolver` — `(value)` signature without theme

- **File:** `packages/blocks/src/Box/style-props/resolvers/border-resolver.ts`
- **Mantine source:** `packages/@mantine/core/src/core/Box/style-props/resolvers/border-resolver/border-resolver.ts` (commit 63dafbbf)
- **Mantine behavior:** `(value, theme) => string`. Splits `"size style color"` and calls `colorResolver(color, theme)`.
- **Soribashi behavior:** `(value) => string | undefined`. Splits `"size style color"` and calls `getThemeColor(color)`. No `theme` arg required because `getThemeColor` returns CSS variable references resolved at paint time, not values from the theme tree.
- **Reason for divergence:** Soribashi's `getThemeColor` is a pure function that returns `var(--color-*)` references. The runtime resolves the var; soribashi's resolver doesn't need the theme at codegen time.
- **Disposition:** Kept (signature divergence; same observable behavior)
- **Test:** `packages/blocks/test/Box/border-resolver.test.ts`
```

- [ ] **Step 3: Verify the ledger has no markdown linter errors.**

(No automated check — eyeball the headings + bullets.)

- [ ] **Step 4: Commit.**

```bash
git add docs/superpowers/divergences/mantine-master.md
git commit -m "docs: ledger — add Roadmap Batch 1 entries

Five new entries documenting the divergences in CompoundStylesApiProps,
removeDefaultVariables, cssVariablesResolver, fontFamilyResolver,
borderResolver."
```

---

### Task F.2: Update coverage manifest

**Files:**
- Modify: `docs/superpowers/audits/2026-04-25-coverage-manifest.md`

- [ ] **Step 1: Append rows for the new files.**

Open `docs/superpowers/audits/2026-04-25-coverage-manifest.md` and add to the bottom of the table:

```markdown
| packages/codegen/src/remove-default-variables.ts | core/MantineProvider/MantineCssVariables/remove-default-variables.ts | 2 | aligned (added) | (Roadmap Batch 1) | removeDefaultVariables-resolved-theme-vs-cssvarinput (Aligned, new) |
| packages/blocks/src/Box/style-props/resolvers/font-family-resolver.ts | core/Box/style-props/resolvers/font-family-resolver/font-family-resolver.ts | 2 | aligned (added) | (Roadmap Batch 1) | fontFamilyResolver-token-names-and-sans-alias (Aligned, new) |
| packages/blocks/src/Box/style-props/resolvers/border-resolver.ts | core/Box/style-props/resolvers/border-resolver/border-resolver.ts | 2 | aligned (added) | (Roadmap Batch 1) | borderResolver-no-theme-arg (Kept, new) |
```

- [ ] **Step 2: Update existing rows for files that gained new exports.**

For `packages/factory/src/types/props.ts`: the existing manifest row (if it exists for that file) should be updated to note the new `CompoundStylesApiProps` export. If no row exists for `props.ts`, the existing T2-B `provider-types` audit doc covers it — leave a note in the ledger entry instead.

For `packages/codegen/src/emit-css.ts`: the existing row mentions `EmitCssOptions` — update its ledger-entries column to also reference `cssVariablesResolver-build-time-vs-render-time (Kept, new)`.

- [ ] **Step 3: Commit.**

```bash
git add docs/superpowers/audits/2026-04-25-coverage-manifest.md
git commit -m "docs: manifest — add rows for Roadmap Batch 1 new files"
```

---

### Task F.3: Update roadmap doc

**Files:**
- Modify: `docs/superpowers/roadmap/mantine-derivable-future-work.md`

- [ ] **Step 1: Mark items 1, 2, 3, 4, 5 from this batch as DONE.**

Open the roadmap and modify the table. For each of the 5 items implemented, prepend a status indicator and add a "Done in" column entry:

For row matching `core/styles-api/styles-api.types.ts (CompoundStylesApiProps)`:
- Change description prefix to `✅ DONE — `
- Or add a final column: `Status: shipped (Roadmap Batch 1, 2026-04-25)`

(Adapt to the existing table format. The simplest edit is to append "**(DONE — Roadmap Batch 1, 2026-04-25)**" to the Description cell of each of the 5 items.)

- [ ] **Step 2: Commit.**

```bash
git add docs/superpowers/roadmap/mantine-derivable-future-work.md
git commit -m "docs: roadmap — mark Batch 1 items as shipped"
```

---

### Task F.4: Final smoke

- [ ] **Step 1: Run all test surfaces.**

```bash
cd /Users/matt/Documents/GitHub/soribashi
bunx vitest run
```

Expected: all green; test count = previous + new tests added in this plan (~33).

- [ ] **Step 2: Typecheck.**

```bash
bun run typecheck
```

Expected: clean.

- [ ] **Step 3: Codegen + playground build.**

```bash
bun run codegen
bun run --filter @soribashi/playground build
```

Expected: clean. The playground generated `theme.css` should be unchanged from the previous run because no theme was modified and the new options default to false / undefined.

- [ ] **Step 4: Browser-parity tests.**

```bash
bun run test:browser
```

Expected: 46 passing.

- [ ] **Step 5: CSS parity script.**

```bash
bunx tsx packages/blocks/scripts/css-parity-audit.ts
```

Expected: matches prior known-good output.

- [ ] **Step 6: Final marker commit.**

```bash
git commit --allow-empty -m "chore: Roadmap Batch 1 complete — 5 audit-surfaced items shipped"
```

---

## Acceptance criteria

The work is complete when ALL hold:

1. ✅ `CompoundStylesApiProps<P>` exported from `@soribashi/factory` and used in a type-fixture test that compiles.
2. ✅ `emitCss(theme, { removeDefaultVariables: true })` produces a strictly smaller CSS file for any theme that overlaps with defaults.
3. ✅ `emitCss(theme, { cssVariablesResolver: ... })` emits the resolver's vars in the right blocks (`:root`, `.dark`, optional scopes).
4. ✅ `<Box ff="mono">` renders with `font-family: var(--font-family-mono)`. `<Box ff="serif">` passes through.
5. ✅ `<Box bd="1px solid primary.500">` resolves to `0.0625rem solid var(--color-primary-500)`.
6. ✅ All Phase F.4 smoke checks green.
7. ✅ Coverage manifest updated with rows for the 3 new source files.
8. ✅ Divergence ledger has a "Roadmap Batch 1 — 2026-04-25" section with 5 entries.
9. ✅ Roadmap doc has the 5 items marked done.
10. ✅ `git log --oneline` shows atomic commits per task (or per logical group).
