import { SoribashiProvider } from '@soribashi/core';
import { useEffect } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { Toast, useToast } from './Toast.tsx';

/**
 * Toast portals its Viewport under `<body>`; `Toast.Viewport`'s `container` prop
 * re-anchors it into a local node so this no-transition/no-animation class
 * reaches the portalled toast (the Skeleton frozen-motion idiom, §21).
 *
 * A SINGLE toast is rendered, deliberately: Base UI stacks multiple toasts with
 * a JS-driven height/transform settle (ResizeObserver + position recalculation)
 * that `transition: none` cannot freeze, so a stack never yields two matching
 * frames for `toMatchScreenshot` ("could not capture a stable screenshot"). One
 * toast has no stack and its surface is static once entered. The intent x
 * variant colour matrix is proven numerically by contrast-matrix.test.tsx; this
 * tier only guards the surface's overall appearance against accidental change.
 *
 * Linux baselines regenerated via the pinned Docker workflow; `bun run test`
 * excludes the visual tier.
 */
const NO_TRANSITION_CLASS = 'sb-visual-no-transition';
const noTransitionStyle = document.createElement('style');
noTransitionStyle.textContent = `
  .${NO_TRANSITION_CLASS},
  .${NO_TRANSITION_CLASS} * { transition: none !important; animation: none !important; }
`;
document.head.appendChild(noTransitionStyle);

function FireOne() {
  const toast = useToast();
  // biome-ignore lint/correctness/useExhaustiveDependencies: fire once at mount; useToast() identity changes as toasts are added, so depping would loop
  useEffect(() => {
    toast.add({
      intent: 'success',
      title: 'Changes saved',
      description: 'Your edits are live.',
      timeout: 0,
    });
  }, []);
  return null;
}

describe('Toast (visual)', () => {
  let viewportContainer: HTMLDivElement | undefined;

  afterEach(() => {
    viewportContainer?.remove();
    viewportContainer = undefined;
  });

  // Returns the toast surface element (the screenshot target). The `.viewport`
  // slot is position: fixed, so it contributes nothing to `viewportContainer`'s
  // box; screenshotting the container captures a zero-size region that never
  // stabilizes. The toast element itself has a real, static box once settled
  // (the same "screenshot the fixed element, not its portal wrapper" shape
  // Dialog.visual.test.tsx uses for the backdrop).
  async function mountToast({ dark = false } = {}): Promise<HTMLElement> {
    await page.viewport(480, 240);
    viewportContainer = document.createElement('div');
    viewportContainer.className = NO_TRANSITION_CLASS;
    if (dark) viewportContainer.classList.add('dark');
    document.body.appendChild(viewportContainer);

    await render(
      <SoribashiProvider theme={uiTheme}>
        <Toast.Provider>
          <FireOne />
          <Toast.Viewport container={viewportContainer} />
        </Toast.Provider>
      </SoribashiProvider>,
    );
    await document.fonts.ready;
    let toastEl: HTMLElement | null = null;
    await vi.waitFor(
      () => {
        toastEl = viewportContainer?.querySelector<HTMLElement>('[data-intent="success"]') ?? null;
        expect(toastEl).not.toBeNull();
        expect((toastEl as HTMLElement).hasAttribute('data-starting-style')).toBe(false);
      },
      { timeout: 1000, interval: 10 },
    );
    return toastEl as unknown as HTMLElement;
  }

  it('a success toast matches its baseline in light mode', async () => {
    const toastEl = await mountToast();
    await expect(page.elementLocator(toastEl)).toMatchScreenshot('toast-success-light');
  });

  it('a success toast matches its baseline in dark mode', async () => {
    const toastEl = await mountToast({ dark: true });
    await expect(page.elementLocator(toastEl)).toMatchScreenshot('toast-success-dark');
  });
});
