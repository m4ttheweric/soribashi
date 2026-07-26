import { SoribashiProvider } from '@soribashi/core';
import type { ReactNode } from 'react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
// `vitest-browser-react`'s main entry (`import ... from 'vitest-browser-react'`)
// registers a global `beforeEach(() => cleanup())` as a side effect of import
// (see its index.js), which unmounts every previously-rendered root before
// each `it`/`test` runs: the right default for the rest of this package's
// tests, each of which mounts its own fresh component per `it`. This file
// deliberately wants the opposite: ONE mount per grid/entry, read by many
// `test.each`/`it.each` cases. `vitest-browser-react/pure` exposes the same
// `render` without that side effect, confirmed by a throwaway
// two-`it`-sharing-one-`beforeAll`-mount repro before writing this file:
// importing the main entry left `container` empty by the first `it` (cleanup
// already ran); importing `/pure` did not.
import { render } from 'vitest-browser-react/pure';
import { Alert } from '../recipes/Alert/Alert.tsx';
import { Badge } from '../recipes/Badge/Badge.tsx';
import { Button } from '../recipes/Button/Button.tsx';
import { Checkbox } from '../recipes/Checkbox/Checkbox.tsx';
import { Paper } from '../recipes/Paper/Paper.tsx';
import { Popover } from '../recipes/Popover/Popover.tsx';
import { Text } from '../recipes/Text/Text.tsx';
import { Title } from '../recipes/Title/Title.tsx';
import { uiTheme, uiVocabulary } from '../theme.ts';
import { SMALL_COVERAGE_NAMES } from './matrix-classification.ts';
import {
  contrastRatio,
  describeColourGrid,
  MIN_CONTRAST,
  resolveCanvasColor,
  toRgbString,
} from './matrix-harness.tsx';

const INTENTS = uiVocabulary.intent.values;
const VARIANTS = uiVocabulary.variant.values;
const SIZES = uiVocabulary.size.values;

// No allowlist here on purpose. This matrix only renders enabled buttons;
// `disabled` (the one combination that would legitimately be out of AA
// scope, and that axe-core itself exempts from color-contrast) isn't part
// of the 6 x 5 x 5 grid at all. Every combination that IS in the grid is a
// real, in-scope, enabled control, so a failure here is a genuine WCAG AA
// gap, not something to allowlist away. Both light and dark scheme clear
// the whole matrix (300/300 cells across both schemes) since the dark
// token derivation commits (ed313f4, f50938d) gave every non-neutral
// intent its own dark-specific text shades; there is no known gap left
// to track here.
describeColourGrid({
  name: 'Button',
  intents: INTENTS,
  variants: VARIANTS,
  sizes: SIZES,
  renderCell: (intent, variant, testId, size) => (
    <Button
      intent={intent}
      variant={variant}
      size={size}
      attributes={{ root: { 'data-testid': testId } }}
    >
      {intent}
    </Button>
  ),
});

// Alert has no size axis (colour does not vary by size for this recipe), so
// `sizes` is omitted: 6 intents x 3 variants x 2 schemes = 36 cells. Its own
// three-variant tuple (not uiVocabulary's five) is used directly, matching
// the builder config in Alert.tsx (ghost/link are deliberately excluded
// there, so there is no grid cell to render for them here either).
describeColourGrid({
  name: 'Alert',
  intents: INTENTS,
  variants: ['filled', 'outline', 'subtle'] as const,
  renderCell: (intent, variant, testId) => (
    <Alert
      intent={intent}
      variant={variant}
      title={intent}
      attributes={{ root: { 'data-testid': testId } }}
    >
      Sample body copy for {intent}.
    </Alert>
  ),
});

// Badge has no size axis (colour does not vary by size for this recipe, the
// same as Alert), so `sizes` is omitted: 6 intents x 3 variants x 2 schemes
// = 36 cells, per the task brief. Its own three-variant tuple mirrors the
// builder config in Badge.tsx (ghost/link excluded, same rationale as Alert).
describeColourGrid({
  name: 'Badge',
  intents: INTENTS,
  variants: ['filled', 'outline', 'subtle'] as const,
  renderCell: (intent, variant, testId) => (
    <Badge intent={intent} variant={variant} attributes={{ root: { 'data-testid': testId } }}>
      {intent}
    </Badge>
  ),
});

/**
 * One fg/bg pair a `SmallCoverageEntry` proves. `targetClass` selects the
 * element to measure (its own `className`, unique within the entry's
 * `render()`, mirroring the original Popover entry's single 'matrix-target'
 * class). `backdropClass`, when present, selects a different element (an
 * enclosing opaque surface, e.g. a Paper root) whose own computed
 * background-color is this cell's real visual backdrop -- needed whenever
 * the measured element's own background is transparent AND the element it
 * visually sits on is not the page canvas (Text/Title nested inside Paper).
 * When absent, the live-resolved canvas colour is used, matching the Button
 * grid's ghost/link/outline handling; that's a no-op whenever the target's
 * own background is opaque (Popover's popup, Paper's root), since
 * contrastRatio ignores `backdrop` for an alpha-1 bg.
 */
