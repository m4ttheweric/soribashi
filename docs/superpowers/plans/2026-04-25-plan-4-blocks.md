# Soribashi Plan 4 — `@soribashi/blocks` Layout Primitives

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the 14 layout primitives soribashi opinionates on, all authored using the framework from Plans 2 and 3. After this plan, a consumer can import `Box`, `Stack`, `Group`, `Grid`, `Container`, `Center`, `AspectRatio`, `Space`, `Paper`, `Text`, `Title`, etc., from `@soribashi/blocks` and lay out an app without writing raw flex utilities.

**Architecture:** Every block uses `defineComponent` or `definePolymorphicComponent` from `@soribashi/factory`. Theme-driven props (`gap`, `radius`, `surface`) resolve to CSS custom properties on a static structural class via `data-*` attributes. Static structural classes (e.g. `.sb-Stack-root`) are defined in plain CSS files — no CVA recipes for blocks (they're too generic for variant-based theming).

**Tech Stack:** Same as Plan 2 + Plan 3. Plain CSS for block structural styles.

**Reference:** Mantine layout components are the inspiration — `Box`, `Stack`, `Group`, `Grid`, `Container`, `Center`, `AspectRatio`, `Space`, `Paper`. Browse [`packages/@mantine/core/src/components/`](https://github.com/mantinedev/mantine/tree/master/packages/%40mantine/core/src/components) for any of them. Soribashi diverges in that gap/spacing values are theme tokens (e.g., `gap='md'` → `var(--spacing-md)`), not the Mantine `MantineSpacing` scale.

---

## Common Patterns

Every block follows this pattern. Read once; the per-block tasks reference back here.

### Standard component shape

```tsx
import { defineComponent } from '@soribashi/factory';
import classes from './Stack.module.css';

interface StackOwnProps {
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'none';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
}

export const Stack = defineComponent<StackOwnProps>({
  name: 'Stack',
  selectors: ['root'] as const,
  classes,
  defaults: { gap: 'md', align: 'stretch', justify: 'start' },
  render: ({ props, getStyles }) => (
    <div
      {...getStyles('root', { className: undefined })}
      data-gap={props.gap}
      data-align={props.align}
      data-justify={props.justify}
    >
      {props.children as React.ReactNode}
    </div>
  ),
});
```

### Standard CSS module

```css
.root {
  display: flex;
  flex-direction: column;
}

.root[data-gap='xs']  { gap: var(--spacing-xs); }
.root[data-gap='sm']  { gap: var(--spacing-sm); }
.root[data-gap='md']  { gap: var(--spacing-md); }
.root[data-gap='lg']  { gap: var(--spacing-lg); }
.root[data-gap='xl']  { gap: var(--spacing-xl); }
.root[data-gap='none'] { gap: 0; }

.root[data-align='start']    { align-items: flex-start; }
.root[data-align='center']   { align-items: center; }
.root[data-align='end']      { align-items: flex-end; }
.root[data-align='stretch']  { align-items: stretch; }

.root[data-justify='start']    { justify-content: flex-start; }
.root[data-justify='center']   { justify-content: center; }
.root[data-justify='end']      { justify-content: flex-end; }
.root[data-justify='between']  { justify-content: space-between; }
.root[data-justify='around']   { justify-content: space-around; }
```

### Standard test shape

```tsx
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
import { SoribashiProvider } from '@soribashi/factory';
import { Stack } from '../src/Stack/Stack.tsx';

const theme = createTheme({
  tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
});

const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);

describe('Stack', () => {
  it('renders a div with structural class and default data-attrs', () => {
    const { container } = wrap(<Stack>Hello</Stack>);
    const el = container.firstChild as HTMLElement;
    expect(el.tagName).toBe('DIV');
    expect(el.className).toContain('sb-Stack-root');
    expect(el.dataset.gap).toBe('md');
  });

  it('applies gap prop to data-gap', () => {
    const { container } = wrap(<Stack gap="lg">X</Stack>);
    expect((container.firstChild as HTMLElement).dataset.gap).toBe('lg');
  });

  it('respects withProps', () => {
    const TightStack = Stack.withProps({ gap: 'xs' });
    const { container } = wrap(<TightStack>X</TightStack>);
    expect((container.firstChild as HTMLElement).dataset.gap).toBe('xs');
  });
});
```

---

## Task 1: Create @soribashi/blocks Package Skeleton

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/blocks/package.json`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/blocks/tsconfig.json`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/blocks/vitest.config.ts`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/blocks/src/index.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@soribashi/blocks",
  "version": "0.0.0",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": { "types": "./src/index.ts", "default": "./src/index.ts" },
    "./style.css": "./src/style.css"
  },
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@soribashi/factory": "workspace:*",
    "@soribashi/theme": "workspace:*"
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
  "references": [
    { "path": "../theme" },
    { "path": "../factory" }
  ],
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

- [ ] **Step 4: Create test setup**

Create `/Users/matt/Documents/GitHub/soribashi/packages/blocks/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 5: Create src/index.ts**

```ts
// @soribashi/blocks — public exports added per-block.
export {};
```

- [ ] **Step 6: Update workspace configs**

Append to `/Users/matt/Documents/GitHub/soribashi/vitest.workspace.ts`:

```ts
export default [
  './packages/theme/vitest.config.ts',
  './packages/codegen/vitest.config.ts',
  './packages/factory/vitest.config.ts',
  './packages/blocks/vitest.config.ts',
];
```

Add reference to root `tsconfig.json`:

```json
{
  "files": [],
  "references": [
    { "path": "./packages/theme" },
    { "path": "./packages/codegen" },
    { "path": "./packages/factory" },
    { "path": "./packages/blocks" }
  ]
}
```

- [ ] **Step 7: Install and commit**

```bash
cd /Users/matt/Documents/GitHub/soribashi
bun install
git add packages/blocks/ vitest.workspace.ts tsconfig.json bun.lock
git commit -m "chore(blocks): create @soribashi/blocks package skeleton"
```

---

## Task 2: Box (Polymorphic Root Primitive)

`Box` is the polymorphic root used by other blocks when they need an `as` prop. It supports tokenized spacing (`p`, `px`, `py`, `m`, `mx`, `my`), semantic surface (`bg`), and radius.

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/blocks/src/Box/Box.tsx`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/blocks/src/Box/Box.module.css`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/blocks/test/Box.test.tsx`

- [ ] **Step 1: Write the test**

Create `/Users/matt/Documents/GitHub/soribashi/packages/blocks/test/Box.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
import { SoribashiProvider } from '@soribashi/factory';
import { Box } from '../src/Box/Box.tsx';

const theme = createTheme({
  tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
});
const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);

describe('Box', () => {
  it('renders a div by default', () => {
    const { container } = wrap(<Box>X</Box>);
    expect(container.firstChild?.nodeName).toBe('DIV');
  });

  it('respects as prop', () => {
    const { container } = wrap(<Box as="section">X</Box>);
    expect(container.firstChild?.nodeName).toBe('SECTION');
  });

  it('forwards arbitrary HTML attributes', () => {
    const { container } = wrap(<Box id="test" data-foo="bar">X</Box>);
    const el = container.firstChild as HTMLElement;
    expect(el.id).toBe('test');
    expect(el.getAttribute('data-foo')).toBe('bar');
  });

  it('applies p prop to data-p', () => {
    const { container } = wrap(<Box p="md">X</Box>);
    expect((container.firstChild as HTMLElement).dataset.p).toBe('md');
  });

  it('applies px and py independently', () => {
    const { container } = wrap(<Box px="lg" py="sm">X</Box>);
    const el = container.firstChild as HTMLElement;
    expect(el.dataset.px).toBe('lg');
    expect(el.dataset.py).toBe('sm');
  });

  it('applies radius prop', () => {
    const { container } = wrap(<Box radius="md">X</Box>);
    expect((container.firstChild as HTMLElement).dataset.radius).toBe('md');
  });

  it('applies bg surface prop', () => {
    const { container } = wrap(<Box bg="raised">X</Box>);
    expect((container.firstChild as HTMLElement).dataset.bg).toBe('raised');
  });
});
```

- [ ] **Step 2: Implement Box.tsx**

```tsx
import { definePolymorphicComponent } from '@soribashi/factory';
import classes from './Box.module.css';

type SpacingToken = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
type RadiusToken = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
type SurfaceToken = 'canvas' | 'default' | 'raised' | 'sunken' | 'overlay';

export interface BoxOwnProps {
  p?: SpacingToken;
  px?: SpacingToken;
  py?: SpacingToken;
  pt?: SpacingToken;
  pb?: SpacingToken;
  pl?: SpacingToken;
  pr?: SpacingToken;
  m?: SpacingToken;
  mx?: SpacingToken;
  my?: SpacingToken;
  mt?: SpacingToken;
  mb?: SpacingToken;
  ml?: SpacingToken;
  mr?: SpacingToken;
  radius?: RadiusToken;
  bg?: SurfaceToken;
}

export const Box = definePolymorphicComponent<BoxOwnProps, 'div'>({
  name: 'Box',
  defaultElement: 'div',
  selectors: ['root'] as const,
  classes,
  render: ({ Element, props, getStyles }) => {
    const { p, px, py, pt, pb, pl, pr, m, mx, my, mt, mb, ml, mr, radius, bg, children, ...rest } =
      props as any;
    return (
      <Element
        {...getStyles('root')}
        {...rest}
        data-p={p}
        data-px={px}
        data-py={py}
        data-pt={pt}
        data-pb={pb}
        data-pl={pl}
        data-pr={pr}
        data-m={m}
        data-mx={mx}
        data-my={my}
        data-mt={mt}
        data-mb={mb}
        data-ml={ml}
        data-mr={mr}
        data-radius={radius}
        data-bg={bg}
      >
        {children}
      </Element>
    );
  },
});
```

- [ ] **Step 3: Implement Box.module.css**

```css
.root {
  box-sizing: border-box;
}

/* Padding */
.root[data-p='none'] { padding: 0; }
.root[data-p='xs']   { padding: var(--spacing-xs); }
.root[data-p='sm']   { padding: var(--spacing-sm); }
.root[data-p='md']   { padding: var(--spacing-md); }
.root[data-p='lg']   { padding: var(--spacing-lg); }
.root[data-p='xl']   { padding: var(--spacing-xl); }
.root[data-p='2xl']  { padding: var(--spacing-2xl); }
.root[data-p='3xl']  { padding: var(--spacing-3xl); }

.root[data-px='none'] { padding-left: 0; padding-right: 0; }
.root[data-px='xs']   { padding-left: var(--spacing-xs); padding-right: var(--spacing-xs); }
.root[data-px='sm']   { padding-left: var(--spacing-sm); padding-right: var(--spacing-sm); }
.root[data-px='md']   { padding-left: var(--spacing-md); padding-right: var(--spacing-md); }
.root[data-px='lg']   { padding-left: var(--spacing-lg); padding-right: var(--spacing-lg); }
.root[data-px='xl']   { padding-left: var(--spacing-xl); padding-right: var(--spacing-xl); }
.root[data-px='2xl']  { padding-left: var(--spacing-2xl); padding-right: var(--spacing-2xl); }

.root[data-py='none'] { padding-top: 0; padding-bottom: 0; }
.root[data-py='xs']   { padding-top: var(--spacing-xs); padding-bottom: var(--spacing-xs); }
.root[data-py='sm']   { padding-top: var(--spacing-sm); padding-bottom: var(--spacing-sm); }
.root[data-py='md']   { padding-top: var(--spacing-md); padding-bottom: var(--spacing-md); }
.root[data-py='lg']   { padding-top: var(--spacing-lg); padding-bottom: var(--spacing-lg); }
.root[data-py='xl']   { padding-top: var(--spacing-xl); padding-bottom: var(--spacing-xl); }
.root[data-py='2xl']  { padding-top: var(--spacing-2xl); padding-bottom: var(--spacing-2xl); }

.root[data-pt='xs'] { padding-top: var(--spacing-xs); }
.root[data-pt='sm'] { padding-top: var(--spacing-sm); }
.root[data-pt='md'] { padding-top: var(--spacing-md); }
.root[data-pt='lg'] { padding-top: var(--spacing-lg); }
.root[data-pt='xl'] { padding-top: var(--spacing-xl); }
.root[data-pb='xs'] { padding-bottom: var(--spacing-xs); }
.root[data-pb='sm'] { padding-bottom: var(--spacing-sm); }
.root[data-pb='md'] { padding-bottom: var(--spacing-md); }
.root[data-pb='lg'] { padding-bottom: var(--spacing-lg); }
.root[data-pb='xl'] { padding-bottom: var(--spacing-xl); }
.root[data-pl='xs'] { padding-left: var(--spacing-xs); }
.root[data-pl='sm'] { padding-left: var(--spacing-sm); }
.root[data-pl='md'] { padding-left: var(--spacing-md); }
.root[data-pl='lg'] { padding-left: var(--spacing-lg); }
.root[data-pl='xl'] { padding-left: var(--spacing-xl); }
.root[data-pr='xs'] { padding-right: var(--spacing-xs); }
.root[data-pr='sm'] { padding-right: var(--spacing-sm); }
.root[data-pr='md'] { padding-right: var(--spacing-md); }
.root[data-pr='lg'] { padding-right: var(--spacing-lg); }
.root[data-pr='xl'] { padding-right: var(--spacing-xl); }

/* Margin (analogous; full set) */
.root[data-m='none'] { margin: 0; }
.root[data-m='xs']   { margin: var(--spacing-xs); }
.root[data-m='sm']   { margin: var(--spacing-sm); }
.root[data-m='md']   { margin: var(--spacing-md); }
.root[data-m='lg']   { margin: var(--spacing-lg); }
.root[data-m='xl']   { margin: var(--spacing-xl); }

.root[data-mx='auto'] { margin-left: auto; margin-right: auto; }
.root[data-mx='xs']   { margin-left: var(--spacing-xs); margin-right: var(--spacing-xs); }
.root[data-mx='sm']   { margin-left: var(--spacing-sm); margin-right: var(--spacing-sm); }
.root[data-mx='md']   { margin-left: var(--spacing-md); margin-right: var(--spacing-md); }
.root[data-mx='lg']   { margin-left: var(--spacing-lg); margin-right: var(--spacing-lg); }
.root[data-mx='xl']   { margin-left: var(--spacing-xl); margin-right: var(--spacing-xl); }

.root[data-my='xs'] { margin-top: var(--spacing-xs); margin-bottom: var(--spacing-xs); }
.root[data-my='sm'] { margin-top: var(--spacing-sm); margin-bottom: var(--spacing-sm); }
.root[data-my='md'] { margin-top: var(--spacing-md); margin-bottom: var(--spacing-md); }
.root[data-my='lg'] { margin-top: var(--spacing-lg); margin-bottom: var(--spacing-lg); }
.root[data-my='xl'] { margin-top: var(--spacing-xl); margin-bottom: var(--spacing-xl); }

/* Radius */
.root[data-radius='none'] { border-radius: 0; }
.root[data-radius='sm']   { border-radius: var(--radius-sm); }
.root[data-radius='md']   { border-radius: var(--radius-md); }
.root[data-radius='lg']   { border-radius: var(--radius-lg); }
.root[data-radius='xl']   { border-radius: var(--radius-xl); }
.root[data-radius='2xl']  { border-radius: var(--radius-2xl); }
.root[data-radius='full'] { border-radius: var(--radius-full); }

/* Background surface */
.root[data-bg='canvas']  { background-color: var(--surface-canvas); }
.root[data-bg='default'] { background-color: var(--surface-default); }
.root[data-bg='raised']  { background-color: var(--surface-raised); }
.root[data-bg='sunken']  { background-color: var(--surface-sunken); }
.root[data-bg='overlay'] { background-color: var(--surface-overlay); }
```

- [ ] **Step 4: Run test (PASS)**

```bash
cd /Users/matt/Documents/GitHub/soribashi/packages/blocks
bun test test/Box.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add packages/blocks/src/Box/ packages/blocks/test/Box.test.tsx
git commit -m "feat(blocks): add Box polymorphic root with spacing, radius, surface props"
```

---

## Task 3: Stack (Vertical Flex)

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/blocks/src/Stack/Stack.tsx`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/blocks/src/Stack/Stack.module.css`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/blocks/test/Stack.test.tsx`

Use the standard pattern from "Common Patterns" above. Test mirrors the standard test shape.

- [ ] **Step 1: Write Stack.tsx**

```tsx
import { defineComponent } from '@soribashi/factory';
import classes from './Stack.module.css';

type GapToken = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type AlignToken = 'start' | 'center' | 'end' | 'stretch';
type JustifyToken = 'start' | 'center' | 'end' | 'between' | 'around';

export interface StackOwnProps {
  gap?: GapToken;
  align?: AlignToken;
  justify?: JustifyToken;
}

export const Stack = defineComponent<StackOwnProps>({
  name: 'Stack',
  selectors: ['root'] as const,
  classes,
  defaults: { gap: 'md', align: 'stretch', justify: 'start' },
  render: ({ props, getStyles }) => {
    const { gap, align, justify, children, ...rest } = props as any;
    return (
      <div
        {...getStyles('root')}
        {...rest}
        data-gap={gap}
        data-align={align}
        data-justify={justify}
      >
        {children}
      </div>
    );
  },
});
```

- [ ] **Step 2: Write Stack.module.css**

```css
.root {
  display: flex;
  flex-direction: column;
}
.root[data-gap='none'] { gap: 0; }
.root[data-gap='xs']   { gap: var(--spacing-xs); }
.root[data-gap='sm']   { gap: var(--spacing-sm); }
.root[data-gap='md']   { gap: var(--spacing-md); }
.root[data-gap='lg']   { gap: var(--spacing-lg); }
.root[data-gap='xl']   { gap: var(--spacing-xl); }

.root[data-align='start']    { align-items: flex-start; }
.root[data-align='center']   { align-items: center; }
.root[data-align='end']      { align-items: flex-end; }
.root[data-align='stretch']  { align-items: stretch; }

.root[data-justify='start']    { justify-content: flex-start; }
.root[data-justify='center']   { justify-content: center; }
.root[data-justify='end']      { justify-content: flex-end; }
.root[data-justify='between']  { justify-content: space-between; }
.root[data-justify='around']   { justify-content: space-around; }
```

- [ ] **Step 3: Write test**

```tsx
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
import { SoribashiProvider } from '@soribashi/factory';
import { Stack } from '../src/Stack/Stack.tsx';

const theme = createTheme({ tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} } });
const wrap = (ui: React.ReactNode) => render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);

describe('Stack', () => {
  it('renders div with default md gap', () => {
    const { container } = wrap(<Stack>X</Stack>);
    expect((container.firstChild as HTMLElement).dataset.gap).toBe('md');
  });

  it('applies gap prop', () => {
    const { container } = wrap(<Stack gap="lg">X</Stack>);
    expect((container.firstChild as HTMLElement).dataset.gap).toBe('lg');
  });

  it('applies align and justify', () => {
    const { container } = wrap(<Stack align="center" justify="between">X</Stack>);
    const el = container.firstChild as HTMLElement;
    expect(el.dataset.align).toBe('center');
    expect(el.dataset.justify).toBe('between');
  });
});
```

- [ ] **Step 4: Run, commit**

```bash
bun test test/Stack.test.tsx
git add packages/blocks/src/Stack/ packages/blocks/test/Stack.test.tsx
git commit -m "feat(blocks): add Stack vertical flex primitive"
```

---

## Task 4: Group (Horizontal Flex)

Same pattern as Stack but `flex-direction: row` and adds `wrap` prop.

- [ ] **Step 1: Write Group.tsx, Group.module.css, Group.test.tsx following the pattern**

`Group.tsx`:

```tsx
import { defineComponent } from '@soribashi/factory';
import classes from './Group.module.css';

export interface GroupOwnProps {
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  wrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
}

export const Group = defineComponent<GroupOwnProps>({
  name: 'Group',
  selectors: ['root'] as const,
  classes,
  defaults: { gap: 'md', align: 'center', justify: 'start', wrap: 'wrap' },
  render: ({ props, getStyles }) => {
    const { gap, align, justify, wrap, children, ...rest } = props as any;
    return (
      <div
        {...getStyles('root')}
        {...rest}
        data-gap={gap}
        data-align={align}
        data-justify={justify}
        data-wrap={wrap}
      >
        {children}
      </div>
    );
  },
});
```

`Group.module.css`:

```css
.root {
  display: flex;
  flex-direction: row;
}
.root[data-gap='none'] { gap: 0; }
.root[data-gap='xs']   { gap: var(--spacing-xs); }
.root[data-gap='sm']   { gap: var(--spacing-sm); }
.root[data-gap='md']   { gap: var(--spacing-md); }
.root[data-gap='lg']   { gap: var(--spacing-lg); }
.root[data-gap='xl']   { gap: var(--spacing-xl); }

.root[data-align='start']    { align-items: flex-start; }
.root[data-align='center']   { align-items: center; }
.root[data-align='end']      { align-items: flex-end; }
.root[data-align='stretch']  { align-items: stretch; }
.root[data-align='baseline'] { align-items: baseline; }

.root[data-justify='start']    { justify-content: flex-start; }
.root[data-justify='center']   { justify-content: center; }
.root[data-justify='end']      { justify-content: flex-end; }
.root[data-justify='between']  { justify-content: space-between; }
.root[data-justify='around']   { justify-content: space-around; }

.root[data-wrap='wrap']         { flex-wrap: wrap; }
.root[data-wrap='nowrap']       { flex-wrap: nowrap; }
.root[data-wrap='wrap-reverse'] { flex-wrap: wrap-reverse; }
```

- [ ] **Step 2: Test, commit**

Test parallel to Stack. Commit:

```bash
git add packages/blocks/src/Group/ packages/blocks/test/Group.test.tsx
git commit -m "feat(blocks): add Group horizontal flex primitive"
```

---

## Task 5: Flex (Generic Flex)

A more flexible version of Stack/Group that exposes `direction`.

- [ ] **Step 1: Write Flex.tsx**

```tsx
import { defineComponent } from '@soribashi/factory';
import classes from './Flex.module.css';

export interface FlexOwnProps {
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  wrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
}

export const Flex = defineComponent<FlexOwnProps>({
  name: 'Flex',
  selectors: ['root'] as const,
  classes,
  defaults: { direction: 'row', gap: 'md', wrap: 'nowrap' },
  render: ({ props, getStyles }) => {
    const { direction, gap, align, justify, wrap, children, ...rest } = props as any;
    return (
      <div
        {...getStyles('root')}
        {...rest}
        data-direction={direction}
        data-gap={gap}
        data-align={align}
        data-justify={justify}
        data-wrap={wrap}
      >
        {children}
      </div>
    );
  },
});
```

- [ ] **Step 2: Write Flex.module.css** (parallel to Stack/Group with direction added)

```css
.root { display: flex; }
.root[data-direction='row']            { flex-direction: row; }
.root[data-direction='column']         { flex-direction: column; }
.root[data-direction='row-reverse']    { flex-direction: row-reverse; }
.root[data-direction='column-reverse'] { flex-direction: column-reverse; }

/* gap, align, justify, wrap copied from Stack/Group above */
```

(Copy the gap/align/justify/wrap rules from `Group.module.css`.)

- [ ] **Step 3: Test, commit**

```bash
git add packages/blocks/src/Flex/ packages/blocks/test/Flex.test.tsx
git commit -m "feat(blocks): add Flex generic flex primitive"
```

---

## Task 6: Grid + Grid.Col

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/blocks/src/Grid/Grid.tsx`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/blocks/src/Grid/Grid.module.css`

- [ ] **Step 1: Write Grid.tsx with compound Col**

```tsx
import { defineComponent } from '@soribashi/factory';
import classes from './Grid.module.css';

export interface GridOwnProps {
  columns?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

interface ColOwnProps {
  span?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  start?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
}

const GridRoot = defineComponent<GridOwnProps>({
  name: 'Grid',
  selectors: ['root'] as const,
  classes: { root: classes.root },
  defaults: { columns: 12, gap: 'md' },
  render: ({ props, getStyles }) => {
    const { columns, gap, children, ...rest } = props as any;
    return (
      <div {...getStyles('root')} {...rest} data-columns={columns} data-gap={gap}>
        {children}
      </div>
    );
  },
});

const GridCol = defineComponent<ColOwnProps>({
  name: 'GridCol',
  selectors: ['root'] as const,
  classes: { root: classes.col },
  defaults: { span: 1 },
  render: ({ props, getStyles }) => {
    const { span, start, children, ...rest } = props as any;
    return (
      <div {...getStyles('root')} {...rest} data-span={span} data-start={start}>
        {children}
      </div>
    );
  },
});

export const Grid = Object.assign(GridRoot, { Col: GridCol }) as typeof GridRoot & {
  Col: typeof GridCol;
};
```

- [ ] **Step 2: Write Grid.module.css**

```css
.root {
  display: grid;
}
.root[data-columns='1']  { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.root[data-columns='2']  { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.root[data-columns='3']  { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.root[data-columns='4']  { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.root[data-columns='6']  { grid-template-columns: repeat(6, minmax(0, 1fr)); }
.root[data-columns='12'] { grid-template-columns: repeat(12, minmax(0, 1fr)); }

.root[data-gap='none'] { gap: 0; }
.root[data-gap='xs']   { gap: var(--spacing-xs); }
.root[data-gap='sm']   { gap: var(--spacing-sm); }
.root[data-gap='md']   { gap: var(--spacing-md); }
.root[data-gap='lg']   { gap: var(--spacing-lg); }
.root[data-gap='xl']   { gap: var(--spacing-xl); }

.col[data-span='1']  { grid-column: span 1; }
.col[data-span='2']  { grid-column: span 2; }
.col[data-span='3']  { grid-column: span 3; }
.col[data-span='4']  { grid-column: span 4; }
.col[data-span='5']  { grid-column: span 5; }
.col[data-span='6']  { grid-column: span 6; }
.col[data-span='7']  { grid-column: span 7; }
.col[data-span='8']  { grid-column: span 8; }
.col[data-span='9']  { grid-column: span 9; }
.col[data-span='10'] { grid-column: span 10; }
.col[data-span='11'] { grid-column: span 11; }
.col[data-span='12'] { grid-column: span 12; }
```

- [ ] **Step 3: Test, commit**

Write `test/Grid.test.tsx` validating both `<Grid>` and `<Grid.Col>`. Commit:

```bash
git add packages/blocks/src/Grid/ packages/blocks/test/Grid.test.tsx
git commit -m "feat(blocks): add Grid with Grid.Col compound component"
```

---

## Task 7: SimpleGrid

Equal-width columns with responsive `cols` prop.

- [ ] **Step 1: Write SimpleGrid.tsx**

```tsx
import { defineComponent } from '@soribashi/factory';
import classes from './SimpleGrid.module.css';

export interface SimpleGridOwnProps {
  cols?: 1 | 2 | 3 | 4 | 6;
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const SimpleGrid = defineComponent<SimpleGridOwnProps>({
  name: 'SimpleGrid',
  selectors: ['root'] as const,
  classes,
  defaults: { cols: 2, gap: 'md' },
  render: ({ props, getStyles }) => {
    const { cols, gap, children, ...rest } = props as any;
    return (
      <div {...getStyles('root')} {...rest} data-cols={cols} data-gap={gap}>
        {children}
      </div>
    );
  },
});
```

- [ ] **Step 2: Write SimpleGrid.module.css** (parallel to Grid)

```css
.root { display: grid; }
.root[data-cols='1']  { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.root[data-cols='2']  { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.root[data-cols='3']  { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.root[data-cols='4']  { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.root[data-cols='6']  { grid-template-columns: repeat(6, minmax(0, 1fr)); }

.root[data-gap='none'] { gap: 0; }
.root[data-gap='xs']   { gap: var(--spacing-xs); }
.root[data-gap='sm']   { gap: var(--spacing-sm); }
.root[data-gap='md']   { gap: var(--spacing-md); }
.root[data-gap='lg']   { gap: var(--spacing-lg); }
.root[data-gap='xl']   { gap: var(--spacing-xl); }
```

- [ ] **Step 3: Test, commit**

```bash
git add packages/blocks/src/SimpleGrid/ packages/blocks/test/SimpleGrid.test.tsx
git commit -m "feat(blocks): add SimpleGrid equal-width responsive grid"
```

---

## Task 8: Container

Width-constrained shell.

- [ ] **Step 1: Write Container.tsx**

```tsx
import { defineComponent } from '@soribashi/factory';
import classes from './Container.module.css';

export interface ContainerOwnProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'fluid';
  px?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const Container = defineComponent<ContainerOwnProps>({
  name: 'Container',
  selectors: ['root'] as const,
  classes,
  defaults: { size: 'lg', px: 'md' },
  render: ({ props, getStyles }) => {
    const { size, px, children, ...rest } = props as any;
    return (
      <div {...getStyles('root')} {...rest} data-size={size} data-px={px}>
        {children}
      </div>
    );
  },
});
```

- [ ] **Step 2: Write Container.module.css**

```css
.root {
  margin-left: auto;
  margin-right: auto;
  width: 100%;
}

.root[data-size='sm']    { max-width: 40rem; }
.root[data-size='md']    { max-width: 48rem; }
.root[data-size='lg']    { max-width: 64rem; }
.root[data-size='xl']    { max-width: 80rem; }
.root[data-size='2xl']   { max-width: 96rem; }
.root[data-size='3xl']   { max-width: 120rem; }
.root[data-size='fluid'] { max-width: none; }

.root[data-px='none'] { padding-left: 0; padding-right: 0; }
.root[data-px='xs']   { padding-left: var(--spacing-xs); padding-right: var(--spacing-xs); }
.root[data-px='sm']   { padding-left: var(--spacing-sm); padding-right: var(--spacing-sm); }
.root[data-px='md']   { padding-left: var(--spacing-md); padding-right: var(--spacing-md); }
.root[data-px='lg']   { padding-left: var(--spacing-lg); padding-right: var(--spacing-lg); }
.root[data-px='xl']   { padding-left: var(--spacing-xl); padding-right: var(--spacing-xl); }
```

- [ ] **Step 3: Test, commit**

```bash
git add packages/blocks/src/Container/ packages/blocks/test/Container.test.tsx
git commit -m "feat(blocks): add Container width-constrained shell"
```

---

## Task 9: Center

Quick centering wrapper.

- [ ] **Step 1: Write Center.tsx and Center.module.css**

`Center.tsx`:

```tsx
import { defineComponent } from '@soribashi/factory';
import classes from './Center.module.css';

export interface CenterOwnProps {
  inline?: boolean;
}

export const Center = defineComponent<CenterOwnProps>({
  name: 'Center',
  selectors: ['root'] as const,
  classes,
  defaults: { inline: false },
  render: ({ props, getStyles }) => {
    const { inline, children, ...rest } = props as any;
    return (
      <div {...getStyles('root')} {...rest} data-inline={inline}>
        {children}
      </div>
    );
  },
});
```

`Center.module.css`:

```css
.root {
  display: flex;
  align-items: center;
  justify-content: center;
}
.root[data-inline='true'] {
  display: inline-flex;
}
```

- [ ] **Step 2: Test, commit**

```bash
git add packages/blocks/src/Center/ packages/blocks/test/Center.test.tsx
git commit -m "feat(blocks): add Center centering primitive"
```

---

## Task 10: AspectRatio

Aspect-ratio shell.

- [ ] **Step 1: Write AspectRatio.tsx**

```tsx
import { defineComponent } from '@soribashi/factory';
import classes from './AspectRatio.module.css';

export interface AspectRatioOwnProps {
  ratio?: number;
}

export const AspectRatio = defineComponent<AspectRatioOwnProps>({
  name: 'AspectRatio',
  selectors: ['root'] as const,
  classes,
  defaults: { ratio: 16 / 9 },
  render: ({ props, getStyles }) => {
    const { ratio, children, ...rest } = props as any;
    return (
      <div
        {...getStyles('root')}
        {...rest}
        style={{ ...((rest as any).style ?? {}), aspectRatio: ratio }}
      >
        {children}
      </div>
    );
  },
});
```

- [ ] **Step 2: Write AspectRatio.module.css**

```css
.root {
  position: relative;
  width: 100%;
  overflow: hidden;
}
.root > * {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
```

- [ ] **Step 3: Test, commit**

```bash
git add packages/blocks/src/AspectRatio/ packages/blocks/test/AspectRatio.test.tsx
git commit -m "feat(blocks): add AspectRatio shell with ratio prop"
```

---

## Task 11: Space

Theme-driven spacer (no children).

- [ ] **Step 1: Write Space.tsx**

```tsx
import { defineComponent } from '@soribashi/factory';
import classes from './Space.module.css';

export interface SpaceOwnProps {
  h?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  w?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Space = defineComponent<SpaceOwnProps>({
  name: 'Space',
  selectors: ['root'] as const,
  classes,
  render: ({ props, getStyles }) => {
    const { h, w, ...rest } = props as any;
    return <div {...getStyles('root')} {...rest} data-h={h} data-w={w} />;
  },
});
```

- [ ] **Step 2: Write Space.module.css**

```css
.root[data-h='xs']  { height: var(--spacing-xs); }
.root[data-h='sm']  { height: var(--spacing-sm); }
.root[data-h='md']  { height: var(--spacing-md); }
.root[data-h='lg']  { height: var(--spacing-lg); }
.root[data-h='xl']  { height: var(--spacing-xl); }
.root[data-h='2xl'] { height: var(--spacing-2xl); }

.root[data-w='xs']  { width: var(--spacing-xs); }
.root[data-w='sm']  { width: var(--spacing-sm); }
.root[data-w='md']  { width: var(--spacing-md); }
.root[data-w='lg']  { width: var(--spacing-lg); }
.root[data-w='xl']  { width: var(--spacing-xl); }
.root[data-w='2xl'] { width: var(--spacing-2xl); }
```

- [ ] **Step 3: Test, commit**

```bash
git add packages/blocks/src/Space/ packages/blocks/test/Space.test.tsx
git commit -m "feat(blocks): add Space spacing primitive"
```

---

## Task 12: Paper (Semantic Surface)

A surfaced container with shadow + radius + border.

- [ ] **Step 1: Write Paper.tsx**

```tsx
import { defineComponent } from '@soribashi/factory';
import classes from './Paper.module.css';

export interface PaperOwnProps {
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  withBorder?: boolean;
  bg?: 'canvas' | 'default' | 'raised' | 'sunken';
  p?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const Paper = defineComponent<PaperOwnProps>({
  name: 'Paper',
  selectors: ['root'] as const,
  classes,
  defaults: { shadow: 'sm', radius: 'md', withBorder: false, bg: 'default', p: 'md' },
  render: ({ props, getStyles }) => {
    const { shadow, radius, withBorder, bg, p, children, ...rest } = props as any;
    return (
      <div
        {...getStyles('root')}
        {...rest}
        data-shadow={shadow}
        data-radius={radius}
        data-with-border={withBorder}
        data-bg={bg}
        data-p={p}
      >
        {children}
      </div>
    );
  },
});
```

- [ ] **Step 2: Write Paper.module.css**

```css
.root {
  box-sizing: border-box;
}

.root[data-shadow='none'] { box-shadow: none; }
.root[data-shadow='sm']   { box-shadow: var(--shadow-sm); }
.root[data-shadow='md']   { box-shadow: var(--shadow-md); }
.root[data-shadow='lg']   { box-shadow: var(--shadow-lg); }
.root[data-shadow='xl']   { box-shadow: var(--shadow-xl); }

.root[data-radius='none'] { border-radius: 0; }
.root[data-radius='sm']   { border-radius: var(--radius-sm); }
.root[data-radius='md']   { border-radius: var(--radius-md); }
.root[data-radius='lg']   { border-radius: var(--radius-lg); }
.root[data-radius='xl']   { border-radius: var(--radius-xl); }
.root[data-radius='2xl']  { border-radius: var(--radius-2xl); }

.root[data-with-border='true'] {
  border: 1px solid var(--border-default);
}

.root[data-bg='canvas']  { background: var(--surface-canvas); }
.root[data-bg='default'] { background: var(--surface-default); }
.root[data-bg='raised']  { background: var(--surface-raised); }
.root[data-bg='sunken']  { background: var(--surface-sunken); }

.root[data-p='none'] { padding: 0; }
.root[data-p='xs']   { padding: var(--spacing-xs); }
.root[data-p='sm']   { padding: var(--spacing-sm); }
.root[data-p='md']   { padding: var(--spacing-md); }
.root[data-p='lg']   { padding: var(--spacing-lg); }
.root[data-p='xl']   { padding: var(--spacing-xl); }
```

- [ ] **Step 3: Test, commit**

```bash
git add packages/blocks/src/Paper/ packages/blocks/test/Paper.test.tsx
git commit -m "feat(blocks): add Paper semantic surface with shadow/radius/border/bg"
```

---

## Task 13: Text (Polymorphic Typography)

- [ ] **Step 1: Write Text.tsx**

```tsx
import { definePolymorphicComponent } from '@soribashi/factory';
import classes from './Text.module.css';

export interface TextOwnProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'default' | 'muted' | 'disabled';
  align?: 'left' | 'center' | 'right' | 'justify';
  truncate?: boolean;
}

export const Text = definePolymorphicComponent<TextOwnProps, 'p'>({
  name: 'Text',
  defaultElement: 'p',
  selectors: ['root'] as const,
  classes,
  defaults: { size: 'md', weight: 'normal', color: 'default', truncate: false },
  render: ({ Element, props, getStyles }) => {
    const { size, weight, color, align, truncate, children, ...rest } = props as any;
    return (
      <Element
        {...getStyles('root')}
        {...rest}
        data-size={size}
        data-weight={weight}
        data-color={color}
        data-align={align}
        data-truncate={truncate}
      >
        {children}
      </Element>
    );
  },
});
```

- [ ] **Step 2: Write Text.module.css**

```css
.root {
  margin: 0;
  font-family: var(--font-family-sans);
  line-height: 1.5;
}

.root[data-size='xs']  { font-size: var(--font-size-xs); }
.root[data-size='sm']  { font-size: var(--font-size-sm); }
.root[data-size='md']  { font-size: var(--font-size-md); }
.root[data-size='lg']  { font-size: var(--font-size-lg); }
.root[data-size='xl']  { font-size: var(--font-size-xl); }
.root[data-size='2xl'] { font-size: var(--font-size-2xl); }
.root[data-size='3xl'] { font-size: var(--font-size-3xl); }

.root[data-weight='normal']    { font-weight: 400; }
.root[data-weight='medium']    { font-weight: 500; }
.root[data-weight='semibold']  { font-weight: 600; }
.root[data-weight='bold']      { font-weight: 700; }

.root[data-color='default']  { color: var(--text-default); }
.root[data-color='muted']    { color: var(--text-muted); }
.root[data-color='disabled'] { color: var(--text-disabled); }

.root[data-align='left']    { text-align: left; }
.root[data-align='center']  { text-align: center; }
.root[data-align='right']   { text-align: right; }
.root[data-align='justify'] { text-align: justify; }

.root[data-truncate='true'] {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

- [ ] **Step 3: Test (including as prop), commit**

```bash
git add packages/blocks/src/Text/ packages/blocks/test/Text.test.tsx
git commit -m "feat(blocks): add Text polymorphic typography primitive"
```

---

## Task 14: Title (Heading h1-h6)

- [ ] **Step 1: Write Title.tsx with proper level → element mapping**

```tsx
import { defineComponent } from '@soribashi/factory';
import classes from './Title.module.css';

export interface TitleOwnProps {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'default' | 'muted';
  align?: 'left' | 'center' | 'right';
}

export const Title = defineComponent<TitleOwnProps>({
  name: 'Title',
  selectors: ['root'] as const,
  classes,
  defaults: { level: 1, weight: 'bold', color: 'default' },
  render: ({ props, getStyles }) => {
    const { level, weight, color, align, children, ...rest } = props as any;
    const Tag = `h${level ?? 1}` as keyof JSX.IntrinsicElements;
    return (
      <Tag
        {...(getStyles('root') as any)}
        {...rest}
        data-level={level}
        data-weight={weight}
        data-color={color}
        data-align={align}
      >
        {children}
      </Tag>
    );
  },
});
```

- [ ] **Step 2: Write Title.module.css with concrete sizes per level**

```css
.root {
  margin: 0;
  font-family: var(--font-family-sans);
  line-height: 1.2;
}

.root[data-level='1'] { font-size: var(--font-size-3xl); line-height: 1.1; }
.root[data-level='2'] { font-size: var(--font-size-2xl); line-height: 1.2; }
.root[data-level='3'] { font-size: var(--font-size-xl);  line-height: 1.3; }
.root[data-level='4'] { font-size: var(--font-size-lg);  line-height: 1.4; }
.root[data-level='5'] { font-size: var(--font-size-md);  line-height: 1.5; }
.root[data-level='6'] { font-size: var(--font-size-sm);  line-height: 1.5; }

.root[data-weight='normal']   { font-weight: 400; }
.root[data-weight='medium']   { font-weight: 500; }
.root[data-weight='semibold'] { font-weight: 600; }
.root[data-weight='bold']     { font-weight: 700; }

.root[data-color='default'] { color: var(--text-default); }
.root[data-color='muted']   { color: var(--text-muted); }

.root[data-align='left']   { text-align: left; }
.root[data-align='center'] { text-align: center; }
.root[data-align='right']  { text-align: right; }
```

- [ ] **Step 3: Test (verify h1-h6 elements render correctly per level), commit**

```bash
git add packages/blocks/src/Title/ packages/blocks/test/Title.test.tsx
git commit -m "feat(blocks): add Title with proper h1-h6 semantic elements"
```

---

## Task 15: Public API and style.css Bundle

**Files:**
- Modify: `/Users/matt/Documents/GitHub/soribashi/packages/blocks/src/index.ts`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/blocks/src/style.css`

- [ ] **Step 1: Write src/index.ts**

```ts
// @soribashi/blocks — public exports

export { Box, type BoxOwnProps } from './Box/Box.tsx';
export { Stack, type StackOwnProps } from './Stack/Stack.tsx';
export { Group, type GroupOwnProps } from './Group/Group.tsx';
export { Flex, type FlexOwnProps } from './Flex/Flex.tsx';
export { Grid } from './Grid/Grid.tsx';
export { SimpleGrid, type SimpleGridOwnProps } from './SimpleGrid/SimpleGrid.tsx';
export { Container, type ContainerOwnProps } from './Container/Container.tsx';
export { Center, type CenterOwnProps } from './Center/Center.tsx';
export { AspectRatio, type AspectRatioOwnProps } from './AspectRatio/AspectRatio.tsx';
export { Space, type SpaceOwnProps } from './Space/Space.tsx';
export { Paper, type PaperOwnProps } from './Paper/Paper.tsx';
export { Text, type TextOwnProps } from './Text/Text.tsx';
export { Title, type TitleOwnProps } from './Title/Title.tsx';
```

- [ ] **Step 2: Create style.css that imports all module CSS**

```css
@import './Box/Box.module.css';
@import './Stack/Stack.module.css';
@import './Group/Group.module.css';
@import './Flex/Flex.module.css';
@import './Grid/Grid.module.css';
@import './SimpleGrid/SimpleGrid.module.css';
@import './Container/Container.module.css';
@import './Center/Center.module.css';
@import './AspectRatio/AspectRatio.module.css';
@import './Space/Space.module.css';
@import './Paper/Paper.module.css';
@import './Text/Text.module.css';
@import './Title/Title.module.css';
```

(Note: this is a convenience — consumers can also import individually.)

- [ ] **Step 3: Smoke test all exports**

```tsx
import { describe, it, expect } from 'vitest';
import * as blocks from '../src/index.ts';

describe('@soribashi/blocks public API', () => {
  it('exports all 14 layout blocks', () => {
    expect(typeof blocks.Box).toBe('object'); // forwardRef
    expect(typeof blocks.Stack).toBe('object');
    expect(typeof blocks.Group).toBe('object');
    expect(typeof blocks.Flex).toBe('object');
    expect(typeof blocks.Grid).toBe('object');
    expect(typeof blocks.Grid.Col).toBe('object');
    expect(typeof blocks.SimpleGrid).toBe('object');
    expect(typeof blocks.Container).toBe('object');
    expect(typeof blocks.Center).toBe('object');
    expect(typeof blocks.AspectRatio).toBe('object');
    expect(typeof blocks.Space).toBe('object');
    expect(typeof blocks.Paper).toBe('object');
    expect(typeof blocks.Text).toBe('object');
    expect(typeof blocks.Title).toBe('object');
  });
});
```

- [ ] **Step 4: Run all tests**

```bash
cd /Users/matt/Documents/GitHub/soribashi
bun test
```

Expected: All theme + codegen + factory + blocks tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/blocks/src/index.ts packages/blocks/src/style.css packages/blocks/test/index.test.tsx
git commit -m "feat(blocks): finalize public API with all 14 blocks exported"
```

---

## Task 16: Final Smoke

```bash
cd /Users/matt/Documents/GitHub/soribashi
bun test
bun run typecheck
git commit --allow-empty -m "chore: Plan 4 (blocks) complete — 14 layout primitives shipped"
```

---

## Acceptance Criteria

Plan 4 is complete when:

1. All 14 blocks (Box, Flex, Stack, Group, Grid, Grid.Col, SimpleGrid, Container, Center, AspectRatio, Space, Paper, Text, Title) are implemented.
2. Each block has a CSS module with `data-*`-driven theme-token-resolved styles.
3. All blocks expose `withProps`, `extend`, `classes`, `displayName` static methods.
4. Polymorphic blocks (Box, Text) accept `as` prop.
5. `Grid.Col` is a compound component on `Grid`.
6. All tests pass; typecheck passes.
