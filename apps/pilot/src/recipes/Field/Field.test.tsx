import { SoribashiProvider } from '@soribashi/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { theme } from '../../theme/index.ts';
import { Field } from './Field.tsx';

const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);

describe('Field', () => {
  it('renders label, description, error and the control', () => {
    wrap(
      <Field id="f1" label="Name" description="help" error="bad" required>
        <input id="f1" />
      </Field>,
    );
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('help')).toBeInTheDocument();
    expect(screen.getByText('bad')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('marks required with an asterisk', () => {
    wrap(
      <Field id="f2" label="Name" required>
        <input id="f2" />
      </Field>,
    );
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('wires description and error ids for aria-describedby', () => {
    wrap(
      <Field id="f3" label="L" description="d" error="e">
        <input id="f3" />
      </Field>,
    );
    expect(document.getElementById('f3-description')).not.toBeNull();
    expect(document.getElementById('f3-error')).not.toBeNull();
  });

  it('omits description/error nodes when not provided', () => {
    wrap(
      <Field id="f4" label="L">
        <input id="f4" />
      </Field>,
    );
    expect(document.getElementById('f4-description')).toBeNull();
    expect(document.getElementById('f4-error')).toBeNull();
  });
});
