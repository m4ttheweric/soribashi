import * as RadixDropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, ChevronRight, Circle } from 'lucide-react';
import type { ReactNode } from 'react';
import { defineCompound } from '../../builders.ts';

/**
 * DropdownMenu recipe -- Category 2 overlay compound, following Dialog's
 * template (apps/shadcn-starter/src/recipes/Dialog/Dialog.tsx): no vocabulary
 * axes, no variants, pure structural compound built with defineCompound.
 * This is the most complex compound in Phase 1 (12 consumer-facing parts).
 *
 * Parts:
 *   - root: wraps RadixDropdownMenu.Root, threads open/defaultOpen/onOpenChange/modal.
 *   - trigger: asChild-wraps the consumer's child in a span (same pattern as
 *     Dialog.Trigger / Tooltip.Trigger).
 *   - content: renders inside RadixDropdownMenu.Portal.
 *   - item: a selectable row; optionally renders a trailing shortcut slot.
 *   - checkboxItem / radioItem: render their own RadixDropdownMenu.ItemIndicator
 *     with a Check / Circle icon in an absolutely-positioned left slot.
 *   - radioGroup: wraps RadixDropdownMenu.RadioGroup.
 *   - label / separator: structural, non-interactive rows.
 *   - sub / subTrigger / subContent: nested submenu, mirrors root/trigger/content
 *     but using Radix's Sub primitives; subTrigger appends a ChevronRight icon.
 *
 * `shortcut` is a key in `classes` but not in `parts`: it has no consumer-facing
 * wrapper. Instead `item` and `subTrigger` accept an optional `shortcut` prop
 * and render it internally as a style-addressable slot via
 * getStyles({ part: 'shortcut' }), mirroring how Dialog's Content renders its
 * `overlay` slot internally rather than exposing it as a separate part.
 */

