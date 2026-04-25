# Soribashi Plan 2 — `@soribashi/factory` Core Framework

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the soribashi component-authoring framework. Ship `defineComponent` (the daily-use API), the lower-level escape hatches (`component`, `useProps`, `useStyles`, `createVarsResolver`), and the `SoribashiProvider` context. After this plan, an engineer can author a non-generic, non-polymorphic component using soribashi.

**Architecture:** Mantine-derived. The `factory()` function is mostly types — at runtime it just attaches `extend`, `withProps`, and `classes` static methods. `useProps` does a 3-way prop merge (instance > theme defaults > component defaults). `useStyles` returns `getStyles(selector)` that resolves classNames + styles + vars + attributes per element. `defineComponent` is a thin sugar on top of `factory` + `useProps` + `useStyles` that infers types from a single config object.

**Tech Stack:** React 18+, `clsx`, `tailwind-merge`, `@mantine/hooks` (allowed per Hard Rule 14). Vitest with `@testing-library/react` + `jsdom` for component tests.

**Reference:** [Mantine source](https://github.com/mantinedev/mantine). Key files:
- `packages/@mantine/core/src/core/factory/factory.tsx` — the factory function (~30 LOC)
- `packages/@mantine/core/src/core/factory/create-polymorphic-component.ts` — polymorphic typing (Plan 3 will use)
- `packages/@mantine/core/src/core/Box/use-props/use-props.ts` — useProps merge logic
- `packages/@mantine/core/src/core/styles-api/use-styles/use-styles.ts` — useStyles resolution
- `packages/@mantine/core/src/core/MantineProvider/Mantine.context.ts` — provider context

**Hard Rule 13 reminder:** When implementing each piece, open Mantine's source file for that piece and validate behavior against it. Divergences must be deliberate.

---

## File Structure

### Created in this plan

```
packages/factory/
  package.json
  tsconfig.json
  vitest.config.ts
  src/
    index.ts                      ← public exports
    types/
      index.ts
      factory-payload.ts          ← FactoryPayload, MantineComponent equivalents
      props.ts                    ← StylesApiProps<F>, ClassNames, Styles, Vars
      render-context.ts           ← RenderContext type for defineComponent
    cn.ts                          ← clsx + tailwind-merge wrapper
    provider/
      context.ts                   ← React context for ResolvedTheme
      provider.tsx                 ← <SoribashiProvider>
      use-theme.ts                 ← useTheme hook
    hooks/
      use-props.ts                 ← useProps(name, defaults, props)
      use-styles.ts                ← useStyles<F>(config) → getStyles
    factory.ts                     ← low-level factory<F>(render)
    create-vars-resolver.ts        ← createVarsResolver<F>(fn)
    define-component.tsx           ← defineComponent({...}) high-level API
    with-props.ts                  ← withProps helper used by factory
    auto-vars.ts                   ← auto-derives --component-{key} CSS vars from intent resolver
  test/
    cn.test.ts
    use-props.test.tsx
    use-styles.test.tsx
    factory.test.tsx
    define-component.test.tsx
    define-component.intent.test.tsx
    with-props.test.tsx
    extend.test.tsx
```

---

## Task 1: Create @soribashi/factory Package Skeleton

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/factory/package.json`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/factory/tsconfig.json`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/factory/vitest.config.ts`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/index.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@soribashi/factory",
  "version": "0.0.0",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    }
  },
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@soribashi/theme": "workspace:*",
    "@mantine/hooks": "^7.13.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.0"
  },
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  },
  "devDependencies": {
    "@testing-library/react": "^16.1.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "jsdom": "^25.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "references": [{ "path": "../theme" }],
  "include": ["src/**/*", "test/**/*"],
  "exclude": ["dist", "node_modules"]
}
```

- [ ] **Step 3: Create vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['test/**/*.test.{ts,tsx}'],
    setupFiles: ['./test/setup.ts'],
  },
});
```

- [ ] **Step 4: Create test setup file**

Create `/Users/matt/Documents/GitHub/soribashi/packages/factory/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 5: Create empty src/index.ts**

```ts
// @soribashi/factory — public API
// Implementation added in subsequent tasks.
export {};
```

- [ ] **Step 6: Update root vitest.workspace.ts**

Modify `/Users/matt/Documents/GitHub/soribashi/vitest.workspace.ts` to add:

```ts
export default [
  './packages/theme/vitest.config.ts',
  './packages/codegen/vitest.config.ts',
  './packages/factory/vitest.config.ts',
];
```

- [ ] **Step 7: Update root tsconfig.json references**

Modify `/Users/matt/Documents/GitHub/soribashi/tsconfig.json`:

```json
{
  "files": [],
  "references": [
    { "path": "./packages/theme" },
    { "path": "./packages/codegen" },
    { "path": "./packages/factory" }
  ]
}
```

- [ ] **Step 8: Install**

```bash
cd /Users/matt/Documents/GitHub/soribashi
bun install
```

Expected: All deps install, including React, jsdom, testing-library.

- [ ] **Step 9: Commit**

```bash
git add packages/factory/ vitest.workspace.ts tsconfig.json bun.lock
git commit -m "chore(factory): create @soribashi/factory package skeleton"
```

---

## Task 2: cn() Utility

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/cn.ts`

- [ ] **Step 1: Write the failing test**

Create `/Users/matt/Documents/GitHub/soribashi/packages/factory/test/cn.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { cn } from '../src/cn.ts';

describe('cn', () => {
  it('combines string class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('filters falsy values', () => {
    expect(cn('a', false, null, undefined, '', 'b')).toBe('a b');
  });

  it('flattens arrays', () => {
    expect(cn(['a', 'b'], 'c')).toBe('a b c');
  });

  it('handles object syntax (clsx-style)', () => {
    expect(cn({ a: true, b: false, c: true })).toBe('a c');
  });

  it('merges conflicting Tailwind classes (tailwind-merge)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
  });

  it('preserves non-conflicting Tailwind classes', () => {
    expect(cn('flex', 'items-center', 'gap-2')).toBe('flex items-center gap-2');
  });

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('');
  });
});
```

- [ ] **Step 2: Run test (FAIL)**

```bash
cd /Users/matt/Documents/GitHub/soribashi/packages/factory
bun test test/cn.test.ts
```

- [ ] **Step 3: Implement cn**

Create `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/cn.ts`:

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type { ClassValue };

/**
 * Combines class values using clsx (for conditional/array/object syntax)
 * and tailwind-merge (to resolve conflicting Tailwind utility classes).
 *
 * The Tailwind merge is critical for soribashi: when a component author
 * provides default classes (e.g. `'h-10 px-4'`) and the theme provides
 * an override (`'h-12'` via `Component.extend({ classNames: { root: 'h-12' } })`),
 * we want the override to win — `tailwind-merge` ensures that.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Run test (PASS)**

```bash
bun test test/cn.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add packages/factory/src/cn.ts packages/factory/test/cn.test.ts
git commit -m "feat(factory): add cn() utility (clsx + tailwind-merge)"
```

---

## Task 3: Factory Type Definitions

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/types/factory-payload.ts`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/types/props.ts`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/types/render-context.ts`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/types/index.ts`

**Reference:** Validate against [`mantine/packages/@mantine/core/src/core/factory/factory.tsx`](https://github.com/mantinedev/mantine/blob/master/packages/%40mantine/core/src/core/factory/factory.tsx) — specifically the `FactoryPayload`, `MantineComponent`, and `StylesApiProps` shapes. Soribashi's diverge in one place: we add a `classes` field to the payload to support CSS Modules typing without a separate codegen step.

- [ ] **Step 1: Write factory-payload.ts**

Create `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/types/factory-payload.ts`:

```ts
/**
 * The Factory payload type — the contract every soribashi component declares.
 *
 * This mirrors Mantine's FactoryPayload but with one addition: `staticComponents`
 * for compound components (Tabs.List, Menu.Item, etc.) is a first-class field.
 */
