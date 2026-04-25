import { defineComponent } from '@soribashi/core';
import './Button.css';

type Intent = 'primary' | 'neutral' | 'danger' | 'success' | 'warning' | 'info';
type Variant = 'filled' | 'outline' | 'subtle' | 'ghost' | 'link';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonOwnProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  intent?: Intent;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = defineComponent<ButtonOwnProps>({
  name: 'Button',
  element: 'button',
  selectors: ['root', 'label', 'icon', 'spinner'] as const,
  variants: ['filled', 'outline', 'subtle', 'ghost', 'link'] as const,
  classes: { root: 'pg-Button-root', label: 'pg-Button-label', icon: 'pg-Button-icon', spinner: 'pg-Button-spinner' },
  defaults: {
    intent: 'primary',
    variant: 'filled',
    size: 'md',
    loading: false,
    fullWidth: false,
  },
  render: ({ props, getStyles }) => {
    const {
      intent,
      variant,
      size,
      loading,
      fullWidth,
      leftIcon,
      rightIcon,
      children,
      classNames,
      styles,
      vars,
      attributes,
      unstyled,
      className,
      style,
      ...rest
    } = props as any;
    return (
      <button
        type="button"
        {...getStyles('root')}
        {...rest}
        data-size={size}
        data-full-width={fullWidth}
        data-loading={loading}
        disabled={(rest as any).disabled || loading}
      >
        {leftIcon && (
          <span {...getStyles('icon')} data-position="left">
            {leftIcon}
          </span>
        )}
        <span {...getStyles('label')}>{children}</span>
        {rightIcon && (
          <span {...getStyles('icon')} data-position="right">
            {rightIcon}
          </span>
        )}
        {loading && <span {...getStyles('spinner')} aria-hidden />}
      </button>
    );
  },
});
