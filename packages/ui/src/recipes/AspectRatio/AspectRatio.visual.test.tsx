import { SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { AspectRatio } from './AspectRatio.tsx';

describe('AspectRatio (visual)', () => {
  it('a 16:9 box at a fixed width matches its baseline', async () => {
    await render(
      <SoribashiProvider theme={uiTheme}>
        <AspectRatio data-testid="ar" ratio={16 / 9} style={{ width: '240px' }}>
          <div style={{ background: 'var(--surface-raised)', width: '100%', height: '100%' }} />
        </AspectRatio>
      </SoribashiProvider>,
    );

    await expect.element(page.getByTestId('ar')).toBeVisible();
    await expect(page.getByTestId('ar')).toMatchScreenshot('aspect-ratio-16-9');
  });
});
