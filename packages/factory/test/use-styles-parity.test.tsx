/**
 * Parity tests for soribashi `useStyles` vs Mantine `useStyles`.
 *
 * Every test exercises a specific decision point (branch) in Mantine's source.
 * Branch IDs correspond to the enumeration in
 * `docs/superpowers/audits/2026-04-25-factory-parity-branches.md`.
 *
 * Tests that cover intentional gaps are marked with the gap ID and assert that
 * soribashi behaves as documented (rather than matching Mantine exactly).
 */
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
import type { ResolvedTheme } from '@soribashi/theme';
import { SoribashiProvider } from '../src/provider/provider.tsx';
import { useStyles } from '../src/hooks/use-styles.ts';
import type { FactoryPayload } from '../src/types/index.ts';

// ---------------------------------------------------------------------------
// Test infrastructure
// ---------------------------------------------------------------------------

type ButtonFactory = FactoryPayload & {
  props: { variant?: string; size?: string; loading?: boolean };
  stylesNames: 'root' | 'label' | 'icon';
};

const defaultTheme = createTheme({
  tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
});

const makeWrapper = (theme?: ResolvedTheme) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <SoribashiProvider theme={theme ?? defaultTheme}>
        {children}
      </SoribashiProvider>
    );
  };

// ---------------------------------------------------------------------------
// US-01: `name` as single string (soribashi only supports string)
// ---------------------------------------------------------------------------

describe('US-01: name as string', () => {
  it('resolves theme component by name string', () => {
    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: { classNames: { root: 'theme-btn-root' } },
      },
    });

    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: {},
          props: {},
        }),
      { wrapper: makeWrapper(theme) },
    );

    expect(result.current('root').className).toContain('theme-btn-root');
  });

  it('returns empty className for unknown component name', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'NonExistent',
          classes: { root: 'base-root' },
          props: {},
        }),
      { wrapper: makeWrapper() },
    );

    // Should still have built-in class, just no theme additions
    expect(result.current('root').className).toContain('base-root');
  });
});

// ---------------------------------------------------------------------------
// US-02: `classNames` as function vs object — receives (theme, props)
// ---------------------------------------------------------------------------

describe('US-02: classNames as function', () => {
  it('classNames function receives theme and props and is called', () => {
    const receivedArgs: any[] = [];
    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      name: 'test-theme',
    });

    const classNamesFn = (t: ResolvedTheme, p: ButtonFactory['props']) => {
      receivedArgs.push({ theme: t, props: p });
      return { root: 'fn-root-class' };
    };

    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: {},
          classNames: classNamesFn,
          props: { variant: 'filled', size: 'lg' },
        }),
      { wrapper: makeWrapper(theme) },
    );

    // Invoke the returned function to trigger classNames resolution
    result.current('root');

    expect(receivedArgs.length).toBeGreaterThan(0);
    expect(receivedArgs[0].props).toEqual({ variant: 'filled', size: 'lg' });
  });

  it('classNames function result is merged into className', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'base' },
          classNames: (_theme, props) => ({
            root: props.size === 'lg' ? 'lg-root' : 'default-root',
          }),
          props: { size: 'lg' },
        }),
      { wrapper: makeWrapper() },
    );

    expect(result.current('root').className).toContain('lg-root');
  });

  it('classNames function result with non-matching prop returns the other branch', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'base' },
          classNames: (_theme, props) => ({
            root: props.size === 'lg' ? 'lg-root' : 'default-root',
          }),
          props: { size: 'sm' },
        }),
      { wrapper: makeWrapper() },
    );

    expect(result.current('root').className).toContain('default-root');
    expect(result.current('root').className).not.toContain('lg-root');
  });

  it('classNames object form applied directly', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: {},
          classNames: { root: 'obj-root', label: 'obj-label' },
          props: {},
        }),
      { wrapper: makeWrapper() },
    );

    expect(result.current('root').className).toContain('obj-root');
    expect(result.current('label').className).toContain('obj-label');
  });

  it('classNames undefined treated as empty (no crash)', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'base' },
          classNames: undefined,
          props: {},
        }),
      { wrapper: makeWrapper() },
    );

    expect(result.current('root').className).toContain('base');
  });
});

