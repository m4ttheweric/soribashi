import { describe, expect, it } from 'vitest';
import { createTheme } from '@soribashi/theme';
import { emitCss } from '../src/emit-css.ts';

describe('emitCss', () => {
  it('emits :root with all color shade variables', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '50': 'hsl(0 0% 95%)', '500': 'hsl(0 0% 50%)' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    });

    const css = emitCss(theme);

    expect(css).toContain(':root {');
    expect(css).toContain('--color-primary-50: hsl(0 0% 95%);');
    expect(css).toContain('--color-primary-500: hsl(0 0% 50%);');
  });

  it('emits radius, spacing, and fontSize tokens', () => {
    const theme = createTheme({
      tokens: {
        colors: {},
        radius: { sm: '0.25rem', md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    });

    const css = emitCss(theme);
    expect(css).toContain('--radius-sm: 0.25rem;');
    expect(css).toContain('--radius-md: 0.5rem;');
    expect(css).toContain('--spacing-md: 0.5rem;');
    expect(css).toContain('--font-size-md: 1rem;');
  });

  it('emits dark-mode block when dark tokens are provided', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
      dark: {
        colors: { primary: { '500': 'hsl(0 0% 80%)' } },
      },
    });

    const css = emitCss(theme);
    expect(css).toContain('.dark {');
    expect(css).toContain('--color-primary-500: hsl(0 0% 80%);');
  });

  it('respects custom scope and darkMode selector', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
      dark: {
        colors: { primary: { '500': 'hsl(0 0% 80%)' } },
      },
      scope: '.claim-view-islands',
      darkMode: { selector: '.dark .claim-view-islands' },
    });

    const css = emitCss(theme);
    expect(css).toContain('.claim-view-islands {');
    expect(css).toContain('.dark .claim-view-islands {');
    expect(css).not.toContain(':root {');
  });

  it('emits semantic surface vars referencing color tokens', () => {
    const theme = createTheme({
      tokens: {
        colors: { neutral: { '0': '#fff', '100': '#eee' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
      semantic: {
        surface: { default: 'colors.neutral.0', raised: 'colors.neutral.100' },
      },
    });

    const css = emitCss(theme);
    expect(css).toContain('--surface-default: var(--color-neutral-0);');
    expect(css).toContain('--surface-raised: var(--color-neutral-100);');
  });

  it('output is deterministic — same theme produces identical output', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    });

    expect(emitCss(theme)).toBe(emitCss(theme));
  });

  it('begins with auto-generated header comment', () => {
    const theme = createTheme({
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });

    const css = emitCss(theme);
    expect(css.split('\n')[0]).toMatch(/auto-generated/i);
  });

  it('emits font-weight, line-height, font-family-heading vars', () => {
    const theme = createTheme({
      tokens: {
        colors: {}, radius: {}, spacing: {}, fontSize: {},
        fontFamily: { sans: 'Inter', heading: 'Georgia' },
        fontWeight: { regular: '400', bold: '700' },
        lineHeight: { md: '1.55' },
      },
    });
    const css = emitCss(theme);
    expect(css).toContain('--font-family-heading: Georgia;');
    expect(css).toContain('--font-weight-regular: 400;');
    expect(css).toContain('--font-weight-bold: 700;');
    expect(css).toContain('--line-height-md: 1.55;');
  });

  it('emits heading sizes per order as separate vars', () => {
    const theme = createTheme({
      tokens: {
        colors: {}, radius: {}, spacing: {}, fontSize: {},
        heading: {
          sizes: {
            h1: { fontSize: '2rem', fontWeight: '700', lineHeight: '1.3' },
            h2: { fontSize: '1.5rem' },
            h3: { fontSize: '1.25rem' },
            h4: { fontSize: '1.125rem' },
            h5: { fontSize: '1rem' },
            h6: { fontSize: '0.875rem' },
          },
        },
      },
    });
    const css = emitCss(theme);
    expect(css).toContain('--heading-h1-font-size: 2rem;');
    expect(css).toContain('--heading-h1-font-weight: 700;');
    expect(css).toContain('--heading-h1-line-height: 1.3;');
    expect(css).toContain('--heading-h6-font-size: 0.875rem;');
  });
});