export interface FactoryPayload {
  props: Record<string, any>;
  ref?: any;
  /** Union of selector names (e.g. 'root' | 'label' | 'icon') for the Styles API */
  stylesNames?: string;
  /** Per-selector CSS variable surface (e.g. { root: '--btn-bg' | '--btn-color' }) */
  vars?: Record<string, string>;
  /** Union of variant names (e.g. 'filled' | 'outline') */
  variant?: string;
  /** Compound sub-components (e.g. Tabs.List) */
  staticComponents?: Record<string, any>;
  /** True for compound sub-components; affects ExtendComponent shape */
  compound?: boolean;
}

/** Helper: pull the props type out of a Factory payload. */
export type FactoryProps<P extends FactoryPayload> = P['props'];

/** Helper: pull the styles names union out of a Factory payload. */
export type FactoryStylesNames<P extends FactoryPayload> = P['stylesNames'] extends string
  ? P['stylesNames']
  : never;

/** Helper: pull the vars surface out of a Factory payload. */
export type FactoryVars<P extends FactoryPayload> = P['vars'] extends Record<string, string>
  ? P['vars']
  : never;
```

- [ ] **Step 2: Write props.ts**

Create `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/types/props.ts`:

```ts
import type { CSSProperties, ReactNode } from 'react';
import type { ResolvedTheme } from '@soribashi/theme';
import type { FactoryPayload, FactoryStylesNames, FactoryVars } from './factory-payload.ts';

/**
 * Per-selector class name overrides. Keys are stylesNames; values are extra classes.
 */
export type ClassNames<P extends FactoryPayload> =
  | Partial<Record<FactoryStylesNames<P>, string>>
  | ((theme: ResolvedTheme, props: P['props']) => Partial<Record<FactoryStylesNames<P>, string>>);

/**
 * Per-selector style overrides. Keys are stylesNames; values are CSSProperties.
 */
export type Styles<P extends FactoryPayload> =
  | Partial<Record<FactoryStylesNames<P>, CSSProperties>>
  | ((
      theme: ResolvedTheme,
      props: P['props']
    ) => Partial<Record<FactoryStylesNames<P>, CSSProperties>>);

/**
 * Per-selector CSS variable overrides. Function-only at the theme level
 * since vars are typically computed from props.
 */
export type Vars<P extends FactoryPayload> = (
  theme: ResolvedTheme,
  props: P['props']
) => Partial<Record<FactoryStylesNames<P>, Record<string, string>>>;

/**
 * Per-selector arbitrary attributes (data-*, aria-*, etc.).
 */
export type Attributes<P extends FactoryPayload> = Partial<
  Record<FactoryStylesNames<P>, Record<string, unknown>>
>;

/**
 * The Styles API base props every component accepts.
 *
 * Components built with defineComponent or factory automatically get:
 *   - className, style — root-level escape hatches
 *   - classNames, styles — per-selector overrides
 *   - vars — CSS variable overrides
 *   - attributes — per-selector attributes
 *   - unstyled — render without baseline classes (advanced)
 */
export interface StylesApiProps<P extends FactoryPayload> {
  className?: string;
  style?: CSSProperties;
  classNames?: ClassNames<P>;
  styles?: Styles<P>;
  vars?: Vars<P>;
  attributes?: Attributes<P>;
  unstyled?: boolean;
  children?: ReactNode;
}
```

- [ ] **Step 3: Write render-context.ts**

Create `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/types/render-context.ts`:

```ts
import type { CSSProperties, Ref } from 'react';
import type { FactoryPayload, FactoryStylesNames } from './factory-payload.ts';

/**
 * Output of `getStyles(selector)` — spread onto an element.
 */
export interface GetStylesResult {
  className: string;
  style?: CSSProperties;
  [dataAttr: `data-${string}`]: unknown;
  [ariaAttr: `aria-${string}`]: unknown;
}

/**
 * The function returned by useStyles. Call with a selector to get the
 * spread-able props for the corresponding element.
 *
 * Optional second arg accepts:
 *   - active: boolean | undefined  — toggles data-active for interactive states
 *   - variant: string | undefined  — emits data-variant
 *   - style: CSSProperties         — extra inline style merged at this site
 */
export type GetStylesFn<P extends FactoryPayload> = (
  selector: FactoryStylesNames<P>,
  options?: GetStylesOptions
) => GetStylesResult;

export interface GetStylesOptions {
  active?: boolean;
  variant?: string;
  style?: CSSProperties;
  className?: string;
}

/**
 * The render-function context provided by defineComponent.
 *
 * - `props` is the fully-resolved, type-narrowed props (defaults applied)
 * - `getStyles` returns the spread-able props for each selector
 * - `ref` is the forwarded ref
 */
export interface RenderContext<P extends FactoryPayload> {
  props: P['props'];
  getStyles: GetStylesFn<P>;
  ref?: Ref<P['ref']>;
}
```

- [ ] **Step 4: Write types/index.ts**

Create `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/types/index.ts`:

```ts
export type {
  FactoryPayload,
  FactoryProps,
  FactoryStylesNames,
  FactoryVars,
} from './factory-payload.ts';

export type {
  StylesApiProps,
  ClassNames,
  Styles,
  Vars,
  Attributes,
} from './props.ts';

export type {
  RenderContext,
  GetStylesFn,
  GetStylesResult,
  GetStylesOptions,
} from './render-context.ts';
```

- [ ] **Step 5: Smoke test**

Create `/Users/matt/Documents/GitHub/soribashi/packages/factory/test/types.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import type {
  FactoryPayload,
  StylesApiProps,
  GetStylesFn,
  ClassNames,
} from '../src/types/index.ts';

describe('factory types', () => {
  it('Factory payload accepts expected fields', () => {
    type X = FactoryPayload & {
      props: { foo: string };
      stylesNames: 'root' | 'label';
      variant: 'a' | 'b';
    };
    const _ok: X = {
      props: { foo: 'x' },
    };
    expect(_ok.props.foo).toBe('x');
  });

  it('StylesApiProps is parameterized correctly', () => {
    type F = FactoryPayload & { props: { x: string }; stylesNames: 'root' | 'label' };
    const props: StylesApiProps<F> = {
      classNames: { root: 'a', label: 'b' },
    };
    expect(props.classNames).toEqual({ root: 'a', label: 'b' });
  });

  it('ClassNames callback shape compiles', () => {
    type F = FactoryPayload & { props: { x: string }; stylesNames: 'root' };
    const cn: ClassNames<F> = (_theme, props) => ({ root: props.x });
    expect(typeof cn).toBe('function');
  });
});
```

- [ ] **Step 6: Run tests**

```bash
bun test test/types.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/factory/src/types/ packages/factory/test/types.test.ts
git commit -m "feat(factory): add Factory, StylesApiProps, RenderContext type definitions"
```

---

## Task 4: SoribashiProvider — Theme Context

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/provider/context.ts`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/provider/provider.tsx`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/provider/use-theme.ts`

- [ ] **Step 1: Write the failing test**

Create `/Users/matt/Documents/GitHub/soribashi/packages/factory/test/provider.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, renderHook } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
import { SoribashiProvider } from '../src/provider/provider.tsx';
import { useTheme } from '../src/provider/use-theme.ts';

const theme = createTheme({
  tokens: {
    colors: { primary: { '500': '#000' } },
    radius: { md: '0.5rem' },
    spacing: { md: '0.5rem' },
    fontSize: { md: '1rem' },
  },
  name: 'test-theme',
});

describe('SoribashiProvider', () => {
  it('provides the theme via useTheme', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <SoribashiProvider theme={theme}>{children}</SoribashiProvider>
      ),
    });

    expect(result.current.name).toBe('test-theme');
    expect(result.current.tokens.colors.primary?.['500']).toBe('#000');
  });

  it('useTheme falls back to a default empty theme outside provider', () => {
    const { result } = renderHook(() => useTheme());
    // Mantine throws here, but soribashi returns a sensible default to make
    // hooks usable in isolated test rendering. Verify by checking the name.
    expect(result.current.name).toBe('default');
  });

  it('renders children', () => {
    const { getByText } = render(
      <SoribashiProvider theme={theme}>
        <div>hello</div>
      </SoribashiProvider>
    );
    expect(getByText('hello')).toBeInTheDocument();
  });

  it('nested provider replaces theme', () => {
    const inner = createTheme({
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
      },
      name: 'inner',
    });

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <SoribashiProvider theme={theme}>
          <SoribashiProvider theme={inner}>{children}</SoribashiProvider>
        </SoribashiProvider>
      ),
    });

    expect(result.current.name).toBe('inner');
  });
});
```

