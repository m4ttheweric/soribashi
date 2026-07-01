import { describe, expect, it } from 'vitest';
import {
  defineComponent,
  definePolymorphicComponent,
  isThemeComponentEntry,
} from '../src/index.ts';

describe('defineComponent .extend', () => {
  const Foo = defineComponent({
    name: 'Foo',
    selectors: ['root'] as const,
    render: ({ getStyles }) => <div {...getStyles('root')} />,
  });

  it('exists as a method on the component', () => {
    expect(typeof (Foo as any).extend).toBe('function');
  });

  it('returns a tagged ThemeComponentEntry', () => {
    const entry = (Foo as any).extend({ defaultProps: { size: 'sm' } });
    expect(isThemeComponentEntry(entry)).toBe(true);
  });

  it('entry carries the component name and provided defaults', () => {
    const entry = (Foo as any).extend({ defaultProps: { size: 'sm' } });
    expect(entry.name).toBe('Foo');
    expect(entry.defaultProps).toEqual({ size: 'sm' });
  });

  it('does not mutate the component', () => {
    // Snapshot the displayName + the function-vs-component shape BEFORE calling extend.
    const displayNameBefore = (Foo as any).displayName;
    const extendBefore = (Foo as any).extend;
    const withPropsBefore = (Foo as any).withProps;
    // Calling extend() should NOT alter the component itself — it returns a
    // new ThemeComponentEntry without touching Foo's identity, statics, or shape.
    (Foo as any).extend({ defaultProps: { a: 1 } });
    (Foo as any).extend({ defaultProps: { b: 2 } });
    expect((Foo as any).displayName).toBe(displayNameBefore);
    expect((Foo as any).extend).toBe(extendBefore);
    expect((Foo as any).withProps).toBe(withPropsBefore);
  });
});

describe('defineComponent .extend type safety', () => {
  interface FooProps {
    size?: 'sm' | 'md' | 'lg';
  }
  const Foo = defineComponent<FooProps, readonly ['root'], readonly []>({
    name: 'Foo',
    selectors: ['root'] as const,
    render: ({ getStyles }) => <div {...getStyles('root')} />,
  });

  it('extend rejects unknown keys in defaultProps at compile time', () => {
    // @ts-expect-error — `bogus` is not a FooProps key
    Foo.extend({ defaultProps: { bogus: 'value' } });
    // If TS no longer errors here, the @ts-expect-error comment itself will
    // cause a typecheck failure — confirming the constraint is working.
  });

  it('extend accepts known props in defaultProps', () => {
    const entry = Foo.extend({ defaultProps: { size: 'sm' } });
    expect(entry.__soribashiThemeEntry).toBe(true);
    expect(entry.name).toBe('Foo');
  });
});

describe('definePolymorphicComponent .extend', () => {
  const Bar = definePolymorphicComponent<{ tone?: 'a' | 'b' }, 'div'>({
    name: 'Bar',
    defaultElement: 'div',
    selectors: ['root'] as const,
    render: ({ Element, getStyles }) => <Element {...getStyles('root')} />,
  });

  it('exists as a method on the polymorphic component', () => {
    expect(typeof (Bar as any).extend).toBe('function');
  });

  it('returns a tagged entry with name "Bar"', () => {
    const entry = (Bar as any).extend({ defaultProps: { tone: 'a' } });
    expect(entry.name).toBe('Bar');
    expect(entry.defaultProps).toEqual({ tone: 'a' });
  });
});
