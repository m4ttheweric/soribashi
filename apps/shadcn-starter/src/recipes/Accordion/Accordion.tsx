import * as RadixAccordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { defineCompound } from '../../builders.ts';

/**
 * Accordion recipe -- Category 3 persistent-compound template, following
 * Tabs' pattern (apps/shadcn-starter/src/recipes/Tabs/Tabs.tsx): renders
 * entirely inline, no Portal, since the content is persistent disclosure UI
 * rather than a transient overlay. Unlike Tabs, Accordion carries no
 * per-recipe variant vocabulary -- no `variants`/`vocabularyAxes` here.
 *
 * Parts:
 *   - root: wraps RadixAccordion.Root. Threads Radix's `type`
 *     ('single' | 'multiple') and `collapsible` through from root props,
 *     defaulting to type="single" collapsible={true} for the walking
 *     skeleton (per the task brief).
 *   - item: wraps RadixAccordion.Item; needs a `value` prop.
 *   - trigger: wraps RadixAccordion.Header > RadixAccordion.Trigger,
 *     appending a ChevronDown icon as the last child. The icon rotates via
 *     the `trigger` class's `[&[data-state=open]>svg]:rotate-180` selector
 *     plus its own `transition-transform duration-200`.
 *   - content: wraps RadixAccordion.Content, which owns the animated
 *     height (animate-accordion-up/down from tw-animate-css). Renders an
 *     inner <div> (getStyles({ part: 'contentInner' })) for the actual
 *     content padding, since padding on the animated element itself would
 *     fight the height animation.
 *
 * `contentInner` is a key in `classes` but not in `parts`: it is
 * style-addressable via getStyles({ part: 'contentInner' }) without being a
 * separate consumer-facing compound part (same pattern as Dialog's
 * `overlay`/`close` slots -- see Dialog.tsx).
 */

const classes = {
  root: 'w-full',
  item: 'border-b border-(--border-default)',
  trigger: [
    'flex w-full flex-1 items-center justify-between py-4 text-sm font-medium transition-all',
    'hover:underline',
    '[&[data-state=open]>svg]:rotate-180',
  ].join(' '),
  content: [
    'overflow-hidden text-sm',
    'data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
  ].join(' '),
  contentInner: 'pb-4 pt-0',
};

export interface AccordionRootProps {
  children?: ReactNode;
  type?: 'single' | 'multiple';
  collapsible?: boolean;
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
}

export interface AccordionItemProps {
  value: string;
  disabled?: boolean;
  children?: ReactNode;
}

export interface AccordionTriggerProps {
  children?: ReactNode;
}

export interface AccordionContentProps {
  children?: ReactNode;
}

export const Accordion = defineCompound({
  name: 'Accordion',
  classes,
  context: () => ({}),
  parts: {
    root: {
      render: ({ props, getStyles, children, ref }: any) => {
        const {
          type = 'single',
          collapsible = true,
          value,
          defaultValue,
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
        void className;
        void style;
        void classNames;
        void styles;
        void unstyled;
        void attributes;
        void vars;
        // `collapsible` only exists on Radix's single-mode Root; passing it
        // through for type="multiple" leaks an unrecognized DOM attribute
        // (and a React warning), so it's only threaded for type="single".
        return (
          <RadixAccordion.Root
            ref={ref}
            type={type}
            collapsible={type === 'single' ? collapsible : undefined}
            value={value}
            defaultValue={defaultValue}
            onValueChange={onValueChange}
            {...rest}
            {...getStyles()}
          >
            {children}
          </RadixAccordion.Root>
        );
      },
    },
    item: {
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
          <RadixAccordion.Item ref={ref} value={value} {...rest} {...getStyles()}>
            {children}
          </RadixAccordion.Item>
        );
      },
    },
    trigger: {
      render: ({ props, getStyles, children, ref }: any) => {
        const { className, style, classNames, styles, unstyled, attributes, vars, ...rest } = props;
        void className;
        void style;
        void classNames;
        void styles;
        void unstyled;
        void attributes;
        void vars;
        return (
          <RadixAccordion.Header className="flex">
            <RadixAccordion.Trigger ref={ref} {...rest} {...getStyles()}>
              {children}
              <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
            </RadixAccordion.Trigger>
          </RadixAccordion.Header>
        );
      },
    },
    content: {
      render: ({ props, getStyles, children, ref }: any) => {
        const { className, style, classNames, styles, unstyled, attributes, vars, ...rest } = props;
        void className;
        void style;
        void classNames;
        void styles;
        void unstyled;
        void attributes;
        void vars;
        return (
          <RadixAccordion.Content ref={ref} {...rest} {...getStyles()}>
            <div {...getStyles({ part: 'contentInner' })}>{children}</div>
          </RadixAccordion.Content>
        );
      },
    },
  },
});

export const accordionTheme = Accordion.extend({});
