/**
 * Parity tests for soribashi `polymorphicComponent()` + `definePolymorphicComponent()`
 * vs Mantine `polymorphicFactory()` + `createPolymorphicComponent()`.
 *
 * Every test exercises a specific decision point (branch) in Mantine's source.
 * Branch IDs (P1–P20) correspond to the enumeration in
 * `docs/superpowers/audits/2026-04-25-tier-1-polymorphic.md`.
 *
 * Reference Mantine files:
 * - `packages/@mantine/core/src/core/factory/polymorphic-factory.tsx`
 * - `packages/@mantine/core/src/core/factory/create-polymorphic-component.ts`
 * at commit 63dafbbf5f0135eb36455b7add4c0ddcd0f3240a.
 */
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
import { polymorphicComponent } from '../src/polymorphic-component.tsx';
import { definePolymorphicComponent } from '../src/define-polymorphic-component.tsx';
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
// Low-level polymorphicComponent — used as an escape hatch
// ---------------------------------------------------------------------------

type PolymorphicDivFactory = {
  props: { children?: React.ReactNode; 'data-label'?: string };
  ref: HTMLElement;
  stylesNames: 'root';
  defaultElement: 'div';
};

/**
 * A minimal polymorphic component built with the lower-level escape hatch.
 * It renders the `as` element when provided, or falls back to `div`.
 */
const PolyDiv = polymorphicComponent<PolymorphicDivFactory>(
  (props, ref) => {
    const { as: El = 'div', children, ...rest } = props as any;
    return <El ref={ref} {...rest}>{children}</El>;
  },
);
PolyDiv.displayName = 'PolyDiv';

// ---------------------------------------------------------------------------
// High-level definePolymorphicComponent
// ---------------------------------------------------------------------------

