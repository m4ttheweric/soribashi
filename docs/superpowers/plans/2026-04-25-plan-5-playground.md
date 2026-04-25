# Soribashi Plan 5 — `@soribashi/core` Barrel + Playground + First Adapted Button

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire everything together. Ship `@soribashi/core` (the barrel), create the `apps/playground` Vite + React app with a real `soribashi.config.ts`, generate the theme CSS + Tailwind v3 config, build a real Button using soribashi from a consumer perspective, and demonstrate the full validation path: token roundtrip + intent×variant matrix + dark mode.

**Architecture:** The playground is a normal Vite + React + TS + Tailwind v3 app. It imports from `@soribashi/core` like a real consumer. It runs codegen via `bun run codegen` (added to root scripts). It demonstrates a Button component built using `defineComponent` and consumed by feature code.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind v3, the soribashi packages from Plans 1-4.

**Reference:** Mantine's playground app structure as reference for what an internal dev surface looks like. The Button component pattern follows Plan 2's Button example.

---

## File Structure

### Created in this plan

```
packages/core/
  package.json
  tsconfig.json
  src/index.ts

apps/playground/
  package.json
  tsconfig.json
  vite.config.ts
  tailwind.config.js
  postcss.config.js
  index.html
  src/
    main.tsx
    App.tsx
    theme/
      index.ts                          ← createTheme() definition
    generated/                          ← committed; regenerated via bun codegen
      theme.css
      tailwind.config.generated.js
    components/
      Button/
        Button.tsx                      ← soribashi-built Button
        Button.module.css
    pages/
      ThemeLab.tsx                      ← intent × variant matrix
      BlocksDemo.tsx                    ← layout block demo
    styles.css                          ← imports tailwind + generated theme

soribashi.config.ts                     ← root-level config
```

### Modified

- Root `package.json` — add scripts: `dev`, `codegen`, `codegen:watch`
- Root `tsconfig.json` — add `apps/playground` reference
- Root `vitest.workspace.ts` — add core package

---

## Task 1: Create @soribashi/core Barrel

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/core/package.json`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/core/tsconfig.json`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/core/src/index.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@soribashi/core",
  "version": "0.0.0",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": { "types": "./src/index.ts", "default": "./src/index.ts" }
  },
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@soribashi/factory": "workspace:*",
    "@soribashi/theme": "workspace:*",
    "@soribashi/blocks": "workspace:*"
  },
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
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
    { "path": "../factory" },
    { "path": "../blocks" }
  ],
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules"]
}
```

- [ ] **Step 3: Create src/index.ts**

```ts
// @soribashi/core — public barrel package

// Authoring API (most consumers only need this)
export {
  defineComponent,
  defineGenericComponent,
  definePolymorphicComponent,
  cn,
} from '@soribashi/factory';

export type {
  StylesApiProps,
  PolymorphicProps,
  PolymorphicRef,
} from '@soribashi/factory';

// Theme
export {
  createTheme,
  defaultIntentResolver,
} from '@soribashi/theme';

export type {
  ResolvedTheme,
  ThemeDefinition,
  IntentResolver,
} from '@soribashi/theme';

// Provider
export { SoribashiProvider, useTheme } from '@soribashi/factory';

// Layout blocks
export {
  Box,
  Flex,
  Stack,
  Group,
  Grid,
  SimpleGrid,
  Container,
  Center,
  AspectRatio,
  Space,
  Paper,
  Text,
  Title,
} from '@soribashi/blocks';
```

- [ ] **Step 4: Update root tsconfig.json**

```json
{
  "files": [],
  "references": [
    { "path": "./packages/theme" },
    { "path": "./packages/codegen" },
    { "path": "./packages/factory" },
    { "path": "./packages/blocks" },
    { "path": "./packages/core" }
  ]
}
```

- [ ] **Step 5: Install and commit**

```bash
cd /Users/matt/Documents/GitHub/soribashi
bun install
git add packages/core/ tsconfig.json bun.lock
git commit -m "feat(core): add @soribashi/core barrel package"
```

---

## Task 2: Bootstrap Playground App

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/apps/playground/package.json`
- Create: `/Users/matt/Documents/GitHub/soribashi/apps/playground/tsconfig.json`
- Create: `/Users/matt/Documents/GitHub/soribashi/apps/playground/vite.config.ts`
- Create: `/Users/matt/Documents/GitHub/soribashi/apps/playground/index.html`

- [ ] **Step 1: Create apps/playground/package.json**