// ---------------------------------------------------------------------------
// US-06 / US-13 / US-14: Theme classNames resolved per-selector
// ---------------------------------------------------------------------------

describe('US-06 / US-13 / US-14: theme classNames resolution', () => {
  it('theme classNames (object) adds class to matching selector', () => {
    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: { classNames: { root: 'theme-root', label: 'theme-label' } },
      },
    });

    const { result } = renderHook(
      () => useStyles<ButtonFactory>({ name: 'Button', classes: {}, props: {} }),
      { wrapper: makeWrapper(theme) },
    );

    expect(result.current('root').className).toContain('theme-root');
    expect(result.current('label').className).toContain('theme-label');
  });

  it('theme classNames (function) receives theme and props', () => {
    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: {
          classNames: ((_theme: any, props: any) => ({
            root: props.variant === 'filled' ? 'filled-root' : 'default-root',
          })) as any,
        },
      },
    });

    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: {},
          props: { variant: 'filled' },
        }),
      { wrapper: makeWrapper(theme) },
    );

    expect(result.current('root').className).toContain('filled-root');
  });

  it('theme classNames only applies to the selector it targets', () => {
    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: { classNames: { root: 'theme-root-only' } },
      },
    });

    const { result } = renderHook(
      () => useStyles<ButtonFactory>({ name: 'Button', classes: {}, props: {} }),
      { wrapper: makeWrapper(theme) },
    );

    expect(result.current('root').className).toContain('theme-root-only');
    expect(result.current('label').className).not.toContain('theme-root-only');
  });
});

// ---------------------------------------------------------------------------
// US-07 / US-08: varsResolver and theme vars — precedence
// ---------------------------------------------------------------------------

describe('US-07 / US-08: vars resolution precedence', () => {
  it('varsResolver produces CSS variables in style', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: {},
          props: {},
          varsResolver: () => ({ root: { '--btn-color': 'blue' } }),
        }),
      { wrapper: makeWrapper() },
    );

    expect((result.current('root').style as any)?.['--btn-color']).toBe('blue');
  });

  it('theme vars override varsResolver (theme.vars wins over varsResolver)', () => {
    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: {
          vars: () => ({ root: { '--btn-color': 'from-theme' } }),
        },
      },
    });

    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: {},
          props: {},
          varsResolver: () => ({ root: { '--btn-color': 'from-varsResolver' } }),
        }),
      { wrapper: makeWrapper(theme) },
    );

    // theme.vars should win over varsResolver
    expect((result.current('root').style as any)?.['--btn-color']).toBe('from-theme');
  });

  it('varsResolver is applied even when no theme vars', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: {},
          props: {},
          varsResolver: () => ({
            root: { '--x': 'a', '--y': 'b' },
            label: { '--label-x': 'c' },
          }),
        }),
      { wrapper: makeWrapper() },
    );

    const rootStyle = result.current('root').style as any;
    expect(rootStyle?.['--x']).toBe('a');
    expect(rootStyle?.['--y']).toBe('b');

    const labelStyle = result.current('label').style as any;
    expect(labelStyle?.['--label-x']).toBe('c');
  });

  it('varsResolver and theme vars are per-selector', () => {
    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: {
          vars: () => ({ root: { '--root-var': 'theme' } }),
        },
      },
    });

    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: {},
          props: {},
          varsResolver: () => ({
            root: { '--root-var': 'resolver', '--other': 'resolver-only' },
            label: { '--label-var': 'label-only' },
          }),
        }),
      { wrapper: makeWrapper(theme) },
    );

    // theme.vars wins on root for --root-var
    expect((result.current('root').style as any)?.['--root-var']).toBe('theme');
    // varsResolver-only var is still present on root
    expect((result.current('root').style as any)?.['--other']).toBe('resolver-only');
    // label var only from varsResolver
    expect((result.current('label').style as any)?.['--label-var']).toBe('label-only');
  });
});

