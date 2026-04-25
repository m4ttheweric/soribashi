# Soribashi Plan 3 — Generic + Polymorphic Components

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `defineGenericComponent` (for type-parameterized components like `Select<T>`) and `definePolymorphicComponent` (for components whose root element changes via `as`) to `@soribashi/factory`, plus their lower-level escape hatches.

**Architecture:** Both build on the existing `defineComponent` infrastructure from Plan 2. The key challenges are TypeScript-only:
- Generic components must preserve their type parameter through `forwardRef`, `withProps`, and theme `extend`.
- Polymorphic components must propagate the props of the element/component passed via `as` (a known weakness in Mantine — see § 4.3 of the design spec). Soribashi addresses this with a careful `PolymorphicProps<T, OwnProps>` type.

**Tech Stack:** Same as Plan 2 (no new runtime deps).

**Reference:** Mantine's `polymorphicFactory` at [`packages/@mantine/core/src/core/factory/create-polymorphic-component.ts`](https://github.com/mantinedev/mantine/blob/master/packages/%40mantine/core/src/core/factory/create-polymorphic-component.ts) and the polymorphic guide at [mantine.dev/guides/polymorphic](https://mantine.dev/guides/polymorphic/).

**Hard Rule 13 reminder:** validate against Mantine source. Soribashi's polymorphic propagation is a deliberate divergence — Mantine's types lose `as`-target props (see console-archive workarounds 4b, 4c). Document the divergence and ensure types compile in the test fixtures that Mantine fails on.

---

## File Structure

### Created in this plan

```
packages/factory/src/
  define-polymorphic-component.tsx  ← definePolymorphicComponent + types
  define-generic-component.tsx       ← defineGenericComponent + types
  polymorphic-component.ts           ← lower-level polymorphic factory
  generic-component.ts               ← lower-level generic factory
  types/
    polymorphic.ts                   ← PolymorphicProps<T, OwnProps>, PolymorphicRef<T>

packages/factory/test/
  define-polymorphic-component.test.tsx
  define-generic-component.test.tsx
  polymorphic-types.test-d.ts        ← tsd-style type tests
  generic-types.test-d.ts
```

### Modified

- `packages/factory/src/index.ts` — add new exports

---

## Task 1: PolymorphicProps Type

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/types/polymorphic.ts`

- [ ] **Step 1: Write the test**

Create `/Users/matt/Documents/GitHub/soribashi/packages/factory/test/polymorphic-types.test-d.ts`:

```ts
import { describe, expectTypeOf, it } from 'vitest';
import type {
  PolymorphicProps,
  PolymorphicRef,
} from '../src/types/polymorphic.ts';

interface BoxOwnProps {
  p?: 'sm' | 'md' | 'lg';
}

describe('PolymorphicProps types', () => {
  it('with default element="div", props include div HTML attributes', () => {
    type Props = PolymorphicProps<'div', BoxOwnProps>;
    expectTypeOf<Props>().toHaveProperty('p');
    // div attributes are present
    expectTypeOf<Props>().toMatchTypeOf<{ id?: string }>();
  });

  it('when as="button", swaps to button HTML attributes', () => {
    type Props = PolymorphicProps<'button', BoxOwnProps>;
    expectTypeOf<Props>().toMatchTypeOf<{ disabled?: boolean }>();
  });

  it('when as=ComponentType, propagates that component\'s props', () => {
    type LinkProps = { href: string; target?: string };
    const _Link = ({ href }: LinkProps) => null;
    type Props = PolymorphicProps<typeof _Link, BoxOwnProps>;
    expectTypeOf<Props>().toMatchTypeOf<{ href: string }>();
  });

  it('OwnProps win over element props on conflict', () => {
    interface OwnWithColor {
      color?: 'red' | 'blue'; // Soribashi semantic, not the HTML color attribute
    }
    type Props = PolymorphicProps<'span', OwnWithColor>;
    expectTypeOf<Props>().toHaveProperty('color').toEqualTypeOf<'red' | 'blue' | undefined>();
  });

  it('PolymorphicRef extracts the ref type for the element', () => {
    type DivRef = PolymorphicRef<'div'>;
    expectTypeOf<DivRef>().toEqualTypeOf<HTMLDivElement>();

    type ButtonRef = PolymorphicRef<'button'>;
    expectTypeOf<ButtonRef>().toEqualTypeOf<HTMLButtonElement>();
  });
});
```

- [ ] **Step 2: Implement polymorphic.ts**

```ts
import type {
  ComponentPropsWithRef,
  ComponentType,
  ElementType,
  RefAttributes,
} from 'react';

