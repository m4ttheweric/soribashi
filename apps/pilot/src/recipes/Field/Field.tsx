/**
 * Field: reusable form-control wrapper (label, description, error, required).
 * Mirrors Mantine's shared Input.Wrapper so multiple form controls reuse it.
 */
import type { ReactNode } from 'react';
import { defineComponent } from '../../builders.ts';
import classes from './Field.module.css';

export interface FieldProps {
  id?: string;
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children?: ReactNode;
}

export const Field = defineComponent<
  FieldProps,
  readonly ['root', 'label', 'required', 'description', 'error'],
  readonly []
>({
  name: 'Field',
  element: 'div',
  selectors: ['root', 'label', 'required', 'description', 'error'] as const,
  classes,
  render: ({ props, getStyles, ref }: any) => {
    const { id, label, description, error, required, children } = props;
    return (
      <div ref={ref} {...getStyles('root')} data-part="root">
        {label && (
          <label {...getStyles('label')} htmlFor={id} data-part="label">
            {label}
            {required && (
              <span {...getStyles('required')} aria-hidden data-part="required">
                *
              </span>
            )}
          </label>
        )}
        {description && (
          <div
            {...getStyles('description')}
            id={id ? `${id}-description` : undefined}
            data-part="description"
          >
            {description}
          </div>
        )}
        {children}
        {error && (
          <div
            {...getStyles('error')}
            id={id ? `${id}-error` : undefined}
            role="alert"
            data-part="error"
          >
            {error}
          </div>
        )}
      </div>
    );
  },
});