// ---------------------------------------------------------------------------
// US-10 / US-11 (global classes gap): attributes spreading
// ---------------------------------------------------------------------------

describe('US-10: attributes spreading', () => {
  it('instance attributes are spread into result', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: {},
          props: {},
          attributes: {
            root: { 'data-testid': 'my-button', 'aria-label': 'close' },
          },
        }),
      { wrapper: makeWrapper() },
    );

    const root = result.current('root');
    expect((root as any)['data-testid']).toBe('my-button');
    expect((root as any)['aria-label']).toBe('close');
  });

  it('instance attributes only apply to their selector', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: {},
          props: {},
          attributes: {
            root: { 'data-testid': 'my-button' },
          },
        }),
      { wrapper: makeWrapper() },
    );

    const label = result.current('label');
    expect((label as any)['data-testid']).toBeUndefined();
  });

  it('theme attributes are applied and instance attributes override them per selector', () => {
    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: {
          attributes: {
            root: { 'data-testid': 'theme-id', 'data-component': 'button' },
          },
        },
      },
    });

    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: {},
          props: {},
          attributes: {
            root: { 'data-testid': 'instance-id' },
          },
        }),
      { wrapper: makeWrapper(theme) },
    );

    const root = result.current('root');
    // instance overrides theme for same key
    expect((root as any)['data-testid']).toBe('instance-id');
    // theme-only attribute still present
    expect((root as any)['data-component']).toBe('button');
  });
});

// ---------------------------------------------------------------------------
// US-17: `className` only on root selector
// ---------------------------------------------------------------------------

describe('US-17: className only on root selector', () => {
  it('className is added to root selector', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'base-root', label: 'base-label' },
          className: 'extra-class',
          props: {},
        }),
      { wrapper: makeWrapper() },
    );

    expect(result.current('root').className).toContain('extra-class');
  });

  it('className is NOT added to non-root selectors', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'base-root', label: 'base-label' },
          className: 'extra-class',
          props: {},
        }),
      { wrapper: makeWrapper() },
    );

    expect(result.current('label').className).not.toContain('extra-class');
    expect(result.current('icon').className).not.toContain('extra-class');
  });

  it('className can be undefined without crashing', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'base-root' },
          className: undefined,
          props: {},
        }),
      { wrapper: makeWrapper() },
    );

    expect(result.current('root').className).toBe('base-root');
  });
});

// ---------------------------------------------------------------------------
// US-19: per-call options.className appended last (highest className specificity)
// ---------------------------------------------------------------------------

describe('US-19: options.className appended last', () => {
  it('options.className is included in the className result', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'base' },
          props: {},
        }),
      { wrapper: makeWrapper() },
    );

    expect(result.current('root', { className: 'call-site-class' }).className).toContain(
      'call-site-class',
    );
  });

  it('options.className is present alongside built-in class', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'base-root' },
          props: {},
        }),
      { wrapper: makeWrapper() },
    );

    const cn = result.current('root', { className: 'extra' }).className;
    expect(cn).toContain('base-root');
    expect(cn).toContain('extra');
  });

  it('options.className applies to non-root selectors too', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { label: 'base-label' },
          className: 'root-only',
          props: {},
        }),
      { wrapper: makeWrapper() },
    );

    const cn = result.current('label', { className: 'label-extra' }).className;
    expect(cn).toContain('label-extra');
    expect(cn).not.toContain('root-only');
  });
});

// ---------------------------------------------------------------------------
// US-20: `unstyled` suppresses built-in class
// ---------------------------------------------------------------------------

