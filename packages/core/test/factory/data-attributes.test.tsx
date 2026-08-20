import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { defineComponent } from '../../src/factory/define-component.tsx';
import { defineCompound } from '../../src/factory/define-compound.tsx';
import { definePolymorphicComponent } from '../../src/factory/define-polymorphic-component.tsx';

const Badge = defineComponent({
  name: 'Badge',
  vocabularyAxes: ['size', 'intent'] as const,
  selectors: ['root', 'label'] as const,
  variants: ['solid', 'soft'] as const,
  defaults: { size: 'md', intent: 'primary', variant: 'solid' },
  render: ({ props, getStyles }) => (
    <div data-testid="root" {...getStyles('root')}>
      <span data-testid="label" {...getStyles('label')}>
        {(props as { children?: ReactNode }).children}
      </span>
    </div>
  ),
});

describe('data-attribute emission', () => {
  it('emits data-size, data-intent, data-variant on the root slot from defaults', () => {
    render(<Badge>hi</Badge>);
    const root = screen.getByTestId('root');
    expect(root).toHaveAttribute('data-size', 'md');
    expect(root).toHaveAttribute('data-intent', 'primary');
    expect(root).toHaveAttribute('data-variant', 'solid');
  });

  it('reflects instance props over defaults', () => {
    render(
      <Badge size="lg" intent="danger" variant="soft">
        hi
      </Badge>,
    );
    const root = screen.getByTestId('root');
    expect(root).toHaveAttribute('data-size', 'lg');
    expect(root).toHaveAttribute('data-intent', 'danger');
    expect(root).toHaveAttribute('data-variant', 'soft');
  });

  it('does not emit on non-root slots', () => {
    render(<Badge>hi</Badge>);
    const label = screen.getByTestId('label');
    expect(label).not.toHaveAttribute('data-size');
    expect(label).not.toHaveAttribute('data-intent');
    expect(label).not.toHaveAttribute('data-variant');
  });

  it('skips undeclared axes and undefined values', () => {
    const Chip = defineComponent({
      name: 'Chip',
      vocabularyAxes: ['size'] as const,
      selectors: ['root'] as const,
      render: ({ getStyles }) => <div data-testid="chip" {...getStyles('root')} />,
    });
    render(<Chip />);
    const chip = screen.getByTestId('chip');
    // no intent axis declared, no variants config, no size value provided
    expect(chip).not.toHaveAttribute('data-intent');
    expect(chip).not.toHaveAttribute('data-variant');
    expect(chip).not.toHaveAttribute('data-size');
  });

  it('emits on the polymorphic builder root', () => {
    const Pill = definePolymorphicComponent({
      name: 'Pill',
      defaultElement: 'span',
      vocabularyAxes: ['intent'] as const,
      selectors: ['root'] as const,
      variants: ['filled'] as const,
      defaults: { intent: 'neutral', variant: 'filled' },
      render: ({ Element, getStyles, ref }) => (
        <Element ref={ref} data-testid="pill" {...getStyles('root')} />
      ),
    });
    render(<Pill />);
    const pill = screen.getByTestId('pill');
    expect(pill).toHaveAttribute('data-intent', 'neutral');
    expect(pill).toHaveAttribute('data-variant', 'filled');
  });

  it('emits on the compound Root slot and supports per-call dataAttrs on parts', () => {
    const Duo = defineCompound({
      name: 'Duo',
      variants: ['boxed'] as const,
      vocabularyAxes: ['size'] as const,
      defaults: { variant: 'boxed', size: 'sm' } as Record<string, unknown>,
      context: () => ({}),
      parts: {
        root: {
          render: ({ getStyles, children }: any) => (
            <div data-testid="duo-root" {...getStyles()}>
              {children}
            </div>
          ),
        },
        item: {
          render: ({ ctx, getStyles }: any) => (
            <div
              data-testid="duo-item"
              {...getStyles({ dataAttrs: { 'data-variant': ctx.variant } })}
            />
          ),
        },
      },
    });
    render(
      <Duo>
        <Duo.Item />
      </Duo>,
    );
    expect(screen.getByTestId('duo-root')).toHaveAttribute('data-size', 'sm');
    expect(screen.getByTestId('duo-root')).toHaveAttribute('data-variant', 'boxed');
    expect(screen.getByTestId('duo-item')).toHaveAttribute('data-variant', 'boxed');
  });

  it('lets explicit attributes win over emitted data attrs', () => {
    render(<Badge attributes={{ root: { 'data-variant': 'overridden' } }}>hi</Badge>);
    expect(screen.getByTestId('root')).toHaveAttribute('data-variant', 'overridden');
  });
});
