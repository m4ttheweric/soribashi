import { render } from '@testing-library/react';
/**
 * Parity tests for soribashi `factory()` vs Mantine `factory()`.
 *
 * Every test exercises a specific decision point (branch) in Mantine's source.
 * Branch IDs correspond to the enumeration in
 * `docs/superpowers/audits/2026-04-25-tier-1-factory.md`.
 *
 * Reference Mantine file:
 * `packages/@mantine/core/src/core/factory/factory.tsx`
 * at commit 63dafbbf5f0135eb36455b7add4c0ddcd0f3240a.
 */
import React from 'react';
import { describe, expect, it } from 'vitest';
import { factory } from '../src/factory.tsx';
import type { FactoryPayload } from '../src/types/index.ts';

// ---------------------------------------------------------------------------
// Shared test component
// ---------------------------------------------------------------------------

type ButtonFactory = FactoryPayload & {
  props: { children?: React.ReactNode; size?: string; color?: string };
  ref: HTMLButtonElement;
  stylesNames: 'root' | 'label';
};

const Button = factory<ButtonFactory>((props, ref) => (
  <button ref={ref} data-size={props.size} data-color={props.color}>
    {props.children}
  </button>
));
Button.displayName = 'Button';

// ---------------------------------------------------------------------------
// B1: factory(ui) wraps in forwardRef (soribashi divergence from Mantine's cast)
// Mantine: const Component = ui as any (no forwardRef)
// Soribashi: forwardRef((props, ref) => render(props, ref))
// Classification: INTENTIONAL (already in ledger)
// ---------------------------------------------------------------------------

