import type { ReactNode } from 'react';
import { defineComponent } from '../../builders.ts';

// Field is a structural wrapper (Category 4 form control template): a single
// defineComponent with multiple selectors (root, label, description, error).
// It is NOT a compound; it composes with any form control via normal React
// children (e.g. <Field label="..."><Checkbox /></Field>).

const selectors = ['root', 'label', 'description', 'error'] as const;

const classes = {
  root: 'space-y-2',
  label:
    'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  description: 'text-sm text-(--text-muted)',
  error: 'text-sm font-medium text-(--color-danger-500)',
};

interface FieldOwnProps {
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  htmlFor?: string;
  children?: ReactNode;
}

export const Field = defineComponent<FieldOwnProps>({
  name: 'Field',
  selectors,
  classes,
  render: ({ props, getStyles, ref }: any) => {
    const {
      label,
      description,
      error,
      htmlFor,
      children,
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
      <div ref={ref} {...rest} {...getStyles('root')}>
        {label && (
          <label htmlFor={htmlFor} {...getStyles('label')}>
            {label}
          </label>
        )}
        {children}
        {description && <p {...getStyles('description')}>{description}</p>}
        {error && <p {...getStyles('error')}>{error}</p>}
      </div>
    );
  },
});

export const fieldTheme = Field.extend({});
