import { SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { Box } from './Box.tsx';

const LABEL = 'Styled entirely by style props';

describe('Box (visual)', () => {
  it('bg and p style props match their baseline', async () => {
    // Locating by the rendered text needs no extra markup: Box has no label
    // slot of its own, so the text is a direct child of the root element
    // this baseline is meant to capture.
    await render(
      <SoribashiProvider theme={uiTheme}>
        <Box bg="surface.raised" p="lg">
          {LABEL}
        </Box>
      </SoribashiProvider>,
    );

    await expect.element(page.getByText(LABEL)).toBeVisible();
    await expect(page.getByText(LABEL)).toMatchScreenshot('box-bg-padding');
  });
});
