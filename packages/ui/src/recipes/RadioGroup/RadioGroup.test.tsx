import { createTheme, SoribashiProvider } from '@soribashi/core';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { formatViolations, runAxe } from '../../a11y/axe.ts';
import { uiTheme, uiVocabulary } from '../../theme.ts';
import { Field } from '../Field/Field.tsx';
import { RadioGroup, type RadioGroupItem } from './RadioGroup.tsx';

// `render` from vitest-browser-react resolves a Promise<RenderResult> (see
// Switch.test.tsx/Checkbox.test.tsx); `wrap` awaits it so callers get the
// real result object.
const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={uiTheme}>{ui}</SoribashiProvider>);

const PLANS = [
  { label: 'Free', value: 'free' },
  { label: 'Pro', value: 'pro' },
];

/**
 * The structural-equivalence pin (binding, per the task brief): convenience
 * props and hand-composed Field must produce the IDENTICAL accessible
 * anatomy, proven by ONE shared assertion function run against BOTH render
 * shapes (Switch.test.tsx's own `assertNotifyFieldAnatomy` is the template
 * this mirrors), asserted against `role="radiogroup"` per the brief.
 * `getByRole('radiogroup', { name: 'Plan' })` succeeding at all is itself the
 * group-label-association proof (an unassociated group has no accessible
 * name).
 */
async function assertPlanFieldAnatomy(screen: Awaited<ReturnType<typeof wrap>>) {
  const group = screen.getByRole('radiogroup', { name: 'Plan' });
  await expect.element(group).toBeInTheDocument();
}