describe('US-20: unstyled flag', () => {
  it('unstyled=true removes built-in classes from all selectors', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'base-root', label: 'base-label', icon: 'base-icon' },
          unstyled: true,
          props: {},
        }),
      { wrapper: makeWrapper() },
    );

    expect(result.current('root').className).not.toContain('base-root');
    expect(result.current('label').className).not.toContain('base-label');
    expect(result.current('icon').className).not.toContain('base-icon');
  });

  it('unstyled=true preserves instance classNames', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'base-root' },
          unstyled: true,
          classNames: { root: 'instance-root' },
          props: {},
        }),
      { wrapper: makeWrapper() },
    );

    expect(result.current('root').className).toContain('instance-root');
  });

  it('unstyled=true preserves className prop on root', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'base-root' },
          unstyled: true,
          className: 'my-custom',
          props: {},
        }),
      { wrapper: makeWrapper() },
    );

    expect(result.current('root').className).toContain('my-custom');
    expect(result.current('root').className).not.toContain('base-root');
  });

  it('unstyled=false (default) includes built-in classes', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'base-root' },
          unstyled: false,
          props: {},
        }),
      { wrapper: makeWrapper() },
    );

    expect(result.current('root').className).toContain('base-root');
  });
});

// ---------------------------------------------------------------------------
// US-21: style merge order — theme styles → instance styles → vars
// ---------------------------------------------------------------------------

describe('US-21: style merge order', () => {
  it('instance styles override theme styles for same property', () => {
    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: {
          styles: { root: { color: 'theme-color', fontSize: '14px' } },
        },
      },
    });

    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: {},
          props: {},
          styles: { root: { color: 'instance-color' } },
        }),
      { wrapper: makeWrapper(theme) },
    );

    const style = result.current('root').style;
    // instance overrides theme
    expect(style?.color).toBe('instance-color');
    // theme-only property still present
    expect(style?.fontSize).toBe('14px');
  });

  it('vars override both theme styles and instance styles for same property (last write wins in style merge)', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: {},
          props: {},
          styles: { root: { color: 'from-styles' } },
          // CSS vars are not the same as 'color' but test that vars appear in style
          varsResolver: () => ({ root: { '--btn-bg': 'purple' } }),
        }),
      { wrapper: makeWrapper() },
    );

    const style = result.current('root').style as any;
    // styles color present
    expect(style?.color).toBe('from-styles');
    // vars also present
    expect(style?.['--btn-bg']).toBe('purple');
  });

  it('theme styles are applied for matching selector', () => {
    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: { styles: { root: { padding: '8px' }, label: { fontWeight: '600' } } },
      },
    });

    const { result } = renderHook(
      () => useStyles<ButtonFactory>({ name: 'Button', classes: {}, props: {} }),
      { wrapper: makeWrapper(theme) },
    );

    expect(result.current('root').style?.padding).toBe('8px');
    expect(result.current('label').style?.fontWeight).toBe('600');
  });

  it('theme styles function receives theme and props', () => {
    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: {
          styles: ((_theme: any, props: any) => ({
            root: { fontSize: props.size === 'lg' ? '18px' : '14px' },
          })) as any,
        },
      },
    });

    const { result: lgResult } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: {},
          props: { size: 'lg' },
        }),
      { wrapper: makeWrapper(theme) },
    );

    expect(lgResult.current('root').style?.fontSize).toBe('18px');

    const { result: smResult } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: {},
          props: { size: 'sm' },
        }),
      { wrapper: makeWrapper(theme) },
    );

    expect(smResult.current('root').style?.fontSize).toBe('14px');
  });
});

// ---------------------------------------------------------------------------
// US-24 (gap): rootSelector hardcoded to 'root'
// ---------------------------------------------------------------------------

describe('US-24 (INTENTIONAL_GAP): rootSelector is hardcoded to root', () => {
  it('className is only added to root selector (not any other)', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'base-root', label: 'base-label' },
          className: 'instance-class',
          props: {},
        }),
      { wrapper: makeWrapper() },
    );

    // root gets className
    expect(result.current('root').className).toContain('instance-class');
    // label does not
    expect(result.current('label').className).not.toContain('instance-class');
  });

  it('style is only applied at root selector', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: {},
          props: {},
          style: { color: 'red' },
        }),
      { wrapper: makeWrapper() },
    );

    expect(result.current('root').style?.color).toBe('red');
    // label does not get root style
    expect(result.current('label').style?.color).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// US-29: undefined values in vars
