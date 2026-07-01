import { createTheme } from '@soribashi/theme';
import type { ResolvedTheme } from '@soribashi/theme';
import { renderHook } from '@testing-library/react';
/**
 * Parity tests for soribashi `useProps` vs Mantine `useProps`.
 *
 * Every test exercises a specific decision point (branch) in Mantine's source.
 * Branch IDs correspond to the enumeration in
 * `docs/superpowers/audits/2026-04-25-factory-parity-branches.md`.
 *
 * Reference Mantine file:
 * `packages/@mantine/core/src/core/MantineProvider/use-props/use-props.ts`
 * at commit 63dafbbf.
 */
import { describe, expect, it } from 'vitest';
import { useProps } from '../src/hooks/use-props.ts';
import { SoribashiProvider } from '../src/provider/provider.tsx';

// ---------------------------------------------------------------------------
// Test infrastructure
// ---------------------------------------------------------------------------

interface ButtonProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'filled' | 'outline' | 'subtle';
  loading?: boolean;
  disabled?: boolean;
  color?: string;
  children?: string;
}

const defaultTheme = createTheme({
  tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
});

const makeWrapper = (theme?: ResolvedTheme) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <SoribashiProvider theme={theme ?? defaultTheme}>{children}</SoribashiProvider>;
  };

// ---------------------------------------------------------------------------
// UP-01: defaultProps as object vs function
// ---------------------------------------------------------------------------

describe('UP-01: defaultProps as object', () => {
  it('object-form defaultProps applied when instance does not provide key', () => {
    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: { defaultProps: { size: 'lg', variant: 'filled' } },
      },
    });

    const { result } = renderHook(() => useProps<ButtonProps>('Button', null, {}), {
      wrapper: makeWrapper(theme),
    });

    expect(result.current.size).toBe('lg');
    expect(result.current.variant).toBe('filled');
  });

  it('function-form defaultProps is called with theme and result used', () => {
    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      name: 'fn-test-theme',
      components: {
        Button: {
          defaultProps: ((t: ResolvedTheme) => ({
            size: t.name === 'fn-test-theme' ? 'lg' : 'sm',
          })) as any,
        },
      },
    });

    const { result } = renderHook(() => useProps<ButtonProps>('Button', null, {}), {
      wrapper: makeWrapper(theme),
    });

    expect(result.current.size).toBe('lg');
  });

  it('function-form defaultProps receives full theme object', () => {
    const received: ResolvedTheme[] = [];
    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: {
          defaultProps: ((t: ResolvedTheme) => {
            received.push(t);
            return {};
          }) as any,
        },
      },
    });

    renderHook(() => useProps<ButtonProps>('Button', null, {}), { wrapper: makeWrapper(theme) });

    expect(received.length).toBe(1);
    expect(received[0]).toHaveProperty('tokens');
    expect(received[0]).toHaveProperty('components');
  });

  it('function-form defaultProps result is a plain object used as defaults', () => {
    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: {
          defaultProps: ((_t: ResolvedTheme) => ({
            size: 'md',
            variant: 'outline',
            loading: false,
          })) as any,
        },
      },
    });

    const { result } = renderHook(() => useProps<ButtonProps>('Button', null, {}), {
      wrapper: makeWrapper(theme),
    });

    expect(result.current.size).toBe('md');
    expect(result.current.variant).toBe('outline');
    expect(result.current.loading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// UP-02: Merge order — defaults < theme defaults < filtered instance
// ---------------------------------------------------------------------------

describe('UP-02: merge order', () => {
  it('component defaults are lowest priority', () => {
    const { result } = renderHook(
      () => useProps<ButtonProps>('Button', { size: 'sm', variant: 'filled' }, { size: 'lg' }),
      { wrapper: makeWrapper() },
    );

    // instance overrides component default
    expect(result.current.size).toBe('lg');
    // component default used when instance doesn't provide
    expect(result.current.variant).toBe('filled');
  });

  it('theme defaults override component defaults', () => {
    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: { defaultProps: { size: 'lg' } },
      },
    });

    const { result } = renderHook(() => useProps<ButtonProps>('Button', { size: 'sm' }, {}), {
      wrapper: makeWrapper(theme),
    });

    // theme default overrides component default
    expect(result.current.size).toBe('lg');
  });

  it('instance props are highest priority', () => {
    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: { defaultProps: { size: 'lg', variant: 'outline' } },
      },
    });

    const { result } = renderHook(
      () =>
        useProps<ButtonProps>(
          'Button',
          { size: 'sm', variant: 'filled' },
          { size: 'md', variant: 'subtle' },
        ),
      { wrapper: makeWrapper(theme) },
    );

    expect(result.current.size).toBe('md');
    expect(result.current.variant).toBe('subtle');
  });

  it('full three-level precedence: component < theme < instance', () => {
    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: { defaultProps: { size: 'lg', color: 'from-theme' } },
      },
    });

    const { result } = renderHook(
      () =>
        useProps<ButtonProps>(
          'Button',
          { size: 'sm', variant: 'filled', color: 'from-defaults' },
          { variant: 'outline', color: 'from-instance' },
        ),
      { wrapper: makeWrapper(theme) },
    );

    // component default (lowest): size='sm' → overridden by theme
    // theme default: size='lg' → NOT overridden by instance (instance doesn't provide size)
    expect(result.current.size).toBe('lg');
    // component default: variant='filled' → overridden by instance
    expect(result.current.variant).toBe('outline');
    // component default: color='from-defaults' → overridden by theme → overridden by instance
    expect(result.current.color).toBe('from-instance');
  });
});

