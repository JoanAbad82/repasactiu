import { test, expect } from '@playwright/test';

test('producció carrega Repàs Actiu, quatre blocs i 200 preguntes', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Repàs Actiu').first()).toBeVisible();
  await expect(page.locator('[data-block-card]')).toHaveCount(5);
  await expect(page.getByText('200 preguntes')).toBeVisible();
  await expect(page.locator('[href*="openutilitylab"]')).toHaveCount(0);
});