- [ ] **Step 2: Run test (FAIL)**

- [ ] **Step 3: Implement context.ts**

```ts
import { createContext } from 'react';
import { createTheme, type ResolvedTheme } from '@soribashi/theme';

/**
 * The default theme used when no SoribashiProvider is present in the tree.
 * Mantine throws in this case, but soribashi returns a sensible default to
 * make components testable in isolation without a provider wrapper.
 */
export const defaultContextTheme: ResolvedTheme = createTheme({
  tokens: {
    colors: {},
    radius: {},
    spacing: {},
    fontSize: {},
  },
});

export const SoribashiContext = createContext<ResolvedTheme>(defaultContextTheme);
```

- [ ] **Step 4: Implement provider.tsx**

```tsx
import { type ReactNode } from 'react';
import type { ResolvedTheme } from '@soribashi/theme';
import { SoribashiContext } from './context.ts';

export interface SoribashiProviderProps {
  theme: ResolvedTheme;
  children?: ReactNode;
}

/**
 * Provides the resolved soribashi theme to all components in the subtree.
 * Equivalent to Mantine's MantineProvider but does NOT inject CSS variables —
 * that's codegen's job in soribashi (the theme.css is imported separately).
 *
 * Nested providers fully replace the theme rather than merging. To extend
 * a parent theme, pass the result of createTheme({ extends: parent }).
 */
export function SoribashiProvider(props: SoribashiProviderProps) {
  return (
    <SoribashiContext.Provider value={props.theme}>
      {props.children}
    </SoribashiContext.Provider>
  );
}
```

- [ ] **Step 5: Implement use-theme.ts**

```ts
import { useContext } from 'react';
import { SoribashiContext } from './context.ts';

/**
 * Returns the resolved soribashi theme from the nearest SoribashiProvider,
 * or a default empty theme if none is found.
 */
export function useTheme() {
  return useContext(SoribashiContext);
}
```

- [ ] **Step 6: Run test (PASS)**

```bash
bun test test/provider.test.tsx
```

- [ ] **Step 7: Commit**

```bash
git add packages/factory/src/provider/ packages/factory/test/provider.test.tsx
git commit -m "feat(factory): add SoribashiProvider and useTheme hook"
```

---

## Task 5: useProps Hook

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/hooks/use-props.ts`

**Reference:** Validate against Mantine's `useProps` at `packages/@mantine/core/src/core/Box/use-props/use-props.ts`. The merge order (instance > theme > component defaults) and undefined-only-skip behavior are what matters.

- [ ] **Step 1: Write the failing test**

Create `/Users/matt/Documents/GitHub/soribashi/packages/factory/test/use-props.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
import { SoribashiProvider } from '../src/provider/provider.tsx';
import { useProps } from '../src/hooks/use-props.ts';

interface ButtonProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'filled' | 'outline';
  loading?: boolean;
  children?: string;
}

const wrapper = (themeOverride?: any) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    const theme = themeOverride ?? createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
    });
    return <SoribashiProvider theme={theme}>{children}</SoribashiProvider>;
  };

describe('useProps', () => {
  it('returns instance props when no defaults exist', () => {
    const { result } = renderHook(
      () => useProps<ButtonProps>('Button', null, { size: 'md', loading: true }),
      { wrapper: wrapper() }
    );
    expect(result.current).toEqual({ size: 'md', loading: true });
  });

  it('applies component-level defaults when not in instance props', () => {
    const { result } = renderHook(
      () =>
        useProps<ButtonProps>(
          'Button',
          { size: 'md', variant: 'filled' },
          { loading: true }
        ),
      { wrapper: wrapper() }
    );
    expect(result.current).toEqual({ size: 'md', variant: 'filled', loading: true });
  });

  it('instance props override component defaults', () => {
    const { result } = renderHook(
      () =>
        useProps<ButtonProps>(
          'Button',
          { size: 'md' },
          { size: 'lg' }
        ),
      { wrapper: wrapper() }
    );
    expect(result.current.size).toBe('lg');
  });

  it('theme defaultProps override component defaults but lose to instance', () => {
    const themeWithDefaults = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: { defaultProps: { size: 'lg', variant: 'outline' } },
      },
    });

    const { result } = renderHook(
      () =>
        useProps<ButtonProps>(
          'Button',
          { size: 'md', variant: 'filled' }, // component defaults
          { variant: 'outline' }              // instance also says outline; matches theme
        ),
      { wrapper: wrapper(themeWithDefaults) }
    );
    // Theme wins over component defaults (size goes from md → lg via theme)
    expect(result.current.size).toBe('lg');
    // Instance and theme agree on variant
    expect(result.current.variant).toBe('outline');
  });

  it('instance props with explicit undefined do NOT override defaults', () => {
    const { result } = renderHook(
      () =>
        useProps<ButtonProps>(
          'Button',
          { size: 'md' },
          { size: undefined as unknown as 'sm' }
        ),
      { wrapper: wrapper() }
    );
    expect(result.current.size).toBe('md');
  });

  it('does NOT call theme classNames/styles callbacks (those are useStyles concerns)', () => {
    const themeWithDefaults = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: {
          defaultProps: { size: 'lg' },
          // These should be ignored by useProps:
          classNames: { root: 'theme-root' } as any,
        },
      },
    });

    const { result } = renderHook(
      () => useProps<ButtonProps>('Button', null, { children: 'X' }),
      { wrapper: wrapper(themeWithDefaults) }
    );
    expect((result.current as any).classNames).toBeUndefined();
    expect(result.current.size).toBe('lg');
  });
});
```

- [ ] **Step 2: Run test (FAIL)**

- [ ] **Step 3: Implement useProps**

```ts
import { useTheme } from '../provider/use-theme.ts';

/**
 * Merges three sources of props in this precedence (highest to lowest):
 *
 *   1. Instance props (props passed to the component at the call site)
 *   2. Theme component defaultProps (from `theme.components[name].defaultProps`)
 *   3. Component-level defaults (passed as `defaults` argument here)
 *
 * Important detail (matches Mantine): instance props with explicit `undefined`
 * do NOT override defaults. Only defined values win. This makes optional props
 * safe — `<Button size={undefined} />` is treated as "don't override default".
 */
export function useProps<P extends Record<string, unknown>>(
  name: string,
  defaults: Partial<P> | null,
  instanceProps: P
): P {
  const theme = useTheme();
  const themeDefaults = (theme.components[name]?.defaultProps ?? {}) as Partial<P>;

  const merged: Partial<P> = {
    ...(defaults ?? {}),
    ...themeDefaults,
  };

  for (const key in instanceProps) {
    if (instanceProps[key] !== undefined) {
      (merged as Record<string, unknown>)[key] = instanceProps[key];
    }
  }

  return merged as P;
}
```

- [ ] **Step 4: Run test (PASS)**

```bash
bun test test/use-props.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add packages/factory/src/hooks/use-props.ts packages/factory/test/use-props.test.tsx
git commit -m "feat(factory): add useProps hook with instance > theme > component default precedence"
```

---

## Task 6: useStyles Hook — Selector Resolution

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/hooks/use-styles.ts`

**Reference:** Validate against Mantine's `useStyles` at `packages/@mantine/core/src/core/styles-api/use-styles/use-styles.ts`. We replicate the resolution order: built-in classes < theme classNames < instance classNames; same for styles, vars, attributes.

- [ ] **Step 1: Write the failing test**

