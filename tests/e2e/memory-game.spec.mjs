import {test,expect} from '@playwright/test';

test('Tarjetas de memoria abre un juego íntegramente en español con nivel Fácil 4x4',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Tarjetas de memoria'}).click();
  await expect(page.locator('html')).toHaveAttribute('lang','es');
  await expect(page.getByRole('button',{name:'Temario',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Repasar errores',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:/Claro\/Oscuro/})).toBeVisible();
  await expect(page.locator('#language-ca')).toBeDisabled();
  await expect(page.locator('#language-es')).toBeDisabled();
  await expect(page.getByRole('heading',{name:'Tarjetas de memoria'})).toBeVisible();
  await expect(page.getByText('Encuentra las parejas relacionadas')).toBeVisible();
  await expect(page.locator('[data-memory-card]')).toHaveCount(16);
  await expect(page.locator('#memory-moves')).toHaveText('0');
  await expect(page.locator('#memory-time')).toHaveText('0:00');
  await expect(page.locator('#memory-matches')).toHaveText('0/8');
  await expect(page.getByRole('button',{name:'Reiniciar'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Nivel: Fácil'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Pista'})).toBeVisible();
});

test('al volver al temario restaura el idioma previo',async({page})=>{
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang','ca');
  await page.getByRole('button',{name:'Tarjetas de memoria'}).click();
  await expect(page.locator('html')).toHaveAttribute('lang','es');
  await page.getByRole('button',{name:'← Volver al temario'}).click();
  await expect(page.locator('html')).toHaveAttribute('lang','ca');
  await expect(page.getByRole('button',{name:'Temari',exact:true})).toBeVisible();
});

test('el nivel Difícil usa 18 parejas y 36 tarjetas',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Tarjetas de memoria'}).click();
  await page.getByRole('button',{name:'Nivel: Fácil'}).click();
  await expect(page.getByRole('button',{name:'Nivel: Difícil'})).toBeVisible();
  await expect(page.locator('[data-memory-card]')).toHaveCount(36);
  await expect(page.locator('#memory-matches')).toHaveText('0/18');
});

test('una pareja correcta queda bloqueada y aumenta el contador',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>0.12345;});
  await page.goto('/');
  await page.getByRole('button',{name:'Tarjetas de memoria'}).click();
  const pairId=await page.locator('[data-memory-card]').first().getAttribute('data-pair-id');
  const pair=page.locator('[data-memory-card][data-pair-id="'+pairId+'"]');
  await pair.nth(0).click();
  await pair.nth(1).click();
  await expect(pair.nth(0)).toHaveAttribute('data-matched','true');
  await expect(pair.nth(1)).toHaveAttribute('data-matched','true');
  await expect(pair.nth(0)).toBeDisabled();
  await expect(pair.nth(1)).toBeDisabled();
  await expect(page.locator('#memory-matches')).toHaveText('1/8');
  await expect(page.locator('#memory-moves')).toHaveText('1');
});

test('una pareja incorrecta se vuelve a ocultar después de un segundo',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Tarjetas de memoria'}).click();
  const cards=page.locator('[data-memory-card]');
  const first=cards.nth(0);
  const firstPair=await first.getAttribute('data-pair-id');
  let secondIndex=1;
  for(let i=1;i<16;i++){
    if(await cards.nth(i).getAttribute('data-pair-id')!==firstPair){secondIndex=i;break;}
  }
  const second=cards.nth(secondIndex);
  await first.click();
  await second.click();
  await expect(first).toHaveAttribute('aria-pressed','true');
  await expect(second).toHaveAttribute('aria-pressed','true');
  await page.waitForTimeout(1100);
  await expect(first).toHaveAttribute('aria-pressed','false');
  await expect(second).toHaveAttribute('aria-pressed','false');
  await expect(page.locator('#memory-moves')).toHaveText('1');
});

test('Pista resalta temporalmente exactamente las dos tarjetas de una misma pareja',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Tarjetas de memoria'}).click();
  await page.getByRole('button',{name:'Pista'}).click();
  const hinted=page.locator('[data-memory-card].is-hint');
  await expect(hinted).toHaveCount(2);
  const ids=await hinted.evaluateAll(nodes=>nodes.map(node=>node.dataset.pairId));
  expect(new Set(ids).size).toBe(1);
  await page.waitForTimeout(1300);
  await expect(page.locator('[data-memory-card].is-hint')).toHaveCount(0);
});

test('Reiniciar crea una partida limpia',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Tarjetas de memoria'}).click();
  await page.locator('[data-memory-card]').first().click();
  await page.getByRole('button',{name:'Reiniciar'}).click();
  await expect(page.locator('#memory-moves')).toHaveText('0');
  await expect(page.locator('#memory-time')).toHaveText('0:00');
  await expect(page.locator('#memory-matches')).toHaveText('0/8');
  await expect(page.locator('[data-memory-card][aria-pressed="true"]')).toHaveCount(0);
});

test('completar las ocho parejas termina la partida',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>0.2222;});
  await page.goto('/');
  await page.getByRole('button',{name:'Tarjetas de memoria'}).click();
  const ids=await page.locator('[data-memory-card]').evaluateAll(nodes=>[...new Set(nodes.map(node=>node.dataset.pairId))]);
  expect(ids).toHaveLength(8);
  for(const id of ids){
    const pair=page.locator('[data-memory-card][data-pair-id="'+id+'"]');
    await pair.nth(0).click();
    await pair.nth(1).click();
  }
  await expect(page.locator('#memory-matches')).toHaveText('8/8');
  await expect(page.getByText('¡Tablero completado!')).toBeVisible();
});

test('las tarjetas son navegables con teclado',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Tarjetas de memoria'}).click();
  const first=page.locator('[data-memory-card]').first();
  await first.focus();
  await page.keyboard.press('Enter');
  await expect(first).toHaveAttribute('aria-pressed','true');
  await expect(first.locator('.memory-card-face.front')).toBeVisible();
});

test('el tablero no desborda horizontalmente en móvil',async({browser})=>{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto('/');
  await page.getByRole('button',{name:'Tarjetas de memoria'}).click();
  const easyOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
  expect(easyOverflow).toBe(false);
  await page.getByRole('button',{name:'Nivel: Fácil'}).click();
  const hardOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
  expect(hardOverflow).toBe(false);
  await page.close();
});
