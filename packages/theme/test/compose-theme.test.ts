import { describe, expect, it } from 'vitest';
import { createTheme } from '../src/create-theme.ts';
import { composeTheme } from '../src/compose-theme.ts';

describe('theme composition (extends)', () => {
  it('extending a theme inherits base tokens', () => {
    const base = createTheme({
      tokens: {
        colors: { primary: { '500': '#aaa' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
      name: 'base',
    });

    const child = createTheme({
      extends: base,
      tokens: {
        colors: { brand: { '500': '#fff' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
      name: 'child',
    });

    expect(child.tokens.colors.primary?.['500']).toBe('#aaa');
    expect(child.tokens.colors.brand?.['500']).toBe('#fff');
    expect(child.name).toBe('child');
  });

  it('child tokens override base tokens by key', () => {
    const base = createTheme({
      tokens: {
        colors: { primary: { '500': '#aaa' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    });

    const child = createTheme({
      extends: base,
      tokens: {
        colors: { primary: { '500': '#bbb' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });

    expect(child.tokens.colors.primary?.['500']).toBe('#bbb');
  });

  it('child semanticTokens overrides base semanticTokens per-key', () => {
    const base = createTheme({
      tokens: {
        colors: { primary: { '500': '#aaa' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
      semanticTokens: {
        text: { muted: 'colors.primary.500' },
      },
    });

    const child = createTheme({
      extends: base,
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
      },
      semanticTokens: {
        text: { default: 'colors.primary.500' },
      },
    });

    expect(child.semanticTokens.text.muted).toBe('colors.primary.500');
    expect(child.semanticTokens.text.default).toBe('colors.primary.500');
  });

  it('child scope and darkMode override base', () => {
    const base = createTheme({
      tokens: {
        colors: { primary: { '500': '#aaa' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
      scope: ':root',
      darkMode: { selector: '.dark' },
    });

    const child = createTheme({
      extends: base,
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
      },
      scope: '.tenant-foo',
      darkMode: { selector: '.dark .tenant-foo' },
    });

    expect(child.scope).toBe('.tenant-foo');
    expect(child.darkMode.selector).toBe('.dark .tenant-foo');
  });

  it('child component config replaces base component config', () => {
    const base = createTheme({
      tokens: {
        colors: { primary: { '500': '#aaa' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
      components: {
        Button: { defaultProps: { size: 'md' } },
      },
    });

    const child = createTheme({
      extends: base,
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
      },
      components: {
        Button: { defaultProps: { size: 'lg' } },
      },
    });

    expect(child.components.Button?.defaultProps).toEqual({ size: 'lg' });
  });

  // BUG fix tests — mergeTokens was missing fontWeight, lineHeight, heading
  // Classification: BUG — fields present in ThemeTokens interface were silently dropped
  // during composeTheme, causing base-theme values to be lost in extended themes.

  it('CT-BUG-1: child inherits base fontWeight tokens through composeTheme', () => {
    const base = createTheme({
      tokens: {
        colors: { primary: { '500': '#aaa' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
        fontWeight: { regular: '400', bold: '700' },
      },
    });

    const child = createTheme({
      extends: base,
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
        // no fontWeight — should inherit from base
      },
    });

    expect(child.tokens.fontWeight?.regular).toBe('400');
    expect(child.tokens.fontWeight?.bold).toBe('700');
  });

  it('CT-BUG-2: child can override individual fontWeight keys via composeTheme', () => {
    const base = createTheme({
      tokens: {
        colors: { primary: { '500': '#aaa' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
        fontWeight: { regular: '400', bold: '700' },
      },
    });

    const child = createTheme({
      extends: base,
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
        fontWeight: { bold: '900' },
      },
    });

    // Child overrides bold, inherits regular
    expect(child.tokens.fontWeight?.regular).toBe('400');
    expect(child.tokens.fontWeight?.bold).toBe('900');
  });

  it('CT-BUG-3: child inherits base lineHeight tokens through composeTheme', () => {
    const base = createTheme({
      tokens: {
        colors: { primary: { '500': '#aaa' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
        lineHeight: { sm: '1.45', md: '1.55', lg: '1.6' },
      },
    });

    const child = createTheme({
      extends: base,
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
        // no lineHeight — should inherit from base
      },
    });

    expect(child.tokens.lineHeight?.sm).toBe('1.45');
    expect(child.tokens.lineHeight?.md).toBe('1.55');
    expect(child.tokens.lineHeight?.lg).toBe('1.6');
  });

  it('CT-BUG-4: child inherits base heading tokens through composeTheme', () => {
    const base = createTheme({
      tokens: {
        colors: { primary: { '500': '#aaa' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
        heading: {
          sizes: {
            h1: { fontSize: '2rem', fontWeight: '700', lineHeight: '1.3' },
            h2: { fontSize: '1.5rem', fontWeight: '700', lineHeight: '1.35' },
            h3: { fontSize: '1.25rem', fontWeight: '700', lineHeight: '1.4' },
            h4: { fontSize: '1rem', fontWeight: '700', lineHeight: '1.45' },
            h5: { fontSize: '0.875rem', fontWeight: '700', lineHeight: '1.5' },
            h6: { fontSize: '0.75rem', fontWeight: '700', lineHeight: '1.5' },
          },
          textWrap: 'wrap',
        },
      },
    });

    const child = createTheme({
      extends: base,
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
        // no heading — should inherit from base
      },
    });

    expect(child.tokens.heading?.sizes.h1.fontSize).toBe('2rem');
    expect(child.tokens.heading?.textWrap).toBe('wrap');
  });

  it('CT-BUG-5: composeTheme preserves fontWeight when dark tokens have fontWeight', () => {
    const base = createTheme({
      tokens: {
        colors: { primary: { '500': '#aaa' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
      dark: {
        fontWeight: { regular: '400' },
      },
    });

    const child = createTheme({
      extends: base,
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
      },
      // no dark override — should inherit base dark
    });

    expect(child.dark.fontWeight?.regular).toBe('400');
  });
});
