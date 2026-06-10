import { expect, test } from '@playwright/test';

test('renders the unauthenticated login shell', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
});
