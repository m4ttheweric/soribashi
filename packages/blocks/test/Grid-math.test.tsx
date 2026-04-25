/**
 * Tests for Grid column math helpers and API parity with Mantine.
 * Covers: finding #1 (column math, parameterized columns, grow prop)
 *         finding #8 (alignSelf → align rename)
 */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
import { SoribashiProvider } from '@soribashi/factory';
import { Grid } from '../src/index.ts';

const theme = createTheme({
  tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
});

const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);

// ---------------------------------------------------------------------------
// #1 — Column math
// ---------------------------------------------------------------------------

describe('Grid column math — 12-col grid', () => {
  it('span=6 in 12-col grid → flex-basis 50% with gap factor', () => {
    const { container } = wrap(
      <Grid columns={12}>
        <Grid.Col span={6}>X</Grid.Col>
      </Grid>,
    );
    const col = container.querySelector('.sb-Grid-col') as HTMLElement;
    const flexBasis = col.style.getPropertyValue('--col-flex-basis');
    // Should be calc(50% - 0.5 * var(--grid-column-gap))
    expect(flexBasis).toContain('50%');
    expect(flexBasis).toContain('var(--grid-column-gap)');
    // Should NOT be just a bare percentage (old broken math omitted gap term)
    expect(flexBasis).toContain('calc(');
  });

  it('span=6 in 12-col grid → max-width contains gap factor 0.5', () => {
    const { container } = wrap(
      <Grid columns={12}>
        <Grid.Col span={6}>X</Grid.Col>
      </Grid>,
    );
    const col = container.querySelector('.sb-Grid-col') as HTMLElement;
    const maxWidth = col.style.getPropertyValue('--col-max-width');
    expect(maxWidth).toContain('50%');
    expect(maxWidth).toContain('var(--grid-column-gap)');
    expect(maxWidth).toContain('calc(');
  });

  it('span=12 in 12-col grid → flex-basis 100% (no calc needed)', () => {
    const { container } = wrap(
      <Grid columns={12}>
        <Grid.Col span={12}>X</Grid.Col>
      </Grid>,
    );
    const col = container.querySelector('.sb-Grid-col') as HTMLElement;
    const flexBasis = col.style.getPropertyValue('--col-flex-basis');
    expect(flexBasis).toBe('100%');
  });
});

describe('Grid column math — 6-col grid', () => {
  it('span=3 in 6-col grid → flex-basis 50% (not 25%)', () => {
    const { container } = wrap(
      <Grid columns={6}>
        <Grid.Col span={3}>X</Grid.Col>
      </Grid>,
    );
    const col = container.querySelector('.sb-Grid-col') as HTMLElement;
    const flexBasis = col.style.getPropertyValue('--col-flex-basis');
    // 3/6 = 50%
    expect(flexBasis).toContain('50%');
    // Must NOT contain 25%
    expect(flexBasis).not.toContain('25%');
  });

  it('span=2 in 6-col grid → flex-basis 33.333...%', () => {
    const { container } = wrap(
      <Grid columns={6}>
        <Grid.Col span={2}>X</Grid.Col>
      </Grid>,
    );
    const col = container.querySelector('.sb-Grid-col') as HTMLElement;
    const flexBasis = col.style.getPropertyValue('--col-flex-basis');
    expect(flexBasis).toContain('33.333');
  });
});

describe('Grid column math — offset', () => {
  it('offset=2 in 12-col grid includes gap factor in calc', () => {
    const { container } = wrap(
      <Grid columns={12}>
        <Grid.Col span={6} offset={2}>X</Grid.Col>
      </Grid>,
    );
    const col = container.querySelector('.sb-Grid-col') as HTMLElement;
    const offset = col.style.getPropertyValue('--col-offset');
    // Should be calc(16.666...% + 0.1666... * var(--grid-column-gap))
    expect(offset).toContain('var(--grid-column-gap)');
    expect(offset).toContain('calc(');
    expect(offset).toContain('%');
    // Should use + (not just bare percentage)
    expect(offset).toContain('+');
  });

  it('offset=0 → "0"', () => {
    const { container } = wrap(
      <Grid columns={12}>
        <Grid.Col span={6} offset={0}>X</Grid.Col>
      </Grid>,
    );
    const col = container.querySelector('.sb-Grid-col') as HTMLElement;
    const offset = col.style.getPropertyValue('--col-offset');
    expect(offset).toBe('0');
  });
});

