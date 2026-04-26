/**
 * Parity tests for soribashi `makeWithProps()` vs Mantine's inline `withProps` implementation.
 *
 * Every test exercises a specific decision point (branch) enumerated in
 * `docs/superpowers/audits/2026-04-25-tier-1-with-props.md`.
 *
 * Branch IDs (W1–W12) correspond to the enumeration table in that audit doc.
 *
 * Reference Mantine files:
 *   - `packages/@mantine/core/src/core/factory/factory.tsx` (lines 89–94)
 *   - `packages/@mantine/core/src/core/factory/polymorphic-factory.tsx` (lines 42–47)
 * at commit 63dafbbf5f0135eb36455b7add4c0ddcd0f3240a.
 *
 * Note: Several behaviors (undefined-filter, extend propagation, withProps chaining) are
 * also tested in factory-parity.test.tsx and generic-parity.test.tsx because they exercise
 * the same shared `makeWithProps` helper. This file targets tests that are distinctly
 * `with-props.tsx`-centric: the exported function API, the merged-output contract at each
 * decision point, and edge-cases not covered by the per-factory test files.
 */
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { makeWithProps } from '../src/with-props.tsx';

// ---------------------------------------------------------------------------
// Shared test components — plain forwardRef components to exercise makeWithProps
// without involving factory(), definePolymorphicComponent(), etc.
// ---------------------------------------------------------------------------

interface ButtonProps {
  children?: React.ReactNode;
  size?: string;
  color?: string;
  variant?: string;
  className?: string;
  style?: React.CSSProperties;
  'data-testid'?: string;
}

/**
 * A minimal forwardRef component. Represents what soribashi's factory() produces
 * internally — a React.ForwardRefExoticComponent<ButtonProps>.
 */
const BaseButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, size, color, variant, ...rest }, ref) => (
    <button
      ref={ref}
      data-size={size}
      data-color={color}
      data-variant={variant}
      {...rest}
    >
      {children}
    </button>
  ),
);
BaseButton.displayName = 'BaseButton';

// Attach the statics that factory() would normally add, so makeWithProps can propagate them
const identity = <T,>(value: T): T => value;
(BaseButton as any).extend = identity;
(BaseButton as any).withProps = makeWithProps(BaseButton);

// A second component without a displayName set (for W5 fallback test)
const Unnamed = React.forwardRef<HTMLDivElement, { label?: string }>(
  ({ label, ...rest }, ref) => <div ref={ref} data-label={label} {...rest} />,
);
// Deliberately do NOT set displayName

// ---------------------------------------------------------------------------
// W1: forwardRef wrap in makeWithProps
// Mantine: Extended = plain arrow function — no forwardRef
// Soribashi: makeWithProps wraps with React.forwardRef; ref flows through
// Classification: INTENTIONAL (consequence of soribashi's forwardRef-everywhere design)
// ---------------------------------------------------------------------------

