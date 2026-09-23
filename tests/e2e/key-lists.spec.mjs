import {test,expect} from '@playwright/test';

async function openLists(page){
  await page.goto('/');
  await expect(page.getByText('830 preguntes')).toBeVisible();
  await page.getByRole('button',{name:'Diccionari',exact:true}).click();
  await page.getByRole('button',{name:'Llistes clau',exact:true}).click();
}

test('el diccionari publica 74 llistes clau agrupades en deu famílies',async({page})=>{
  await openLists(page);
  await expect(page.locator('[data-key-list-id]')).toHaveCount(74);
  await expect(page.locator('[data-key-list-family]')).toHaveCount(10);
  await expect(page.locator('[data-dictionary-count]')).toHaveText('74');
  await expect(page.getByText('74 llistes')).toBeVisible();
  await expect(page.locator('[data-key-list-id="uf2-criteris-canal"]')).toContainText('Contingut');
  await expect(page.locator('[data-key-list-id="uf2-criteris-canal"]')).toContainText('Traçabilitat');
  await expect(page.locator('[data-key-list-id="uf2-criteris-canal"] .concept-source')).toHaveText('UF0518_B2 · p. 21');
});

test('les seqüències indiquen que l’ordre és important',async({page})=>{
  await openLists(page);
  const archive=page.locator('[data-key-list-id="uf3-proces-arxiu"]');
  await expect(archive).toContainText('Ordre important');
  await expect(archive.locator('ol li')).toHaveCount(5);
  await expect(archive.locator('ol li').first()).toHaveText('Rebre o generar el document');
  await expect(archive.locator('ol li').last()).toHaveText('Guardar, custodiar i recuperar');
  await expect(archive).toContainText('R-C-R-C-G');
});

test('la cerca i el filtre funcionen també sobre les llistes',async({page})=>{
  await openLists(page);
  await page.locator('[data-dictionary-filter]').selectOption('bloc-5');
  await expect(page.locator('[data-key-list-id]')).toHaveCount(4);
  await page.locator('[data-dictionary-search]').fill('Unió Europea');
  await expect(page.locator('[data-key-list-id]')).toHaveCount(1);
  await expect(page.locator('[data-key-list-id="b5-institucions-ue"]')).toBeVisible();
});

test('les llistes canvien a castellà mantenint la pestanya activa',async({page})=>{
  await openLists(page);
  await page.locator('[data-dictionary-filter]').selectOption('uf0518-bloc-2');
  await page.locator('#language-es').click();
  await expect(page.locator('html')).toHaveAttribute('lang','es');
  await expect(page.getByRole('button',{name:'Listas clave',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('[data-dictionary-filter]')).toHaveValue('uf0518-bloc-2');
  await expect(page.locator('[data-key-list-id]')).toHaveCount(9);
  await expect(page.locator('[data-key-list-id="uf2-criteris-canal"]')).toContainText('Criterios principales para elegir un canal de envío');
  await expect(page.locator('[data-key-list-id="uf2-criteris-canal"]')).toContainText('Trazabilidad');
});

test('les llistes clau no desborden en mòbil',async({browser})=>{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await openLists(page);
  await expect(page.locator('[data-key-list-id]')).toHaveCount(74);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
  await page.locator('[data-dictionary-search]').fill('classificació');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
  await page.close();
});


test('UF0519 publica les seqüències documentals noves amb traçabilitat',async({page})=>{
  await openLists(page);
  await page.locator('[data-dictionary-filter]').selectOption('uf0519-bloc-1');
  await expect(page.locator('[data-key-list-id]')).toHaveCount(6);
  const circuit=page.locator('[data-key-list-id="uf519-circuit-documental-list"]');
  await expect(circuit).toContainText('Ordre important');
  await expect(circuit.locator('ol li')).toHaveCount(5);
  await expect(circuit.locator('.concept-source')).toHaveText('UF0519_U1 · p. 8');
});
