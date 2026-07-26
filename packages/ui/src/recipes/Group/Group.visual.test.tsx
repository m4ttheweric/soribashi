import { SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { Group } from './Group.tsx';

describe('Group (visual)', () => {
  it('three-child row at the default gap matches its baseline', async () => {
    await render(
      <SoribashiProvider theme={uiTheme}>
        <Group data-testid="group" style={{ background: 'var(--surface-canvas)', padding: '1rem' }}>
          <div>One</div>
          <div>Two</div>
          <div>Three</div>
        </Group>
      </SoribashiProvider>,
    );

    await expect.element(page.getByTestId('group')).toBeVisible();
    await expect(page.getByTestId('group')).toMatchScreenshot('group-default-gap');
  });
});