```json
{
  "name": "@soribashi/playground",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@soribashi/core": "workspace:*",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.0",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.2",
    "vite": "^6.0.0"
  }
}
```

- [ ] **Step 2: Create apps/playground/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "references": [
    { "path": "../../packages/core" }
  ],
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules"]
}
```

- [ ] **Step 3: Create vite.config.ts**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
```

- [ ] **Step 4: Create index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Soribashi Playground</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Update workspace tsconfig and install**

Update `/Users/matt/Documents/GitHub/soribashi/tsconfig.json`:

```json
{
  "files": [],
  "references": [
    { "path": "./packages/theme" },
    { "path": "./packages/codegen" },
    { "path": "./packages/factory" },
    { "path": "./packages/blocks" },
    { "path": "./packages/core" },
    { "path": "./apps/playground" }
  ]
}
```

Install:

```bash
cd /Users/matt/Documents/GitHub/soribashi
bun install
```

- [ ] **Step 6: Commit**

```bash
git add apps/playground/package.json apps/playground/tsconfig.json apps/playground/vite.config.ts apps/playground/index.html tsconfig.json bun.lock
git commit -m "chore(playground): bootstrap Vite + React + TS playground app"
```

---

## Task 3: Define Playground Theme

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/apps/playground/src/theme/index.ts`

- [ ] **Step 1: Write theme**

```ts
import { createTheme, defaultTokens, defaultDarkTokens } from '@soribashi/core';

