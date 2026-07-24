import { SoribashiProvider, configureClassNameMerge } from '@soribashi/core';
import { render, screen } from '@testing-library/react';
import { twMerge } from 'tailwind-merge';
import { describe, expect, it } from 'vitest';
import { theme } from '../../theme/index.ts';
import { Checkbox } from '../Checkbox/Checkbox.tsx';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from './Field.tsx';

configureClassNameMerge(twMerge);

function wrap(ui: React.ReactElement) {
  return render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);
}

describe('Field part-family', () => {
  it('Field is a role=group defaulting to vertical orientation', () => {
    wrap(
      <Field>
        <input />
      </Field>,
    );
    const el = screen.getByRole('group');
    expect(el).toHaveAttribute('data-slot', 'field');
    expect(el).toHaveAttribute('data-orientation', 'vertical');
    expect(el.className).toContain('group/field');
  });

  it('Field threads orientation and invalid onto data attributes', () => {
    wrap(
      <Field orientation="horizontal" invalid>
        <input />
      </Field>,
    );
    const el = screen.getByRole('group');
    expect(el).toHaveAttribute('data-orientation', 'horizontal');
    expect(el).toHaveAttribute('data-invalid', 'true');
  });

  it('Field omits data-invalid when not invalid, so the selector stays inert', () => {
    wrap(
      <Field>
        <input />
      </Field>,
    );
    expect(screen.getByRole('group')).not.toHaveAttribute('data-invalid');
  });

  it('FieldLabel renders a label linked via htmlFor', () => {
    wrap(<FieldLabel htmlFor="email-input">Email</FieldLabel>);
    const label = screen.getByText('Email');
    expect(label.tagName).toBe('LABEL');
    expect(label.getAttribute('for')).toBe('email-input');
    expect(label).toHaveAttribute('data-slot', 'field-label');
  });

  it('FieldLegend defaults to the legend variant and accepts label', () => {
    const { rerender } = wrap(<FieldLegend>Preferences</FieldLegend>);
    expect(screen.getByText('Preferences')).toHaveAttribute('data-variant', 'legend');

    rerender(
      <SoribashiProvider theme={theme}>
        <FieldLegend variant="label">Preferences</FieldLegend>
      </SoribashiProvider>,
    );
    expect(screen.getByText('Preferences')).toHaveAttribute('data-variant', 'label');
  });

  it('FieldError renders nothing when it has neither children nor errors', () => {
    const { container } = wrap(<FieldError />);
    expect(container.querySelector('[data-slot=field-error]')).toBeNull();
  });

  it('FieldError renders a bare message for a single error', () => {
    wrap(<FieldError errors={[{ message: 'Required' }]} />);
    const el = screen.getByRole('alert');
    expect(el).toHaveTextContent('Required');
    expect(el.querySelector('ul')).toBeNull();
  });

  it('FieldError dedupes repeated messages before deciding to render a list', () => {
    wrap(<FieldError errors={[{ message: 'Required' }, { message: 'Required' }]} />);
    expect(screen.getByRole('alert').querySelector('ul')).toBeNull();
  });

  it('FieldError lists distinct messages', () => {
    wrap(<FieldError errors={[{ message: 'Too short' }, { message: 'Must contain a digit' }]} />);
    const items = screen.getByRole('alert').querySelectorAll('li');
    expect(items).toHaveLength(2);
  });

  it('FieldError prefers children over errors', () => {
    wrap(<FieldError errors={[{ message: 'ignored' }]}>Explicit</FieldError>);
    expect(screen.getByRole('alert')).toHaveTextContent('Explicit');
  });

  it('FieldSeparator marks whether it carries content', () => {
    const { container, rerender } = wrap(<FieldSeparator />);
    expect(container.querySelector('[data-slot=field-separator]')).toHaveAttribute(
      'data-content',
      'false',
    );

    rerender(
      <SoribashiProvider theme={theme}>
        <FieldSeparator>or</FieldSeparator>
      </SoribashiProvider>,
    );
    expect(container.querySelector('[data-slot=field-separator]')).toHaveAttribute(
      'data-content',
      'true',
    );
    expect(screen.getByText('or')).toBeInTheDocument();
  });

  // Container queries do not resolve in jsdom, so this asserts the rule is
  // emitted, not that responsive orientation actually reflows. That belongs in
  // tests/browser-parity.
  it('FieldSet renders a fieldset and FieldGroup carries the container-query rule', () => {
    const { container } = wrap(
      <FieldSet>
        <FieldGroup>
          <Field>
            <input />
          </Field>
        </FieldGroup>
      </FieldSet>,
    );
    expect(container.querySelector('fieldset')).toBeTruthy();
    const group = container.querySelector('[data-slot=field-group]');
    expect(group?.className).toContain('@container/field-group');
  });

  it('composes the donor checkbox row: control, content, label, description', () => {
    wrap(
      <Field orientation="horizontal">
        <Checkbox id="terms" />
        <FieldContent>
          <FieldLabel htmlFor="terms">Accept terms</FieldLabel>
          <FieldDescription>I agree to the terms of service</FieldDescription>
        </FieldContent>
      </Field>,
    );

    expect(screen.getByText('Accept terms').getAttribute('for')).toBe('terms');
    expect(screen.getByRole('checkbox').id).toBe('terms');
    expect(screen.getByText('I agree to the terms of service').tagName).toBe('P');
  });

  it('FieldTitle is a div, not a label, so it does not steal the control association', () => {
    wrap(<FieldTitle>Section</FieldTitle>);
    expect(screen.getByText('Section').tagName).toBe('DIV');
  });

  it('forwards refs on the parts', () => {
    let rootEl: HTMLDivElement | null = null;
    wrap(
      <Field
        ref={(el: HTMLDivElement | null) => {
          rootEl = el;
        }}
      >
        <input />
      </Field>,
    );
    expect(rootEl).toBeInstanceOf(HTMLDivElement);
  });
});
