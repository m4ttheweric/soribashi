import { createTheme } from '@soribashi/theme';
import { render, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SoribashiProvider } from '../src/provider/provider.tsx';
import { useTheme } from '../src/provider/use-theme.ts';

const theme = createTheme({
  tokens: {
    colors: { primary: { '500': '#000' } },
    radius: { md: '0.5rem' },
    spacing: { md: '0.5rem' },
    fontSize: { md: '1rem' },
  },
  name: 'test-theme',
});

describe('SoribashiProvider', () => {
  it('provides the theme via useTheme', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <SoribashiProvider theme={theme}>{children}</SoribashiProvider>,
    });

    expect(result.current.name).toBe('test-theme');
    expect(result.current.tokens.colors.primary?.['500']).toBe('#000');
  });

  it('useTheme returns default theme outside provider', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.name).toBe('default');
  });

  it('renders children', () => {
    const { getByText } = render(
      <SoribashiProvider theme={theme}>
        <div>hello</div>
      </SoribashiProvider>,
    );
    expect(getByText('hello')).toBeInTheDocument();
  });

  it('nested provider replaces theme', () => {
    const inner = createTheme({
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      name: 'inner',
    });

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <SoribashiProvider theme={theme}>
          <SoribashiProvider theme={inner}>{children}</SoribashiProvider>
        </SoribashiProvider>
      ),
    });

    expect(result.current.name).toBe('inner');
  });
});
