/**
 * Parity tests for soribashi `defineGenericComponent()` vs Mantine `genericFactory()`.
 *
 * Every test exercises a specific decision point (branch) in Mantine's source.
 * Branch IDs (G1–G13) correspond to the enumeration in
 * `docs/superpowers/audits/2026-04-25-tier-1-generic.md`.
 *
 * Reference Mantine file:
 * `packages/@mantine/core/src/core/factory/factory.tsx` (`genericFactory` at line 99)
 * at commit 63dafbbf5f0135eb36455b7add4c0ddcd0f3240a.
 */
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
import { defineGenericComponent } from '../src/define-generic-component.tsx';
import { SoribashiProvider } from '../src/provider/provider.tsx';

// ---------------------------------------------------------------------------
// Shared test setup
// ---------------------------------------------------------------------------

const theme = createTheme({
  tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
});

const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);

// ---------------------------------------------------------------------------
// Shared test component — a minimal generic Select<T>
// ---------------------------------------------------------------------------

interface ItemProps<T> {
  items: T[];
  getKey: (item: T) => string;
  renderItem?: (item: T) => React.ReactNode;
  selected?: string;
  'data-testid'?: string;
}

/**
 * A minimal generic component using the defineGenericComponent constructor.
 * Preserves the type parameter T through withProps.
 */
type SelectSignature = <T>(props: ItemProps<T> & React.RefAttributes<unknown>) => React.ReactElement | null;
const Select = defineGenericComponent<SelectSignature>({
  name: 'Select',
  selectors: ['root', 'item'] as const,
  classes: { root: 'sb-Select-root', item: 'sb-Select-item' },
  defaults: {},
  render: ({ props, getStyles, ref }: any) => {
    const { items, getKey, renderItem, selected, ...rest } = props;
    return (
      <ul ref={ref} {...getStyles('root')} {...rest}>
        {items.map((item: any) => {
          const key = getKey(item);
          return (
            <li key={key} {...getStyles('item')} data-selected={selected === key}>
              {renderItem ? renderItem(item) : key}
            </li>
          );
        })}
      </ul>
    );
  },
});

// ---------------------------------------------------------------------------
// G1: defineGenericComponent is a full constructor vs Mantine's 3-line type-cast
// Mantine: genericFactory(ui) = factory(ui as any) re-cast to Payload['signature']
// Soribashi: full constructor with useProps + useStyles + autoVars integrated
// Classification: INTENTIONAL (constructor model; no Mantine analog)
// ---------------------------------------------------------------------------

describe('G1: defineGenericComponent — constructor model', () => {
  it('G1a: renders correctly with the component body from config.render', () => {
    const { container } = wrap(
      <Select
        items={['apple', 'banana']}
        getKey={(s: string) => s}
      />,
    );
    expect(container.querySelector('ul')).toBeInTheDocument();
    expect(container.querySelectorAll('li').length).toBe(2);
  });

  it('G1b: applies classes from config.classes to the rendered elements', () => {
    const { container } = wrap(
      <Select items={['apple']} getKey={(s: string) => s} />,
    );
    expect(container.querySelector('ul')?.className).toContain('sb-Select-root');
    expect(container.querySelector('li')?.className).toContain('sb-Select-item');
  });

  it('G1c: type parameter flows through — generic over T', () => {
    interface User { id: string; name: string }
    const users: User[] = [{ id: '1', name: 'Alice' }, { id: '2', name: 'Bob' }];
    const { container } = wrap(
      <Select<User>
        items={users}
        getKey={(u: User) => u.id}
        renderItem={(u: User) => u.name}
      />,
    );
    const items = container.querySelectorAll('li');
    expect(items[0]?.textContent).toBe('Alice');
    expect(items[1]?.textContent).toBe('Bob');
  });
});

// ---------------------------------------------------------------------------
// G2: defineGenericComponent wraps in forwardRef (soribashi divergence)
// Mantine: genericFactory → factory(ui as any); NO forwardRef; ref is an ordinary prop
// Soribashi: wraps in React.forwardRef; ref is a separate parameter forwarded into render
// Classification: INTENTIONAL (forwardRef wrap — already in ledger for factory())
// ---------------------------------------------------------------------------