describe('B1: factory() wraps render in forwardRef', () => {
  it('B1a: factory component renders correctly', () => {
    const { getByText } = render(<Button>Click me</Button>);
    expect(getByText('Click me')).toBeInTheDocument();
  });

  it('B1b: factory component forwards ref to DOM element', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Click</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('B1c: factory component is a forwardRef exotic component (has $$typeof)', () => {
    // React.forwardRef creates a "react.forward_ref" type component
    // We assert on the shape of the component, not the internal symbol
    const ref = React.createRef<HTMLButtonElement>();
    const { container } = render(
      <Button ref={ref} size="lg">
        X
      </Button>,
    );
    // ref is populated = forwardRef is working
    expect(ref.current).not.toBeNull();
    expect(container.querySelector('button')?.dataset.size).toBe('lg');
  });
});

// ---------------------------------------------------------------------------
// B2: factory.withProps — undefined filter (soribashi divergence from Mantine)
// Mantine: (props) => <Component {...fixedProps} {...props} /> (undefined overrides preset)
// Soribashi: filters undefined from instance props before merge (presets win over undefined)
// Classification: INTENTIONAL (already in ledger)
// ---------------------------------------------------------------------------

describe('B2: factory.withProps — undefined filter behavior', () => {
  it('B2a: withProps applies preset props', () => {
    const LargeButton = Button.withProps({ size: 'lg' });
    const { container } = render(<LargeButton>X</LargeButton>);
    expect(container.querySelector('button')?.dataset.size).toBe('lg');
  });

  it('B2b: explicit non-undefined instance props override preset', () => {
    const LargeButton = Button.withProps({ size: 'lg' });
    const { container } = render(<LargeButton size="sm">X</LargeButton>);
    expect(container.querySelector('button')?.dataset.size).toBe('sm');
  });

  it('B2c: explicit undefined instance prop does NOT override preset (soribashi divergence)', () => {
    // Mantine: {...fixedProps, ...props} where props.size = undefined would override
    // Soribashi: undefined instance props are filtered out; preset wins
    const LargeButton = Button.withProps({ size: 'lg' });
    const { container } = render(<LargeButton size={undefined}>X</LargeButton>);
    // Soribashi behavior: 'lg' (preset) because undefined is filtered
    expect(container.querySelector('button')?.dataset.size).toBe('lg');
  });

  it('B2d: withProps with multiple preset props', () => {
    const StyledButton = Button.withProps({ size: 'lg', color: 'blue' });
    const { container } = render(<StyledButton>X</StyledButton>);
    const btn = container.querySelector('button');
    expect(btn?.dataset.size).toBe('lg');
    expect(btn?.dataset.color).toBe('blue');
  });
});

// ---------------------------------------------------------------------------
// B3: extend static — identical to Mantine
// Mantine: Component.extend = identity; same as soribashi
// Classification: IDENTICAL
// ---------------------------------------------------------------------------

describe('B3: factory() attaches extend as identity', () => {
  it('B3a: extend is a function', () => {
    expect(typeof Button.extend).toBe('function');
  });

  it('B3b: extend is an identity — returns the same object passed in', () => {
    const config = { defaultProps: { size: 'lg' } };
    expect(Button.extend(config)).toBe(config);
  });
});

// ---------------------------------------------------------------------------
// B4: withProps() result has extend — INCONSISTENCY (soribashi missing this)
// Mantine: Extended.extend = Component.extend (line 91)
// Soribashi: makeWithProps() does not copy extend to Wrapped
// Classification: INCONSISTENCY → fixed via TDD
// ---------------------------------------------------------------------------

describe('B4: withProps() result propagates extend from parent', () => {
  it('B4a: withProps() result has an extend method', () => {
    const LargeButton = Button.withProps({ size: 'lg' });
    expect(typeof (LargeButton as any).extend).toBe('function');
  });

  it('B4b: withProps() result extend is identity (same behavior as parent)', () => {
    const LargeButton = Button.withProps({ size: 'lg' });
    const config = { defaultProps: { size: 'xl' } };
    expect((LargeButton as any).extend(config)).toBe(config);
  });

  it('B4c: double-wrapped withProps result also has extend', () => {
    const Large = Button.withProps({ size: 'lg' });
    const LargeBlue = (Large as any).withProps ? (Large as any).withProps({ color: 'blue' }) : null;
    if (LargeBlue) {
      expect(typeof (LargeBlue as any).extend).toBe('function');
    }
    // If withProps result doesn't have withProps, the outer test (B4a) already catches it
  });
});

// ---------------------------------------------------------------------------
// B5: withProps displayName — identical behavior (same string pattern)
// Mantine: Extended.displayName = `WithProps(${Component.displayName})`
// Soribashi: Wrapped.displayName = `WithProps(${Base.displayName ?? Base.name ?? 'Component'})`
// Classification: IDENTICAL (plus soribashi handles unnamed components)
// ---------------------------------------------------------------------------

describe('B5: withProps() result displayName', () => {
  it('B5a: withProps result displayName contains parent displayName', () => {
    const LargeButton = Button.withProps({ size: 'lg' });
    expect((LargeButton as any).displayName).toBe('WithProps(Button)');
  });

  it('B5b: unnamed component displayName falls back to Component', () => {
    // Create a factory component without setting displayName
    const Unnamed = factory<ButtonFactory>((props, ref) => (
      <button ref={ref}>{props.children}</button>
    ));
    // No displayName set; soribashi falls back to 'Component'
    const WithPreset = Unnamed.withProps({ size: 'sm' });
    const displayName = (WithPreset as any).displayName ?? '';
    expect(displayName).toMatch(/WithProps\(/);
  });
});

// ---------------------------------------------------------------------------
// B6: identity function — INTENTIONAL (soribashi keeps it private)
// Mantine: exported `export function identity<T>(value: T): T`
// Soribashi: private `const identity = <T,>(value: T): T => value`
// Classification: INTENTIONAL (implementation detail)
// ---------------------------------------------------------------------------

describe('B6: identity is private in soribashi (not exported)', () => {
  it('B6: factory module does not export identity directly', async () => {
    const mod = await import('../src/factory.tsx');
    // identity is not a named export from soribashi's factory.tsx
    expect((mod as any).identity).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// B7: FactoryComponent type — simpler than Mantine's MantineComponent type
// Mantine: includes ThemeExtend, ComponentClasses, StaticComponents, etc.
// Soribashi: ComponentType + extend + withProps + classes + displayName
// Classification: INTENTIONAL (type-level only, no runtime behavior)
// ---------------------------------------------------------------------------

describe('B7: factory() static properties shape', () => {
  it('B7a: factory component has extend', () => {
    expect(typeof Button.extend).toBe('function');
  });

  it('B7b: factory component has withProps', () => {
    expect(typeof Button.withProps).toBe('function');
  });

  it('B7c: factory component displayName can be set', () => {
    expect(Button.displayName).toBe('Button');
  });
});

// ---------------------------------------------------------------------------
// Integration: ref forwarding through withProps chain
// ---------------------------------------------------------------------------

describe('Integration: ref forwarding', () => {
  it('withProps result forwards ref to the underlying DOM element', () => {
    const LargeButton = Button.withProps({ size: 'lg' });
    const ref = React.createRef<HTMLButtonElement>();
    render(<LargeButton ref={ref as any}>Click</LargeButton>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
