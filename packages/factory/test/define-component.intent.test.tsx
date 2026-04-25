import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
import { SoribashiProvider } from '../src/provider/provider.tsx';
import { defineComponent } from '../src/define-component.tsx';

interface ButtonOwnProps {
  intent?: 'primary' | 'danger';
  variant?: 'filled' | 'outline';
}

const Button = defineComponent<ButtonOwnProps>({
  name: 'Button',
  selectors: ['root'] as const,
  variants: ['filled', 'outline'] as const,
  classes: { root: 'sb-Button-root' },
  defaults: { intent: 'primary', variant: 'filled' },
  render: ({ props, getStyles }) => (
    <button {...getStyles('root')}>{props.children as any}</button>
  ),
});

const theme = createTheme({
  tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
});

describe('defineComponent — intent → CSS vars on root', () => {
  it('produces --button-bg, --button-color, --button-border on root style', () => {
    const { container } = render(
      <SoribashiProvider theme={theme}>
        <Button intent="primary" variant="filled">
          X
        </Button>
      </SoribashiProvider>,
    );
    const btn = container.querySelector('button') as HTMLElement;
    const style = btn.style;
    expect(style.getPropertyValue('--button-bg')).toBe('var(--color-primary-500)');
    expect(style.getPropertyValue('--button-color')).toBe('var(--color-primary-foreground)');
    expect(style.getPropertyValue('--button-border')).toBe('transparent');
  });

  it('outline variant produces transparent bg and intent-700 color', () => {
    const { container } = render(
      <SoribashiProvider theme={theme}>
        <Button intent="danger" variant="outline">
          X
        </Button>
      </SoribashiProvider>,
    );
    const btn = container.querySelector('button') as HTMLElement;
    const style = btn.style;
    expect(style.getPropertyValue('--button-bg')).toBe('transparent');
    expect(style.getPropertyValue('--button-color')).toBe('var(--color-danger-700)');
    expect(style.getPropertyValue('--button-border')).toBe('var(--color-danger-500)');
  });

  it('does not produce vars when component has no variants declared', () => {
    interface PaperProps {
      shadow?: string;
    }
    const Paper = defineComponent<PaperProps>({
      name: 'Paper',
      selectors: ['root'] as const,
      classes: { root: 'sb-Paper-root' },
      defaults: { shadow: 'sm' },
      render: ({ props, getStyles }) => <div {...getStyles('root')}>{props.children as any}</div>,
    });

    const { container } = render(
      <SoribashiProvider theme={theme}>
        <Paper>X</Paper>
      </SoribashiProvider>,
    );
    const div = container.querySelector('div') as HTMLElement;
    expect(div.style.getPropertyValue('--paper-bg')).toBe('');
  });

  it('explicit vars resolver in defineComponent overrides auto-vars', () => {
    interface BadgeProps {
      intent?: 'primary' | 'danger';
      variant?: 'filled';
    }
    const Badge = defineComponent<BadgeProps>({
      name: 'Badge',
      selectors: ['root'] as const,
      variants: ['filled'] as const,
      classes: { root: 'sb-Badge-root' },
      defaults: { intent: 'primary', variant: 'filled' },
      vars: () => ({
        root: { '--badge-bg': 'magenta' },
      }),
      render: ({ getStyles }) => <span {...getStyles('root')}>X</span>,
    });

    const { container } = render(
      <SoribashiProvider theme={theme}>
        <Badge>X</Badge>
      </SoribashiProvider>,
    );
    const span = container.querySelector('span') as HTMLElement;
    expect(span.style.getPropertyValue('--badge-bg')).toBe('magenta');
  });
});
