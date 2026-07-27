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
import { RadioGroup } from '../recipes/RadioGroup/RadioGroup.tsx';
import { Select } from '../recipes/Select/Select.tsx';
import { Switch } from '../recipes/Switch/Switch.tsx';
import { Tabs } from '../recipes/Tabs/Tabs.tsx';
import { Text } from '../recipes/Text/Text.tsx';
import { Textarea } from '../recipes/Textarea/Textarea.tsx';
import { TextInput } from '../recipes/TextInput/TextInput.tsx';
import { Title } from '../recipes/Title/Title.tsx';
import { Tooltip } from '../recipes/Tooltip/Tooltip.tsx';
import { uiTheme, uiVocabulary } from '../theme.ts';
import { SMALL_COVERAGE_NAMES } from './matrix-classification.ts';
import {
  contrastRatio,
  describeColourGrid,
  installNoTransitionStyle,
  MIN_CONTRAST,
  NO_TRANSITION_CLASS,
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

  // State established at mount only (`defaultValue`), never by interaction:
  // this entry mounts once and is read twice (light, then dark), and an
  // interaction inside one scheme's `it` would leak into or be missing from
  // the other (see SmallCoverageEntry's doc comment above). Mirrors
  // Checkbox's/Switch's own shape: the indicator, like Checkbox's checkmark
  // and Switch's thumb, paints via an SVG using `currentColor` with no CSS
  // background of its own (RadioGroup.module.css's `.indicator` rule), so
  // `backdropClass` -- the control's real, opaque checked background -- is
  // what `contrastRatio` actually composites against. `classNames.control`/
  // `.indicator`/`.itemLabel` each apply the SAME class to every rendered
  // item (the Styles API has no per-instance-item override); `defaultValue`
  // is deliberately the FIRST item's value ("free"), so the checked item is
  // both the first DOM match for `.matrix-target-radiogroup-control`
  // (`querySelector` returns the first match) and the only item whose
  // indicator mounts at all (`keepMounted: false`), keeping both cells
  // unambiguous without needing an attribute-selector disambiguator the way
  // Select's highlighted-item cell does.
  RadioGroup: {
    render: () => (
      <RadioGroup
        defaultValue="free"
        intent="primary"
        items={[
          { label: 'Free', value: 'free' },
          { label: 'Pro', value: 'pro' },
        ]}
        classNames={{
          control: 'matrix-target-radiogroup-control',
          indicator: 'matrix-target-radiogroup-indicator',
          itemLabel: 'matrix-target-radiogroup-itemLabel',
        }}
      />
    ),
    cells: [
      {
        targetClass: 'matrix-target-radiogroup-indicator',
        backdropClass: 'matrix-target-radiogroup-control',
        description: 'RadioGroup: selected indicator on control background',
      },
      {
        targetClass: 'matrix-target-radiogroup-itemLabel',
        description: 'RadioGroup: item label text on canvas',
      },
    ],
  },

  // State established at mount only (`defaultOpen` + `defaultValue`), never
  // by interaction: this entry mounts once and is read twice (light, then
  // dark), and an interaction inside one scheme's `it` would leak into or be
  // missing from the other (see SmallCoverageEntry's doc comment above).
  // `defaultValue="selected"` combined with `defaultOpen` gives a real
  // `data-highlighted` item at mount with no interaction needed (Base UI
  // highlights the currently-selected item by default when the popup opens;
  // confirmed with a throwaway probe render before writing this rather than
  // assumed), which is what the highlighted-item cell below needs.
  // `classNames.item` applies the SAME class to every item (the Styles API
  // has no per-instance-item override), so the highlighted vs. unhighlighted
  // cells are distinguished by appending a `[data-highlighted]` /
  // `:not([data-highlighted])` attribute selector onto that one shared class
  // in `targetClass` rather than needing two different classNames.
  Select: {
    render: () => (
      <Select
        items={[
          { label: 'Selected', value: 'selected' },
          { label: 'Other', value: 'other' },
        ]}
        defaultOpen
        defaultValue="selected"
        classNames={{
          trigger: 'matrix-target-select-trigger',
          popup: 'matrix-target-select-popup',
          item: 'matrix-target-select-item',
        }}
      />
    ),
    cells: [
      {
        targetClass: 'matrix-target-select-trigger',
        description: 'Select: trigger text on trigger surface',
      },
      {
        targetClass: 'matrix-target-select-item[data-highlighted]',
        description: 'Select: highlighted item text on highlighted item background',
      },
      {
        // The unhighlighted item's own background is transparent
        // (Select.module.css's base `.item` rule paints one only under
        // `[data-highlighted]`), so it visually sits on `.popup`'s own
        // `background: var(--surface-default)` (the `matrix-target-select-popup`
        // class above); `backdropClass` points there, matching Popover's
        // description-on-popup cell.
        targetClass: 'matrix-target-select-item:not([data-highlighted])',
        backdropClass: 'matrix-target-select-popup',
        description: 'Select: unhighlighted item text on popup surface',
      },
    ],
  },

  // State established at mount only (`defaultChecked`), never by interaction:
  // this entry mounts once and is read twice (light, then dark), and an
  // interaction inside one scheme's `it` would leak into or be missing from
  // the other (see SmallCoverageEntry's doc comment above). Both cells share
  // Checkbox's own shapes: the first mirrors Checkbox's indicator-on-control
  // cell exactly (the thumb, like the indicator, paints via an SVG using
  // `currentColor` with no CSS background of its own, so `backdropClass`
  // -- the control's real, opaque checked background -- is what
  // `contrastRatio` actually composites against, not a silently-ignored
  // argument); the second mirrors TextInput's/Textarea's own "label text on
  // canvas" cell (Field.module.css's `.label` rule sets only `color`, no
  // background of its own).
  Switch: {
    render: () => (
      <Switch
        defaultChecked
        intent="primary"
        label="Notify"
        classNames={{
          control: 'matrix-target-switch-control',
          thumb: 'matrix-target-switch-thumb',
          label: 'matrix-target-switch-label',
        }}
      />
    ),
    cells: [
      {
        targetClass: 'matrix-target-switch-thumb',
        backdropClass: 'matrix-target-switch-control',
        description: 'Switch: checked thumb on checked track',
      },
      {
        targetClass: 'matrix-target-switch-label',
        description: 'Switch: label text on canvas',
      },
    ],
  },

  // State established at mount only (`defaultValue`), never by interaction:
  // this entry mounts once and is read twice (light, then dark), and an
  // interaction inside one scheme's `it` would leak into or be missing from
  // the other (see SmallCoverageEntry's doc comment above). `variant="pill"`
  // is chosen deliberately over the default `variant="line"`: pill's
  // selected tab paints its own opaque `--surface-raised` background
  // (Tabs.module.css's `.root[data-variant="pill"] .tab[data-active]`
  // rule), giving a self-contained fg/bg pair with no backdrop needed,
  // whereas line's selected tab stays background-transparent and would only
  // re-measure the same canvas backdrop the unselected cell below already
  // covers.
  Tabs: {
    render: () => (
      <Tabs.Root defaultValue="a" variant="pill">
        <Tabs.List>
          <Tabs.Tab value="a" classNames={{ tab: 'matrix-target-tabs-selected' }}>
            Selected
          </Tabs.Tab>
          <Tabs.Tab value="b" classNames={{ tab: 'matrix-target-tabs-unselected' }}>
            Unselected
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="a">Panel A</Tabs.Panel>
        <Tabs.Panel value="b">Panel B</Tabs.Panel>
      </Tabs.Root>
    ),
    cells: [
      {
        targetClass: 'matrix-target-tabs-selected',
        description: 'Tabs: selected tab text on --surface-raised (pill variant)',
      },
      {
        // The unselected tab's own background is transparent (Tabs.module.css's
        // base `.tab` rule sets `background: transparent`), and it visually
        // sits directly on the page canvas (`.list` paints no background of
        // its own either), so no `backdropClass` is needed here -- matching
        // Checkbox's/Paper's no-backdrop entries above.
        targetClass: 'matrix-target-tabs-unselected',
        description: 'Tabs: unselected tab text (--text-muted) on canvas',
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

  // colour-contrast half of Field.tsx's own `{ exempt: 'colour-via: ...' }`
  // classification (matrix-classification.ts): label/description/error are
  // the SAME Field parts TextInput's entry below already measures (Field
  // composes identically for every control on this anatomy contract), so
  // this entry does not re-measure them. It only proves the one cell
  // TextInput's entry cannot: the textarea's OWN value text on its own
  // surface. State established at mount only (`defaultValue`), never by
  // interaction, same as every other entry here.
  Textarea: {
    render: () => (
      <Textarea
        label="Label"
        description="Hint"
        error="Required"
        defaultValue="Sample"
        classNames={{
          textarea: 'matrix-target-textarea-textarea',
        }}
      />
    ),
    cells: [
      {
        targetClass: 'matrix-target-textarea-textarea',
        description: 'Textarea: textarea value text on the textarea surface',
      },
    ],
  },

  // State established at mount only (`defaultValue`), never by interaction:
  // this entry mounts once and is read twice (light, then dark), and an
  // interaction inside one scheme's `it` would leak into or be missing from
  // the other (see SmallCoverageEntry's doc comment above). Also the
  // colour-contrast half of Field.tsx's own `{ exempt: 'colour-via: ...' }`
  // classification (matrix-classification.ts): Field itself renders no
  // colour-bearing cells of its own, so its label/description/error parts'
  // real, rendered contrast is proven here, through the control that
  // actually composes them. Textarea's own entry above shares these same
  // Field parts and does not re-measure them.
  TextInput: {
    render: () => (
      <TextInput
        label="Label"
        description="Hint"
        error="Required"
        defaultValue="Sample"
        classNames={{
          input: 'matrix-target-textinput-input',
          label: 'matrix-target-textinput-label',
          error: 'matrix-target-textinput-error',
        }}
      />
    ),
    cells: [
      {
        targetClass: 'matrix-target-textinput-input',
        description: 'TextInput: input value text on the input surface',
      },
      {
        // Field.module.css's `.label` rule sets only `color`, no background
        // of its own, so it visually sits directly on the page canvas (no
        // enclosing opaque surface here) -- matching Checkbox's/Tabs' own
        // no-backdrop cells.
        targetClass: 'matrix-target-textinput-label',
        description: 'TextInput: label text on canvas',
      },
      {
        // Same rationale: Field.module.css's `.error` rule sets only
        // `color`, so the error text visually sits on the page canvas too.
        targetClass: 'matrix-target-textinput-error',
        description: 'TextInput: error text on canvas',
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

  // State established at mount only (`defaultOpen`), never by interaction:
  // this entry mounts once and is read twice (light, then dark), same
  // rationale as every other entry above. `defaultOpen` is the real prop
  // name verified against the installed `TooltipRootProps` (task report's
  // Base UI Tooltip findings) -- Tooltip's Root forwards it straight to
  // Base UI's TooltipRoot, the same mount-time-open idiom Popover's own
  // entry above uses via a controlled `open`/`onOpenChange` pair instead
  // (Tooltip has no reason to prefer one over the other here; `defaultOpen`
  // is simply less code for an uncontrolled one-shot mount). Tooltip.module.css's
  // `.popup` sets both `background` (--color-neutral-800) and `color`
  // (--color-neutral-50), an opaque surface with no backdrop needed, the
  // same shape as Popover's own popup-text cell above.
  Tooltip: {
    render: () => (
      <Tooltip.Root defaultOpen>
        <Tooltip.Trigger delay={0}>Hover me</Tooltip.Trigger>
        <Tooltip.Content classNames={{ popup: 'matrix-target-tooltip-popup' }}>
          Sample tooltip copy, read for contrast against the popup surface.
        </Tooltip.Content>
      </Tooltip.Root>
    ),
    cells: [
      {
        targetClass: 'matrix-target-tooltip-popup',
        description: 'Tooltip: popup text on popup surface',
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
    let removeNoTransitionStyle: () => void;

    beforeAll(async () => {
      // Scoped to `document.body`, not `mountEl`: at least one entry
      // (Popover) portals its measured element to `<body>` directly (no
      // `container` prop threaded through here, see the comment above), so
      // its target is a SIBLING of `mountEl`, not a descendant. `document.body`
      // is the nearest common ancestor of both the local mount and any
      // portal target (the same reason the `dark` class toggle below also
      // lands on `document.body` rather than a locally-scoped container the
      // way the Button grid does), so putting the no-transition class there
      // is what makes it actually reach portalled content instead of
      // silently no-op'ing for exactly the entries most likely to need it.
      // Fix-round-1 finding: this harness previously had no no-transition
      // mechanism of its own at all, which forced Tabs to instead strip its
      // own colour transitions to dodge a mid-interpolation read (see
      // `installNoTransitionStyle`'s doc comment in matrix-harness.tsx).
      removeNoTransitionStyle = installNoTransitionStyle();
      document.body.classList.add(NO_TRANSITION_CLASS);

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
      document.body.classList.remove(NO_TRANSITION_CLASS);
      removeNoTransitionStyle();
      await screen.unmount();
      mountEl.remove();
    });

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

/**
 * Tripwire for the shared `primary`/`filled` pairing's near-floor contrast
 * margin (open question 4 of the 2026-07-26 whole-branch review).
 *
 * `colors.primary['500']` (`packages/theme/src/tokens/default-tokens.ts`) was
 * already hand-darkened once to clear the 4.5:1 AA floor and now measures
 * 4.5617:1 -- 0.0617 of margin. Button, Alert and Badge's full contrast
 * grids above all ride this same pairing (Alert/Badge via the theme's shared
 * `defaultIntentResolver`, not their own colour choices), plus Checkbox's
 * small-coverage cells resolve through the identical `filled` branch. So a
 * single future nudge to `primary.500` fails four assertion sites/three full
 * grids at once, each showing dozens of red cells with nothing pointing at
 * the shared root cause.
 *
 * This test pins the exact pairing and its known-tightest measured value, so
 * a token change that erodes the margin fails here first, with a message
 * that names the token directly, before the grids above turn red with no
 * diagnosis. It intentionally duplicates one cell the Button grid already
 * covers -- that duplication is the point, not a mistake.
 */
describe('primary/filled contrast tripwire (near-floor margin)', () => {
  it('pins the shared primary/filled pairing at its known-tightest measured ratio', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const removeNoTransitionStyle = installNoTransitionStyle();
    container.classList.add(NO_TRANSITION_CLASS);

    const screen = await render(
      <SoribashiProvider theme={uiTheme}>
        <Button
          intent="primary"
          variant="filled"
          attributes={{ root: { 'data-testid': 'tripwire' } }}
        >
          primary
        </Button>
      </SoribashiProvider>,
      { container },
    );

    const el = container.querySelector<HTMLElement>('[data-testid="tripwire"]');
    if (!el) throw new Error('primary/filled tripwire: target element did not render');
    const cs = getComputedStyle(el);
    const fg = toRgbString(cs.color);
    const bg = toRgbString(cs.backgroundColor);
    const backdrop = resolveCanvasColor(container);
    const ratio = contrastRatio(fg, bg, backdrop);

    // If this fails, `colors.primary['500']` (default-tokens.ts) moved. Do
    // not just bump this number back to green -- re-check the margin against
    // MIN_CONTRAST (4.5) and update the comment there too.
    expect(ratio, `fg=${fg} bg=${bg} backdrop=${backdrop} ratio=${ratio.toFixed(4)}`).toBeCloseTo(
      4.5617,
      3,
    );
    expect(ratio).toBeGreaterThanOrEqual(MIN_CONTRAST);

    await screen.unmount();
    container.remove();
    removeNoTransitionStyle();
  });
});
