import {test,expect} from '@playwright/test';

test('els accessos directes porten a les eines adequades sense duplicar contingut',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await expect(page.locator('.home-tools')).toBeVisible();
  await expect(page.locator('[data-block-card]')).toHaveCount(18);

  await page.locator('#home-shortcut-study').click();
  await expect(page.locator('#study-cards-screen')).toBeVisible();
  await page.locator('#home-link').click();

  await page.locator('#home-shortcut-dictionary').click();
  await expect(page.locator('#concept-dictionary-screen')).toBeVisible();
  await page.locator('#home-link').click();

  await page.locator('#home-shortcut-examples').click();
  await expect(page.locator('#commercial-correspondence-screen')).toBeVisible();
  await page.locator('#home-link').click();

  await page.locator('#hangman-card').click();
  await expect(page.locator('#hangman-screen')).toBeVisible();
  await page.locator('#home-link').click();

  await page.locator('[data-selection="all"]').click();
  await expect(page.locator('#setup-screen')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
});

test('els accessos directes es tradueixen a castellà',async({page})=>{
  await page.goto('/');
  await expect(page.getByText('1009 preguntes')).toBeVisible();
  await page.locator('#language-es').click();
  await expect(page.locator('#home-tools-title')).toHaveText('Herramientas de repaso');
  await expect(page.locator('#home-shortcut-study')).toContainText('Tarjetas de memoria');
  await expect(page.locator('#home-shortcut-dictionary')).toContainText('Diccionario');
  await expect(page.locator('#home-shortcut-examples')).toContainText('Ejemplos prácticos');
  await expect(page.locator('#hangman-card')).toContainText('Ahorcado de conceptos');
  await expect(page.locator('.home-tools [data-selection="all"]')).toContainText('Todo el temario disponible');
});

test('la drecera del teclat salta al contingut principal',async({page})=>{
  await page.goto('/');
  await expect(page.getByText('1009 preguntes')).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.locator('#skip-link')).toBeFocused();
  await expect(page.locator('#skip-link')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#app$/);
  await expect(page.locator('#app')).toBeVisible();
});