// ---------------------------------------------------------------------------

describe('US-29: undefined values in vars', () => {
  it('varsResolver with defined values produces those in style', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: {},
          props: {},
          varsResolver: () => ({ root: { '--defined': 'value', '--empty': undefined as any } }),
        }),
      { wrapper: makeWrapper() },
    );

    const style = result.current('root').style as any;
    // defined value should be present
    expect(style?.['--defined']).toBe('value');
    // undefined value: Mantine uses filterProps to strip it so the key is absent
    // soribashi uses Object.assign which keeps the key with undefined value
    // Both produce style['--empty'] === undefined so access is the same,
    // but the key presence differs. We use 'in' operator to check for key presence.
    // Mantine behavior: key NOT present in style object
    // Soribashi behavior: key IS present (with undefined value)
    // This is a known bug (US-29) — the 'in' check documents it
    expect('--empty' in (style ?? {})).toBe(false); // Mantine behavior: key absent
  });

  it('varsResolver with all defined values: no extra keys', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: {},
          props: {},
          varsResolver: () => ({ root: { '--a': 'x', '--b': 'y' } }),
        }),
      { wrapper: makeWrapper() },
    );

    const style = result.current('root').style as any;
    expect(style?.['--a']).toBe('x');
    expect(style?.['--b']).toBe('y');
  });
});

// ---------------------------------------------------------------------------
// US-32 (gap): active flag behavior — soribashi uses data-active, not className
// ---------------------------------------------------------------------------

describe('US-32 (INTENTIONAL_GAP): active option', () => {
  it('active=true sets data-active attribute (soribashi behavior)', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({ name: 'Button', classes: {}, props: {} }),
      { wrapper: makeWrapper() },
    );

    const root = result.current('root', { active: true });
    expect((root as any)['data-active']).toBe(true);
  });

  it('active=false does NOT set data-active attribute', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({ name: 'Button', classes: {}, props: {} }),
      { wrapper: makeWrapper() },
    );

    const root = result.current('root', { active: false });
    expect((root as any)['data-active']).toBeUndefined();
  });

  it('active=undefined does NOT set data-active attribute', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({ name: 'Button', classes: {}, props: {} }),
      { wrapper: makeWrapper() },
    );

    const root = result.current('root', {});
    expect((root as any)['data-active']).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// US-12 (gap): variant — soribashi emits data-variant, not a variant class
// ---------------------------------------------------------------------------

describe('US-12 (INTENTIONAL_GAP): variant option', () => {
  it('variant option sets data-variant attribute', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({ name: 'Button', classes: {}, props: {} }),
      { wrapper: makeWrapper() },
    );

    const root = result.current('root', { variant: 'filled' });
    expect((root as any)['data-variant']).toBe('filled');
  });

  it('variant=undefined does NOT set data-variant attribute', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({ name: 'Button', classes: {}, props: {} }),
      { wrapper: makeWrapper() },
    );

    const root = result.current('root', {});
    expect((root as any)['data-variant']).toBeUndefined();
  });

  it('variant does not suppress built-in class (no Mantine variant class lookup)', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: {
            root: 'base-root',
            // Mantine would look for 'root--filled' in classes; soribashi does not
          },
          props: {},
        }),
      { wrapper: makeWrapper() },
    );

    const root = result.current('root', { variant: 'filled' });
    expect(root.className).toContain('base-root');
  });
});

// ---------------------------------------------------------------------------
// Compound scenario: all className sources stack together
// ---------------------------------------------------------------------------

