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

// `line` is the donor's own second variant; `outline` and `pills` are this
// theme's additions. Vocabulary is theme-declared (CLAUDE.md invariant 2), so
// adopting the donor's value is additive rather than a replacement.
export const variants = ['default', 'outline', 'pills', 'line'] as const;

const classes = {
  // group/tabs is what the orientation-scoped selectors on list and trigger
  // key off; Radix sets data-orientation on this element.
  root: 'group/tabs flex gap-2 data-[orientation=horizontal]:flex-col',
  list: [
    'group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px]',
    'bg-(--accent-muted) text-(--text-muted)',
    'group-data-[orientation=horizontal]/tabs:h-9',
    'group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col',
    'data-[variant=outline]:border data-[variant=outline]:border-(--border-default) data-[variant=outline]:bg-transparent',
    'data-[variant=pills]:bg-transparent',
    'data-[variant=line]:gap-1 data-[variant=line]:rounded-none data-[variant=line]:bg-transparent',
  ].join(' '),
  trigger: [
    'relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent px-2 py-1',
    'text-sm font-medium transition-all',
    'group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start',
    'focus-visible:border-(--border-focus) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--border-focus)',
    'disabled:pointer-events-none disabled:opacity-50',
    'data-[state=active]:bg-(--surface-raised) data-[state=active]:text-(--text-default) data-[state=active]:shadow',
    'data-[variant=outline]:data-[state=active]:border-b-2 data-[variant=outline]:data-[state=active]:border-(--border-focus) data-[variant=outline]:data-[state=active]:shadow-none',
    'data-[variant=pills]:rounded-full',
    // the line variant swaps the raised pill for an underline drawn as ::after
    'data-[variant=line]:bg-transparent data-[variant=line]:data-[state=active]:bg-transparent data-[variant=line]:data-[state=active]:shadow-none',
    'after:absolute after:bg-(--text-default) after:opacity-0 after:transition-opacity',
    'group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:bottom-[-5px] group-data-[orientation=horizontal]/tabs:after:h-0.5',
    'group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:-right-1 group-data-[orientation=vertical]/tabs:after:w-0.5',
    'data-[variant=line]:data-[state=active]:after:opacity-100',
  ].join(' '),
  content: 'flex-1 outline-none',
};

export interface TabsRootProps {
  children?: ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Drives the orientation-scoped layout on list and trigger. */
  orientation?: 'horizontal' | 'vertical';
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
          orientation,
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
            orientation={orientation ?? 'horizontal'}
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
