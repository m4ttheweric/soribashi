import { SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { RadioGroup } from '../recipes/RadioGroup/RadioGroup.tsx';
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

  it('radio.dot.centered', async () => {
    const items = [
      { label: 'One', value: 'one' },
      { label: 'Two', value: 'two' },
    ];
    for (const size of SIZES) {
      const screen = await wrap(<RadioGroup items={items} defaultValue="one" size={size} />);
      const control = screen.container.querySelector('[class*="control"]');
      const dot = screen.container.querySelector('[class*="indicator"] svg');
      expect(control, `${size}: control`).not.toBeNull();
      expect(dot, `${size}: dot`).not.toBeNull();

      const gaps = centeringGaps(control!, dot!);
      const verdict = isCentered(gaps, window.devicePixelRatio, 'both');
      expect(verdict.symmetric, `${size}: dot gaps not symmetric`).toBe(true);
      expect(
        verdict.wholePixel,
        `${size}: dot gaps not on whole pixels: ${JSON.stringify(gaps)}`,
      ).toBe(true);
    }
  });
});