Create `/Users/matt/Documents/GitHub/soribashi/packages/factory/test/use-styles.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
import { SoribashiProvider } from '../src/provider/provider.tsx';
import { useStyles } from '../src/hooks/use-styles.ts';
import type { FactoryPayload } from '../src/types/index.ts';

type ButtonFactory = FactoryPayload & {
  props: { variant?: string; size?: string };
  stylesNames: 'root' | 'label';
};

const wrapper = (themeOverride?: any) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    const theme = themeOverride ?? createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
    });
    return <SoribashiProvider theme={theme}>{children}</SoribashiProvider>;
  };

describe('useStyles', () => {
  it('returns getStyles function that resolves built-in class for selector', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'sb-Button-root', label: 'sb-Button-label' },
          props: {},
        }),
      { wrapper: wrapper() }
    );

    const root = result.current('root');
    expect(root.className).toContain('sb-Button-root');
    const label = result.current('label');
    expect(label.className).toContain('sb-Button-label');
  });

  it('merges instance className into root selector', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'sb-Button-root', label: 'sb-Button-label' },
          className: 'my-extra-class',
          props: {},
        }),
      { wrapper: wrapper() }
    );

    const root = result.current('root');
    expect(root.className).toContain('sb-Button-root');
    expect(root.className).toContain('my-extra-class');
  });

  it('does NOT add instance className to non-root selectors', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'sb-Button-root', label: 'sb-Button-label' },
          className: 'my-extra-class',
          props: {},
        }),
      { wrapper: wrapper() }
    );

    const label = result.current('label');
    expect(label.className).not.toContain('my-extra-class');
  });

  it('applies instance classNames per selector', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'sb-Button-root', label: 'sb-Button-label' },
          classNames: { root: 'instance-root-extra', label: 'instance-label-extra' },
          props: {},
        }),
      { wrapper: wrapper() }
    );

    expect(result.current('root').className).toContain('instance-root-extra');
    expect(result.current('label').className).toContain('instance-label-extra');
  });

  it('applies theme component classNames (object form)', () => {
    const themeWithClassNames = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: { classNames: { root: 'theme-root-extra' } },
      },
    });

    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'sb-Button-root' },
          props: {},
        }),
      { wrapper: wrapper(themeWithClassNames) }
    );

    expect(result.current('root').className).toContain('theme-root-extra');
  });

  it('applies theme component classNames (callback form, receives theme + props)', () => {
    const themeWithCallback = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: {
          classNames: ((_theme: any, props: any) => ({
            root: props.size === 'lg' ? 'theme-root-lg' : 'theme-root-default',
          })) as any,
        },
      },
    });

    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'sb-Button-root' },
          props: { size: 'lg' },
        }),
      { wrapper: wrapper(themeWithCallback) }
    );

    expect(result.current('root').className).toContain('theme-root-lg');
  });

  it('precedence: instance classNames win over theme classNames', () => {
    const themeWithClassNames = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: { classNames: { root: 'theme-class' } },
      },
    });

    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'sb-Button-root' },
          classNames: { root: 'instance-class' },
          props: {},
        }),
      { wrapper: wrapper(themeWithClassNames) }
    );

    const root = result.current('root');
    // Both present — order matters because tailwind-merge resolves conflicts via right-most
    expect(root.className).toContain('theme-class');
    expect(root.className).toContain('instance-class');
    // Instance comes after theme in the merged class string
    expect(root.className.indexOf('instance-class')).toBeGreaterThan(root.className.indexOf('theme-class'));
  });

  it('respects unstyled flag — drops built-in classes', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'sb-Button-root', label: 'sb-Button-label' },
          unstyled: true,
          classNames: { root: 'instance-only' },
          props: {},
        }),
      { wrapper: wrapper() }
    );

    const root = result.current('root');
    expect(root.className).not.toContain('sb-Button-root');
    expect(root.className).toContain('instance-only');
  });

  it('emits data-variant when getStyles is called with variant option', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'sb-Button-root' },
          props: { variant: 'filled' },
        }),
      { wrapper: wrapper() }
    );

    const root = result.current('root', { variant: 'filled' });
    expect(root['data-variant']).toBe('filled');
  });

  it('emits data-active when active option is true', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'sb-Button-root' },
          props: {},
        }),
      { wrapper: wrapper() }
    );

    const rootActive = result.current('root', { active: true });
    expect(rootActive['data-active']).toBe(true);
    const rootInactive = result.current('root', { active: false });
    expect(rootInactive['data-active']).toBeUndefined();
  });

  it('merges instance attributes with per-selector attributes from theme', () => {
    const themeWithAttrs = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: { attributes: { root: { 'data-testid': 'theme-button' } } },
      },
    });

    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'sb-Button-root' },
          attributes: { root: { 'data-testid': 'instance-button' } },
          props: {},
        }),
      { wrapper: wrapper(themeWithAttrs) }
    );

    const root = result.current('root');
    expect(root['data-testid' as keyof typeof root]).toBe('instance-button');
  });

  it('merges per-selector vars from varsResolver into style', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'sb-Button-root' },
          props: { variant: 'filled' },
          varsResolver: () => ({
            root: { '--btn-bg': 'red' },
          }),
        }),
      { wrapper: wrapper() }
    );

    const root = result.current('root');
    expect(root.style).toBeDefined();
    expect((root.style as any)['--btn-bg']).toBe('red');
  });
});
```

- [ ] **Step 2: Run test (FAIL)**

- [ ] **Step 3: Implement useStyles**

Create `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/hooks/use-styles.ts`:

```ts
import type { CSSProperties } from 'react';
import type { ResolvedTheme } from '@soribashi/theme';
import { cn } from '../cn.ts';
import { useTheme } from '../provider/use-theme.ts';
import type {
  FactoryPayload,
  FactoryStylesNames,
} from '../types/factory-payload.ts';
import type {
  ClassNames,
  Styles,
  Attributes,
} from '../types/props.ts';
import type { GetStylesFn, GetStylesResult, GetStylesOptions } from '../types/render-context.ts';

export interface UseStylesConfig<P extends FactoryPayload> {
  /** Component name — must match the key in `theme.components` */
  name: string;
  /** Built-in classes (e.g. CSS module export) keyed by selector */
  classes?: Partial<Record<FactoryStylesNames<P>, string>>;
  /** Instance className (applies to root only) */
  className?: string;
  /** Instance style (applies to root only) */
  style?: CSSProperties;
  /** Instance per-selector class overrides */
  classNames?: ClassNames<P>;
  /** Instance per-selector style overrides */
  styles?: Styles<P>;
  /** Instance per-selector attributes */
  attributes?: Attributes<P>;
  /** When true, drops built-in classes (escape hatch for full custom styling) */
  unstyled?: boolean;
  /** Resolved props (output of useProps) */
  props: P['props'];
  /** Vars resolver function (returns per-selector CSS vars from theme + props) */
  varsResolver?: (theme: ResolvedTheme, props: P['props']) => Partial<
    Record<FactoryStylesNames<P>, Record<string, string>>
  >;
}

/**
 * Returns a `getStyles(selector, options?)` function that, when called for a
 * given selector, returns the spread-able props for that element:
 *   - className (combined from built-in + theme + instance)
 *   - style (combined from theme + instance + vars resolved values)
 *   - data-variant, data-active (from options)
 *   - per-selector attributes (theme + instance merged)
 *
 * Resolution precedence (highest to lowest):
 *   1. Instance props (className, classNames, styles, attributes, vars on instance)
 *   2. Theme component config (theme.components[name])
 *   3. Built-in classes (config.classes)
 */
export function useStyles<P extends FactoryPayload>(
  config: UseStylesConfig<P>
): GetStylesFn<P> {
  const theme = useTheme();
  const themeComponent = theme.components[config.name] ?? {};

  return (selector, options?: GetStylesOptions): GetStylesResult => {
    const isRoot = (selector as string) === 'root';

    // 1. Built-in class (skip if unstyled)
    const builtIn = config.unstyled ? '' : config.classes?.[selector] ?? '';

    // 2. Theme classNames (object or callback form)
    const themeClassNames = resolveClassNames(themeComponent.classNames, theme, config.props);
    const themeClass = themeClassNames[selector as string] ?? '';

    // 3. Instance classNames (object or callback)
    const instanceClassNamesRaw = config.classNames as ClassNames<P> | undefined;
    const instanceClassNames = resolveClassNames(
      instanceClassNamesRaw,
      theme,
      config.props
    );
    const instanceClass = instanceClassNames[selector as string] ?? '';

    // 4. Instance className prop (applies to root only)
    const rootInstanceClass = isRoot ? config.className ?? '' : '';

    // 5. Optional className from getStyles call site
    const callSiteClass = options?.className ?? '';

    const className = cn(builtIn, themeClass, instanceClass, rootInstanceClass, callSiteClass);

    // Style: theme styles → instance styles → vars → instance style prop (root) → call site style
    const themeStyles = resolveStyles(themeComponent.styles, theme, config.props);
    const instanceStylesRaw = config.styles as Styles<P> | undefined;
    const instanceStyles = resolveStyles(instanceStylesRaw, theme, config.props);
    const themeVarsResolverFromTheme = themeComponent.vars
      ? themeComponent.vars(theme, config.props)
      : {};
    const builtInVars = config.varsResolver
      ? config.varsResolver(theme, config.props)
      : {};

    const styleParts: CSSProperties[] = [
      themeStyles[selector as string] ?? {},
      instanceStyles[selector as string] ?? {},
      (builtInVars[selector] as CSSProperties | undefined) ?? {},
      (themeVarsResolverFromTheme[selector as string] as CSSProperties | undefined) ?? {},
    ];

    if (isRoot && config.style) styleParts.push(config.style);
    if (options?.style) styleParts.push(options.style);

    const style = mergeStyles(styleParts);

    // Attributes: theme + instance per selector
    const themeAttrs = (themeComponent.attributes?.[selector as string] ?? {}) as Record<
      string,
      unknown
    >;
    const instanceAttrs = (config.attributes?.[selector] as Record<string, unknown>) ?? {};

    const result: GetStylesResult = {
      className,
      ...themeAttrs,
      ...instanceAttrs,
    };

    if (Object.keys(style).length > 0) result.style = style;
    if (options?.variant !== undefined) result['data-variant' as keyof GetStylesResult] = options.variant as never;
    if (options?.active === true) result['data-active' as keyof GetStylesResult] = true as never;

    return result;
  };
}

function resolveClassNames<P extends FactoryPayload>(
  cn: ClassNames<P> | undefined,
  theme: ResolvedTheme,
  props: P['props']
): Record<string, string> {
  if (!cn) return {};
  if (typeof cn === 'function') return cn(theme, props) as Record<string, string>;
  return cn as Record<string, string>;
}

function resolveStyles<P extends FactoryPayload>(
  s: Styles<P> | undefined,
  theme: ResolvedTheme,
  props: P['props']
): Record<string, CSSProperties> {
  if (!s) return {};
  if (typeof s === 'function') return s(theme, props) as Record<string, CSSProperties>;
  return s as Record<string, CSSProperties>;
}

function mergeStyles(parts: CSSProperties[]): CSSProperties {
  return parts.reduce((acc, p) => Object.assign(acc, p), {} as CSSProperties);
}
```

