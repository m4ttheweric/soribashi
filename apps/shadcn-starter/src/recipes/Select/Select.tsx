import * as RadixSelect from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { ReactNode } from 'react';
import { defineCompound } from '../../builders.ts';

/**
 * Select recipe -- Category 4 form-control template. Manifest-classified as
 * Category 4 (generic component), but wraps @radix-ui/react-select, which
 * owns its own open/value context (same shared-context need as the Category 2
 * overlay compounds). Phase 1 pragmatic call: build it as a defineCompound,
 * following DropdownMenu's template (apps/shadcn-starter/src/recipes/
 * DropdownMenu/DropdownMenu.tsx), rather than defineGenericComponent. The
 * generic call-site value typing that defineGenericComponent buys (see
 * apps/pilot/src/recipes/Select/Select.tsx for that pattern, built on
 * floating-ui rather than Radix) is a Phase 2+ upgrade; a plain
 * string-valued `value`/`onValueChange` is sufficient here.
 *
 * Parts:
 *   - root: wraps RadixSelect.Root (a plain FC; no DOM output, no ref),
 *     threads value/defaultValue/onValueChange/open/defaultOpen/onOpenChange/
 *     disabled/name/required/dir/autoComplete/form.
 *   - trigger: wraps RadixSelect.Trigger; appends a ChevronDown icon via
 *     RadixSelect.Icon (asChild, matching Checkbox's icon-swap pattern).
 *   - value: wraps RadixSelect.Value (placeholder prop).
 *   - content: renders inside RadixSelect.Portal > RadixSelect.Content, with
 *     ScrollUpButton/Viewport/ScrollDownButton wired internally (matches
 *     upstream shadcn's default Content behavior) so consumers get scroll
 *     affordances for free without composing them by hand.
 *   - group / label / item / separator: structural rows, mirroring
 *     DropdownMenu's label/item/separator parts.
 *   - scrollUpButton / scrollDownButton: also exposed as standalone
 *     namespaced parts (per the spec's produces list) for consumers who want
 *     a custom Content composition instead of the built-in one.
 *
 * `viewport` is a classes-only key (like DropdownMenu's `shortcut`): it has
 * no consumer-facing part, Content addresses it internally via
 * getStyles({ part: 'viewport' }).
 */

