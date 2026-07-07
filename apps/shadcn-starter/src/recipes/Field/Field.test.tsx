import { SoribashiProvider, configureClassNameMerge } from '@soribashi/core';
import { render, screen } from '@testing-library/react';
import { twMerge } from 'tailwind-merge';
import { describe, expect, it } from 'vitest';
import { theme } from '../../theme/index.ts';
import { Checkbox } from '../Checkbox/Checkbox.tsx';
import { Field } from './Field.tsx';

configureClassNameMerge(twMerge);

function wrap(ui: React.ReactElement) {
  return render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);
}

describe('Field structural wrapper', () => {
  it('renders label, description, and error when provided', () => {
    wrap(
      <Field label="Email" description="We will never share it" error="Required">
        <input />
      </Field>,
    );

    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('We will never share it')).toBeInTheDocument();
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('links the label to the control via htmlFor', () => {
    wrap(
      <Field label="Email" htmlFor="email-input">
        <input id="email-input" />
      </Field>,
    );

    const label = screen.getByText('Email');
    expect(label.tagName).toBe('LABEL');
    expect(label.getAttribute('for')).toBe('email-input');
  });

  it('omits label, description, and error slots when their props are absent', () => {
    wrap(
      <Field>
        <input />
      </Field>,
    );

    expect(document.querySelector('label')).toBeNull();
    expect(document.querySelectorAll('p').length).toBe(0);
  });

  it('renders only the provided slots (e.g. label without description or error)', () => {
    wrap(
      <Field label="Name">
        <input />
      </Field>,
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(document.querySelectorAll('p').length).toBe(0);
  });

  it('applies the root spacing class and forwards a ref', () => {
    let rootEl: HTMLDivElement | null = null;
    wrap(
      <Field
        label="Name"
        ref={(el: HTMLDivElement | null) => {
          rootEl = el;
        }}
      >
        <input />
      </Field>,
    );

    expect(rootEl).toBeInstanceOf(HTMLDivElement);
    expect((rootEl as unknown as HTMLDivElement).className).toContain('space-y-2');
  });

  it('composes with a Checkbox child', () => {
    wrap(
      <Field label="Accept terms" htmlFor="terms">
        <Checkbox id="terms" />
      </Field>,
    );

    const label = screen.getByText('Accept terms');
    const checkbox = screen.getByRole('checkbox');
    expect(label.getAttribute('for')).toBe('terms');
    expect(checkbox.id).toBe('terms');
  });
});