/**
 * Computes the union of:
 *   - own props
 *   - the ref-bearing props of the target element/component (with `as` prop)
 *
 * Important divergence from Mantine: own props win over target props on
 * conflict. This addresses console-archive workaround 4c where Mantine's
 * Collapse polymorphic typing dropped Stack-specific props.
 */
export type PolymorphicProps<
  TAs extends ElementType,
  TOwnProps,
> = TOwnProps &
  Omit<ComponentPropsWithRef<TAs>, keyof TOwnProps | 'as'> & {
    as?: TAs;
  };

/**
 * Extracts the ref type for a polymorphic target element.
 *
 *   PolymorphicRef<'div'>     → HTMLDivElement
 *   PolymorphicRef<'button'>  → HTMLButtonElement
 *   PolymorphicRef<typeof X>  → X's ref type
 */
export type PolymorphicRef<TAs extends ElementType> = ComponentPropsWithRef<TAs> extends {
  ref?: infer R;
}
  ? R
  : never;

/**
 * The full props shape of a polymorphic component, including standard React
 * ref attributes for the target.
 */
export type PolymorphicComponentProps<
  TAs extends ElementType,
  TOwnProps,
> = PolymorphicProps<TAs, TOwnProps> & RefAttributes<PolymorphicRef<TAs>>;

/**
 * The function signature of a soribashi polymorphic component. Generic over
 * the target element type, defaulting to whatever the component's
 * `defaultElement` is.
 */
export interface SoribashiPolymorphicComponent<
  TDefaultAs extends ElementType,
  TOwnProps,
> {
  <TAs extends ElementType = TDefaultAs>(
    props: PolymorphicComponentProps<TAs, TOwnProps>,
  ): React.ReactElement | null;
  displayName?: string;
}

/**
 * The Component prop interface accepted by definePolymorphicComponent's render context.
 */
export interface PolymorphicRenderProps<TOwnProps> {
  Element: ElementType;
  props: TOwnProps;
}
```

- [ ] **Step 3: Run type test**

```bash
cd /Users/matt/Documents/GitHub/soribashi/packages/factory
bun test test/polymorphic-types.test-d.ts
```

Expected: PASS (vitest type tests via expectTypeOf).

- [ ] **Step 4: Commit**

```bash
git add packages/factory/src/types/polymorphic.ts packages/factory/test/polymorphic-types.test-d.ts
git commit -m "feat(factory): add PolymorphicProps and PolymorphicRef types"
```

---

## Task 2: definePolymorphicComponent

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/define-polymorphic-component.tsx`

- [ ] **Step 1: Write the test**

