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

describe('SimpleGrid — prop renames (finding #8)', () => {
  // --- minColWidth (was minColumnWidth) ---
  it('minColWidth sets --sg-min-col-width CSS var', () => {
    const { container } = wrap(<SimpleGrid minColWidth="200px">X</SimpleGrid>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.getPropertyValue('--sg-min-col-width')).toBe('200px');
  });

  it('minColWidth with number converts to rem', () => {
    const { container } = wrap(<SimpleGrid minColWidth={200}>X</SimpleGrid>);
    const el = container.querySelector('div') as HTMLElement;
    // 200px → should produce a rem value via rem()
    expect(el.style.getPropertyValue('--sg-min-col-width')).toMatch(/rem$/);
  });

  it('deprecated minColumnWidth still applies the value (backward-compat shim)', () => {
    // minColumnWidth is kept as a deprecated alias until all call sites migrate.
    const { container } = wrap(
      <SimpleGrid minColumnWidth="300px">X</SimpleGrid>,
    );
    const el = container.querySelector('div') as HTMLElement;
    // Deprecated compat: the passed value is applied via the legacy shim
    expect(el.style.getPropertyValue('--sg-min-col-width')).toBe('300px');
  });

  // --- autoFlow (was autoCols) ---
  it('autoFlow=auto-fill sets data-auto-cols="auto-fill"', () => {
    const { container } = wrap(
      <SimpleGrid autoFlow="auto-fill" minColWidth="200px">
        X
      </SimpleGrid>,
    );
    const el = container.querySelector('div') as HTMLElement;
    expect(el.dataset.autoCols).toBe('auto-fill');
  });

  it('autoFlow=auto-fit sets data-auto-cols="auto-fit"', () => {
    const { container } = wrap(
      <SimpleGrid autoFlow="auto-fit" minColWidth="200px">
        X
      </SimpleGrid>,
    );
    const el = container.querySelector('div') as HTMLElement;
    expect(el.dataset.autoCols).toBe('auto-fit');
  });

  it('deprecated autoCols alone (without minColWidth) does NOT set data-auto-cols', () => {
    const { container } = wrap(
      <SimpleGrid autoCols="auto-fill">X</SimpleGrid>,
    );
    const el = container.querySelector('div') as HTMLElement;
    // Without minColWidth, the grid stays in fixed-column mode — no data-auto-cols
    expect(el.dataset.autoCols).toBeUndefined();
  });

  // --- type='media' (was 'simple') ---
  it('type prop accepts "media" without error', () => {
    expect(() =>
      wrap(<SimpleGrid type="media">X</SimpleGrid>),
    ).not.toThrow();
  });

  it('type prop accepts "container" without error', () => {
    expect(() =>
      wrap(<SimpleGrid type="container">X</SimpleGrid>),
    ).not.toThrow();
  });

  it('old type="simple" is NOT a valid type (ts-expect-error guard)', () => {
    expect(() =>
      // @ts-expect-error — 'simple' is no longer a valid literal
      wrap(<SimpleGrid type="simple">X</SimpleGrid>),
    ).not.toThrow(); // runtime still renders; only the TS type check matters
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
    expect(el.dataset.autoCols).toBe('auto-fill');
  });
});
