import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { defineComponent } from '../../builders.ts';

// Field is a part-family namespace (same shape as Card): ten independent
// defineComponent parts mirroring the donor's field.tsx exports. No shared
// state and no compound machinery; the parts coordinate purely through
// data-slot attributes and Tailwind's group/has selectors, exactly as upstream
// does.
//
// TODO(phase-2): FieldLabel and FieldSeparator inline the donor's Label and
// Separator class strings below, because neither recipe exists yet (both are
// Phase 2 Category 1 conversions). When they land, these two parts should
// delegate to them instead of duplicating the strings.
const LABEL_CLASSES =
  'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50';
const SEPARATOR_CLASSES =
  'shrink-0 bg-(--border-default) data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full';

// --- FieldSet ---

export const FieldSet = defineComponent<{ children?: ReactNode }>({
  name: 'FieldSet',
  selectors: ['root'] as const,
  classes: {
    root: 'flex flex-col gap-6 has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3',
  },
  render: ({ props, getStyles, ref }: any) => {
    const { children, className, style, classNames, styles, unstyled, attributes, vars, ...rest } =
      props;
    return (
      <fieldset ref={ref} data-slot="field-set" {...rest} {...getStyles('root')}>
        {children}
      </fieldset>
    );
  },
});

export const fieldSetTheme = FieldSet.extend({});

// --- FieldLegend ---

