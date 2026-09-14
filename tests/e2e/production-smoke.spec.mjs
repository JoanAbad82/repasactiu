import { test, expect } from '@playwright/test';

test('producció carrega Repàs Actiu, dues unitats, sis blocs i 320 preguntes', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Repàs Actiu').first()).toBeVisible();
  await expect(page.locator('[data-unit-group]')).toHaveCount(2);
  await expect(page.locator('[data-block-card]')).toHaveCount(7);
  await expect(page.getByText('320 preguntes')).toBeVisible();
  await expect(page.locator('[href*="openutilitylab"]')).toHaveCount(0);
});