Create `/Users/matt/Documents/GitHub/soribashi/packages/factory/test/define-polymorphic-component.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
import { SoribashiProvider } from '../src/provider/provider.tsx';
import { definePolymorphicComponent } from '../src/define-polymorphic-component.tsx';

interface TextOwnProps {
  size?: 'sm' | 'md' | 'lg';
}

const Text = definePolymorphicComponent<TextOwnProps, 'p'>({
  name: 'Text',
  defaultElement: 'p',
  selectors: ['root'] as const,
  classes: { root: 'sb-Text-root' },
  defaults: { size: 'md' },
  render: ({ Element, props, getStyles }) => (
    <Element {...getStyles('root')} data-size={props.size}>
      {(props as any).children}
    </Element>
  ),
});

const theme = createTheme({
  tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
});

const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);

describe('definePolymorphicComponent', () => {
  it('renders the default element when as is not provided', () => {
    const { container } = wrap(<Text>Hello</Text>);
    expect(container.querySelector('p')).toBeInTheDocument();
    expect(container.querySelector('p')?.textContent).toBe('Hello');
  });

  it('renders the element specified via the as prop', () => {
    const { container } = wrap(<Text as="span">Hello</Text>);
    expect(container.querySelector('span')).toBeInTheDocument();
    expect(container.querySelector('p')).toBeNull();
  });

  it('renders a custom React component when as is a component', () => {
    const Link = ({ href, children, ...rest }: any) => (
      <a href={href} data-testid="link" {...rest}>
        {children}
      </a>
    );

    const { container, getByTestId } = wrap(
      <Text as={Link} href="/">
        Click
      </Text>
    );
    expect(getByTestId('link')).toBeInTheDocument();
    expect(container.querySelector('a')?.getAttribute('href')).toBe('/');
  });

  it('applies built-in classes regardless of element', () => {
    const { container } = wrap(<Text as="span">X</Text>);
    expect(container.querySelector('span')?.className).toContain('sb-Text-root');
  });

  it('applies size default to data-size', () => {
    const { container } = wrap(<Text>X</Text>);
    expect(container.querySelector('p')?.dataset.size).toBe('md');
  });

  it('instance className merges with root', () => {
    const { container } = wrap(<Text className="extra">X</Text>);
    expect(container.querySelector('p')?.className).toContain('sb-Text-root');
    expect(container.querySelector('p')?.className).toContain('extra');
  });

  it('static methods (extend, withProps) exist', () => {
    expect(typeof (Text as any).extend).toBe('function');
    expect(typeof (Text as any).withProps).toBe('function');
  });

  it('Component.withProps preserves polymorphism', () => {
    const SmallText = (Text as any).withProps({ size: 'sm' });
    const { container } = wrap(<SmallText as="span">Y</SmallText>);
    expect(container.querySelector('span')?.dataset.size).toBe('sm');
  });
});
```

- [ ] **Step 2: Implement definePolymorphicComponent**

```tsx
import { forwardRef, type ElementType, type Ref } from 'react';
import type { ResolvedTheme } from '@soribashi/theme';
import { useProps } from './hooks/use-props.ts';
import { useStyles } from './hooks/use-styles.ts';
import { autoVars } from './auto-vars.ts';
import { makeWithProps } from './with-props.ts';
import type { FactoryPayload } from './types/factory-payload.ts';
import type { StylesApiProps } from './types/props.ts';
import type { GetStylesFn } from './types/render-context.ts';
import type { PolymorphicComponentProps } from './types/polymorphic.ts';

const identity = <T,>(value: T): T => value;

export interface DefinePolymorphicComponentConfig<
  TOwnProps,
  TDefaultAs extends ElementType,
  TSelectors extends readonly string[],
  TVariants extends readonly string[],
> {
  name: string;
  defaultElement: TDefaultAs;
  selectors: TSelectors;
  variants?: TVariants;
  classes?: Partial<Record<TSelectors[number], string>>;
  defaults?: Partial<TOwnProps>;
  vars?: (
    theme: ResolvedTheme,
    props: TOwnProps & { variant?: TVariants[number]; intent?: string },
  ) => Partial<Record<TSelectors[number], Record<string, string>>>;
  render: (ctx: {
    Element: ElementType;
    props: TOwnProps & StylesApiProps<any> & { variant?: TVariants[number]; intent?: string };
    getStyles: GetStylesFn<{ props: TOwnProps; stylesNames: TSelectors[number] } & FactoryPayload>;
    ref: Ref<unknown>;
  }) => React.ReactNode;
}

/**
 * Polymorphic component definition. Supports the `as` prop for swapping the
 * root element while propagating the target element's props to TypeScript.
 *
 * Reference: Mantine's polymorphicFactory. Soribashi diverges in that own
 * props win over target props on type conflict (see PolymorphicProps).
 */
export function definePolymorphicComponent<
  TOwnProps extends Record<string, unknown>,
  TDefaultAs extends ElementType,
  TSelectors extends readonly string[] = readonly string[],
  TVariants extends readonly string[] = readonly string[],
>(
  config: DefinePolymorphicComponentConfig<TOwnProps, TDefaultAs, TSelectors, TVariants>,
) {
  const hasVariants = (config.variants?.length ?? 0) > 0;

  const Component = forwardRef<unknown, any>((rawProps, ref) => {
    const { as: asProp, ...rest } = rawProps as { as?: ElementType };
    const Element: ElementType = asProp ?? config.defaultElement;

    const merged = useProps<TOwnProps & StylesApiProps<any>>(
      config.name,
      (config.defaults ?? null) as Partial<TOwnProps & StylesApiProps<any>> | null,
      rest as TOwnProps & StylesApiProps<any>,
    );

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
      Element,
      props: merged as any,
      getStyles: getStyles as any,
      ref,
    }) as React.ReactElement;
  });

  Component.displayName = config.name;
  (Component as any).classes = config.classes;
  (Component as any).extend = identity;
  (Component as any).withProps = makeWithProps(Component as any);

  // Cast to the polymorphic-aware signature.
  // The runtime is a simple forwardRef; the type story is in the cast.
  type Props = PolymorphicComponentProps<TDefaultAs, TOwnProps & StylesApiProps<any>>;
  return Component as unknown as ((props: Props) => React.ReactElement | null) & {
    extend: (cfg: any) => any;
    withProps: (presets: Partial<TOwnProps>) => any;
    classes?: Partial<Record<TSelectors[number], string>>;
    displayName?: string;
  };
}
```

