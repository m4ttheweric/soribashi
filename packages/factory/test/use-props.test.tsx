import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
import { SoribashiProvider } from '../src/provider/provider.tsx';
import { useProps } from '../src/hooks/use-props.ts';

interface ButtonProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'filled' | 'outline';
  loading?: boolean;
  children?: string;
}

const wrapper = (themeOverride?: any) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    const theme =
      themeOverride ??
      createTheme({
        tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      });
    return <SoribashiProvider theme={theme}>{children}</SoribashiProvider>;
  };

describe('useProps', () => {
  it('returns instance props when no defaults exist', () => {
    const { result } = renderHook(
      () => useProps<ButtonProps>('Button', null, { size: 'md', loading: true }),
      { wrapper: wrapper() },
    );
    expect(result.current).toEqual({ size: 'md', loading: true });
  });

  it('applies component-level defaults when not in instance props', () => {
    const { result } = renderHook(
      () => useProps<ButtonProps>('Button', { size: 'md', variant: 'filled' }, { loading: true }),
      { wrapper: wrapper() },
    );
    expect(result.current).toEqual({ size: 'md', variant: 'filled', loading: true });
  });

  it('instance props override component defaults', () => {
    const { result } = renderHook(
      () => useProps<ButtonProps>('Button', { size: 'md' }, { size: 'lg' }),
      { wrapper: wrapper() },
    );
    expect(result.current.size).toBe('lg');
  });

  it('theme defaultProps override component defaults but lose to instance', () => {
    const themeWithDefaults = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: { defaultProps: { size: 'lg', variant: 'outline' } },
      },
    });

    const { result } = renderHook(
      () =>
        useProps<ButtonProps>(
          'Button',
          { size: 'md', variant: 'filled' },
          { variant: 'outline' },
        ),
      { wrapper: wrapper(themeWithDefaults) },
    );
    expect(result.current.size).toBe('lg');
    expect(result.current.variant).toBe('outline');
  });

  it('instance props with explicit undefined do NOT override defaults', () => {
    const { result } = renderHook(
      () =>
        useProps<ButtonProps>(
          'Button',
          { size: 'md' },
          { size: undefined as unknown as 'sm' },
        ),
      { wrapper: wrapper() },
    );
    expect(result.current.size).toBe('md');
  });

  it('theme defaultProps as a function receives the theme and returns dynamic defaults', () => {
    // Validates Mantine parity: theme.components.X.defaultProps can be `(theme) => Partial<Props>`.
    // Reference: mantine/packages/@mantine/core/src/core/MantineProvider/use-props/use-props.ts
    const themeWithFunctionDefaults = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      name: 'fn-defaults',
      components: {
        Button: {
          defaultProps: ((theme: any) => ({
            size: theme.name === 'fn-defaults' ? 'lg' : 'sm',
            variant: 'filled',
          })) as any,
        },
      },
    });

    const { result } = renderHook(
      () => useProps<ButtonProps>('Button', { size: 'sm' }, { loading: false }),
      { wrapper: wrapper(themeWithFunctionDefaults) },
    );
    expect(result.current.size).toBe('lg');
    expect(result.current.variant).toBe('filled');
  });
});
