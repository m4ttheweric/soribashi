import { SoribashiProvider, createTheme, registerTheme } from '@soribashi/core';
import { configureClassNameMerge } from '@soribashi/core';
import { render, screen } from '@testing-library/react';
import { twMerge } from 'tailwind-merge';
import { describe, expect, it } from 'vitest';
import { theme } from '../../theme/index.ts';
import { Badge } from './Badge.tsx';

configureClassNameMerge(twMerge);

function wrap(ui: React.ReactElement) {
  return render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);
}

describe('Badge', () => {
  it('renders with three-band classes', () => {
    wrap(<Badge>New</Badge>);
    const el = screen.getByText('New');
    expect(el.className).toContain('inline-flex');
    expect(el.className).toContain('bg-(--badge-bg)');
  });

  it('emits data attributes from defaults', () => {
    wrap(<Badge>New</Badge>);
    const el = screen.getByText('New');
    expect(el).toHaveAttribute('data-variant', 'filled');
    expect(el).toHaveAttribute('data-intent', 'primary');
    expect(el).toHaveAttribute('data-size', 'sm');
  });

  // Copy this block as-is for each new recipe: swap the import/JSX
  // and the raw prop names for the recipe's own vocabulary axes.
  it('does not leak vocabulary props onto the DOM', () => {
    wrap(<Badge>New</Badge>);
    const el = screen.getByText('New');
    expect(el).not.toHaveAttribute('intent');
    // vacuous on <span> (React may drop unknown string attrs); intent assertion is the real guard
    expect(el).not.toHaveAttribute('size');
  });

  it('routes size through vars resolver', () => {
    wrap(<Badge size="lg">Big</Badge>);
    const el = screen.getByText('Big');
    expect(el).toHaveAttribute('data-size', 'lg');
  });

  it('threads .extend({ defaultProps })', () => {
    const custom = createTheme({
      extends: theme,
      components: [Badge.extend({ defaultProps: { size: 'xl' } })],
    });
    registerTheme(custom);
    render(
      <SoribashiProvider theme={custom}>
        <Badge>XL</Badge>
      </SoribashiProvider>,
    );
    expect(screen.getByText('XL')).toHaveAttribute('data-size', 'xl');
  });

  it('forwards ref and supports as="a"', () => {
    let ref: HTMLElement | null = null;
    wrap(
      <Badge
        ref={(el) => {
          ref = el;
        }}
        as="a"
        href="#"
      >
        Link
      </Badge>,
    );
    expect(ref).toBeInstanceOf(HTMLAnchorElement);
  });

  it('resolves twMerge conflicts', () => {
    wrap(<Badge className="bg-red-500">Red</Badge>);
    const el = screen.getByText('Red');
    expect(el.className).toContain('bg-red-500');
    expect(el.className).not.toContain('bg-(--badge-bg)');
  });

  it('rejects invalid size at compile time', () => {
    // @ts-expect-error - size="huge" is not a valid size
    void (<Badge size="huge">X</Badge>);
  });

  it('rejects invalid variant at compile time', () => {
    // @ts-expect-error - variant="nope" is not a valid variant
    void (<Badge variant="nope">X</Badge>);
  });
});