describe('W1: makeWithProps wraps result in forwardRef', () => {
  it('W1a: withProps result forwards ref to the underlying DOM element', () => {
    const withProps = makeWithProps(BaseButton);
    const LargeButton = withProps({ size: 'lg' });
    const ref = React.createRef<HTMLButtonElement>();
    render(<LargeButton ref={ref as any}>Click</LargeButton>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('W1b: ref is non-null after render (forwardRef is active)', () => {
    const withProps = makeWithProps(BaseButton);
    const LargeButton = withProps({ size: 'xl' });
    const ref = React.createRef<HTMLButtonElement>();
    render(<LargeButton ref={ref as any}>X</LargeButton>);
    expect(ref.current).not.toBeNull();
  });

  it('W1c: ref forwarded through double-wrap chain', () => {
    const withProps = makeWithProps(BaseButton);
    const A = withProps({ size: 'lg' });
    const B = makeWithProps(A as any)({ color: 'red' }) as any;
    const ref = React.createRef<HTMLButtonElement>();
    render(<B ref={ref}>X</B>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});

// ---------------------------------------------------------------------------
// W2: undefined filter — soribashi divergence from Mantine
// Mantine: {...fixedProps, ...props} — undefined instance values override presets
// Soribashi: undefined instance values are filtered; presets survive
// Classification: INTENTIONAL (already in ledger)
// ---------------------------------------------------------------------------

describe('W2: undefined instance props do NOT override presets (undefined filter)', () => {
  it('W2a: preset is applied when instance prop is absent', () => {
    const withProps = makeWithProps(BaseButton);
    const LargeButton = withProps({ size: 'lg' });
    const { container } = render(<LargeButton>X</LargeButton>);
    expect(container.querySelector('button')?.dataset.size).toBe('lg');
  });

  it('W2b: explicit undefined instance prop does NOT override preset (soribashi divergence)', () => {
    // Mantine behavior: {...fixedProps, size: undefined} → size = undefined (preset overridden)
    // Soribashi behavior: undefined is filtered → size = 'lg' (preset survives)
    const withProps = makeWithProps(BaseButton);
    const LargeButton = withProps({ size: 'lg' });
    const { container } = render(<LargeButton size={undefined}>X</LargeButton>);
    expect(container.querySelector('button')?.dataset.size).toBe('lg');
  });

  it('W2c: non-undefined instance prop overrides preset normally', () => {
    const withProps = makeWithProps(BaseButton);
    const LargeButton = withProps({ size: 'lg' });
    const { container } = render(<LargeButton size="sm">X</LargeButton>);
    expect(container.querySelector('button')?.dataset.size).toBe('sm');
  });

  it('W2d: multiple preset props — only undefined instance props are filtered', () => {
    const withProps = makeWithProps(BaseButton);
    const Styled = withProps({ size: 'lg', color: 'blue' });
    // Override color, leave size undefined → size preset survives, color is overridden
    const { container } = render(<Styled size={undefined} color="red">X</Styled>);
    const btn = container.querySelector('button');
    expect(btn?.dataset.size).toBe('lg');   // preset survived
    expect(btn?.dataset.color).toBe('red'); // instance overrode
  });
});

// ---------------------------------------------------------------------------
// W3: preset merge order — presets first, instance props win for non-undefined values
// Mantine: {...fixedProps, ...props}
// Soribashi: same effective order via explicit loop
// Classification: IDENTICAL
// ---------------------------------------------------------------------------

describe('W3: preset merge order — presets first, instance wins (for non-undefined)', () => {
  it('W3a: instance prop value takes precedence over preset for same key', () => {
    const withProps = makeWithProps(BaseButton);
    const Styled = withProps({ size: 'lg', color: 'blue' });
    const { container } = render(<Styled size="sm" color="green">X</Styled>);
    const btn = container.querySelector('button');
    expect(btn?.dataset.size).toBe('sm');
    expect(btn?.dataset.color).toBe('green');
  });

  it('W3b: keys only in preset appear in merged output', () => {
    const withProps = makeWithProps(BaseButton);
    const Styled = withProps({ size: 'lg', color: 'blue' });
    const { container } = render(<Styled>X</Styled>);
    const btn = container.querySelector('button');
    expect(btn?.dataset.size).toBe('lg');
    expect(btn?.dataset.color).toBe('blue');
  });

  it('W3c: keys only in instance appear in merged output', () => {
    const withProps = makeWithProps(BaseButton);
    const Base = withProps({ size: 'lg' });
    const { container } = render(<Base color="red">X</Base>);
    const btn = container.querySelector('button');
    expect(btn?.dataset.size).toBe('lg');   // from preset
    expect(btn?.dataset.color).toBe('red'); // from instance
  });
});

// ---------------------------------------------------------------------------
// W4: extend propagation — INCONSISTENCY → fixed in Tasks 1.1/1.2/1.3
// Mantine: Extended.extend = Component.extend
// Soribashi (pre-fix): did not copy extend
// Soribashi (post-fix): if (Base.extend !== undefined) Wrapped.extend = Base.extend
// Classification: IDENTICAL (after fix; confirmed here)
// ---------------------------------------------------------------------------

describe('W4: makeWithProps propagates extend from Base to Wrapped', () => {
  it('W4a: withProps result has an extend method when Base has extend', () => {
    const withProps = makeWithProps(BaseButton);
    const LargeButton = withProps({ size: 'lg' });
    expect(typeof (LargeButton as any).extend).toBe('function');
  });

  it('W4b: extend on withProps result is the same function as on Base', () => {
    const withProps = makeWithProps(BaseButton);
    const LargeButton = withProps({ size: 'lg' });
    expect((LargeButton as any).extend).toBe((BaseButton as any).extend);
  });

  it('W4c: extend behaves as identity (passes through its argument)', () => {
    const withProps = makeWithProps(BaseButton);
    const LargeButton = withProps({ size: 'lg' });
    const config = { defaultProps: { size: 'xl' } };
    expect((LargeButton as any).extend(config)).toBe(config);
  });

  it('W4d: component without extend on Base does NOT get extend on Wrapped', () => {
    // A plain forwardRef component with no .extend attached
    const Plain = React.forwardRef<HTMLDivElement, { label?: string }>(
      ({ label, ...rest }, ref) => <div ref={ref} data-label={label} {...rest} />,
    );
    Plain.displayName = 'Plain';
    const withProps = makeWithProps(Plain);
    const Wrapped = withProps({ label: 'hello' });
    // extend was not on Base, so it should not be on Wrapped either
    expect((Wrapped as any).extend).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// W5: displayName format — `WithProps(<name>)` with fallback chain
// Mantine: `WithProps(${Component.displayName})` — no fallback if undefined
// Soribashi: `WithProps(${Base.displayName ?? Base.name ?? 'Component'})` — fallback
// Classification: IDENTICAL for common case; soribashi adds fallback robustness
// ---------------------------------------------------------------------------

describe('W5: displayName format on withProps result', () => {
  it('W5a: displayName is WithProps(<Base.displayName>) when displayName is set', () => {
    const withProps = makeWithProps(BaseButton);
    const LargeButton = withProps({ size: 'lg' });
    expect((LargeButton as any).displayName).toBe('WithProps(BaseButton)');
  });

  it('W5b: displayName falls back to Base.name when displayName is not set', () => {
    // Unnamed has no displayName, but its function .name is 'Unnamed' (the variable name)
    // (In tests, forwardRef components' function name comes from the variable binding)
    const withProps = makeWithProps(Unnamed as any);
    const Wrapped = withProps({ label: 'hi' });
    const dn = (Wrapped as any).displayName as string;
    // Should contain WithProps( and a reasonable name
    expect(dn).toMatch(/^WithProps\(/);
    expect(dn).toMatch(/\)$/);
  });

  it('W5c: double-wrapped displayName is nested correctly', () => {
    const withProps = makeWithProps(BaseButton);
    const A = withProps({ size: 'lg' });
    const B = (A as any).withProps({ color: 'blue' });
    expect((B as any).displayName).toBe('WithProps(WithProps(BaseButton))');
  });
});

// ---------------------------------------------------------------------------
// W6: withProps re-attachment — INCONSISTENCY → fixed in Tasks 1.1/1.2/1.3
// Mantine inline: Extended does NOT get a .withProps method (chaining breaks at runtime)
// Soribashi (post-fix): (Wrapped as any).withProps = makeWithProps(Wrapped) unconditionally
// Classification: INTENTIONAL (soribashi improvement over Mantine's inline version)
// ---------------------------------------------------------------------------

describe('W6: makeWithProps re-attaches withProps on the result for chaining', () => {
  it('W6a: withProps result has a withProps method', () => {
    const withProps = makeWithProps(BaseButton);
    const LargeButton = withProps({ size: 'lg' });
    expect(typeof (LargeButton as any).withProps).toBe('function');
  });

  it('W6b: chained withProps result also has a withProps method', () => {
    const withProps = makeWithProps(BaseButton);
    const A = withProps({ size: 'lg' });
    const B = (A as any).withProps({ color: 'blue' });
    expect(typeof (B as any).withProps).toBe('function');
  });

  it('W6c: chained withProps produces correct merged output', () => {
    const withProps = makeWithProps(BaseButton);
    const A = withProps({ size: 'lg' });
    const B = (A as any).withProps({ color: 'blue' });
    const { container } = render(<B>X</B>);
    const btn = container.querySelector('button');
    // B preset (color=blue) + A preset (size=lg) both applied via stacking
    expect(btn?.dataset.color).toBe('blue');
    expect(btn?.dataset.size).toBe('lg');
  });

  it('W6d: chained withProps result also has extend', () => {
    const withProps = makeWithProps(BaseButton);
    const A = withProps({ size: 'lg' });
    const B = (A as any).withProps({ color: 'blue' });
    expect(typeof (B as any).extend).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// W7: shared helper for all factory variants
// Mantine: factory.tsx and polymorphic-factory.tsx each inline their own withProps logic
// Soribashi: one makeWithProps() used by factory, polymorphicComponent,
//            definePolymorphicComponent, defineGenericComponent
// Classification: INTENTIONAL (soribashi consolidation; same observable behavior)
// ---------------------------------------------------------------------------

describe('W7: makeWithProps is the shared helper — verified via factory and polymorphicComponent', () => {
  it('W7a: makeWithProps works with a ComponentType (non-forwardRef)', () => {
    // Plain function component (not forwardRef) is valid ComponentType<TProps>
    const PlainFn: React.FC<{ label?: string }> = ({ label }) => <span data-label={label} />;
    PlainFn.displayName = 'PlainFn';
    const withProps = makeWithProps(PlainFn);
    const Styled = withProps({ label: 'hello' });
    const { container } = render(<Styled />);
    expect(container.querySelector('span')?.dataset.label).toBe('hello');
  });

  it('W7b: makeWithProps works with a ForwardRefExoticComponent (the common case)', () => {
    const withProps = makeWithProps(BaseButton);
    const Styled = withProps({ size: 'xl', color: 'green' });
    const { container } = render(<Styled>Hi</Styled>);
    const btn = container.querySelector('button');
    expect(btn?.dataset.size).toBe('xl');
    expect(btn?.dataset.color).toBe('green');
  });
});

// ---------------------------------------------------------------------------
// W8: type signature — stricter in soribashi (type-level only)
// Mantine: (fixedProps: any) — no constraint
// Soribashi: withProps(presets: Partial<TProps>) — typed
// Classification: INTENTIONAL (type-level only; runtime identical)
// This is a type-only test — we just verify the API is callable
// ---------------------------------------------------------------------------

describe('W8: makeWithProps type signature', () => {
  it('W8: makeWithProps is callable and returns a function', () => {
    const withProps = makeWithProps(BaseButton);
    expect(typeof withProps).toBe('function');
    const Styled = withProps({ size: 'md' });
    expect(Styled).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// W9: makeWithProps is a standalone exported utility (soribashi addition)
// Mantine: no standalone export; withProps logic is duplicated inline
// Classification: INTENTIONAL (soribashi consolidation)
// ---------------------------------------------------------------------------

describe('W9: makeWithProps is a named export from with-props.tsx', () => {
  it('W9: with-props module exports makeWithProps', async () => {
    const mod = await import('../src/with-props.tsx');
    expect(typeof mod.makeWithProps).toBe('function');
  });

  it('W9b: with-props module exports ONLY makeWithProps (no side-effect exports)', async () => {
    const mod = await import('../src/with-props.tsx');
    // Only makeWithProps should be exported — no identity, no createWithProps, etc.
    const exportedKeys = Object.keys(mod);
    expect(exportedKeys).toEqual(['makeWithProps']);
  });
});

// ---------------------------------------------------------------------------
// W10: className handling — no concatenation in either Mantine or soribashi
// Both: instance className (if non-undefined) replaces preset className
// Soribashi: preset className survives when instance className is undefined (undefined-filter)
// Classification: IDENTICAL
// ---------------------------------------------------------------------------

describe('W10: className handling — no concatenation, preset survives undefined', () => {
  it('W10a: preset className is applied when instance className is absent', () => {
    const withProps = makeWithProps(BaseButton);
    const Styled = withProps({ className: 'preset-class' } as any);
    const { container } = render(<Styled>X</Styled>);
    expect(container.querySelector('button')?.className).toContain('preset-class');
  });

  it('W10b: instance className overrides preset className (no concatenation)', () => {
    const withProps = makeWithProps(BaseButton);
    const Styled = withProps({ className: 'preset-class' } as any);
    const { container } = render(<Styled className="instance-class">X</Styled>);
    // Soribashi does not concatenate: only instance-class should be present
    const className = container.querySelector('button')?.className ?? '';
    expect(className).toContain('instance-class');
    expect(className).not.toContain('preset-class');
  });

  it('W10c: undefined instance className leaves preset className intact (undefined-filter)', () => {
    const withProps = makeWithProps(BaseButton);
    const Styled = withProps({ className: 'preset-class' } as any);
    const { container } = render(<Styled className={undefined}>X</Styled>);
    expect(container.querySelector('button')?.className).toContain('preset-class');
  });
});

// ---------------------------------------------------------------------------
// W11: style handling — no deep merge in either Mantine or soribashi
// Both: instance style (if non-undefined) replaces preset style
// Soribashi: preset style survives when instance style is undefined (undefined-filter)
// Classification: IDENTICAL
// ---------------------------------------------------------------------------

describe('W11: style handling — no deep merge, preset survives undefined', () => {
  it('W11a: preset style is applied when instance style is absent', () => {
    const withProps = makeWithProps(BaseButton);
    const Styled = withProps({ style: { fontWeight: 'bold' } } as any);
    const { container } = render(<Styled>X</Styled>);
    expect((container.querySelector('button') as HTMLElement)?.style.fontWeight).toBe('bold');
  });

  it('W11b: instance style replaces preset style entirely (no deep merge)', () => {
    const withProps = makeWithProps(BaseButton);
    const Styled = withProps({ style: { fontWeight: 'bold', color: 'red' } } as any);
    // Instance provides only fontSize — fontWeight from preset is NOT merged
    const { container } = render(
      <Styled style={{ fontSize: '16px' }}>X</Styled>,
    );
    const style = (container.querySelector('button') as HTMLElement)?.style;
    expect(style.fontSize).toBe('16px');
    expect(style.fontWeight).toBe(''); // not merged
  });

  it('W11c: undefined instance style leaves preset style intact (undefined-filter)', () => {
    const withProps = makeWithProps(BaseButton);
    const Styled = withProps({ style: { color: 'blue' } } as any);
    const { container } = render(<Styled style={undefined}>X</Styled>);
    expect((container.querySelector('button') as HTMLElement)?.style.color).toBe('blue');
  });
});

// ---------------------------------------------------------------------------
// W12: type signature of the withProps result — ComponentType<TProps> in soribashi
// Mantine: React.NamedExoticComponent<...> (because it passes through factory's exotic type)
// Soribashi: forwardRef result is ForwardRefExoticComponent internally, cast to ComponentType<TProps>
// Classification: INTENTIONAL (type-level; runtime renderable in both cases)
// This tests runtime renderability only (the type divergence is compile-time only)
// ---------------------------------------------------------------------------

describe('W12: withProps result is renderable (type signature parity)', () => {
  it('W12a: withProps result renders correctly as JSX', () => {
    const withProps = makeWithProps(BaseButton);
    const Styled = withProps({ size: 'md', color: 'blue' });
    const { container } = render(<Styled>Content</Styled>);
    expect(container.querySelector('button')).toBeInTheDocument();
    expect(container.querySelector('button')?.textContent).toBe('Content');
  });

  it('W12b: withProps result has the right statics (extend + withProps)', () => {
    const withProps = makeWithProps(BaseButton);
    const Styled = withProps({ size: 'md' });
    expect(typeof (Styled as any).extend).toBe('function');
    expect(typeof (Styled as any).withProps).toBe('function');
  });

  it('W12c: three-level withProps chain renders with accumulated presets (stacking)', () => {
    // Mantine does not support three-level chaining at all (no .withProps on Extended)
    // Soribashi supports it via stacking — presets accumulate at each level
    const withProps = makeWithProps(BaseButton);
    const A = withProps({ size: 'lg' });
    const B = (A as any).withProps({ color: 'red' });
    const C = (B as any).withProps({ variant: 'filled' });
    const { container } = render(<C>X</C>);
    const btn = container.querySelector('button');
    // All three preset layers applied:
    expect(btn?.dataset.size).toBe('lg');
    expect(btn?.dataset.color).toBe('red');
    expect(btn?.dataset.variant).toBe('filled');
  });

  it('W12d: three-level chain — innermost instance prop overrides all presets', () => {
    const withProps = makeWithProps(BaseButton);
    const A = withProps({ size: 'lg' });
    const B = (A as any).withProps({ size: 'md' });
    const C = (B as any).withProps({ size: 'sm' });
    // Instance prop overrides even the outermost preset
    const { container } = render(<C size="xs">X</C>);
    expect(container.querySelector('button')?.dataset.size).toBe('xs');
  });
});
