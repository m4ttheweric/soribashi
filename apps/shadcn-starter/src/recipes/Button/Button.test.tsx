import { SoribashiProvider, configureClassNameMerge, createTheme } from '@soribashi/core';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { twMerge } from 'tailwind-merge';
import { describe, expect, it } from 'vitest';
import { theme } from '../../theme/index.ts';
import { Button } from './Button.tsx';

// The twMerge test requires configureClassNameMerge(twMerge) to have run.
// Mirrors main.tsx's opt-in so this test file is self-contained (spec A12).
configureClassNameMerge(twMerge);

const wrap = (ui: React.ReactNode, t = theme) =>
  render(<SoribashiProvider theme={t}>{ui}</SoribashiProvider>);

describe('Button walking skeleton', () => {
  it('renders a button with the three-band class string', () => {
    wrap(<Button>Save</Button>);
    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn.className).toContain('inline-flex');
    expect(btn.className).toContain('h-(--sb-button-h)');
    expect(btn.className).toContain('bg-(--button-bg)');
  });

  it('factory emits data attributes from defaults (Task 2 proof)', () => {
    wrap(<Button>Save</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('data-variant', 'filled');
    expect(btn).toHaveAttribute('data-intent', 'primary');
    expect(btn).toHaveAttribute('data-size', 'md');
  });

  // Copy this block as-is for each new recipe in the sweep: swap the import/JSX
  // and the raw prop names for the recipe's own vocabulary axes.
  it('does not leak vocabulary props onto the DOM', () => {
    wrap(<Button>Save</Button>);
    const btn = screen.getByRole('button');
    expect(btn).not.toHaveAttribute('intent');
    // vacuous on <button> (React drops string size); intent assertion is the real guard
    expect(btn).not.toHaveAttribute('size');
  });

  it('routes size through the vars resolver to codegen-emitted dimensions', () => {
    wrap(<Button size="lg">Save</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('data-size', 'lg');
    expect(btn.style.getPropertyValue('--sb-button-h')).toBe('var(--button-height-lg)');
    expect(btn.style.getPropertyValue('--sb-button-px')).toBe('var(--button-px-lg)');
  });

  it('threads theme .extend({ defaultProps }) (invariant 1, end-to-end)', () => {
    const themed = createTheme({
      extends: theme,
      components: [Button.extend({ defaultProps: { size: 'lg' } })],
    });
    wrap(<Button>Save</Button>, themed);
    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'lg');
  });

  it('forwards refs and supports polymorphic as', () => {
    const ref = createRef<HTMLAnchorElement>();
    wrap(
      <Button as="a" href="/x" ref={ref}>
        Go
      </Button>,
    );
    expect(ref.current?.tagName).toBe('A');
  });

  it('twMerge resolves utility conflicts in favor of the instance (A12 proof)', () => {
    wrap(<Button className="bg-red-500">Save</Button>);
    const cls = screen.getByRole('button').className;
    expect(cls).toContain('bg-red-500');
    expect(cls).not.toContain('bg-(--button-bg)');
  });
});

// Compile-time vocabulary narrowing (rails proof). No runtime assertions.
// @ts-expect-error size is narrowed to the theme's literals
const _badSize = <Button size="huge">x</Button>;
// @ts-expect-error variant is narrowed to the recipe tuple
const _badVariant = <Button variant="nope">x</Button>;
void _badSize;
void _badVariant;