- [ ] **Step 4: Run test (PASS)**

```bash
bun test test/use-styles.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add packages/factory/src/hooks/use-styles.ts packages/factory/test/use-styles.test.tsx
git commit -m "feat(factory): add useStyles hook with selector resolution and theme overrides"
```

---

## Task 7: createVarsResolver

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/create-vars-resolver.ts`

- [ ] **Step 1: Write the test**

Create `/Users/matt/Documents/GitHub/soribashi/packages/factory/test/create-vars-resolver.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createTheme } from '@soribashi/theme';
import { createVarsResolver } from '../src/create-vars-resolver.ts';
import type { FactoryPayload } from '../src/types/index.ts';

type ButtonFactory = FactoryPayload & {
  props: { intent?: string; variant?: string };
  stylesNames: 'root';
  vars: { root: '--btn-bg' | '--btn-color' };
};

describe('createVarsResolver', () => {
  it('preserves the function and types it', () => {
    const resolver = createVarsResolver<ButtonFactory>((theme, props) => ({
      root: {
        '--btn-bg': props.intent === 'danger' ? 'red' : 'blue',
        '--btn-color': 'white',
      },
    }));

    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
    });

    expect(resolver(theme, { intent: 'danger' })).toEqual({
      root: { '--btn-bg': 'red', '--btn-color': 'white' },
    });
  });

  it('is just an identity function at runtime', () => {
    const fn = (theme: any, props: any) => ({ root: { '--x': 'y' } });
    const wrapped = createVarsResolver<ButtonFactory>(fn as any);
    expect(wrapped).toBe(fn);
  });
});
```

- [ ] **Step 2: Implement**

Create `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/create-vars-resolver.ts`:

```ts
import type { ResolvedTheme } from '@soribashi/theme';
import type { FactoryPayload, FactoryStylesNames } from './types/factory-payload.ts';

/**
 * Identity helper that types a vars resolver function for a given Factory.
 *
 * Usage:
 *   const varsResolver = createVarsResolver<ButtonFactory>((theme, props) => ({
 *     root: { '--btn-bg': '...', '--btn-color': '...' },
 *   }));
 *
 * Mantine ships this as `createVarsResolver` (same shape). At runtime it's a
 * no-op; the value lives in TypeScript inference.
 */
export function createVarsResolver<P extends FactoryPayload>(
  fn: (
    theme: ResolvedTheme,
    props: P['props']
  ) => Partial<Record<FactoryStylesNames<P>, Record<string, string>>>
): (
  theme: ResolvedTheme,
  props: P['props']
) => Partial<Record<FactoryStylesNames<P>, Record<string, string>>> {
  return fn;
}
```

- [ ] **Step 3: Run test (PASS)**

- [ ] **Step 4: Commit**

```bash
git add packages/factory/src/create-vars-resolver.ts packages/factory/test/create-vars-resolver.test.ts
git commit -m "feat(factory): add createVarsResolver typing helper"
```

---

## Task 8: factory() Low-Level Function

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/with-props.ts`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/factory.ts`

**Reference:** Mantine's factory at `packages/@mantine/core/src/core/factory/factory.tsx`. The function is mostly types — at runtime it just attaches `extend = identity`, `withProps`, and returns the component.

- [ ] **Step 1: Write the test**

Create `/Users/matt/Documents/GitHub/soribashi/packages/factory/test/factory.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { factory } from '../src/factory.ts';
import type { FactoryPayload } from '../src/types/index.ts';

type ButtonFactory = FactoryPayload & {
  props: { children?: React.ReactNode; size?: string };
  ref: HTMLButtonElement;
  stylesNames: 'root' | 'label';
};

const Button = factory<ButtonFactory>((props) => (
  <button data-size={props.size}>{props.children}</button>
));

Button.displayName = 'Button';

describe('factory', () => {
  it('returns a renderable component', () => {
    const { getByText } = render(<Button>Click</Button>);
    expect(getByText('Click')).toBeInTheDocument();
  });

  it('attaches extend as identity', () => {
    expect(typeof Button.extend).toBe('function');
    const config = { defaultProps: { size: 'lg' } };
    expect(Button.extend(config)).toBe(config);
  });

  it('attaches withProps that returns a component preset', () => {
    const LargeButton = Button.withProps({ size: 'lg' });
    const { container } = render(<LargeButton>X</LargeButton>);
    expect(container.querySelector('button')?.dataset.size).toBe('lg');
  });

  it('withProps: instance props override preset', () => {
    const LargeButton = Button.withProps({ size: 'lg' });
    const { container } = render(<LargeButton size="sm">X</LargeButton>);
    expect(container.querySelector('button')?.dataset.size).toBe('sm');
  });

  it('preserves displayName on withProps result', () => {
    const LargeButton = Button.withProps({ size: 'lg' });
    expect((LargeButton as any).displayName).toContain('Button');
  });
});
```

- [ ] **Step 2: Implement with-props.ts**

```tsx
import { type ComponentType, forwardRef, type ForwardRefExoticComponent, type Ref } from 'react';

/**
 * Creates a preset variant of a component by pre-applying default props.
 * Instance props always win over presets (matches Mantine).
 *
 * Used internally by factory(); also exposed via Component.withProps.
 */
