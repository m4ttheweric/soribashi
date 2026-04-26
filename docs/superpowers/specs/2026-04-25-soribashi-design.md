# Soribashi — Design Spec

**Status:** Draft (supersedes RFC v1, RFC v2)
**Date:** 2026-04-25
**Audience:** Implementation engineers, design-system contributors

---

## 1. What Soribashi Is

Soribashi is a **component-authoring framework** for building coherent, governed component libraries in React. It is not itself a component library. It is the toolkit teams use to build their own libraries with consistent prop APIs, unified theming, and enforced design constraints.

Heavily based on [Mantine's](https://mantine.dev) open-source authoring patterns (factory, useProps, useStyles, variant resolvers), retargeted to be:

- **Substrate-agnostic** — works with Tailwind (v3 or v4) or CSS Modules; not coupled to Mantine's component set or styling conventions
- **More user-friendly** — daily-use `defineComponent({...})` API replaces Mantine's per-component type ceremony
- **Strict about contracts** — color and intent decisions live in exactly one place (the theme); components cannot drift

### One-line summary

Soribashi is the framework you use to build your component library, where the theme is the single contract every component honors.

### What it ships

- **`@soribashi/factory`** — `defineComponent`, `defineGenericComponent`, `definePolymorphicComponent`, plus lower-level primitives
- **`@soribashi/theme`** — `createTheme`, `SoribashiProvider`, intent resolver, theme composition
- **`@soribashi/codegen`** — generates CSS variables (always), Tailwind v3 config or v4 `@theme` block (optional)
- **`@soribashi/blocks`** — 14 layout primitives (`Box`, `Stack`, `Group`, `Grid`, etc.), authored using soribashi itself
- **`@soribashi/core`** — public barrel package

### What it does NOT ship

- Application components (`Button`, `Input`, `Modal`, `Tooltip`, `Select`, etc.) — those live in the consumer's library
- shadcn integration — soribashi does not require, depend on, or recommend shadcn

---

## 2. Why It Exists

### The pain Soribashi addresses

In an existing component library built on CVA + Tailwind + Radix (the assured codebase's `core-radix`, for example), three problems appear and compound:

1. **Inconsistent prop APIs** — `size` means different things in different components; `variant` is redeclared per component; `asChild` is reimplemented six times.
2. **No semantic theming layer** — feature code picks specific shades and px values; humans and AI both drift.
3. **No place colors are decided once** — `Button` says `ring-primary`, `IconButton` says `ring-primary-500`, `Input` says `ring-primary-500`. Three spellings of "focus ring."

Mantine solves all three through its authoring framework (factory + useProps + useStyles + variantColorResolver). Soribashi extracts that solution, generalizes it, makes it less ceremonious to write daily, and leaves the choice of underlying styling substrate to the consumer.

### Strategic positioning

Validated internally first (the assured engineering team's `core-radix` library is rewritten using Soribashi), then released publicly. The internal validation is the v1 success criterion.

---

## 3. Core Architectural Principles

### 3.1 The theme is the contract

`createTheme()` is the single source of truth for tokens, semantic mappings, intent resolution, and component defaults. A component using soribashi can only reach into this theme; it cannot make color decisions or define new tokens inline. This is enforced through:

- The Tailwind config generated from the theme exposes only theme-blessed tokens to soribashi components
- The intent resolver lives on the theme; components call it via the framework, never inline
- The factory's `Factory` type constrains variant unions and CSS variable surfaces

### 3.2 CSS custom properties are always the runtime substrate

Whether the team uses Tailwind v3, Tailwind v4, or CSS Modules, the underlying token mechanism is CSS custom properties (e.g., `var(--color-primary-500)`). Soribashi codegen always emits a CSS variable file. Tailwind config (or `@theme` block) is an optional second output that enables utility classes referencing those vars.

### 3.3 Component authoring is a single declarative call

Daily-use API: `defineComponent({ name, selectors, variants, defaults, render })`. Types are inferred. The five-type-alias-per-component ceremony of Mantine is hidden inside the framework.

### 3.4 Color × variant decisions live in exactly one function

The theme's `intentResolver` maps `(intent, variant) → { background, color, border, hover, ... }`. Every component that supports intent and variant calls this same resolver via the framework. Components do not write color classes inline.

### 3.5 Substrate-agnostic styling

The same `defineComponent`/`useStyles` API supports three styling sources, picked per component:

1. **Tailwind via CVA recipe** — `recipe: cva(...)`
2. **CSS Modules** — `classes: import('./X.module.css')`
3. **Plain class names from a global stylesheet** — `classes: { root: 'btn-root', label: 'btn-label' }`

The framework does not care which is used; mixing across components in the same library is supported.

---

## 4. Package Architecture

### 4.1 Workspace layout (Bun monorepo)

```
soribashi/
  package.json
  bun.lock
  tsconfig.base.json

  apps/
    playground/                       Vite + React + TS development surface
      src/
        theme/
          index.ts                    createTheme() definition
        generated/
          theme.css                   emitted CSS vars (committed)
          tailwind.config.generated.js (committed)
        ...
      tailwind.config.js              imports from generated
      package.json

  packages/
    factory/   @soribashi/factory     defineComponent, useProps, useStyles, etc.
    theme/     @soribashi/theme       createTheme, Provider, intentResolver
    codegen/   @soribashi/codegen     theme → CSS vars + Tailwind config
    blocks/    @soribashi/blocks      Box, Stack, Group, Grid, ...
    core/      @soribashi/core        public barrel

  tooling/
    scripts/
      dev.ts                          orchestrates codegen watch + Vite

  docs/
    superpowers/
      specs/
        2026-04-25-soribashi-design.md   this document
```

### 4.2 Package responsibilities

#### `@soribashi/factory`

Exports the component-authoring primitives:

- **Daily-use API** — `defineComponent`, `defineGenericComponent`, `definePolymorphicComponent`
- **Escape hatches** — `component`, `polymorphicComponent`, `genericComponent`, `useProps`, `useStyles`, `createVarsResolver`
- **Types** — `Factory`, `PolymorphicFactory`, `GenericFactory`, `StylesApiProps`
- **Utilities** — re-exports of `cva` and `ClassValue` from `class-variance-authority`

Depends only on React, `class-variance-authority`, and `clsx`/`tailwind-merge` (via its own internal `cn()`).

#### `@soribashi/theme`

Exports theme-authoring and runtime-provider:

- `createTheme(definition)` — typed theme builder
- `SoribashiProvider` — React context provider, equivalent to `MantineProvider`
- `defaultIntentResolver` — default mapping for `(intent, variant) → { background, color, border, hover }` over `'filled' | 'outline' | 'subtle' | 'ghost' | 'link'`
- `extend(component, config)` — used inside `theme.components.X.extend({...})` for theme-level component overrides
- Theme-derived types — `SoribashiSize`, `SoribashiIntent`, `SoribashiRadius`, `SoribashiColor`

#### `@soribashi/codegen`

Stand-alone CLI and programmatic API:

- Reads a `soribashi.config.ts` (or programmatic theme object)
- Always emits `theme.css` with CSS custom properties for `:root`, `.dark`, and optional custom scope selectors
- Optionally emits `tailwind.config.generated.js` (Tailwind v3 mode)
- Optionally emits `theme.tailwind.css` with `@theme` block (Tailwind v4 mode)
- Watch mode for development
- CLI commands: `soribashi build`, `soribashi watch`

No CSS parsing. The theme is the source of truth; codegen produces outputs from it.

#### `@soribashi/blocks`

The 14 layout primitives. Each is authored using `defineComponent` or `definePolymorphicComponent`. Demonstrates the framework's authoring patterns. See § 7.

#### `@soribashi/core`

Public barrel:

- Re-exports all public blocks from `@soribashi/blocks`
- Re-exports `defineComponent`, `defineGenericComponent`, `definePolymorphicComponent` from `@soribashi/factory`
- Re-exports `createTheme`, `SoribashiProvider` from `@soribashi/theme`

Does NOT re-export:

- Lower-level escape hatches (consumers of those import from `@soribashi/factory` directly)
- Codegen APIs (consumers run them via CLI or import from `@soribashi/codegen` directly)

### 4.3 Dependency graph

```
@soribashi/codegen   standalone, depends on @soribashi/theme types only
@soribashi/theme     depends on @soribashi/factory types
@soribashi/factory   standalone, no internal soribashi deps
@soribashi/blocks    depends on @soribashi/factory, @soribashi/theme
@soribashi/core      barrel, depends on factory + theme + blocks
```

---

## 5. The Theme System

### 5.1 `createTheme()` shape

```ts
const theme = createTheme({
  tokens: {
    colors: {
      primary: { 50: 'hsl(...)', 100: 'hsl(...)', /* ... */ 900: 'hsl(...)' },
      neutral: { /* ... */ },
      success: { /* ... */ },
      danger:  { /* ... */ },
      warning: { /* ... */ },
      info:    { /* ... */ },
    },
    radius:  { sm: '0.25rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem' },
    spacing: { xs: '0.25rem', sm: '0.5rem', md: '0.75rem', lg: '1rem', xl: '1.5rem' },
    fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem', lg: '1.125rem', xl: '1.25rem' },
  },

  semantic: {
    intent:  ['primary', 'neutral', 'danger', 'success', 'warning', 'info'],
    variant: ['filled', 'outline', 'subtle', 'ghost', 'link'],
    text: {
      default:  'colors.neutral.900',
      muted:    'colors.neutral.500',
      disabled: 'colors.neutral.400',
      inverted: 'colors.neutral.0',
    },
    surface: {
      // Layered elevation system (a deliberate fix for a known Mantine gap;
      // see § 5.6). Components reference these by name, not by raw color.
      canvas:  'colors.neutral.50',     // page background
      default: 'colors.neutral.0',      // base surface (cards, panels)
      raised:  'colors.neutral.100',    // elevated above default (popover, modal, dropdown)
      sunken:  'colors.neutral.50',     // recessed (inputs, wells)
      overlay: 'colors.neutral.900',    // modal backdrops, scrim
    },
    border: {
      default: 'colors.neutral.200',
      strong:  'colors.neutral.400',
      muted:   'colors.neutral.100',
    },
  },

  intentResolver: defaultIntentResolver,        // override for custom variant treatments

  components: {
    Button: Button.extend({
      defaultProps: { size: 'md', variant: 'filled', intent: 'primary' },
      classNames: { root: '/* extra theme classes */' },
    }),
  },

  darkMode: { selector: '.dark' },               // or custom: '.dark .claim-view-islands'
  scope:    ':root',                             // or custom scope selector
});
```

### 5.2 Token resolution and CSS emission

When the theme is built (at codegen time or runtime via `SoribashiProvider`), tokens flatten to CSS custom properties:

```css
:root {
  --color-primary-50:  hsl(...);
  --color-primary-500: hsl(...);
  --color-primary-900: hsl(...);
  --radius-md:         0.375rem;
  --spacing-md:        0.75rem;
  --font-size-md:      1rem;
}

.dark {
  --color-primary-50:  hsl(...);  /* dark-mode overrides */
}
```

Semantic tokens reference base tokens via CSS variables:

```css
:root {
  --text-default:    var(--color-neutral-900);
  --text-muted:      var(--color-neutral-500);
  --surface-default: var(--color-neutral-50);
}
```

### 5.3 The intent resolver

A single function on the theme that maps `(intent, variant) → { background, color, border, hover, ... }`. Default implementation handles the standard variant set:

```ts
type IntentResolver = (input: {
  intent: SoribashiIntent;
  variant: SoribashiVariant;
  theme: SoribashiTheme;
}) => {
  background: string;     // CSS value or var(...)
  color:      string;
  border:     string;
  hover?:     string;
  active?:    string;
};
```

The default implementation:

- `filled`   → `bg = var(--color-{intent}-500)`, `color = white-or-contrast`, `border = transparent`
- `outline`  → `bg = transparent`, `color = var(--color-{intent}-700)`, `border = var(--color-{intent}-500)`
- `subtle`   → `bg = var(--color-{intent}-100)`, `color = var(--color-{intent}-700)`, `border = transparent`
- `ghost`    → `bg = transparent`, `color = var(--color-{intent}-700)`, `border = transparent`, `hover bg = var(--color-{intent}-50)`
- `link`     → `bg = transparent`, `color = var(--color-{intent}-600)`, `border = transparent`, underlines on hover

Teams override by providing their own `intentResolver` in `createTheme()`. Custom variants (e.g., `'gradient'`) must be added to both the resolver and the theme's `semantic.variant` list.

### 5.4 Theme composition

`createTheme({ extends: baseTheme, ... })` allows multi-app monorepos to share a baseline and override per-app. Composition is shallow-merged for tokens and components, deep-merged for semantic mappings.

### 5.5 Multi-tenant theming

For tenant-specific branding, the application wraps subtrees in `SoribashiProvider theme={tenantTheme}`. Tenant themes are typically `createTheme({ extends: baseTheme, tokens: { colors: { primary: { ... } } } })`. Codegen can generate per-tenant CSS variable scopes (e.g., `.tenant-progressive`) for build-time tenant resolution.

### 5.6 Layered surface elevation (a deliberate Mantine-gap fix)

Mantine ships a single `--mantine-color-body` plus the gray scale, leaving teams to define their own surface elevation hierarchy in raw CSS. This is a real, recurring pain — every non-trivial app needs at least three surface layers (canvas → card → raised), and many need more (sunken inputs, overlay scrims).

The console-archive UI package illustrates the workaround at scale:

```css
/* What teams have to write themselves on top of Mantine */
:root[data-mantine-color-scheme='light'] {
  --mantine-color-background-1: var(--mantine-color-body);
  --mantine-color-background-2: var(--mantine-color-gray-0);
  --mantine-color-background-3: rgb(244, 245, 247);
  --mantine-color-background-4: var(--mantine-color-gray-3);
}
:root[data-mantine-color-scheme='dark'] {
  --mantine-color-background-1: var(--mantine-color-body);
  --mantine-color-background-2: var(--mantine-color-dark-9);
  --mantine-color-background-3: rgb(16, 16, 16);
  --mantine-color-background-4: var(--mantine-color-dark-5);
}
```

Soribashi solves this at the framework level. `semantic.surface` is a first-class theme field with named layers (`canvas`, `default`, `raised`, `sunken`, `overlay`). Codegen emits `--surface-canvas`, `--surface-default`, `--surface-raised`, `--surface-sunken`, `--surface-overlay` for both light and dark modes from the single theme definition. Components reference them by semantic name; no team should ever write `--mantine-color-background-3` again.

Teams can rename or extend the surface layers — soribashi's only opinion is that surface elevation is a structured, theme-owned hierarchy, not an ad hoc per-app declaration.

---

## 6. Codegen

### 6.1 Inputs

A `soribashi.config.ts` at the project root:

```ts
import { theme } from './src/theme';

export default {
  theme,
  output: {
    css:      './src/generated/theme.css',
    tailwind: {
      mode:        'v3',                                // or 'v4'
      configPath:  './src/generated/tailwind.config.generated.js',  // v3
      themeCssPath: './src/generated/theme.tailwind.css',           // v4
    },
  },
  watch: ['./src/theme/**/*.ts'],
};
```

### 6.2 Outputs

#### Always: `theme.css`

```css
:root {
  --color-primary-50:  hsl(...);
  --color-primary-500: hsl(...);
  /* every theme token, fully expanded */
  --text-default:      var(--color-neutral-900);
  --surface-default:   var(--color-neutral-50);
}
.dark {
  --color-primary-50: hsl(...);
  /* dark-mode overrides */
}
```

#### Tailwind v3: `tailwind.config.generated.js`

```js
module.exports = {
  theme: {
    colors: {
      primary: {
        50: 'hsl(var(--color-primary-50) / <alpha-value>)',
        /* ... */
      },
      /* ... */
    },
    borderRadius: { sm: 'var(--radius-sm)', md: 'var(--radius-md)' },
    spacing:      { xs: 'var(--spacing-xs)', /* ... */ },
    fontSize:     { xs: 'var(--font-size-xs)', /* ... */ },
  },
};
```

The consumer's actual `tailwind.config.js`:

```js
const generated = require('./src/generated/tailwind.config.generated.js');
module.exports = {
  ...generated,
  content: ['./src/**/*.{ts,tsx}'],
  plugins: [require('tailwindcss-animate')],
};
```

#### Tailwind v4: `theme.tailwind.css`

```css
@theme {
  --color-primary-50:  hsl(...);
  --radius-md:         0.375rem;
  /* etc */
}
```

### 6.3 Behavior

- Codegen is deterministic; given a theme, output is byte-stable.
- Generated files are committed to git for inspectability.
- Watch mode regenerates on theme file changes.
- Running codegen with no changes is a no-op (output stable).

### 6.4 Drift impossibility

Because the Tailwind config is *generated* from the theme:

- Adding a color requires adding it to the theme; it then exists in the Tailwind config automatically.
- Removing a token from the theme removes the corresponding Tailwind classes; references break visibly at build time.
- The Tailwind config and the theme are guaranteed to be in sync.

This replaces the "drift detector" approach considered earlier. Drift is structurally impossible.

---

## 7. The Framework

### 7.1 Daily-use API: `defineComponent`

```tsx
import { defineComponent } from '@soribashi/factory';
import classes from './Button.module.css';

interface ButtonOwnProps {
  loading?:   boolean;
  fullWidth?: boolean;
  leftIcon?:  React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = defineComponent<ButtonOwnProps>({
  name:      'Button',
  element:   'button',
  selectors: ['root', 'label', 'icon', 'spinner'] as const,
  variants:  ['filled', 'outline', 'subtle', 'ghost', 'link'] as const,
  classes,
  defaults:  { loading: false, fullWidth: false },

  render: ({ props, getStyles }) => (
    <button {...getStyles('root')}>
      {props.leftIcon  && <span {...getStyles('icon')}>{props.leftIcon}</span>}
      <span {...getStyles('label')}>{props.children}</span>
      {props.rightIcon && <span {...getStyles('icon')}>{props.rightIcon}</span>}
      {props.loading   && <span {...getStyles('spinner')} />}
    </button>
  ),
});
```

What `defineComponent` does internally:

1. Calls `useProps(name, defaults, rawProps)` — merges instance props > theme defaults > component defaults
2. Calls `useStyles({ name, classes, recipe, varsResolver })` — returns `getStyles(selector)` resolving classNames, styles, vars, attributes
3. If no custom `vars` resolver is provided and the component declares `variants`, automatically calls `theme.intentResolver({ intent, variant, theme })` and exposes the result as CSS vars on the `root` selector. CSS variable names are auto-derived as `--{lowercased-component-name}-{key}`, where `key` is the resolver output key abbreviated where common (`background → bg`, others kept as-is: `color`, `border`, `hover`, `active`). For a component named `Button`, this yields `--button-bg`, `--button-color`, `--button-border`, `--button-hover`, `--button-active`. Other auto-derived vars from common props (e.g., `radius`) follow the same pattern: `--button-radius`
4. Wraps the render function in `forwardRef`
5. Attaches static methods: `withProps(presets)`, `extend(themeConfig)`, `classes`, `displayName`

What the user writes: a single config object, a render function with typed `props` and `getStyles`. No type aliases, no manual prop destructuring, no static method assignments.

### 7.2 Generic components: `defineGenericComponent`

For components parameterized by a type (e.g., `Select<TItem>`):

```tsx
import { defineGenericComponent } from '@soribashi/factory';

interface SelectOwnProps<T> {
  items:       T[];
  value:       T | null;
  onChange:    (value: T | null) => void;
  getKey:      (item: T) => string;
  renderItem?: (item: T) => React.ReactNode;
  searchable?: boolean;
  clearable?:  boolean;
}

export const Select = defineGenericComponent<SelectOwnProps>({
  name:      'Select',
  selectors: ['root', 'trigger', 'panel', 'option', 'search', 'clear'] as const,
  variants:  ['filled', 'outline'] as const,
  classes,
  defaults:  { searchable: false, clearable: false },

  render: ({ props, getStyles }) => (
    <div {...getStyles('root')}>
      {/* implementation */}
    </div>
  ),
});

// Usage:
<Select<User>
  items={users}
  value={selectedUser}
  onChange={setSelectedUser}        // typed (User | null) => void
  getKey={(u) => u.id}              // u typed as User
  renderItem={(u) => u.name}
/>
```

The type parameter is preserved through the component, `withProps`, and ref forwarding. Theme-level `extend` defaults are non-generic (consistent with React Select's behavior).

### 7.3 Polymorphic components: `definePolymorphicComponent`

For components whose root element changes via the `as` prop (e.g., `Box`, `Text`):

```tsx
import { definePolymorphicComponent } from '@soribashi/factory';

interface TextOwnProps {
  size?: SoribashiSize;
}

export const Text = definePolymorphicComponent<TextOwnProps, 'p'>({
  name:           'Text',
  defaultElement: 'p',
  selectors:      ['root'] as const,
  classes,

  render: ({ props, getStyles, Element }) => (
    <Element {...getStyles('root')}>{props.children}</Element>
  ),
});

// Usage:
<Text>paragraph</Text>
<Text as="span">span</Text>
<Text as={Link} href="/">link</Text>
```

### 7.4 Lower-level escape hatches

For the rare component that needs full manual control:

```tsx
import { component, useProps, useStyles, createVarsResolver, type Factory } from '@soribashi/factory';

type ComplexFactory = Factory<{
  props: ComplexProps;
  ref:   HTMLDivElement;
  stylesNames: 'root' | 'inner' | 'special';
  vars:  { root: '--complex-x' | '--complex-y'; inner: '--complex-z' };
  variant: 'a' | 'b' | 'c';
}>;

const varsResolver = createVarsResolver<ComplexFactory>((theme, props) => ({
  root:  { '--complex-x': '...', '--complex-y': '...' },
  inner: { '--complex-z': '...' },
}));

export const Complex = component<ComplexFactory>((rawProps) => {
  const props     = useProps('Complex', defaults, rawProps);
  const getStyles = useStyles<ComplexFactory>({ name: 'Complex', classes, props, varsResolver, /* ... */ });
  return <div {...getStyles('root')}>{/* ... */}</div>;
});
```

Used when the daily helpers don't fit. Documented as advanced.

### 7.5 Static methods on every component

All components built with the daily-use or escape-hatch APIs expose:

#### `Component.withProps(presets)`

Creates a preset variant with default props pre-applied. Instance props always win.

```tsx
const DangerButton = Button.withProps({ intent: 'danger', variant: 'filled' });
```

#### `Component.extend(themeConfig)`

Used inside `theme.components` to configure theme-level overrides. Soribashi supports the same shape as Mantine's `Component.extend`. All fields are optional.

```tsx
type ExtendConfig<F extends Factory> = {
  defaultProps?: Partial<F['props']>;
  classNames?:   ClassNamesConfig<F>;     // object OR callback
  styles?:       StylesConfig<F>;         // object OR callback
  vars?:         (theme, props) => Partial<Record<F['stylesNames'], Record<string, string>>>;
  attributes?:   Partial<Record<F['stylesNames'], Record<string, any>>>;
};
```

Where `ClassNamesConfig` and `StylesConfig` accept either a static object form:

```tsx
classNames: { root: 'shadow-md', label: 'tracking-tight' }
```

or a callback form for dynamic per-instance overrides:

```tsx
classNames: (theme, props) => ({
  root: cn('shadow-md', props.fullWidth && 'w-full'),
  label: props.loading ? 'opacity-0' : 'opacity-100',
})
```

Full example:

```tsx
createTheme({
  components: {
    Button: Button.extend({
      defaultProps: {
        size: 'md',
        variant: 'filled',
      },
      classNames: {
        root: 'shadow-sm hover:shadow-md transition-shadow',
      },
      styles: (theme, props) => ({
        root: props.fullWidth ? { letterSpacing: '0.025em' } : {},
      }),
      vars: (theme, props) => ({
        root: {
          '--button-radius': props.size === 'lg' ? '0.5rem' : '0.375rem',
        },
      }),
      attributes: {
        root: { 'data-testid': 'app-button' },
      },
    }),
  },
});
```

Precedence (highest to lowest, inside `useStyles`):

1. Instance props (`<Button classNames={{...}} styles={{...}} />`)
2. Component-level `defaults` from `defineComponent`
3. Theme-level `Component.extend({ classNames, styles, ... })`
4. Built-in component classes (CSS module / recipe)

**Callback form is v1.** This is necessary for any non-trivial design system (e.g., conditionally applying classes based on `required`, `error`, `loading` states from the theme layer).

#### `Component.classes`

The CSS-module classes object. Useful for nested style composition.

#### `Component.displayName`

Always set automatically by the daily-use helpers.

---

## 8. Styling Substrate Support

### 8.1 Three styling sources, one API

A component picks one per-file:

#### Tailwind via CVA recipe

```tsx
import { cva } from '@soribashi/factory';

const recipe = cva(
  'inline-flex items-center justify-center font-medium transition-colors ' +
    'bg-(--button-bg) text-(--button-color) border border-(--button-border) rounded-(--button-radius)',
  {
    variants: {
      size: {
        sm: 'h-8 px-3 text-sm gap-1.5',
        md: 'h-10 px-4 text-base gap-2',
        lg: 'h-12 px-6 text-lg gap-2.5',
      },
      fullWidth: { true: 'w-full' },
    },
  }
);

defineComponent({ recipe, /* ... */ });
```

Recipe defines structural variants. Color flows from CSS vars set by the intent resolver.

#### CSS Modules

```css
/* Button.module.css */
.root {
  background:    var(--button-bg);
  color:         var(--button-color);
  border:        1px solid var(--button-border);
  border-radius: var(--button-radius);
}

.root[data-size='sm'] { height: 2rem;   padding: 0 0.75rem; }
.root[data-size='md'] { height: 2.5rem; padding: 0 1rem; }
.root[data-size='lg'] { height: 3rem;   padding: 0 1.5rem; }

.label { font-weight: 500; }
.icon  { display: inline-flex; }
```

```tsx
import classes from './Button.module.css';
defineComponent({ classes, /* ... */ });
```

#### Plain class names

```tsx
defineComponent({
  classes: { root: 'btn-root', label: 'btn-label', icon: 'btn-icon' },
  /* ... */
});
```

References classes from a global stylesheet.

### 8.2 The styling enforcement contract

Components using soribashi cannot make color decisions. Two enforcement layers:

**1. The intent resolver runs centrally.** Any component declaring `variants` automatically routes through `theme.intentResolver`, which produces CSS variables on the component's root selector. The CSS module / recipe references those variables.

**2. The generated Tailwind config exposes only theme-blessed tokens.** A CVA recipe inside a soribashi component cannot reference `bg-purple-500` if `purple` is not in the theme — Tailwind won't generate the class.

Both layers together mean: a component literally cannot write `background: red`. It can only express structural styles (sizing, spacing, layout) and reference resolver-provided CSS vars.

### 8.3 Mixing substrates is supported

Within one component library, `Button` may use Tailwind + CVA while `DataTable` uses CSS Modules. The framework is indifferent.

---

## 9. Layout Blocks (`@soribashi/blocks`)

The 14 layout primitives soribashi ships, all authored using `defineComponent` or `definePolymorphicComponent`:

| Block         | Role                                  | API basis        |
|---------------|---------------------------------------|------------------|
| `Box`         | Polymorphic root primitive            | `definePolymorphicComponent` |
| `Flex`        | Generic flex primitive                | `defineComponent` |
| `Stack`       | Vertical flex                         | `defineComponent` |
| `Group`       | Horizontal flex                       | `defineComponent` |
| `Grid`        | Span-based grid                       | `defineComponent` |
| `Grid.Col`    | Grid column                           | compound on Grid |
| `SimpleGrid`  | Equal-width responsive grid           | `defineComponent` |
| `Container`   | Width-constrained shell               | `defineComponent` |
| `Center`      | Centering primitive                   | `defineComponent` |
| `AspectRatio` | Aspect-ratio shell                    | `defineComponent` |
| `Space`       | Theme-driven spacer                   | `defineComponent` |
| `Paper`       | Semantic surface wrapper              | `defineComponent` |
| `Text`        | Typography primitive                  | `definePolymorphicComponent` |
| `Title`       | Heading primitive (h1–h6)             | `definePolymorphicComponent` |

Each block resolves theme-driven props (`gap`, `radius`, `surface`) to CSS custom properties on a static class. Structural classes are static; theme-driven values are CSS vars. No runtime Tailwind class generation.

Example pattern (`Stack`):

```tsx
<Stack gap='md' />
```

Renders to:

```html
<div class="sb-stack" data-gap="md"></div>
```

With CSS:

```css
.sb-stack { display: flex; flex-direction: column; }
.sb-stack[data-gap='md'] { gap: var(--spacing-md); }
```

---

## 10. Brownfield Integration

For the assured codebase specifically — and for any existing project — the migration path:

### 10.1 What stays

- Existing CSS variable definitions (e.g., `--color-primary-500` in `claimview-islands.css`) can remain. The soribashi theme references the same variable names.
- Existing third-party dependencies (Tremor, etc.) keep working through a `tailwindPassthrough` config field that injects library-specific tokens into the generated Tailwind config without exposing them to soribashi components.
- The legacy `tailwind.config.js` chains (the `@assured/tailwindcss-config` baseline, the per-app extensions) can stay for non-soribashi code during transition.

### 10.2 What changes

- A new `soribashi.config.ts` defines the theme.
- Codegen produces `theme.css` and `tailwind.config.generated.js`.
- Components using soribashi import their Tailwind classes from a generated config that exposes only theme-blessed tokens.
- Components are rewritten incrementally using `defineComponent`. Each rewrite locks that component into the theme contract.

### 10.3 Integration with ClaimViewIslands specifically

The existing `claim-view-islands.css` defines tokens scoped to `.claim-view-islands` with dark mode at `.dark .claim-view-islands`. Soribashi supports custom scope:

```ts
createTheme({
  scope:    '.claim-view-islands',
  darkMode: { selector: '.dark .claim-view-islands' },
  /* ... */
});
```

Codegen emits CSS variables under that scope. The existing variables continue to work; the theme just becomes type-safe and authoritative.

---

## 11. v1 Scope and Milestones

### 11.1 Must ship in v1

#### Packages
- `@soribashi/factory` with `defineComponent`, `defineGenericComponent`, `definePolymorphicComponent`, plus the lower-level escape hatches
- `@soribashi/theme` with `createTheme`, `SoribashiProvider`, `defaultIntentResolver`
- `@soribashi/codegen` with theme → CSS vars + Tailwind v3 config
- `@soribashi/blocks` with all 14 blocks
- `@soribashi/core` barrel

#### Capabilities
- Static method support (`withProps`, `extend`, `classes`) on every component
- Tailwind v3 codegen (Tailwind v4 codegen is also v1; both modes)
- CSS Modules support in `defineComponent`
- Generic components fully supported (`defineGenericComponent`)
- Polymorphic components fully supported (`definePolymorphicComponent`)
- Theme composition via `createTheme({ extends: baseTheme })`
- Custom scope and dark mode selectors

#### Integration
- Playground app (`apps/playground`) demonstrating the framework end to end
- One real component in the assured `core-radix` library rewritten using soribashi (recommended: `Button`)
- Used in at least one feature inside ClaimViewIslands

### 11.2 First concrete milestone (the validation bar)

Soribashi v1 is "real" when:

1. `bun dev` boots the playground app with codegen running
2. `createTheme()` compiles, codegen produces `theme.css` and `tailwind.config.generated.js`
3. `defineComponent`, `defineGenericComponent`, `definePolymorphicComponent` all work end to end
4. The default `intentResolver` produces correct CSS for `'filled' | 'outline' | 'subtle' | 'ghost' | 'link'` × all theme intents
5. Four priority blocks (`Box`, `Stack`, `Group`, `Text`) render in the playground using soribashi
6. One real adapted component in the assured codebase (e.g., `Button`) is rewritten using soribashi and used in production code
7. Token roundtrip integration test passes: add a CSS token to the theme → run codegen → use it in a component → verify rendered DOM has the right CSS variable
8. A ClaimViewIslands feature uses the soribashi-built component without regression

### 11.3 Deferred to post-v1

- Full block governance for all third-party components (adapter pattern)
- Full slot styling system beyond `classNames`/`styles`
- Runtime multi-theme provider with switching (v1 supports static composition; runtime switching can come later)
- Public registry / publishing story
- Documentation site
- Larger adapted-component catalog beyond the validation example
- Migration tooling that audits existing Tailwind usage and proposes a theme

---

## 12. Testing Strategy

### 12.1 Unit tests

#### `@soribashi/factory`
- `defineComponent` config → component shape (`displayName`, `classes`, `extend`, `withProps`)
- `useProps` merging precedence (instance > theme defaults > component defaults)
- `useStyles` resolving classNames, styles, vars, attributes per selector
- `createVarsResolver` typing and runtime behavior
- `withProps` precedence: instance props win over preset defaults
- Generic components preserve type parameters through `withProps` and `forwardRef`

#### `@soribashi/theme`
- `createTheme` normalization
- Default intent resolver outputs for all `(intent, variant)` combinations
- Custom intent resolver override
- Theme composition (`extends`)
- `Component.extend` integration with the theme

#### `@soribashi/codegen`
- Theme → CSS variable emission (light, dark, custom scope)
- Theme → Tailwind v3 config
- Theme → Tailwind v4 `@theme` block
- Watch mode regeneration
- Determinism: same theme → byte-identical outputs
- Multi-tenant scope generation

#### `@soribashi/blocks`
- Each block renders correctly
- Theme-driven props resolve to CSS variables
- Polymorphic blocks (`Box`, `Text`, `Title`) accept `as` prop
- `withProps` works on every block

### 12.2 Integration tests

#### Token roundtrip (the key proof)

1. Add `colors.brand.500` to the theme
2. Run codegen
3. Verify `theme.css` contains `--color-brand-500`
4. Verify `tailwind.config.generated.js` exposes `brand` color family
5. Use `intent='brand'` in a soribashi-built component
6. Render the component
7. Assert the rendered DOM has `var(--color-brand-500)` in computed styles

#### Theme switching
- Verify light and dark CSS variables emit correctly
- Verify component renders pick up dark-mode token values when `.dark` is toggled

#### Generic component preservation
- Define a `Select<T>` in the test fixture
- Verify the type parameter survives `Component.withProps`
- Verify `onChange` receives the correctly typed argument

### 12.3 Browser / visual tests

Playwright on the playground "theme lab" route. Covers:

- Light and dark mode for all blocks
- The default intent resolver for all `(intent, variant)` combinations
- Custom scope (`.claim-view-islands`) rendering
- The adapted `Button` from the assured codebase
- Theme override via `Component.extend` produces the expected CSS

---

## 13. Hard Rules

1. CSS custom properties are always the runtime substrate. Soribashi components consume them via the resolver pattern.
2. Components do not make color decisions. Color × variant lives in `theme.intentResolver`, called by the framework.
3. The theme is the contract. `createTheme()` is the only authority for tokens, semantic mappings, intent resolution, and component defaults.
4. Codegen is the only path to a Tailwind config that soribashi components depend on. Hand-edited Tailwind configs are out of contract.
5. `defineComponent`, `defineGenericComponent`, and `definePolymorphicComponent` are the daily-use API. Lower-level primitives are escape hatches, not the recommended path.
6. Generated artifacts (`theme.css`, `tailwind.config.generated.js`) are committed to git for inspectability.
7. Soribashi must not require Tailwind v4. Both v3 and v4 are first-class targets.
8. Soribashi must not require shadcn. shadcn is not a substrate, not a dependency, not a recommendation.
9. CSS Modules and Tailwind are both first-class styling substrates inside `defineComponent`. Neither is privileged.
10. Application components (`Button`, `Input`, `Modal`, etc.) are not part of soribashi. Layout blocks are.
11. Generic component support (`defineGenericComponent`) is in v1, not deferred. The implementation cost is paid once; users get correct typing forever.
12. The default intent resolver covers `'filled' | 'outline' | 'subtle' | 'ghost' | 'link'` over any theme intent. Adding new variants requires updating both the resolver and the theme's variant list.
13. All implementation MUST validate against Mantine's actual published source code, not high-level documentation, not this spec's summaries, not inferred behavior. Soribashi heavily derives its patterns from Mantine (`factory`, `useProps`, `useStyles`, intent resolver, `Component.extend`, `withProps`, polymorphic and generic factories). When implementing any of these, the implementer must reference Mantine's current source at [github.com/mantinedev/mantine](https://github.com/mantinedev/mantine) as the ground truth for the patterns. This spec describes intent and intentional divergences (substrate-agnostic styling, `defineComponent`'s reduced ceremony, auto-derived CSS variable naming, layered surface elevation, etc.); the actual mechanics of how factory/useProps/useStyles work in practice come from Mantine's source. Every divergence from Mantine must be deliberate and documented in the implementation PR; accidental drift is a regression.

    **Validated:** Full audit pass completed 2026-04-25 against Mantine commit `63dafbbf5f0135eb36455b7add4c0ddcd0f3240a`. Coverage manifest at `docs/superpowers/audits/2026-04-25-coverage-manifest.md` lists every TS/TSX file in scope with its Mantine analog and divergence status. 11 real bugs were caught and fixed across the audit; 50+ intentional divergences are recorded in `docs/superpowers/divergences/mantine-master.md`.
14. Soribashi MAY depend on `@mantine/hooks` as a runtime dependency. The hooks package (`useDisclosure`, `useClickOutside`, `useResizeObserver`, `useFocusTrap`, etc.) is small, well-tested, MIT-licensed, and high-quality. Reimplementing it would be wasted effort and a downgrade. Soribashi MUST NOT depend on `@mantine/core` (we deliberately reimplement those patterns to fit our substrate-agnostic and user-friendliness goals); only the hooks package is allowed.

---

## 14. Open Questions

These are intentionally unresolved and to be decided during implementation.

1. Generic component + polymorphic component intersection — should `defineGenericPolymorphicComponent` exist, or is requiring the escape hatch acceptable for the rare case?
2. How aggressively should the framework lint or block hand-written color classes inside CVA recipes (beyond what the generated Tailwind config already prevents)?
3. What's the right shape for the `tailwindPassthrough` escape hatch (Tremor, etc.)?
4. The `vars` field's automatic naming convention (`--{component}-{key}` vs. user-specified) — is the auto-naming fully sufficient or do power users need a `prefix` config field for shorter names like `--btn-*`?
5. Theme switching at runtime (multi-theme provider, dynamic tenant switching) — v1 or v2?
6. Should the playground app expose a published "theme lab" experience, or is a private dev page enough for v1?

---

## 15. Success Criteria

The project is on track when the assured `core-radix` library can:

- Define its theme using `createTheme()` and have codegen produce its Tailwind config
- Author components using `defineComponent` with the standard Mantine-style API ergonomics
- Use generic components (`defineGenericComponent`) for `Select`, `ComboBox`, etc.
- Use polymorphic components (`definePolymorphicComponent`) for `Box`, `Text`, `Title`
- Apply theme-level overrides via `Component.extend` and `Component.withProps`
- Layer CSS Modules or Tailwind classes per component without API differences
- Replace duplicated style code (e.g., `iconColorClasses` between `Button` and `ButtonDropdown`) with a single intent resolver
- Prove a token roundtrip end to end
- Render the same component identically across all multi-tenant theme combinations

When these are all working, soribashi is ready for internal validation — and ready to be considered for public release.
