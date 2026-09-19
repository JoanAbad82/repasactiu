import {test,expect} from '@playwright/test';

test('Tarjetas de memoria mostra selector bilingüe amb 638 targetes',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Targetes de memòria'}).click();
  await expect(page.locator('html')).toHaveAttribute('lang','ca');
  await expect(page.getByRole('heading',{name:'Targetes de memòria'})).toBeVisible();
  await expect(page.getByText('638 targetes disponibles')).toBeVisible();
  await expect(page.locator('[data-study-block]')).toHaveCount(7);
  await expect(page.locator('[data-study-unit="unitat-1"] h2')).toHaveText('Unitat 1 — Organització empresarial');

  await page.locator('#language-es').click();
  await expect(page.locator('html')).toHaveAttribute('lang','es');
  await expect(page.getByRole('heading',{name:'Tarjetas de memoria'})).toBeVisible();
  await expect(page.getByText('638 tarjetas disponibles')).toBeVisible();
  await expect(page.locator('[data-study-unit="unitat-1"] h2')).toHaveText('Unidad 1 — Organización empresarial');
});

test('els recomptes per bloc inclouen test + extra',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Targetes de memòria'}).click();
  const expected={
    'bloc-1':'66','bloc-2':'86','bloc-3':'86','bloc-4':'76','bloc-5':'76',
    'unitat-2-bloc-1':'156','uf0518-bloc-1':'92'
  };
  for(const [id,count] of Object.entries(expected)){
    await expect(page.locator('[data-study-block="'+id+'"] [data-study-count]')).toHaveText(count);
  }
});

test('Tot el temari selecciona 638 targetes i inicia una baralla mixta',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Targetes de memòria'}).click();
  await page.getByRole('button',{name:'Tot el temari'}).click();
  await expect(page.locator('#study-selected-count')).toHaveText('638');
  await page.getByRole('button',{name:'Començar repàs'}).click();
  await expect(page.locator('[data-study-card]')).toHaveCount(1);
  await expect(page.locator('#study-card-progress')).toHaveText('1 / 638');
  await expect(page.getByRole('button',{name:'Barrejar'})).toBeVisible();
});

test('es poden seleccionar diversos blocs i barrejar-los',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Targetes de memòria'}).click();
  await page.locator('[data-study-block="bloc-1"] input').check();
  await page.locator('[data-study-block="uf0518-bloc-1"] input').check();
  await expect(page.locator('#study-selected-count')).toHaveText('158');
  await page.getByRole('button',{name:'Començar repàs'}).click();
  await expect(page.locator('#study-card-progress')).toHaveText('1 / 158');
  await page.getByRole('button',{name:'Barrejar'}).click();
  await expect(page.locator('#study-card-progress')).toHaveText('1 / 158');
});

test('seleccionar una unitat marca tots els seus blocs',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Targetes de memòria'}).click();
  await page.getByRole('button',{name:'Seleccionar Unitat 1'}).click();
  await expect(page.locator('#study-selected-count')).toHaveText('390');
  for(const id of ['bloc-1','bloc-2','bloc-3','bloc-4','bloc-5']){
    await expect(page.locator('[data-study-block="'+id+'"] input')).toBeChecked();
  }
});

test('la flashcard mostra pregunta, resposta i mnemotècnia en català',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Targetes de memòria'}).click();
  await page.locator('[data-study-block="bloc-1"] input').check();
  await page.getByRole('button',{name:'Començar repàs'}).click();
  const card=page.locator('[data-study-card]');
  await expect(page.getByText('PREGUNTA',{exact:true})).toBeVisible();
  await card.click();
  await expect(page.getByText('RESPOSTA',{exact:true})).toBeVisible();
  await expect(page.getByText('Mnemotècnia',{exact:true})).toBeVisible();
  await expect(page.locator('[data-study-mnemonic]')).not.toBeEmpty();
});

test('canviar CA/ES durant el repàs conserva la mateixa targeta',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Targetes de memòria'}).click();
  await page.locator('[data-study-block="bloc-1"] input').check();
  await page.getByRole('button',{name:'Començar repàs'}).click();
  const id=await page.locator('[data-study-card]').getAttribute('data-study-id');
  const caQuestion=await page.locator('[data-study-question]').textContent();
  await page.locator('#language-es').click();
  await expect(page.locator('[data-study-card]')).toHaveAttribute('data-study-id',id);
  const esQuestion=await page.locator('[data-study-question]').textContent();
  expect(esQuestion).not.toBe(caQuestion);
  await expect(page.locator('[data-study-card]')).toHaveAttribute('aria-pressed','false');
});

test('siguiente canvia de targeta i sempre torna a la pregunta',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Targetes de memòria'}).click();
  await page.locator('[data-study-block="bloc-1"] input').check();
  await page.getByRole('button',{name:'Començar repàs'}).click();
  const card=page.locator('[data-study-card]');
  await card.click();
  await page.getByRole('button',{name:'Següent targeta'}).click();
  await expect(card).toHaveAttribute('aria-pressed','false');
  await expect(page.locator('#study-card-progress')).toHaveText('2 / 66');
});

test('Enter gira la targeta amb teclat',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Targetes de memòria'}).click();
  await page.locator('[data-study-block="bloc-1"] input').check();
  await page.getByRole('button',{name:'Començar repàs'}).click();
  const card=page.locator('[data-study-card]');
  await card.focus();
  await page.keyboard.press('Enter');
  await expect(card).toHaveAttribute('aria-pressed','true');
});

test('el selector i la targeta no desborden en mòbil',async({browser})=>{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto('/');
  await page.getByRole('button',{name:'Targetes de memòria'}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth)).toBe(false);
  await page.getByRole('button',{name:'Tot el temari'}).click();
  await page.getByRole('button',{name:'Començar repàs'}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth)).toBe(false);
  await page.close();
});
