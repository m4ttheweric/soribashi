import { SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { Center } from './Center.tsx';

describe('Center (visual)', () => {
  it('a sized child centered in a sized Center matches its baseline', async () => {
    await render(
      <SoribashiProvider theme={uiTheme}>
        <Center
          data-testid="center"
          style={{
            width: '160px',
            height: '160px',
            background: 'var(--surface-canvas)',
          }}
        >
          <div style={{ width: '48px', height: '48px', background: 'var(--surface-raised)' }} />
        </Center>
      </SoribashiProvider>,
    );

    await expect.element(page.getByTestId('center')).toBeVisible();
    await expect(page.getByTestId('center')).toMatchScreenshot('center-sized-child');
  });
});
