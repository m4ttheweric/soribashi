import { createTheme } from '@soribashi/theme';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useStyles } from '../src/hooks/use-styles.ts';
import { SoribashiProvider } from '../src/provider/provider.tsx';
import type { FactoryPayload } from '../src/types/index.ts';

type ButtonFactory = FactoryPayload & {
  props: { variant?: string; size?: string };
  stylesNames: 'root' | 'label';
};

const wrapper = (themeOverride?: any) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    const theme =
      themeOverride ??
      createTheme({
        tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      });
    return <SoribashiProvider theme={theme}>{children}</SoribashiProvider>;
  };

describe('useStyles', () => {
  it('returns getStyles function that resolves built-in class for selector', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'sb-Button-root', label: 'sb-Button-label' },
          props: {},
        }),
      { wrapper: wrapper() },
    );

    expect(result.current('root').className).toContain('sb-Button-root');
    expect(result.current('label').className).toContain('sb-Button-label');
  });

  it('merges instance className into root selector', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'sb-Button-root', label: 'sb-Button-label' },
          className: 'my-extra-class',
          props: {},
        }),
      { wrapper: wrapper() },
    );

    expect(result.current('root').className).toContain('sb-Button-root');
    expect(result.current('root').className).toContain('my-extra-class');
  });

  it('does NOT add instance className to non-root selectors', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'sb-Button-root', label: 'sb-Button-label' },
          className: 'my-extra-class',
          props: {},
        }),
      { wrapper: wrapper() },
    );

    expect(result.current('label').className).not.toContain('my-extra-class');
  });

  it('applies instance classNames per selector', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'sb-Button-root', label: 'sb-Button-label' },
          classNames: { root: 'instance-root-extra', label: 'instance-label-extra' },
          props: {},
        }),
      { wrapper: wrapper() },
    );

    expect(result.current('root').className).toContain('instance-root-extra');
    expect(result.current('label').className).toContain('instance-label-extra');
  });

  it('applies theme component classNames (object form)', () => {
    const themeWithClassNames = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: { classNames: { root: 'theme-root-extra' } },
      },
    });

    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'sb-Button-root' },
          props: {},
        }),
      { wrapper: wrapper(themeWithClassNames) },
    );

    expect(result.current('root').className).toContain('theme-root-extra');
  });

  it('applies theme component classNames (callback form, receives theme + props)', () => {
    const themeWithCallback = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: {
          classNames: ((_theme: any, props: any) => ({
            root: props.size === 'lg' ? 'theme-root-lg' : 'theme-root-default',
          })) as any,
        },
      },
    });

    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'sb-Button-root' },
          props: { size: 'lg' },
        }),
      { wrapper: wrapper(themeWithCallback) },
    );

    expect(result.current('root').className).toContain('theme-root-lg');
  });

  it('respects unstyled flag — drops built-in classes', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'sb-Button-root', label: 'sb-Button-label' },
          unstyled: true,
          classNames: { root: 'instance-only' },
          props: {},
        }),
      { wrapper: wrapper() },
    );

    expect(result.current('root').className).not.toContain('sb-Button-root');
    expect(result.current('root').className).toContain('instance-only');
  });

  it('emits data-variant when getStyles is called with variant option', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'sb-Button-root' },
          props: { variant: 'filled' },
        }),
      { wrapper: wrapper() },
    );

    const root = result.current('root', { variant: 'filled' });
    expect(root['data-variant']).toBe('filled');
  });

  it('emits data-active when active option is true', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'sb-Button-root' },
          props: {},
        }),
      { wrapper: wrapper() },
    );

    expect(result.current('root', { active: true })['data-active']).toBe(true);
    expect(result.current('root', { active: false })['data-active']).toBeUndefined();
  });

  it('merges instance attributes with per-selector attributes from theme', () => {
    const themeWithAttrs = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: { attributes: { root: { 'data-testid': 'theme-button' } } },
      },
    });

    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'sb-Button-root' },
          attributes: { root: { 'data-testid': 'instance-button' } },
          props: {},
        }),
      { wrapper: wrapper(themeWithAttrs) },
    );

    const root = result.current('root');
    expect(root['data-testid' as keyof typeof root]).toBe('instance-button');
  });

  it('merges per-selector vars from varsResolver into style', () => {
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'sb-Button-root' },
          props: { variant: 'filled' },
          varsResolver: () => ({
            root: { '--btn-bg': 'red' },
          }),
        }),
      { wrapper: wrapper() },
    );

    const root = result.current('root');
    expect(root.style).toBeDefined();
    expect((root.style as any)['--btn-bg']).toBe('red');
  });
});

describe('attributes cannot clobber className/style', () => {
  it('filters className out of instance attributes and keeps other keys', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'sb-Button-root' },
          attributes: { root: { className: 'evil', 'data-ok': 'yes' } } as any,
          props: {},
        }),
      { wrapper: wrapper() },
    );

    const root = result.current('root');
    expect(root.className).toContain('sb-Button-root');
    expect(root.className).not.toContain('evil');
    expect((root as any)['data-ok']).toBe('yes');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('filters style out of theme attributes so it cannot fight the computed style', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const themeWithBadAttrs = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: {
          attributes: { root: { style: { color: 'red' }, 'data-x': '1' } } as any,
        },
      },
    });

    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'sb-Button-root' },
          props: {},
        }),
      { wrapper: wrapper(themeWithBadAttrs) },
    );

    const root = result.current('root');
    expect(root.style).toBeUndefined();
    expect((root as any)['data-x']).toBe('1');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('filters className/style out of per-call part attributes', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = renderHook(
      () =>
        useStyles<ButtonFactory>({
          name: 'Button',
          classes: { root: 'sb-Button-root' },
          props: {},
        }),
      { wrapper: wrapper() },
    );

    const root = result.current('root', {
      attributes: { root: { className: 'evil', style: { color: 'red' }, 'data-part': 'p' } } as any,
    });
    expect(root.className).toContain('sb-Button-root');
    expect(root.className).not.toContain('evil');
    expect(root.style).toBeUndefined();
    expect((root as any)['data-part']).toBe('p');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
