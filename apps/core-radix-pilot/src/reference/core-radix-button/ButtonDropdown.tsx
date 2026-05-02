import { cva, VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { IconFlatRenderer, Spinner } from '@assured/design-system';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

import { cn } from '../lib/utils';
import { ButtonIcon, ButtonProps, buttonVariants, isIconKey } from './Button';

const dropdownContentVariants = cva(
  'claim-view-islands rounded-md border bg-background shadow-lg z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
  {
    variants: {
      width: {
        sm: 'min-w-[8rem]',
        md: 'min-w-[12rem]',
        lg: 'min-w-[16rem]',
        auto: '',
      },
      borderColor: {
        default: 'border-neutral-200',
        primary: 'border-primary',
        subtle: 'border-neutral-100',
      },
    },
    defaultVariants: {
      width: 'md',
      borderColor: 'default',
    },
  },
);

export interface ButtonDropdownProps
  extends VariantProps<typeof dropdownContentVariants>,
    Omit<ButtonProps, 'rightIcon' | 'asChild'> {
  /**
   * Button label text
   */
  children: React.ReactNode;
  /**
   * Dropdown menu content
   */
  dropdownContent: React.ReactNode;
  /**
   * Alignment of dropdown relative to trigger
   */
  dropdownAlign?: 'left' | 'right';
  /**
   * Custom className for dropdown container
   */
  dropdownContainerClassName?: string;
}

/**
 * ButtonDropdown - Button with dropdown menu and chevron indicator
 *
 * @example
 * <ButtonDropdown
 *   dropdownContent={
 *     <>
 *       <MenuItem onClick={() => console.log('Edit')}>Edit</MenuItem>
 *       <MenuItem onClick={() => console.log('Delete')}>Delete</MenuItem>
 *     </>
 *   }
 * >
 *   Actions
 * </ButtonDropdown>
 *
 * @example
 * <ButtonDropdown
 *   variant="outline"
 *   width="lg"
 *   dropdownAlign="right"
 *   dropdownContent={
 *     <MenuItem>Settings</MenuItem>
 *   }
 * >
 *   Options
 * </ButtonDropdown>
 */
export const ButtonDropdown = ({
  children,
  dropdownContent,
  dropdownAlign = 'left',
  width,
  borderColor,
  dropdownContainerClassName,
  variant = 'primary',
  size,
  fullWidth,
  leftIcon,
  className,
  disabled,
  isLoading,
  ...props
}: ButtonDropdownProps) => {
  const [open, setOpen] = React.useState(false);
  const align = dropdownAlign === 'right' ? 'end' : 'start';

  // Use the variant with fallback to primary
  const currentVariant = (variant || 'primary') as
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'ghost'
    | 'danger'
    | 'success';

  // Icon color based on button variant
  const iconColorClasses = {
    primary: 'text-white',
    secondary: 'text-neutral-700',
    outline: 'text-neutral-700',
    ghost: 'text-neutral-700',
    danger: 'text-white',
    success: 'text-white',
  } as const;

  const iconColor = iconColorClasses[currentVariant];

  const renderIcon = (icon: ButtonIcon) => {
    if (!isIconKey(icon)) return icon;
    return (
      <IconFlatRenderer
        iconKey={icon}
        className={`h-[16px] w-[16px] ${iconColor}`}
      />
    );
  };

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          className={cn(
            buttonVariants({ variant, size, fullWidth }),
            className,
          )}
          disabled={disabled || isLoading}
          {...props}
        >
          {isLoading ? (
            <Spinner className={`h-4 w-4 ${iconColor}`} />
          ) : (
            leftIcon && renderIcon(leftIcon)
          )}

          <span className="mx-2">{children}</span>

          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={cn(
              `h-[16px] w-[16px] ${iconColor}`,
              'transition-transform duration-200',
              open && 'rotate-180',
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          side="bottom"
          sideOffset={8}
          className={cn(
            dropdownContentVariants({ width, borderColor }),
            dropdownContainerClassName,
          )}
        >
          {dropdownContent}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
