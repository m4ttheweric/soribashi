import { expect, test } from '@playwright/test';

test('gallery loads and shows nav', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('shadcn-starter')).toBeVisible();
  await expect(page.getByText('Button')).toBeVisible();
});
