import { SoribashiProvider } from '@soribashi/core';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { Select } from './Select.tsx';

/**
 * Select.module.css transitions the trigger's border-color/background-color
 * and the icon's rotation, and the popup drives the same opacity/transform
 * enter animation Popover.module.css does. `container` (Select.tsx's
 * `container` prop, exercised the same way in Select.test.tsx) re-anchors
 * the portal locally so this no-transition class, applied to that local
 * container, reaches the portalled popup and its descendants via the
 * wildcard descendant selector below. See Popover.visual.test.tsx's
 * identical rationale.
 */
const NO_TRANSITION_CLASS = 'sb-visual-no-transition';
const noTransitionStyle = document.createElement('style');
noTransitionStyle.textContent = `
  .${NO_TRANSITION_CLASS},
  .${NO_TRANSITION_CLASS} * { transition: none !important; }
`;
document.head.appendChild(noTransitionStyle);

const GROUPED = [
  { label: 'Apple', value: 'apple', group: 'Fruit' },
  { label: 'Carrot', value: 'carrot', group: 'Vegetable' },
  { label: 'Banana', value: 'banana', group: 'Fruit' },
  { label: 'Pea', value: 'pea', group: 'Vegetable' },
];

describe('Select (visual)', () => {
  // `render`'s auto-cleanup only tracks/removes the container it renders the
  // Trigger/Root tree into; `popupContainer` here is passed as the Portal's
  // `container` *prop*, so it is never in that tracked set and needs its own
  // teardown (Popover.visual.test.tsx's identical pattern).
  let popupContainer: HTMLDivElement | undefined;

  afterEach(() => {
    popupContainer?.remove();
    popupContainer = undefined;
  });

  function mountOpenSelect({ dark = false, grouped = false } = {}) {
    popupContainer = document.createElement('div');
    popupContainer.className = NO_TRANSITION_CLASS;
    if (dark) popupContainer.classList.add('dark');
    document.body.appendChild(popupContainer);

    return render(
      <SoribashiProvider theme={uiTheme}>
        <Select
          items={GROUPED}
          getGroup={grouped ? (item) => item.group : undefined}
          defaultOpen
          defaultValue="apple"
          placeholder="Pick a fruit"
          container={popupContainer}
        />
      </SoribashiProvider>,
    );
  }

  it('open select with a highlighted item matches its baseline in light mode', async () => {
    await mountOpenSelect();

    await expect.element(page.getByRole('listbox')).toBeVisible();
    await expect(page.getByRole('listbox')).toMatchScreenshot('select-open-light');
  });

  it('open select with a highlighted item matches its baseline in dark mode', async () => {
    await mountOpenSelect({ dark: true });

    await expect.element(page.getByRole('listbox')).toBeVisible();
    await expect(page.getByRole('listbox')).toMatchScreenshot('select-open-dark');
  });

  it('grouped items with group labels match their baseline', async () => {
    await mountOpenSelect({ grouped: true });

    await expect.element(page.getByRole('listbox')).toBeVisible();
    await expect(page.getByRole('listbox')).toMatchScreenshot('select-grouped');
  });
});
