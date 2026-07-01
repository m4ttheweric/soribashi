import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
import { SoribashiProvider } from '@soribashi/factory';
import { Box } from '../../src/Box/Box.tsx';

const resolved = createTheme({
  tokens: {
    colors: {},
    radius: {},
    spacing: { sm: '0.5rem', md: '0.75rem', lg: '1rem' },
    fontSize: {},
  },
});
// createTheme backfills default breakpoints; strip them so the runtime
// fallback path is still exercised.
const { breakpoint: _backfilled, ...tokens } = resolved.tokens;
const themeWithoutBreakpoints = { ...resolved, tokens };

const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={themeWithoutBreakpoints}>{ui}</SoribashiProvider>);

afterEach(() => {
  vi.restoreAllMocks();
});

describe('responsive style props without theme breakpoint tokens', () => {
  it('falls back to the default breakpoint map with distinct min-widths', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = wrap(
      <Box p={{ base: 'sm', sm: 'md', md: 'lg' }}>X</Box>,
    );
    const text = container.querySelector('style')?.textContent ?? '';
    expect(text).toContain('@media (min-width: 40rem)');
    expect(text).toContain('@media (min-width: 48rem)');
    expect(text).not.toContain('(min-width: 0)');
    expect(warn).toHaveBeenCalled();
    expect(warn.mock.calls.flat().join(' ')).toContain('md');
  });

  it('warns only once per missing breakpoint token', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    wrap(<Box p={{ base: 'sm', md: 'lg' }}>X</Box>);
    wrap(<Box m={{ base: 'sm', md: 'lg' }}>X</Box>);
    const mdWarnings = warn.mock.calls.filter((call) =>
      call.join(' ').includes('"md"'),
    );
    expect(mdWarnings.length).toBeLessThanOrEqual(1);
  });
});