interface SmallCoverageCell {
  targetClass: string;
  backdropClass?: string;
  /** What fg/bg pair this cell proves, folded into every assertion's failure message. */
  description: string;
}

/**
 * Cells for recipes classified `'covered'` in matrix-classification.ts that
 * have no intent x variant x size grid of their own (no vocabulary axes to
 * cross). `Object.keys` of this record MUST equal matrix-classification.ts's
 * `SMALL_COVERAGE_NAMES` (asserted below) so the node-tier guard
 * (matrix-guard.test.ts, which cannot import this browser-tier file) and
 * this file's actual rendered cells cannot silently drift apart. One entry
 * per recipe name; an entry may prove more than one cell (Text/Title each
 * need canvas AND Paper-surface readings), so `cells` is a list rather than
 * a single description the way the original Popover-only shape had it.
 *
 * Stateful cells express their state through mount-time props
 * (`defaultChecked`, `indeterminate`, `defaultValue`, `defaultOpen`) in the
 * fixture's own JSX. Per-cell interactive setup is not supported and must not
 * be added: every entry mounts ONCE and is read twice (light, then dark), so
 * an interaction performed inside one scheme's `it` would leak into or be
 * missing from the other.
 */
interface SmallCoverageEntry {
  /** Mounts every cell this entry proves; see each cell's targetClass/backdropClass. */
  render: () => ReactNode;
  cells: readonly SmallCoverageCell[];
}

const SMALL_COVERAGE: Record<string, SmallCoverageEntry> = {
  // State established at mount only (defaultChecked/indeterminate), never by
  // interaction: this entry mounts once and is read twice (light, then
  // dark), and an interaction inside one scheme's `it` would leak into or be
  // missing from the other (see SmallCoverageEntry's doc comment above).
  // Each cell measures the checkmark's own colour (fg, via currentColor)
  // against the control's checked background (bg): the indicator element
  // itself has no background of its own (Checkbox.module.css's `.indicator`
  // rule sets none), so `backdropClass` points at the sibling `.control`
  // element that actually paints the checked fill.
  Checkbox: {
    render: () => (
      <>
        <Checkbox
          defaultChecked
          intent="primary"
          label="Checked"
          classNames={{
            control: 'matrix-target-checkbox-control',
            indicator: 'matrix-target-checkbox-indicator',
          }}
        />
        <Checkbox
          indeterminate
          intent="primary"
          label="Indeterminate"
          classNames={{
            control: 'matrix-target-checkbox-indeterminate-control',
            indicator: 'matrix-target-checkbox-indeterminate-indicator',
          }}
        />
      </>
    ),
    cells: [
      {
        targetClass: 'matrix-target-checkbox-indicator',
        backdropClass: 'matrix-target-checkbox-control',
        description: 'Checkbox: checked indicator mark on control background',
      },
      {
        targetClass: 'matrix-target-checkbox-indeterminate-indicator',
        backdropClass: 'matrix-target-checkbox-indeterminate-control',
        description: 'Checkbox: indeterminate indicator mark on control background',
      },
    ],
  },

  Paper: {
    render: () => (
      <Paper classNames={{ root: 'matrix-target-paper-default' }}>
        Sample paper body copy, read for contrast against the raised surface.
      </Paper>
    ),
    cells: [
      {
        targetClass: 'matrix-target-paper-default',
        description: 'Paper: default text on --surface-raised',
      },
    ],
  },

  Popover: {
    render: () => (
      <Popover.Root open onOpenChange={() => {}}>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content classNames={{ popup: 'matrix-target' }}>
          <Popover.Title>Title</Popover.Title>
          <Popover.Description classNames={{ description: 'matrix-target-description' }}>
            Sample popover body copy, read for contrast against the popup surface.
          </Popover.Description>
        </Popover.Content>
      </Popover.Root>
    ),
    cells: [
      { targetClass: 'matrix-target', description: 'popup text on popup surface' },
      // Popover.module.css's `.description` sets only `color: var(--text-muted)`,
      // no background of its own, so it visually sits on `.popup`'s own
      // `background: var(--surface-default)` (the `matrix-target` class
      // above); `backdropClass` points there since the description's own
      // computed background-color is transparent. This pair (--text-muted
      // on --surface-default) is otherwise unmeasured anywhere else in this
      // file: the Text entry's dimmed cells (also --text-muted) only cover
      // canvas and Paper's --surface-raised backdrops.
      {
        targetClass: 'matrix-target-description',
        backdropClass: 'matrix-target',
        description:
          'Popover: description text (--text-muted) on popup surface (--surface-default)',
      },
    ],
  },

  Text: {
    render: () => (
      <>
        <Text classNames={{ root: 'matrix-target-text-default' }}>
          Sample paragraph copy, read for contrast against the canvas surface.
        </Text>
        <Text dimmed classNames={{ root: 'matrix-target-text-dimmed-canvas' }}>
          Sample dimmed paragraph copy, read for contrast against the canvas surface.
        </Text>
        <Paper classNames={{ root: 'matrix-target-text-dimmed-paper-backdrop' }}>
          <Text dimmed classNames={{ root: 'matrix-target-text-dimmed-paper' }}>
            Sample dimmed paragraph copy, read for contrast against the Paper surface.
          </Text>
        </Paper>
      </>
    ),
    cells: [
      { targetClass: 'matrix-target-text-default', description: 'Text: default text on canvas' },
      {
        targetClass: 'matrix-target-text-dimmed-canvas',
        description: 'Text: dimmed text on canvas',
      },
      {
        targetClass: 'matrix-target-text-dimmed-paper',
        backdropClass: 'matrix-target-text-dimmed-paper-backdrop',
        description: 'Text: dimmed text on Paper surface',
      },
    ],
  },

  Title: {
    render: () => (
      <>
        <Title classNames={{ root: 'matrix-target-title-default' }}>Sample heading</Title>
        <Paper classNames={{ root: 'matrix-target-title-paper-backdrop' }}>
          <Title classNames={{ root: 'matrix-target-title-paper' }}>Sample heading</Title>
        </Paper>
      </>
    ),
    cells: [
      { targetClass: 'matrix-target-title-default', description: 'Title: default text on canvas' },
      {
        targetClass: 'matrix-target-title-paper',
        backdropClass: 'matrix-target-title-paper-backdrop',
        description: 'Title: default text on Paper surface',
      },
    ],
  },
};

