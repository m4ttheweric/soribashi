import { describe, expect, it } from 'vitest';
import { createTheme, defaultTokens } from '@soribashi/theme';
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
    // Bare-component companion vars enable Tailwind's <alpha-value> pattern
    // (and direct alpha use like `hsl(var(--__hsl-color-primary-500) / 0.5)`).
    expect(css).toContain('--__hsl-color-primary-50: 0 0% 95%;');
    expect(css).toContain('--__hsl-color-primary-500: 0 0% 50%;');
  });

  it('omits the --__hsl- companion var for non-hsl color values', () => {
    const theme = createTheme({
      tokens: {
        colors: {
          brand: {
            primary: '#ff0000',
            secondary: 'rgb(0 255 0)',
            tertiary: 'currentColor',
          },
        },
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });

    const css = emitCss(theme);
    expect(css).toContain('--color-brand-primary: #ff0000;');
    expect(css).toContain('--color-brand-secondary: rgb(0 255 0);');
    expect(css).toContain('--color-brand-tertiary: currentColor;');
    // Non-hsl values can't usefully participate in Tailwind's alpha-value
    // pattern, so the --__hsl- companion is omitted.
    expect(css).not.toContain('--__hsl-color-brand-primary');
    expect(css).not.toContain('--__hsl-color-brand-secondary');
    expect(css).not.toContain('--__hsl-color-brand-tertiary');
  });

  it('skips --__hsl- companion vars when emitCompanionHsl=false', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });

    const css = emitCss(theme, { emitCompanionHsl: false });
    expect(css).toContain('--color-primary-500: hsl(0 0% 50%);');
    expect(css).not.toContain('--__hsl-color-primary-500');
  });

  it('emits --__hsl- companion vars when emitCompanionHsl=true (default)', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });

    const cssDefault = emitCss(theme);
    const cssExplicit = emitCss(theme, { emitCompanionHsl: true });
    expect(cssDefault).toContain('--__hsl-color-primary-500: 0 0% 50%;');
    expect(cssExplicit).toContain('--__hsl-color-primary-500: 0 0% 50%;');
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
      semanticTokens: {
        surface: { default: 'colors.neutral.0', raised: 'colors.neutral.100' },
      },
    });

    const css = emitCss(theme);
    expect(css).toContain('--surface-default: var(--color-neutral-0);');
    expect(css).toContain('--surface-raised: var(--color-neutral-100);');
  });

  it('emits --accent-* vars when semanticTokens.accent is provided (Gap 4)', () => {
    const theme = createTheme({
      tokens: {
        colors: {
          primary: { '500': 'hsl(221 83% 53%)' },
          warning: { '500': 'hsl(38 92% 50%)' },
        },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
      semanticTokens: {
        accent: {
          feedback: 'colors.warning.500',
          brand: 'colors.primary.500',
        },
      },
    });

    const css = emitCss(theme);
    expect(css).toContain('--accent-feedback: var(--color-warning-500);');
    expect(css).toContain('--accent-brand: var(--color-primary-500);');
  });

  it('does NOT emit --accent-* vars when semanticTokens.accent is omitted (default)', () => {
    const theme = createTheme({
      tokens: {
        colors: { neutral: { '0': '#fff' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    });

    const css = emitCss(theme);
    expect(css).not.toContain('--accent-');
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

  it('emits --heading-text-wrap when tokens.heading.textWrap is set', () => {
    const theme = createTheme({
      tokens: {
        colors: {}, radius: {}, spacing: {}, fontSize: {},
        heading: {
          sizes: {
            h1: { fontSize: '2rem' },
            h2: { fontSize: '1.5rem' },
            h3: { fontSize: '1.25rem' },
            h4: { fontSize: '1.125rem' },
            h5: { fontSize: '1rem' },
            h6: { fontSize: '0.875rem' },
          },
          textWrap: 'wrap',
        },
      },
    });
    const css = emitCss(theme);
    expect(css).toContain('--heading-text-wrap: wrap;');
  });

  it('does not emit --heading-text-wrap when tokens.heading is absent', () => {
    const theme = createTheme({
      tokens: {
        colors: {}, radius: {}, spacing: {}, fontSize: {},
      },
    });
    const css = emitCss(theme);
    expect(css).not.toContain('--heading-text-wrap');
  });
});

describe('emitCss with EmitCssOptions.cssVariablesResolver', () => {
  it('appends `root` vars to the :root block', () => {
    const theme = createTheme({ tokens: defaultTokens });
    const css = emitCss(theme, {
      cssVariablesResolver: () => ({ root: { '--my-custom': 'red' } }),
    });
    expect(css).toContain('--my-custom: red;');
    // Should be inside the :root block (matches scope), so before first .dark { ... }
    const rootBlock = css.split('.dark')[0]!;
    expect(rootBlock).toContain('--my-custom: red;');
  });

  it('appends `dark` vars to the .dark block', () => {
    const theme = createTheme({ tokens: defaultTokens });
    const css = emitCss(theme, {
      cssVariablesResolver: () => ({ dark: { '--my-custom-dark': 'blue' } }),
    });
    expect(css).toContain('--my-custom-dark: blue;');
    const rootBlock = css.split('.dark')[0]!;
    expect(rootBlock).not.toContain('--my-custom-dark:');
  });

  it('consumer var overrides default-emitted var on key conflict (later wins via cascade)', () => {
    const theme = createTheme({ tokens: defaultTokens });
    const css = emitCss(theme, {
      cssVariablesResolver: () => ({ root: { '--spacing-md': '99px' } }),
    });
    // Both lines exist in the :root block; the later one (consumer's) is the cascade winner.
    const rootBlock = css.split('.dark')[0]!;
    const lastIndex = rootBlock.lastIndexOf('--spacing-md:');
    const lastLine = rootBlock.substring(lastIndex).split(';')[0]!
    expect(lastLine).toBe('--spacing-md: 99px');
  });

  it('no resolver passed → emit output is identical to current behavior', () => {
    const theme = createTheme({ tokens: defaultTokens });
    const cssA = emitCss(theme);
    const cssB = emitCss(theme, {});
    expect(cssA).toBe(cssB);
  });

  it('resolver receives the resolved theme', () => {
    const theme = createTheme({ tokens: defaultTokens, name: 'my-theme' });
    let received: { name?: string } | null = null;
    emitCss(theme, {
      cssVariablesResolver: (t) => {
        received = t;
        return {};
      },
    });
    expect(received).not.toBeNull();
    expect((received as { name?: string } | null)?.name).toBe('my-theme');
  });
});

describe('emitCss with EmitCssOptions.removeDefaultVariables', () => {
  it('produces no token vars when theme exactly matches defaults', () => {
    const theme = createTheme({ tokens: defaultTokens });
    const css = emitCss(theme, { removeDefaultVariables: true });
    // Should still have the :root shell, but no --spacing-*, --color-*, etc.
    expect(css).not.toContain('--spacing-md:');
    expect(css).not.toContain('--color-primary-500:');
    expect(css).not.toContain('--radius-md:');
  });

  it('produces only overridden vars when one token is overridden', () => {
    const theme = createTheme({ tokens: { ...defaultTokens, spacing: { ...defaultTokens.spacing, md: '20px' } } });
    const css = emitCss(theme, { removeDefaultVariables: true });
    expect(css).toContain('--spacing-md: 20px;');
    expect(css).not.toContain('--spacing-xs:'); // matches default — dedup'd
  });

  it('default (no opts) emits the full theme as before', () => {
    const theme = createTheme({ tokens: { colors: {}, radius: {}, spacing: { md: '0.75rem' }, fontSize: { md: '1rem' } } });
    const css = emitCss(theme);
    expect(css).toContain('--spacing-md:');
  });

  it('removeDefaultVariables: false is equivalent to omitting opts', () => {
    const theme = createTheme({ tokens: { colors: {}, radius: {}, spacing: { md: '0.75rem' }, fontSize: { md: '1rem' } } });
    const cssA = emitCss(theme, { removeDefaultVariables: false });
    const cssB = emitCss(theme);
    expect(cssA).toBe(cssB);
  });
});
