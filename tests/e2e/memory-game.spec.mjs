import {test,expect} from '@playwright/test';

test('Tarjetas de memoria abre un juego español independiente con nivel Fácil 4x4',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Tarjetas de memoria'}).click();
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
  await expect(page.locator('#memory-matches')).toHaveText('1/8');
  await expect(page.locator('#memory-moves')).toHaveText('1');
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