describe('small-coverage contrast cells (WCAG AA >= 4.5:1)', () => {
  it("SMALL_COVERAGE's keys match matrix-classification.ts's SMALL_COVERAGE_NAMES", () => {
    // Sorted on both sides: this is a set-equality check, not an order pin.
    expect(Object.keys(SMALL_COVERAGE).sort()).toEqual([...SMALL_COVERAGE_NAMES].sort());
  });

  describe.each(Object.entries(SMALL_COVERAGE))('%s', (name, entry) => {
    // Popover portals to <body> by default (no `container` prop threaded
    // through here, unlike reskin.test.tsx/Popover.test.tsx): this whole file
    // renders under a single theme, so escaping the local mount point costs
    // nothing. That means the dark-scheme toggle below has to land on
    // `document.body` (an ancestor of both the local mount and the portal
    // target), not on a locally-scoped container the way the Button grid
    // above does; the Button grid never portals, so a local container
    // ancestor is enough for it.
    let mountEl: HTMLDivElement;
    let screen: Awaited<ReturnType<typeof render>>;

    beforeAll(async () => {
      mountEl = document.createElement('div');
      document.body.appendChild(mountEl);
      screen = await render(
        <SoribashiProvider theme={uiTheme}>{entry.render()}</SoribashiProvider>,
        {
          container: mountEl,
        },
      );
      // Waits for every cell's target (handles Popover's async portal mount;
      // a no-op wait for the others, whose targets exist synchronously).
      await Promise.all(
        entry.cells.map((cell) =>
          vi.waitUntil(() => document.querySelector<HTMLElement>(`.${cell.targetClass}`), {
            timeout: 2000,
            interval: 20,
          }),
        ),
      );
    });

    afterAll(async () => {
      document.body.classList.remove('dark');
      await screen.unmount();
      mountEl.remove();
    });

    // No no-transition stylesheet here (unlike the Button grid's beforeAll):
    // none of Popover.module.css/Paper.module.css/Text.module.css/Title.module.css
    // transition background-color/color (Popover's `.popup` only transitions
    // opacity/transform, its enter/exit animation), so the colours this cell
    // measures are never mid-interpolation regardless of when the `dark`
    // class is toggled.
    function assertCellClearsAA(cell: SmallCoverageCell) {
      const target = document.querySelector<HTMLElement>(`.${cell.targetClass}`);
      if (!target) {
        throw new Error(`small-coverage: no element found for target class "${cell.targetClass}"`);
      }
      const cs = getComputedStyle(target);
      const fg = toRgbString(cs.color);
      const bg = toRgbString(cs.backgroundColor);
      const backdropEl = cell.backdropClass
        ? document.querySelector<HTMLElement>(`.${cell.backdropClass}`)
        : null;
      const backdrop = backdropEl
        ? toRgbString(getComputedStyle(backdropEl).backgroundColor)
        : resolveCanvasColor(document.body);
      const ratio = contrastRatio(fg, bg, backdrop);
      expect(
        ratio,
        `${name} (${cell.description}): fg=${fg} bg=${bg} backdrop=${backdrop} ratio=${ratio.toFixed(3)}`,
      ).toBeGreaterThanOrEqual(MIN_CONTRAST);
    }

    it.each(entry.cells)('$description: light scheme clears AA', (cell) => {
      assertCellClearsAA(cell);
    });

    it.each(entry.cells)('$description: dark scheme clears AA', (cell) => {
      document.body.classList.add('dark');
      // Forces a synchronous style recalc before reading, same rationale as
      // the Button grid's dark describe block above.
      void document.body.offsetHeight;
      try {
        assertCellClearsAA(cell);
      } finally {
        document.body.classList.remove('dark');
      }
    });
  });
});
