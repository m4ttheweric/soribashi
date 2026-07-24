import type { ReactNode } from 'react';
import { defineComponent } from '../../builders.ts';

// Card is a part-family namespace (spec section 10): six independent
// defineComponent parts with no shared state and no compound machinery.
// Each part is a purely structural styled wrapper: no vocabulary axes, no
// variants, no vars resolver. They compose via normal React children.

// --- Card (root container) ---

export const Card = defineComponent<{ children?: ReactNode }>({
  name: 'Card',
  selectors: ['root'] as const,
  classes: {
    root: 'flex flex-col gap-6 rounded-xl border border-(--border-default) bg-(--surface-raised) py-6 text-(--text-default) shadow-sm',
  },
  render: ({ props, getStyles, ref }: any) => {
    const { children, className, style, classNames, styles, unstyled, attributes, vars, ...rest } =
      props;
    return (
      <div ref={ref} {...rest} {...getStyles('root')}>
        {children}
      </div>
    );
  },
});

export const cardTheme = Card.extend({});

// --- CardHeader ---

// Grid rather than flex-col so a CardAction sibling can occupy a second
// column: the has-data-[slot=card-action] selector only promotes the header to
// two columns when such a child is actually present.
export const CardHeader = defineComponent<{ children?: ReactNode }>({
  name: 'CardHeader',
  selectors: ['root'] as const,
  classes: {
    root: '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
  },
  render: ({ props, getStyles, ref }: any) => {
    const { children, className, style, classNames, styles, unstyled, attributes, vars, ...rest } =
      props;
    return (
      <div ref={ref} {...rest} {...getStyles('root')}>
        {children}
      </div>
    );
  },
});

export const cardHeaderTheme = CardHeader.extend({});

// --- CardAction ---

// Emits data-slot="card-action" because CardHeader's grid-column promotion is
// keyed on that attribute being present in the DOM; it is not a general
// convention for this app's recipes.
export const CardAction = defineComponent<{ children?: ReactNode }>({
  name: 'CardAction',
  selectors: ['root'] as const,
  classes: {
    root: 'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
  },
  render: ({ props, getStyles, ref }: any) => {
    const { children, className, style, classNames, styles, unstyled, attributes, vars, ...rest } =
      props;
    return (
      <div ref={ref} data-slot="card-action" {...rest} {...getStyles('root')}>
        {children}
      </div>
    );
  },
});

export const cardActionTheme = CardAction.extend({});

// --- CardTitle ---

export const CardTitle = defineComponent<{ children?: ReactNode }>({
  name: 'CardTitle',
  selectors: ['root'] as const,
  classes: {
    root: 'leading-none font-semibold',
  },
  render: ({ props, getStyles, ref }: any) => {
    const { children, className, style, classNames, styles, unstyled, attributes, vars, ...rest } =
      props;
    return (
      <h3 ref={ref} {...rest} {...getStyles('root')}>
        {children}
      </h3>
    );
  },
});

export const cardTitleTheme = CardTitle.extend({});

// --- CardDescription ---

export const CardDescription = defineComponent<{ children?: ReactNode }>({
  name: 'CardDescription',
  selectors: ['root'] as const,
  classes: {
    root: 'text-sm text-(--text-muted)',
  },
  render: ({ props, getStyles, ref }: any) => {
    const { children, className, style, classNames, styles, unstyled, attributes, vars, ...rest } =
      props;
    return (
      <p ref={ref} {...rest} {...getStyles('root')}>
        {children}
      </p>
    );
  },
});

export const cardDescriptionTheme = CardDescription.extend({});

// --- CardContent ---

export const CardContent = defineComponent<{ children?: ReactNode }>({
  name: 'CardContent',
  selectors: ['root'] as const,
  classes: {
    root: 'px-6',
  },
  render: ({ props, getStyles, ref }: any) => {
    const { children, className, style, classNames, styles, unstyled, attributes, vars, ...rest } =
      props;
    return (
      <div ref={ref} {...rest} {...getStyles('root')}>
        {children}
      </div>
    );
  },
});

export const cardContentTheme = CardContent.extend({});

// --- CardFooter ---

export const CardFooter = defineComponent<{ children?: ReactNode }>({
  name: 'CardFooter',
  selectors: ['root'] as const,
  classes: {
    root: 'flex items-center px-6 [.border-t]:pt-6',
  },
  render: ({ props, getStyles, ref }: any) => {
    const { children, className, style, classNames, styles, unstyled, attributes, vars, ...rest } =
      props;
    return (
      <div ref={ref} {...rest} {...getStyles('root')}>
        {children}
      </div>
    );
  },
});

export const cardFooterTheme = CardFooter.extend({});
