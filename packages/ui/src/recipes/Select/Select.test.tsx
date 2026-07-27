import { createTheme, SoribashiProvider } from '@soribashi/core';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { formatViolations, runAxe } from '../../a11y/axe.ts';
import { installNoTransitionStyle, NO_TRANSITION_CLASS } from '../../a11y/matrix-harness.tsx';
import { uiTheme } from '../../theme.ts';
import { Select } from './Select.tsx';

const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={uiTheme}>{ui}</SoribashiProvider>);

interface Fruit {
  label: string;
  value: string;
}

const FRUITS: Fruit[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry' },
];

interface Grouped {
  label: string;
  value: string;
  group: string;
}

const GROUPED_ITEMS: Grouped[] = [
  { label: 'Apple', value: 'apple', group: 'Fruit' },
  { label: 'Carrot', value: 'carrot', group: 'Vegetable' },
  { label: 'Banana', value: 'banana', group: 'Fruit' },
];

describe('Select (browser)', () => {
  it('opens on trigger click and lists every item', async () => {
    const screen = await wrap(<Select items={FRUITS} placeholder="Pick a fruit" />);

    await screen.getByRole('combobox').click();

    await expect.element(screen.getByRole('option', { name: 'Apple' })).toBeVisible();
    await expect.element(screen.getByRole('option', { name: 'Banana' })).toBeVisible();
    await expect.element(screen.getByRole('option', { name: 'Cherry' })).toBeVisible();
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const screen = await wrap(<Select items={FRUITS} placeholder="Pick a fruit" />);

    const trigger = screen.getByRole('combobox');
    await trigger.click();
    await expect.element(screen.getByRole('option', { name: 'Apple' })).toBeVisible();

    await userEvent.keyboard('{Escape}');

    await expect.element(screen.getByRole('option', { name: 'Apple' })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger.element());
  });

  it('selects with ArrowDown then Enter, and reports the item value to onValueChange', async () => {
    const onValueChange = vi.fn();
    const screen = await wrap(
      <Select items={FRUITS} placeholder="Pick a fruit" onValueChange={onValueChange} />,
    );

    await screen.getByRole('combobox').click();
    await expect.element(screen.getByRole('option', { name: 'Apple' })).toBeVisible();

    // Base UI's first ArrowDown after opening highlights the first item
    // (Apple) without moving past it; a second ArrowDown is what actually
    // advances the highlight to the next item (Banana). Confirmed against
    // this Select's real runtime behavior, not assumed from memory.
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');

    expect(onValueChange).toHaveBeenCalledWith('banana', expect.anything());
    await expect.element(screen.getByRole('combobox')).toHaveTextContent('Banana');
  });

  it('supports typeahead', async () => {
    const onValueChange = vi.fn();
    const screen = await wrap(
      <Select items={FRUITS} placeholder="Pick a fruit" onValueChange={onValueChange} />,
    );

    await screen.getByRole('combobox').click();
    await expect.element(screen.getByRole('option', { name: 'Cherry' })).toBeVisible();

    await userEvent.keyboard('c');
    await userEvent.keyboard('{Enter}');

    expect(onValueChange).toHaveBeenCalledWith('cherry', expect.anything());
  });

  it('renders group labels above their items, in DOM order (not just all visible)', async () => {
    const screen = await wrap(
      <Select items={GROUPED_ITEMS} getGroup={(i) => i.group} placeholder="Pick" />,
    );

    await screen.getByRole('combobox').click();

    await expect.element(screen.getByText('Fruit')).toBeVisible();
    await expect.element(screen.getByText('Vegetable')).toBeVisible();
    await expect.element(screen.getByRole('option', { name: 'Apple' })).toBeVisible();
    await expect.element(screen.getByRole('option', { name: 'Carrot' })).toBeVisible();

    // Fix round 1, Minor finding: the assertions above alone would pass even
    // if rendering order were scrambled ("all visible" is not "in order").
    // Read every leaf text node inside the listbox, in real DOM order, and
    // assert group labels precede their own items: "Fruit" (group order by
    // first appearance) before "Apple"/"Banana", then "Vegetable" before
    // "Carrot" -- the exact shape resolveSelectItems's node-tier test
    // (items.test.ts) already proves for the pure resolution, now proven
    // for what actually reaches the DOM.
    const listbox = screen.getByRole('listbox').element();
    const leafTexts = Array.from(listbox.querySelectorAll('*'))
      .filter((el) => el.children.length === 0 && el.textContent?.trim())
      .map((el) => el.textContent?.trim());

    expect(leafTexts).toEqual(['Fruit', 'Apple', 'Banana', 'Vegetable', 'Carrot']);
  });

  it('renders the popup inside `container` when given one (scoped-theme escape)', async () => {
    // A scoped theme wrapper, the way apps/workshop's multi-tenant demo
    // scopes a `.tenant-*`/`.dark` subtree: `--surface-default` overridden
    // locally so the popup, if it actually re-anchors inside this subtree,
    // picks up the override instead of the ambient (light) theme value.
    const scopeEl = document.createElement('div');
    scopeEl.className = 'dark';
    scopeEl.style.setProperty('--surface-default', 'oklch(0.2 0 0)');
    document.body.appendChild(scopeEl);

    const screen = await wrap(
      <Select
        items={FRUITS}
        placeholder="Pick a fruit"
        container={scopeEl}
        classNames={{ popup: 'select-popup-probe' }}
      />,
    );

    await screen.getByRole('combobox').click();
    await expect.element(screen.getByRole('option', { name: 'Apple' })).toBeVisible();

    // The `role="listbox"` element is `Select.List` (a child of the popup),
    // not the popup itself (Select.module.css's `.popup` rule is what
    // actually paints the surface background), so the popup is found by its
    // own tagged class rather than by role.
    const popup = scopeEl.querySelector('.select-popup-probe');
    expect(popup).not.toBeNull();
    expect(scopeEl.contains(popup)).toBe(true);

    const probe = document.createElement('div');
    probe.style.backgroundColor = 'var(--surface-default)';
    scopeEl.appendChild(probe);
    const scopedBackground = getComputedStyle(probe).backgroundColor;
    probe.remove();

    const popupBackground = getComputedStyle(popup as HTMLElement).backgroundColor;
    expect(popupBackground).toBe(scopedBackground);

    scopeEl.remove();
  });

  it('has zero axe violations for an open select with grouped items', async () => {
    // The popup's enter transition (Select.module.css's `.popup`) is still
    // running at the instant `toBeVisible()` resolves: axe-core would sample
    // a mid-transition, partially-transparent surface, which axe-core skips
    // for colour checks -- making the assertion below near-vacuous rather
    // than a real check of the popup's colours.
    //
    // Two independent things have to happen before the popup is safe to
    // measure, not one:
    //
    // 1. The CSS transition itself has to be disabled (the shared
    //    `installNoTransitionStyle` mechanism, matrix-harness.tsx, built for
    //    the contrast grids), so that once Base UI flips away from its
    //    mount-entry state the popup jumps straight to its final opacity
    //    instead of spending another 150ms animating toward it.
    // 2. Base UI's own `[data-starting-style]` mount-entry state has to
    //    actually clear. That flip is driven by `useTransitionStatus`
    //    (`@base-ui/react/internals/useTransitionStatus.js`), which sets
    //    `transitionStatus: 'starting'` synchronously on mount and clears it
    //    on the *next animation frame* via `AnimationFrame.request` -- a real
    //    frame boundary, independent of any CSS transition duration.
    //    `toBeVisible()` does not wait on this: measured directly, disabling
    //    the transition alone still left the popup at `opacity: 0` in a
    //    reproducible fraction of runs, because the assertion ran before
    //    that animation frame had fired. Polling for the settled state (not
    //    asserting it once) is what actually closes the race.
    const localContainer = document.createElement('div');
    document.body.appendChild(localContainer);
    const removeNoTransitionStyle = installNoTransitionStyle();
    localContainer.classList.add(NO_TRANSITION_CLASS);

    const screen = await wrap(
      <Select
        items={GROUPED_ITEMS}
        getGroup={(i) => i.group}
        placeholder="Pick"
        container={localContainer}
      />,
    );

    await screen.getByRole('combobox').click();
    await expect.element(screen.getByRole('option', { name: 'Apple' })).toBeVisible();

    // `Select.Popup` is the immediate parent of the `role="listbox"` element
    // (Select.tsx's part tree: Popup > List) and is the element
    // Select.module.css's `.popup` transition rule targets.
    const popup = screen.getByRole('listbox').element().parentElement as HTMLElement;
    expect(popup).not.toBeNull();
    await vi.waitFor(
      () => {
        expect(popup.hasAttribute('data-starting-style')).toBe(false);
        expect(getComputedStyle(popup).opacity).toBe('1');
      },
      { timeout: 1000, interval: 10 },
    );

    const results = await runAxe(localContainer);
    expect(results.violations, formatViolations(results.violations)).toEqual([]);

    removeNoTransitionStyle();
    localContainer.remove();
  });

  it('threads a size default through Recipe.extend (invariant 1)', async () => {
    // Same shape as Badge.test.tsx's identically-named case: register
    // Select.extend({ defaultProps: { size: 'xl' } }) in a locally-composed
    // theme, and assert its rendered (unset-size) computed trigger height
    // equals an explicit size="xl" Select's computed trigger height rendered
    // under the plain uiTheme. If .extend({ defaultProps }) stopped
    // threading, `Big` would fall back to Select's own built-in default
    // size ('md'), and this equality would fail rather than matching by
    // coincidence: 'md' and 'xl' resolve to different
    // SELECT_TRIGGER_HEIGHTS entries. Select hand-declares `size` (see the
    // SelectSize/generic-params comments above) rather than getting it via
    // `vocabularyAxes` injection the way Alert/Checkbox do, but
    // `Recipe.extend()`'s runtime threading is independent of that typing
    // mechanism, so the same pattern applies.
    const Big = Select.extend({ defaultProps: { size: 'xl' } });
    const extendedTheme = createTheme({
      extends: uiTheme,
      components: [Big],
    });

    const extendedScreen = await render(
      <SoribashiProvider theme={extendedTheme}>
        <Select items={FRUITS} placeholder="Pick" classNames={{ trigger: 'probe-extended' }} />
      </SoribashiProvider>,
    );
    const explicitScreen = await wrap(
      <Select
        items={FRUITS}
        placeholder="Pick"
        size="xl"
        classNames={{ trigger: 'probe-explicit-xl' }}
      />,
    );

    const extendedHeight = getComputedStyle(
      extendedScreen.container.querySelector('.probe-extended')!,
    ).height;
    const explicitHeight = getComputedStyle(
      explicitScreen.container.querySelector('.probe-explicit-xl')!,
    ).height;
    expect(extendedHeight).toBe(explicitHeight);
  });

  it('shows a focus ring on the trigger distinct from the resting border colour (fix-wave Critical 2, computed)', async () => {
    // Regression pin, identical shape to TextInput.test.tsx's/Textarea.test.tsx's
    // own case: `--accent-primary` is emitted by no theme in this repo, so
    // the trigger's `:focus-visible` rule's fallback always applies. The
    // fallback used to be `var(--border-default)`, the SAME token the
    // resting border already reads, making the focused outline compute
    // identical to the unfocused border. Fixed to `var(--text-default)`,
    // Tabs'/Accordion's established choice for this same fallback.
    const screen = await wrap(<Select items={FRUITS} placeholder="Pick a fruit" />);
    const trigger = screen.getByRole('combobox').element() as HTMLElement;
    const restingBorderColor = getComputedStyle(trigger).borderColor;
    // A real key press (rather than a bare `.focus()` call) before focusing:
    // Chromium's focus-visible heuristic tracks the last input MODALITY
    // (keyboard vs. pointer) for the whole document, and earlier tests in
    // this file real-click the trigger, which would otherwise leave pointer
    // modality active and suppress `:focus-visible` on a plain `.focus()`
    // call here (confirmed empirically: without this, outlineStyle read
    // 'none', not the resting-border-equal outline the bug produces).
    await userEvent.keyboard('{Tab}');
    trigger.focus();
    expect(getComputedStyle(trigger).outlineStyle).toBe('solid');
    expect(getComputedStyle(trigger).outlineColor).not.toBe(restingBorderColor);
  });

  it('accepts style props on Root, strips them, and applies no margin anywhere (Root has no DOM of its own)', async () => {
    // Select's `Root` is a Base UI context provider with no element of its
    // own (the same shape as Popover's Root, see Popover.test.tsx's
    // identically-named case): a style prop on it is accepted and extracted
    // by the builder but has nowhere to attach, by design. This pins that it
    // never leaks as a raw `m` attribute or an unexpected inline `margin` on
    // the trigger this recipe actually renders.
    const screen = await wrap(<Select items={FRUITS} placeholder="Pick" m="xl" />);
    const trigger = screen.getByRole('combobox').element();
    expect(trigger.getAttribute('m')).toBeNull();
    expect((trigger as HTMLElement).style.margin).toBe('');
  });

  it('trigger and popup fit a container narrower than 24rem, rather than overflowing it', async () => {
    // Regression pin for the workshop tenants-page overflow. `.trigger` and
    // `.popup` both floored their inline size at `var(--breakpoint-xs)`
    // (24rem = 384px): a VIEWPORT breakpoint used as a component dimension.
    // A `min-inline-size` is a floor no container can shrink, so every Select
    // in a column narrower than 384px punched out through its container's
    // right edge -- measured at 384px inside the workshop's 321px tenant card
    // bodies, trigger and open popup alike. Real measured geometry, not
    // emitted CSS text (authoring skill § 18).
    const NARROW_PX = 240;
    const screen = await wrap(
      <div style={{ inlineSize: `${NARROW_PX}px` }}>
        <Select
          items={FRUITS}
          placeholder="Pick a fruit"
          classNames={{ popup: 'select-narrow-popup-probe' }}
        />
      </div>,
    );

    const trigger = screen.getByRole('combobox').element();
    expect(trigger.getBoundingClientRect().width).toBeLessThanOrEqual(NARROW_PX);

    await screen.getByRole('combobox').click();
    await expect.element(screen.getByRole('option', { name: 'Apple' })).toBeVisible();

    // The popup is the element carrying the `popup` slot's class, not the
    // `role="listbox"` element (that is `Select.List`, a child of it -- see
    // the `container` case above).
    const popup = document.querySelector('.select-narrow-popup-probe');
    expect(popup).not.toBeNull();
    expect((popup as HTMLElement).getBoundingClientRect().width).toBeLessThanOrEqual(NARROW_PX);
  });
});