const classes = {
  root: '',
  trigger: [
    'flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-(--border-input)',
    'bg-(--surface-raised) px-3 py-2 text-sm shadow-xs focus:outline-none',
    'focus-visible:border-(--border-focus) focus-visible:ring-[3px] focus-visible:ring-(--border-focus)/50',
    'aria-invalid:border-(--color-danger-500) aria-invalid:ring-(--color-danger-500)/20 dark:aria-invalid:ring-(--color-danger-500)/40',
    'disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
    'data-[placeholder]:text-(--text-muted)',
  ].join(' '),
  value: '',
  content: [
    'relative z-50 max-h-96 min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border border-(--border-default)',
    'bg-(--surface-floating) text-(--text-default) shadow-md',
    'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
    'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
    'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
    'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
  ].join(' '),
  viewport: 'p-1',
  group: '',
  label: 'px-2 py-1.5 text-sm font-semibold',
  item: [
    'relative flex w-full cursor-default select-none items-center gap-2 rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none',
    'focus:bg-(--accent-default) focus:text-(--text-default)',
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(' '),
  separator: '-mx-1 my-1 h-px bg-(--border-default)',
  scrollUpButton: 'flex cursor-default items-center justify-center py-1',
  scrollDownButton: 'flex cursor-default items-center justify-center py-1',
};

export interface SelectRootProps {
  children?: ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  name?: string;
  required?: boolean;
  dir?: 'ltr' | 'rtl';
  autoComplete?: string;
  form?: string;
}

export interface SelectTriggerProps {
  children?: ReactNode;
  disabled?: boolean;
}

export interface SelectValueProps {
  placeholder?: ReactNode;
}

export interface SelectContentProps {
  children?: ReactNode;
  position?: 'item-aligned' | 'popper';
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  align?: 'start' | 'center' | 'end';
}

export interface SelectGroupProps {
  children?: ReactNode;
}

export interface SelectLabelProps {
  children?: ReactNode;
}

export interface SelectItemProps {
  children?: ReactNode;
  value: string;
  disabled?: boolean;
  textValue?: string;
}

export type SelectSeparatorProps = Record<string, never>;

export type SelectScrollUpButtonProps = Record<string, never>;

export type SelectScrollDownButtonProps = Record<string, never>;

export const Select = defineCompound({
  name: 'Select',
  classes,
  context: () => ({}),
  parts: {
    // Root -- owns RadixSelect.Root (Radix's own open/value state machine).
    // No ref: RadixSelect.Root is a plain FC, same as DropdownMenu.Root.
    root: {
      render: ({ props, children }: any) => {
        const {
          value,
          defaultValue,
          onValueChange,
          open,
          defaultOpen,
          onOpenChange,
          disabled,
          name,
          required,
          dir,
          autoComplete,
          form,
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
          <RadixSelect.Root
            value={value}
            defaultValue={defaultValue}
            onValueChange={onValueChange}
            open={open}
            defaultOpen={defaultOpen}
            onOpenChange={onOpenChange}
            disabled={disabled}
            name={name}
            required={required}
            dir={dir}
            autoComplete={autoComplete}
            form={form}
            {...rest}
          >
            {children}
          </RadixSelect.Root>
        );
      },
    },
    // Trigger -- appends a ChevronDown icon via RadixSelect.Icon (asChild).
    trigger: {
      render: ({ props, getStyles, children, ref }: any) => {
        const {
          disabled,
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
          <RadixSelect.Trigger ref={ref} disabled={disabled} {...rest} {...getStyles()}>
            {children}
            <RadixSelect.Icon asChild>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </RadixSelect.Icon>
          </RadixSelect.Trigger>
        );
      },
    },
    // Value -- wraps RadixSelect.Value; placeholder shows when unset.
    value: {
      render: ({ props, getStyles, ref }: any) => {
        const {
          placeholder,
          className,
          style,
          classNames,
          styles,
          unstyled,
          attributes,
          vars,
          ...rest
        } = props;
        return <RadixSelect.Value ref={ref} placeholder={placeholder} {...rest} {...getStyles()} />;
      },
    },
    // Content -- renders inside a Portal (same pattern as DropdownMenu.Content),
    // with ScrollUpButton/Viewport/ScrollDownButton wired internally to match
    // upstream shadcn's default composition.
    content: {
      render: ({ props, getStyles, children, ref }: any) => {
        const {
          position,
          side,
          sideOffset,
          align,
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
          <RadixSelect.Portal>
            <RadixSelect.Content
              ref={ref}
              position={position ?? 'popper'}
              side={side}
              sideOffset={sideOffset ?? 4}
              align={align}
              {...rest}
              {...getStyles()}
            >
              <RadixSelect.ScrollUpButton {...getStyles({ part: 'scrollUpButton' })}>
                <ChevronUp className="h-4 w-4" />
              </RadixSelect.ScrollUpButton>
              <RadixSelect.Viewport {...getStyles({ part: 'viewport' })}>
                {children}
              </RadixSelect.Viewport>
              <RadixSelect.ScrollDownButton {...getStyles({ part: 'scrollDownButton' })}>
                <ChevronDown className="h-4 w-4" />
              </RadixSelect.ScrollDownButton>
            </RadixSelect.Content>
          </RadixSelect.Portal>
        );
      },
    },
    // Group -- wraps RadixSelect.Group.
    group: {
      render: ({ props, getStyles, children, ref }: any) => {
        const { className, style, classNames, styles, unstyled, attributes, vars, ...rest } = props;
        return (
          <RadixSelect.Group ref={ref} {...rest} {...getStyles()}>
            {children}
          </RadixSelect.Group>
        );
      },
    },
    // Label -- structural, non-interactive row.
    label: {
      render: ({ props, getStyles, children, ref }: any) => {
        const { className, style, classNames, styles, unstyled, attributes, vars, ...rest } = props;
        return (
          <RadixSelect.Label ref={ref} {...rest} {...getStyles()}>
            {children}
          </RadixSelect.Label>
        );
      },
    },
    // Item -- selectable row; ItemIndicator (Check icon) sits in an
    // absolutely-positioned right slot (matches upstream shadcn's pl-2 pr-8
    // left-aligned-text-right-inset layout on the item class).
    item: {
      render: ({ props, getStyles, children, ref }: any) => {
        const {
          value,
          disabled,
          textValue,
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
          <RadixSelect.Item
            ref={ref}
            value={value}
            disabled={disabled}
            textValue={textValue}
            {...rest}
            {...getStyles()}
          >
            <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
              <RadixSelect.ItemIndicator>
                <Check className="h-4 w-4" />
              </RadixSelect.ItemIndicator>
            </span>
            <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
          </RadixSelect.Item>
        );
      },
    },
    // Separator -- structural, non-interactive divider.
    separator: {
      render: ({ props, getStyles, ref }: any) => {
        const { className, style, classNames, styles, unstyled, attributes, vars, ...rest } = props;
        return <RadixSelect.Separator ref={ref} {...rest} {...getStyles()} />;
      },
    },
    // ScrollUpButton / ScrollDownButton -- also exposed standalone (Content
    // wires its own copies internally; these are for custom compositions).
    scrollUpButton: {
      render: ({ props, getStyles, ref }: any) => {
        const { className, style, classNames, styles, unstyled, attributes, vars, ...rest } = props;
        return (
          <RadixSelect.ScrollUpButton ref={ref} {...rest} {...getStyles()}>
            <ChevronUp className="h-4 w-4" />
          </RadixSelect.ScrollUpButton>
        );
      },
    },
    scrollDownButton: {
      render: ({ props, getStyles, ref }: any) => {
        const { className, style, classNames, styles, unstyled, attributes, vars, ...rest } = props;
        return (
          <RadixSelect.ScrollDownButton ref={ref} {...rest} {...getStyles()}>
            <ChevronDown className="h-4 w-4" />
          </RadixSelect.ScrollDownButton>
        );
      },
    },
  },
});

export const selectTheme = Select.extend({});
