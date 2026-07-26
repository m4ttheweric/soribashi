import { createTheme, SoribashiProvider } from '@soribashi/core';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { formatViolations, runAxe } from '../../a11y/axe.ts';
import { uiTheme, uiVocabulary } from '../../theme.ts';
import { Field } from '../Field/Field.tsx';
import { TextInput } from './TextInput.tsx';

// `render` from vitest-browser-react resolves a Promise<RenderResult> (see
// Checkbox.test.tsx); `wrap` awaits it so callers get the real result object.
const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={uiTheme}>{ui}</SoribashiProvider>);

/**
 * The structural-equivalence pin (binding, per the task brief): convenience
 * props and hand-composed Field must produce the IDENTICAL accessible
 * anatomy. Both call sites below render an "Email" field with a "hint"
 * description and a "Required" error; this single assertion function runs
 * against BOTH renders so the two modes cannot silently drift apart.
 */
async function assertEmailFieldAnatomy(screen: Awaited<ReturnType<typeof wrap>>) {
  const input = screen.getByRole('textbox', { name: 'Email' });
  await expect.element(input).toBeInTheDocument();
  const el = input.element() as HTMLInputElement;
  const ids = (el.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
  const describedText = ids.map((id) => document.getElementById(id)?.textContent ?? '').join(' ');
  expect(describedText).toContain('hint');
  expect(describedText).toContain('Required');
  const labelEl = screen.getByText('Email').element();
  expect(labelEl.tagName).toBe('LABEL');
}

describe('TextInput (browser)', () => {
  it('types into an uncontrolled input and reports changes', async () => {
    const screen = await wrap(<TextInput label="Name" />);
    const input = screen.getByRole('textbox', { name: 'Name' });
    await input.fill('Ada');
    await expect.element(input).toHaveValue('Ada');
  });

  it('honours a controlled value', async () => {
    const onValueChange = vi.fn();
    const screen = await wrap(
      <TextInput label="Name" value="fixed" onValueChange={onValueChange} />,
    );
    const input = screen.getByRole('textbox', { name: 'Name' });
    await input.fill('changed');
    // Controlled: the DOM value snaps back to the `value` prop regardless of
    // the attempted edit, but the change callback still reports the attempt.
    await expect.element(input).toHaveValue('fixed');
    expect(onValueChange).toHaveBeenCalled();
  });

  it('focuses the input when the label is clicked', async () => {
    const screen = await wrap(<TextInput label="Name" />);
    await screen.getByText('Name').click();
    await expect.element(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus();
  });

  it('blocks input when disabled', async () => {
    const screen = await wrap(<TextInput label="Name" disabled />);
    const input = screen.getByRole('textbox', { name: 'Name' });
    await input.fill('nope', { force: true });
    await expect.element(input).toHaveValue('');
  });

  it('renders error in the danger colour and associates it (computed + aria-describedby)', async () => {
    const screen = await wrap(
      <TextInput
        label="Email"
        description="hint"
        error="Required"
        classNames={{ description: 'probe-desc', error: 'probe-err' }}
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Email' }).element() as HTMLInputElement;
    const ids = (input.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
    const describedText = ids.map((id) => document.getElementById(id)?.textContent ?? '').join(' ');
    expect(describedText).toContain('Required');

    const err = getComputedStyle(screen.container.querySelector('.probe-err')!).color;
    const desc = getComputedStyle(screen.container.querySelector('.probe-desc')!).color;
    expect(err).not.toBe(desc);

    // The `invalid` mechanism confirmed at implementation time (Input.d.ts /
    // InputDataAttributes.d.ts): TextInput sets `invalid` on its internal
    // Field.Root when `error != null`, and Base UI propagates the real
    // `data-invalid` attribute down onto the `<input>` itself.
    expect(input.getAttribute('data-invalid')).not.toBeNull();
  });

  it('renders the identical anatomy through convenience props and hand-composed Field', async () => {
    const convenience = await wrap(<TextInput label="Email" description="hint" error="Required" />);
    await assertEmailFieldAnatomy(convenience);
    // Unmounted before the second render: vitest-browser-react's `getByRole`
    // queries the whole page, not just this render's own container, so two
    // simultaneously-mounted "Email" fields would be a strict-mode
    // ambiguity, not a real assertion failure.
    await convenience.unmount();

    const composed = await wrap(
      <Field.Root>
        <Field.Label>Email</Field.Label>
        <TextInput />
        <Field.Description>hint</Field.Description>
        <Field.Error match>Required</Field.Error>
      </Field.Root>,
    );
    await assertEmailFieldAnatomy(composed);
  });

  it('warns in dev when anatomy props are used inside a hand-composed Field, and pins the rendered result', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const screen = await wrap(
      <Field.Root>
        <Field.Label>Outer</Field.Label>
        <TextInput label="Inner" />
      </Field.Root>,
    );
    expect(warn.mock.calls.some(([msg]) => String(msg).includes('TextInput'))).toBe(true);

    // Pinned, actually-observed behaviour of this contract-violating
    // composition (not a design choice this test enforces): TextInput still
    // renders its OWN internal Field.Root around its "Inner" label/control,
    // nested inside the outer hand-composed Field.Root/"Outer" label. Base
    // UI's field association resolves to the NEAREST enclosing Field context,
    // which is TextInput's own inner Field.Root, so the control's accessible
    // name comes from "Inner", not "Outer". A future Base UI upgrade that
    // changes this nested-context resolution fails loudly here rather than
    // silently.
    const input = screen.getByRole('textbox').element() as HTMLInputElement;
    expect(input).toBeTruthy();
    await expect.element(screen.getByRole('textbox', { name: 'Inner' })).toBeInTheDocument();
    warn.mockRestore();
  });

  it('grows in height across the size vocabulary (computed)', async () => {
    const screen = await wrap(
      <>
        <TextInput size="xs" classNames={{ input: 'probe-xs' }} />
        <TextInput size="xl" classNames={{ input: 'probe-xl' }} />
      </>,
    );
    const xs = parseFloat(getComputedStyle(screen.container.querySelector('.probe-xs')!).height);
    const xl = parseFloat(getComputedStyle(screen.container.querySelector('.probe-xl')!).height);
    expect(xl).toBeGreaterThan(xs);
  });

  it('threads a size default through Recipe.extend (invariant 1)', async () => {
    // Same shape as Badge.test.tsx/Checkbox.test.tsx's identically-named
    // case: register TextInput.extend({ defaultProps: { size: 'xl' } }) in a
    // locally-composed theme, and assert its rendered (unset-size) computed
    // height equals an explicit size="xl" TextInput's computed height
    // rendered under the plain uiTheme.
    const Big = TextInput.extend({ defaultProps: { size: 'xl' } });
    const extendedTheme = createTheme({
      extends: uiTheme,
      components: [Big],
    });

    const extendedScreen = await render(
      <SoribashiProvider theme={extendedTheme}>
        <TextInput classNames={{ input: 'probe-extended' }} />
      </SoribashiProvider>,
    );
    const explicitScreen = await wrap(
      <TextInput size="xl" classNames={{ input: 'probe-explicit-xl' }} />,
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
    // mirroring Select's), so this needs anatomy mode to have a `root` to
    // apply to.
    const screen = await wrap(<TextInput label="x" classNames={{ root: 'probe-sp' }} m="xl" />);
    const margin = getComputedStyle(screen.container.querySelector('.probe-sp')!).margin;
    expect(margin).not.toBe('0px');
  });

  it('has zero axe violations across its showcase states (sizes, error, disabled)', async () => {
    const sizes = uiVocabulary.size.values;

    const screen = await wrap(
      <div>
        {sizes.map((size) => (
          <TextInput key={size} size={size} label={`size-${size}`} />
        ))}
        <TextInput label="With error" error="Required" />
        <TextInput label="Disabled" disabled />
      </div>,
    );

    const results = await runAxe(screen.container);
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });
});
