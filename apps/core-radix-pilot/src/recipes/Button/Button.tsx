/**
 * Button recipe — Wave 1 pilot for the pure-styled-primitive category.
 *
 * Authored with `definePolymorphicComponent` from @soribashi/factory
 * (re-exported via @soribashi/core). Consumes only the consolidated
 * theme tokens — no shad-*, no legacy CVI vars.
 *
 * Spec: docs/superpowers/specs/2026-04-26-token-consolidation-and-button-pilot-design.md § 7
 * Journal: docs/superpowers/pilots/2026-04-26-button-conversion.md
 */
import type { ReactNode, MouseEvent } from 'react';
import { definePolymorphicComponent } from '@soribashi/core';
import './Button.css';

type Intent = 'primary' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';
type Variant = 'filled' | 'outline' | 'subtle' | 'ghost' | 'link';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonOwnProps {
  intent?: Intent;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
}

// Type-param order: <TOwnProps, TDefaultAs> — matches the signature in
// packages/factory/src/define-polymorphic-component.tsx.
export const Button = definePolymorphicComponent<ButtonOwnProps, 'button'>({
  name: 'Button',
  defaultElement: 'button',
  selectors: ['root', 'inner', 'label', 'icon', 'spinner'] as const,
  variants: ['filled', 'outline', 'subtle', 'ghost', 'link'] as const,
  classes: {
    root: 'cr-Button-root',
    inner: 'cr-Button-inner',
    label: 'cr-Button-label',
    icon: 'cr-Button-icon',
    spinner: 'cr-Button-spinner',
  },
  defaults: {
    intent: 'primary',
    variant: 'filled',
    size: 'md',
    loading: false,
    fullWidth: false,
  },
  render: ({ Element, props, getStyles, ref }) => {
    const {
      intent,
      variant,
      size,
      loading,
      fullWidth,
      leftIcon,
      rightIcon,
      children,
      disabled,
      onClick,
      // strip styles-api props so they don't leak onto the DOM
      classNames: _classNames,
      styles: _styles,
      vars: _vars,
      attributes: _attributes,
      unstyled: _unstyled,
      className: _className,
      style: _style,
      ...rest
    } = props as ButtonOwnProps & {
      disabled?: boolean;
      onClick?: (e: MouseEvent) => void;
      classNames?: unknown;
      styles?: unknown;
      vars?: unknown;
      attributes?: unknown;
      unstyled?: unknown;
      className?: string;
      style?: unknown;
      [k: string]: unknown;
    };

    const isDisabled = Boolean(disabled) || Boolean(loading);
    const isButton = Element === 'button';

    const handleClick = (e: MouseEvent) => {
      if (isDisabled) {
        e.preventDefault();
        return;
      }
      onClick?.(e);
    };

    return (
      <Element
        ref={ref}
        type={isButton ? 'button' : undefined}
        {...getStyles('root')}
        {...rest}
        data-intent={intent}
        data-variant={variant}
        data-size={size}
        data-full-width={fullWidth ? 'true' : undefined}
        data-loading={loading ? 'true' : undefined}
        data-part="root"
        disabled={isButton ? isDisabled : undefined}
        aria-disabled={!isButton && isDisabled ? true : undefined}
        onClick={handleClick}
      >
        {/*
          Spinner rendered unconditionally and positioned absolutely so the
          loading transition can animate IN and OUT smoothly via CSS — pure
          conditional mount/unmount would skip the exit animation. The
          [data-loading] attr on the root drives the visible state.
        */}
        <span {...getStyles('spinner')} data-part="spinner" aria-hidden />

        {/*
          Inner wrapper so the icons + label can slide down + fade out as a
          single block when loading, revealing the spinner at center. Pattern
          ported from Mantine's Button (`.inner` wrapper + transitions).
        */}
        <span {...getStyles('inner')} data-part="inner">
          {leftIcon && (
            <span {...getStyles('icon')} data-part="icon" data-position="left">
              {leftIcon}
            </span>
          )}
          <span {...getStyles('label')} data-part="label" data-loading={loading ? 'true' : undefined}>
            {children}
          </span>
          {rightIcon && (
            <span {...getStyles('icon')} data-part="icon" data-position="right">
              {rightIcon}
            </span>
          )}
        </span>
      </Element>
    );
  },
});
