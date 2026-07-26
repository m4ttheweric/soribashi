import { createTheme, SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { formatViolations, runAxe } from '../../a11y/axe.ts';
import { uiTheme } from '../../theme.ts';
import { Tabs } from './Tabs.tsx';

// `render` from vitest-browser-react resolves a Promise<RenderResult> (see
// Button.test.tsx/Popover.test.tsx); `wrap` awaits it so callers get the
// real result object.
const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={uiTheme}>{ui}</SoribashiProvider>);

/**
 * Every behavioural assertion below reads two things: where focus actually
 * landed (`document.activeElement`) and which panel is actually visible in
 * the DOM (queried by its text, not by inspecting a prop or attribute that
 * merely claims a value changed). Global Constraint 9 forbids the emissive
 * shortcut (asserting a handler fired or a data-* attribute was stamped).
 */
function ThreeTabs({ orientation }: { orientation?: 'horizontal' | 'vertical' } = {}) {
  return (
    <Tabs.Root defaultValue="a" orientation={orientation}>
      <Tabs.List>
        <Tabs.Tab value="a">Tab A</Tabs.Tab>
        <Tabs.Tab value="b">Tab B</Tabs.Tab>
        <Tabs.Tab value="c">Tab C</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="a">Panel A content</Tabs.Panel>
      <Tabs.Panel value="b">Panel B content</Tabs.Panel>
      <Tabs.Panel value="c">Panel C content</Tabs.Panel>
    </Tabs.Root>
  );
}

