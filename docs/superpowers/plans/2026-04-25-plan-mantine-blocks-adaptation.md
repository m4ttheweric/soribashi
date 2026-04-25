# Mantine Blocks Adaptation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace soribashi's stripped-down blocks with faithful adaptations of Mantine's blocks + Box style-prop machinery. MIT-licensed source; preserve attribution.

**Architecture:** Read Mantine source at `/Users/matt/Documents/GitHub/mantine` as canonical reference. For each file, copy the structural pattern, substitute token names per the mapping in `docs/superpowers/specs/2026-04-25-mantine-blocks-adaptation-design.md` § 4, retarget imports from `'../../core'` to `@soribashi/factory` / `@soribashi/theme`, replace `@mixin light`/`@mixin dark` postcss helpers with `:root`/`.dark` selectors, and prepend per-file attribution comments.

**Tech Stack:** TypeScript, React 18+, Vitest, jsdom. No new runtime dependencies.

**Reference docs:**
- Spec: `docs/superpowers/specs/2026-04-25-mantine-blocks-adaptation-design.md`
- Token substitution table: spec § 4
- Mantine source: `/Users/matt/Documents/GitHub/mantine/packages/@mantine/core/src`

---

## Adaptation conventions (apply to every adapted file)

1. **Attribution header** at top of every adapted file:
```ts
/**
 * Adapted from @mantine/core
 * Source: <relative path inside Mantine repo>
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 */
```

2. **Import retargeting:**
   - `from '../../core'` → `from '@soribashi/factory'` and/or `from '@soribashi/theme'`
   - `from './X.module.css'` → unchanged (CSS modules stay co-located)
   - Mantine's internal helpers (`getSpacing`, `getRadius`, etc.) → import from `@soribashi/blocks/utils` (this plan ports those)

3. **Token name substitutions** (apply to every CSS file and every CSS-var reference in TS):
   - `--mantine-spacing-{key}` → `--spacing-{key}`
   - `--mantine-color-{family}-{shade}` → `--color-{family}-{shade}`
   - `--mantine-radius-{key}` → `--radius-{key}`; `--mantine-radius-default` → `--radius-md`
   - `--mantine-color-body` → `--surface-default`
   - `--mantine-color-text` → `--text-default`
   - `--mantine-font-size-{key}` → `--font-size-{key}`
   - `--mantine-line-height-{key}` → `--line-height-{key}`
   - `--mantine-font-weight-{key}` → `--font-weight-{key}`
   - `--mantine-font-family` → `--font-family-sans`
   - `--mantine-font-family-headings` → `--font-family-heading`
   - `--mantine-shadow-{key}` → `--shadow-{key}`

4. **`@mixin light`/`@mixin dark`** → standard CSS:
```css
:root      { /* ...light values... */ }
.dark      { /* ...dark values... */ }
```

5. **`rem(Npx)` postcss helper** → call our own `rem(N)` utility (Phase 2) or substitute the literal value where trivial.

6. **`factory<F>`/`polymorphicFactory<F>`** Mantine calls → use soribashi's own `factory<F>`/`polymorphicComponent<F>` exports from `@soribashi/factory` (their runtime is equivalent). The pattern stays the same.

7. **Class-prefix:** Mantine emits `mantine-Stack-root`-style classes via context. Soribashi uses stable `sb-{Component}-{selector}` names directly inline. The CSS module file uses these directly as class selectors.

8. **NEVER paste Mantine source verbatim into any soribashi file without the attribution header** above. Per Hard Rule 13 of the soribashi spec.

---

# Phase 0 — Attribution & License

## Task 0.1: Add THIRD-PARTY-LICENSES.md

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/THIRD-PARTY-LICENSES.md`

- [ ] **Step 1: Write the file** by reading Mantine's LICENSE at `/Users/matt/Documents/GitHub/mantine/LICENSE` and including its full content in `THIRD-PARTY-LICENSES.md`. Format:

```markdown
# Third-Party Licenses

Soribashi adapts code from the following open-source projects. Their full licenses are reproduced below.

## Mantine

- Project: https://github.com/mantinedev/mantine
- Used in: `packages/blocks/`, `packages/factory/src/inline-styles/`, `packages/factory/src/use-random-class-name.ts`, `packages/factory/src/hash-style-props.ts`
- License: MIT
- Validated against commit: 63dafbbf (master, 2026-04-25)

<paste the full text of /Users/matt/Documents/GitHub/mantine/LICENSE here, including the copyright notice>
```

- [ ] **Step 2: Commit**

```bash
git add THIRD-PARTY-LICENSES.md
git commit -m "chore: add Mantine MIT license attribution for blocks adaptation"
```

---

# Phase 1 — Theme additions

## Task 1.1: Extend ThemeTokens type with fontWeight, lineHeight, heading

**Files:**
- Modify: `/Users/matt/Documents/GitHub/soribashi/packages/theme/src/types.ts`

- [ ] **Step 1: Write failing tests in** `packages/theme/test/types.test.ts` (append at end of describe block):

```ts
it('ThemeTokens accepts fontWeight, lineHeight, and heading maps', () => {
  const tokens: ThemeTokens = {
    colors: {},
    radius: {},
    spacing: {},
    fontSize: {},
    fontWeight: { regular: '400', medium: '500', semibold: '600', bold: '700' },
    lineHeight: { sm: '1.4', md: '1.55', lg: '1.65' },
    fontFamily: { sans: 'Inter', heading: 'Inter' },
    heading: {
      sizes: {
        h1: { fontSize: '2.125rem', fontWeight: '700', lineHeight: '1.3' },
        h2: { fontSize: '1.625rem', fontWeight: '700', lineHeight: '1.35' },
      },
      textWrap: 'wrap',
    },
  };
  expect(tokens.fontWeight?.regular).toBe('400');
  expect(tokens.lineHeight?.md).toBe('1.55');
  expect(tokens.heading?.sizes.h1?.fontSize).toBe('2.125rem');
});
```

- [ ] **Step 2: Run test (FAIL)**

```bash
cd /Users/matt/Documents/GitHub/soribashi && bunx vitest run packages/theme/test/types.test.ts
```

- [ ] **Step 3: Update `ThemeTokens` interface in `packages/theme/src/types.ts`:**

Add these fields to the `ThemeTokens` interface (after the existing `fontFamily`):

```ts
  fontWeight?: Record<string, string>;
  lineHeight?: Record<string, string>;
  heading?: {
    sizes: Record<'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6', {
      fontSize: string;
      fontWeight?: string;
      lineHeight?: string;
    }>;
    textWrap?: string;
  };
