import { render, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { hashStyleProps } from '../src/hash-style-props.ts';
import { InlineStyles } from '../src/inline-styles/InlineStyles.tsx';
import { useRandomClassName } from '../src/use-random-class-name.ts';

describe('useRandomClassName', () => {
  it('returns a non-empty string', () => {
    const { result } = renderHook(() => useRandomClassName());
    expect(typeof result.current).toBe('string');
    expect(result.current.length).toBeGreaterThan(0);
  });

  it('returns a stable value across re-renders', () => {
    const { result, rerender } = renderHook(() => useRandomClassName());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it('produces a CSS-class-safe name (no colons)', () => {
    const { result } = renderHook(() => useRandomClassName());
    expect(result.current).not.toContain(':');
  });

  it('starts with the sb- prefix', () => {
    const { result } = renderHook(() => useRandomClassName());
    expect(result.current.startsWith('sb-')).toBe(true);
  });
});

describe('hashStyleProps', () => {
  it('produces the same hash for identical inputs', () => {
    const a = hashStyleProps({ padding: '1rem' }, { sm: { padding: '0.5rem' } });
    const b = hashStyleProps({ padding: '1rem' }, { sm: { padding: '0.5rem' } });
    expect(a).toBe(b);
  });

  it('produces different hashes for different inputs', () => {
    const a = hashStyleProps({ padding: '1rem' }, {});
    const b = hashStyleProps({ padding: '2rem' }, {});
    expect(a).not.toBe(b);
  });

  it('produces a CSS-class-safe string', () => {
    const h = hashStyleProps({ padding: '1rem' }, {});
    expect(h).toMatch(/^sb-h-[a-z0-9]+$/);
  });

  it('differentiates by media-query content', () => {
    const a = hashStyleProps({}, { '(min-width: 48em)': { padding: '1rem' } });
    const b = hashStyleProps({}, { '(min-width: 64em)': { padding: '1rem' } });
    expect(a).not.toBe(b);
  });
});

describe('InlineStyles', () => {
  it('renders a style element with base styles', () => {
    const { container } = render(
      <InlineStyles selector=".my-class" styles={{ padding: '1rem', color: 'red' }} media={{}} />,
    );
    const style = container.querySelector('style');
    expect(style).toBeInTheDocument();
    expect(style?.textContent).toContain('.my-class');
    expect(style?.textContent).toContain('padding: 1rem');
    expect(style?.textContent).toContain('color: red');
  });

  it('renders @media queries for media-specific styles', () => {
    const { container } = render(
      <InlineStyles
        selector=".my-class"
        styles={{}}
        media={{ '(min-width: 48em)': { padding: '2rem' } }}
      />,
    );
    const text = container.querySelector('style')?.textContent ?? '';
    expect(text).toContain('@media (min-width: 48em)');
    expect(text).toContain('padding: 2rem');
  });

  it('converts camelCase prop names to kebab-case', () => {
    const { container } = render(
      <InlineStyles
        selector=".x"
        styles={{ marginInlineStart: '1rem', borderRadius: '4px' }}
        media={{}}
      />,
    );
    const text = container.querySelector('style')?.textContent ?? '';
    expect(text).toContain('margin-inline-start: 1rem');
    expect(text).toContain('border-radius: 4px');
  });

  it('preserves CSS custom property names (--my-var)', () => {
    const { container } = render(
      <InlineStyles selector=".x" styles={{ '--my-var': '1rem' }} media={{}} />,
    );
    const text = container.querySelector('style')?.textContent ?? '';
    expect(text).toContain('--my-var: 1rem');
  });

  it('omits undefined and null values', () => {
    const { container } = render(
      <InlineStyles
        selector=".x"
        styles={{ padding: '1rem', margin: undefined, border: null as any }}
        media={{}}
      />,
    );
    const text = container.querySelector('style')?.textContent ?? '';
    expect(text).toContain('padding: 1rem');
    expect(text).not.toContain('margin');
    expect(text).not.toContain('border');
  });
});
