import { SoribashiProvider } from '@soribashi/core';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { RadioGroup } from '../recipes/RadioGroup/RadioGroup.tsx';
import { Select } from '../recipes/Select/Select.tsx';
import { Switch } from '../recipes/Switch/Switch.tsx';
import { Tabs } from '../recipes/Tabs/Tabs.tsx';
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

  it('tabs.indicator.withinList', async () => {
    for (const orientation of ['horizontal', 'vertical'] as const) {
      const screen = await wrap(
        <Tabs.Root defaultValue="c" variant="line" orientation={orientation}>
          <Tabs.List>
            <Tabs.Tab value="a">First</Tabs.Tab>
            <Tabs.Tab value="b">Second</Tabs.Tab>
            <Tabs.Tab value="c">Third</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="c">Third panel.</Tabs.Panel>
        </Tabs.Root>,
      );
      const list = screen.container.querySelector('[class*="list"]');
      const indicator = screen.container.querySelector('[class*="indicator"]');
      expect(list, `${orientation}: list`).not.toBeNull();
      expect(indicator, `${orientation}: indicator`).not.toBeNull();

      const l = list!.getBoundingClientRect();
      const i = indicator!.getBoundingClientRect();
      expect(
        i.top >= l.top - 0.5 && i.bottom <= l.bottom + 0.5,
        `${orientation}: indicator escapes list vertically. list ${l.top}..${l.bottom}, indicator ${i.top}..${i.bottom}`,
      ).toBe(true);
      expect(
        i.left >= l.left - 0.5 && i.right <= l.right + 0.5,
        `${orientation}: indicator escapes list horizontally`,
      ).toBe(true);
    }
  });

  it('select.popup.clearsTrigger', async () => {
    // Select resolves items via a {label, value} shape by default (items.ts's
    // defaultGetLabel/defaultGetValue); plain strings throw before the popup
    // ever renders, so this uses the same object-item shape Select.test.tsx's
    // own fixtures do rather than the bare string list.
    const items = [
      { label: 'Apple', value: 'apple' },
      { label: 'Banana', value: 'banana' },
      { label: 'Cherry', value: 'cherry' },
    ];
    // The trigger needs two things the brief's literal snippet did not have,
    // confirmed by measuring both ways before writing this: room above it,
    // and a non-first selected item. `alignItemWithTrigger` overlaps the
    // popup upward to put the SELECTED item where the trigger's value text
    // is; with the first item selected there is nothing above it to shift,
    // and with the trigger glued to the viewport's top edge (y=0, the bare
    // `wrap()` default) Floating UI's own boundary collision handling
    // silently flips the popup below regardless of alignItemWithTrigger,
    // masking the defect. `marginTop` gives the popup room to align upward
    // as designed; `defaultValue="cherry"` (the last item) gives it two
    // rows worth of content to shift by.
    const screen = await wrap(
      <div style={{ marginTop: '200px' }}>
        <Select items={items} defaultValue="cherry" />
      </div>,
    );
    const trigger = screen.getByRole('combobox').element();
    await userEvent.click(trigger);

    const popup = await vi.waitUntil(() => document.querySelector('[class*="popup"]'), {
      timeout: 2000,
    });
    const t = trigger.getBoundingClientRect();
    const p = popup.getBoundingClientRect();
    const intersects = p.top < t.bottom && p.bottom > t.top && p.left < t.right && p.right > t.left;
    expect(
      intersects,
      `popup overlaps trigger. trigger ${t.top}..${t.bottom}, popup ${p.top}..${p.bottom}`,
    ).toBe(false);
  });
});