export function makeWithProps<TProps>(
  Base: ComponentType<TProps> | ForwardRefExoticComponent<TProps & { ref?: Ref<any> }>
) {
  return function withProps(presets: Partial<TProps>): ComponentType<TProps> {
    const Wrapped = forwardRef((props: any, ref: Ref<any>) => {
      // Spread presets first, then instance props so instance overrides.
      // Filter undefined from instance to avoid clobbering presets.
      const merged: Record<string, unknown> = { ...presets };
      for (const key in props) {
        if (props[key] !== undefined) merged[key] = props[key];
      }
      const Component = Base as ComponentType<any>;
      return <Component ref={ref} {...merged} />;
    });
    Wrapped.displayName = `WithProps(${(Base as any).displayName ?? Base.name ?? 'Component'})`;
    return Wrapped as unknown as ComponentType<TProps>;
  };
}
```

- [ ] **Step 3: Implement factory.ts**

```tsx
import { type ComponentType, forwardRef, type Ref } from 'react';
import type { FactoryPayload } from './types/factory-payload.ts';
import { makeWithProps } from './with-props.ts';

const identity = <T,>(value: T): T => value;

/**
 * Mantine-style factory function. The runtime is mostly empty — the
 * factory's job is type-level: it takes a render function and types it
 * against the Factory payload, then attaches the standard static methods.
 *
 * Reference:
 *   https://github.com/mantinedev/mantine/blob/master/packages/%40mantine/core/src/core/factory/factory.tsx
 */
export interface FactoryComponent<P extends FactoryPayload>
  extends ComponentType<P['props'] & { ref?: Ref<P['ref']> }> {
  /** Theme-level component config (identity at runtime; types matter) */
  extend: (config: any) => any;
  /** Returns a preset variant with default props applied */
  withProps: (presets: Partial<P['props']>) => ComponentType<P['props']>;
  /** CSS module classes (set by defineComponent if classes are provided) */
  classes?: Partial<Record<NonNullable<P['stylesNames']>, string>>;
  /** Display name for debugging */
  displayName?: string;
}

export function factory<P extends FactoryPayload>(
  render: (props: P['props'], ref: Ref<P['ref']>) => React.ReactNode
): FactoryComponent<P> {
  const Component = forwardRef<P['ref'], P['props']>((props, ref) =>
    render(props, ref) as React.ReactElement
  ) as unknown as FactoryComponent<P>;

  Component.extend = identity;
  Component.withProps = makeWithProps(Component as ComponentType<P['props']>);

  return Component;
}
```

- [ ] **Step 4: Run test (PASS)**

```bash
bun test test/factory.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add packages/factory/src/factory.ts packages/factory/src/with-props.ts packages/factory/test/factory.test.tsx
git commit -m "feat(factory): add factory() low-level API with extend, withProps statics"
```

---

## Task 9: Auto-Vars from Intent Resolver

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/auto-vars.ts`

This is one of soribashi's user-friendliness wins: when a component declares variants but doesn't supply a custom vars resolver, the framework automatically calls `theme.intentResolver` and exposes `--{name}-bg`, `--{name}-color`, etc. on the root selector.

- [ ] **Step 1: Write the test**

Create `/Users/matt/Documents/GitHub/soribashi/packages/factory/test/auto-vars.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createTheme } from '@soribashi/theme';
import { autoVars } from '../src/auto-vars.ts';

const theme = createTheme({
  tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
});

describe('autoVars', () => {
  it('returns empty object when component has no variants and no intent prop', () => {
    const result = autoVars(theme, 'Button', { size: 'md' }, false);
    expect(result).toEqual({});
  });

  it('returns root vars when component declares variants and props have intent + variant', () => {
    const result = autoVars(
      theme,
      'Button',
      { intent: 'primary', variant: 'filled' },
      true
    );
    expect(result.root).toBeDefined();
    expect(result.root?.['--button-bg']).toBe('var(--color-primary-500)');
    expect(result.root?.['--button-color']).toBe('var(--color-primary-foreground)');
    expect(result.root?.['--button-border']).toBe('transparent');
  });

  it('lowercases the component name for the var prefix', () => {
    const result = autoVars(
      theme,
      'IconButton',
      { intent: 'primary', variant: 'filled' },
      true
    );
    expect(result.root?.['--iconbutton-bg']).toBe('var(--color-primary-500)');
  });

  it('returns hover and active vars when resolver provides them', () => {
    const result = autoVars(
      theme,
      'Button',
      { intent: 'primary', variant: 'filled' },
      true
    );
    expect(result.root?.['--button-hover']).toBe('var(--color-primary-600)');
    expect(result.root?.['--button-active']).toBe('var(--color-primary-700)');
  });

  it('omits hover when resolver does not provide it', () => {
    const customTheme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      intentResolver: () => ({
        background: 'red',
        color: 'white',
        border: 'transparent',
        // no hover/active
      }),
    });

    const result = autoVars(customTheme, 'Button', { intent: 'primary', variant: 'x' }, true);
    expect(result.root?.['--button-hover']).toBeUndefined();
    expect(result.root?.['--button-active']).toBeUndefined();
  });

  it('returns empty when component declares variants but instance lacks intent', () => {
    const result = autoVars(theme, 'Button', { variant: 'filled' }, true);
    expect(result).toEqual({});
  });
});
```

- [ ] **Step 2: Implement**

```ts
import type { ResolvedTheme } from '@soribashi/theme';

/**
 * Auto-derives root-selector CSS variables from the theme's intent resolver
 * for components that declare variants. This is what makes the daily-use
 * defineComponent API "just work" without manually wiring a varsResolver.
 *
 * Behavior:
 *   - If the component does not declare variants (hasVariants=false), returns {}.
 *   - If the component does, but instance props lack `intent` or `variant`, returns {}.
 *   - Otherwise, calls theme.intentResolver and maps the result keys to
 *     CSS vars named `--{lowercased-component-name}-{key}` where key uses
 *     `bg` (instead of `background`) but otherwise matches the resolver output.
 */
export function autoVars(
  theme: ResolvedTheme,
  componentName: string,
  props: Record<string, unknown>,
  hasVariants: boolean
): { root?: Record<string, string> } {
  if (!hasVariants) return {};

  const intent = props.intent as string | undefined;
  const variant = props.variant as string | undefined;
  if (!intent || !variant) return {};

  const result = theme.intentResolver({ intent, variant, theme });
  const prefix = componentName.toLowerCase();

  const root: Record<string, string> = {
    [`--${prefix}-bg`]: result.background,
    [`--${prefix}-color`]: result.color,
    [`--${prefix}-border`]: result.border,
  };

  if (result.hover !== undefined) root[`--${prefix}-hover`] = result.hover;
  if (result.active !== undefined) root[`--${prefix}-active`] = result.active;
  if (result.hoverColor !== undefined) root[`--${prefix}-hover-color`] = result.hoverColor;

  return { root };
}
```

- [ ] **Step 3: Run test (PASS)**

- [ ] **Step 4: Commit**

```bash
git add packages/factory/src/auto-vars.ts packages/factory/test/auto-vars.test.ts
git commit -m "feat(factory): add autoVars to derive --{name}-{key} CSS vars from intent resolver"
```

---

## Task 10: defineComponent High-Level API

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/define-component.tsx`

This is the headline daily-use API. It collapses the factory + useProps + useStyles + auto-vars wiring into a single config object.

- [ ] **Step 1: Write the test**

Create `/Users/matt/Documents/GitHub/soribashi/packages/factory/test/define-component.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
import { SoribashiProvider } from '../src/provider/provider.tsx';
import { defineComponent } from '../src/define-component.tsx';

interface ButtonOwnProps {
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
}

const Button = defineComponent<ButtonOwnProps>({
  name: 'Button',
  selectors: ['root', 'label', 'icon'] as const,
  classes: { root: 'sb-Button-root', label: 'sb-Button-label', icon: 'sb-Button-icon' },
  defaults: { loading: false, fullWidth: false },
  render: ({ props, getStyles }) => (
    <button {...getStyles('root')}>
      {props.leftIcon && <span {...getStyles('icon')}>{props.leftIcon}</span>}
      <span {...getStyles('label')}>{props.children as React.ReactNode}</span>
    </button>
  ),
});

