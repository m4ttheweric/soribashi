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

// A button that enqueues `options` on click, alongside a Viewport, both inside
// Toast.Provider (the compound root). `container` re-anchors the Viewport's
// portal into a caller-owned node when a scoped read is needed.
function App({ options, container }: { options: ToastAddOptions; container?: HTMLElement }) {
  function Fire() {
    const toast = useToast();
    return (
      <button type="button" onClick={() => toast.add(options)}>
        fire
      </button>
    );
  }
  return (
    <Toast.Provider>
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
    const screen = await wrap(<App options={{ title: 'Neutral', timeout: 0 }} />);
    await screen.getByRole('button', { name: 'fire' }).click();
    await expect.element(screen.getByText('Neutral')).toBeVisible();
    // t.type is undefined, so React omits the attribute entirely.
    expect(document.querySelector('[data-intent]')).toBeNull();
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
