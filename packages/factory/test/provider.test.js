import { jsx as _jsx } from "react/jsx-runtime";
import { describe, expect, it } from 'vitest';
import { render, renderHook } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
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
            wrapper: ({ children }) => _jsx(SoribashiProvider, { theme: theme, children: children }),
        });
        expect(result.current.name).toBe('test-theme');
        expect(result.current.tokens.colors.primary?.['500']).toBe('#000');
    });
    it('useTheme returns default theme outside provider', () => {
        const { result } = renderHook(() => useTheme());
        expect(result.current.name).toBe('default');
    });
    it('renders children', () => {
        const { getByText } = render(_jsx(SoribashiProvider, { theme: theme, children: _jsx("div", { children: "hello" }) }));
        expect(getByText('hello')).toBeInTheDocument();
    });
    it('nested provider replaces theme', () => {
        const inner = createTheme({
            tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
            name: 'inner',
        });
        const { result } = renderHook(() => useTheme(), {
            wrapper: ({ children }) => (_jsx(SoribashiProvider, { theme: theme, children: _jsx(SoribashiProvider, { theme: inner, children: children }) })),
        });
        expect(result.current.name).toBe('inner');
    });
});
//# sourceMappingURL=provider.test.js.map