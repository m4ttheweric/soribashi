/**
 * Tests for SimpleGrid — Mantine parity renames + autoRows addition.
 * Covers findings #8 and #14 from the divergence ledger.
 */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
import { SoribashiProvider } from '@soribashi/factory';
import { SimpleGrid } from '../src/index.ts';

const theme = createTheme({
  tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
});

const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);

describe('SimpleGrid — dead type prop removed', () => {
  it('rejects the type prop at compile time until container mode exists', () => {
    const { container } = wrap(
      // @ts-expect-error — type was removed from the public props (container mode unimplemented)
      <SimpleGrid type="container">X</SimpleGrid>,
    );
    expect(container.firstChild).not.toBeNull();
  });

  it('strips a runtime-passed type value so it cannot leak to the DOM', () => {
    const props = { type: 'media' } as Record<string, unknown>;
    const { container } = wrap(<SimpleGrid {...props}>X</SimpleGrid>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.getAttribute('type')).toBeNull();
  });
});

describe('SimpleGrid — prop renames (finding #8)', () => {
  it('minColWidth sets --sg-min-col-width CSS var', () => {
    const { container } = wrap(<SimpleGrid minColWidth="200px">X</SimpleGrid>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.getPropertyValue('--sg-min-col-width')).toBe('200px');
  });

  it('minColWidth with number converts to rem', () => {
    const { container } = wrap(<SimpleGrid minColWidth={200}>X</SimpleGrid>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.getPropertyValue('--sg-min-col-width')).toMatch(/rem$/);
  });

  it('autoFlow=auto-fill sets data-auto-flow="auto-fill"', () => {
    const { container } = wrap(
      <SimpleGrid autoFlow="auto-fill" minColWidth="200px">
        X
      </SimpleGrid>,
    );
    const el = container.querySelector('div') as HTMLElement;
    expect(el.dataset.autoFlow).toBe('auto-fill');
  });

  it('autoFlow=auto-fit sets data-auto-flow="auto-fit"', () => {
    const { container } = wrap(
      <SimpleGrid autoFlow="auto-fit" minColWidth="200px">
        X
      </SimpleGrid>,
    );
    const el = container.querySelector('div') as HTMLElement;
    expect(el.dataset.autoFlow).toBe('auto-fit');
  });

});

describe('SimpleGrid — autoRows prop (finding #8 addition)', () => {
  it('autoRows prop sets --sg-auto-rows CSS var', () => {
    const { container } = wrap(<SimpleGrid autoRows="200px">X</SimpleGrid>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.getPropertyValue('--sg-auto-rows')).toBe('200px');
  });

  it('autoRows with min() syntax passes through as-is', () => {
    const { container } = wrap(
      <SimpleGrid autoRows="min(200px, 1fr)">X</SimpleGrid>,
    );
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.getPropertyValue('--sg-auto-rows')).toBe('min(200px, 1fr)');
  });

  it('when autoRows is not set, --sg-auto-rows is not present', () => {
    const { container } = wrap(<SimpleGrid>X</SimpleGrid>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.getPropertyValue('--sg-auto-rows')).toBe('');
  });
});

describe('SimpleGrid — default cols / spacing (regression guard)', () => {
  it('renders with default cols=1 and --sg-cols CSS var', () => {
    const { container } = wrap(<SimpleGrid>X</SimpleGrid>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.className).toContain('sb-SimpleGrid-root');
    expect(el.style.getPropertyValue('--sg-cols')).toBe('1');
  });

  it('cols prop sets --sg-cols', () => {
    const { container } = wrap(<SimpleGrid cols={4}>X</SimpleGrid>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.getPropertyValue('--sg-cols')).toBe('4');
  });

  it('spacing prop sets --sg-spacing-x and --sg-spacing-y', () => {
    const { container } = wrap(<SimpleGrid spacing="lg">X</SimpleGrid>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.getPropertyValue('--sg-spacing-x')).toBe('var(--spacing-lg)');
    expect(el.style.getPropertyValue('--sg-spacing-y')).toBe('var(--spacing-lg)');
  });

  it('verticalSpacing overrides --sg-spacing-y independently', () => {
    const { container } = wrap(
      <SimpleGrid spacing="md" verticalSpacing="xl">
        X
      </SimpleGrid>,
    );
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.getPropertyValue('--sg-spacing-x')).toBe('var(--spacing-md)');
    expect(el.style.getPropertyValue('--sg-spacing-y')).toBe('var(--spacing-xl)');
  });

  it('when minColWidth is set without autoFlow, defaults to auto-fill', () => {
    const { container } = wrap(<SimpleGrid minColWidth="150px">X</SimpleGrid>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.dataset.autoFlow).toBe('auto-fill');
  });
});