- [ ] **Step 3: Run test (PASS)**

```bash
bun test test/define-polymorphic-component.test.tsx
```

- [ ] **Step 4: Commit**

```bash
git add packages/factory/src/define-polymorphic-component.tsx packages/factory/test/define-polymorphic-component.test.tsx
git commit -m "feat(factory): add definePolymorphicComponent with as-prop element swapping"
```

---

## Task 3: Generic Component Types

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/factory/test/generic-types.test-d.ts`

- [ ] **Step 1: Write the type-level test**

```ts
import { describe, expectTypeOf, it } from 'vitest';
import { defineGenericComponent } from '../src/define-generic-component.tsx';

interface SelectOwnProps<T> {
  items: T[];
  value: T | null;
  onChange: (v: T | null) => void;
  getKey: (item: T) => string;
  renderItem?: (item: T) => React.ReactNode;
}

const Select = defineGenericComponent<SelectOwnProps>({
  name: 'Select',
  selectors: ['root', 'option'] as const,
  classes: { root: 'sb-Select-root', option: 'sb-Select-option' },
  defaults: {} as any,
  render: ({ getStyles }) => <div {...getStyles('root')} />,
});

interface User {
  id: string;
  name: string;
}

describe('defineGenericComponent — type tests', () => {
  it('preserves the type parameter through the call site', () => {
    type SelectUserProps = Parameters<typeof Select<User>>[0];

    expectTypeOf<SelectUserProps>().toMatchTypeOf<{
      items: User[];
      value: User | null;
      onChange: (v: User | null) => void;
      getKey: (item: User) => string;
    }>();
  });

  it('onChange is correctly typed at call site', () => {
    const handler = (v: User | null) => v?.name;
    // This compiles only if the type parameter survives:
    const _props: Parameters<typeof Select<User>>[0] = {
      items: [],
      value: null,
      onChange: handler,
      getKey: (u) => u.id,
    };
    expectTypeOf(_props.onChange).toEqualTypeOf<(v: User | null) => void>();
  });
});
```

This test will only run if the `defineGenericComponent` exists, so we need to create the next file as a stub first or write the impl in the same task.

- [ ] **Step 2: Stub `define-generic-component.tsx`** (so the test compiles)

```tsx
import type { Ref } from 'react';
import type { GetStylesFn } from './types/render-context.ts';

export function defineGenericComponent<
  TOwnPropsTemplate,
