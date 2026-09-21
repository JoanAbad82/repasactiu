import { test, expect } from '@playwright/test';

const production=process.env.BASE_URL?.includes('repasactiu.pages.dev')??false;

test('smoke del lloc publicat',async({page})=>{
  await page.goto('/');
  await expect(page.getByText('Repàs Actiu').first()).toBeVisible();
  await expect(page.locator('[data-unit-group]')).toHaveCount(3);
  await expect(page.locator('[data-block-card]')).toHaveCount(9);
  await expect(page.getByText('664 preguntes')).toBeVisible();
  await expect(page.locator('[data-selection="unitat-2-bloc-1"]')).toContainText('150 preguntes');
  await expect(page.locator('[data-selection="uf0518-bloc-1"]')).toContainText('86 preguntes');
  await expect(page.locator('[data-selection="uf0518-bloc-2"]')).toContainText('68 preguntes');
  await expect(page.locator('#language-ca')).toHaveAttribute('aria-pressed','true');

  await page.locator('#language-es').click();
  await expect(page.locator('html')).toHaveAttribute('lang','es');
  await expect(page.getByText('664 preguntas')).toBeVisible();
  await expect(page.locator('[data-selection="unitat-2-bloc-1"]')).toContainText('150 preguntas');
  await expect(page.locator('[data-selection="uf0518-bloc-1"]')).toContainText('86 preguntas');
  await expect(page.locator('[data-selection="uf0518-bloc-2"]')).toContainText('68 preguntas');
  await expect(page.getByText('UF0518 — Gestión auxiliar de la correspondencia y paquetería en la empresa')).toBeVisible();

  await page.locator('[data-selection="uf0518-bloc-1"]').click();
  await expect(page.getByRole('button',{name:'Comenzar'})).toBeVisible();
  await page.getByRole('button',{name:'Comenzar'}).click();
  await expect(page.locator('[data-answer-option]')).toHaveCount(4);
  await expect(page.locator('.question-card h1')).not.toBeEmpty();
  await expect(page.locator('.memory-aid')).toHaveCount(0);
  await page.locator('[data-answer-option]').first().click();
  await expect(page.locator('#study-feedback')).toContainText(/Respuesta correcta|Respuesta incorrecta/);
  await expect(page.locator('#study-feedback > p')).not.toBeEmpty();
  await expect(page.locator('#study-feedback .memory-aid')).toBeVisible();
  await expect(page.locator('#study-feedback .memory-aid strong')).toHaveText(/Ejemplo para recordar|Idea para recordar/);
  await expect(page.locator('#study-feedback .memory-aid p')).not.toBeEmpty();

  if(production) await expect(page).toHaveURL(/repasactiu\.pages\.dev/);
});