export const FieldLegend = defineComponent<{
  children?: ReactNode;
  variant?: 'legend' | 'label';
}>({
  name: 'FieldLegend',
  selectors: ['root'] as const,
  classes: {
    root: 'mb-3 font-medium data-[variant=legend]:text-base data-[variant=label]:text-sm',
  },
  render: ({ props, getStyles, ref }: any) => {
    const {
      children,
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
    return (
      <legend
        ref={ref}
        data-slot="field-legend"
        data-variant={variant ?? 'legend'}
        {...rest}
        {...getStyles('root')}
      >
        {children}
      </legend>
    );
  },
});

export const fieldLegendTheme = FieldLegend.extend({});

// --- FieldGroup ---

export const FieldGroup = defineComponent<{ children?: ReactNode }>({
  name: 'FieldGroup',
  selectors: ['root'] as const,
  classes: {
    root: 'group/field-group @container/field-group flex w-full flex-col gap-7 data-[slot=checkbox-group]:gap-3 [&>[data-slot=field-group]]:gap-4',
  },
  render: ({ props, getStyles, ref }: any) => {
    const { children, className, style, classNames, styles, unstyled, attributes, vars, ...rest } =
      props;
    return (
      <div ref={ref} data-slot="field-group" {...rest} {...getStyles('root')}>
        {children}
      </div>
    );
  },
});

export const fieldGroupTheme = FieldGroup.extend({});

// --- Field (row container) ---

// orientation is a plain prop routed to data-orientation rather than a
// vocabulary axis: size/intent/variant are theme-declared (CLAUDE.md invariant
// 2) and layout direction is not one of them. Same treatment as Tabs.
export const Field = defineComponent<{
  children?: ReactNode;
  orientation?: 'vertical' | 'horizontal' | 'responsive';
  invalid?: boolean;
}>({
  name: 'Field',
  selectors: ['root'] as const,
  classes: {
    root: [
      'group/field flex w-full gap-3 data-[invalid=true]:text-(--color-danger-500)',
      // vertical
      'data-[orientation=vertical]:flex-col data-[orientation=vertical]:[&>*]:w-full data-[orientation=vertical]:[&>.sr-only]:w-auto',
      // horizontal
      'data-[orientation=horizontal]:flex-row data-[orientation=horizontal]:items-center',
      'data-[orientation=horizontal]:[&>[data-slot=field-label]]:flex-auto',
      'data-[orientation=horizontal]:has-[>[data-slot=field-content]]:items-start',
      'data-[orientation=horizontal]:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px',
      // responsive: column until the field-group container is wide enough
      'data-[orientation=responsive]:flex-col data-[orientation=responsive]:[&>*]:w-full data-[orientation=responsive]:[&>.sr-only]:w-auto',
      'data-[orientation=responsive]:@md/field-group:flex-row data-[orientation=responsive]:@md/field-group:items-center',
      'data-[orientation=responsive]:@md/field-group:[&>*]:w-auto',
      'data-[orientation=responsive]:@md/field-group:[&>[data-slot=field-label]]:flex-auto',
      'data-[orientation=responsive]:@md/field-group:has-[>[data-slot=field-content]]:items-start',
      'data-[orientation=responsive]:@md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px',
    ].join(' '),
  },
  render: ({ props, getStyles, ref }: any) => {
    const {
      children,
      orientation,
      invalid,
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
      <div
        ref={ref}
        // biome-ignore lint/a11y/useSemanticElements: a Field is one row inside a FieldSet, which is already the <fieldset>; nesting a fieldset per row would misreport the group structure. Matches the donor.
        role="group"
        data-slot="field"
        data-orientation={orientation ?? 'vertical'}
        data-invalid={invalid || undefined}
        {...rest}
        {...getStyles('root')}
      >
        {children}
      </div>
    );
  },
});

export const fieldTheme = Field.extend({});

// --- FieldContent ---

export const FieldContent = defineComponent<{ children?: ReactNode }>({
  name: 'FieldContent',
  selectors: ['root'] as const,
  classes: {
    root: 'group/field-content flex flex-1 flex-col gap-1.5 leading-snug',
  },
  render: ({ props, getStyles, ref }: any) => {
    const { children, className, style, classNames, styles, unstyled, attributes, vars, ...rest } =
      props;
    return (
      <div ref={ref} data-slot="field-content" {...rest} {...getStyles('root')}>
        {children}
      </div>
    );
  },
});

export const fieldContentTheme = FieldContent.extend({});

// --- FieldLabel ---

export const FieldLabel = defineComponent<{ children?: ReactNode; htmlFor?: string }>({
  name: 'FieldLabel',
  selectors: ['root'] as const,
  classes: {
    root: [
      LABEL_CLASSES,
      'group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50',
      // a label wrapping a whole Field becomes a selectable card
      'has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-md has-[>[data-slot=field]]:border [&>*]:data-[slot=field]:p-4',
      'has-data-[state=checked]:border-(--color-primary-500) has-data-[state=checked]:bg-(--color-primary-500)/5 dark:has-data-[state=checked]:bg-(--color-primary-500)/10',
    ].join(' '),
  },
  render: ({ props, getStyles, ref }: any) => {
    const {
      children,
      htmlFor,
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
      <label ref={ref} data-slot="field-label" htmlFor={htmlFor} {...rest} {...getStyles('root')}>
        {children}
      </label>
    );
  },
});

export const fieldLabelTheme = FieldLabel.extend({});

// --- FieldTitle ---

export const FieldTitle = defineComponent<{ children?: ReactNode }>({
  name: 'FieldTitle',
  selectors: ['root'] as const,
  classes: {
    root: 'flex w-fit items-center gap-2 text-sm leading-snug font-medium group-data-[disabled=true]/field:opacity-50',
  },
  render: ({ props, getStyles, ref }: any) => {
    const { children, className, style, classNames, styles, unstyled, attributes, vars, ...rest } =
      props;
    return (
      <div ref={ref} data-slot="field-label" {...rest} {...getStyles('root')}>
        {children}
      </div>
    );
  },
});

export const fieldTitleTheme = FieldTitle.extend({});

// --- FieldDescription ---

export const FieldDescription = defineComponent<{ children?: ReactNode }>({
  name: 'FieldDescription',
  selectors: ['root'] as const,
  classes: {
    root: [
      'text-sm leading-normal font-normal text-(--text-muted) group-has-[[data-orientation=horizontal]]/field:text-balance',
      'last:mt-0 nth-last-2:-mt-1 [[data-variant=legend]+&]:-mt-1.5',
      '[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-(--color-primary-500)',
    ].join(' '),
  },
  render: ({ props, getStyles, ref }: any) => {
    const { children, className, style, classNames, styles, unstyled, attributes, vars, ...rest } =
      props;
    return (
      <p ref={ref} data-slot="field-description" {...rest} {...getStyles('root')}>
        {children}
      </p>
    );
  },
});

export const fieldDescriptionTheme = FieldDescription.extend({});

// --- FieldSeparator ---

export const FieldSeparator = defineComponent<{ children?: ReactNode }>({
  name: 'FieldSeparator',
  selectors: ['root', 'separator', 'content'] as const,
  classes: {
    root: 'relative -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2',
    separator: `${SEPARATOR_CLASSES} absolute inset-0 top-1/2`,
    content: 'relative mx-auto block w-fit bg-(--surface-canvas) px-2 text-(--text-muted)',
  },
  render: ({ props, getStyles, ref }: any) => {
    const { children, className, style, classNames, styles, unstyled, attributes, vars, ...rest } =
      props;
    return (
      <div
        ref={ref}
        data-slot="field-separator"
        data-content={!!children}
        {...rest}
        {...getStyles('root')}
      >
        <div data-orientation="horizontal" {...getStyles('separator')} />
        {children ? (
          <span data-slot="field-separator-content" {...getStyles('content')}>
            {children}
          </span>
        ) : null}
      </div>
    );
  },
});

export const fieldSeparatorTheme = FieldSeparator.extend({});

// --- FieldError ---

export interface FieldErrorProps {
  children?: ReactNode;
  /** Rendered as a bullet list when more than one distinct message survives dedupe. */
  errors?: Array<{ message?: string } | undefined>;
}

export const FieldError = defineComponent<FieldErrorProps>({
  name: 'FieldError',
  selectors: ['root', 'list'] as const,
  classes: {
    root: 'text-sm font-normal text-(--color-danger-500)',
    list: 'ml-4 flex list-disc flex-col gap-1',
  },
  render: ({ props, getStyles, ref }: any) => {
    const {
      children,
      errors,
      className,
      style,
      classNames,
      styles,
      unstyled,
      attributes,
      vars,
      ...rest
    } = props;

    const content = useMemo(() => {
      if (children) return children;
      if (!errors?.length) return null;
      // dedupe on message so a field failing the same rule twice reads once
      const unique = [
        ...new Map(
          (errors as Array<{ message?: string } | undefined>).map((e) => [e?.message, e]),
        ).values(),
      ];
      if (unique.length === 1) return unique[0]?.message;
      return (
        <ul {...getStyles('list')}>
          {unique.map((e) => (e?.message ? <li key={e.message}>{e.message}</li> : null))}
        </ul>
      );
    }, [children, errors, getStyles]);

    if (!content) return null;

    return (
      <div ref={ref} role="alert" data-slot="field-error" {...rest} {...getStyles('root')}>
        {content}
      </div>
    );
  },
});

export const fieldErrorTheme = FieldError.extend({});
