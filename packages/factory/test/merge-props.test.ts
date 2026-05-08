import { describe, expect, it, vi } from 'vitest';
import { mergeProps } from '../src/merge-props.ts';

describe('mergeProps', () => {
  it('composes className via clsx (slot first, child overrides)', () => {
    const merged = mergeProps(
      { className: 'slot-class' },
      { className: 'child-class' },
    );
    expect(merged.className).toBe('slot-class child-class');
  });

  it('shallow-merges style; child wins on key collisions', () => {
    const merged = mergeProps(
      { style: { color: 'red', padding: 4 } },
      { style: { color: 'blue', margin: 2 } },
    );
    expect(merged.style).toEqual({ color: 'blue', padding: 4, margin: 2 });
  });

  it('composes event handlers (slot first, child second; both called)', () => {
    const slotHandler = vi.fn();
    const childHandler = vi.fn();
    const merged = mergeProps(
      { onClick: slotHandler },
      { onClick: childHandler },
    );

    const event = { type: 'click' } as unknown as React.MouseEvent;
    (merged.onClick as (e: typeof event) => void)(event);

    expect(slotHandler).toHaveBeenCalledWith(event);
    expect(childHandler).toHaveBeenCalledWith(event);
    const slotCallOrder = slotHandler.mock.invocationCallOrder[0];
    const childCallOrder = childHandler.mock.invocationCallOrder[0];
    expect(slotCallOrder!).toBeLessThan(childCallOrder!);
  });

  it('child wins on non-handler, non-className, non-style props', () => {
    const merged = mergeProps(
      { 'data-slot': 'root', 'aria-label': 'slot-label' },
      { 'data-slot': 'override', 'data-extra': 'child' },
    );
    expect(merged['data-slot']).toBe('override');
    expect(merged['data-extra']).toBe('child');
    expect(merged['aria-label']).toBe('slot-label');
  });

  it('handles undefined sides gracefully', () => {
    expect(mergeProps({}, { foo: 1 })).toEqual({ foo: 1 });
    expect(mergeProps({ foo: 1 }, {})).toEqual({ foo: 1 });
  });

  it('child undefined values do not clobber slot props', () => {
    const slotHandler = vi.fn();
    const merged = mergeProps(
      { onClick: slotHandler, 'data-slot': 'root' },
      { onClick: undefined, 'data-slot': undefined },
    );
    expect(merged.onClick).toBe(slotHandler);
    expect(merged['data-slot']).toBe('root');
  });
});
