import {test,expect} from '@playwright/test';

test('el penjat usa conceptes verificats, funciona en català i canvia a castellà',async({page})=>{
  await page.goto('/');
  await page.locator('#hangman-card').click();
  await expect(page.locator('#hangman-screen')).toBeVisible();
  await expect(page.getByRole('heading',{name:'Penjat de conceptes'})).toBeVisible();
  await expect(page.locator('[data-hangman-entry]')).toHaveCount(1);
  await expect(page.locator('.hangman-definition')).not.toBeEmpty();
  await expect(page.locator('.hangman-keyboard button')).toHaveCount(27);
  await expect(page.locator('.hangman-drawing')).toBeVisible();

  const firstId=await page.locator('[data-hangman-entry]').getAttribute('data-hangman-entry');
  page.once('dialog',async dialog=>{
    expect(dialog.message()).toContain("reiniciarà la ronda actual");
    await dialog.accept();
  });
  await page.locator('#language-es').click();
  await expect(page.getByRole('heading',{name:'Ahorcado de conceptos'})).toBeVisible();
  await expect(page.locator('[data-hangman-entry]')).toHaveAttribute('data-hangman-entry',firstId);
  await expect(page.locator('.hangman-keyboard button')).toHaveCount(27);
});

test('cancel·lar el canvi d’idioma conserva la ronda i el progrés',async({page})=>{
  await page.goto('/');
  await page.locator('#hangman-card').click();
  const firstId=await page.locator('[data-hangman-entry]').getAttribute('data-hangman-entry');
  const letter=page.locator('.hangman-keyboard button:not(:disabled)').first();
  const folded=await letter.getAttribute('data-hangman-letter');
  await letter.click();
  await expect(page.locator(`[data-hangman-letter="${folded}"]`)).toBeDisabled();

  page.once('dialog',async dialog=>{
    expect(dialog.message()).toContain("reiniciarà la ronda actual");
    await dialog.dismiss();
  });
  await page.locator('#language-es').click();

  await expect(page.getByRole('heading',{name:'Penjat de conceptes'})).toBeVisible();
  await expect(page.locator('[data-hangman-entry]')).toHaveAttribute('data-hangman-entry',firstId);
  await expect(page.locator(`[data-hangman-letter="${folded}"]`)).toBeDisabled();
});

test('el penjat no desborda en mòbil i una lletra només compta una vegada',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.locator('#hangman-card').click();
  const screen=page.locator('#hangman-screen');
  await expect(screen).toBeVisible();
  const before=await page.locator('.hangman-visual strong').textContent();
  const enabled=page.locator('.hangman-keyboard button:not(:disabled)').first();
  const letter=await enabled.getAttribute('data-hangman-letter');
  await enabled.click();
  await expect(page.locator(`[data-hangman-letter="${letter}"]`)).toBeDisabled();
  const after=await page.locator('.hangman-visual strong').textContent();
  expect(after).toMatch(/^Errors: [01] \/ 6$/);
  expect(before).toBe('Errors: 0 / 6');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
