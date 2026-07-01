import { fireEvent, render } from '@testing-library/react';
import { type ReactElement, createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Slot } from '../src/slot.tsx';

/**
 * Builds an element shaped like React 19's output: ref lives in props,
 * element.ref is null. Lets the props.ref fallback path run on a React 18
 * runtime.
 */
function asReact19Element(element: ReactElement, ref: React.Ref<unknown>): ReactElement {
  return {
    ...element,
    ref: null,
    props: { ...(element.props as object), ref },
  } as unknown as ReactElement;
}

describe('Slot', () => {
  it('renders the single child element', () => {
    const { getByText } = render(
      <Slot>
        <button type="button">Click</button>
      </Slot>,
    );
    expect(getByText('Click').tagName).toBe('BUTTON');
  });

  it('throws when given multiple children', () => {
    expect(() =>
      render(
        <Slot>
          <button type="button">One</button>
          <button type="button">Two</button>
        </Slot>,
      ),
    ).toThrow();
  });

  it('throws when given a Fragment child', () => {
    expect(() =>
      render(
        <Slot className="x">
          {/* biome-ignore lint/complexity/noUselessFragments: the Fragment child is the test subject */}
          <>
            <button type="button">inside</button>
          </>
        </Slot>,
      ),
    ).toThrow(/Fragment/);
  });

  it('returns null for non-element children and warns in dev', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(<Slot>plain text</Slot>);
    expect(container.firstChild).toBeNull();
    expect(errSpy).toHaveBeenCalled();
    expect(String(errSpy.mock.calls[0]![0])).toContain('Slot');
    errSpy.mockRestore();
  });

  it('merges className from slot onto child', () => {
    const { getByText } = render(
      <Slot className="from-slot">
        <button type="button" className="from-child">
          Click
        </button>
      </Slot>,
    );
    expect(getByText('Click').className).toBe('from-slot from-child');
  });

  it('composes event handlers (slot first, child second)', () => {
    const slotHandler = vi.fn();
    const childHandler = vi.fn();
    const { getByText } = render(
      <Slot onClick={slotHandler}>
        <button type="button" onClick={childHandler}>
          Click
        </button>
      </Slot>,
    );
    fireEvent.click(getByText('Click'));

    expect(slotHandler).toHaveBeenCalled();
    expect(childHandler).toHaveBeenCalled();
    expect(slotHandler.mock.invocationCallOrder[0]!).toBeLessThan(
      childHandler.mock.invocationCallOrder[0]!,
    );
  });

  it('forwards both slot ref and child ref', () => {
    const slotRef = createRef<HTMLButtonElement>();
    const childRef = createRef<HTMLButtonElement>();
    render(
      <Slot ref={slotRef}>
        <button type="button" ref={childRef}>
          Click
        </button>
      </Slot>,
    );
    expect(slotRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(childRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(slotRef.current).toBe(childRef.current);
  });

  it('passes through DOM attributes (data-*, aria-*)', () => {
    const { getByText } = render(
      <Slot data-slot="trigger" aria-label="From slot">
        <button type="button">Click</button>
      </Slot>,
    );
    const btn = getByText('Click');
    expect(btn.getAttribute('data-slot')).toBe('trigger');
    expect(btn.getAttribute('aria-label')).toBe('From slot');
  });
});

// React 19 removed element.ref; the child's ref lives in props.ref. Slot must
// read that fallback and merge it with the forwarded ref rather than
// overwriting it (the Radix getElementRef pattern).
describe('Slot — React 19 props.ref fallback', () => {
  it('attaches a child ref that lives in props.ref', () => {
    const childRef = createRef<HTMLButtonElement>();
    render(<Slot>{asReact19Element(<button type="button">Click</button>, childRef)}</Slot>);
    expect(childRef.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('merges forwardedRef with a props.ref child ref instead of overwriting', () => {
    const slotRef = createRef<HTMLButtonElement>();
    const childRef = createRef<HTMLButtonElement>();
    render(
      <Slot ref={slotRef}>{asReact19Element(<button type="button">Click</button>, childRef)}</Slot>,
    );
    expect(slotRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(childRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(slotRef.current).toBe(childRef.current);
  });
});