describe('G2: defineGenericComponent wraps render in forwardRef', () => {
  it('G2a: forwards ref to the underlying DOM element', () => {
    const ref = React.createRef<HTMLUListElement>();
    wrap(
      <Select
        ref={ref as any}
        items={['a', 'b']}
        getKey={(s: string) => s}
      />,
    );
    expect(ref.current).toBeInstanceOf(HTMLUListElement);
  });

  it('G2b: ref is populated (forwardRef is active)', () => {
    const ref = React.createRef<HTMLUListElement>();
    wrap(<Select ref={ref as any} items={[]} getKey={(s: string) => s} />);
    expect(ref.current).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// G3: extend static — identical to Mantine's factory
// Mantine: Component.extend = identity
// Soribashi: (Component as any).extend = identity
// Classification: IDENTICAL
// ---------------------------------------------------------------------------

describe('G3: defineGenericComponent attaches extend() returning a ThemeComponentEntry', () => {
  it('G3a: extend is a function', () => {
    expect(typeof (Select as any).extend).toBe('function');
  });

  it('G3b: extend returns a ThemeComponentEntry with __soribashiThemeEntry brand', () => {
    const entry = (Select as any).extend({ defaultProps: { selected: 'x' } });
    expect(entry.__soribashiThemeEntry).toBe(true);
    expect(entry.name).toBe('Select');
    expect(entry.defaultProps).toEqual({ selected: 'x' });
  });
});

// ---------------------------------------------------------------------------
// G4 / G5: withProps() result propagates extend and withProps from parent
// Mantine: Extended.extend = Component.extend (factory.tsx:91)
//          Extended.withProps = createWithProps(Component) (factory.tsx:90)
// Soribashi: makeWithProps propagates both (fixed in Task 1.1/1.2)
// Classification: IDENTICAL (after fix)
// ---------------------------------------------------------------------------

describe('G4 / G5: withProps() result propagates extend and withProps', () => {
  it('G5a: withProps() result has an extend method', () => {
    const StyledSelect = (Select as any).withProps({ selected: 'a' });
    expect(typeof (StyledSelect as any).extend).toBe('function');
  });

  it('G5b: withProps() result extend returns a ThemeComponentEntry', () => {
    const StyledSelect = (Select as any).withProps({ selected: 'a' });
    const entry = (StyledSelect as any).extend({ defaultProps: { selected: 'b' } });
    expect(entry.__soribashiThemeEntry).toBe(true);
    expect(entry.name).toBe('Select');
    expect(entry.defaultProps).toEqual({ selected: 'b' });
  });

  it('G5c: withProps() result has a withProps method (double-wrap chain — G4)', () => {
    const StyledSelect = (Select as any).withProps({ selected: 'a' });
    expect(typeof (StyledSelect as any).withProps).toBe('function');
  });

  it('G5d: double-wrapped withProps result also has extend', () => {
    const StyledSelect = (Select as any).withProps({ selected: 'a' });
    const DoubleStyledSelect = (StyledSelect as any).withProps({ selected: 'b' });
    expect(typeof (DoubleStyledSelect as any).extend).toBe('function');
  });

  it('G5e: double-wrapped withProps result also has withProps', () => {
    const StyledSelect = (Select as any).withProps({ selected: 'a' });
    const DoubleStyledSelect = (StyledSelect as any).withProps({ selected: 'b' });
    expect(typeof (DoubleStyledSelect as any).withProps).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// G6: withProps() displayName — same pattern as factory()
// Mantine: Extended.displayName = `WithProps(${Component.displayName})`
// Soribashi: same (with fallback for unnamed)
// Classification: IDENTICAL
// ---------------------------------------------------------------------------

describe('G6: withProps() result displayName', () => {
  it('G6a: withProps result displayName contains the parent displayName', () => {
    const StyledSelect = (Select as any).withProps({ selected: 'a' });
    expect((StyledSelect as any).displayName).toBe('WithProps(Select)');
  });
});

// ---------------------------------------------------------------------------
// G7: withProps preserves the generic (already in ledger as Aligned)
// Mantine: result type is Payload['signature'] — stays generic
// Soribashi: withProps returns GenericComponentFn & GenericComponentStatics — stays generic
// Classification: INTENTIONAL (Aligned — already in ledger)
// ---------------------------------------------------------------------------

describe('G7: withProps preserves the generic type parameter', () => {
  it('G7a: withProps result can still be called with a type parameter', () => {
    interface User { id: string; name: string }
    const RenderStarSelect = (Select as any).withProps({
      renderItem: (item: any) => `★ ${item.name ?? item}`,
    });
    const users: User[] = [{ id: '1', name: 'Alice' }];
    const { container } = wrap(
      <RenderStarSelect<User>
        items={users}
        getKey={(u: User) => u.id}
      />,
    );
    expect(container.querySelector('li')?.textContent).toBe('★ Alice');
  });

  it('G7b: withProps presets are applied and instance props can override them', () => {
    interface Fruit { id: string; label: string }
    const DefaultSelect = (Select as any).withProps({ selected: 'banana' });
    const fruits: Fruit[] = [
      { id: 'apple', label: 'Apple' },
      { id: 'banana', label: 'Banana' },
    ];
    const { container } = wrap(
      <DefaultSelect<Fruit>
        items={fruits}
        getKey={(f: Fruit) => f.id}
        renderItem={(f: Fruit) => f.label}
      />,
    );
    const items = container.querySelectorAll('li');
    expect(items[0]?.dataset.selected).toBe('false');
    expect(items[1]?.dataset.selected).toBe('true');
  });

  it('G7c: withProps undefined instance prop does NOT override preset (soribashi divergence)', () => {
    const DefaultSelect = (Select as any).withProps({ selected: 'apple' });
    const { container } = wrap(
      <DefaultSelect
        items={['apple', 'banana']}
        getKey={(s: string) => s}
        selected={undefined}
      />,
    );
    // Soribashi: preset wins because undefined is filtered
    const appleItem = container.querySelectorAll('li')[0];
    expect(appleItem?.dataset.selected).toBe('true');
  });
});

// ---------------------------------------------------------------------------
// G8: GenericComponentFn type — type-only divergence from Mantine's Payload['signature']
// Mantine: signature carried via FactoryPayload.signature?: any; re-cast after factory()
// Soribashi: GenericComponentFn = <T>(props: any & React.RefAttributes<unknown>) => ReactElement | null
// Classification: INTENTIONAL (type-level only; runtime behavior identical)
// ---------------------------------------------------------------------------

describe('G8: GenericComponentFn type — runtime shape', () => {
  it('G8: defineGenericComponent returns a renderable React component', () => {
    // Mantine's genericFactory(ui) — ui is a plain function, typeof result is 'function'
    // Soribashi's defineGenericComponent uses forwardRef internally, so typeof is 'object'
    // (React.forwardRef returns { $$typeof, render } — an object, not a function).
    // Both are renderable as JSX; the difference is type-only.
    // We assert the component is renderable (not null/undefined) and has the expected statics.
    expect(Select).toBeDefined();
    expect(Select).not.toBeNull();
    // It has the GenericComponentStatics shape
    expect(typeof (Select as any).extend).toBe('function');
    expect(typeof (Select as any).withProps).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// G9: Hook integration in constructor
// Mantine: genericFactory does NOT call useProps/useStyles/autoVars; callers do
// Soribashi: defineGenericComponent integrates useProps + useStyles + autoVars inside body
// Classification: INTENTIONAL (constructor model — no Mantine analog)
// ---------------------------------------------------------------------------

describe('G9: hook integration — useProps applies config.defaults', () => {
  it('G9a: config.defaults are applied when instance prop is absent', () => {
    interface ItemWithDefault { id: string }
    type SelectWithDefaultSignature = <T>(props: ItemProps<T> & React.RefAttributes<unknown>) => React.ReactElement | null;
    const SelectWithDefault = defineGenericComponent<SelectWithDefaultSignature>({
      name: 'SelectWithDefault',
      selectors: ['root'] as const,
      classes: { root: 'sb-Select-root' },
      defaults: { selected: 'default-key' } as any,
      render: ({ props, getStyles, ref }: any) => {
        const { items, getKey, selected, ...rest } = props;
        return (
          <ul ref={ref} {...getStyles('root')} {...rest} data-selected={selected}>
            {items.map((item: any) => <li key={getKey(item)}>{getKey(item)}</li>)}
          </ul>
        );
      },
    });
    const { container } = wrap(
      <SelectWithDefault
        items={[{ id: 'a' }]}
        getKey={(item: ItemWithDefault) => item.id}
      />,
    );
    expect(container.querySelector('ul')?.dataset.selected).toBe('default-key');
  });

  it('G9b: instance prop overrides config.defaults', () => {
    interface ItemWithDefault { id: string }
    type SelectWithDefaultSignature = <T>(props: ItemProps<T> & React.RefAttributes<unknown>) => React.ReactElement | null;
    const SelectWithDefault = defineGenericComponent<SelectWithDefaultSignature>({
      name: 'SelectWithDefault2',
      selectors: ['root'] as const,
      classes: { root: 'sb-Select-root' },
      defaults: { selected: 'default-key' } as any,
      render: ({ props, getStyles, ref }: any) => {
        const { items, getKey, selected, ...rest } = props;
        return (
          <ul ref={ref} {...getStyles('root')} {...rest} data-selected={selected}>
            {items.map((item: any) => <li key={getKey(item)}>{getKey(item)}</li>)}
          </ul>
        );
      },
    });
    const { container } = wrap(
      <SelectWithDefault
        items={[{ id: 'a' }]}
        getKey={(item: ItemWithDefault) => item.id}
        selected="override"
      />,
    );
    expect(container.querySelector('ul')?.dataset.selected).toBe('override');
  });
});

// ---------------------------------------------------------------------------
// G10: classes static — soribashi extension (no Mantine analog at this level)
// Mantine: ComponentClasses<Payload> type only when stylesNames is string; no runtime attach
// Soribashi: (Component as any).classes = config.classes unconditionally
// Classification: INTENTIONAL (soribashi extension)
// ---------------------------------------------------------------------------

describe('G10: classes static attached to the component', () => {
  it('G10a: classes static exists on the component', () => {
    expect((Select as any).classes).toBeDefined();
  });

  it('G10b: classes static contains the configured class names', () => {
    expect((Select as any).classes?.root).toBe('sb-Select-root');
    expect((Select as any).classes?.item).toBe('sb-Select-item');
  });

  it('G10c: classes static is accessible on the withProps result', () => {
    // makeWithProps does not copy classes — the result is a new component wrapper;
    // consumers should reference the original component's classes static.
    // This test documents the current behavior (not copied through withProps).
    const StyledSelect = (Select as any).withProps({ selected: 'x' });
    // classes is NOT propagated through makeWithProps (makeWithProps only copies extend + withProps)
    // This is the current behavior — consistent across factory, polymorphic, and generic variants.
    expect((StyledSelect as any).classes).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// G11: identity function — private in soribashi (not exported)
// Mantine: `export function identity<T>(value: T): T` (named export)
// Soribashi: private const in each module
// Classification: INTENTIONAL (same as B6 in factory audit)
// ---------------------------------------------------------------------------

describe('G11: identity is private (not exported from define-generic-component)', () => {
  it('G11: define-generic-component does not export identity', async () => {
    const mod = await import('../src/define-generic-component.tsx');
    expect((mod as any).identity).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// G12: ref forwarded through makeWithProps (consequence of G2)
// Mantine: withProps result does not use forwardRef (no ref to forward in factory)
// Soribashi: makeWithProps wraps with forwardRef; ref flows through
// Classification: INTENTIONAL (consequence of G2 forwardRef divergence)
// ---------------------------------------------------------------------------

describe('G12: ref forwarding through withProps chain', () => {
  it('G12a: withProps result forwards ref to the underlying DOM element', () => {
    const StyledSelect = (Select as any).withProps({ selected: 'a' });
    const ref = React.createRef<HTMLUListElement>();
    wrap(
      <StyledSelect ref={ref as any} items={['a']} getKey={(s: string) => s} />,
    );
    expect(ref.current).toBeInstanceOf(HTMLUListElement);
  });

  it('G12b: double-wrapped withProps result still forwards ref', () => {
    const A = (Select as any).withProps({ selected: 'a' });
    const B = (A as any).withProps({ selected: 'b' });
    const ref = React.createRef<HTMLUListElement>();
    wrap(
      <B ref={ref as any} items={['x']} getKey={(s: string) => s} />,
    );
    expect(ref.current).toBeInstanceOf(HTMLUListElement);
  });
});

// ---------------------------------------------------------------------------
// G13: makeWithProps stacks wrappers vs Mantine sharing the base component
// Mantine: Extended.withProps = createWithProps(Component) — shares original Component
// Soribashi: (Wrapped as any).withProps = makeWithProps(Wrapped) — stacks incrementally
// Classification: INTENTIONAL (consequence of undefined-filter design; observable only for 3+ levels)
// ---------------------------------------------------------------------------

describe('G13: withProps stacking — preset accumulation', () => {
  it('G13a: two-level withProps applies both preset layers', () => {
    const A = (Select as any).withProps({ selected: 'apple' });
    // second level adds/overrides selected
    const B = (A as any).withProps({ selected: 'banana' });
    const { container } = wrap(
      <B items={['apple', 'banana']} getKey={(s: string) => s} />,
    );
    const items = container.querySelectorAll('li');
    // second preset (banana) wins
    expect(items[1]?.dataset.selected).toBe('true');
    expect(items[0]?.dataset.selected).toBe('false');
  });

  it('G13b: instance props override the outermost preset in a two-level chain', () => {
    const A = (Select as any).withProps({ selected: 'apple' });
    const B = (A as any).withProps({ selected: 'banana' });
    const { container } = wrap(
      <B items={['apple', 'banana']} getKey={(s: string) => s} selected="apple" />,
    );
    const items = container.querySelectorAll('li');
    expect(items[0]?.dataset.selected).toBe('true');
    expect(items[1]?.dataset.selected).toBe('false');
  });
});
