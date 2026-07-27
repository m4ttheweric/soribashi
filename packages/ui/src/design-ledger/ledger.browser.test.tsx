import { SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { Switch } from '../recipes/Switch/Switch.tsx';
import { uiTheme } from '../theme.ts';
import { centeringGaps, isCentered } from './measure.ts';

const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={uiTheme}>{ui}</SoribashiProvider>);

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

describe('design ledger: measured rows', () => {
  it('switch.thumb.centered', async () => {
    for (const size of SIZES) {
      const screen = await wrap(<Switch size={size} />);
      const control = screen.container.querySelector('[class*="control"]');
      const thumb = screen.container.querySelector('[class*="thumb"]');
      expect(control, `${size}: control`).not.toBeNull();
      expect(thumb, `${size}: thumb`).not.toBeNull();

      const gaps = centeringGaps(control!, thumb!);
      const verdict = isCentered(gaps, window.devicePixelRatio, 'block');
      expect(
        verdict.symmetric,
        `${size}: thumb gaps not symmetric: top ${gaps.top} vs bottom ${gaps.bottom}`,
      ).toBe(true);
      expect(
        verdict.wholePixel,
        `${size}: thumb gaps not on whole pixels: ${JSON.stringify(gaps)}`,
      ).toBe(true);
    }
  });
});
