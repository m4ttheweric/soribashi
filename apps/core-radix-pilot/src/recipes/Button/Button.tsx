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
import type { MouseEvent, ReactNode } from 'react';
import { definePolymorphicComponent } from '../../builders.ts';
import type { PolymorphicRenderCtx } from '@soribashi/core';
import classes from './Button.module.css';

const variants = ['filled', 'outline', 'subtle', 'ghost', 'link'] as const;
type Variant = (typeof variants)[number];

// size/intent are vocabulary-axis props kept as `string` because the factory's
// public return type threads TOwnProps directly — InjectedVocabularyProps<TVocabAxes>
// threading into the external call-site type is deferred to PR #12.
// variant is narrowed per-recipe (compile-time) via the hoisted `variants` const;
// the runtime Zod registry (via vocabularyAxes) enforces size and intent values.
export interface ButtonOwnProps {
  intent?: string;
  variant?: Variant;
  size?: string;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
}

// Type-param order: <TOwnProps, TDefaultAs, TSelectors, TVariants, TVocabAxes>
// matches the signature in packages/factory/src/define-polymorphic-component.tsx.
export const Button = definePolymorphicComponent<
  ButtonOwnProps,
  'button',
  readonly ['root', 'inner', 'label', 'icon', 'spinner'],
  typeof variants,
  readonly ['size', 'intent', 'variant']
>({
  name: 'Button',
  defaultElement: 'button',
  vocabularyAxes: ['size', 'intent', 'variant'] as const,
  selectors: ['root', 'inner', 'label', 'icon', 'spinner'] as const,
  variants,
  classes,
  defaults: {
    intent: 'primary',
    variant: 'filled',
    size: 'md',
    loading: false,
    fullWidth: false,
  },
  render: ({
    Element,
    props,
    getStyles,
    ref,
  }: PolymorphicRenderCtx<
    ButtonOwnProps,
    'button',
    readonly ['root', 'inner', 'label', 'icon', 'spinner'],
    typeof variants,
    readonly ['size', 'intent', 'variant']
  >) => {
    // Wave 1 Gap 2 documented convention — recipes destructure their own props
    // alongside the seven styles-API framework keys (classNames, styles, vars,
    // attributes, unstyled, className, style) so `...rest` only carries HTML
    // attributes the consumer passed for spreading on <Element>. Composition
    // (recipes wrapping inner soribashi primitives) is why we don't auto-strip
    // at the factory level — see playbook § 2.1.
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
      classNames: _classNames,
      styles: _styles,
      vars: _vars,
      attributes: _attributes,
      unstyled: _unstyled,
      className: _className,
      style: _style,
      ...rest
    } = props;

    const isDisabled = Boolean(disabled) || Boolean(loading);
    const isButton = Element === 'button';

    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
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
