import { SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { Grid } from './Grid.tsx';

describe('Grid (visual)', () => {
  it('a three-column grid at the default gap matches its baseline', async () => {
    await render(
      <SoribashiProvider theme={uiTheme}>
        <Grid
          data-testid="grid"
          cols={3}
          style={{ background: 'var(--surface-canvas)', padding: '1rem', width: '360px' }}
        >
          <div style={{ background: 'var(--surface-raised)', height: '48px' }} />
          <div style={{ background: 'var(--surface-raised)', height: '48px' }} />
          <div style={{ background: 'var(--surface-raised)', height: '48px' }} />
        </Grid>
      </SoribashiProvider>,
    );

    await expect.element(page.getByTestId('grid')).toBeVisible();
    await expect(page.getByTestId('grid')).toMatchScreenshot('grid-three-columns');
  });
});
