import { createTheme, SoribashiProvider } from '@soribashi/core';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { formatViolations, runAxe } from '../../a11y/axe.ts';
import { contrastRatio, resolveCanvasColor, toRgbString } from '../../a11y/matrix-harness.tsx';
import { uiTheme, uiVocabulary } from '../../theme.ts';
import { Field } from '../Field/Field.tsx';
import { Switch } from './Switch.tsx';

// `render` from vitest-browser-react resolves a Promise<RenderResult> (see
// Checkbox.test.tsx/TextInput.test.tsx); `wrap` awaits it so callers get the
// real result object.
const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={uiTheme}>{ui}</SoribashiProvider>);

/**
 * The structural-equivalence pin (binding, per the task brief): convenience
 * props and hand-composed Field must produce the IDENTICAL accessible
 * anatomy, proven by ONE shared assertion function run against BOTH render
 * shapes (TextInput.test.tsx's own `assertEmailFieldAnatomy` is the template
 * this mirrors, adapted for `role=\"switch\"` instead of `role=\"textbox\"`).
 * `getByRole('switch', { name: 'Notify' })` succeeding at all is itself the
 * label-association proof (an unassociated control has no accessible name),
 * so this doesn't separately re-check the label element's tag name the way
 * TextInput's version does.
 */