```

Update `PartialThemeTokens` similarly with `Partial<...>` versions.

- [ ] **Step 4: Run test (PASS)**

```bash
bunx vitest run packages/theme/test/types.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add packages/theme/src/types.ts packages/theme/test/types.test.ts
git commit -m "feat(theme): add fontWeight, lineHeight, and heading sizes to ThemeTokens"
```

---

## Task 1.2: Default values for new tokens

**Files:**
- Modify: `/Users/matt/Documents/GitHub/soribashi/packages/theme/src/tokens/default-tokens.ts`

- [ ] **Step 1: Write failing test in** `packages/theme/test/default-tokens.test.ts` (append):

```ts
it('default tokens include fontWeight, lineHeight, fontFamily.heading, heading.sizes', () => {
  expect(defaultTokens.fontWeight?.regular).toBe('400');
  expect(defaultTokens.fontWeight?.bold).toBe('700');
  expect(defaultTokens.lineHeight?.md).toBeDefined();
  expect(defaultTokens.fontFamily?.heading).toBeDefined();
  expect(defaultTokens.heading?.sizes.h1).toBeDefined();
  expect(defaultTokens.heading?.sizes.h6).toBeDefined();
});
```

- [ ] **Step 2: Run test (FAIL)**

- [ ] **Step 3: Add to `defaultTokens` object in `packages/theme/src/tokens/default-tokens.ts`:**

```ts
  fontFamily: {
    sans: 'Inter, ui-sans-serif, system-ui, sans-serif',
    heading: 'Inter, ui-sans-serif, system-ui, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    xs: '1.4',
    sm: '1.45',
    md: '1.55',
    lg: '1.6',
    xl: '1.65',
  },
  heading: {
    sizes: {
      h1: { fontSize: '2.125rem', fontWeight: '700', lineHeight: '1.3' },
      h2: { fontSize: '1.625rem', fontWeight: '700', lineHeight: '1.35' },
      h3: { fontSize: '1.375rem', fontWeight: '700', lineHeight: '1.4' },
      h4: { fontSize: '1.125rem', fontWeight: '700', lineHeight: '1.45' },
      h5: { fontSize: '1rem',     fontWeight: '700', lineHeight: '1.5' },
      h6: { fontSize: '0.875rem', fontWeight: '700', lineHeight: '1.5' },
    },
    textWrap: 'wrap',
  },
```

- [ ] **Step 4: Run test (PASS)**

- [ ] **Step 5: Commit**

```bash
git add packages/theme/src/tokens/default-tokens.ts packages/theme/test/default-tokens.test.ts
git commit -m "feat(theme): add default values for fontWeight, lineHeight, heading sizes"
```

## Task 1.3: Codegen emits new theme tokens as CSS variables

**Files:**
- Modify: `/Users/matt/Documents/GitHub/soribashi/packages/codegen/src/emit-css.ts`
- Modify: `/Users/matt/Documents/GitHub/soribashi/packages/codegen/src/emit-tailwind-v3.ts`
- Modify: `/Users/matt/Documents/GitHub/soribashi/packages/codegen/src/emit-tailwind-v4.ts`

- [ ] **Step 1: Write failing test in** `packages/codegen/test/emit-css.test.ts` (append):

```ts
it('emits font-weight, line-height, font-family-heading vars', () => {
  const theme = createTheme({
    tokens: {
      colors: {}, radius: {}, spacing: {}, fontSize: {},
      fontFamily: { sans: 'Inter', heading: 'Georgia' },
      fontWeight: { regular: '400', bold: '700' },
      lineHeight: { md: '1.55' },
    },
  });
  const css = emitCss(theme);
  expect(css).toContain('--font-family-heading: Georgia;');
  expect(css).toContain('--font-weight-regular: 400;');
  expect(css).toContain('--font-weight-bold: 700;');
  expect(css).toContain('--line-height-md: 1.55;');
});
```

- [ ] **Step 2: Run test (FAIL)**

- [ ] **Step 3: Update `emit-css.ts`** — extend `emitTokenLines` to emit `fontWeight` (prefix `--font-weight-`) and `lineHeight` (prefix `--line-height-`); fontFamily already iterates the map so adding `heading` happens automatically.

```ts
  if (tokens.fontWeight) {
    for (const [key, value] of Object.entries(tokens.fontWeight).sort(byKey)) {
      lines.push(`  --font-weight-${key}: ${value};`);
    }
  }
  if (tokens.lineHeight) {
    for (const [key, value] of Object.entries(tokens.lineHeight).sort(byKey)) {
      lines.push(`  --line-height-${key}: ${value};`);
    }
  }
```

Apply the analogous additions in `emit-tailwind-v3.ts` (using `emitVarMap`) and `emit-tailwind-v4.ts`.

- [ ] **Step 4: Run all codegen tests (PASS)**

```bash
bunx vitest run packages/codegen
```

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/ packages/codegen/test/
git commit -m "feat(codegen): emit font-weight, line-height, font-family-heading CSS vars"
```

---

# Phase 2 — Helper utilities

These are small pure functions Mantine uses across blocks. We port them to `packages/blocks/src/utils/`.

## Task 2.1: rem helper

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/blocks/src/utils/rem.ts`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/blocks/test/utils/rem.test.ts`

- [ ] **Step 1: Write failing test:**

```ts
import { describe, expect, it } from 'vitest';
import { rem } from '../../src/utils/rem.ts';

describe('rem', () => {
  it('converts pixel numbers to rem strings', () => {
    expect(rem(16)).toBe('1rem');
    expect(rem(8)).toBe('0.5rem');
    expect(rem(24)).toBe('1.5rem');
  });
  it('passes through string values unchanged', () => {
    expect(rem('1.5rem')).toBe('1.5rem');
    expect(rem('var(--x)')).toBe('var(--x)');
  });
  it('returns 0 for 0', () => {
    expect(rem(0)).toBe('0rem');
  });
  it('returns undefined for undefined', () => {
    expect(rem(undefined)).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test (FAIL)**

- [ ] **Step 3: Implement** `packages/blocks/src/utils/rem.ts` (with attribution header pointing to Mantine's `core/utils/rem/rem.ts`):

```ts
export function rem(value: number | string | undefined): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') return value;
  return `${value / 16}rem`;
}
```

- [ ] **Step 4: Run test (PASS)**

- [ ] **Step 5: Commit**

```bash
git add packages/blocks/src/utils/rem.ts packages/blocks/test/utils/rem.test.ts
git commit -m "feat(blocks/utils): add rem() helper adapted from Mantine"
```

## Task 2.2: Token getters (getSpacing, getRadius, getSize, getFontSize, getLineHeight, getShadow)

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/blocks/src/utils/get-spacing.ts`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/blocks/src/utils/get-radius.ts`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/blocks/src/utils/get-size.ts`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/blocks/src/utils/get-font-size.ts`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/blocks/src/utils/get-line-height.ts`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/blocks/src/utils/get-shadow.ts`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/blocks/src/utils/index.ts`

The pattern in Mantine: each `get<Token>(value)` returns either:
- `var(--{prefix}-{value})` if `value` is a known token key (`'sm' | 'md' | 'lg'` etc.)
- `rem(value)` if `value` is a number
- The string verbatim otherwise

Reference: `/Users/matt/Documents/GitHub/mantine/packages/@mantine/core/src/core/utils/get-size/get-size.ts` and the related files.

- [ ] **Step 1: Write failing test for getSpacing in** `packages/blocks/test/utils/get-spacing.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { getSpacing } from '../../src/utils/get-spacing.ts';

describe('getSpacing', () => {
  it('returns var(--spacing-{key}) for known token keys', () => {
    expect(getSpacing('md')).toBe('var(--spacing-md)');
    expect(getSpacing('lg')).toBe('var(--spacing-lg)');
  });
  it('returns rem string for numbers', () => {
    expect(getSpacing(16)).toBe('1rem');
  });
  it('returns string verbatim for other strings', () => {
    expect(getSpacing('1.25rem')).toBe('1.25rem');
    expect(getSpacing('calc(1rem + 2px)')).toBe('calc(1rem + 2px)');
  });
  it('returns undefined for undefined', () => {
    expect(getSpacing(undefined)).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test (FAIL)**

- [ ] **Step 3: Implement getSpacing** in `packages/blocks/src/utils/get-spacing.ts`:

```ts
import { rem } from './rem.ts';

