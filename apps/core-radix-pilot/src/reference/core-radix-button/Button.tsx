import { cva, VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { IconFlatRenderer, IconKey, Spinner } from '@assured/design-system';
import { Slot } from '@radix-ui/react-slot';

import { cn } from '../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-white hover:bg-primary-600 active:bg-primary-700',
        secondary:
          'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:bg-neutral-300',
        outline:
          'border border-neutral-300 bg-background text-neutral-900 hover:bg-neutral-50 active:bg-neutral-100',
        ghost:
          'bg-transparent text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200',
        danger: 'bg-error text-white hover:bg-error-600 active:bg-error-700',
        success:
          'bg-success text-white hover:bg-success-600 active:bg-success-700',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-9 px-4 text-sm',
        lg: 'h-11 px-6 text-base',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export type ButtonIcon = IconKey | React.ReactElement;

export const isIconKey = (icon: ButtonIcon): icon is IconKey =>
  !React.isValidElement(icon);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Render as a child element (e.g., <a> tag)
   */
  asChild?: boolean;
  /**
   * Show loading spinner
   */
  isLoading?: boolean;
  /**
   * Icon to display on the left side
   */
  leftIcon?: ButtonIcon;
  /**
   * Icon to display on the right side
   */
  rightIcon?: ButtonIcon;
}

/**
 * Button component - Interactive element for user actions
 *
 * @example
 * // Basic button
 * <Button>Click me</Button>
 *
 * @example
 * // Button variants
 * <Button variant="primary">Primary</Button>
 * <Button variant="secondary">Secondary</Button>
 * <Button variant="outline">Outline</Button>
 * <Button variant="ghost">Ghost</Button>
 *
 * @example
 * // Button sizes
 * <Button size="sm">Small</Button>
 * <Button size="md">Medium</Button>
 * <Button size="lg">Large</Button>
 *
 * @example
 * // With icons
 * <Button leftIcon="ICON_FLAT_PLUS_OUTLINE">Add Item</Button>
 * <Button rightIcon="ICON_FLAT_ARROW_RIGHT">Next</Button>
 *
 * @example
 * // Loading state
 * <Button isLoading>Saving...</Button>
 *
 * @example
 * // As link
 * <Button asChild>
 *   <a href="/somewhere">Link Button</a>
 * </Button>
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const iconColorClasses = {
      primary: 'text-white',
      secondary: 'text-neutral-700',
      outline: 'text-neutral-700',
      ghost: 'text-neutral-700',
      danger: 'text-white',
      success: 'text-white',
    };

    const iconColor = iconColorClasses[variant || 'primary'];

    const renderIcon = (icon: ButtonIcon) => {
      if (!isIconKey(icon)) {
        return icon;
      }

      return (
        <IconFlatRenderer
          iconKey={icon}
          className={`h-[16px] w-[16px] ${iconColor}`}
        />
      );
    };

    // If asChild is true and we have icons/loading, we can't use Slot
    // because Slot expects a single child
    if (asChild && !isLoading && !leftIcon && !rightIcon) {
      return (
        <Slot
          className={cn(
            buttonVariants({ variant, size, fullWidth, className }),
          )}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Spinner className={`h-4 w-4 ${iconColor}`} />
        ) : (
          leftIcon && renderIcon(leftIcon)
        )}

        <span className="mx-2">{children}</span>

        {rightIcon && renderIcon(rightIcon)}
      </button>
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