/**
 * Compile-time pin against the generic-params trap for `defineGenericComponent`:
 * `Select`'s public type comes ENTIRELY from the author-supplied `TSignature`
 * type argument (see define-generic-component.tsx's own doc comment: unlike
 * defineComponent/definePolymorphicComponent/defineCompound, there is no
 * automatic composition of vocabulary-axis props into a generic component's
 * public type). If a future edit forgot to pass `SelectSignature` explicitly
 * to the `defineGenericComponent<...>` call (falling back to the default
 * `GenericComponentFn`, which types `props` as `any`), every prop -- not just
 * `size` -- would silently accept anything, and the `@ts-expect-error` below
 * would stop erroring with no other signal. This function is never called;
 * it exists purely for `bun run typecheck` to check.
 */
function _typeCheckSelectSignature() {
  const items = [{ label: 'Apple', value: 'apple' }];

  const valid = <Select items={items} size="lg" />;
  void valid;

  // @ts-expect-error size is narrowed to the ui theme's size vocabulary; "enormous" is not a member
  const invalidSize = <Select items={items} size="enormous" />;
  void invalidSize;

  // @ts-expect-error items is required
  const missingItems = <Select />;
  void missingItems;

  const withAccessors = (
    <Select
      items={[{ id: 1, name: 'Ada' }]}
      // @ts-expect-error `age` does not exist on `{id, name}`: proves `u` is
      // typed as the item, not `any` (fix round 1, Minor finding -- without
      // this, `getLabel={(u) => u.name}` above would type-check identically
      // whether `u` were `{id, name}` or `any`, since nothing here probed an
      // invalid property access).
      getLabel={(u) => u.age}
      getValue={(u) => u.id}
      onValueChange={(value) => {
        expectTypeOf(value).toEqualTypeOf<unknown>();
      }}
    />
  );
  void withAccessors;
}
void _typeCheckSelectSignature;
