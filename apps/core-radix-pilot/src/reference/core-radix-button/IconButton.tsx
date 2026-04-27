import { cva, VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { IconFlatRenderer, IconKey } from '@assured/design-system';
import { Slot } from '@radix-ui/react-slot';

import { cn } from '../lib/utils';

const iconButtonVariants = cva(
  'inline-flex items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-white hover:bg-primary-600 active:bg-primary-700',
        secondary:
          'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:bg-neutral-300',
        outline: 'border bg-background text-neutral hover:bg-neutral-50',
        ghost: 'text-neutral-600 hover:bg-neutral-100',
      },
      size: {
        sm: 'h-8 w-8',
        md: 'h-9 w-9',
        lg: 'h-11 w-11',
        xl: 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'outline',
      size: 'md',
    },
  },
);

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  /**
   * Icon to display in the button
   */
  icon: IconKey;
  /**
   * Required accessible label for screen readers
   */
  'aria-label': string;
  /**
   * Optional dot indicator (e.g., notification badge)
   */
  dot?: React.ReactNode;
  /**
   * Optional class override for the dot wrapper positioning/styling
   */
  dotClassName?: string;
  /**
   * Render as a child element (e.g., <a> tag)
   */
  asChild?: boolean;
}

/**
 * IconButton - Button that displays only an icon
 *
 * @example
 * // Basic icon button
 * <IconButton aria-label="Delete">
 *   <IconFlatRenderer iconKey={islandsIconKeys.trash} />
 * </IconButton>
 *
 * @example
 * // Different variants
 * <IconButton variant="primary" aria-label="Add">
 *   <IconFlatRenderer iconKey={islandsIconKeys.plus} />
 * </IconButton>
 */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      variant,
      size,
      icon,
      dot,
      dotClassName,
      asChild = false,
      'aria-label': ariaLabel,
      ...props
    },
    ref,
  ) => {
    const iconSizeClasses = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
      xl: 'h-6 w-6',
    };

    const Comp = asChild ? Slot : 'button';

    if (asChild) {
      // When using asChild, we can't add the relative positioning or dot
      return (
        <Comp
          className={cn(iconButtonVariants({ variant, size, className }))}
          ref={ref}
          aria-label={ariaLabel}
          {...props}
        />
      );
    }

    return (
      <button
        className={cn(
          iconButtonVariants({ variant, size, className }),
          'relative',
        )}
        ref={ref}
        aria-label={ariaLabel}
        {...props}
      >
        <IconFlatRenderer
          iconKey={icon}
          className={iconSizeClasses[size || 'md']}
        />
        {dot && (
          <span
            className={cn(
              'absolute top-[4px] right-[4px] pointer-events-none',
              dotClassName,
            )}
          >
            {dot}
          </span>
        )}
      </button>
    );
  },
);
IconButton.displayName = 'IconButton';

export { iconButtonVariants };
