import { SoribashiProvider, configureClassNameMerge } from '@soribashi/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { twMerge } from 'tailwind-merge';
import { describe, expect, it } from 'vitest';
import { theme } from '../../theme/index.ts';
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from '../Field/Field.tsx';
import { Checkbox } from './Checkbox.tsx';

configureClassNameMerge(twMerge);

function wrap(ui: React.ReactElement) {
  return render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);
}

describe('Checkbox', () => {
  it('renders unchecked by default', () => {
    wrap(<Checkbox />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.getAttribute('data-state')).toBe('unchecked');
    expect(checkbox.getAttribute('aria-checked')).toBe('false');
  });

  it('toggles to checked on click, showing the check icon', async () => {
    const user = userEvent.setup();
    wrap(<Checkbox />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.querySelector('svg')).toBeNull();

    await user.click(checkbox);

    expect(checkbox.getAttribute('data-state')).toBe('checked');
    expect(checkbox.getAttribute('aria-checked')).toBe('true');
    expect(checkbox.querySelector('svg')).not.toBeNull();
  });

  it('toggles back to unchecked on a second click', async () => {
    const user = userEvent.setup();
    wrap(<Checkbox />);

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    await user.click(checkbox);

    expect(checkbox.getAttribute('data-state')).toBe('unchecked');
    expect(checkbox.querySelector('svg')).toBeNull();
  });

  it('applies disabled styling and blocks interaction when disabled', async () => {
    const user = userEvent.setup();
    wrap(<Checkbox disabled />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.className).toContain('disabled:opacity-50');
    expect(checkbox).toBeDisabled();

    await user.click(checkbox);
    expect(checkbox.getAttribute('data-state')).toBe('unchecked');
  });

  it('calls onCheckedChange with the new state', async () => {
    const user = userEvent.setup();
    let lastChecked: boolean | 'indeterminate' | undefined;
    wrap(
      <Checkbox
        onCheckedChange={(c) => {
          lastChecked = c;
        }}
      />,
    );

    await user.click(screen.getByRole('checkbox'));

    expect(lastChecked).toBe(true);
  });

  it('composes with Field: label, description, and error render around the control', () => {
    wrap(
      <Field orientation="horizontal" invalid>
        <Checkbox id="terms" />
        <FieldContent>
          <FieldLabel htmlFor="terms">Accept terms</FieldLabel>
          <FieldDescription>Read them first</FieldDescription>
          <FieldError errors={[{ message: 'You must accept' }]} />
        </FieldContent>
      </Field>,
    );

    expect(screen.getByText('Accept terms')).toBeInTheDocument();
    expect(screen.getByText('Read them first')).toBeInTheDocument();
    expect(screen.getByText('You must accept')).toBeInTheDocument();
    expect(screen.getByRole('checkbox').id).toBe('terms');
  });
});
