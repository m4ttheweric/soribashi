// packages/factory/test/recipe-meta.test.tsx
import type { ReactNode } from 'react';
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
      parts: [],
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
    expect(Object.isFrozen(meta?.slots)).toBe(true);
    expect(Object.isFrozen(meta?.variants)).toBe(true);
    expect(Object.isFrozen(meta?.defaults)).toBe(true);
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
      parts: ['root', 'item'],
      vocabularyAxes: [],
      variants: [],
      defaults: {},
    });
  });

  it('returns undefined for a plain component', () => {
    expect(getRecipeMeta(() => null)).toBeUndefined();
  });

  it('reports explicit slotKeys as slots and part names as parts', () => {
    const Compound = defineCompound({
      name: 'Fixture',
      slotKeys: ['root', 'positioner', 'popup'] as const,
      classes: { popup: 'popup-class' },
      parts: {
        root: { render: ({ children }: { children?: ReactNode }) => <div>{children}</div> },
        content: { render: () => <div /> },
      },
    });
    const meta = getRecipeMeta(Compound)!;
    expect(meta.slots).toEqual(['root', 'positioner', 'popup']);
    expect(meta.parts).toEqual(['root', 'content']);
  });

  it('falls back to parts union classes when slotKeys is absent', () => {
    const Compound = defineCompound({
      name: 'Fallback',
      classes: { popup: 'popup-class' },
      parts: {
        root: { render: ({ children }: { children?: ReactNode }) => <div>{children}</div> },
        content: { render: () => <div /> },
      },
    });
    const meta = getRecipeMeta(Compound)!;
    expect(meta.slots).toEqual(['root', 'content', 'popup']);
    expect(meta.parts).toEqual(['root', 'content']);
  });

  it('reports an empty parts array for non-compound builders', () => {
    const Component = defineComponent({
      name: 'Plain',
      selectors: ['root'] as const,
      render: ({ getStyles }) => <div {...getStyles('root')} />,
    });
    expect(getRecipeMeta(Component)!.parts).toEqual([]);
  });
});
