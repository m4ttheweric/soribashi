import { describe, expect, it } from 'vitest';
import { defineComponent, definePolymorphicComponent, isThemeComponentEntry } from '../src/index.ts';

describe('defineComponent .withDefaults', () => {
  const Foo = defineComponent({
    name: 'Foo',
    selectors: ['root'] as const,
    render: ({ getStyles }) => <div {...getStyles('root')} />,
  });

  it('exists as a method on the component', () => {
    expect(typeof (Foo as any).withDefaults).toBe('function');
  });

  it('returns a tagged ThemeComponentEntry', () => {
    const entry = (Foo as any).withDefaults({ size: 'sm' });
    expect(isThemeComponentEntry(entry)).toBe(true);
  });

  it('entry carries the component name and provided defaults', () => {
    const entry = (Foo as any).withDefaults({ size: 'sm' });
    expect(entry.name).toBe('Foo');
    expect(entry.defaultProps).toEqual({ size: 'sm' });
  });

  it('does not mutate the component', () => {
    (Foo as any).withDefaults({ a: 1 });
    (Foo as any).withDefaults({ b: 2 });
    expect(typeof Foo).toBe('object');
  });
});

describe('definePolymorphicComponent .withDefaults', () => {
  const Bar = definePolymorphicComponent<{ tone?: 'a' | 'b' }, 'div'>({
    name: 'Bar',
    defaultElement: 'div',
    selectors: ['root'] as const,
    render: ({ Element, getStyles }) => <Element {...getStyles('root')} />,
  });

  it('exists as a method on the polymorphic component', () => {
    expect(typeof (Bar as any).withDefaults).toBe('function');
  });

  it('returns a tagged entry with name "Bar"', () => {
    const entry = (Bar as any).withDefaults({ tone: 'a' });
    expect(entry.name).toBe('Bar');
    expect(entry.defaultProps).toEqual({ tone: 'a' });
  });
});