// ---------------------------------------------------------------------------
// UP-03: filterProps — undefined stripped from instance props
// ---------------------------------------------------------------------------

describe('UP-03: filterProps — undefined from instance props', () => {
  it('instance prop with undefined does NOT override default', () => {
    const { result } = renderHook(
      () => useProps<ButtonProps>('Button', { size: 'md' }, { size: undefined as any }),
      { wrapper: makeWrapper() },
    );

    expect(result.current.size).toBe('md');
  });

  it('instance prop with undefined does NOT override theme default', () => {
    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: { defaultProps: { size: 'lg' } },
      },
    });

    const { result } = renderHook(
      () => useProps<ButtonProps>('Button', null, { size: undefined as any }),
      { wrapper: makeWrapper(theme) },
    );

    expect(result.current.size).toBe('lg');
  });

  it('instance prop with false is NOT filtered (falsy but not undefined)', () => {
    const { result } = renderHook(
      () => useProps<ButtonProps>('Button', { loading: true }, { loading: false }),
      { wrapper: makeWrapper() },
    );

    expect(result.current.loading).toBe(false);
  });

  it('instance prop with empty string is NOT filtered', () => {
    const { result } = renderHook(
      () => useProps<ButtonProps>('Button', { color: 'blue' }, { color: '' }),
      { wrapper: makeWrapper() },
    );

    expect(result.current.color).toBe('');
  });

  it('instance prop with 0 is NOT filtered', () => {
    interface NumProps {
      count?: number;
    }

    const { result } = renderHook(() => useProps<NumProps>('Widget', { count: 5 }, { count: 0 }), {
      wrapper: makeWrapper(),
    });

    expect(result.current.count).toBe(0);
  });

  it('instance prop with null is NOT filtered (only undefined is filtered)', () => {
    interface NullableProps {
      color?: string | null;
    }

    const { result } = renderHook(
      () => useProps<NullableProps>('Widget', { color: 'blue' }, { color: null }),
      { wrapper: makeWrapper() },
    );

    expect(result.current.color).toBeNull();
  });

  it('multiple undefined instance props all fall back to defaults', () => {
    const { result } = renderHook(
      () =>
        useProps<ButtonProps>(
          'Button',
          { size: 'md', variant: 'filled', loading: false },
          { size: undefined as any, variant: undefined as any, loading: undefined as any },
        ),
      { wrapper: makeWrapper() },
    );

    expect(result.current.size).toBe('md');
    expect(result.current.variant).toBe('filled');
    expect(result.current.loading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// UP-04 / UP-05: no theme component entry → graceful fallback
// ---------------------------------------------------------------------------

describe('UP-04 / UP-05: no theme component entry', () => {
  it('when no theme component exists, only defaults and instance props apply', () => {
    const { result } = renderHook(
      () =>
        useProps<ButtonProps>(
          'NonExistentComponent',
          { size: 'md', variant: 'filled' },
          { loading: true },
        ),
      { wrapper: makeWrapper() },
    );

    expect(result.current.size).toBe('md');
    expect(result.current.variant).toBe('filled');
    expect(result.current.loading).toBe(true);
  });

  it('component lookup is by exact name', () => {
    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: { defaultProps: { size: 'lg' } },
      },
    });

    const { result } = renderHook(() => useProps<ButtonProps>('Btn', null, {}), {
      wrapper: makeWrapper(theme),
    });

    // 'Btn' != 'Button', so no theme defaults
    expect(result.current.size).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// UP-06: defaults=null treated as empty
// ---------------------------------------------------------------------------

describe('UP-06: defaults=null', () => {
  it('null defaults treated as no defaults', () => {
    const { result } = renderHook(() => useProps<ButtonProps>('Button', null, { size: 'lg' }), {
      wrapper: makeWrapper(),
    });

    expect(result.current.size).toBe('lg');
  });

  it('null defaults + theme defaults: theme defaults still apply', () => {
    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: { defaultProps: { variant: 'outline' } },
      },
    });

    const { result } = renderHook(() => useProps<ButtonProps>('Button', null, {}), {
      wrapper: makeWrapper(theme),
    });

    expect(result.current.variant).toBe('outline');
  });
});

// ---------------------------------------------------------------------------
// UP-07: empty instance props
// ---------------------------------------------------------------------------

describe('UP-07: empty instance props', () => {
  it('empty instance {} results in only defaults', () => {
    const { result } = renderHook(
      () => useProps<ButtonProps>('Button', { size: 'sm', variant: 'filled' }, {}),
      { wrapper: makeWrapper() },
    );

    expect(result.current.size).toBe('sm');
    expect(result.current.variant).toBe('filled');
  });
});

// ---------------------------------------------------------------------------
// UP-08: falsy values preserved
// ---------------------------------------------------------------------------

describe('UP-08: falsy value preservation', () => {
  it('instance false overrides default true', () => {
    const { result } = renderHook(
      () =>
        useProps<ButtonProps>(
          'Button',
          { loading: true, disabled: true },
          { loading: false, disabled: false },
        ),
      { wrapper: makeWrapper() },
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.disabled).toBe(false);
  });

  it('instance false overrides theme default true', () => {
    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: { defaultProps: { loading: true } },
      },
    });

    const { result } = renderHook(() => useProps<ButtonProps>('Button', null, { loading: false }), {
      wrapper: makeWrapper(theme),
    });

    expect(result.current.loading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// All three sources together
// ---------------------------------------------------------------------------

describe('all three prop sources', () => {
  it('returns union of all sources when no conflicts', () => {
    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      components: {
        Button: { defaultProps: { color: 'blue' } },
      },
    });

    const { result } = renderHook(
      () => useProps<ButtonProps>('Button', { size: 'md' }, { variant: 'outline' }),
      { wrapper: makeWrapper(theme) },
    );

    expect(result.current.size).toBe('md');
    expect(result.current.color).toBe('blue');
    expect(result.current.variant).toBe('outline');
  });

  it('extra instance keys not in defaults pass through', () => {
    const { result } = renderHook(
      () => useProps<ButtonProps>('Button', { size: 'md' }, { variant: 'filled', loading: true }),
      { wrapper: makeWrapper() },
    );

    expect(result.current.size).toBe('md');
    expect(result.current.variant).toBe('filled');
    expect(result.current.loading).toBe(true);
  });
});
