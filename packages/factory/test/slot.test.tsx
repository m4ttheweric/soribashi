import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Slot } from '../src/slot.tsx';

describe('Slot', () => {
  it('renders the single child element', () => {
    const { getByText } = render(
      <Slot>
        <button>Click</button>
      </Slot>,
    );
    expect(getByText('Click').tagName).toBe('BUTTON');
  });

  it('throws when given multiple children', () => {
    expect(() =>
      render(
        <Slot>
          <button>One</button>
          <button>Two</button>
        </Slot>,
      ),
    ).toThrow();
  });

  it('returns null for non-element children', () => {
    const { container } = render(<Slot>plain text</Slot>);
    expect(container.firstChild).toBeNull();
  });

  it('merges className from slot onto child', () => {
    const { getByText } = render(
      <Slot className="from-slot">
        <button className="from-child">Click</button>
      </Slot>,
    );
    expect(getByText('Click').className).toBe('from-slot from-child');
  });

  it('composes event handlers (slot first, child second)', () => {
    const slotHandler = vi.fn();
    const childHandler = vi.fn();
    const { getByText } = render(
      <Slot onClick={slotHandler}>
        <button onClick={childHandler}>Click</button>
      </Slot>,
    );
    fireEvent.click(getByText('Click'));

    expect(slotHandler).toHaveBeenCalled();
    expect(childHandler).toHaveBeenCalled();
    expect(slotHandler.mock.invocationCallOrder[0]).toBeLessThan(
      childHandler.mock.invocationCallOrder[0],
    );
  });

  it('forwards both slot ref and child ref', () => {
    const slotRef = createRef<HTMLButtonElement>();
    const childRef = createRef<HTMLButtonElement>();
    render(
      <Slot ref={slotRef}>
        <button ref={childRef}>Click</button>
      </Slot>,
    );
    expect(slotRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(childRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(slotRef.current).toBe(childRef.current);
  });

  it('passes through DOM attributes (data-*, aria-*)', () => {
    const { getByText } = render(
      <Slot data-slot="trigger" aria-label="From slot">
        <button>Click</button>
      </Slot>,
    );
    const btn = getByText('Click');
    expect(btn.getAttribute('data-slot')).toBe('trigger');
    expect(btn.getAttribute('aria-label')).toBe('From slot');
  });
});
