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

export const CardHeader = defineComponent<{ children?: ReactNode }>({
  name: 'CardHeader',
  selectors: ['root'] as const,
  classes: {
    root: 'flex flex-col gap-2 px-6',
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
    root: 'flex items-center px-6',
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