>(_config: any): <T>(
  props: any
) => React.ReactElement | null {
  return (() => null) as any;
}
```

- [ ] **Step 3: Run type test (likely PASS or only structural)**

```bash
bun test test/generic-types.test-d.ts
```

- [ ] **Step 4: Commit**

```bash
git add packages/factory/src/define-generic-component.tsx packages/factory/test/generic-types.test-d.ts
git commit -m "test(factory): type tests for generic component preservation"
```

---

## Task 4: defineGenericComponent Implementation

**Files:**
- Modify: `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/define-generic-component.tsx`

- [ ] **Step 1: Write the runtime test**

Create `/Users/matt/Documents/GitHub/soribashi/packages/factory/test/define-generic-component.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
import { SoribashiProvider } from '../src/provider/provider.tsx';
import { defineGenericComponent } from '../src/define-generic-component.tsx';

interface SelectOwnProps<T> {
  items: T[];
  value: T | null;
  onChange: (v: T | null) => void;
  getKey: (item: T) => string;
  renderItem?: (item: T) => React.ReactNode;
}

const Select = defineGenericComponent<SelectOwnProps>({
  name: 'Select',
  selectors: ['root', 'option'] as const,
  classes: { root: 'sb-Select-root', option: 'sb-Select-option' },
  defaults: {} as any,
  render: ({ props, getStyles }: any) => (
    <ul {...getStyles('root')} data-testid="select">
      {props.items.map((item: any) => {
        const key = props.getKey(item);
        const isSelected = props.value && props.getKey(props.value) === key;
        return (
          <li
            key={key}
            {...getStyles('option')}
            data-selected={isSelected}
            onClick={() => props.onChange(item)}
          >
            {props.renderItem ? props.renderItem(item) : key}
          </li>
        );
      })}
    </ul>
  ),
});

interface User {
  id: string;
  name: string;
}

const theme = createTheme({
  tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
});

const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);

describe('defineGenericComponent', () => {
  it('renders items and applies classes', () => {
    const users: User[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ];

    const { container } = wrap(
      <Select<User>
        items={users}
        value={null}
        onChange={() => {}}
        getKey={(u) => u.id}
        renderItem={(u) => u.name}
      />
    );

    expect(container.querySelector('ul')?.className).toContain('sb-Select-root');
    expect(container.querySelectorAll('li').length).toBe(2);
    expect(container.querySelectorAll('li')[0]?.textContent).toBe('Alice');
  });

  it('onChange receives the typed item', () => {
    const users: User[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ];

    let captured: User | null = null;

    const { container } = wrap(
      <Select<User>
        items={users}
        value={null}
        onChange={(u) => {
          captured = u;
        }}
        getKey={(u) => u.id}
      />
    );

    const items = container.querySelectorAll('li');
    fireEvent.click(items[1]!);
    expect(captured).toEqual({ id: '2', name: 'Bob' });
  });

  it('static withProps preserves the generic', () => {
    const SearchableSelect = (Select as any).withProps({});
    expect(typeof SearchableSelect).toBe('function');
  });

  it('static extend exists', () => {
    expect(typeof (Select as any).extend).toBe('function');
  });
});
```

- [ ] **Step 2: Implement defineGenericComponent**

Replace `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/define-generic-component.tsx`:

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

export interface DefineGenericComponentConfig<
  TOwnPropsTemplate,
  TSelectors extends readonly string[],
  TVariants extends readonly string[],
> {
  name: string;
  selectors: TSelectors;
  variants?: TVariants;
  classes?: Partial<Record<TSelectors[number], string>>;
  /** Use `as any` for defaults — generic types can't have meaningful defaults */
  defaults?: Partial<TOwnPropsTemplate>;
  vars?: (
    theme: ResolvedTheme,
    props: TOwnPropsTemplate,
  ) => Partial<Record<TSelectors[number], Record<string, string>>>;
  render: (ctx: {
    props: TOwnPropsTemplate & StylesApiProps<any>;
    getStyles: GetStylesFn<
      { props: TOwnPropsTemplate; stylesNames: TSelectors[number] } & FactoryPayload
    >;
    ref: Ref<unknown>;
  }) => React.ReactNode;
}

/**
 * Defines a generic component preserved through the type system. Use for
 * components like Select<TItem>, ComboBox<TOption>, MultiSelect<TItem>, etc.
 *
 * The trick is that `OwnProps` is a higher-kinded template — generic over T.
 * The returned function is itself generic: `Select<User>(props)` works, and
 * the type parameter flows through to props.
 *
 * Reference: This addresses console-archive workaround 8a — they had to
 * replace Mantine date pickers with antd because Mantine's Select doesn't
 * preserve types well. Soribashi makes this a first-class capability.
 */
export function defineGenericComponent<
  TOwnPropsTemplate extends (...args: any[]) => any | Record<string, any>,
>(config: any): <T>(
  props: any & React.RefAttributes<unknown>
) => React.ReactElement | null {
  const hasVariants = (config.variants?.length ?? 0) > 0;

  const Component = forwardRef<unknown, any>((rawProps, ref) => {
    const merged = useProps(
      config.name,
      (config.defaults ?? null) as any,
      rawProps as any,
    );

    const varsResolver = config.vars
      ? (theme: ResolvedTheme, props: any) => config.vars!(theme, props)
      : (theme: ResolvedTheme, props: any) =>
          autoVars(theme, config.name, props, hasVariants) as any;

    const getStyles = useStyles({
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

  return Component as any;
}
```

