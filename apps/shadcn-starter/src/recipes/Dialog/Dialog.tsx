import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { defineCompound } from '../../builders.ts';

/**
 * Dialog recipe -- Category 2 overlay compound, following Tooltip's template
 * (apps/shadcn-starter/src/recipes/Tooltip/Tooltip.tsx): no vocabulary axes,
 * no variants, pure structural compound built with defineCompound.
 *
 * Parts:
 *   - root: wraps RadixDialog.Root, threads open/defaultOpen/onOpenChange.
 *   - trigger: asChild-wraps the consumer's child in a span (same pattern as
 *     Tooltip.Trigger) so Radix's open-state trigger behavior attaches to a
 *     node that also carries the compound's styles-API output.
 *   - content: renders inside RadixDialog.Portal; renders the overlay backdrop
 *     and a built-in X close button as style-addressable slots (via
 *     getStyles({ part: 'overlay' }) / getStyles({ part: 'close' })) rather
 *     than as separate consumer-facing parts.
 *   - header / footer: structural <div> wrappers, no Radix primitive backing.
 *   - title / description: wrap RadixDialog.Title / RadixDialog.Description.
 *   - close: consumer-facing RadixDialog.Close, distinct from the X button
 *     Content renders internally (e.g. for a <Dialog.Close asChild><Button/></Dialog.Close>
 *     footer action).
 *
 * `overlay` and `close` are keys in `classes` but not in `parts`: they are
 * style-addressable via getStyles({ part: 'overlay' | 'close' }) without
 * being separate compound parts (overlay has no consumer-facing wrapper;
 * `close` the classes key backs both the Content-internal X button and the
 * consumer-facing Dialog.Close part).
 */

const classes = {
  root: '',
  trigger: '',
  overlay: [
    'fixed inset-0 z-50 bg-black/80',
    'data-[state=open]:animate-in data-[state=open]:fade-in-0',
    'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
  ].join(' '),
  content: [
    'fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2',
    'gap-4 border border-(--border-default) p-6 shadow-lg duration-200',
    'bg-(--surface-raised) text-(--text-default) rounded-lg',
    'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
    'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
    'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
    'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
  ].join(' '),
  header: 'flex flex-col gap-y-1.5 text-center sm:text-left',
  footer: 'flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-x-2',
  title: 'text-lg font-semibold leading-none tracking-tight',
  description: 'text-sm text-(--text-muted)',
  close: [
    'absolute right-4 top-4 rounded-sm opacity-70 transition-opacity',
    'hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--border-focus)',
    'disabled:pointer-events-none',
  ].join(' '),
};

export interface DialogRootProps {
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface DialogTriggerProps {
  children?: ReactNode;
}

export interface DialogContentProps {
  children?: ReactNode;
}

export interface DialogHeaderProps {
  children?: ReactNode;
}

export interface DialogFooterProps {
  children?: ReactNode;
}

export interface DialogTitleProps {
  children?: ReactNode;
}

export interface DialogDescriptionProps {
  children?: ReactNode;
}

export interface DialogCloseProps {
  children?: ReactNode;
}

export const Dialog = defineCompound({
  name: 'Dialog',
  classes,
  context: () => ({}),
  parts: {
    // Root -- owns RadixDialog.Root; threads open/defaultOpen/onOpenChange
    // through to Radix's own open-state machine.
    root: {
      render: ({ props, children }: any) => {
        const {
          open,
          defaultOpen,
          onOpenChange,
          className,
          style,
          classNames,
          styles,
          unstyled,
          attributes,
          vars,
          ...rest
        } = props;
        return (
          <RadixDialog.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
            {children}
          </RadixDialog.Root>
        );
      },
    },
    // Trigger -- asChild wraps the consumer's child in a span so Radix's
    // click/open-state handlers attach to a node that also carries the
    // compound's own styles-API output (mirrors Tooltip.Trigger).
    trigger: {
      render: ({ props, getStyles, children, ref }: any) => {
        const { className, style, classNames, styles, unstyled, attributes, vars, ...rest } = props;
        return (
          <RadixDialog.Trigger asChild>
            <span ref={ref} {...rest} {...getStyles()}>
              {children}
            </span>
          </RadixDialog.Trigger>
        );
      },
    },
    // Content -- renders inside a Portal. Overlay and the built-in X close
    // button are style-addressable slots rendered here, not separate parts.
    content: {
      render: ({ props, getStyles, children, ref }: any) => {
        const { className, style, classNames, styles, unstyled, attributes, vars, ...rest } = props;
        return (
          <RadixDialog.Portal>
            <RadixDialog.Overlay {...getStyles({ part: 'overlay' })} />
            <RadixDialog.Content ref={ref} {...rest} {...getStyles()}>
              {children}
              <RadixDialog.Close {...getStyles({ part: 'close' })}>
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </RadixDialog.Close>
            </RadixDialog.Content>
          </RadixDialog.Portal>
        );
      },
    },
    // Header -- structural <div>, no Radix primitive backing.
    header: {
      render: ({ props, getStyles, children, ref }: any) => {
        const { className, style, classNames, styles, unstyled, attributes, vars, ...rest } = props;
        return (
          <div ref={ref} {...rest} {...getStyles()}>
            {children}
          </div>
        );
      },
    },
    // Footer -- structural <div>, no Radix primitive backing.
    footer: {
      render: ({ props, getStyles, children, ref }: any) => {
        const { className, style, classNames, styles, unstyled, attributes, vars, ...rest } = props;
        return (
          <div ref={ref} {...rest} {...getStyles()}>
            {children}
          </div>
        );
      },
    },
    title: {
      render: ({ props, getStyles, children, ref }: any) => {
        const { className, style, classNames, styles, unstyled, attributes, vars, ...rest } = props;
        return (
          <RadixDialog.Title ref={ref} {...rest} {...getStyles()}>
            {children}
          </RadixDialog.Title>
        );
      },
    },
    description: {
      render: ({ props, getStyles, children, ref }: any) => {
        const { className, style, classNames, styles, unstyled, attributes, vars, ...rest } = props;
        return (
          <RadixDialog.Description ref={ref} {...rest} {...getStyles()}>
            {children}
          </RadixDialog.Description>
        );
      },
    },
    // Close -- consumer-facing close trigger (e.g. a footer "Cancel" button),
    // distinct from the built-in X button Content renders internally.
    close: {
      render: ({ props, getStyles, children, ref }: any) => {
        const { className, style, classNames, styles, unstyled, attributes, vars, ...rest } = props;
        return (
          <RadixDialog.Close ref={ref} {...rest} {...getStyles()}>
            {children}
          </RadixDialog.Close>
        );
      },
    },
  },
});

export const dialogTheme = Dialog.extend({});
