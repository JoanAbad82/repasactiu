import { test, expect } from '@playwright/test';

test('la portada mostra el curs i els quatre blocs', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Repàs Actiu').first()).toBeVisible();
  await expect(page.getByText('Operacions auxiliars de serveis administratius i generals')).toBeVisible();
  await expect(page.locator('[data-block-card]')).toHaveCount(5);
  await expect(page.getByText('108 preguntes')).toBeVisible();
  await expect(page.locator('[href*="openutilitylab"]')).toHaveCount(0);
});

test('Mode Estudi mostra correcció i explicació immediata', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Bloc 1/ }).click();
  await page.getByLabel('Mode Estudi').check();
  await page.getByLabel('10 preguntes').check();
  await page.getByRole('button', { name: 'Començar' }).click();
  await expect(page.locator('[data-answer-option]')).toHaveCount(4);
  await page.locator('[data-answer-option]').first().click();
  await expect(page.locator('#study-feedback')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Següent' })).toBeEnabled();
});

test('Mode Examen no revela solucions durant el test i permet blancs', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Bloc 1/ }).click();
  await page.getByLabel('Mode Examen').check();
  await page.getByLabel('10 preguntes').check();
  await page.getByRole('button', { name: 'Començar' }).click();
  await page.locator('[data-answer-option]').first().click();
  await expect(page.locator('#study-feedback')).toHaveCount(0);
  await page.getByRole('button', { name: 'Següent' }).click();
  await expect(page.getByText('Pregunta 2 de 10')).toBeVisible();
  await page.getByRole('button', { name: 'Següent' }).click();
  await expect(page.getByText('Pregunta 3 de 10')).toBeVisible();
});

test('Repassar errors informa quan no hi ha pendents', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Repassar errors' }).click();
  await page.getByRole('button', { name: 'Començar' }).click();
  await expect(page.getByText('Encara no tens preguntes pendents de repàs')).toBeVisible();
});

test('el mode de color es conserva després de recarregar', async ({ page }) => {
  await page.goto('/');
  const before = await page.locator('html').getAttribute('data-theme');
  await page.getByRole('button', { name: /Clar\/Fosc/ }).click();
  const after = await page.locator('html').getAttribute('data-theme');
  expect(after).not.toBe(before);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', after);
});

test('la pregunta és usable en mòbil', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('/');
  await page.getByRole('button', { name: /Bloc 1/ }).click();
  await page.getByRole('button', { name: 'Començar' }).click();
  await expect(page.locator('[data-answer-option]')).toHaveCount(4);
  await page.close();
});
