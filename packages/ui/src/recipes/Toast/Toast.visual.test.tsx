import { SoribashiProvider } from '@soribashi/core';
import { useEffect } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { Toast, useToast } from './Toast.tsx';

/**
 * Toast portals its Viewport under `<body>`; `Toast.Viewport`'s `container`
 * prop (exercised the same way in Toast.test.tsx / the reskin fixture)
 * re-anchors it into a local node so this no-transition/no-animation class
 * reaches the portalled toasts. Both `transition` AND `animation` are killed
 * (the Skeleton frozen-motion idiom, authoring skill §21): a toast's enter is a
 * transition, but freezing only transitions would still let any keyframe land
 * on an arbitrary frame.
 *
 * Linux baselines are intentionally NOT committed yet (deferred to a post-merge
 * Docker regen, like Checkbox); `bun run test` excludes the visual tier, so this
 * file exists for the four-file recipe contract and the eventual baseline run.
 */
const NO_TRANSITION_CLASS = 'sb-visual-no-transition';
const noTransitionStyle = document.createElement('style');
noTransitionStyle.textContent = `
  .${NO_TRANSITION_CLASS},
  .${NO_TRANSITION_CLASS} * { transition: none !important; animation: none !important; }
`;
document.head.appendChild(noTransitionStyle);

const INTENTS = ['success', 'warning', 'danger', 'info'] as const;

function FireIntents() {
  const toast = useToast();
  // biome-ignore lint/correctness/useExhaustiveDependencies: fire once at mount; useToast() identity changes as toasts are added, so depping would loop
  useEffect(() => {
    for (const intent of INTENTS) {
      toast.add({ title: intent, description: `${intent} notification`, intent, timeout: 0 });
    }
  }, []);
  return null;
}

describe('Toast (visual)', () => {
  let viewportContainer: HTMLDivElement | undefined;

  afterEach(() => {
    viewportContainer?.remove();
    viewportContainer = undefined;
  });

  async function mountToasts({ dark = false } = {}) {
    await page.viewport(520, 520);
    viewportContainer = document.createElement('div');
    viewportContainer.className = NO_TRANSITION_CLASS;
    if (dark) viewportContainer.classList.add('dark');
    document.body.appendChild(viewportContainer);

    await render(
      <SoribashiProvider theme={uiTheme}>
        <Toast.Provider limit={INTENTS.length + 1}>
          <FireIntents />
          <Toast.Viewport container={viewportContainer} />
        </Toast.Provider>
      </SoribashiProvider>,
    );
    await document.fonts.ready;
    // Wait for every toast to mount and its Base UI enter-state to clear.
    await vi.waitFor(
      () => {
        const toasts = viewportContainer?.querySelectorAll('[data-intent]') ?? [];
        expect(toasts.length).toBe(INTENTS.length);
        for (const el of toasts) {
          expect((el as HTMLElement).hasAttribute('data-starting-style')).toBe(false);
        }
      },
      { timeout: 1000, interval: 10 },
    );
  }

  it('intent toasts match their baseline in light mode', async () => {
    await mountToasts();
    await expect(page.elementLocator(viewportContainer as HTMLElement)).toMatchScreenshot(
      'toast-intents-light',
    );
  });

  it('intent toasts match their baseline in dark mode', async () => {
    await mountToasts({ dark: true });
    await expect(page.elementLocator(viewportContainer as HTMLElement)).toMatchScreenshot(
      'toast-intents-dark',
    );
  });
});