export const theme = createTheme({
  name: 'playground',
  tokens: {
    ...defaultTokens,
    colors: {
      ...defaultTokens.colors,
      // Add a foreground per intent (used by intent resolver for filled variant text color)
      primary: { ...defaultTokens.colors.primary, foreground: 'hsl(0 0% 100%)' },
      neutral: { ...defaultTokens.colors.neutral, foreground: 'hsl(0 0% 100%)' },
      danger:  { ...defaultTokens.colors.danger, foreground: 'hsl(0 0% 100%)' },
      success: { ...defaultTokens.colors.success, foreground: 'hsl(0 0% 100%)' },
      warning: { ...defaultTokens.colors.warning, foreground: 'hsl(0 0% 0%)' },
      info:    { ...defaultTokens.colors.info, foreground: 'hsl(0 0% 100%)' },
    },
  },
  dark: defaultDarkTokens,
  semantic: {
    intent: ['primary', 'neutral', 'danger', 'success', 'warning', 'info'],
    variant: ['filled', 'outline', 'subtle', 'ghost', 'link'],
    text: {
      default: 'colors.neutral.900',
      muted: 'colors.neutral.500',
      disabled: 'colors.neutral.400',
    },
    surface: {
      canvas: 'colors.neutral.50',
      default: 'colors.neutral.0',
      raised: 'colors.neutral.100',
      sunken: 'colors.neutral.50',
      overlay: 'colors.neutral.900',
    },
    border: {
      default: 'colors.neutral.200',
      strong: 'colors.neutral.400',
      muted: 'colors.neutral.100',
    },
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/playground/src/theme/index.ts
git commit -m "feat(playground): define playground theme using soribashi"
```

---

## Task 4: Root soribashi.config.ts

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/soribashi.config.ts`

- [ ] **Step 1: Write config**

```ts
import { theme } from './apps/playground/src/theme/index.ts';

export default {
  theme,
  output: {
    css: './apps/playground/src/generated/theme.css',
    tailwind: {
      mode: 'v3' as const,
      configPath: './apps/playground/src/generated/tailwind.config.generated.js',
    },
  },
  watch: ['./apps/playground/src/theme/**/*'],
};
```

- [ ] **Step 2: Add root scripts**

Update `/Users/matt/Documents/GitHub/soribashi/package.json` scripts:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --build",
    "lint": "biome check .",
    "format": "biome format . --write",
    "codegen": "bun run packages/codegen/bin/soribashi.ts build",
    "codegen:watch": "bun run packages/codegen/bin/soribashi.ts watch",
    "dev:playground": "bun run --filter @soribashi/playground dev",
    "dev": "bun run codegen && bun run dev:playground",
    "build": "bun run codegen && bun run --filter @soribashi/playground build"
  }
}
```

- [ ] **Step 3: Run codegen to verify it works**

```bash
cd /Users/matt/Documents/GitHub/soribashi
bun run codegen
```

Expected: Files written to `apps/playground/src/generated/theme.css` and `tailwind.config.generated.js`.

- [ ] **Step 4: Commit (including the generated artifacts; per spec rule 6 they're committed)**

```bash
git add soribashi.config.ts package.json apps/playground/src/generated/
git commit -m "feat: add soribashi.config.ts and codegen scripts; commit generated artifacts"
```

---

## Task 5: Playground Tailwind Config (Uses Generated)

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/apps/playground/tailwind.config.js`
- Create: `/Users/matt/Documents/GitHub/soribashi/apps/playground/postcss.config.js`
- Create: `/Users/matt/Documents/GitHub/soribashi/apps/playground/src/styles.css`

- [ ] **Step 1: Create tailwind.config.js**

```js
const generated = require('./src/generated/tailwind.config.generated.js');

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...generated,
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../../packages/blocks/src/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
};
```

- [ ] **Step 2: Create postcss.config.js**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 3: Create src/styles.css**

```css
@import './generated/theme.css';

@import '@soribashi/blocks/style.css';

@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: var(--font-family-sans);
  background: var(--surface-canvas);
  color: var(--text-default);
  margin: 0;
}

* { box-sizing: border-box; }
```

- [ ] **Step 4: Commit**

```bash
git add apps/playground/tailwind.config.js apps/playground/postcss.config.js apps/playground/src/styles.css
git commit -m "feat(playground): wire up Tailwind v3 with generated soribashi config"
```

---

## Task 6: Build a Real Button Using Soribashi

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/apps/playground/src/components/Button/Button.tsx`
- Create: `/Users/matt/Documents/GitHub/soribashi/apps/playground/src/components/Button/Button.module.css`

This is the consumer-perspective example: a real Button authored using `defineComponent` from `@soribashi/core`.

- [ ] **Step 1: Write Button.tsx**

```tsx
import { defineComponent } from '@soribashi/core';
import classes from './Button.module.css';

type Intent = 'primary' | 'neutral' | 'danger' | 'success' | 'warning' | 'info';
type Variant = 'filled' | 'outline' | 'subtle' | 'ghost' | 'link';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonOwnProps {
  intent?: Intent;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = defineComponent<ButtonOwnProps>({
  name: 'Button',
  element: 'button',
  selectors: ['root', 'label', 'icon', 'spinner'] as const,
  variants: ['filled', 'outline', 'subtle', 'ghost', 'link'] as const,
  classes,
  defaults: {
    intent: 'primary',
    variant: 'filled',
    size: 'md',
    loading: false,
    fullWidth: false,
  },
  render: ({ props, getStyles }) => {
    const { intent, variant, size, loading, fullWidth, leftIcon, rightIcon, children, ...rest } =
      props as any;
    return (
      <button
        type="button"
        {...getStyles('root')}
        {...rest}
        data-size={size}
        data-full-width={fullWidth}
        data-loading={loading}
        disabled={(rest as any).disabled || loading}
      >
        {leftIcon && <span {...getStyles('icon')} data-position="left">{leftIcon}</span>}
        <span {...getStyles('label')}>{children}</span>
        {rightIcon && <span {...getStyles('icon')} data-position="right">{rightIcon}</span>}
        {loading && <span {...getStyles('spinner')} aria-hidden />}
      </button>
    );
  },
});
```

- [ ] **Step 2: Write Button.module.css**

```css
.root {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  font-family: var(--font-family-sans);
  font-weight: 500;

  background: var(--button-bg);
  color: var(--button-color);
  border: 1px solid var(--button-border);
  border-radius: var(--radius-md);

  cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;
}

.root:hover {
  background: var(--button-hover, var(--button-bg));
}

.root:active {
  background: var(--button-active, var(--button-bg));
}

.root:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.root:focus-visible {
  outline: 2px solid var(--button-bg);
  outline-offset: 2px;
}

.root[data-size='sm'] {
  height: 2rem;
  padding: 0 0.75rem;
  font-size: var(--font-size-sm);
}

.root[data-size='md'] {
  height: 2.5rem;
  padding: 0 1rem;
  font-size: var(--font-size-md);
}

.root[data-size='lg'] {
  height: 3rem;
  padding: 0 1.5rem;
  font-size: var(--font-size-lg);
}

.root[data-full-width='true'] {
  width: 100%;
}

.label {
  display: inline-block;
}

.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  display: inline-block;
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 600ms linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/playground/src/components/Button/
git commit -m "feat(playground): add Button component built using soribashi"
```

---

## Task 7: Theme Lab Page (Intent × Variant Matrix)

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/apps/playground/src/pages/ThemeLab.tsx`

- [ ] **Step 1: Write ThemeLab.tsx**

```tsx
import { Container, Stack, Group, Title, Text, Paper } from '@soribashi/core';
import { Button } from '../components/Button/Button.tsx';

const INTENTS = ['primary', 'neutral', 'danger', 'success', 'warning', 'info'] as const;
const VARIANTS = ['filled', 'outline', 'subtle', 'ghost', 'link'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;

export function ThemeLab() {
  return (
    <Container size="xl" px="lg">
      <Stack gap="xl">
        <Title level={1}>Soribashi Theme Lab</Title>

        <Paper p="lg" withBorder shadow="sm">
          <Stack gap="md">
            <Title level={2}>Intent × Variant Matrix</Title>
            <Text color="muted">
              Every Button below is the same component. Color decisions live in the theme's
              intentResolver. Adding a new intent or variant happens in exactly one place.
            </Text>

            <Stack gap="md">
              {INTENTS.map((intent) => (
                <Group key={intent} gap="sm" align="center">
                  <div style={{ width: '6rem', textTransform: 'capitalize' }}>{intent}</div>
                  {VARIANTS.map((variant) => (
                    <Button key={variant} intent={intent} variant={variant}>
                      {variant}
                    </Button>
                  ))}
                </Group>
              ))}
            </Stack>
          </Stack>
        </Paper>

        <Paper p="lg" withBorder shadow="sm">
          <Stack gap="md">
            <Title level={2}>Sizes</Title>
            <Group>
              {SIZES.map((size) => (
                <Button key={size} size={size}>
                  Size {size}
                </Button>
              ))}
            </Group>
          </Stack>
        </Paper>

        <Paper p="lg" withBorder shadow="sm">
          <Stack gap="md">
            <Title level={2}>States</Title>
            <Group>
              <Button>Default</Button>
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
              <Button fullWidth>Full Width</Button>
            </Group>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/playground/src/pages/ThemeLab.tsx
git commit -m "feat(playground): add ThemeLab page demonstrating intent × variant matrix"
```

---

## Task 8: Blocks Demo Page

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/apps/playground/src/pages/BlocksDemo.tsx`

- [ ] **Step 1: Write BlocksDemo.tsx**

```tsx
import {
  Container, Stack, Group, Grid, SimpleGrid, Center, Box, Paper, Text, Title, Space,
} from '@soribashi/core';

export function BlocksDemo() {
  return (
    <Container size="xl" px="lg">
      <Stack gap="xl">
        <Title level={1}>Layout Blocks</Title>

        <Paper p="lg" withBorder>
          <Stack gap="md">
            <Title level={3}>Stack</Title>
            <Stack gap="sm">
              {['One', 'Two', 'Three'].map((s) => (
                <Box key={s} bg="raised" p="md" radius="md">{s}</Box>
              ))}
            </Stack>
          </Stack>
        </Paper>

        <Paper p="lg" withBorder>
          <Stack gap="md">
            <Title level={3}>Group</Title>
            <Group gap="sm">
              {['One', 'Two', 'Three'].map((s) => (
                <Box key={s} bg="raised" p="md" radius="md">{s}</Box>
              ))}
            </Group>
          </Stack>
        </Paper>

        <Paper p="lg" withBorder>
          <Stack gap="md">
            <Title level={3}>Grid</Title>
            <Grid columns={12} gap="md">
              <Grid.Col span={4}>
                <Box bg="raised" p="md" radius="md">span 4</Box>
              </Grid.Col>
              <Grid.Col span={4}>
                <Box bg="raised" p="md" radius="md">span 4</Box>
              </Grid.Col>
              <Grid.Col span={4}>
                <Box bg="raised" p="md" radius="md">span 4</Box>
              </Grid.Col>
              <Grid.Col span={6}>
                <Box bg="raised" p="md" radius="md">span 6</Box>
              </Grid.Col>
              <Grid.Col span={6}>
                <Box bg="raised" p="md" radius="md">span 6</Box>
              </Grid.Col>
            </Grid>
          </Stack>
        </Paper>

        <Paper p="lg" withBorder>
          <Stack gap="md">
            <Title level={3}>SimpleGrid</Title>
            <SimpleGrid cols={3} gap="md">
              {['A', 'B', 'C', 'D', 'E', 'F'].map((s) => (
                <Box key={s} bg="raised" p="md" radius="md">{s}</Box>
              ))}
            </SimpleGrid>
          </Stack>
        </Paper>

        <Paper p="lg" withBorder>
          <Stack gap="md">
            <Title level={3}>Typography</Title>
            <Title level={1}>Title 1</Title>
            <Title level={2}>Title 2</Title>
            <Title level={3}>Title 3</Title>
            <Text size="lg">Body large</Text>
            <Text>Body default</Text>
            <Text color="muted">Muted text</Text>
          </Stack>
        </Paper>

        <Paper p="lg" withBorder>
          <Stack gap="md">
            <Title level={3}>Center</Title>
            <Center>
              <Box bg="raised" p="lg" radius="md">Centered</Box>
            </Center>
          </Stack>
        </Paper>
      </Stack>

      <Space h="2xl" />
    </Container>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/playground/src/pages/BlocksDemo.tsx
git commit -m "feat(playground): add BlocksDemo page showcasing all layout blocks"
```

---

## Task 9: Wire Up the App

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/apps/playground/src/main.tsx`
- Create: `/Users/matt/Documents/GitHub/soribashi/apps/playground/src/App.tsx`

- [ ] **Step 1: Write main.tsx**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.tsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 2: Write App.tsx with simple routing**

```tsx
import { useState } from 'react';
import { SoribashiProvider, Container, Group, Title } from '@soribashi/core';
import { theme } from './theme/index.ts';
import { ThemeLab } from './pages/ThemeLab.tsx';
import { BlocksDemo } from './pages/BlocksDemo.tsx';

type Page = 'theme-lab' | 'blocks';

export function App() {
  const [page, setPage] = useState<Page>('theme-lab');
  const [dark, setDark] = useState(false);

  return (
    <SoribashiProvider theme={theme}>
      <div className={dark ? 'dark' : ''}>
        <header style={{ borderBottom: '1px solid var(--border-default)', padding: '1rem 2rem' }}>
          <Container size="xl" px="none">
            <Group justify="between">
              <Title level={3}>Soribashi</Title>
              <Group>
                <button onClick={() => setPage('theme-lab')}>Theme Lab</button>
                <button onClick={() => setPage('blocks')}>Blocks</button>
                <button onClick={() => setDark(!dark)}>
                  {dark ? '☀ Light' : '☾ Dark'}
                </button>
              </Group>
            </Group>
          </Container>
        </header>

        <main style={{ padding: '2rem 0' }}>
          {page === 'theme-lab' && <ThemeLab />}
          {page === 'blocks' && <BlocksDemo />}
        </main>
      </div>
    </SoribashiProvider>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/playground/src/main.tsx apps/playground/src/App.tsx
git commit -m "feat(playground): wire up app with routing and dark mode toggle"
```

---

## Task 10: Smoke Test the Build

- [ ] **Step 1: Verify Vite builds**

```bash
cd /Users/matt/Documents/GitHub/soribashi
bun run codegen
bun run --filter @soribashi/playground build
```

Expected: Build succeeds, output in `apps/playground/dist`.

- [ ] **Step 2: Run dev server briefly to verify**

```bash
cd /Users/matt/Documents/GitHub/soribashi
bun run dev:playground &
# Wait a few seconds, then curl
sleep 3
curl -s http://localhost:5173/ | head -5
# Kill the dev server
kill %1
```

Expected: HTML output containing the app.

- [ ] **Step 3: Run all tests one final time**

```bash
cd /Users/matt/Documents/GitHub/soribashi
bun test
```

Expected: All tests pass across all packages.

- [ ] **Step 4: Commit final state**

```bash
git commit --allow-empty -m "chore: Plan 5 (playground) complete — full validation path working"
```

---

## Acceptance Criteria

Plan 5 is complete when:

1. `@soribashi/core` exports the daily-use API + blocks + theme + provider.
2. `apps/playground` is a working Vite + React + TS app.
3. `bun run codegen` produces `theme.css` and `tailwind.config.generated.js` in the playground's `src/generated/` directory.
4. `bun run dev:playground` boots the app and serves `/` successfully.
5. The Button component (in `apps/playground/src/components/Button/`) is built using `defineComponent` from `@soribashi/core`.
6. The Theme Lab page renders the intent × variant matrix; all combinations show different colors.
7. The Blocks Demo page renders all major layout blocks.
8. Dark mode toggle swaps `:root` to `.dark` token values.
9. `bun test` passes across all packages.

## What's NOT in this plan (deferred)

- Playwright visual tests — can be added post-v1 once the playground is stable
- ClaimViewIslands integration in the assured codebase — separate effort, separate repo
- Full coverage of all 14 blocks in BlocksDemo — focus on representative subset for now
- Mantine-style notifications/modals/toasts — those are application components, not in soribashi's scope
