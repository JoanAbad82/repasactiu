import {test,expect} from '@playwright/test';

test('UF0519 Unitat 2 separa els blocs 1 i 2 i publica 41 preguntes noves',async({page})=>{
  await page.goto('/');
  const b1=page.locator('[data-block-card][data-selection="uf0519-unitat-2-bloc-1"]');
  const b2=page.locator('[data-block-card][data-selection="uf0519-unitat-2-bloc-2"]');
  await expect(b1).toBeVisible();
  await expect(b1).toContainText('30 preguntes');
  await expect(b2).toBeVisible();
  await expect(b2).toContainText('Caixa, bancs, seguretat i mitjans informàtics de tresoreria');
  await expect(b2).toContainText('41 preguntes');

  await page.locator('#language-es').click();
  await expect(b2).toContainText('Caja, bancos, seguridad y medios informáticos de tesorería');
  await expect(b2).toContainText('41 preguntas');
});

test('les targetes agrupen els dos blocs de la nova Unitat 2 en 77 targetes',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Targetes de memòria'}).click();
  const unit=page.locator('[data-study-unit="uf0519-unitat-2"]');
  await expect(unit).toBeVisible();
  await expect(unit).toContainText('77 targetes');
  await expect(unit.locator('[data-study-block="uf0519-unitat-2-bloc-1"] [data-study-count]')).toHaveText('36');
  await expect(unit.locator('[data-study-block="uf0519-unitat-2-bloc-2"] [data-study-count]')).toHaveText('41');
  await unit.locator('[data-study-action="unit"]').click();
  await expect(page.locator('#study-selected-count')).toHaveText('77');
  await page.getByRole('button',{name:'Començar repàs'}).click();
  await expect(page.locator('#study-card-progress')).toHaveText('1 / 77');
});

test('el diccionari conserva 22 conceptes i el penjat amplia el Bloc 2 a 29 entrades',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Diccionari',exact:true}).click();
  await page.locator('[data-dictionary-filter]').selectOption('uf0519-unitat-2-bloc-2');
  await expect(page.locator('[data-concept-id]')).toHaveCount(22);
  await expect(page.locator('[data-dictionary-count]')).toHaveText('22');
  await expect(page.locator('[data-concept-id="uf519-factoring"]')).toContainText('Factoring');
  await expect(page.locator('[data-concept-id="uf519-datafon"]')).toContainText('Datàfon');

  await page.getByRole('button',{name:'← Tornar al temari'}).click();
  await page.locator('#hangman-card').click();
  await page.locator('[data-hangman-filter]').selectOption('uf0519-unitat-2-bloc-2');
  await expect(page.locator('.hangman-summary')).toContainText('29 conceptes disponibles');
  await expect(page.locator('[data-hangman-entry]')).toHaveCount(1);
});

test('el nou Bloc 2 és usable en mòbil sense desbordament',async({browser})=>{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto('/');
  const b2=page.locator('[data-block-card][data-selection="uf0519-unitat-2-bloc-2"]');
  await expect(b2).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth)).toBe(false);
  await b2.click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth)).toBe(false);
  await page.close();
});