async function assertNotifyFieldAnatomy(screen: Awaited<ReturnType<typeof wrap>>) {
  const sw = screen.getByRole('switch', { name: 'Notify' });
  await expect.element(sw).toBeInTheDocument();
  const el = sw.element() as HTMLElement;
  const ids = (el.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
  const describedText = ids.map((id) => document.getElementById(id)?.textContent ?? '').join(' ');
  expect(describedText).toContain('hint');
  expect(describedText).toContain('Required');
}

describe('Switch (browser)', () => {
  it('exposes role="switch" in bare mode with no Field wrapper', async () => {
    const screen = await wrap(<Switch />);
    await expect.element(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('toggles on click and reflects aria-checked', async () => {
    const screen = await wrap(<Switch label="Notify" />);
    const sw = screen.getByRole('switch', { name: 'Notify' });
    await expect.element(sw).toHaveAttribute('aria-checked', 'false');
    await sw.click();
    await expect.element(sw).toHaveAttribute('aria-checked', 'true');
  });

  it('toggles on Space when focused', async () => {
    const screen = await wrap(<Switch label="Notify" />);
    const sw = screen.getByRole('switch', { name: 'Notify' }).element() as HTMLElement;
    sw.focus();
    expect(document.activeElement).toBe(sw);
    await userEvent.keyboard(' ');
    await expect
      .element(screen.getByRole('switch', { name: 'Notify' }))
      .toHaveAttribute('aria-checked', 'true');
  });

  it('toggles when the label text is clicked (association, not proximity)', async () => {
    const screen = await wrap(<Switch label="Notify" />);
    await screen.getByText('Notify').click();
    await expect.element(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('does not toggle when disabled, and never calls the callback', async () => {
    const onCheckedChange = vi.fn();
    const screen = await wrap(<Switch label="No" disabled onCheckedChange={onCheckedChange} />);
    const sw = screen.getByRole('switch');
    await sw.click({ force: true });
    expect(onCheckedChange).not.toHaveBeenCalled();
    await expect.element(sw).toHaveAttribute('aria-checked', 'false');
  });

  it('moves the thumb and changes the track colour when checked (computed)', async () => {
    const screen = await wrap(
      <>
        <Switch
          label="Off"
          classNames={{ control: 'probe-off-control', thumb: 'probe-off-thumb' }}
        />
        <Switch
          label="On"
          defaultChecked
          classNames={{ control: 'probe-on-control', thumb: 'probe-on-thumb' }}
        />
      </>,
    );

    const offControl = screen.container.querySelector('.probe-off-control')!;
    const onControl = screen.container.querySelector('.probe-on-control')!;
    const offBg = getComputedStyle(offControl).backgroundColor;
    const onBg = getComputedStyle(onControl).backgroundColor;
    expect(onBg).not.toBe(offBg);

    const offThumb = screen.container.querySelector('.probe-off-thumb')!;
    const onThumb = screen.container.querySelector('.probe-on-thumb')!;
    const offTransform = getComputedStyle(offThumb).transform;
    const onTransform = getComputedStyle(onThumb).transform;
    expect(onTransform).not.toBe(offTransform);
  });

  it('renders the identical anatomy through convenience props and hand-composed Field', async () => {
    const convenience = await wrap(<Switch label="Notify" description="hint" error="Required" />);
    await assertNotifyFieldAnatomy(convenience);
    // Unmounted before the second render: vitest-browser-react's `getByRole`
    // queries the whole page, not just this render's own container, so two
    // simultaneously-mounted "Notify" switches would be a strict-mode
    // ambiguity, not a real assertion failure.
    await convenience.unmount();

    const composed = await wrap(
      <Field.Root>
        <Field.Label>Notify</Field.Label>
        <Switch />
        <Field.Description>hint</Field.Description>
        <Field.Error match>Required</Field.Error>
      </Field.Root>,
    );
    await assertNotifyFieldAnatomy(composed);
  });

  it('warns in dev when anatomy props are used inside a hand-composed Field, and pins the rendered result', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const screen = await wrap(
      <Field.Root>
        <Field.Label>Outer</Field.Label>
        <Switch label="Inner" />
      </Field.Root>,
    );
    expect(warn.mock.calls.some(([msg]) => String(msg).includes('Switch'))).toBe(true);

    // Pinned, actually-observed behaviour of this contract-violating
    // composition, matching TextInput.test.tsx's/Textarea.test.tsx's own
    // nested-warning case: Switch still renders its OWN internal Field.Root
    // around its "Inner" label/control, nested inside the outer
    // hand-composed Field.Root/"Outer" label. Base UI's field association
    // resolves to the NEAREST enclosing Field context, so the accessible
    // name comes from "Inner", not "Outer".
    await expect.element(screen.getByRole('switch', { name: 'Inner' })).toBeInTheDocument();
    warn.mockRestore();
  });

  it('lays out label beside the control in row anatomy (computed flex-direction)', async () => {
    const screen = await wrap(<Switch label="Notify" classNames={{ root: 'probe-row-root' }} />);
    const rootEl = screen.container.querySelector('.probe-row-root')!;
    expect(getComputedStyle(rootEl).flexDirection).toBe('row');
  });

  it('threads a size default through Recipe.extend (invariant 1)', async () => {
    // Same shape as Badge.test.tsx's/Checkbox.test.tsx's identically-named
    // case: register Switch.extend({ defaultProps: { size: 'xl' } }) in a
    // locally-composed theme, and assert its rendered (unset-size) computed
    // control height equals an explicit size="xl" Switch's computed control
    // height rendered under the plain uiTheme.
    const Big = Switch.extend({ defaultProps: { size: 'xl' } });
    const extendedTheme = createTheme({
      extends: uiTheme,
      components: [Big],
    });

    const extendedScreen = await render(
      <SoribashiProvider theme={extendedTheme}>
        <Switch classNames={{ control: 'probe-extended' }} />
      </SoribashiProvider>,
    );
    const explicitScreen = await wrap(
      <Switch size="xl" classNames={{ control: 'probe-explicit-xl' }} />,
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
    const screen = await wrap(<Switch label="x" classNames={{ root: 'probe-sp' }} m="xl" />);
    const margin = getComputedStyle(screen.container.querySelector('.probe-sp')!).margin;
    expect(margin).not.toBe('0px');
  });

  it('renders the unchecked thumb with real contrast against the canvas, not invisible (fix-wave Critical 1)', async () => {
    // Regression pin, in the style of Button.test.tsx's neutral-wash-
    // distinctness test: the unchecked thumb (Switch.module.css's `.thumb`
    // rule, no `[data-checked]`) draws its visible SVG dot via
    // `color: var(--text-muted)` over a transparent track, so the thumb's
    // computed `color` is what actually paints on the canvas. The prior
    // `color: var(--surface-default)` (near-white) measured ~1.04:1 against
    // the ~98.4%-lightness canvas, effectively invisible in light mode; this
    // pin fails against that value (contrastRatio well under 3) and passes
    // against `--text-muted`, the exact pairing Text.dimmed's SMALL_COVERAGE
    // cells already prove clears AA against this same canvas in both
    // schemes.
    const screen = await wrap(<Switch classNames={{ thumb: 'probe-unchecked-thumb' }} />);
    const thumb = screen.container.querySelector('.probe-unchecked-thumb') as HTMLElement;
    const thumbColor = toRgbString(getComputedStyle(thumb).color);
    const canvasColor = resolveCanvasColor(screen.container as HTMLElement);

    expect(thumbColor).not.toBe(canvasColor);
    // WCAG 1.4.11 non-text contrast floor (a UI component's visible boundary
    // against its background), not the 4.5:1 text floor: the thumb's SVG
    // dot is a graphical control, not text.
    expect(contrastRatio(thumbColor, canvasColor, canvasColor)).toBeGreaterThanOrEqual(3);
  });

  it('has zero axe violations across its showcase states (intent x size, checked, disabled)', async () => {
    const intents = uiVocabulary.intent.values;
    const sizes = uiVocabulary.size.values;

    const screen = await wrap(
      <div>
        {intents.map((intent) =>
          sizes.map((size) => (
            <Switch
              key={`${intent}-${size}`}
              intent={intent}
              size={size}
              label={`${intent}-${size}`}
            />
          )),
        )}
        <Switch label="checked" defaultChecked />
        <Switch label="disabled" disabled />
      </div>,
    );

    const results = await runAxe(screen.container);
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });
});
