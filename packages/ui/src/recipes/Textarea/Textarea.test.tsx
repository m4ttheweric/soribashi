import { createTheme, SoribashiProvider } from '@soribashi/core';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { formatViolations, runAxe } from '../../a11y/axe.ts';
import { uiTheme, uiVocabulary } from '../../theme.ts';
import { Field } from '../Field/Field.tsx';
import { Textarea } from './Textarea.tsx';

// `render` from vitest-browser-react resolves a Promise<RenderResult> (see
// TextInput.test.tsx); `wrap` awaits it so callers get the real result
// object.
const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={uiTheme}>{ui}</SoribashiProvider>);

/**
 * The structural-equivalence pin (binding, per the task brief): convenience
 * props and hand-composed Field must produce the IDENTICAL accessible
 * anatomy. Both call sites below render a "Bio" field with a "hint"
 * description and a "Required" error; this single assertion function runs
 * against BOTH renders so the two modes cannot silently drift apart. Adjusted
 * from TextInput.test.tsx's identically-named helper for a multiline
 * control: the underlying element must be a real TEXTAREA, not an INPUT.
 */
async function assertBioFieldAnatomy(screen: Awaited<ReturnType<typeof wrap>>) {
  const box = screen.getByRole('textbox', { name: 'Bio' });
  await expect.element(box).toBeInTheDocument();
  const el = box.element() as HTMLTextAreaElement;
  expect(el.tagName).toBe('TEXTAREA');
  const ids = (el.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
  const describedText = ids.map((id) => document.getElementById(id)?.textContent ?? '').join(' ');
  expect(describedText).toContain('hint');
  expect(describedText).toContain('Required');
  const labelEl = screen.getByText('Bio').element();
  expect(labelEl.tagName).toBe('LABEL');
}

describe('Textarea (browser)', () => {
  it('renders a real multiline control and types into it', async () => {
    const screen = await wrap(<Textarea label="Bio" />);
    const box = screen.getByRole('textbox', { name: 'Bio' });
    expect((box.element() as HTMLElement).tagName).toBe('TEXTAREA');
    await box.fill('line one');
    await expect.element(box).toHaveValue('line one');
  });

  it('honours a controlled value', async () => {
    const onValueChange = vi.fn();
    const screen = await wrap(<Textarea label="Bio" value="fixed" onValueChange={onValueChange} />);
    const box = screen.getByRole('textbox', { name: 'Bio' });
    await box.fill('changed');
    // Controlled: the DOM value snaps back to the `value` prop regardless of
    // the attempted edit, but the change callback still reports the attempt.
    await expect.element(box).toHaveValue('fixed');
    expect(onValueChange).toHaveBeenCalled();
  });

  it('focuses the textarea when the label is clicked', async () => {
    const screen = await wrap(<Textarea label="Bio" />);
    await screen.getByText('Bio').click();
    await expect.element(screen.getByRole('textbox', { name: 'Bio' })).toHaveFocus();
  });

  it('blocks input when disabled', async () => {
    const screen = await wrap(<Textarea label="Bio" disabled />);
    const box = screen.getByRole('textbox', { name: 'Bio' });
    await box.fill('nope', { force: true });
    await expect.element(box).toHaveValue('');
  });

  it('associates description and error and renders error in the danger colour', async () => {
    const screen = await wrap(
      <Textarea
        label="Bio"
        description="hint"
        error="Required"
        classNames={{ description: 'probe-desc', error: 'probe-err' }}
      />,
    );
    const box = screen.getByRole('textbox', { name: 'Bio' }).element() as HTMLTextAreaElement;
    const ids = (box.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
    const describedText = ids.map((id) => document.getElementById(id)?.textContent ?? '').join(' ');
    expect(describedText).toContain('Required');

    const err = getComputedStyle(screen.container.querySelector('.probe-err')!).color;
    const desc = getComputedStyle(screen.container.querySelector('.probe-desc')!).color;
    expect(err).not.toBe(desc);

    // The `invalid` mechanism confirmed at TextInput's implementation time
    // (Input.d.ts / InputDataAttributes.d.ts), reused unchanged here: Textarea
    // sets `invalid` on its internal Field.Root when `error != null`, and
    // Base UI propagates the real `data-invalid` attribute down onto the
    // mounted `<textarea>` itself even through the `render={<textarea />}`
    // route (Step 1's chosen mechanism).
    expect(box.getAttribute('data-invalid')).not.toBeNull();
  });

  it('renders the identical anatomy through convenience props and hand-composed Field', async () => {
    const convenience = await wrap(<Textarea label="Bio" description="hint" error="Required" />);
    await assertBioFieldAnatomy(convenience);
    // Unmounted before the second render: vitest-browser-react's `getByRole`
    // queries the whole page, not just this render's own container, so two
    // simultaneously-mounted "Bio" fields would be a strict-mode ambiguity,
    // not a real assertion failure.
    await convenience.unmount();

    const composed = await wrap(
      <Field.Root>
        <Field.Label>Bio</Field.Label>
        <Textarea />
        <Field.Description>hint</Field.Description>
        <Field.Error match>Required</Field.Error>
      </Field.Root>,
    );
    await assertBioFieldAnatomy(composed);
  });

  it('warns in dev when anatomy props are used inside a hand-composed Field, and pins the rendered result', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const screen = await wrap(
      <Field.Root>
        <Field.Label>Outer</Field.Label>
        <Textarea label="Inner" />
      </Field.Root>,
    );
    expect(warn.mock.calls.some(([msg]) => String(msg).includes('Textarea'))).toBe(true);

    // Pinned, actually-observed behaviour of this contract-violating
    // composition (not a design choice this test enforces), same as
    // TextInput's identically-named case: Textarea still renders its OWN
    // internal Field.Root around its "Inner" label/control, nested inside the
    // outer hand-composed Field.Root/"Outer" label. Base UI's field
    // association resolves to the NEAREST enclosing Field context, which is
    // Textarea's own inner Field.Root, so the control's accessible name comes
    // from "Inner", not "Outer".
    const box = screen.getByRole('textbox').element() as HTMLTextAreaElement;
    expect(box).toBeTruthy();
    await expect.element(screen.getByRole('textbox', { name: 'Inner' })).toBeInTheDocument();
    warn.mockRestore();
  });

  it('respects rows (computed height grows with rows)', async () => {
    const screen = await wrap(
      <>
        <Textarea rows={2} classNames={{ textarea: 'probe-rows-2' }} />
        <Textarea rows={6} classNames={{ textarea: 'probe-rows-6' }} />
      </>,
    );
    const short = parseFloat(
      getComputedStyle(screen.container.querySelector('.probe-rows-2')!).height,
    );
    const tall = parseFloat(
      getComputedStyle(screen.container.querySelector('.probe-rows-6')!).height,
    );
    expect(tall).toBeGreaterThan(short);
  });

  it('grows minimum height across the size vocabulary (computed)', async () => {
    const screen = await wrap(
      <>
        <Textarea size="xs" classNames={{ textarea: 'probe-xs' }} />
        <Textarea size="xl" classNames={{ textarea: 'probe-xl' }} />
      </>,
    );
    const xs = parseFloat(getComputedStyle(screen.container.querySelector('.probe-xs')!).height);
    const xl = parseFloat(getComputedStyle(screen.container.querySelector('.probe-xl')!).height);
    expect(xl).toBeGreaterThan(xs);
  });

  it('threads a size default through Recipe.extend (invariant 1)', async () => {
    // Same shape as TextInput.test.tsx's identically-named case: register
    // Textarea.extend({ defaultProps: { size: 'xl' } }) in a locally-composed
    // theme, and assert its rendered (unset-size) computed height equals an
    // explicit size="xl" Textarea's computed height rendered under the plain
    // uiTheme.
    const Big = Textarea.extend({ defaultProps: { size: 'xl' } });
    const extendedTheme = createTheme({
      extends: uiTheme,
      components: [Big],
    });

    const extendedScreen = await render(
      <SoribashiProvider theme={extendedTheme}>
        <Textarea classNames={{ textarea: 'probe-extended' }} />
      </SoribashiProvider>,
    );
    const explicitScreen = await wrap(
      <Textarea size="xl" classNames={{ textarea: 'probe-explicit-xl' }} />,
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
    // Style props (Box's `m`/`p`/...) are applied only to the `root` slot
    // (see the authoring skill's style-props section); bare mode has no
    // `root` element at all (the module doc comment's known limitation,
    // mirroring TextInput's), so this needs anatomy mode to have a `root` to
    // apply to.
    const screen = await wrap(<Textarea label="x" classNames={{ root: 'probe-sp' }} m="xl" />);
    const margin = getComputedStyle(screen.container.querySelector('.probe-sp')!).margin;
    expect(margin).not.toBe('0px');
  });

  it('shows a focus ring distinct from the resting border colour (fix-wave Critical 2, computed)', async () => {
    // Regression pin, identical shape to TextInput.test.tsx's own case:
    // `--accent-primary` is emitted by no theme in this repo, so the
    // `:focus-visible` rule's fallback always applies. The fallback used to
    // be `var(--border-default)`, the SAME token the resting border already
    // reads, making the focused outline compute identical to the unfocused
    // border. Fixed to `var(--text-default)`, Tabs'/Accordion's established
    // choice for this same fallback.
    const screen = await wrap(
      <Textarea label="Bio" classNames={{ textarea: 'probe-focus-textarea' }} />,
    );
    const box = screen.container.querySelector('.probe-focus-textarea') as HTMLTextAreaElement;
    const restingBorderColor = getComputedStyle(box).borderColor;
    box.focus();
    expect(getComputedStyle(box).outlineStyle).toBe('solid');
    expect(getComputedStyle(box).outlineColor).not.toBe(restingBorderColor);
  });

  it('has zero axe violations across its showcase states (sizes, error, disabled)', async () => {
    const sizes = uiVocabulary.size.values;

    const screen = await wrap(
      <div>
        {sizes.map((size) => (
          <Textarea key={size} size={size} label={`size-${size}`} />
        ))}
        <Textarea label="With error" error="Required" />
        <Textarea label="Disabled" disabled />
      </div>,
    );

    const results = await runAxe(screen.container);
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });
});
