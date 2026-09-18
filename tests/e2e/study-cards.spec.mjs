import {test,expect} from '@playwright/test';

test('Tarjetas de memoria abre una sola flashcard en español',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Tarjetas de memoria'}).click();
  await expect(page.locator('html')).toHaveAttribute('lang','es');
  await expect(page.locator('[data-study-card]')).toHaveCount(1);
  await expect(page.getByText('PREGUNTA',{exact:true})).toBeVisible();
  await expect(page.getByText('Toca para girar',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Barajar'})).toBeVisible();
  await expect(page.locator('#study-card-progress')).toHaveText('1 / 42');
  await expect(page.getByText('Movimientos',{exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:/Nivel:/})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Pista'})).toHaveCount(0);
});

test('clic en la tarjeta gira de pregunta a respuesta con mnemotecnia',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Tarjetas de memoria'}).click();
  const card=page.locator('[data-study-card]');
  await expect(card).toHaveAttribute('aria-pressed','false');
  await card.click();
  await expect(card).toHaveAttribute('aria-pressed','true');
  await expect(page.getByText('RESPUESTA',{exact:true})).toBeVisible();
  await expect(page.getByText('Mnemotecnia',{exact:true})).toBeVisible();
  await expect(page.locator('[data-study-mnemonic]')).not.toBeEmpty();
  await card.click();
  await expect(card).toHaveAttribute('aria-pressed','false');
});

test('siguiente cambia de tarjeta y vuelve siempre al anverso',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Tarjetas de memoria'}).click();
  const card=page.locator('[data-study-card]');
  const firstQuestion=await page.locator('[data-study-question]').textContent();
  await card.click();
  await page.getByRole('button',{name:'Siguiente tarjeta'}).click();
  await expect(card).toHaveAttribute('aria-pressed','false');
  const secondQuestion=await page.locator('[data-study-question]').textContent();
  expect(secondQuestion).not.toBe(firstQuestion);
  await expect(page.locator('#study-card-progress')).toHaveText('2 / 42');
});

test('anterior desde la primera tarjeta navega circularmente a la última',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Tarjetas de memoria'}).click();
  await page.getByRole('button',{name:'Tarjeta anterior'}).click();
  await expect(page.locator('#study-card-progress')).toHaveText('42 / 42');
});

test('Barajar mantiene una sola tarjeta y reinicia en la primera',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Tarjetas de memoria'}).click();
  await page.getByRole('button',{name:'Siguiente tarjeta'}).click();
  await expect(page.locator('#study-card-progress')).toHaveText('2 / 42');
  await page.getByRole('button',{name:'Barajar'}).click();
  await expect(page.locator('[data-study-card]')).toHaveCount(1);
  await expect(page.locator('#study-card-progress')).toHaveText('1 / 42');
  await expect(page.locator('[data-study-card]')).toHaveAttribute('aria-pressed','false');
});

test('Enter gira la tarjeta con teclado',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Tarjetas de memoria'}).click();
  const card=page.locator('[data-study-card]');
  await card.focus();
  await page.keyboard.press('Enter');
  await expect(card).toHaveAttribute('aria-pressed','true');
});

test('al volver al temario se restaura el idioma anterior',async({page})=>{
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang','ca');
  await page.getByRole('button',{name:'Tarjetas de memoria'}).click();
  await expect(page.locator('html')).toHaveAttribute('lang','es');
  await page.getByRole('button',{name:'← Volver al temario'}).click();
  await expect(page.locator('html')).toHaveAttribute('lang','ca');
});

test('la flashcard no desborda horizontalmente en móvil',async({browser})=>{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto('/');
  await page.getByRole('button',{name:'Tarjetas de memoria'}).click();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  await page.close();
});
