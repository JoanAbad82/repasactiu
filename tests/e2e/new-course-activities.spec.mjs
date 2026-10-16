import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {inventoryExpected} from '../../site/js/new-course-activities.js';
const data=JSON.parse(await readFile(new URL('../../site/data/new-course-activities-202610.json',import.meta.url),'utf8'));
async function visitNew(page){
 await page.goto('/');
 await expect(page.getByText('1135 preguntes')).toBeVisible();
 await page.locator('#home-shortcut-examples').click();
 await page.locator('[data-practical-category="new"]').click();
 await expect(page.getByText('Activitats noves · octubre 2026')).toBeVisible();
}
test('els tres inventaris originals resolen correctament 12 saldos cadascun',async({page})=>{
 await visitNew(page);
 for(const c of data.inventory.cases){
  await page.locator('[data-new-case="'+c.id+'"]').click();
  const expected=inventoryExpected(c);
  await expect(page.locator('[data-inventory-row]')).toHaveCount(8);
  for(let i=0;i<8;i++)await page.locator('[data-inventory-row="'+i+'"]').fill(String(expected.rows[i]));
  for(let i=0;i<4;i++)await page.locator('[data-inventory-final="'+i+'"]').fill(String(expected.final[i]));
  await page.locator('[data-new-check]').click();
  await expect(page.locator('.stock-summary')).toContainText('12/12');
 }
});
test('els llibres auxiliars calculen el saldo i exporten un CSV',async({page})=>{
 await visitNew(page);await page.locator('[data-new-tab="books"]').click();
 await page.locator('[data-book-initial]').fill('20,50');
 await page.locator('[data-book-field="entrada"][data-book-index="0"]').fill('10');
 await page.locator('[data-book-field="sortida"][data-book-index="1"]').fill('4,25');
 await expect(page.locator('[data-book-balance="1"]')).toContainText('26,25');
 const downloaded=page.waitForEvent('download');
 await page.locator('[data-new-book-export]').click();
 const file=await downloaded;
 expect(file.suggestedFilename()).toBe('llibre-auxiliar-caixa.csv');
 await page.locator('[data-new-book="bancs"]').click();
 await expect(page.locator('[data-book-balance="0"]')).toContainText('0,00');
});
test('el comparador d’habitatge mostra els dos costos, en català i castellà',async({page})=>{
 await visitNew(page);await page.locator('[data-new-tab="housing"]').click();
 await page.locator('[data-house="rent"]').fill('700');
 await page.locator('[data-house="buy"]').fill('140000');
 await page.locator('[data-house-calc]').click();
 await expect(page.locator('.stock-new-table')).toContainText('42.500,00');
 await expect(page.locator('.stock-new-table')).toContainText('1900,00');
 await page.locator('#language-es').click();
 await expect(page.getByRole('heading',{name:'Alquilar o comprar'})).toBeVisible();
 await expect(page.locator('.stock-new-table')).toContainText('42.500,00');
});
