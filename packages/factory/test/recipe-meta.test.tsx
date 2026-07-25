// packages/factory/test/recipe-meta.test.tsx
import { describe, expect, it } from 'vitest';
import { defineComponent } from '../src/define-component.tsx';
import { defineCompound } from '../src/define-compound.tsx';
import { definePolymorphicComponent } from '../src/define-polymorphic-component.tsx';
import { getRecipeMeta } from '../src/recipe-meta.ts';

describe('recipe metadata static', () => {
  it('exposes builder, name, slots, axes, variants, defaults for defineComponent', () => {
    const Probe = defineComponent({
      name: 'Probe',
      selectors: ['root', 'label'] as const,
      variants: ['filled', 'outline'] as const,
      vocabularyAxes: ['size', 'intent', 'variant'] as const,
      defaults: { variant: 'filled' },
      render: ({ getStyles }) => <div {...getStyles('root')} />,
    });
    expect(getRecipeMeta(Probe)).toEqual({
      builder: 'defineComponent',
      name: 'Probe',
      slots: ['root', 'label'],
      vocabularyAxes: ['size', 'intent', 'variant'],
      variants: ['filled', 'outline'],
      defaults: { variant: 'filled' },
    });
  });

  it('is frozen and non-enumerable', () => {
    const Probe = definePolymorphicComponent({
      name: 'Probe2',
      defaultElement: 'div',
      selectors: ['root'] as const,
      render: ({ Element, getStyles, ref }) => <Element ref={ref} {...getStyles('root')} />,
    });
    const meta = getRecipeMeta(Probe);
    expect(meta?.builder).toBe('definePolymorphicComponent');
    expect(Object.isFrozen(meta)).toBe(true);
    expect(Object.keys(Probe as object)).not.toContain('recipeMeta');
  });

  it('reports part names as slots for defineCompound', () => {
    const Foo = defineCompound({
      name: 'Foo',
      classes: { root: 'foo-root', item: 'foo-item' },
      parts: {
        root: { render: ({ getStyles, children }) => <div {...getStyles()}>{children}</div> },
        item: { render: ({ getStyles }) => <span {...getStyles()} /> },
      },
    });
    expect(getRecipeMeta(Foo)).toEqual({
      builder: 'defineCompound',
      name: 'Foo',
      slots: ['root', 'item'],
      vocabularyAxes: [],
      variants: [],
      defaults: {},
    });
  });

  it('returns undefined for a plain component', () => {
    expect(getRecipeMeta(() => null)).toBeUndefined();
  });
});
