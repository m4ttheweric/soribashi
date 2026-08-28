import { SoribashiProvider } from '@soribashi/core';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { Toast, useToast } from './Toast.tsx';

// `render` from vitest-browser-react resolves a Promise<RenderResult> (see
// Dialog.test.tsx); `wrap` awaits it so callers get the real result object.
const wrap = (ui: ReactNode) => render(<SoribashiProvider theme={uiTheme}>{ui}</SoribashiProvider>);

// A trigger button that enqueues one non-dismissing toast on click, alongside a
// Viewport, both inside Toast.Provider (the compound root).
function Harness(props: { intent?: string; title?: string; description?: string }) {
  function Fire() {
    const toast = useToast();
    return (
      <button
        type="button"
        onClick={() =>
          toast.add({
            title: props.title,
            description: props.description,
            intent: props.intent,
            timeout: 0,
          })
        }
      >
        fire
      </button>
    );
  }
  return (
    <Toast.Provider>
      <Fire />
      <Toast.Viewport />
    </Toast.Provider>
  );
}

describe('Toast (browser)', () => {
  it('add() renders a toast with title, description, and data-intent', async () => {
    const screen = await wrap(<Harness intent="success" title="Saved" description="Live now" />);
    await screen.getByRole('button', { name: 'fire' }).click();
    await expect.element(screen.getByText('Saved')).toBeVisible();
    await expect.element(screen.getByText('Live now')).toBeVisible();
    // The Viewport portals under <body>, outside screen.container, so query the
    // document (getByText above already searches the whole page).
    expect(document.querySelector('[data-intent="success"]')).not.toBeNull();
  });
});