describe('Grid column math — auto span', () => {
  it('span="auto" sets flex-grow=1', () => {
    const { container } = wrap(
      <Grid>
        <Grid.Col span="auto">X</Grid.Col>
      </Grid>,
    );
    const col = container.querySelector('.sb-Grid-col') as HTMLElement;
    expect(col.style.getPropertyValue('--col-flex-grow')).toBe('1');
  });

  it('span="auto" does NOT set flex-basis to 100% (must be 0rem for auto layout)', () => {
    const { container } = wrap(
      <Grid>
        <Grid.Col span="auto">X</Grid.Col>
      </Grid>,
    );
    const col = container.querySelector('.sb-Grid-col') as HTMLElement;
    const flexBasis = col.style.getPropertyValue('--col-flex-basis');
    // Mantine uses '0rem' for auto span flex-basis
    expect(flexBasis).toBe('0rem');
  });

  it('span="auto" max-width is 100%', () => {
    const { container } = wrap(
      <Grid>
        <Grid.Col span="auto">X</Grid.Col>
      </Grid>,
    );
    const col = container.querySelector('.sb-Grid-col') as HTMLElement;
    const maxWidth = col.style.getPropertyValue('--col-max-width');
    expect(maxWidth).toBe('100%');
  });
});

describe('Grid column math — content span', () => {
  it('span="content" → flex-basis auto, max-width unset, width auto', () => {
    const { container } = wrap(
      <Grid>
        <Grid.Col span="content">X</Grid.Col>
      </Grid>,
    );
    const col = container.querySelector('.sb-Grid-col') as HTMLElement;
    expect(col.style.getPropertyValue('--col-flex-basis')).toBe('auto');
    expect(col.style.getPropertyValue('--col-max-width')).toBe('unset');
    expect(col.style.getPropertyValue('--col-width')).toBe('auto');
  });
});

// ---------------------------------------------------------------------------
// #1 — grow prop on Grid
// ---------------------------------------------------------------------------

describe('Grid grow prop', () => {
  it('grow prop is accepted without error', () => {
    expect(() =>
      wrap(
        <Grid grow>
          <Grid.Col span={4}>A</Grid.Col>
          <Grid.Col span={4}>B</Grid.Col>
        </Grid>,
      ),
    ).not.toThrow();
  });

  it('grow=true makes col max-width 100% (allows filling incomplete row)', () => {
    const { container } = wrap(
      <Grid grow>
        <Grid.Col span={4}>A</Grid.Col>
      </Grid>,
    );
    const col = container.querySelector('.sb-Grid-col') as HTMLElement;
    const maxWidth = col.style.getPropertyValue('--col-max-width');
    expect(maxWidth).toBe('100%');
  });

  it('grow=true makes col flex-grow 1', () => {
    const { container } = wrap(
      <Grid grow>
        <Grid.Col span={4}>A</Grid.Col>
      </Grid>,
    );
    const col = container.querySelector('.sb-Grid-col') as HTMLElement;
    expect(col.style.getPropertyValue('--col-flex-grow')).toBe('1');
  });
});

// ---------------------------------------------------------------------------
// #8 — align prop on Grid.Col (renamed from alignSelf)
// ---------------------------------------------------------------------------

describe('Grid.Col align prop', () => {
  it('align prop maps to --col-align-self CSS var', () => {
    const { container } = wrap(
      <Grid.Col span={6} align="center">X</Grid.Col>,
    );
    const col = container.querySelector('.sb-Grid-col') as HTMLElement;
    expect(col.style.getPropertyValue('--col-align-self')).toBe('center');
  });

  it('align="flex-start" maps correctly', () => {
    const { container } = wrap(
      <Grid.Col span={6} align="flex-start">X</Grid.Col>,
    );
    const col = container.querySelector('.sb-Grid-col') as HTMLElement;
    expect(col.style.getPropertyValue('--col-align-self')).toBe('flex-start');
  });

  it('align="end" on col renders correctly', () => {
    const { container } = wrap(
      <Grid.Col align="end">X</Grid.Col>,
    );
    const col = container.querySelector('.sb-Grid-col') as HTMLElement;
    expect(col.style.getPropertyValue('--col-align-self')).toBe('end');
  });
});