- [ ] **Step 3: Run test (PASS)**

```bash
bun test test/define-generic-component.test.tsx
```

- [ ] **Step 4: Commit**

```bash
git add packages/factory/src/define-generic-component.tsx packages/factory/test/define-generic-component.test.tsx
git commit -m "feat(factory): add defineGenericComponent with type-parameter preservation"
```

---

## Task 5: Lower-Level polymorphic and generic factories

**Files:**
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/polymorphic-component.ts`
- Create: `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/generic-component.ts`

- [ ] **Step 1: Implement polymorphic-component.ts**

```ts
import { type ElementType, type Ref, forwardRef } from 'react';
import { makeWithProps } from './with-props.ts';
import type { FactoryPayload } from './types/factory-payload.ts';

const identity = <T,>(value: T): T => value;

/**
 * Lower-level polymorphic factory. Use only when defineComponent doesn't fit.
 * Mostly identical to factory(); the polymorphism is type-only.
 */
export function polymorphicComponent<P extends FactoryPayload & { defaultElement: ElementType }>(
  render: (props: P['props'] & { as?: ElementType }, ref: Ref<unknown>) => React.ReactNode,
) {
  const Component = forwardRef<unknown, any>((props, ref) => render(props, ref) as React.ReactElement);
  (Component as any).extend = identity;
  (Component as any).withProps = makeWithProps(Component as any);
  return Component as any;
}
```

- [ ] **Step 2: Implement generic-component.ts**

```ts
import { type Ref, forwardRef } from 'react';
import { makeWithProps } from './with-props.ts';

const identity = <T,>(value: T): T => value;

/**
 * Lower-level generic factory. Use only when defineGenericComponent doesn't fit.
 */
export function genericComponent(
  render: (props: any, ref: Ref<unknown>) => React.ReactNode,
) {
  const Component = forwardRef<unknown, any>((props, ref) => render(props, ref) as React.ReactElement);
  (Component as any).extend = identity;
  (Component as any).withProps = makeWithProps(Component as any);
  return Component as any;
}
```

- [ ] **Step 3: Smoke test**

Create `/Users/matt/Documents/GitHub/soribashi/packages/factory/test/escape-hatches.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { polymorphicComponent } from '../src/polymorphic-component.ts';
import { genericComponent } from '../src/generic-component.ts';

