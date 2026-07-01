import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { genericComponent } from '../src/generic-component.tsx';
import { polymorphicComponent } from '../src/polymorphic-component.tsx';

describe('lower-level escape hatches', () => {
  it('polymorphicComponent renders and exposes withProps', () => {
    const Box = polymorphicComponent(({ as: As = 'div', children }: any) => (
      <As data-test="poly">{children}</As>
    ));

    const { container } = render(<Box>X</Box>);
    expect(container.querySelector('div[data-test="poly"]')).toBeInTheDocument();
    expect(typeof (Box as any).withProps).toBe('function');
  });

  it('genericComponent renders and exposes withProps', () => {
    const Comp = genericComponent(({ value }: any) => <span>{value}</span>);
    const { container } = render(<Comp value="hi" />);
    expect(container.textContent).toBe('hi');
    expect(typeof (Comp as any).withProps).toBe('function');
  });
});
