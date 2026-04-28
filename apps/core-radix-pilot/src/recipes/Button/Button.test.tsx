/**
 * Button recipe — behavior tests.
 *
 * Implementation comes in Task 1.5 (TDD: tests first, watch fail, implement).
 */
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SoribashiProvider } from '@soribashi/core';
import { theme } from '../../theme/index.ts';
import { Button } from './Button.tsx';

const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);

describe('Button — rendering', () => {
  it('renders children inside a <button>', () => {
    wrap(<Button>Click me</Button>);
    const btn = screen.getByRole('button', { name: /click me/i });
    expect(btn.tagName).toBe('BUTTON');
  });

  it('applies default intent (primary) and variant (filled) data attributes', () => {
    wrap(<Button>x</Button>);
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('data-intent')).toBe('primary');
    expect(btn.getAttribute('data-variant')).toBe('filled');
  });

  it('honors the size prop via data-size', () => {
    wrap(<Button size="lg">x</Button>);
    expect(screen.getByRole('button').getAttribute('data-size')).toBe('lg');
  });

  it('renders leftIcon before label and rightIcon after', () => {
    wrap(
      <Button leftIcon={<span data-testid="left">L</span>} rightIcon={<span data-testid="right">R</span>}>
        label
      </Button>,
    );
    const btn = screen.getByRole('button');
    const children = Array.from(btn.children);
    const leftIdx = children.findIndex((c) => c.querySelector('[data-testid="left"]') !== null);
    const labelIdx = children.findIndex((c) => c.textContent === 'label');
    const rightIdx = children.findIndex((c) => c.querySelector('[data-testid="right"]') !== null);
    expect(leftIdx).toBeGreaterThanOrEqual(0);
    expect(labelIdx).toBeGreaterThan(leftIdx);
    expect(rightIdx).toBeGreaterThan(labelIdx);
  });
});

describe('Button — interactivity', () => {
  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    wrap(<Button onClick={onClick}>x</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn();
    wrap(<Button disabled onClick={onClick}>x</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not call onClick when loading', () => {
    const onClick = vi.fn();
    wrap(<Button loading onClick={onClick}>x</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders the spinner when loading', () => {
    wrap(<Button loading>x</Button>);
    const btn = screen.getByRole('button');
    expect(btn.querySelector('[data-part="spinner"]')).not.toBeNull();
  });

  it('marks the button disabled in DOM when loading', () => {
    wrap(<Button loading>x</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

describe('Button — fullWidth', () => {
  it('sets data-full-width="true" when fullWidth is true', () => {
    wrap(<Button fullWidth>x</Button>);
    expect(screen.getByRole('button').getAttribute('data-full-width')).toBe('true');
  });
});

describe('Button — polymorphism', () => {
  it('renders an <a> with href when as="a"', () => {
    wrap(
      <Button as="a" href="/somewhere">
        link
      </Button>,
    );
    const a = screen.getByRole('link', { name: /link/i });
    expect(a.tagName).toBe('A');
    expect(a.getAttribute('href')).toBe('/somewhere');
  });
});

describe('Button — ref forwarding', () => {
  // The `ref` prop on PolymorphicProps types as a complex intersection
  // (`RefObject<T> & RefObject<callback-ref-or-RefObject<T>-or-null>`) that
  // doesn't accept a plain `createRef<T>()`. Cast through `unknown` here as
  // a documented workaround — see conversion journal § 4 Gap 7 (the type
  // ergonomics are part of that gap, not a recipe-author concern).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const refProp = (ref: unknown): any => ({ ref });

  it('forwards ref to the rendered <button> element by default', () => {
    const ref = createRef<HTMLButtonElement>();
    wrap(<Button {...refProp(ref)}>x</Button>);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe('BUTTON');
  });

  it('forwards ref to the rendered <a> when as="a"', () => {
    const ref = createRef<HTMLAnchorElement>();
    wrap(
      <Button as="a" href="/x" {...refProp(ref)}>
        link
      </Button>,
    );
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe('A');
  });

  it('forwarded ref can drive imperative focus on the rendered element', () => {
    const ref = createRef<HTMLButtonElement>();
    wrap(<Button {...refProp(ref)}>x</Button>);
    ref.current?.focus();
    expect(document.activeElement).toBe(ref.current);
  });
});