const theme = createTheme({
  tokens: {
    colors: {
      primary: { '500': 'hsl(217 91% 60%)', foreground: 'white' },
    } as any,
    radius: {},
    spacing: {},
    fontSize: {},
  },
});

const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);

describe('defineComponent — basic rendering', () => {
  it('renders the root with the configured class', () => {
    const { container } = wrap(<Button>Click</Button>);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('sb-Button-root');
  });

  it('applies defaults to props (loading=false → not rendered as loading)', () => {
    const { container } = wrap(<Button>Click</Button>);
    const btn = container.querySelector('button');
    expect(btn).toBeInTheDocument();
  });

  it('passes children through to label slot', () => {
    const { getByText } = wrap(<Button>Hello</Button>);
    expect(getByText('Hello')).toBeInTheDocument();
  });

  it('renders leftIcon when provided', () => {
    const { container } = wrap(<Button leftIcon={<span data-testid="icon">★</span>}>X</Button>);
    expect(container.querySelector('[data-testid="icon"]')).toBeInTheDocument();
  });

  it('respects instance className on root', () => {
    const { container } = wrap(<Button className="my-class">X</Button>);
    expect(container.querySelector('button')?.className).toContain('my-class');
  });
});

describe('defineComponent — withProps', () => {
  it('Component.withProps returns a component with presets', () => {
    const LoadingButton = Button.withProps({ loading: true });
    const { container } = wrap(<LoadingButton>X</LoadingButton>);
    expect(container.querySelector('button')).toBeInTheDocument();
  });

  it('instance props override withProps presets', () => {
    const LoadingButton = Button.withProps({ loading: true });
    // @ts-expect-error — verifying override at runtime
    const { container } = wrap(<LoadingButton loading={false}>X</LoadingButton>);
    expect(container.querySelector('button')).toBeInTheDocument();
  });
});

describe('defineComponent — extend (theme defaults)', () => {
  it('theme component defaultProps apply', () => {
    const themeWithDefaults = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: { defaultProps: { fullWidth: true } as Partial<ButtonOwnProps> },
      },
    });

    const { container } = render(
      <SoribashiProvider theme={themeWithDefaults}>
        <Button>X</Button>
      </SoribashiProvider>
    );
    expect(container.querySelector('button')).toBeInTheDocument();
  });

  it('theme component classNames are applied to root', () => {
    const themed = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: { classNames: { root: 'theme-extra' } },
      },
    });

    const { container } = render(
      <SoribashiProvider theme={themed}>
        <Button>X</Button>
      </SoribashiProvider>
    );
    expect(container.querySelector('button')?.className).toContain('theme-extra');
  });

  it('Component.classes is exposed', () => {
    expect(Button.classes).toBeDefined();
    expect(Button.classes?.root).toBe('sb-Button-root');
  });

  it('Component.displayName matches name', () => {
    expect(Button.displayName).toBe('Button');
  });
});
```

- [ ] **Step 2: Implement defineComponent**

Create `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/define-component.tsx`:

```tsx
import { forwardRef, type Ref } from 'react';
import type { ResolvedTheme } from '@soribashi/theme';
import { useProps } from './hooks/use-props.ts';
import { useStyles } from './hooks/use-styles.ts';
import { autoVars } from './auto-vars.ts';
import { makeWithProps } from './with-props.ts';
import type { FactoryPayload } from './types/factory-payload.ts';
import type { StylesApiProps } from './types/props.ts';
import type { GetStylesFn } from './types/render-context.ts';

const identity = <T,>(value: T): T => value;

export interface DefineComponentConfig<TOwnProps, TSelectors extends readonly string[], TVariants extends readonly string[]> {
  /** Component name; matches theme.components key */
  name: string;
  /** Default root element (informational; defineComponent does not enforce — render does) */
  element?: keyof JSX.IntrinsicElements;
  /** Selector union for the Styles API (e.g. ['root', 'label']) */
  selectors: TSelectors;
  /** Optional variant union for intent-driven CSS vars */
  variants?: TVariants;
  /** Built-in classes keyed by selector (CSS module or static class names) */
  classes?: Partial<Record<TSelectors[number], string>>;
  /** Component-level default values for props */
  defaults?: Partial<TOwnProps>;
  /** Custom vars resolver — overrides automatic intent-based vars */
  vars?: (
    theme: ResolvedTheme,
    props: TOwnProps & { variant?: TVariants[number]; intent?: string }
  ) => Partial<Record<TSelectors[number], Record<string, string>>>;
  /** The render function; receives resolved props + getStyles */
  render: (ctx: {
    props: TOwnProps & StylesApiProps<any> & { variant?: TVariants[number]; intent?: string };
    getStyles: GetStylesFn<{ props: TOwnProps; stylesNames: TSelectors[number] } & FactoryPayload>;
    ref: Ref<HTMLElement>;
  }) => React.ReactNode;
}

/**
 * The daily-use component authoring API.
 *
 * Internally:
 *   1. Wraps the render in forwardRef
 *   2. Calls useProps with the component name and config.defaults
 *   3. Calls useStyles with classes + (auto or custom) vars resolver
 *   4. Provides getStyles to render
 *   5. Attaches static methods: extend, withProps, classes, displayName
 *
 * Reference: this is the soribashi simplification of Mantine's per-component
 * factory + manual useProps/useStyles wiring. See PLan 2 commentary for the
 * Mantine equivalent.
 */
export function defineComponent<
  TOwnProps extends Record<string, unknown> = Record<string, never>,
  TSelectors extends readonly string[] = readonly string[],
  TVariants extends readonly string[] = readonly string[]
>(config: DefineComponentConfig<TOwnProps, TSelectors, TVariants>) {
  const hasVariants = (config.variants?.length ?? 0) > 0;

  const Component = forwardRef<HTMLElement, any>((rawProps, ref) => {
    const merged = useProps<TOwnProps & StylesApiProps<any>>(
      config.name,
      (config.defaults ?? null) as Partial<TOwnProps & StylesApiProps<any>> | null,
      rawProps as TOwnProps & StylesApiProps<any>
    );

    // Build varsResolver: prefer user-provided; otherwise auto-derive from intent
    const varsResolver = config.vars
      ? (theme: ResolvedTheme, props: any) => config.vars!(theme, props)
      : (theme: ResolvedTheme, props: any) =>
          autoVars(theme, config.name, props, hasVariants) as any;

    const getStyles = useStyles<{ props: TOwnProps; stylesNames: TSelectors[number] } & FactoryPayload>({
      name: config.name,
      classes: config.classes as any,
      className: (merged as any).className,
      style: (merged as any).style,
      classNames: (merged as any).classNames,
      styles: (merged as any).styles,
      attributes: (merged as any).attributes,
      unstyled: (merged as any).unstyled,
      props: merged as any,
      varsResolver: varsResolver as any,
    });

    return config.render({
      props: merged as any,
      getStyles: getStyles as any,
      ref,
    }) as React.ReactElement;
  });

  Component.displayName = config.name;
  (Component as any).classes = config.classes;
  (Component as any).extend = identity;
  (Component as any).withProps = makeWithProps(Component as any);

  return Component as unknown as React.ForwardRefExoticComponent<
    TOwnProps & StylesApiProps<any> & React.RefAttributes<HTMLElement>
  > & {
    extend: (cfg: any) => any;
    withProps: (presets: Partial<TOwnProps>) => React.ComponentType<TOwnProps>;
    classes?: Partial<Record<TSelectors[number], string>>;
    displayName?: string;
  };
}
```

- [ ] **Step 3: Run test (PASS)**

```bash
bun test test/define-component.test.tsx
```

- [ ] **Step 4: Commit**

```bash
git add packages/factory/src/define-component.tsx packages/factory/test/define-component.test.tsx
git commit -m "feat(factory): add defineComponent daily-use API with auto-vars and theme integration"
```

---

## Task 11: defineComponent Intent Integration Test

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/factory/test/define-component.intent.test.tsx`