const classes = {
  root: '',
  trigger: '',
  content: [
    'z-50 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md p-1 shadow-md',
    'bg-(--surface-floating) text-(--text-default) border border-(--border-default)',
    'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
    'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
    'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
    'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
  ].join(' '),
  item: [
    'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none',
    'transition-colors focus:bg-(--accent-default) focus:text-(--text-default)',
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    "[&_svg:not([class*='text-'])]:text-(--text-muted)",
  ].join(' '),
  checkboxItem: [
    'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
    'transition-colors focus:bg-(--accent-default) focus:text-(--text-default)',
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  ].join(' '),
  radioItem: [
    'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
    'transition-colors focus:bg-(--accent-default) focus:text-(--text-default)',
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  ].join(' '),
  radioGroup: '',
  label: 'px-2 py-1.5 text-sm font-medium data-[inset]:pl-8',
  separator: '-mx-1 my-1 h-px bg-(--border-default)',
  sub: '',
  subTrigger: [
    'flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none',
    'focus:bg-(--accent-default) data-[state=open]:bg-(--accent-default) data-[inset]:pl-8',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(' '),
  subContent: [
    'z-50 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-md p-1 shadow-lg',
    'bg-(--surface-floating) text-(--text-default) border border-(--border-default)',
    'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
    'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
    'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
    'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
  ].join(' '),
  shortcut: 'ml-auto text-xs tracking-widest opacity-60',
};

export interface DropdownMenuRootProps {
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
}

export interface DropdownMenuTriggerProps {
  children?: ReactNode;
}

export interface DropdownMenuContentProps {
  children?: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  align?: 'start' | 'center' | 'end';
}

export interface DropdownMenuItemProps {
  children?: ReactNode;
  disabled?: boolean;
  shortcut?: ReactNode;
  /** Indents the row to align with sibling rows that carry a leading indicator. */
  inset?: boolean;
  onSelect?: (event: Event) => void;
}

export interface DropdownMenuCheckboxItemProps {
  children?: ReactNode;
  checked?: boolean | 'indeterminate';
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}

export interface DropdownMenuRadioItemProps {
  children?: ReactNode;
  value: string;
  disabled?: boolean;
}

export interface DropdownMenuRadioGroupProps {
  children?: ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}

export interface DropdownMenuLabelProps {
  children?: ReactNode;
  /** Indents the row to align with sibling rows that carry a leading indicator. */
  inset?: boolean;
}

export type DropdownMenuSeparatorProps = Record<string, never>;

export interface DropdownMenuSubProps {
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface DropdownMenuSubTriggerProps {
  children?: ReactNode;
  disabled?: boolean;
  shortcut?: ReactNode;
  /** Indents the row to align with sibling rows that carry a leading indicator. */
  inset?: boolean;
}

export interface DropdownMenuSubContentProps {
  children?: ReactNode;
}

export const DropdownMenu = defineCompound({
  name: 'DropdownMenu',
  classes,
  context: () => ({}),
  parts: {
    // Root -- owns RadixDropdownMenu.Root; threads open/defaultOpen/onOpenChange/modal
    // through to Radix's own open-state machine. No ref: RadixDropdownMenu.Root
    // is a plain FC (no DOM output of its own).
    root: {
      render: ({ props, children }: any) => {
        const {
          open,
          defaultOpen,
          onOpenChange,
          modal,
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
          <RadixDropdownMenu.Root
            open={open}
            defaultOpen={defaultOpen}
            onOpenChange={onOpenChange}
            modal={modal}
          >
            {children}
          </RadixDropdownMenu.Root>
        );
      },
    },
    // Trigger -- asChild wraps the consumer's child in a span so Radix's
    // click/open-state handlers attach to a node that also carries the
    // compound's own styles-API output (mirrors Dialog.Trigger).
    trigger: {
      render: ({ props, getStyles, children, ref }: any) => {
        const { className, style, classNames, styles, unstyled, attributes, vars, ...rest } = props;
        return (
          <RadixDropdownMenu.Trigger asChild>
            <span ref={ref} {...rest} {...getStyles()}>
              {children}
            </span>
          </RadixDropdownMenu.Trigger>
        );
      },
    },
    // Content -- renders inside a Portal (same pattern as Dialog.Content).
    // sideOffset defaults to 4 (matches upstream shadcn) when the consumer
    // doesn't specify one; defaulted inline rather than via part `defaults`
    // to avoid TS inferring TProps from the defaults object instead of from
    // `render` (render's ctx is intentionally `any`-typed; see Task 4/5 notes).
    content: {
      render: ({ props, getStyles, children, ref }: any) => {
        const {
          sideOffset,
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
          <RadixDropdownMenu.Portal>
            <RadixDropdownMenu.Content
              ref={ref}
              sideOffset={sideOffset ?? 4}
              {...rest}
              {...getStyles()}
            >
              {children}
            </RadixDropdownMenu.Content>
          </RadixDropdownMenu.Portal>
        );
      },
    },
    // Item -- selectable row. `shortcut` is not a separate part (it's a
    // classes-only key); Item renders it internally as a style-addressable
    // slot when the consumer passes one.
    item: {
      render: ({ props, getStyles, children, ref }: any) => {
        const {
          shortcut,
          inset,
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
          <RadixDropdownMenu.Item
            ref={ref}
            data-inset={inset || undefined}
            {...rest}
            {...getStyles()}
          >
            {children}
            {shortcut !== undefined ? (
              <span {...getStyles({ part: 'shortcut' })}>{shortcut}</span>
            ) : null}
          </RadixDropdownMenu.Item>
        );
      },
    },
    // CheckboxItem -- renders RadixDropdownMenu.ItemIndicator with a Check
    // icon in an absolutely-positioned left slot (matches upstream shadcn's
    // pl-8 left-inset layout on the checkboxItem class).
    checkboxItem: {
      render: ({ props, getStyles, children, ref }: any) => {
        const {
          checked,
          onCheckedChange,
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
          <RadixDropdownMenu.CheckboxItem
            ref={ref}
            checked={checked}
            onCheckedChange={onCheckedChange}
            {...rest}
            {...getStyles()}
          >
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
              <RadixDropdownMenu.ItemIndicator>
                <Check className="h-4 w-4" />
              </RadixDropdownMenu.ItemIndicator>
            </span>
            {children}
          </RadixDropdownMenu.CheckboxItem>
        );
      },
    },
    // RadioItem -- same left-inset indicator layout as CheckboxItem, but with
    // a filled Circle icon (single-select look).
    radioItem: {
      render: ({ props, getStyles, children, ref }: any) => {
        const { value, className, style, classNames, styles, unstyled, attributes, vars, ...rest } =
          props;
        return (
          <RadixDropdownMenu.RadioItem ref={ref} value={value} {...rest} {...getStyles()}>
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
              <RadixDropdownMenu.ItemIndicator>
                <Circle className="h-2 w-2 fill-current" />
              </RadixDropdownMenu.ItemIndicator>
            </span>
            {children}
          </RadixDropdownMenu.RadioItem>
        );
      },
    },
    // RadioGroup -- wraps RadixDropdownMenu.RadioGroup, threads value/onValueChange.
    radioGroup: {
      render: ({ props, getStyles, children, ref }: any) => {
        const {
          value,
          onValueChange,
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
          <RadixDropdownMenu.RadioGroup
            ref={ref}
            value={value}
            onValueChange={onValueChange}
            {...rest}
            {...getStyles()}
          >
            {children}
          </RadixDropdownMenu.RadioGroup>
        );
      },
    },
    // Label -- structural, non-interactive row.
    label: {
      render: ({ props, getStyles, children, ref }: any) => {
        const { inset, className, style, classNames, styles, unstyled, attributes, vars, ...rest } =
          props;
        return (
          <RadixDropdownMenu.Label
            ref={ref}
            data-inset={inset || undefined}
            {...rest}
            {...getStyles()}
          >
            {children}
          </RadixDropdownMenu.Label>
        );
      },
    },
    // Separator -- structural, non-interactive divider.
    separator: {
      render: ({ props, getStyles, ref }: any) => {
        const { className, style, classNames, styles, unstyled, attributes, vars, ...rest } = props;
        return <RadixDropdownMenu.Separator ref={ref} {...rest} {...getStyles()} />;
      },
    },
    // Sub -- owns RadixDropdownMenu.Sub (submenu open-state machine). No ref:
    // RadixDropdownMenu.Sub is a plain FC, same as Root.
    sub: {
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
          <RadixDropdownMenu.Sub open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
            {children}
          </RadixDropdownMenu.Sub>
        );
      },
    },
    // SubTrigger -- appends a ChevronRight icon; shares the `shortcut` slot
    // pattern with Item.
    subTrigger: {
      render: ({ props, getStyles, children, ref }: any) => {
        const {
          shortcut,
          inset,
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
          <RadixDropdownMenu.SubTrigger
            ref={ref}
            data-inset={inset || undefined}
            {...rest}
            {...getStyles()}
          >
            {children}
            {shortcut !== undefined ? (
              <span {...getStyles({ part: 'shortcut' })}>{shortcut}</span>
            ) : null}
            <ChevronRight className="ml-auto h-4 w-4" />
          </RadixDropdownMenu.SubTrigger>
        );
      },
    },
    // SubContent -- renders inside a Portal, same pattern as Content.
    subContent: {
      render: ({ props, getStyles, children, ref }: any) => {
        const { className, style, classNames, styles, unstyled, attributes, vars, ...rest } = props;
        return (
          <RadixDropdownMenu.Portal>
            <RadixDropdownMenu.SubContent ref={ref} {...rest} {...getStyles()}>
              {children}
            </RadixDropdownMenu.SubContent>
          </RadixDropdownMenu.Portal>
        );
      },
    },
  },
});

export const dropdownMenuTheme = DropdownMenu.extend({});
