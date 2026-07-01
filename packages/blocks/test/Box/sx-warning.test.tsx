import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
import { SoribashiProvider } from '@soribashi/factory';
import { Box } from '../../src/Box/Box.tsx';

const theme = createTheme({
  tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
});

const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Box sx prop', () => {
  it('warns in dev that sx is not applied, and keeps it off the DOM', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = wrap(<Box sx={{ color: 'red' }}>X</Box>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.getAttribute('sx')).toBeNull();
    expect(el.style.color).toBe('');
    expect(warn).toHaveBeenCalled();
    expect(warn.mock.calls.flat().join(' ')).toContain('sx');
  });
});