describe('Tabs (browser)', () => {
  it('moves selection with arrow keys and wraps at the ends', async () => {
    const screen = await wrap(<ThreeTabs />);

    const tabA = screen.getByRole('tab', { name: 'Tab A' }).element() as HTMLElement;
    const tabB = screen.getByRole('tab', { name: 'Tab B' }).element() as HTMLElement;
    const tabC = screen.getByRole('tab', { name: 'Tab C' }).element() as HTMLElement;

    tabA.focus();
    expect(document.activeElement).toBe(tabA);
    await expect.element(screen.getByText('Panel A content')).toBeVisible();

    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(tabB);
    await expect.element(screen.getByText('Panel B content')).toBeVisible();
    expect(screen.getByText('Panel A content').query()).toBeNull();

    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(tabC);
    await expect.element(screen.getByText('Panel C content')).toBeVisible();
    expect(screen.getByText('Panel B content').query()).toBeNull();

    // Wraps at the end back to the first tab (Base UI's List `loopFocus`,
    // default true).
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(tabA);
    await expect.element(screen.getByText('Panel A content')).toBeVisible();
    expect(screen.getByText('Panel C content').query()).toBeNull();
  });

  it('honours Home and End', async () => {
    const screen = await wrap(<ThreeTabs />);

    const tabA = screen.getByRole('tab', { name: 'Tab A' }).element() as HTMLElement;
    const tabC = screen.getByRole('tab', { name: 'Tab C' }).element() as HTMLElement;

    tabA.focus();

    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(tabC);
    await expect.element(screen.getByText('Panel C content')).toBeVisible();

    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(tabA);
    await expect.element(screen.getByText('Panel A content')).toBeVisible();
  });

  it('respects orientation="vertical" (ArrowDown moves, ArrowRight does not)', async () => {
    const screen = await wrap(<ThreeTabs orientation="vertical" />);

    const tabA = screen.getByRole('tab', { name: 'Tab A' }).element() as HTMLElement;
    const tabB = screen.getByRole('tab', { name: 'Tab B' }).element() as HTMLElement;

    tabA.focus();

    // ArrowRight is the horizontal-axis key; it must not move focus or
    // selection while orientation="vertical".
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(tabA);
    await expect.element(screen.getByText('Panel A content')).toBeVisible();

    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(tabB);
    await expect.element(screen.getByText('Panel B content')).toBeVisible();
  });

  it('associates each panel with its tab via aria-controls / aria-labelledby', async () => {
    const screen = await wrap(<ThreeTabs />);

    const tabA = screen.getByRole('tab', { name: 'Tab A' }).element();
    const panelA = screen.getByText('Panel A content').element();

    expect(tabA.getAttribute('aria-controls')).toBe(panelA.id);
    expect(panelA.getAttribute('aria-labelledby')).toBe(tabA.id);
  });

  it('stamps data-variant so variant CSS can key on it (behavioural: computed backgrounds differ)', async () => {
    const pillScreen = await wrap(
      <Tabs.Root defaultValue="a" variant="pill">
        <Tabs.List>
          <Tabs.Tab value="a">Tab A</Tabs.Tab>
          <Tabs.Tab value="b">Tab B</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="a">Panel A</Tabs.Panel>
        <Tabs.Panel value="b">Panel B</Tabs.Panel>
      </Tabs.Root>,
    );
    const lineScreen = await wrap(
      <Tabs.Root defaultValue="a" variant="line">
        <Tabs.List>
          <Tabs.Tab value="a">Tab A</Tabs.Tab>
          <Tabs.Tab value="b">Tab B</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="a">Panel A</Tabs.Panel>
        <Tabs.Panel value="b">Panel B</Tabs.Panel>
      </Tabs.Root>,
    );

    const pillSelectedTab = pillScreen.container.querySelector(
      '[role="tab"][data-active]',
    ) as HTMLElement;
    const lineSelectedTab = lineScreen.container.querySelector(
      '[role="tab"][data-active]',
    ) as HTMLElement;

    const pillBg = getComputedStyle(pillSelectedTab).backgroundColor;
    const lineBg = getComputedStyle(lineSelectedTab).backgroundColor;

    expect(pillBg).not.toBe(lineBg);
  });

  it('threads a variant default through Recipe.extend (invariant 1)', async () => {
    // Same shape as Badge.test.tsx's identically-named case: register
    // Tabs.extend({ defaultProps: { variant: 'pill' } }) in a
    // locally-composed theme, and assert the selected tab's rendered
    // (unset-variant) computed background equals an explicit variant="pill"
    // Tabs' computed background rendered under the plain uiTheme. If
    // .extend({ defaultProps }) stopped threading, `Pill` would fall back to
    // Tabs' own built-in default variant ('line'), and this equality would
    // fail rather than matching by coincidence: 'line' and 'pill' resolve to
    // different selected-tab backgrounds (see the data-variant case above).
    const Pill = Tabs.extend({ defaultProps: { variant: 'pill' } });
    const extendedTheme = createTheme({
      extends: uiTheme,
      components: [Pill],
    });

    const extendedScreen = await render(
      <SoribashiProvider theme={extendedTheme}>
        <Tabs.Root defaultValue="a">
          <Tabs.List>
            <Tabs.Tab value="a">Tab A</Tabs.Tab>
            <Tabs.Tab value="b">Tab B</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="a">Panel A</Tabs.Panel>
          <Tabs.Panel value="b">Panel B</Tabs.Panel>
        </Tabs.Root>
      </SoribashiProvider>,
    );
    const explicitScreen = await wrap(
      <Tabs.Root defaultValue="a" variant="pill">
        <Tabs.List>
          <Tabs.Tab value="a">Tab A</Tabs.Tab>
          <Tabs.Tab value="b">Tab B</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="a">Panel A</Tabs.Panel>
        <Tabs.Panel value="b">Panel B</Tabs.Panel>
      </Tabs.Root>,
    );

    const extendedTab = extendedScreen.container.querySelector(
      '[role="tab"][data-active]',
    ) as HTMLElement;
    const explicitTab = explicitScreen.container.querySelector(
      '[role="tab"][data-active]',
    ) as HTMLElement;

    const extendedBg = getComputedStyle(extendedTab).backgroundColor;
    const explicitBg = getComputedStyle(explicitTab).backgroundColor;
    expect(extendedBg).toBe(explicitBg);
  });

  it('renders a Tab polymorphically as an anchor', async () => {
    const screen = await wrap(
      <Tabs.Root defaultValue="a">
        <Tabs.List>
          <Tabs.Tab value="a" as="a" href="#a">
            Tab A
          </Tabs.Tab>
          <Tabs.Tab value="b">Tab B</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="a">Panel A</Tabs.Panel>
        <Tabs.Panel value="b">Panel B</Tabs.Panel>
      </Tabs.Root>,
    );

    const tabA = screen.getByRole('tab', { name: 'Tab A' }).element();
    expect(tabA.tagName).toBe('A');
    expect(tabA.getAttribute('href')).toBe('#a');
  });

  it('has zero axe violations for a rendered tab list with panels', async () => {
    const screen = await wrap(<ThreeTabs />);
    const results = await runAxe(screen.container);
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });
});
