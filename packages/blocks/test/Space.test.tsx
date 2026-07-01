import { SoribashiProvider } from '@soribashi/factory';
import { createTheme } from '@soribashi/theme';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Space } from '../src/Space/Space.tsx';

const theme = createTheme({
  tokens: { colors: {}, radius: {}, spacing: { md: '0.75rem' }, fontSize: {} },
});

const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);

describe('Space', () => {
  it('forwards className to the rendered element', () => {
    const { container } = wrap(<Space h="md" className="my-space" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('my-space');
  });

  it('forwards style to the rendered element', () => {
    const { container } = wrap(<Space h="md" style={{ outline: '1px solid red' }} />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.outline).toBe('1px solid red');
  });

  it('still applies w/h/miw/mih style props', () => {
    const { container } = wrap(<Space w="md" h={32} className="x" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('var(--spacing-md)');
    expect(el.style.height).toBe('2rem');
    expect(el.style.minWidth).toBe('var(--spacing-md)');
    expect(el.style.minHeight).toBe('2rem');
  });
});
