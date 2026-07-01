import { createTheme } from '@soribashi/theme';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { defineComponent } from '../src/define-component.tsx';
import { SoribashiProvider } from '../src/provider/provider.tsx';

interface ButtonOwnProps {
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
}

const Button = defineComponent<ButtonOwnProps>({
  name: 'Button',
  selectors: ['root', 'label', 'icon'] as const,
  classes: { root: 'sb-Button-root', label: 'sb-Button-label', icon: 'sb-Button-icon' },
  defaults: { loading: false, fullWidth: false },
  render: ({ props, getStyles }) => (
    <button {...getStyles('root')}>
      {props.leftIcon && <span {...getStyles('icon')}>{props.leftIcon}</span>}
      <span {...getStyles('label')}>{props.children as React.ReactNode}</span>
    </button>
  ),
});

const theme = createTheme({
  tokens: {
    colors: {
      primary: { '500': 'hsl(217 91% 60%)', foreground: 'white' },
    } as any,
    radius: {},
    spacing: {},
    fontSize: {},
  },
});

const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);

describe('defineComponent — basic rendering', () => {
  it('renders the root with the configured class', () => {
    const { container } = wrap(<Button>Click</Button>);
    expect(container.querySelector('button')?.className).toContain('sb-Button-root');
  });

  it('passes children through to label slot', () => {
    const { getByText } = wrap(<Button>Hello</Button>);
    expect(getByText('Hello')).toBeInTheDocument();
  });

  it('renders leftIcon when provided', () => {
    const { container } = wrap(<Button leftIcon={<span data-testid="icon">★</span>}>X</Button>);
    expect(container.querySelector('[data-testid="icon"]')).toBeInTheDocument();
  });

  it('respects instance className on root', () => {
    const { container } = wrap(<Button className="my-class">X</Button>);
    expect(container.querySelector('button')?.className).toContain('my-class');
  });
});

describe('defineComponent — withProps', () => {
  it('Component.withProps returns a component with presets', () => {
    const LoadingButton = Button.withProps({ loading: true });
    const { container } = wrap(<LoadingButton>X</LoadingButton>);
    expect(container.querySelector('button')).toBeInTheDocument();
  });
});

describe('defineComponent — extend (theme defaults)', () => {
  it('theme component classNames are applied to root', () => {
    const themed = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: { classNames: { root: 'theme-extra' } },
      },
    });

    const { container } = render(
      <SoribashiProvider theme={themed}>
        <Button>X</Button>
      </SoribashiProvider>,
    );
    expect(container.querySelector('button')?.className).toContain('theme-extra');
  });

  it('Component.classes is exposed', () => {
    expect(Button.classes).toBeDefined();
    expect(Button.classes?.root).toBe('sb-Button-root');
  });

  it('Component.displayName matches name', () => {
    expect(Button.displayName).toBe('Button');
  });
});