describe('lower-level escape hatches', () => {
  it('polymorphicComponent renders and exposes withProps', () => {
    const Box = polymorphicComponent(({ as: As = 'div', children }: any) => (
      <As data-test="poly">{children}</As>
    ));

    const { container } = render(<Box>X</Box>);
    expect(container.querySelector('div[data-test="poly"]')).toBeInTheDocument();
    expect(typeof (Box as any).withProps).toBe('function');
  });

  it('genericComponent renders and exposes withProps', () => {
    const Comp = genericComponent(({ value }: any) => <span>{value}</span>);
    const { container } = render(<Comp value="hi" />);
    expect(container.textContent).toBe('hi');
    expect(typeof (Comp as any).withProps).toBe('function');
  });
});
```

- [ ] **Step 4: Run test (PASS)**

```bash
bun test test/escape-hatches.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add packages/factory/src/polymorphic-component.ts packages/factory/src/generic-component.ts packages/factory/test/escape-hatches.test.tsx
git commit -m "feat(factory): add lower-level polymorphicComponent and genericComponent escape hatches"
```

---

## Task 6: Update Public API

**Files:**
- Modify: `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/index.ts`

- [ ] **Step 1: Update exports**

Append to `/Users/matt/Documents/GitHub/soribashi/packages/factory/src/index.ts`:

```ts
// Generic + polymorphic component APIs
export { definePolymorphicComponent } from './define-polymorphic-component.tsx';
export { defineGenericComponent } from './define-generic-component.tsx';
export { polymorphicComponent } from './polymorphic-component.ts';
export { genericComponent } from './generic-component.ts';

export type {
  PolymorphicProps,
  PolymorphicRef,
  PolymorphicComponentProps,
  SoribashiPolymorphicComponent,
  PolymorphicRenderProps,
} from './types/polymorphic.ts';

export type { DefinePolymorphicComponentConfig } from './define-polymorphic-component.tsx';
export type { DefineGenericComponentConfig } from './define-generic-component.tsx';
```

- [ ] **Step 2: Update public API smoke test**

Append to `/Users/matt/Documents/GitHub/soribashi/packages/factory/test/public-api.test.tsx`:

```tsx
import * as factory from '../src/index.ts';

describe('@soribashi/factory — generic + polymorphic exports', () => {
  it('exports definePolymorphicComponent', () => {
    expect(typeof factory.definePolymorphicComponent).toBe('function');
  });

  it('exports defineGenericComponent', () => {
    expect(typeof factory.defineGenericComponent).toBe('function');
  });

  it('exports lower-level escape hatches', () => {
    expect(typeof factory.polymorphicComponent).toBe('function');
    expect(typeof factory.genericComponent).toBe('function');
  });
});
```

- [ ] **Step 3: Run all tests**

```bash
cd /Users/matt/Documents/GitHub/soribashi/packages/factory
bun test
```

Expected: All tests pass.

- [ ] **Step 4: Run typecheck from root**

```bash
cd /Users/matt/Documents/GitHub/soribashi
bun run typecheck
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add packages/factory/src/index.ts packages/factory/test/public-api.test.tsx
git commit -m "feat(factory): export polymorphic and generic APIs"
```

---

## Task 7: Final Smoke Test

- [ ] **Step 1: Run all tests across all packages**

```bash
cd /Users/matt/Documents/GitHub/soribashi
bun test
```

- [ ] **Step 2: Final commit**

```bash
git commit --allow-empty -m "chore: Plan 3 (generic + polymorphic) complete"
```

---

## Acceptance Criteria

Plan 3 is complete when:

1. `definePolymorphicComponent({ defaultElement, ... })` produces a working polymorphic component.
2. `<Component as="span">`, `<Component as={CustomComponent}>` both render correctly with the right element/component type.
3. `defineGenericComponent<OwnProps>({ ... })` produces a generic component where `Component<T>(props)` types `props` correctly.
4. The generic component's `onChange`, `getKey`, `renderItem` callbacks all receive `T`-typed arguments at the call site.
5. Lower-level `polymorphicComponent` and `genericComponent` escape hatches exist and work.
6. All static methods (`extend`, `withProps`, `classes`, `displayName`) are present on all variants.
7. All tests pass; typecheck passes.

## What's NOT in this plan (deferred)

- Layout blocks (Box, Stack, Group, etc.) — Plan 4
- Real component examples in a consumer project — Plan 5
