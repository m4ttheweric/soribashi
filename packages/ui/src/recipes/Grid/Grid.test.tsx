import { createTheme, SoribashiProvider } from '@soribashi/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { Grid, resolveGridCols } from './Grid.tsx';

// The tester iframe's default viewport (measured empirically the same way
// Button.visual.test.tsx's comment describes): 414x896, narrower than the
// md breakpoint's 48rem/768px. The wide-viewport test below restores this
// afterward so later tests in this file render at the same default other
// suites assume.
const DEFAULT_VIEWPORT = [414, 896] as const;

// `render` from vitest-browser-react resolves a Promise<RenderResult> (see
// Button.test.tsx's identical note); `wrap` awaits it so callers get the
// real result object.
const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={uiTheme}>{ui}</SoribashiProvider>);

afterEach(() => {
  vi.restoreAllMocks();
});

describe('resolveGridCols', () => {
  it('a static number resolves to that base with no media entries', () => {
    expect(resolveGridCols(3, uiTheme)).toEqual({ base: 3, media: [] });
  });

  it('a responsive object resolves base plus ascending-sorted media entries', () => {
    expect(resolveGridCols({ base: 1, md: 2, xl: 4 }, uiTheme)).toEqual({
      base: 1,
      media: [
        { query: '(min-width: 48rem)', cols: 2 },
        { query: '(min-width: 80rem)', cols: 4 },
      ],
    });
  });

  it('a known key with no themed breakpoint value falls back to defaultTokens with a one-time warn', () => {
    // createTheme backfills an empty breakpoint map to defaultTokens'
    // (create-theme.ts's withBreakpointFallback), so the missing-value
    // fallback path must be exercised by stripping breakpoint back off the
    // already-resolved theme. Mirrors the semantics the deleted
    // packages/blocks/test/Box/responsive-breakpoint-fallback.test.tsx
    // pinned before @soribashi/blocks was removed from the repo.
    const resolved = createTheme({ tokens: { ...uiTheme.tokens, breakpoint: {} } });
    const { breakpoint: _backfilled, ...tokens } = resolved.tokens;
    const themeWithoutBreakpoints = { ...resolved, tokens };

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const first = resolveGridCols({ base: 1, md: 2 }, themeWithoutBreakpoints);
    const second = resolveGridCols({ base: 1, md: 3 }, themeWithoutBreakpoints);

    expect(first).toEqual({ base: 1, media: [{ query: '(min-width: 48rem)', cols: 2 }] });
    expect(second).toEqual({ base: 1, media: [{ query: '(min-width: 48rem)', cols: 3 }] });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.join(' ')).toContain('md');
  });

  it('an unrecognised breakpoint key is skipped with a warn while other entries still resolve', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = resolveGridCols({ base: 1, md: 2, potato: 9 }, uiTheme);

    expect(result).toEqual({ base: 1, media: [{ query: '(min-width: 48rem)', cols: 2 }] });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.join(' ')).toContain('potato');
  });
});

describe('Grid (browser)', () => {
  it('cols={3} computes a three-column grid', async () => {
    const screen = await wrap(
      <Grid data-testid="grid" cols={3}>
        <div>a</div>
        <div>b</div>
        <div>c</div>
      </Grid>,
    );
    const el = screen.getByTestId('grid').element();
    const cs = getComputedStyle(el);
    expect(cs.display).toBe('grid');
    const trackCount = cs.gridTemplateColumns.split(' ').filter(Boolean).length;
    expect(trackCount).toBe(3);
  });

  it('default gap computes to 12px (--spacing-md) on both axes', async () => {
    const screen = await wrap(
      <Grid data-testid="grid">
        <div>a</div>
      </Grid>,
    );
    const el = screen.getByTestId('grid').element();
    const cs = getComputedStyle(el);
    expect(cs.columnGap).toBe('12px');
    expect(cs.rowGap).toBe('12px');
  });

  it('a responsive cols object injects a scoped style block and appends its class to root', async () => {
    const screen = await wrap(
      <Grid data-testid="grid" cols={{ base: 1, md: 2, xl: 4 }}>
        <div>a</div>
      </Grid>,
    );
    const styleEl = screen.container.querySelector('style');
    const styleText = styleEl?.textContent ?? '';
    expect(styleText).toContain('(min-width: 48rem)');
    expect(styleText).toContain('(min-width: 80rem)');
    expect(styleText).toContain('--sb-grid-cols: 2');
    expect(styleText).toContain('--sb-grid-cols: 4');

    const el = screen.getByTestId('grid').element();
    // At the default (narrow, 414px) viewport neither media query matches,
    // so the class rule's base declaration applies unchanged. The dedicated
    // wide-viewport test below proves a media query actually overriding it.
    expect(getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length).toBe(1);
    // The injected per-instance class rides alongside the built-in root class.
    expect(el.className.split(' ').some((c: string) => c.startsWith('sb-'))).toBe(true);
  });

  it('a responsive cols object resolves the matching media override at a wide viewport', async () => {
    // Regression coverage for the inline-vs-class-rule bug: `vars` used to
    // set --sb-grid-cols inline regardless of responsiveness, and an inline
    // declaration beats any non-!important stylesheet rule, so the media
    // overrides below never actually took effect at any viewport width.
    const screen = await wrap(
      <Grid data-testid="grid" cols={{ base: 1, md: 2 }}>
        <div>a</div>
      </Grid>,
    );
    const el = screen.getByTestId('grid').element();
    const trackCount = () =>
      getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length;

    // Default (narrow) viewport: below the md breakpoint, base applies.
    expect(trackCount()).toBe(1);

    // 900px is above the md breakpoint's 48rem/768px, so the media override
    // must now take effect.
    await page.viewport(900, 600);
    expect(trackCount()).toBe(2);

    // Restore the default viewport so later tests in this file aren't
    // affected by this test's resize.
    await page.viewport(...DEFAULT_VIEWPORT);
  });

  it('minChildWidth produces auto-fit behaviour: two children sit side by side at a wide width', async () => {
    const screen = await wrap(
      <Grid data-testid="grid" minChildWidth="100px" style={{ width: '400px' }}>
        <div data-testid="a">a</div>
        <div data-testid="b">b</div>
      </Grid>,
    );
    const grid = screen.getByTestId('grid').element();
    expect(grid.getAttribute('data-min-child')).toBe('true');
    const aTop = screen.getByTestId('a').element().getBoundingClientRect().top;
    const bTop = screen.getByTestId('b').element().getBoundingClientRect().top;
    expect(aTop).toBe(bTop);
  });

  it('both cols and minChildWidth: minChildWidth wins and a dev console.error fires once', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const screen = await wrap(
      <Grid data-testid="grid" cols={3} minChildWidth="100px">
        <div>a</div>
        <div>b</div>
      </Grid>,
    );
    const el = screen.getByTestId('grid').element();
    expect(el.getAttribute('data-min-child')).toBe('true');
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0]?.join(' ')).toContain('minChildWidth');
  });

  it('extend threads defaultProps (invariant 1 stays load-bearing)', async () => {
    const extendedTheme = createTheme({
      extends: uiTheme,
      components: [Grid.extend({ defaultProps: { spacing: 'xl' } })],
    });
    const screen = await render(
      <SoribashiProvider theme={extendedTheme}>
        <Grid data-testid="grid">
          <div>a</div>
        </Grid>
      </SoribashiProvider>,
    );
    const el = screen.getByTestId('grid').element();
    expect(getComputedStyle(el).columnGap).toBe('24px');
  });
});
