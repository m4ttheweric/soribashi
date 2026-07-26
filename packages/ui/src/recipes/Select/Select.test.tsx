import { SoribashiProvider } from '@soribashi/core';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { formatViolations, runAxe } from '../../a11y/axe.ts';
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

  it('renders group labels above their items', async () => {
    const screen = await wrap(
      <Select items={GROUPED_ITEMS} getGroup={(i) => i.group} placeholder="Pick" />,
    );

    await screen.getByRole('combobox').click();

    await expect.element(screen.getByText('Fruit')).toBeVisible();
    await expect.element(screen.getByText('Vegetable')).toBeVisible();
    await expect.element(screen.getByRole('option', { name: 'Apple' })).toBeVisible();
    await expect.element(screen.getByRole('option', { name: 'Carrot' })).toBeVisible();
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
    const localContainer = document.createElement('div');
    document.body.appendChild(localContainer);

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

    const results = await runAxe(localContainer);
    expect(results.violations, formatViolations(results.violations)).toEqual([]);

    localContainer.remove();
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
      getLabel={(u) => u.name}
      getValue={(u) => u.id}
      onValueChange={(value) => {
        expectTypeOf(value).toEqualTypeOf<unknown>();
      }}
    />
  );
  void withAccessors;
}
void _typeCheckSelectSignature;