Validates that a component declaring `variants` and receiving `intent` + `variant` props gets the expected CSS variables on its root via the auto-vars path.

- [ ] **Step 1: Write the test**

```tsx
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
import { SoribashiProvider } from '../src/provider/provider.tsx';
import { defineComponent } from '../src/define-component.tsx';

interface ButtonOwnProps {
  intent?: 'primary' | 'danger';
  variant?: 'filled' | 'outline';
}

const Button = defineComponent<ButtonOwnProps>({
  name: 'Button',
  selectors: ['root'] as const,
  variants: ['filled', 'outline'] as const,
  classes: { root: 'sb-Button-root' },
  defaults: { intent: 'primary', variant: 'filled' },
  render: ({ props, getStyles }) => <button {...getStyles('root')}>{props.children as any}</button>,
});

const theme = createTheme({
  tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
});

describe('defineComponent — intent → CSS vars on root', () => {
  it('produces --button-bg, --button-color, --button-border on root style', () => {
    const { container } = render(
      <SoribashiProvider theme={theme}>
        <Button intent="primary" variant="filled">X</Button>
      </SoribashiProvider>
    );
    const btn = container.querySelector('button') as HTMLElement;
    const style = btn.style;
    expect(style.getPropertyValue('--button-bg')).toBe('var(--color-primary-500)');
    expect(style.getPropertyValue('--button-color')).toBe('var(--color-primary-foreground)');
    expect(style.getPropertyValue('--button-border')).toBe('transparent');
  });

  it('outline variant produces transparent bg and intent-700 color', () => {
    const { container } = render(
      <SoribashiProvider theme={theme}>
        <Button intent="danger" variant="outline">X</Button>
      </SoribashiProvider>
    );
    const btn = container.querySelector('button') as HTMLElement;
    const style = btn.style;
    expect(style.getPropertyValue('--button-bg')).toBe('transparent');
    expect(style.getPropertyValue('--button-color')).toBe('var(--color-danger-700)');
    expect(style.getPropertyValue('--button-border')).toBe('var(--color-danger-500)');
  });

  it('does not produce vars when component has no variants declared', () => {
    interface PaperProps {
      shadow?: string;
    }
    const Paper = defineComponent<PaperProps>({
      name: 'Paper',
      selectors: ['root'] as const,
      classes: { root: 'sb-Paper-root' },
      defaults: { shadow: 'sm' },
      render: ({ props, getStyles }) => <div {...getStyles('root')}>{props.children as any}</div>,
    });

    const { container } = render(
      <SoribashiProvider theme={theme}>
        <Paper>X</Paper>
      </SoribashiProvider>
    );
    const div = container.querySelector('div') as HTMLElement;
    expect(div.style.getPropertyValue('--paper-bg')).toBe('');
  });

  it('explicit vars resolver in defineComponent overrides auto-vars', () => {
    interface BadgeProps {
      intent?: 'primary' | 'danger';
      variant?: 'filled';
    }
    const Badge = defineComponent<BadgeProps>({
      name: 'Badge',
      selectors: ['root'] as const,
      variants: ['filled'] as const,
      classes: { root: 'sb-Badge-root' },
      defaults: { intent: 'primary', variant: 'filled' },
      vars: (_theme, _props) => ({
        root: { '--badge-bg': 'magenta' },
      }),
      render: ({ getStyles }) => <span {...getStyles('root')}>X</span>,
    });

    const { container } = render(
      <SoribashiProvider theme={theme}>
        <Badge>X</Badge>
      </SoribashiProvider>
    );
    const span = container.querySelector('span') as HTMLElement;
    expect(span.style.getPropertyValue('--badge-bg')).toBe('magenta');
  });
});
```

- [ ] **Step 2: Run test (PASS — should already pass given Task 10's implementation)**

```bash
bun test test/define-component.intent.test.tsx
```

- [ ] **Step 3: Commit**

```bash
git add packages/factory/test/define-component.intent.test.tsx
git commit -m "test(factory): integration test for defineComponent intent → auto CSS vars"
```

---

## Task 12: Public API Surface

**Files:**
- Modify: `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/index.ts`

- [ ] **Step 1: Write the index**

Replace `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/index.ts`:

```ts
// @soribashi/factory — public API

// Daily-use authoring API
export { defineComponent } from './define-component.tsx';

// Provider
export { SoribashiProvider } from './provider/provider.tsx';
export { useTheme } from './provider/use-theme.ts';
export type { SoribashiProviderProps } from './provider/provider.tsx';

// Lower-level escape hatches
export { factory } from './factory.ts';
export { useProps } from './hooks/use-props.ts';
export { useStyles } from './hooks/use-styles.ts';
export { createVarsResolver } from './create-vars-resolver.ts';

// Utilities
export { cn } from './cn.ts';
export type { ClassValue } from './cn.ts';

// Types
export type {
  FactoryPayload,
  FactoryProps,
  FactoryStylesNames,
  FactoryVars,
  StylesApiProps,
  ClassNames,
  Styles,
  Vars,
  Attributes,
  RenderContext,
  GetStylesFn,
  GetStylesResult,
  GetStylesOptions,
} from './types/index.ts';

export type { FactoryComponent } from './factory.ts';
export type { DefineComponentConfig } from './define-component.tsx';
export type { UseStylesConfig } from './hooks/use-styles.ts';
```

- [ ] **Step 2: Add public API smoke test**

Create `/Users/matt/Documents/GitHub/soribashi/packages/factory/test/public-api.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import * as factory from '../src/index.ts';

describe('@soribashi/factory public API', () => {
  it('exports daily-use API', () => {
    expect(typeof factory.defineComponent).toBe('function');
  });

  it('exports provider and theme hook', () => {
    expect(typeof factory.SoribashiProvider).toBe('function');
    expect(typeof factory.useTheme).toBe('function');
  });

  it('exports escape hatches', () => {
    expect(typeof factory.factory).toBe('function');
    expect(typeof factory.useProps).toBe('function');
    expect(typeof factory.useStyles).toBe('function');
    expect(typeof factory.createVarsResolver).toBe('function');
  });

  it('exports cn utility', () => {
    expect(typeof factory.cn).toBe('function');
    expect(factory.cn('a', 'b')).toBe('a b');
  });
});
```

- [ ] **Step 3: Run all tests**

```bash
cd /Users/matt/Documents/GitHub/soribashi/packages/factory
bun test
```

Expected: All tests pass.

- [ ] **Step 4: Run typecheck**

```bash
cd /Users/matt/Documents/GitHub/soribashi
bun run typecheck
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add packages/factory/src/index.ts packages/factory/test/public-api.test.tsx
git commit -m "feat(factory): finalize @soribashi/factory public API"
```

---

## Task 13: Final Smoke Test

- [ ] **Step 1: Run all tests from root**

```bash
cd /Users/matt/Documents/GitHub/soribashi
bun test
```

Expected: All theme + codegen + factory tests pass.

- [ ] **Step 2: Final commit**

```bash
git add -A
git commit --allow-empty -m "chore: Plan 2 (factory) complete — defineComponent + escape hatches working"
```

---

## Acceptance Criteria

Plan 2 is complete when:

1. `defineComponent({ name, selectors, classes, defaults, render })` produces a working component.
2. `Component.withProps({ ... })` returns a preset component; instance props override presets.
3. `theme.components.X.extend({ defaultProps, classNames, styles, vars, attributes })` is honored at runtime.
4. A component declaring `variants` automatically gets `--{name}-bg`, `--{name}-color`, `--{name}-border` (and hover/active when provided) on its root selector via the theme's `intentResolver`.
5. `cn()` correctly merges Tailwind classes via `tailwind-merge`.
6. The escape hatches (`factory`, `useProps`, `useStyles`, `createVarsResolver`) work and are exported.
7. All tests pass; typecheck passes.

## What's NOT in this plan (deferred)

- `defineGenericComponent` for type-parameterized components — Plan 3
- `definePolymorphicComponent` for `as`-prop-based polymorphism — Plan 3
- Layout blocks (Box, Stack, etc.) — Plan 4
- A real Button using soribashi from a consumer perspective — Plan 5
