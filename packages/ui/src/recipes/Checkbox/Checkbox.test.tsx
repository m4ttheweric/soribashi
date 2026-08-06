import { createTheme, SoribashiProvider } from '@soribashi/core';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { formatViolations, runAxe } from '../../a11y/axe.ts';
import { uiTheme, uiVocabulary } from '../../theme.ts';
import { Field } from '../Field/Field.tsx';
import { Checkbox } from './Checkbox.tsx';

// `render` from vitest-browser-react resolves a Promise<RenderResult>; `wrap`
// awaits it so callers get the real result object (see Alert.test.tsx).
const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={uiTheme}>{ui}</SoribashiProvider>);

describe('Checkbox (browser)', () => {
  it('exposes role="checkbox"', async () => {
    const screen = await wrap(<Checkbox label="Accept" />);
    await expect.element(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('toggles on click and reflects aria-checked (real interaction, not a passed prop)', async () => {
    const screen = await wrap(<Checkbox label="Accept" />);
    const control = screen.getByRole('checkbox');
    await expect.element(control).toHaveAttribute('aria-checked', 'false');
    await control.click();
    await expect.element(control).toHaveAttribute('aria-checked', 'true');
  });

  it('toggles when the label text is clicked (association, not just proximity)', async () => {
    const screen = await wrap(<Checkbox label="Accept" />);
    await screen.getByText('Accept').click();
    await expect.element(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');
  });

  it('reports aria-checked="mixed" when indeterminate', async () => {
    const screen = await wrap(<Checkbox label="Some" indeterminate />);
    await expect.element(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'mixed');
  });

  it('does not toggle when disabled and does not call onCheckedChange', async () => {
    const onCheckedChange = vi.fn();
    const screen = await wrap(<Checkbox label="No" disabled onCheckedChange={onCheckedChange} />);
    const control = screen.getByRole('checkbox');
    await control.click({ force: true });
    expect(onCheckedChange).not.toHaveBeenCalled();
    await expect.element(control).toHaveAttribute('aria-checked', 'false');
  });

  it('renders description and error through the Field anatomy when provided', async () => {
    // Same aria-describedby-chain assertion Switch.test.tsx's
    // assertNotifyFieldAnatomy uses: Base UI's Field wires the description
    // and (match-forced) error ids onto the control automatically.
    const screen = await wrap(<Checkbox label="A" description="B" error="C" />);
    const control = screen.getByRole('checkbox', { name: 'A' });
    await expect.element(control).toBeInTheDocument();
    const el = control.element() as HTMLElement;
    const ids = (el.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
    const describedText = ids.map((id) => document.getElementById(id)?.textContent ?? '').join(' ');
    expect(describedText).toContain('B');
    expect(describedText).toContain('C');
  });

  it('renders only the bare control + label when no description/error is present', async () => {
    // The locked compatibility decision: `label` alone keeps the native
    // label-wraps-control containment (real association, pinned by the
    // label-click test above), with NO Field.Root wrapper in the tree. The
    // recipe's outermost element is the <label> itself, mounted directly in
    // the render container.
    const screen = await wrap(<Checkbox label="Accept" />);
    const el = screen.getByRole('checkbox').element() as HTMLElement;
    const labelEl = el.closest('label');
    expect(labelEl).not.toBeNull();
    expect(labelEl?.parentElement).toBe(screen.container);
    expect(el.getAttribute('aria-describedby')).toBeNull();
  });

  it("anatomy mode's Field.Root keeps Field's layout: no bare-mode inline-flex/cursor bleed, control before label", async () => {
    // Regression pin for the .root collision: Checkbox.module.css and
    // Field.module.css both declare a `.root` rule in the same layer at the
    // same specificity, and cross-file order is not deterministic under
    // Vite's CSS-module concatenation. Checkbox's bare-mode layout is scoped
    // as `label.root` (type+class), so on Field.Root's element only Field's
    // own layout can apply: display flex (not inline-flex), row direction
    // (data-layout="row"), and no pointer cursor bleeding over the
    // description/error text. Also pins the control-first DOM order (the
    // deliberate divergence from Switch's label-first row: box-left is the
    // checkbox convention, and bare mode already renders control-then-label).
    const screen = await wrap(
      <Checkbox
        label="A"
        description="B"
        error="C"
        classNames={{ root: 'probe-anatomy-root', label: 'probe-anatomy-label' }}
      />,
    );
    const rootEl = screen.container.querySelector('.probe-anatomy-root') as HTMLElement;
    expect(rootEl).not.toBeNull();
    const cs = getComputedStyle(rootEl);
    expect(cs.display).toBe('flex');
    expect(cs.flexDirection).toBe('row');
    expect(cs.cursor).not.toBe('pointer');

    const controlEl = screen.getByRole('checkbox').element();
    const labelEl = screen.container.querySelector('.probe-anatomy-label') as HTMLElement;
    expect(labelEl).not.toBeNull();
    expect(
      controlEl.compareDocumentPosition(labelEl) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('warns in dev when given anatomy props inside a hand-composed Field.Root', async () => {
    // Same warning idiom as Switch.test.tsx's nested-warning case.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const screen = await wrap(
      <Field.Root>
        <Field.Label>Outer</Field.Label>
        <Checkbox label="Inner" description="hint" />
      </Field.Root>,
    );
    expect(warn.mock.calls.some(([msg]) => String(msg).includes('Checkbox'))).toBe(true);
    await expect.element(screen.getByRole('checkbox')).toBeInTheDocument();
    warn.mockRestore();
  });

  it('calls onCheckedChange with the new value on a real click', async () => {
    const onCheckedChange = vi.fn();
    const screen = await wrap(<Checkbox label="Accept" onCheckedChange={onCheckedChange} />);
    await screen.getByRole('checkbox').click();
    expect(onCheckedChange).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it('renders a visible indicator mark only once checked (computed, not emissive)', async () => {
    const screen = await wrap(
      <>
        <Checkbox label="Unchecked" classNames={{ control: 'probe-unchecked' }} />
        <Checkbox
          label="Checked"
          defaultChecked
          classNames={{ control: 'probe-checked', indicator: 'probe-checked-indicator' }}
        />
      </>,
    );

    // Unchecked: Base UI's Indicator does not mount into the DOM at all
    // (keepMounted defaults to false), so there is no indicator element to
    // find under the unchecked control.
    const uncheckedControl = screen.container.querySelector('.probe-unchecked');
    expect(uncheckedControl?.querySelector('svg')).toBeNull();

    // Checked: the indicator mounts, and its computed colour (the checkmark's
    // stroke, via currentColor) is not the fully-transparent initial value.
    const indicator = screen.container.querySelector<HTMLElement>('.probe-checked-indicator');
    expect(indicator).not.toBeNull();
    const color = getComputedStyle(indicator!).color;
    expect(color).not.toBe('');
    expect(color).not.toBe('rgba(0, 0, 0, 0)');
  });

  it('renders a visibly different indicator mark for indeterminate than for checked (computed display, not the same glyph)', async () => {
    // Regression coverage for the fix: indeterminate used to render the same
    // checkmark glyph as checked (ARIA was already correct via
    // aria-checked="mixed", but a sighted user could not tell "some
    // selected" from "all selected"). Both a checkmark and a dash SVG always
    // mount inside the indicator; only one is shown per state via CSS. This
    // asserts computed `display`, not which element happens to exist in the
    // DOM, per the skill's behavioural-over-emissive-assertions rule.
    const screen = await wrap(
      <>
        <Checkbox
          label="Checked"
          defaultChecked
          classNames={{ indicator: 'probe-checked-glyph' }}
        />
        <Checkbox
          label="Indeterminate"
          indeterminate
          classNames={{ indicator: 'probe-indeterminate-glyph' }}
        />
      </>,
    );

    const checkedSvgs = screen.container.querySelectorAll<SVGElement>('.probe-checked-glyph svg');
    const indeterminateSvgs = screen.container.querySelectorAll<SVGElement>(
      '.probe-indeterminate-glyph svg',
    );
    expect(checkedSvgs).toHaveLength(2);
    expect(indeterminateSvgs).toHaveLength(2);

    const visiblePath = (svgs: NodeListOf<SVGElement>) => {
      const visible = Array.from(svgs).filter((svg) => getComputedStyle(svg).display !== 'none');
      expect(visible).toHaveLength(1);
      return visible[0]!.querySelector('path')!.getAttribute('d');
    };

    const checkedPath = visiblePath(checkedSvgs);
    const indeterminatePath = visiblePath(indeterminateSvgs);
    expect(checkedPath).not.toBe(indeterminatePath);
  });

  it('centers the visible glyph in the control at every size, checked and indeterminate (symmetric gaps)', async () => {
    // Regression pin for the off-center check glyph: the SVG element itself
    // is always flex-centered, so this measures the PATH's rendered bounding
    // box (the glyph's actual geometry, scaled through the viewBox) against
    // the control's, modelled on design-ledger/measure.ts's centeringGaps
    // idiom (local copy, not an import: recipes stand alone, same rationale
    // as Dialog.test.tsx's duplicated helpers). Both glyphs coexist in the
    // DOM with CSS toggling visibility off data-indeterminate, so each
    // state's measurement first finds the VISIBLE svg.
    const centeringGaps = (outer: Element, inner: Element) => {
      const o = outer.getBoundingClientRect();
      const i = inner.getBoundingClientRect();
      return {
        left: i.left - o.left,
        right: o.right - i.right,
        top: i.top - o.top,
        bottom: o.bottom - i.bottom,
      };
    };
    const sizes = uiVocabulary.size.values;
    const screen = await wrap(
      <>
        {sizes.map((size) => (
          <Checkbox
            key={`c-${size}`}
            size={size}
            defaultChecked
            label={`checked-${size}`}
            classNames={{
              control: `probe-center-checked-${size}-control`,
              indicator: `probe-center-checked-${size}-indicator`,
            }}
          />
        ))}
        {sizes.map((size) => (
          <Checkbox
            key={`i-${size}`}
            size={size}
            indeterminate
            label={`indeterminate-${size}`}
            classNames={{
              control: `probe-center-indeterminate-${size}-control`,
              indicator: `probe-center-indeterminate-${size}-indicator`,
            }}
          />
        ))}
      </>,
    );

    for (const state of ['checked', 'indeterminate'] as const) {
      for (const size of sizes) {
        const control = screen.container.querySelector(`.probe-center-${state}-${size}-control`);
        const svgs = screen.container.querySelectorAll<SVGElement>(
          `.probe-center-${state}-${size}-indicator svg`,
        );
        const visible = Array.from(svgs).filter((svg) => getComputedStyle(svg).display !== 'none');
        expect(visible, `${state}/${size}: exactly one visible glyph`).toHaveLength(1);
        const path = visible[0]!.querySelector('path')!;
        const gaps = centeringGaps(control!, path);
        expect(
          Math.abs(gaps.left - gaps.right),
          `${state}/${size}: inline gaps asymmetric (left=${gaps.left.toFixed(2)} right=${gaps.right.toFixed(2)})`,
        ).toBeLessThanOrEqual(0.5);
        expect(
          Math.abs(gaps.top - gaps.bottom),
          `${state}/${size}: block gaps asymmetric (top=${gaps.top.toFixed(2)} bottom=${gaps.bottom.toFixed(2)})`,
        ).toBeLessThanOrEqual(0.5);
      }
    }
  });

  it('changes the checked control background with intent (computed, not attribute)', async () => {
    const screen = await wrap(
      <>
        <Checkbox
          label="danger"
          intent="danger"
          defaultChecked
          classNames={{ control: 'probe-danger' }}
        />
        <Checkbox
          label="success"
          intent="success"
          defaultChecked
          classNames={{ control: 'probe-success' }}
        />
      </>,
    );
    const danger = getComputedStyle(
      screen.container.querySelector('.probe-danger')!,
    ).backgroundColor;
    const success = getComputedStyle(
      screen.container.querySelector('.probe-success')!,
    ).backgroundColor;
    expect(danger).not.toBe(success);
  });

  it('threads a size default through Recipe.extend (invariant 1)', async () => {
    // Same shape as Badge.test.tsx's identically-named case: register
    // Checkbox.extend({ defaultProps: { size: 'xl' } }) in a
    // locally-composed theme, and assert its rendered (unset-size)
    // computed control height equals an explicit size="xl" Checkbox's
    // computed control height rendered under the plain uiTheme. If
    // .extend({ defaultProps }) stopped threading, `Big` would fall back to
    // Checkbox's own built-in default size ('md'), and this equality would
    // fail rather than matching by coincidence: 'md' and 'xl' resolve to
    // different CHECKBOX_SIZES entries.
    const Big = Checkbox.extend({ defaultProps: { size: 'xl' } });
    const extendedTheme = createTheme({
      extends: uiTheme,
      components: [Big],
    });

    const extendedScreen = await render(
      <SoribashiProvider theme={extendedTheme}>
        <Checkbox label="Big" classNames={{ control: 'probe-extended' }} />
      </SoribashiProvider>,
    );
    const explicitScreen = await wrap(
      <Checkbox label="Big" size="xl" classNames={{ control: 'probe-explicit-xl' }} />,
    );

    const extendedHeight = getComputedStyle(
      extendedScreen.container.querySelector('.probe-extended')!,
    ).height;
    const explicitHeight = getComputedStyle(
      explicitScreen.container.querySelector('.probe-explicit-xl')!,
    ).height;
    expect(extendedHeight).toBe(explicitHeight);
  });

  it('accepts style props from the builder with no recipe wiring', async () => {
    const screen = await wrap(<Checkbox label="x" classNames={{ root: 'probe-sp' }} m="xl" />);
    const margin = getComputedStyle(screen.container.querySelector('.probe-sp')!).margin;
    expect(margin).not.toBe('0px');
  });

  it('has zero axe violations across its showcase states (intent x size, checked/unchecked/indeterminate/disabled)', async () => {
    const intents = uiVocabulary.intent.values;
    const sizes = uiVocabulary.size.values;

    const screen = await wrap(
      <div>
        {intents.map((intent) =>
          sizes.map((size) => (
            <Checkbox
              key={`${intent}-${size}`}
              intent={intent}
              size={size}
              label={`${intent}-${size}`}
            />
          )),
        )}
        <Checkbox label="checked" defaultChecked />
        <Checkbox label="indeterminate" indeterminate />
        <Checkbox label="disabled" disabled />
      </div>,
    );

    const results = await runAxe(screen.container);
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });
});
