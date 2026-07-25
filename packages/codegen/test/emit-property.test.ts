import { createTheme } from '@soribashi/theme';
import { describe, expect, it } from 'vitest';
import { emitPropertyRegistrations } from '../src/emit-property.ts';

const theme = createTheme({
  tokens: {
    colors: { primary: { '500': 'oklch(0.62 0.19 259)' } },
    radius: { md: '0.5rem' },
    spacing: { cozy: '0.75rem' },
    fontSize: {},
  },
});

describe('emitPropertyRegistrations', () => {
  it('registers length tokens with a length syntax', () => {
    const out = emitPropertyRegistrations(theme).join('\n');
    expect(out).toContain('@property --radius-md {');
    expect(out).toContain('syntax: "<length>";');
    expect(out).toContain('initial-value: 0.5rem;');
  });

  it('NEVER registers colour tokens', () => {
    const out = emitPropertyRegistrations(theme).join('\n');
    // Registration makes a property computed at its declaration site, which
    // freezes light-dark() to :root's color-scheme and breaks scoped dark mode.
    expect(out).not.toContain('--color-primary-500');
  });

  it('marks registrations as inheriting, so a scoped override on a tenant wrapper reaches descendants', () => {
    // Regression: inherits: false was the brief's original value, and it is
    // wrong. Registered custom properties do NOT inherit by default the way
    // unregistered ones do, so inherits: false makes a descendant that
    // doesn't redeclare the property fall back to initial-value instead of
    // picking up an ancestor's override. That silently breaks
    // CssVariablesAddition.scopes (types.ts) — a tenant wrapper sets e.g.
    // --radius-md, and consuming components (Paper, Flex, ...) are
    // descendants of that wrapper, never the wrapper itself. Confirmed live
    // in Chromium: with inherits:false a child reads the registered
    // initial-value; with inherits:true it correctly reads the wrapper's
    // override.
    const out = emitPropertyRegistrations(theme).join('\n');
    expect(out).toContain('inherits: true;');
    expect(out).not.toContain('inherits: false;');
  });
});
