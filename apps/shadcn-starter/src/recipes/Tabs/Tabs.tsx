import * as RadixTabs from '@radix-ui/react-tabs';
import { defineVocabulary } from '@soribashi/core';
import type { ReactNode } from 'react';
import { defineCompound } from '../../builders.ts';

/**
 * Tabs recipe -- Category 3 persistent-compound template (as opposed to
 * Category 2's transient overlays like Tooltip/Dialog/DropdownMenu).
 *
 * Adapts the proven Radix compound pattern from apps/pilot/src/recipes/Tabs
 * (CSS modules) to the three-band Tailwind v4 utility model. Unlike the
 * Category 2 compounds already in this app, Tabs:
 *   - carries a per-recipe variant vocabulary (default | outline | pills),
 *     making it more like Button/Badge than Tooltip/Dialog in that respect;
 *   - renders entirely inline -- no portal, since the content is persistent
 *     navigational UI, not a transient overlay.
 *
 * Parts:
 *   - root: wraps RadixTabs.Root, threads value/defaultValue/onValueChange.
 *   - list: wraps RadixTabs.List, the tab-strip container.
 *   - trigger: wraps RadixTabs.Trigger; needs a `value` prop identifying
 *     which panel it activates.
 *   - content: wraps RadixTabs.Content; needs a `value` prop identifying
 *     which panel it is.
 */

export const variants = ['default', 'outline', 'pills'] as const;

const classes = {
  root: '',
  list: [
    'inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]',
    'bg-(--accent-muted) text-(--text-muted)',
    'data-[variant=outline]:border data-[variant=outline]:border-(--border-default) data-[variant=outline]:bg-transparent',
    'data-[variant=pills]:bg-transparent',
  ].join(' '),
  trigger: [
    'relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent px-2 py-1',
    'text-sm font-medium transition-all',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--border-focus)',
    'disabled:pointer-events-none disabled:opacity-50',
    'data-[state=active]:bg-(--surface-raised) data-[state=active]:text-(--text-default) data-[state=active]:shadow',
    'data-[variant=outline]:data-[state=active]:border-b-2 data-[variant=outline]:data-[state=active]:border-(--border-focus) data-[variant=outline]:data-[state=active]:shadow-none',
    'data-[variant=pills]:rounded-full',
  ].join(' '),
  content: [
    'mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--border-focus)',
  ].join(' '),
};

export interface TabsRootProps {
  children?: ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

export interface TabsListProps {
  children?: ReactNode;
}

export interface TabsTriggerProps {
  value: string;
  disabled?: boolean;
  children?: ReactNode;
}

export interface TabsContentProps {
  value: string;
  children?: ReactNode;
}

export const Tabs = defineCompound({
  name: 'Tabs',
  classes,
  variants,
  vocabularyAxes: ['variant'] as const,
  defaults: { variant: 'default' } as Record<string, unknown>,
  context: () => ({}),
  parts: {
    root: {
      render: ({ props, getStyles, children, ref }: any) => {
        const {
          value,
          defaultValue,
          onValueChange,
          variant,
          className,
          style,
          classNames,
          styles,
          unstyled,
          attributes,
          vars,
          ...rest
        } = props;
        void variant;
        void className;
        void style;
        void classNames;
        void styles;
        void unstyled;
        void attributes;
        void vars;
        return (
          <RadixTabs.Root
            ref={ref}
            value={value}
            defaultValue={defaultValue}
            onValueChange={onValueChange}
            {...rest}
            {...getStyles()}
          >
            {children}
          </RadixTabs.Root>
        );
      },
    },
    list: {
      render: ({ props, getStyles, ctx, children, ref }: any) => {
        const { className, style, classNames, styles, unstyled, attributes, vars, ...rest } = props;
        void className;
        void style;
        void classNames;
        void styles;
        void unstyled;
        void attributes;
        void vars;
        return (
          <RadixTabs.List ref={ref} data-variant={ctx.variant} {...rest} {...getStyles()}>
            {children}
          </RadixTabs.List>
        );
      },
    },
    trigger: {
      render: ({ props, getStyles, ctx, children, ref }: any) => {
        const { value, className, style, classNames, styles, unstyled, attributes, vars, ...rest } =
          props;
        void className;
        void style;
        void classNames;
        void styles;
        void unstyled;
        void attributes;
        void vars;
        return (
          <RadixTabs.Trigger
            ref={ref}
            value={value}
            data-variant={ctx.variant}
            {...rest}
            {...getStyles()}
          >
            {children}
          </RadixTabs.Trigger>
        );
      },
    },
    content: {
      render: ({ props, getStyles, children, ref }: any) => {
        const { value, className, style, classNames, styles, unstyled, attributes, vars, ...rest } =
          props;
        void className;
        void style;
        void classNames;
        void styles;
        void unstyled;
        void attributes;
        void vars;
        return (
          <RadixTabs.Content ref={ref} value={value} {...rest} {...getStyles()}>
            {children}
          </RadixTabs.Content>
        );
      },
    },
  },
});

/**
 * Tabs' per-recipe variant vocabulary, composed into the theme's `components`
 * array (theme/index.ts). Derived from the same `variants` const that types
 * the recipe's `variant` prop -- one source of truth (invariant 2).
 */
export const tabsTheme = Tabs.extend({
  vocabulary: { variant: defineVocabulary(variants) },
});