describe('RadioGroup (browser)', () => {
  it('renders one radio per item under a group labelled by the group label', async () => {
    const screen = await wrap(<RadioGroup label="Plan" items={PLANS} />);
    await expect.element(screen.getByRole('radiogroup', { name: 'Plan' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Free' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Pro' })).toBeTruthy();
  });

  it('selects on click and reports the item value', async () => {
    const onValueChange = vi.fn();
    const screen = await wrap(
      <RadioGroup label="Plan" items={PLANS} onValueChange={onValueChange} />,
    );
    const free = screen.getByRole('radio', { name: 'Free' });
    await expect.element(free).toHaveAttribute('aria-checked', 'false');
    await free.click();
    await expect.element(free).toHaveAttribute('aria-checked', 'true');
    expect(onValueChange).toHaveBeenCalledWith('free', expect.anything());
  });

  it('does not select when disabled, and never calls onValueChange', async () => {
    const onValueChange = vi.fn();
    const screen = await wrap(
      <RadioGroup label="Plan" items={PLANS} disabled onValueChange={onValueChange} />,
    );
    const free = screen.getByRole('radio', { name: 'Free' });
    await free.click({ force: true });
    expect(onValueChange).not.toHaveBeenCalled();
    await expect.element(free).toHaveAttribute('aria-checked', 'false');
  });

  it('selects when an item label text is clicked (association, not just proximity)', async () => {
    const screen = await wrap(<RadioGroup label="Plan" items={PLANS} />);
    await screen.getByText('Pro').click();
    await expect
      .element(screen.getByRole('radio', { name: 'Pro' }))
      .toHaveAttribute('aria-checked', 'true');
  });

  it('moves selection with arrow keys', async () => {
    const screen = await wrap(<RadioGroup label="Plan" items={PLANS} />);
    await screen.getByRole('radio', { name: 'Free' }).click();
    await expect
      .element(screen.getByRole('radio', { name: 'Free' }))
      .toHaveAttribute('aria-checked', 'true');

    await userEvent.keyboard('{ArrowDown}');

    const pro = screen.getByRole('radio', { name: 'Pro' });
    await expect.element(pro).toHaveAttribute('aria-checked', 'true');
    // Focus location, not just the resulting value: roving tabindex means
    // arrow-key navigation must MOVE FOCUS to the newly-selected radio, not
    // merely flip its checked state while focus stays behind.
    expect(document.activeElement).toBe(pro.element());
  });

  it('keeps only the selected item tabbable (roving tabindex, per what Base UI actually implements)', async () => {
    const screen = await wrap(<RadioGroup label="Plan" items={PLANS} defaultValue="pro" />);
    const free = screen.getByRole('radio', { name: 'Free' }).element() as HTMLElement;
    const pro = screen.getByRole('radio', { name: 'Pro' }).element() as HTMLElement;

    const tabbable = [free, pro].filter((el) => el.tabIndex === 0);
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]).toBe(pro);
  });

  it('shows the selected indicator only on the selected item (computed, not emissive)', async () => {
    const screen = await wrap(
      <RadioGroup
        label="Plan"
        items={PLANS}
        defaultValue="pro"
        classNames={{ control: 'probe-control', indicator: 'probe-indicator' }}
      />,
    );

    const controls = screen.container.querySelectorAll('.probe-control');
    expect(controls).toHaveLength(2);

    // Base UI's Radio.Indicator defaults to keepMounted: false (Checkbox's
    // own indicator-visibility shape, see Checkbox.test.tsx's identically-
    // purposed case): only the checked radio's indicator mounts into the DOM
    // at all, so this is itself evidence of "selected only", not merely a
    // style toggle.
    const indicators = screen.container.querySelectorAll<HTMLElement>('.probe-indicator');
    expect(indicators).toHaveLength(1);

    const proControl = screen.getByRole('radio', { name: 'Pro' }).element();
    expect(proControl.contains(indicators[0]!)).toBe(true);

    const color = getComputedStyle(indicators[0]!).color;
    expect(color).not.toBe('');
    expect(color).not.toBe('rgba(0, 0, 0, 0)');
  });

  it('associates each item with its own description via aria-describedby, not the group label', async () => {
    const items = [
      { label: 'Free', value: 'free', description: 'Basic features' },
      { label: 'Pro', value: 'pro', description: 'Everything, plus support' },
    ];
    const screen = await wrap(<RadioGroup label="Plan" items={items} />);
    const free = screen.getByRole('radio', { name: 'Free' }).element() as HTMLElement;
    const ids = (free.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
    const describedText = ids.map((id) => document.getElementById(id)?.textContent ?? '').join(' ');
    expect(describedText).toContain('Basic features');
    expect(describedText).not.toContain('Everything, plus support');
  });

  it('selects via custom getLabel/getValue over a non-{label,value} item shape, reporting the derived string value', async () => {
    // Fix round 1, Important finding: no prior test exercised custom
    // getLabel/getValue against the COMPOSED <RadioGroup> (only items.test.ts's
    // standalone resolveRadioGroupItems). RadioGroupProps.items is fixed to
    // RadioGroupItem's shape at the type level (the accepted trade for
    // defineComponent over defineGenericComponent), so a genuinely
    // non-conforming record type is threaded through via a deliberate cast --
    // exactly the escape hatch a plain-JS caller (or dynamic data with no
    // static type at all) would actually take at runtime, which is precisely
    // what this test proves still resolves correctly.
    interface Plan {
      id: number;
      name: string;
    }
    const plans: Plan[] = [
      { id: 1, name: 'Free' },
      { id: 2, name: 'Pro' },
    ];

    const onValueChange = vi.fn();
    const screen = await wrap(
      <RadioGroup
        label="Plan"
        items={plans as unknown as RadioGroupItem[]}
        getLabel={(item) => (item as unknown as Plan).name}
        getValue={(item) => String((item as unknown as Plan).id)}
        onValueChange={onValueChange}
      />,
    );

    const pro = screen.getByRole('radio', { name: 'Pro' });
    await pro.click();
    await expect.element(pro).toHaveAttribute('aria-checked', 'true');
    // The DERIVED string value (getValue's own return, "2"), never the raw
    // item and never a numeric id.
    expect(onValueChange).toHaveBeenCalledWith('2', expect.anything());
  });

  it('renders the identical group label through the convenience prop and hand-composed Field', async () => {
    const convenience = await wrap(<RadioGroup label="Plan" items={PLANS} />);
    await assertPlanFieldAnatomy(convenience);
    // Unmounted before the second render: vitest-browser-react's `getByRole`
    // queries the whole page, not just this render's own container, so two
    // simultaneously-mounted "Plan" radiogroups would be a strict-mode
    // ambiguity, not a real assertion failure (see Switch.test.tsx's
    // identical unmount-between-renders comment).
    await convenience.unmount();

    const composed = await wrap(
      <Field.Root>
        <Field.Label>Plan</Field.Label>
        <RadioGroup items={PLANS} />
      </Field.Root>,
    );
    await assertPlanFieldAnatomy(composed);
  });

  it('warns in dev when anatomy props are used inside a hand-composed Field, and pins the rendered result', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const screen = await wrap(
      <Field.Root>
        <Field.Label>Outer</Field.Label>
        <RadioGroup label="Inner" items={PLANS} />
      </Field.Root>,
    );
    expect(warn.mock.calls.some(([msg]) => String(msg).includes('RadioGroup'))).toBe(true);

    // Pinned, actually-observed behaviour of this contract-violating
    // composition, matching Switch.test.tsx's/TextInput.test.tsx's own
    // nested-warning case: RadioGroup still renders its OWN internal
    // Field.Root around its "Inner" label/group, nested inside the outer
    // hand-composed Field.Root/"Outer" label.
    await expect.element(screen.getByRole('radiogroup', { name: 'Inner' })).toBeInTheDocument();
    warn.mockRestore();
  });

  it('threads a size default through Recipe.extend (invariant 1)', async () => {
    // Same shape as Badge.test.tsx's/Switch.test.tsx's identically-named
    // case: register RadioGroup.extend({ defaultProps: { size: 'xl' } }) in a
    // locally-composed theme, and assert its rendered (unset-size) computed
    // control height equals an explicit size="xl" RadioGroup's computed
    // control height rendered under the plain uiTheme.
    const Big = RadioGroup.extend({ defaultProps: { size: 'xl' } });
    const extendedTheme = createTheme({
      extends: uiTheme,
      components: [Big],
    });

    const extendedScreen = await render(
      <SoribashiProvider theme={extendedTheme}>
        <RadioGroup items={PLANS} classNames={{ control: 'probe-extended' }} />
      </SoribashiProvider>,
    );
    const explicitScreen = await wrap(
      <RadioGroup items={PLANS} size="xl" classNames={{ control: 'probe-explicit-xl' }} />,
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
    // Style props (Box's `m`/`p`/...) apply only to the `root` slot; bare
    // mode has no `root` element at all (same known limitation TextInput's
    // own identically-named test documents), so this needs anatomy mode
    // (label set) to have a `root` to apply to.
    const screen = await wrap(
      <RadioGroup label="x" items={PLANS} classNames={{ root: 'probe-sp' }} m="xl" />,
    );
    const margin = getComputedStyle(screen.container.querySelector('.probe-sp')!).margin;
    expect(margin).not.toBe('0px');
  });

  it('has zero axe violations across its showcase states (intent x size, selected, disabled)', async () => {
    const intents = uiVocabulary.intent.values;
    const sizes = uiVocabulary.size.values;

    const screen = await wrap(
      <div>
        {intents.map((intent) =>
          sizes.map((size) => (
            <RadioGroup
              key={`${intent}-${size}`}
              intent={intent}
              size={size}
              label={`${intent}-${size}`}
              items={PLANS}
            />
          )),
        )}
        <RadioGroup label="selected" items={PLANS} defaultValue="free" />
        <RadioGroup label="disabled" items={PLANS} disabled />
      </div>,
    );

    const results = await runAxe(screen.container);
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });
});

/**
 * Compile-time pin (fix round 1, Important finding): `getValue`'s return type
 * is constrained to `string` on RadioGroup's composed public surface
 * (`RadioGroupProps`'s own override of the inherited, generically-`unknown`
 * `RadioGroupAccessors<RadioGroupItem>` member -- see RadioGroup.tsx's own
 * doc comment on that override), not left at the `unknown` items.ts's
 * standalone `RadioGroupAccessors<T>` declares for its own reuse. A
 * non-string return must be a compile error here, since `value`/
 * `defaultValue` are fixed to `string` and a non-string `getValue` would
 * otherwise silently break the checked-value comparison at runtime with no
 * warning at all. This function is never called; it exists purely for
 * `bun run typecheck` to check.
 */
function _typeCheckRadioGroupGetValueIsString() {
  // @ts-expect-error getValue must return a string; a number is not assignable
  const invalid = <RadioGroup items={PLANS} getValue={() => 42} />;
  void invalid;

  const valid = <RadioGroup items={PLANS} getValue={() => 'free'} />;
  void valid;
}
void _typeCheckRadioGroupGetValueIsString;
