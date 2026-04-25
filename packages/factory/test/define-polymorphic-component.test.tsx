import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
import { SoribashiProvider } from '../src/provider/provider.tsx';
import { definePolymorphicComponent } from '../src/define-polymorphic-component.tsx';

interface TextOwnProps {
  size?: 'sm' | 'md' | 'lg';
}

const Text = definePolymorphicComponent<TextOwnProps, 'p'>({
  name: 'Text',
  defaultElement: 'p',
  selectors: ['root'] as const,
  classes: { root: 'sb-Text-root' },
  defaults: { size: 'md' },
  render: ({ Element, props, getStyles }) => {
    const { size, children, classNames, styles, vars, attributes, unstyled, className, style, ...rest } = props as any;
    return (
      <Element {...getStyles('root')} {...rest} data-size={size}>
        {children}
      </Element>
    );
  },
});

const theme = createTheme({
  tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
});

const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);

describe('definePolymorphicComponent', () => {
  it('renders the default element when as is not provided', () => {
    const { container } = wrap(<Text>Hello</Text>);
    expect(container.querySelector('p')).toBeInTheDocument();
    expect(container.querySelector('p')?.textContent).toBe('Hello');
  });

  it('renders the element specified via the as prop', () => {
    const { container } = wrap(<Text as="span">Hello</Text>);
    expect(container.querySelector('span')).toBeInTheDocument();
    expect(container.querySelector('p')).toBeNull();
  });

  it('renders a custom React component when as is a component', () => {
    const Link = ({ href, children, ...rest }: any) => (
      <a href={href} data-testid="link" {...rest}>
        {children}
      </a>
    );

    const { container, getByTestId } = wrap(
      <Text as={Link} href="/">
        Click
      </Text>,
    );
    expect(getByTestId('link')).toBeInTheDocument();
    expect(container.querySelector('a')?.getAttribute('href')).toBe('/');
  });

  it('applies built-in classes regardless of element', () => {
    const { container } = wrap(<Text as="span">X</Text>);
    expect(container.querySelector('span')?.className).toContain('sb-Text-root');
  });

  it('applies size default to data-size', () => {
    const { container } = wrap(<Text>X</Text>);
    expect(container.querySelector('p')?.dataset.size).toBe('md');
  });

  it('static methods (extend, withProps) exist', () => {
    expect(typeof (Text as any).extend).toBe('function');
    expect(typeof (Text as any).withProps).toBe('function');
  });

  it('Component.withProps preserves polymorphism', () => {
    const SmallText = (Text as any).withProps({ size: 'sm' });
    const { container } = wrap(<SmallText as="span">Y</SmallText>);
    expect(container.querySelector('span')?.dataset.size).toBe('sm');
  });
});