interface TextOwnProps {
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

const PolyText = definePolymorphicComponent<TextOwnProps, 'p'>({
  name: 'PolyText',
  defaultElement: 'p',
  selectors: ['root'] as const,
  classes: { root: 'sb-PolyText-root' },
  defaults: { size: 'md' },
  render: ({ Element, props, getStyles, ref }) => {
    const { size, children, classNames, styles, vars, attributes, unstyled, className, style, ...rest } =
      props as any;
    return (
      <Element ref={ref} {...getStyles('root')} {...rest} data-size={size}>
        {children}
      </Element>
    );
  },
});

// ---------------------------------------------------------------------------
// P1: polymorphicComponent wraps render in forwardRef
// Mantine: casts ui as any (no forwardRef), ref is an ordinary prop
// Soribashi: wraps in React.forwardRef; render signature (props, ref)
// Classification: INTENTIONAL (already in ledger)
// ---------------------------------------------------------------------------

describe('P1: polymorphicComponent wraps render in forwardRef', () => {
  it('P1a: polymorphicComponent renders correctly', () => {
    const { getByText } = wrap(<PolyDiv>Hello</PolyDiv>);
    expect(getByText('Hello')).toBeInTheDocument();
  });

  it('P1b: polymorphicComponent forwards ref to the underlying DOM element', () => {
    const ref = React.createRef<HTMLDivElement>();
    wrap(<PolyDiv ref={ref as any}>Hello</PolyDiv>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('P1c: definePolymorphicComponent forwards ref to the rendered element', () => {
    const ref = React.createRef<HTMLParagraphElement>();
    wrap(<PolyText ref={ref as any}>Text</PolyText>);
    expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
  });

  it('P1d: definePolymorphicComponent forwards ref even when as overrides the element', () => {
    const ref = React.createRef<HTMLSpanElement>();
    wrap(<PolyText as="span" ref={ref as any}>Text</PolyText>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });
});

// ---------------------------------------------------------------------------
// P3: withProps undefined filter — soribashi divergence from Mantine
// Mantine: {...fixedProps, ...props} (undefined overrides)
// Soribashi: filters undefined from instance props before merge
// Classification: INTENTIONAL (already in ledger)
// ---------------------------------------------------------------------------

describe('P3: polymorphicComponent.withProps — undefined filter behavior', () => {
  it('P3a: withProps applies preset props', () => {
    const SizedDiv = (PolyDiv as any).withProps({ 'data-label': 'preset' });
    const { container } = wrap(<SizedDiv>X</SizedDiv>);
    expect(container.querySelector('div')?.dataset.label).toBe('preset');
  });

  it('P3b: explicit non-undefined instance props override preset', () => {
    const SizedDiv = (PolyDiv as any).withProps({ 'data-label': 'preset' });
    const { container } = wrap(<SizedDiv data-label="override">X</SizedDiv>);
    expect(container.querySelector('div')?.dataset.label).toBe('override');
  });

  it('P3c: explicit undefined instance prop does NOT override preset (soribashi divergence)', () => {
    const SizedDiv = (PolyDiv as any).withProps({ 'data-label': 'preset' });
    const { container } = wrap(<SizedDiv data-label={undefined}>X</SizedDiv>);
    // Soribashi behavior: preset wins because undefined is filtered
    expect(container.querySelector('div')?.dataset.label).toBe('preset');
  });
});

// ---------------------------------------------------------------------------
// P4 / P17: withProps() result propagates extend from parent
// Mantine: Extended.extend = Component.extend (polymorphic-factory.tsx:44)
// Soribashi: makeWithProps did NOT copy extend (INCONSISTENCY — fixed via TDD)
// Classification: INCONSISTENCY → fixed
// ---------------------------------------------------------------------------

describe('P4 / P17: withProps() result propagates extend from parent', () => {
  it('P4a: polymorphicComponent.withProps() result has an extend method', () => {
    const PresetDiv = (PolyDiv as any).withProps({ 'data-label': 'preset' });
    expect(typeof (PresetDiv as any).extend).toBe('function');
  });

  it('P4b: polymorphicComponent.withProps() result extend is identity (same behavior as parent)', () => {
    const PresetDiv = (PolyDiv as any).withProps({ 'data-label': 'preset' });
    const config = { defaultProps: { 'data-label': 'other' } };
    expect((PresetDiv as any).extend(config)).toBe(config);
  });

  it('P17a: definePolymorphicComponent.withProps() result has an extend method', () => {
    const SmallText = PolyText.withProps({ size: 'sm' });
    expect(typeof (SmallText as any).extend).toBe('function');
  });

  it('P17b: definePolymorphicComponent.withProps() result extend returns a ThemeComponentEntry', () => {
    const SmallText = PolyText.withProps({ size: 'sm' });
    const entry = (SmallText as any).extend({ defaultProps: { size: 'lg' } });
    expect(entry.__soribashiThemeEntry).toBe(true);
    expect(entry.name).toBe('PolyText');
    expect(entry.defaultProps).toEqual({ size: 'lg' });
  });

  it('P17c: double-wrapped withProps result also has extend', () => {
    const SmallText = PolyText.withProps({ size: 'sm' });
    const SmallSpanText = (SmallText as any).withProps({ size: 'lg' });
    expect(typeof (SmallSpanText as any).extend).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// P5: withProps() displayName
// Mantine: `WithProps(${Component.displayName})`
// Soribashi: same pattern (with fallback for unnamed components)
// Classification: IDENTICAL
// ---------------------------------------------------------------------------

describe('P5: withProps() result displayName', () => {
  it('P5a: polymorphicComponent withProps result displayName contains parent displayName', () => {
    const PresetDiv = (PolyDiv as any).withProps({ 'data-label': 'preset' });
    expect((PresetDiv as any).displayName).toBe('WithProps(PolyDiv)');
  });

  it('P5b: definePolymorphicComponent withProps result displayName', () => {
    const SmallText = PolyText.withProps({ size: 'sm' });
    expect((SmallText as any).displayName).toBe('WithProps(PolyText)');
  });
});

// ---------------------------------------------------------------------------
// P6 / P16: extend static
// Mantine: Component.extend = identity
// Soribashi (polymorphicComponent): identity (Mantine parity, escape hatch)
// Soribashi (definePolymorphicComponent): typed builder → ThemeComponentEntry
// Classification: INTENTIONAL DIVERGENCE for definePolymorphicComponent
//   (vocabulary-rails migration, Task 12)
// ---------------------------------------------------------------------------

describe('P6 / P16: polymorphic components attach extend as identity', () => {
  it('P6a: polymorphicComponent has an extend static', () => {
    expect(typeof (PolyDiv as any).extend).toBe('function');
  });

  it('P6b: polymorphicComponent extend is identity', () => {
    const config = { defaultProps: {} };
    expect((PolyDiv as any).extend(config)).toBe(config);
  });

  it('P16a: definePolymorphicComponent has an extend static', () => {
    expect(typeof (PolyText as any).extend).toBe('function');
  });

  it('P16b: definePolymorphicComponent extend returns a ThemeComponentEntry', () => {
    const entry = (PolyText as any).extend({ defaultProps: { size: 'lg' as const } });
    expect(entry.__soribashiThemeEntry).toBe(true);
    expect(entry.name).toBe('PolyText');
    expect(entry.defaultProps).toEqual({ size: 'lg' });
  });
});

// ---------------------------------------------------------------------------
// P8 / P14: as prop semantics
// Mantine: component? prop (prop name differs); soribashi uses as?
// Soribashi: unwraps `as` from rawProps; falls back to config.defaultElement
// Classification: INTENTIONAL (as prop), P14 INTENTIONAL (centralized unwrap)
// ---------------------------------------------------------------------------

describe('P8 / P14: as prop semantics and defaultElement fallback', () => {
  it('P14a: renders defaultElement when as is not provided', () => {
    const { container } = wrap(<PolyText>Hello</PolyText>);
    expect(container.querySelector('p')).toBeInTheDocument();
    expect(container.querySelector('p')?.textContent).toBe('Hello');
  });

  it('P14b: renders the as element when provided', () => {
    const { container } = wrap(<PolyText as="span">Hello</PolyText>);
    expect(container.querySelector('span')).toBeInTheDocument();
    expect(container.querySelector('p')).toBeNull();
  });

  it('P14c: renders a custom React component when as is a component', () => {
    const Link = ({ href, children, ...rest }: any) => (
      <a href={href} data-testid="poly-link" {...rest}>
        {children}
      </a>
    );
    const { getByTestId } = wrap(
      <PolyText as={Link} href="/">
        Click
      </PolyText>,
    );
    expect(getByTestId('poly-link')).toBeInTheDocument();
    expect(getByTestId('poly-link').getAttribute('href')).toBe('/');
  });

  it('P14d: as preset in withProps overrides the defaultElement', () => {
    const SpanText = PolyText.withProps({ as: 'span' });
    const { container } = wrap(<SpanText>Z</SpanText>);
    expect(container.querySelector('span')).toBeInTheDocument();
    expect(container.querySelector('p')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// P15: classes static on definePolymorphicComponent
// Mantine: no classes static on polymorphicFactory
// Soribashi: (Component as any).classes = config.classes (soribashi extension)
// Classification: INTENTIONAL (soribashi addition)
// ---------------------------------------------------------------------------

describe('P15: definePolymorphicComponent attaches classes static', () => {
  it('P15a: classes static exists on the component', () => {
    expect((PolyText as any).classes).toBeDefined();
  });

  it('P15b: classes static contains the configured class names', () => {
    expect((PolyText as any).classes?.root).toBe('sb-PolyText-root');
  });
});

// ---------------------------------------------------------------------------
// withProps preserves polymorphism (already tested in define-polymorphic-component.test.tsx
// but this parity file documents it explicitly against Mantine's withProps return type)
// ---------------------------------------------------------------------------

describe('withProps preserves polymorphism', () => {
  it('withProps result can still use the as prop', () => {
    const SmallText = PolyText.withProps({ size: 'sm' });
    const { container } = wrap(<SmallText as="span">Y</SmallText>);
    expect(container.querySelector('span')?.dataset.size).toBe('sm');
  });

  it('withProps result applies presets through the polymorphic chain', () => {
    const SmallText = PolyText.withProps({ size: 'sm' });
    const { container } = wrap(<SmallText>Y</SmallText>);
    expect(container.querySelector('p')?.dataset.size).toBe('sm');
  });

  it('withProps instance props override presets through the polymorphic chain', () => {
    const SmallText = PolyText.withProps({ size: 'sm' });
    const { container } = wrap(<SmallText size="lg">Y</SmallText>);
    expect(container.querySelector('p')?.dataset.size).toBe('lg');
  });
});

// ---------------------------------------------------------------------------
// Integration: ref forwarding through withProps chain
// ---------------------------------------------------------------------------

describe('Integration: ref forwarding through withProps', () => {
  it('polymorphicComponent withProps result forwards ref', () => {
    const PresetDiv = (PolyDiv as any).withProps({ 'data-label': 'preset' });
    const ref = React.createRef<HTMLDivElement>();
    wrap(<PresetDiv ref={ref as any}>Hello</PresetDiv>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('definePolymorphicComponent withProps result forwards ref', () => {
    const SmallText = PolyText.withProps({ size: 'sm' });
    const ref = React.createRef<HTMLParagraphElement>();
    wrap(<SmallText ref={ref as any}>Y</SmallText>);
    expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
  });
});
