import { expect, test } from '@playwright/test';

test('renders the React migration scaffold', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'frontend-react' })).toBeVisible();
  await expect(page.getByText('React migration scaffold')).toBeVisible();
});
