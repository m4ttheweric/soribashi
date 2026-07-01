import { SoribashiProvider } from '@soribashi/factory';
import { createTheme } from '@soribashi/theme';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Box } from '../src/Box/Box.tsx';

const theme = createTheme({
  tokens: {
    colors: {
      primary: { '500': 'hsl(217 91% 60%)' },
      neutral: { '0': '#fff', '100': '#eee' },
    },
    radius: { md: '0.5rem' },
    spacing: { sm: '0.5rem', md: '0.75rem', lg: '1rem', xl: '1.5rem' },
    fontSize: { md: '1rem', lg: '1.125rem' },
    breakpoint: { xs: '24rem', sm: '40rem', md: '48rem', lg: '64rem', xl: '80rem' },
  },
});

const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);

describe('Box — basics', () => {
  it('renders div by default', () => {
    const { container } = wrap(<Box>X</Box>);
    expect(container.firstChild?.nodeName).toBe('DIV');
  });

  it('respects as prop for polymorphism', () => {
    const { container } = wrap(<Box as="section">X</Box>);
    expect(container.firstChild?.nodeName).toBe('SECTION');
  });

  it('forwards arbitrary HTML attributes (id, data-foo)', () => {
    const { container } = wrap(
      <Box id="my-id" data-foo="bar">
        X
      </Box>,
    );
    const el = container.querySelector('#my-id') as HTMLElement;
    expect(el).toBeInTheDocument();
    expect(el.getAttribute('data-foo')).toBe('bar');
  });

  it('applies sb-Box-root class', () => {
    const { container } = wrap(<Box>X</Box>);
    expect((container.querySelector('div') as HTMLElement).className).toContain('sb-Box-root');
  });
});

describe('Box — style props', () => {
  it('p="md" produces inline padding with var() reference', () => {
    const { container } = wrap(<Box p="md">X</Box>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.padding).toBe('var(--spacing-md)');
  });

  it('mt={16} produces inline marginTop in rem', () => {
    const { container } = wrap(<Box mt={16}>X</Box>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.marginTop).toBe('1rem');
  });

  it('mx="md" uses the marginInline logical shorthand', () => {
    const { container } = wrap(<Box mx="md">X</Box>);
    const el = container.querySelector('div') as HTMLElement;
    // Mantine parity: mx → marginInline (logical shorthand, not separate start/end)
    expect(el.style.marginInline).toBe('var(--spacing-md)');
  });

  it('bg accepts theme color refs', () => {
    const { container } = wrap(<Box bg="primary.500">X</Box>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.background).toBe('var(--color-primary-500)');
  });

  it('bg accepts surface refs', () => {
    const { container } = wrap(<Box bg="surface.raised">X</Box>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.background).toBe('var(--surface-raised)');
  });

  it('bdrs="md" maps to borderRadius', () => {
    const { container } = wrap(<Box bdrs="md">X</Box>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.borderRadius).toBe('var(--radius-md)');
  });

  it('w and h support number → rem', () => {
    const { container } = wrap(
      <Box w={200} h={100}>
        X
      </Box>,
    );
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.width).toBe('12.5rem');
    expect(el.style.height).toBe('6.25rem');
  });

  it('non-style props pass through unchanged', () => {
    const { container } = wrap(
      <Box p="md" id="x" role="region" aria-label="hi">
        X
      </Box>,
    );
    const el = container.querySelector('div') as HTMLElement;
    expect(el.id).toBe('x');
    expect(el.getAttribute('role')).toBe('region');
    expect(el.getAttribute('aria-label')).toBe('hi');
  });
});

describe('Box — responsive style props', () => {
  it('responsive p emits an InlineStyles sibling with media queries', () => {
    const { container } = wrap(<Box p={{ base: 'sm', md: 'lg' }}>X</Box>);
    const styleEl = container.querySelector('style');
    expect(styleEl).toBeInTheDocument();
    const text = styleEl?.textContent ?? '';
    expect(text).toContain('@media (min-width: 48rem)');
    expect(text).toContain('padding: var(--spacing-lg)');
  });

  it('responsive base applies as base styles in the InlineStyles block', () => {
    const { container } = wrap(<Box p={{ base: 'sm', md: 'lg' }}>X</Box>);
    const text = container.querySelector('style')?.textContent ?? '';
    expect(text).toContain('padding: var(--spacing-sm)');
  });

  it('multiple responsive props share one InlineStyles block', () => {
    const { container } = wrap(
      <Box p={{ base: 'sm', md: 'lg' }} bg={{ base: 'surface.default', md: 'surface.raised' }}>
        X
      </Box>,
    );
    const styles = container.querySelectorAll('style');
    expect(styles.length).toBe(1);
  });

  it('responsive className is appended alongside the static class', () => {
    const { container } = wrap(<Box p={{ base: 'sm', md: 'lg' }}>X</Box>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.className).toContain('sb-Box-root');
    expect(el.className).toMatch(/sb-/);
  });
});

describe('Box — mod API', () => {
  it('mod object → data-* attributes', () => {
    const { container } = wrap(<Box mod={{ active: true, loading: false }}>X</Box>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.dataset.active).toBe('true');
    expect(el.dataset.loading).toBeUndefined();
  });

  it('mod string → data-{key}: true', () => {
    const { container } = wrap(<Box mod="open">X</Box>);
    expect((container.querySelector('div') as HTMLElement).dataset.open).toBe('true');
  });

  it('mod array merges entries', () => {
    const { container } = wrap(<Box mod={[{ active: true }, 'open', { size: 'lg' }]}>X</Box>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.dataset.active).toBe('true');
    expect(el.dataset.open).toBe('true');
    expect(el.dataset.size).toBe('lg');
  });

  it('variant prop becomes data-variant', () => {
    const { container } = wrap(<Box variant="filled">X</Box>);
    expect((container.querySelector('div') as HTMLElement).dataset.variant).toBe('filled');
  });
});