const KNOWN_KEYS = new Set(['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl']);

export function getSpacing(value: string | number | undefined): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') return rem(value);
  if (KNOWN_KEYS.has(value)) return `var(--spacing-${value})`;
  return value;
}
```

- [ ] **Step 4: Run test (PASS)**

- [ ] **Step 5: Repeat the same pattern for the other 5 getters.** Each is a near-clone with a different CSS variable prefix and (for some) a different KNOWN_KEYS set.

| Helper | Var prefix | Known keys |
|---|---|---|
| `getSpacing` | `--spacing-` | `xs sm md lg xl 2xl 3xl` |
| `getRadius`  | `--radius-`  | `sm md lg xl 2xl full` |
| `getSize`    | (parameterized: caller passes the prefix) | (caller passes keys) |
| `getFontSize` | `--font-size-` | `xs sm md lg xl 2xl 3xl` |
| `getLineHeight` | `--line-height-` | `xs sm md lg xl` |
| `getShadow`  | `--shadow-`  | `sm md lg xl` |

`getSize` is special: it takes a prefix string as a second arg (e.g., `getSize(size, 'container-size')` → `var(--container-size-{size})`). Used by Container for its container-size scale.

Write a test for each (similar shape to the getSpacing test) and implement each.

- [ ] **Step 6: Create `packages/blocks/src/utils/index.ts`:**

```ts
export { rem } from './rem.ts';
export { getSpacing } from './get-spacing.ts';
export { getRadius } from './get-radius.ts';
export { getSize } from './get-size.ts';
export { getFontSize } from './get-font-size.ts';
export { getLineHeight } from './get-line-height.ts';
export { getShadow } from './get-shadow.ts';
```

- [ ] **Step 7: Run all tests (PASS)**

```bash
bunx vitest run packages/blocks
```

- [ ] **Step 8: Commit**

```bash
git add packages/blocks/src/utils/ packages/blocks/test/utils/
git commit -m "feat(blocks/utils): add token getters (getSpacing, getRadius, getSize, getFontSize, getLineHeight, getShadow)"
```

---

# Phase 3 — Factory infrastructure for responsive style props

## Task 3.1: useRandomClassName

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/use-random-class-name.ts`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/factory/test/use-random-class-name.test.tsx`

Reference: `/Users/matt/Documents/GitHub/mantine/packages/@mantine/core/src/core/Box/use-random-classname/use-random-classname.ts`

Mantine uses React's `useId()` to derive a stable-per-instance class name. The implementation is a 1-liner that wraps useId and replaces colons (which aren't valid CSS class chars).

- [ ] **Step 1: Write failing test:**

```tsx
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRandomClassName } from '../src/use-random-class-name.ts';

