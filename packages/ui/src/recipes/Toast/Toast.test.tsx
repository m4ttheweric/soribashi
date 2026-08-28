import { SoribashiProvider } from '@soribashi/core';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { formatViolations, runAxe } from '../../a11y/axe.ts';
import { uiTheme } from '../../theme.ts';
import { Toast, type ToastAddOptions, useToast } from './Toast.tsx';

// `render` from vitest-browser-react resolves a Promise<RenderResult> (see
// Dialog.test.tsx); `wrap` awaits it so callers get the real result object.
const wrap = (ui: ReactNode) => render(<SoribashiProvider theme={uiTheme}>{ui}</SoribashiProvider>);

// Resolves a CSS custom property to its browser-computed value via a throwaway
// probe (the theme's oklch()/light-dark() tokens do not reliably serialize to
// rgb() through getComputedStyle otherwise; same idiom as Dialog.test.tsx).
function resolvedBackgroundColor(varName: string): string {
  const probe = document.createElement('div');
  probe.style.backgroundColor = `var(${varName})`;
  document.body.appendChild(probe);
  const value = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return value;
}

// A button that enqueues `options` on click, alongside a Viewport, both inside
// Toast.Provider (the compound root). `container` re-anchors the Viewport's
// portal into a caller-owned node when a scoped read is needed; `toastClass`
// tags the toast slot so a specific surface can be measured.
function App({
  options,
  container,
  toastClass,
}: {
  options: ToastAddOptions;
  container?: HTMLElement;
  toastClass?: string;
}) {
  function Fire() {
    const toast = useToast();
    return (
      <button type="button" onClick={() => toast.add(options)}>
        fire
      </button>
    );
  }
  return (
    <Toast.Provider classNames={toastClass ? { toast: toastClass } : undefined}>
      <Fire />
      <Toast.Viewport container={container} />
    </Toast.Provider>
  );
}

describe('Toast (browser)', () => {
  it('add() renders a toast with title, description, and data-intent', async () => {
    const screen = await wrap(
      <App options={{ intent: 'success', title: 'Saved', description: 'Live now', timeout: 0 }} />,
    );
    await screen.getByRole('button', { name: 'fire' }).click();
    await expect.element(screen.getByText('Saved')).toBeVisible();
    await expect.element(screen.getByText('Live now')).toBeVisible();
    // The Viewport portals under <body>, outside screen.container, so query the
    // document (getByText above already searches the whole page).
    expect(document.querySelector('[data-intent="success"]')).not.toBeNull();
  });

  it('a toast with no intent renders the neutral surface (no data-intent)', async () => {
    const screen = await wrap(
      <App options={{ title: 'Neutral', timeout: 0 }} toastClass="neutral-toast" />,
    );
    await screen.getByRole('button', { name: 'fire' }).click();
    await expect.element(screen.getByText('Neutral')).toBeVisible();
    // t.type is undefined, so React omits the attribute entirely: no intent
    // colour is applied (autoVars is skipped for an intent-less toast).
    expect(document.querySelector('[data-intent]')).toBeNull();
    // AC3: the surface's computed background is the neutral --surface-raised
    // fallback (measured, not just asserted from CSS text), so an intent-less
    // toast is never left with an intent colour.
    const surface = document.querySelector<HTMLElement>('.neutral-toast');
    expect(surface).not.toBeNull();
    expect(getComputedStyle(surface as HTMLElement).backgroundColor).toBe(
      resolvedBackgroundColor('--surface-raised'),
    );
  });

  it('Close removes the toast; Action fires its handler', async () => {
    let actionClicks = 0;
    const screen = await wrap(
      <App
        options={{
          title: 'Undo?',
          timeout: 0,
          action: {
            children: 'Undo',
            onClick: () => {
              actionClicks += 1;
            },
          },
        }}
      />,
    );
    await screen.getByRole('button', { name: 'fire' }).click();
    await expect.element(screen.getByText('Undo?')).toBeVisible();

    await screen.getByRole('button', { name: 'Undo' }).click();
    expect(actionClicks).toBe(1);

    await screen.getByRole('button', { name: 'Close' }).click();
    await expect.element(screen.getByText('Undo?')).not.toBeInTheDocument();
  });

  it('auto-dismisses after its timeout (real timer)', async () => {
    const screen = await wrap(<App options={{ title: 'Fleeting', timeout: 150 }} />);
    await screen.getByRole('button', { name: 'fire' }).click();
    await expect.element(screen.getByText('Fleeting')).toBeVisible();
    // Real Base UI timer fires after 150ms; poll until the toast is gone.
    // FOCUS DEPENDENCY: Base UI pauses the dismiss timer while the window is not
    // focused (store.js's expandedOrOutOfFocus gate), so this asserts dismissal
    // only because vitest browser mode keeps the page focused. If this ever
    // hangs to its retry budget in CI, an unfocused tab is the first suspect.
    await expect.element(screen.getByText('Fleeting')).not.toBeInTheDocument();
  });

  describe('a11y', () => {
    let axeContainer: HTMLDivElement | undefined;
    afterEach(() => {
      axeContainer?.remove();
      axeContainer = undefined;
    });

    it('has no axe violations for a toast with title, description, action, and close', async () => {
      axeContainer = document.createElement('div');
      document.body.appendChild(axeContainer);
      const screen = await wrap(
        <App
          options={{
            intent: 'info',
            title: 'Heads up',
            description: 'Something happened.',
            timeout: 0,
            action: { children: 'View' },
          }}
          container={axeContainer}
        />,
      );
      await screen.getByRole('button', { name: 'fire' }).click();
      await expect.element(screen.getByText('Heads up')).toBeVisible();
      const results = await runAxe(axeContainer);
      expect(results.violations, formatViolations(results.violations)).toEqual([]);
    });
  });
});