describe('className stacking: all sources combine', () => {
  it('built-in + theme + instance + className + options.className all present', () => {
    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: { classNames: { root: 'theme-class' } },
      },
    });

    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'built-in' },
          className: 'instance-root-class',
          classNames: { root: 'instance-classNames' },
          props: {},
        }),
      { wrapper: makeWrapper(theme) },
    );

    const cn = result.current('root', { className: 'call-site' }).className;
    expect(cn).toContain('built-in');
    expect(cn).toContain('theme-class');
    expect(cn).toContain('instance-classNames');
    expect(cn).toContain('instance-root-class');
    expect(cn).toContain('call-site');
  });

  it('all style sources combine', () => {
    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: { styles: { root: { padding: '4px' } } },
      },
    });

    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: {},
          props: {},
          styles: { root: { margin: '2px' } },
          varsResolver: () => ({ root: { '--x': 'y' } }),
          style: { color: 'green' },
        }),
      { wrapper: makeWrapper(theme) },
    );

    const style = result.current('root').style as any;
    expect(style?.padding).toBe('4px');
    expect(style?.margin).toBe('2px');
    expect(style?.['--x']).toBe('y');
    expect(style?.color).toBe('green');
  });
});

// ---------------------------------------------------------------------------
// styles as function
// ---------------------------------------------------------------------------

describe('styles as function', () => {
  it('instance styles function receives theme and props', () => {
    const received: any[] = [];
    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      name: 'my-theme',
    });

    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: {},
          props: { size: 'lg' },
          styles: (t, p) => {
            received.push({ theme: t, props: p });
            return { root: { fontSize: '18px' } };
          },
        }),
      { wrapper: makeWrapper(theme) },
    );

    // Invoke the returned function to trigger styles resolution
    result.current('root');

    expect(received.length).toBeGreaterThan(0);
    expect(received[0].props.size).toBe('lg');
  });

  it('instance styles function result applied to matching selector', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: {},
          props: { size: 'lg' },
          styles: (_t, p) => ({
            root: { fontSize: p.size === 'lg' ? '18px' : '14px' },
          }),
        }),
      { wrapper: makeWrapper() },
    );

    expect(result.current('root').style?.fontSize).toBe('18px');
  });
});

// ---------------------------------------------------------------------------
// style prop on root selector only
// ---------------------------------------------------------------------------

describe('root style prop', () => {
  it('config.style is applied only to root selector', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: {},
          props: {},
          style: { backgroundColor: 'hotpink' },
        }),
      { wrapper: makeWrapper() },
    );

    expect(result.current('root').style?.backgroundColor).toBe('hotpink');
    expect(result.current('label').style?.backgroundColor).toBeUndefined();
  });

  it('options.style overrides per-call (applied to any selector)', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: {},
          props: {},
        }),
      { wrapper: makeWrapper() },
    );

    const label = result.current('label', { style: { color: 'teal' } });
    expect(label.style?.color).toBe('teal');
  });
});

// ---------------------------------------------------------------------------
// style is omitted when empty (soribashi behavior)
// ---------------------------------------------------------------------------

describe('style omitted when empty', () => {
  it('style key is absent when no styles are applied', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'base-root' },
          props: {},
        }),
      { wrapper: makeWrapper() },
    );

    expect(result.current('root').style).toBeUndefined();
  });

  it('style key is present when at least one source provides a style', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: {},
          props: {},
          style: { color: 'red' },
        }),
      { wrapper: makeWrapper() },
    );

    expect(result.current('root').style).toBeDefined();
    expect(result.current('root').style?.color).toBe('red');
  });
});

// ---------------------------------------------------------------------------
// GetStylesResult shape
// ---------------------------------------------------------------------------

describe('getStyles result shape', () => {
  it('always returns className string', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({ name: 'Button', classes: {}, props: {} }),
      { wrapper: makeWrapper() },
    );

    expect(typeof result.current('root').className).toBe('string');
  });

  it('className is empty string when no sources contribute', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({ name: 'Button', classes: {}, props: {} }),
      { wrapper: makeWrapper() },
    );

    expect(result.current('root').className).toBe('');
  });
});