describe('useRandomClassName', () => {
  it('returns a non-empty string', () => {
    const { result } = renderHook(() => useRandomClassName());
    expect(typeof result.current).toBe('string');
    expect(result.current.length).toBeGreaterThan(0);
  });

  it('returns a stable value across re-renders', () => {
    const { result, rerender } = renderHook(() => useRandomClassName());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it('produces a CSS-class-safe name (no colons)', () => {
    const { result } = renderHook(() => useRandomClassName());
    expect(result.current).not.toContain(':');
  });
});
```

- [ ] **Step 2: Run test (FAIL)**

- [ ] **Step 3: Implement:**

```ts
import { useId } from 'react';

export function useRandomClassName(): string {
  const id = useId();
  return `sb-${id.replace(/:/g, '')}`;
}
```

- [ ] **Step 4: Run test (PASS)**

- [ ] **Step 5: Commit**

```bash
git add packages/factory/src/use-random-class-name.ts packages/factory/test/use-random-class-name.test.tsx
git commit -m "feat(factory): add useRandomClassName for stable per-instance class names"
```

## Task 3.2: hashStyleProps

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/hash-style-props.ts`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/factory/test/hash-style-props.test.ts`

Reference: `/Users/matt/Documents/GitHub/mantine/packages/@mantine/core/src/core/Box/hash-style-props/hash-style-props.ts`

The function deterministically hashes a styles object and a media-queries map into a stable string. Used to dedupe identical responsive style blocks across instances.

- [ ] **Step 1: Write failing test:**

```ts
import { describe, expect, it } from 'vitest';
import { hashStyleProps } from '../src/hash-style-props.ts';

describe('hashStyleProps', () => {
  it('produces the same hash for identical inputs', () => {
    const a = hashStyleProps({ padding: '1rem' }, { sm: { padding: '0.5rem' } });
    const b = hashStyleProps({ padding: '1rem' }, { sm: { padding: '0.5rem' } });
    expect(a).toBe(b);
  });
  it('produces different hashes for different inputs', () => {
    const a = hashStyleProps({ padding: '1rem' }, {});
    const b = hashStyleProps({ padding: '2rem' }, {});
    expect(a).not.toBe(b);
  });
  it('produces a CSS-class-safe string', () => {
    const h = hashStyleProps({ padding: '1rem' }, {});
    expect(h).toMatch(/^sb-h-[a-z0-9]+$/);
  });
});
```

- [ ] **Step 2: Run test (FAIL)**

- [ ] **Step 3: Implement** using a simple deterministic string-hash (djb2-style is fine):

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

- [ ] **Step 4: Run test (PASS)**

- [ ] **Step 5: Commit**

```bash
git add packages/factory/src/hash-style-props.ts packages/factory/test/hash-style-props.test.ts
git commit -m "feat(factory): add hashStyleProps for deduping responsive style blocks"
```

## Task 3.3: InlineStyles component

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/inline-styles/InlineStyles.tsx`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/factory/test/inline-styles.test.tsx`

Reference: `/Users/matt/Documents/GitHub/mantine/packages/@mantine/core/src/core/InlineStyles/InlineStyles.tsx`

The component renders a `<style>` block with rules scoped to a class selector and `@media` queries for breakpoint variants.

- [ ] **Step 1: Write failing test:**

```tsx
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { InlineStyles } from '../src/inline-styles/InlineStyles.tsx';

describe('InlineStyles', () => {
  it('renders a style element with base styles', () => {
    const { container } = render(
      <InlineStyles
        selector=".my-class"
        styles={{ padding: '1rem', color: 'red' }}
        media={{}}
      />,
    );
    const style = container.querySelector('style');
    expect(style).toBeInTheDocument();
    expect(style?.textContent).toContain('.my-class');
    expect(style?.textContent).toContain('padding: 1rem');
    expect(style?.textContent).toContain('color: red');
  });

  it('renders @media queries for media-specific styles', () => {
    const { container } = render(
      <InlineStyles
        selector=".my-class"
        styles={{}}
        media={{ '(min-width: 48em)': { padding: '2rem' } }}
      />,
    );
    const text = container.querySelector('style')?.textContent ?? '';
    expect(text).toContain('@media (min-width: 48em)');
    expect(text).toContain('padding: 2rem');
  });
});
```

- [ ] **Step 2: Run test (FAIL)**

- [ ] **Step 3: Implement:**

```tsx
export interface InlineStylesProps {
  selector: string;
  styles: Record<string, unknown>;
  media: Record<string, Record<string, unknown>>;
}

function rulesFromStyles(styles: Record<string, unknown>): string {
  return Object.entries(styles)
    .map(([prop, value]) => `${camelToKebab(prop)}: ${value};`)
    .join(' ');
}

function camelToKebab(s: string): string {
  return s.replace(/([A-Z])/g, '-$1').toLowerCase();
}

export function InlineStyles({ selector, styles, media }: InlineStylesProps) {
  const baseRule = `${selector} { ${rulesFromStyles(styles)} }`;
  const mediaRules = Object.entries(media)
    .map(([query, mStyles]) => `@media ${query} { ${selector} { ${rulesFromStyles(mStyles)} } }`)
    .join(' ');
  return <style>{`${baseRule} ${mediaRules}`}</style>;
}
```

- [ ] **Step 4: Run test (PASS)**

- [ ] **Step 5: Export from `packages/factory/src/index.ts`:**

```ts
export { InlineStyles } from './inline-styles/InlineStyles.tsx';
export type { InlineStylesProps } from './inline-styles/InlineStyles.tsx';
export { useRandomClassName } from './use-random-class-name.ts';
export { hashStyleProps } from './hash-style-props.ts';
```

- [ ] **Step 6: Run all factory tests (PASS)**

```bash
bunx vitest run packages/factory
```

- [ ] **Step 7: Commit**

```bash
git add packages/factory/src/inline-styles/ packages/factory/src/index.ts packages/factory/test/inline-styles.test.tsx
git commit -m "feat(factory): add InlineStyles component for responsive style-prop output"
```

---

# Phase 4 — Box style-props machinery

## Task 4.1: style-types.ts (StyleProp<T>)

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/blocks/src/Box/style-props/style-types.ts`

Reference: `/Users/matt/Documents/GitHub/mantine/packages/@mantine/core/src/core/Box/style-props/style-props.types.ts`

`StyleProp<T>` is `T | { base?: T; xs?: T; sm?: T; md?: T; lg?: T; xl?: T }`.

- [ ] **Step 1: Implement (no behavior; types only):**

Add attribution header. Define:

```ts
export type StyleProp<T> = T | Partial<Record<'base' | 'xs' | 'sm' | 'md' | 'lg' | 'xl', T>>;

export type StylePropResolver = (
  value: unknown,
  theme: { tokens: { breakpoint?: Record<string, string> } },
) => string | undefined;

export interface StylePropDefinition {
  /** CSS property name in camelCase (e.g., 'paddingInlineStart') */
  property: string | string[];
  /** Token resolver (one of get-spacing, get-radius, etc.) */
  resolver?: StylePropResolver;
}
```

- [ ] **Step 2: Commit (no test needed for type-only file)**

```bash
git add packages/blocks/src/Box/style-props/style-types.ts
git commit -m "feat(blocks): add StyleProp<T> type for responsive style props"
```

## Task 4.2: style-props-data.ts (the prop → CSS mapping table)

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/blocks/src/Box/style-props/style-props-data.ts`

Reference: `/Users/matt/Documents/GitHub/mantine/packages/@mantine/core/src/core/Box/style-props/style-props-data.ts`

This file is a static map from prop name to CSS property + resolver. Mantine has ~70 entries. Adapt by:
- Keeping the prop names identical (`m`, `mt`, `mb`, `ml`, `mr`, `mx`, `my`, `me`, `ms`, `p`, `pt`, ..., `bg`, `c`, `bd`, `bdrs`, `lh`, `fz`, `fw`, `lts`, `ta`, `opacity`, `display`, `pos`, `top`, `left`, `right`, `bottom`, `inset`, `w`, `miw`, `maw`, `h`, `mih`, `mah`, `flex`)
- Mapping each to a CSS property + appropriate resolver from `@soribashi/blocks/utils`

- [ ] **Step 1: Implement** — open Mantine's source as a reference. Each entry looks like:

```ts
m:  { property: 'margin',         resolver: getSpacing },
mt: { property: 'marginTop',      resolver: getSpacing },
mx: { property: ['marginInlineStart', 'marginInlineEnd'], resolver: getSpacing },
bg: { property: 'background',     resolver: getThemeColor },
c:  { property: 'color',          resolver: getThemeColor },
bdrs: { property: 'borderRadius', resolver: getRadius },
fz: { property: 'fontSize',       resolver: getFontSize },
lh: { property: 'lineHeight',     resolver: getLineHeight },
// ... etc.
```

For `bg` and `c` we need a `getThemeColor` resolver. Add it to `@soribashi/blocks/utils/get-theme-color.ts` first (a simple lookup that prefers `var(--color-{name})` for known semantic colors and falls through to literal CSS otherwise).

- [ ] **Step 2: Implement getThemeColor** in `packages/blocks/src/utils/get-theme-color.ts` (small task — same shape as getSpacing). Add to `utils/index.ts`.

- [ ] **Step 3: Implement style-props-data.ts** (export `STYLE_PROPS_DATA` as a `Record<string, StylePropDefinition>`).

- [ ] **Step 4: Commit (no separate test — covered by Box integration tests in Task 5.x)**

```bash
git add packages/blocks/src/Box/style-props/style-props-data.ts packages/blocks/src/utils/get-theme-color.ts packages/blocks/src/utils/index.ts
git commit -m "feat(blocks): add STYLE_PROPS_DATA mapping table and getThemeColor resolver"
```

## Task 4.3: parse-style-props.ts

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/blocks/src/Box/style-props/parse-style-props.ts`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/blocks/test/Box/parse-style-props.test.ts`

Reference: `/Users/matt/Documents/GitHub/mantine/packages/@mantine/core/src/core/Box/style-props/parse-style-props/parse-style-props.ts`

Function signature:

```ts
parseStyleProps(input: {
  styleProps: Record<string, unknown>;
  data: Record<string, StylePropDefinition>;
  theme: ResolvedTheme;
}): {
  hasResponsiveStyles: boolean;
  inlineStyles: Record<string, string>;        // base / non-responsive
  styles: Record<string, string>;               // base from responsive props
  media: Record<string, Record<string, string>>; // breakpoint → CSS object
};
```

For each prop in `styleProps`:
- If value is plain (not an object with breakpoint keys), resolve it with the resolver and put in `inlineStyles`
- If value is responsive (has `base`/`xs`/`sm`/`md`/`lg`/`xl` keys), put each entry in either `styles` (base) or `media[<query>]` based on theme breakpoints

The `<query>` for `sm` is `(min-width: <theme.tokens.breakpoint.sm>)` etc.

- [ ] **Step 1: Write tests** covering:
  - plain value resolution (`{ p: 'md' }` → `inlineStyles: { padding: 'var(--spacing-md)' }`)
  - responsive value (`{ p: { base: 'sm', md: 'lg' } }` → base in `styles`, `md` in `media['(min-width: <theme.tokens.breakpoint.md>)']`)
  - multi-property props (`mx` → `marginInlineStart`+`marginInlineEnd`)
  - hasResponsiveStyles flag

- [ ] **Step 2: Run tests (FAIL)**

- [ ] **Step 3: Implement parseStyleProps** following Mantine's reference. Pure function with no React dependencies.

- [ ] **Step 4: Run tests (PASS)**

- [ ] **Step 5: Commit**

```bash
git add packages/blocks/src/Box/style-props/parse-style-props.ts packages/blocks/test/Box/parse-style-props.test.ts
git commit -m "feat(blocks): add parseStyleProps for responsive style-prop parsing"
```

## Task 4.4: extract-style-props (split props into style props vs everything else)

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/blocks/src/Box/style-props/extract-style-props.ts`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/blocks/test/Box/extract-style-props.test.ts`

Reference: `/Users/matt/Documents/GitHub/mantine/packages/@mantine/core/src/core/Box/style-props/extract-style-props/extract-style-props.ts`

A small function: given `props` and `STYLE_PROPS_DATA`, returns `{ styleProps: {...}, rest: {...} }`.

- [ ] **Step 1: Write test, then implement, then commit (same pattern as above).**

```bash
git add packages/blocks/src/Box/style-props/extract-style-props.ts packages/blocks/test/Box/extract-style-props.test.ts
git commit -m "feat(blocks): add extractStyleProps for splitting style props from passthrough props"
```

## Task 4.5: get-box-mod (`mod` API for data attributes)

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/blocks/src/Box/get-box-mod.ts`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/blocks/test/Box/get-box-mod.test.ts`

Reference: `/Users/matt/Documents/GitHub/mantine/packages/@mantine/core/src/core/Box/get-box-mod/get-box-mod.ts`

`getBoxMod(input: BoxMod | BoxMod[]): Record<string, string>` — converts mod input (object, array of objects, string, array of strings, mix) into a flat record of `data-*` attributes.

- [ ] **Step 1: Write test:**

```ts
expect(getBoxMod({ active: true })).toEqual({ 'data-active': true });
expect(getBoxMod(['active'])).toEqual({ 'data-active': true });
expect(getBoxMod([{ active: true, loading: false }])).toEqual({ 'data-active': true });
expect(getBoxMod([{ active: true }, { 'data-x': 'y' }])).toEqual({ 'data-active': true, 'data-x': 'y' });
```

(Falsy values are omitted; truthy non-boolean values become the data-attribute value.)

- [ ] **Step 2: Implement, run, commit.**

```bash
git add packages/blocks/src/Box/get-box-mod.ts packages/blocks/test/Box/get-box-mod.test.ts
git commit -m "feat(blocks): add getBoxMod for mod-array → data-* conversion"
```

---

# Phase 5 — Box itself

## Task 5.1: Box.types.ts

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/blocks/src/Box/Box.types.ts`

Reference: `/Users/matt/Documents/GitHub/mantine/packages/@mantine/core/src/core/Box/Box.types.ts`

Defines `BoxProps`, `BoxComponentProps`, `BoxMod`. The shape is roughly:

```ts
export type BoxMod = string | Record<string, unknown> | (string | Record<string, unknown>)[];

export interface BoxProps {
  m?: StyleProp<string | number>;
  mt?: StyleProp<string | number>;
  // ... ~70 style props from STYLE_PROPS_DATA
  bg?: StyleProp<string>;
  c?: StyleProp<string>;
  // ...
  mod?: BoxMod;
  variant?: string;
  size?: string | number;
}
```

- [ ] **Step 1: Implement (no test — types-only file).**
- [ ] **Step 2: Commit.**

```bash
git add packages/blocks/src/Box/Box.types.ts
git commit -m "feat(blocks): add Box prop types"
```

## Task 5.2: Box.tsx

**Files:**
- Modify: `/Users/matt/Documents/GitHub/soribashi/packages/blocks/src/Box/Box.tsx` (existing — full rewrite)
- Modify: `/Users/matt/Documents/GitHub/soribashi/packages/blocks/src/Box/Box.module.css` (rename from Box.css and rewrite as Mantine-style minimal CSS)

Reference: `/Users/matt/Documents/GitHub/mantine/packages/@mantine/core/src/core/Box/Box.tsx`

The flow inside Box:
1. `useProps('Box', null, _props)` to merge defaults
2. Extract style props via `extractStyleProps(props, STYLE_PROPS_DATA)` → `{ styleProps, rest }`
3. Parse via `parseStyleProps({ styleProps, data, theme })` → `{ hasResponsiveStyles, inlineStyles, styles, media }`
4. If `hasResponsiveStyles`, generate `useRandomClassName()` (or `hashStyleProps` for dedupe), render an `<InlineStyles>` sibling
5. Build `data-*` attrs from `getBoxMod(mod)`
6. Render the polymorphic root with: `inlineStyles` as inline `style`, the responsive class name, the mod attrs, and any remaining `rest` props

- [ ] **Step 1: Write failing tests in** `packages/blocks/test/Box.test.tsx` (replace the existing Box test):

```tsx
it('Box renders div by default', () => { /* same as before */ });

it('Box accepts as prop for polymorphism', () => { /* same as before */ });

it('Box style props produce inline style with var() references', () => {
  const { container } = wrap(<Box p="md" mt="lg" bg="var(--surface-raised)">X</Box>);
  const el = container.firstChild as HTMLElement;
  expect(el.style.padding).toBe('var(--spacing-md)');
  expect(el.style.marginTop).toBe('var(--spacing-lg)');
  expect(el.style.background).toBe('var(--surface-raised)');
});

it('Box style props with number values produce rem strings', () => {
  const { container } = wrap(<Box p={16} mt={8}>X</Box>);
  const el = container.firstChild as HTMLElement;
  expect(el.style.padding).toBe('1rem');
  expect(el.style.marginTop).toBe('0.5rem');
});

it('Box mx applies to both marginInlineStart and marginInlineEnd', () => {
  const { container } = wrap(<Box mx="md">X</Box>);
  const el = container.firstChild as HTMLElement;
  expect(el.style.marginInlineStart).toBe('var(--spacing-md)');
  expect(el.style.marginInlineEnd).toBe('var(--spacing-md)');
});

it('Box responsive style props emit InlineStyles with media queries', () => {
  const { container } = wrap(<Box p={{ base: 'xs', md: 'lg' }}>X</Box>);
  const styleEl = container.querySelector('style');
  expect(styleEl).toBeInTheDocument();
  expect(styleEl?.textContent).toContain('@media');
  expect(styleEl?.textContent).toContain('padding: var(--spacing-lg)');
});

it('Box mod prop adds data-* attributes', () => {
  const { container } = wrap(<Box mod={{ active: true, loading: false }}>X</Box>);
  const el = container.firstChild as HTMLElement;
  expect(el.dataset.active).toBe('true');
  expect(el.dataset.loading).toBeUndefined();
});

it('Box passes through arbitrary HTML props', () => { /* same as before */ });
```

- [ ] **Step 2: Run tests (FAIL on the new ones).**

- [ ] **Step 3: Implement Box.tsx** as described. Use `definePolymorphicComponent` from `@soribashi/factory`. Inside the render, do steps 1-6 above.

- [ ] **Step 4: Update Box.module.css** to a minimal Mantine-faithful version (just `box-sizing: border-box`; structural styling is handled inline now).

- [ ] **Step 5: Run all tests (PASS).**

```bash
bunx vitest run packages/blocks
```

- [ ] **Step 6: Commit.**

```bash
git add packages/blocks/src/Box/ packages/blocks/test/Box.test.tsx
git commit -m "feat(blocks): rewrite Box with full Mantine-faithful style-prop machinery"
```

---

# Phase 6 — Simple blocks (each adapted from Mantine source)

For each block in this phase, the procedure is:

1. Read the Mantine TSX file at the path indicated.
2. Read the Mantine CSS module file alongside it.
3. Create soribashi files with attribution headers.
4. Apply token name substitutions (per § 4 of spec) to the CSS.
5. Replace `factory<F>(...)` / `polymorphicFactory<F>(...)` with our equivalents.
6. Replace imports per § 4.
7. Wrap render in `<Box {...getStyles('root')} {...others}>` (Mantine's pattern; now valid because our Box matches theirs).
8. Update tests to cover any new features the adapted version exposes.
9. Run tests, commit.

I'll list each block with its specific gotchas; the procedure above is the common pattern.

## Task 6.1: Stack

**Mantine source:** `packages/@mantine/core/src/components/Stack/Stack.tsx` + `Stack.module.css`

**Soribashi files:**
- Modify: `packages/blocks/src/Stack/Stack.tsx`
- Modify: `packages/blocks/src/Stack/Stack.module.css` (rename from Stack.css)

**Adaptation notes:**
- `gap`: type changes from soribashi enum to `MantineSpacing` equivalent (any spacing token OR raw CSS). Use `getSpacing` resolver.
- `align` and `justify`: change from soribashi enum to `React.CSSProperties['alignItems']` / `['justifyContent']`. The varsResolver passes them through as `--stack-align` / `--stack-justify`.
- The varsResolver is verbatim Mantine logic (with token-name substitution).

**Tests:**
- Existing tests stay (Stack with `gap='lg'` data-attr → now produces inline style `--stack-gap: var(--spacing-lg)`).
- Add: `Stack accepts raw CSS values for gap` (`<Stack gap="2.5rem">`).

- [ ] **Step 1: Read Mantine source files. Write soribashi files following the procedure above.**
- [ ] **Step 2: Run tests; fix failures.**
- [ ] **Step 3: Commit.**

```bash
git add packages/blocks/src/Stack/ packages/blocks/test/blocks.test.tsx
git commit -m "feat(blocks): rewrite Stack adapted from Mantine source"
```

## Task 6.2: Group (with grow + preventGrowOverflow + filterFalsyChildren)

**Mantine source:** `packages/@mantine/core/src/components/Group/Group.tsx` + `Group.module.css` + `filter-falsy-children/filter-falsy-children.ts`

**Soribashi files:**
- Modify: `packages/blocks/src/Group/Group.tsx`
- Modify: `packages/blocks/src/Group/Group.module.css`
- Create: `packages/blocks/src/Group/filter-falsy-children.ts`

**Adaptation notes:**
- `grow`, `preventGrowOverflow` props add real layout logic.
- `stylesCtx: GroupStylesCtx = { childWidth }` is computed at render time, then passed to varsResolver (`createVarsResolver` accepts a third arg `stylesCtx`).
- BUT: soribashi's current `createVarsResolver` typing doesn't take `stylesCtx`. We extend it.

**Sub-step:** Extend `useStyles` and `createVarsResolver` to accept an optional `stylesCtx` parameter (or call the resolver with whatever the component passes).

- [ ] **Step 1: Extend the factory typing first** — add an optional `stylesCtx` param to `useStyles<F>` and to `createVarsResolver<F>`. Update tests in `packages/factory/test/use-styles.test.tsx` to cover the stylesCtx case.

- [ ] **Step 2: Implement filterFalsyChildren** in `packages/blocks/src/Group/filter-falsy-children.ts` (small util — checks `Children.toArray()` for nulls/false/undefined).

- [ ] **Step 3: Adapt Group.tsx and Group.module.css.**

- [ ] **Step 4: Update tests in `packages/blocks/test/blocks.test.tsx`:**
  - Existing Group tests pass.
  - Add: `Group with grow expands children`, `Group with grow + preventGrowOverflow computes child max-width`.

- [ ] **Step 5: Commit.**

```bash
git add packages/factory/src/hooks/use-styles.ts packages/factory/src/create-vars-resolver.ts packages/factory/test/use-styles.test.tsx packages/blocks/src/Group/ packages/blocks/test/blocks.test.tsx
git commit -m "feat(blocks): rewrite Group with grow/preventGrowOverflow adapted from Mantine"
```

## Task 6.3: Center

**Mantine source:** `packages/@mantine/core/src/components/Center/Center.tsx` + `Center.module.css`

**Soribashi files:** Modify existing `Center/`.

**Adaptation notes:**
- `:where([data-inline])` selector pattern (zero specificity, presence-of-attribute).
- Polymorphic — uses `polymorphicFactory<CenterFactory>` in Mantine; use `definePolymorphicComponent` in soribashi.

- [ ] **Step 1: Adapt files.**
- [ ] **Step 2: Update tests** (Center accepts `inline` prop; CSS uses `:where([data-inline])`).
- [ ] **Step 3: Commit.**

```bash
git add packages/blocks/src/Center/ packages/blocks/test/blocks.test.tsx
git commit -m "feat(blocks): rewrite Center adapted from Mantine, with :where() data-inline pattern"
```

## Task 6.4: AspectRatio (children-aware fix)

**Mantine source:** `packages/@mantine/core/src/components/AspectRatio/AspectRatio.tsx` + `AspectRatio.module.css`

**Soribashi files:** Modify existing `AspectRatio/`.

**Adaptation notes:**
- The CSS pattern fundamentally changes: aspect-ratio is now applied to children via `& > :where(*:not(style))`, not the wrapper.
- `& > :where(img, video) { object-fit: cover }` is Mantine's nice default.

- [ ] **Step 1: Replace CSS module contents** (with token substitution).
- [ ] **Step 2: Update tests:**
  - Existing AspectRatio tests need to assert on the child element's `aspectRatio` style or behavior, not the wrapper.
  - Add: `AspectRatio with image child applies object-fit: cover` (read computed style).
- [ ] **Step 3: Commit.**

```bash
git add packages/blocks/src/AspectRatio/ packages/blocks/test/blocks.test.tsx
git commit -m "fix(blocks): rewrite AspectRatio with children-aware aspect-ratio pattern"
```

## Task 6.5: Space (1-line component using Box)

**Mantine source:** `packages/@mantine/core/src/components/Space/Space.tsx` (no CSS module — Box handles it)

**Soribashi files:**
- Modify: `packages/blocks/src/Space/Space.tsx` (rewrite as `<Box w={w} h={h} miw={miw ?? w} mih={mih ?? h}>`)
- Delete: `packages/blocks/src/Space/Space.css` (no longer needed; Box handles sizing)
- Update: `packages/blocks/src/style.css` to drop the `@import './Space/Space.css'` line.

- [ ] **Step 1: Rewrite Space.tsx.**
- [ ] **Step 2: Delete Space.css and update style.css.**
- [ ] **Step 3: Update tests** to verify `<Space h="md">` produces `<div>` with `style.height = 'var(--spacing-md)'`.
- [ ] **Step 4: Commit.**

```bash
git add packages/blocks/src/Space/ packages/blocks/src/style.css packages/blocks/test/blocks.test.tsx
git commit -m "refactor(blocks): rewrite Space as 1-line Box wrapper (Mantine pattern)"
```

## Task 6.6: Paper (a11y defaults + light/dark border)

**Mantine source:** `packages/@mantine/core/src/components/Paper/Paper.tsx` + `Paper.module.css`

**Soribashi files:** Modify existing `Paper/`.

**Adaptation notes:**
- Paper is polymorphic in Mantine — use `definePolymorphicComponent`.
- Paper does NOT have padding by default in Mantine (consumers use Box's `p` prop). Soribashi's previous Paper had `p` baked in — REMOVE this; let consumers write `<Paper p="md">` instead, which now flows through Box's style props.
- A11y defaults: `outline: 0`, `-webkit-tap-highlight-color: transparent`, `touch-action: manipulation`, `text-decoration: none`.
- `:where([data-with-border])` for border, with light/dark color via `:root`/`.dark`.

- [ ] **Step 1: Adapt files.**
- [ ] **Step 2: Update tests:**
  - Existing tests on shadow/radius/withBorder/bg pass.
  - Drop the `p` default test (Paper no longer has padding).
  - Add: `Paper with p='md' (style prop via Box) applies padding`.
  - Add: a11y default check (computed style).
- [ ] **Step 3: Commit.**

```bash
git add packages/blocks/src/Paper/ packages/blocks/test/blocks.test.tsx
git commit -m "feat(blocks): rewrite Paper with a11y defaults + light/dark border (Mantine adaptation)"
```

---

# Phase 7 — Complex blocks

## Task 7.1: Flex (full responsive style props)

**Mantine source:** `packages/@mantine/core/src/components/Flex/Flex.tsx` + `Flex.module.css` + `flex-props.ts`

**Soribashi files:** Modify existing `Flex/` + create `Flex/flex-props.ts`.

**Adaptation notes:**
- `gap`, `rowGap`, `columnGap`, `align`, `justify`, `wrap`, `direction` all become `StyleProp<T>`.
- `flex-props.ts` exports `FLEX_STYLE_PROPS_DATA` — same structure as `STYLE_PROPS_DATA` but limited to flex-specific props.
- Uses `parseStyleProps` + `<InlineStyles>` + `useRandomClassName` exactly like Box.

- [ ] **Step 1: Implement flex-props.ts.**
- [ ] **Step 2: Adapt Flex.tsx and Flex.module.css.**
- [ ] **Step 3: Update tests:**
  - Existing tests pass.
  - Add: `Flex with responsive gap emits InlineStyles + media queries`.
  - Add: `Flex with multiple responsive props produces a single InlineStyles block with all rules`.
- [ ] **Step 4: Commit.**

```bash
git add packages/blocks/src/Flex/ packages/blocks/test/blocks.test.tsx
git commit -m "feat(blocks): rewrite Flex with responsive style-prop support (Mantine adaptation)"
```

## Task 7.2: Grid + GridCol + GridProvider + GridVariables

**Mantine source:** `packages/@mantine/core/src/components/Grid/` (entire directory)

**Soribashi files:**
- Modify: `packages/blocks/src/Grid/Grid.tsx`
- Create: `packages/blocks/src/Grid/Grid.context.ts`
- Create: `packages/blocks/src/Grid/Grid.variables.tsx`
- Create: `packages/blocks/src/Grid/GridCol/GridCol.tsx`
- Modify: `packages/blocks/src/Grid/Grid.module.css`

**Adaptation notes:**
- This is the largest block. Grid uses a context (`GridProvider`) to share state with `GridCol`, plus a variables component (`GridVariables`) that emits CSS for responsive col spans.
- `GridCol`'s `span`, `offset`, `order`, `align-self` accept `StyleProp<T>`. The variables component reads these and emits per-instance CSS.
- `type='container'` mode wraps in an extra `.container` div with `container: simple-grid / inline-size`.
- `breakpoints` prop overrides the theme breakpoints for this Grid only.

- [ ] **Step 1: Read and study Mantine's Grid directory structure.** It has 4 files plus types.
- [ ] **Step 2: Adapt one file at a time, with tests for each major capability.**
  - Grid.tsx + tests for the basic columns/gap behavior
  - GridProvider context (tests for context.read)
  - GridCol.tsx + tests for span/offset/order
  - GridVariables.tsx + tests for responsive output
  - Grid.module.css with substitutions
- [ ] **Step 3: Update top-level Grid test:**
  - Existing `<Grid columns={12}>` and `<Grid.Col span={6}>` tests pass.
  - Add: `Grid with grow makes last-row cols expand`.
  - Add: `Grid.Col with responsive span={{ base: 12, md: 6 }} emits responsive CSS`.
  - Add: `Grid type='container' wraps in container-query parent`.
- [ ] **Step 4: Commit.**

```bash
git add packages/blocks/src/Grid/ packages/blocks/test/blocks.test.tsx
git commit -m "feat(blocks): rewrite Grid with GridProvider, GridCol, GridVariables (full Mantine fidelity)"
```

## Task 7.3: SimpleGrid (container queries + auto-fill/auto-fit)

**Mantine source:** `packages/@mantine/core/src/components/SimpleGrid/`

**Soribashi files:** Modify existing `SimpleGrid/` + create variables file.

**Adaptation notes:**
- Same context+variables pattern as Grid, simpler.
- `cols` accepts responsive values.
- `type='container'` mode for container queries.
- `auto-fill` / `auto-fit` modes via the `data-auto-cols` attribute and `--sg-min-col-width` var.

- [ ] **Step 1: Adapt files.**
- [ ] **Step 2: Update tests** (responsive cols, auto-fill/auto-fit, container mode).
- [ ] **Step 3: Commit.**

```bash
git add packages/blocks/src/SimpleGrid/ packages/blocks/test/blocks.test.tsx
git commit -m "feat(blocks): rewrite SimpleGrid with container queries + auto-fill/auto-fit (Mantine)"
```

## Task 7.4: Container (block + grid strategies + breakout)

**Mantine source:** `packages/@mantine/core/src/components/Container/Container.tsx` + `Container.module.css`

**Soribashi files:** Modify existing `Container/`.

**Adaptation notes:**
- Two strategies: `block` (default — current behavior) and `grid` (3-column grid where children with `data-breakout` attribute span all columns).
- `--container-size` CSS variable; size scale from Mantine: xs=540, sm=720, md=960, lg=1140, xl=1320 (these are Mantine's defaults). Soribashi previously had a different scale; we adopt Mantine's for consistency. Document this in the commit message.

- [ ] **Step 1: Adapt files.**
- [ ] **Step 2: Update tests:**
  - Existing tests adapted to new size scale.
  - Add: `Container strategy='grid' with data-breakout child spans full grid`.
- [ ] **Step 3: Commit.**

```bash
git add packages/blocks/src/Container/ packages/blocks/test/blocks.test.tsx
git commit -m "feat(blocks): rewrite Container with grid strategy and breakout (Mantine)"
```

---

# Phase 8 — Typography

## Task 8.1: Text (lineClamp + gradient + inline + inherit)

**Mantine source:** `packages/@mantine/core/src/components/Text/Text.tsx` + `Text.module.css`

**Soribashi files:** Modify existing `Text/`.

**Adaptation notes:**
- Polymorphic (`p` default).
- New props: `lineClamp` (number for multi-line truncation), `inline` (boolean, line-height: 1), `inherit` (boolean, inherit font from parent), `gradient` (when `variant='gradient'`).
- `variant='gradient'` requires `getGradient` utility. Implement at `packages/blocks/src/utils/get-gradient.ts` (~10 lines: builds `linear-gradient(...)` from `{ from, to, deg }` shape).
- Mantine's `truncate` accepts `'start' | 'end' | boolean`. Update soribashi's prop type.

- [ ] **Step 1: Implement getGradient.**
- [ ] **Step 2: Adapt Text.tsx and Text.module.css.**
- [ ] **Step 3: Update tests:**
  - Existing Text tests pass.
  - Add: `Text with lineClamp={3} applies multi-line truncation`.
  - Add: `Text inline mode sets line-height: 1`.
  - Add: `Text inherit mode does not override font properties`.
  - Add: `Text variant='gradient' emits text-gradient CSS var`.
- [ ] **Step 4: Commit.**

```bash
git add packages/blocks/src/utils/get-gradient.ts packages/blocks/src/Text/ packages/blocks/test/blocks.test.tsx
git commit -m "feat(blocks): rewrite Text with lineClamp, gradient, inline, inherit modes (Mantine)"
```

## Task 8.2: Title (lineClamp + textWrap + heading sizes)

**Mantine source:** `packages/@mantine/core/src/components/Title/Title.tsx` + `Title.module.css` + `get-title-size.ts`

**Soribashi files:**
- Modify: `packages/blocks/src/Title/Title.tsx`
- Create: `packages/blocks/src/Title/get-title-size.ts`
- Modify: `packages/blocks/src/Title/Title.module.css`

**Adaptation notes:**
- `order` (1-6) maps to a heading element via `Box component={`h${order}`}`.
- `size` accepts `h${order}` or any valid CSS font-size or theme key.
- `getTitleSize(order, size)` returns `{ fontSize, fontWeight, lineHeight }` from `theme.heading.sizes` (the new theme structure we added in Phase 1).
- `lineClamp`, `textWrap` (CSS `text-wrap` property: `wrap | nowrap | balance | pretty | stable`).

- [ ] **Step 1: Implement getTitleSize.**
- [ ] **Step 2: Adapt Title.tsx and Title.module.css.**
- [ ] **Step 3: Update tests:**
  - Existing Title tests for h1-h6 element rendering pass.
  - Add: `Title with order=2 and size='h1' uses h1 sizing on h2 element`.
  - Add: `Title with lineClamp={2} applies multi-line truncation`.
  - Add: `Title with textWrap='balance' sets the CSS property`.
- [ ] **Step 4: Commit.**

```bash
git add packages/blocks/src/Title/ packages/blocks/test/blocks.test.tsx
git commit -m "feat(blocks): rewrite Title with lineClamp, textWrap, heading sizes (Mantine)"
```

---

# Phase 9 — Cleanup and verification

## Task 9.1: Update style.css imports

**Files:**
- Modify: `packages/blocks/src/style.css`

- [ ] **Step 1:** Ensure `style.css` imports each block's CSS module (now `.module.css` files where applicable, or `.css` files for the block-level structural CSS). Drop any imports for files that no longer exist (Space).

- [ ] **Step 2: Run codegen + playground build to verify CSS chain works:**

```bash
cd /Users/matt/Documents/GitHub/soribashi
bun run codegen
cd apps/playground && bun run build
```

Expected: builds without errors.

- [ ] **Step 3: Commit.**

```bash
cd /Users/matt/Documents/GitHub/soribashi
git add packages/blocks/src/style.css
git commit -m "chore(blocks): update style.css imports for adapted blocks"
```

## Task 9.2: Update divergence ledger and STATUS.md

**Files:**
- Modify: `docs/superpowers/divergences/mantine-master.md`
- Modify: `STATUS.md`

- [ ] **Step 1:** Update the divergence ledger:
  - Move "Layout blocks — direct DOM rendering, no Box wrapper" out of the "Kept" section into a new "Closed" section.
  - Add a "Closed (adapted from Mantine)" section that lists each block adapted, with a one-line "now matches Mantine plus soribashi token names" entry.
  - Add a final paragraph: "Layout blocks are now full Mantine adaptations. Behavioral parity verified by tests; remaining differences are limited to (1) token names (per § 4 of the adaptation spec), (2) framework imports targeting `@soribashi/factory` instead of Mantine's `core`, and (3) class-name prefix `sb-` instead of `mantine-`."

- [ ] **Step 2:** Update STATUS.md:
  - Bump test count.
  - Add bullet: "**Blocks adapted from Mantine** — all 14 layout primitives now full Mantine fidelity, MIT-attributed, see `docs/superpowers/divergences/mantine-master.md` and `THIRD-PARTY-LICENSES.md`."

- [ ] **Step 3: Commit.**

```bash
git add docs/superpowers/divergences/mantine-master.md STATUS.md
git commit -m "docs: update divergence ledger and status for blocks adaptation"
```

## Task 9.3: Final smoke test

- [ ] **Step 1: Run all tests across all packages.**

```bash
cd /Users/matt/Documents/GitHub/soribashi
bunx vitest run
```

Expected: all tests pass; total > 200.

- [ ] **Step 2: Typecheck.**

```bash
bun run typecheck
```

Expected: no errors.

- [ ] **Step 3: Codegen + playground build.**

```bash
bun run codegen
bun run --filter @soribashi/playground build
```

Expected: clean build, no warnings about missing tokens or unresolvable CSS vars.

- [ ] **Step 4: Lint check (no `--mantine-` references in compiled soribashi source).**

```bash
grep -r "--mantine-" packages/blocks/src/ packages/factory/src/ packages/theme/src/ apps/playground/src/ 2>&1 | grep -v ".test." | head
```

Expected: no output (empty grep).

- [ ] **Step 5: Final commit.**

```bash
git commit --allow-empty -m "chore: Mantine blocks adaptation complete — all 14 blocks ported with attribution"
```

---

## Acceptance criteria

The plan is complete when:

1. `THIRD-PARTY-LICENSES.md` exists with Mantine's full MIT license.
2. Every adapted file has the source-pointer attribution comment.
3. Box has full style-prop machinery including responsive `StyleProp<T>` syntax.
4. All 13 other blocks render with Mantine-equivalent feature parity.
5. Theme has the new `fontWeight`, `lineHeight`, `fontFamily.heading`, `heading.sizes` tokens; codegen emits them.
6. `useRandomClassName`, `hashStyleProps`, `InlineStyles` exist in `@soribashi/factory` and are exported.
7. All existing tests pass; new tests for new features pass; total tests > 200.
8. Playground builds and renders the Theme Lab + Blocks Demo without visual regressions.
9. `bun run typecheck` clean.
10. `grep "--mantine-"` across the compiled source returns nothing.
11. Divergence ledger updated to reflect closed gaps.
12. `git log --oneline` shows atomic commits per logical phase/task.
