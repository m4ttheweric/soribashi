import { SoribashiProvider } from '@soribashi/core';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import {
  installNoTransitionStyle,
  NO_TRANSITION_CLASS,
  resolveCanvasColor,
  toRgbString,
} from '../a11y/matrix-harness.tsx';
import { Accordion } from '../recipes/Accordion/Accordion.tsx';
import { Alert } from '../recipes/Alert/Alert.tsx';
import { Button } from '../recipes/Button/Button.tsx';
import { Checkbox } from '../recipes/Checkbox/Checkbox.tsx';
import { RadioGroup } from '../recipes/RadioGroup/RadioGroup.tsx';
import { Select } from '../recipes/Select/Select.tsx';
import { Skeleton } from '../recipes/Skeleton/Skeleton.tsx';
import { Switch } from '../recipes/Switch/Switch.tsx';
import { Tabs } from '../recipes/Tabs/Tabs.tsx';
import { Textarea } from '../recipes/Textarea/Textarea.tsx';
import { TextInput } from '../recipes/TextInput/TextInput.tsx';
import { uiTheme } from '../theme.ts';
import { centeringGaps, isCentered } from './measure.ts';
import { REFERENCE } from './reference.ts';

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

  it('focus.ring.uniform', async () => {
    // vitest-browser gives every test FILE its own document, and a CSS
    // module only lands a <style> tag in that document once something in
    // THIS file actually references the module's binding (a bare `import`
    // with no use gets elided by esbuild's TS transform, same as an
    // unused type-only import, so it never runs). RadioGroup/Select/Switch/
    // Tabs already get mounted by the earlier rows above; Accordion, Alert,
    // Button, Checkbox, TextInput, and Textarea are mounted here for the
    // sole purpose of registering their stylesheets before the scan below,
    // confirmed necessary by first running this scan against only the
    // recipes the earlier rows already mount: it found just two of the five
    // known offenders (RadioGroup, Switch) because Alert/Button/Checkbox
    // were never otherwise imported into this file.
    await wrap(
      <>
        <Alert withCloseButton>Alert body</Alert>
        <Button>Button label</Button>
        <Checkbox label="Checkbox label" />
        <Accordion.Root>
          <Accordion.Item value="a">
            <Accordion.Header>
              <Accordion.Trigger>Trigger</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>Panel</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
        <TextInput label="Input" />
        <Textarea label="Textarea" />
      </>,
    );

    const probe = document.createElement('div');
    document.body.appendChild(probe);
    probe.style.outlineColor = 'var(--accent-primary, var(--text-default))';
    const expected = getComputedStyle(probe).outlineColor;
    probe.remove();

    const sheets = [...document.styleSheets];
    const offenders: string[] = [];
    for (const sheet of sheets) {
      let rules: CSSRuleList;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      for (const rule of [...rules]) {
        const text = rule.cssText;
        if (!text.includes('--accent-primary')) continue;
        if (!text.includes('var(--accent-primary, var(--text-default))')) {
          offenders.push(text.slice(0, 120));
        }
      }
    }
    expect(offenders, `divergent focus ring fallbacks:\n${offenders.join('\n')}`).toEqual([]);
    expect(expected).toBeTruthy();
  });

  it('controls.sharedHeight', async () => {
    // Button/TextInput/Select each carry their own independently authored
    // dimension record (BUTTON_HEIGHTS/TEXTINPUT_HEIGHTS/
    // SELECT_TRIGGER_HEIGHTS, one per recipe file); nothing before this row
    // enforced they actually agree. None of the three transitions
    // block-size/height (Button transitions background-color/border-color/
    // color; TextInput and Select's trigger transition border-color/
    // background-color only, confirmed by reading each Module.css), so
    // installNoTransitionStyle is not needed for a height read taken right
    // after mount.
    //
    // Queries are scoped to this iteration's own `screen.container` rather
    // than a page-wide `screen.getByRole(...)`: the loop mounts a fresh tree
    // per size without unmounting the previous one first (cleanup only runs
    // between `it` blocks, not between loop iterations within one), so an
    // unscoped role query matches every earlier size's control too and
    // throws a strict-mode violation from the second iteration onward.
    for (const size of SIZES) {
      const screen = await wrap(
        <div>
          <Button size={size}>Go</Button>
          <TextInput size={size} />
          <Select items={[{ label: 'Apple', value: 'apple' }]} defaultValue="apple" size={size} />
        </div>,
      );
      const button = screen.container.querySelector('button')!;
      const input = screen.container.querySelector('input')!;
      const trigger = screen.container.querySelector('[role="combobox"]')!;

      const heights = [button, input, trigger].map(
        (el) => Math.round(el.getBoundingClientRect().height * 100) / 100,
      );
      const [a, b, c] = heights as [number, number, number];
      expect(
        Math.abs(a - b) < 0.5 && Math.abs(a - c) < 0.5,
        `${size}: control heights disagree. button ${a}, input ${b}, select ${c}`,
      ).toBe(true);
    }
  });

  // Shared by both skeleton.deltaY.* rows below. `toRgbString` (matrix-harness.tsx)
  // collapses any getComputedStyle colour to `rgb(r, g, b)` for an opaque read,
  // only ever emitting `rgba(r, g, b, a)` (a fourth number) when the source
  // colour genuinely carries alpha. Every colour these rows touch
  // (--surface-canvas, --color-neutral-200/400) is fully opaque, so a
  // real 4th component here would mean this composite math is being fed a
  // colour it was never built to handle; fail loudly instead of the silent
  // `.slice(0, 3)` an earlier round of this row used, which discarded a
  // possible alpha with no comment at all.
  function rgbChannels(rgb: string): readonly [number, number, number] {
    const nums = rgb.match(/[\d.]+/g)!.map(Number);
    if (nums.length === 4) {
      throw new Error(`rgbChannels: unexpected alpha channel in "${rgb}"`);
    }
    return nums as [number, number, number];
  }

  function relLuminance([r, g, b]: readonly [number, number, number]): number {
    const lin = (c: number) => {
      const s = c / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  }

  // Composites `fill` over `canvas` at `alpha`, matching how the browser's
  // own alpha blending lands on 8-bit sRGB channels (round-per-channel, not
  // linear-light blending): this is the same model used to derive the
  // reference numbers in reference.ts's skeleton.deltaY.* witnesses, and
  // reproduces them exactly when fed the same inputs.
  function compositeOverCanvas(
    fill: readonly [number, number, number],
    canvas: readonly [number, number, number],
    alpha: number,
  ): readonly [number, number, number] {
    return fill.map((c, i) => Math.round(c * alpha + canvas[i]! * (1 - alpha))) as [
      number,
      number,
      number,
    ];
  }

  // Reads the LIVE `to` keyframe opacity straight off the CSSOM rather than
  // assuming a hardcoded number: a hardcoded trough value would silently stay
  // "correct" even if Skeleton.module.css's own keyframe regressed, which is
  // exactly the failure mode this row exists to catch (see reference.ts).
  // Recurses into grouping rules (`@layer`, `@media`, ...) since this
  // package's CSS Modules always land inside `@layer soribashi.recipes`, one
  // top-level CSSRule per stylesheet (Task 6's finding).
  //
  // Two things confirmed empirically (a throwaway dump of every rule's
  // constructor name and cssText) before writing the matcher below, neither
  // of which matches the source `.module.css` literally: CSS Modules scopes
  // an animation name exactly like a class name (`sb-skeleton-pulse`
  // compiles to something like `_sb-skeleton-pulse_xjkev_1`), so an exact
  // `rule.name === keyframesName` match never fires; a substring match does.
  // Separately, this build's CSS pipeline normalizes the source's `from`/`to`
  // keyframe selectors to `0%`/`100%` before the browser ever parses them
  // (unrelated to and unaffected by no-hardcoded-values.test.ts's own
  // preference for `from`/`to`, which scans the SOURCE file text directly,
  // never this compiled form), so the trough match checks both spellings.
  function findTroughOpacity(keyframesName: string): number {
    function search(rules: CSSRuleList): number | undefined {
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSKeyframesRule && rule.name.includes(keyframesName)) {
          for (const kf of Array.from(rule.cssRules)) {
            if (kf instanceof CSSKeyframeRule && (kf.keyText === 'to' || kf.keyText === '100%')) {
              const opacity = Number(kf.style.opacity);
              if (!Number.isNaN(opacity)) return opacity;
            }
          }
        }
        const nested = (rule as CSSGroupingRule).cssRules;
        if (nested) {
          const found = search(nested);
          if (found !== undefined) return found;
        }
      }
      return undefined;
    }

    for (const sheet of document.styleSheets) {
      let rules: CSSRuleList;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      const found = search(rules);
      if (found !== undefined) return found;
    }
    throw new Error(`keyframes "${keyframesName}" not found in any stylesheet`);
  }

  interface SkeletonMeasurement {
    restingDelta: number;
    troughDelta: number;
    troughOpacity: number;
    fill: string;
    canvas: string;
  }

  async function measureSkeleton(scheme: 'light' | 'dark'): Promise<SkeletonMeasurement> {
    // installNoTransitionStyle only freezes `transition`; Skeleton.module.css's
    // pulse is a perpetually-running `animation`, a wholly separate CSS
    // mechanism (same finding as Skeleton.visual.test.tsx's own local
    // no-transition block), so a plain transition freeze alone would still
    // let a resting-state read land on whatever opacity the keyframe happens
    // to be interpolating through at that instant. A second local stylesheet
    // extends the SAME shared class with `animation: none !important` so
    // both mechanisms are frozen before the resting colour is read; the
    // trough colour below is derived separately, by composite math, not by
    // ever unfreezing the animation to look for it.
    const removeNoTransitionStyle = installNoTransitionStyle();
    const noAnimationStyle = document.createElement('style');
    noAnimationStyle.textContent = `
      .${NO_TRANSITION_CLASS},
      .${NO_TRANSITION_CLASS} * { animation: none !important; }
    `;
    document.head.appendChild(noAnimationStyle);

    try {
      const wrapperClass = scheme === 'dark' ? `${NO_TRANSITION_CLASS} dark` : NO_TRANSITION_CLASS;
      const screen = await wrap(
        <div className={wrapperClass} style={{ background: 'var(--surface-canvas)' }}>
          <Skeleton style={{ width: '120px', height: '16px' }} />
        </div>,
      );
      const wrapperEl = screen.container.querySelector(`.${NO_TRANSITION_CLASS}`) as HTMLElement;
      const el = screen.container.querySelector('[class*="root"]')!;

      // matrix-harness.tsx's toRgbString docstring: this Chromium build
      // serializes getComputedStyle colours back as oklch(...), unconverted,
      // not the legacy rgb()/rgba() a naive digit-scraping regex expects.
      // Round-tripping through toRgbString's 1x1 canvas paint (8-bit sRGB
      // since long before oklch() existed) is the same, already-verified fix
      // this repo uses everywhere else a computed colour needs real channels.
      const fill = toRgbString(getComputedStyle(el).backgroundColor);
      // resolveCanvasColor appends its probe as a CHILD of `wrapperEl`, not
      // document.body directly: --surface-canvas (like every token here) is
      // only overridden for dark under a `.dark` scope, so a probe living
      // outside that scope would silently read the light value even during
      // the dark pass.
      const canvas = toRgbString(resolveCanvasColor(wrapperEl));

      const fillRgb = rgbChannels(fill);
      const canvasRgb = rgbChannels(canvas);
      const troughOpacity = findTroughOpacity('sb-skeleton-pulse');
      const troughRgb = compositeOverCanvas(fillRgb, canvasRgb, troughOpacity);

      return {
        restingDelta: Math.abs(relLuminance(fillRgb) - relLuminance(canvasRgb)),
        troughDelta: Math.abs(relLuminance(troughRgb) - relLuminance(canvasRgb)),
        troughOpacity,
        fill,
        canvas,
      };
    } finally {
      noAnimationStyle.remove();
      removeNoTransitionStyle();
    }
  }

  it('skeleton.deltaY.light', async () => {
    const { restingDelta, troughDelta, troughOpacity, fill, canvas } =
      await measureSkeleton('light');
    const floor = REFERENCE['skeleton.deltaY.light']!.bound as number;
    expect(
      restingDelta,
      `light resting: skeleton (${fill}) sits ${restingDelta.toFixed(4)} from its canvas (${canvas}), floor is ${floor}`,
    ).toBeGreaterThanOrEqual(floor);
    expect(
      troughDelta,
      `light trough (opacity ${troughOpacity}): sits ${troughDelta.toFixed(4)} from its canvas, floor is ${floor}`,
    ).toBeGreaterThanOrEqual(floor);
  });

  it('skeleton.deltaY.dark', async () => {
    const { restingDelta, troughDelta, troughOpacity, fill, canvas } =
      await measureSkeleton('dark');
    const floor = REFERENCE['skeleton.deltaY.dark']!.bound as number;
    expect(
      restingDelta,
      `dark resting: skeleton (${fill}) sits ${restingDelta.toFixed(4)} from its canvas (${canvas}), floor is ${floor}`,
    ).toBeGreaterThanOrEqual(floor);
    expect(
      troughDelta,
      `dark trough (opacity ${troughOpacity}): sits ${troughDelta.toFixed(4)} from its canvas, floor is ${floor}`,
    ).toBeGreaterThanOrEqual(floor);
  });
});
