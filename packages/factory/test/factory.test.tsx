import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { factory } from '../src/factory.tsx';
import type { FactoryPayload } from '../src/types/index.ts';

type ButtonFactory = FactoryPayload & {
  props: { children?: React.ReactNode; size?: string };
  ref: HTMLButtonElement;
  stylesNames: 'root' | 'label';
};

const Button = factory<ButtonFactory>((props) => (
  <button data-size={props.size}>{props.children}</button>
));

Button.displayName = 'Button';

describe('factory', () => {
  it('returns a renderable component', () => {
    const { getByText } = render(<Button>Click</Button>);
    expect(getByText('Click')).toBeInTheDocument();
  });

  it('attaches extend as identity', () => {
    expect(typeof Button.extend).toBe('function');
    const config = { defaultProps: { size: 'lg' } };
    expect(Button.extend(config)).toBe(config);
  });

  it('attaches withProps that returns a component preset', () => {
    const LargeButton = Button.withProps({ size: 'lg' });
    const { container } = render(<LargeButton>X</LargeButton>);
    expect(container.querySelector('button')?.dataset.size).toBe('lg');
  });

  it('withProps: instance props override preset', () => {
    const LargeButton = Button.withProps({ size: 'lg' });
    const { container } = render(<LargeButton size="sm">X</LargeButton>);
    expect(container.querySelector('button')?.dataset.size).toBe('sm');
  });

  it('preserves displayName on withProps result', () => {
    const LargeButton = Button.withProps({ size: 'lg' });
    expect((LargeButton as any).displayName).toContain('Button');
  });
});
