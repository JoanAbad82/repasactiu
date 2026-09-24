import {test,expect} from '@playwright/test';

test('el diccionari mostra 106 conceptes agrupats en 17 famílies pedagògiques',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Diccionari',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Diccionari de conceptes clau'})).toBeVisible();
  await expect(page.locator('[data-concept-id]')).toHaveCount(106);
  await expect(page.locator('[data-concept-family]')).toHaveCount(17);
  await expect(page.locator('[data-dictionary-count]')).toHaveText('106');
  await expect(page.getByText('106 conceptes')).toBeVisible();
});

test('l’ordre inicial és conceptual i manté junts els conceptes relacionats',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Diccionari',exact:true}).click();
  const firstFamily=page.locator('[data-concept-family]').first();
  await expect(firstFamily).toHaveAttribute('data-concept-family','entity-company-forms');
  await expect(firstFamily.getByRole('heading',{name:'Formes d’empresa i estructura jurídica'})).toBeVisible();
  await expect(firstFamily.locator('[data-concept-id]')).toHaveCount(6);
  await expect(firstFamily.locator('[data-concept-id]').nth(0)).toHaveAttribute('data-concept-id','b2-lucrativa-no-lucrativa');
  await expect(firstFamily.locator('[data-concept-id]').nth(1)).toHaveAttribute('data-concept-id','b2-empresa-individual');
  await expect(firstFamily.locator('[data-concept-id]').nth(2)).toHaveAttribute('data-concept-id','b2-societat');
  await expect(firstFamily.locator('[data-concept-id]').nth(3)).toHaveAttribute('data-concept-id','b2-personalitat-juridica');
  await expect(firstFamily.locator('[data-concept-id]').nth(4)).toHaveAttribute('data-concept-id','b2-sa-sl');
});

test('entitat pública i privada queden connectades amb Administracions i Estat',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Diccionari',exact:true}).click();
  const family=page.locator('[data-concept-family="public-administration-state"]');
  await expect(family.getByRole('heading',{name:'Sector públic, privat i Administracions'})).toBeVisible();
  await expect(family.locator('[data-concept-id]')).toHaveCount(6);
  await expect(family.locator('[data-concept-id]').nth(0)).toHaveAttribute('data-concept-id','b1-entitat-publica');
  await expect(family.locator('[data-concept-id]').nth(1)).toHaveAttribute('data-concept-id','b1-entitat-privada');
  await expect(family.locator('[data-concept-id]').nth(2)).toHaveAttribute('data-concept-id','b5-poders-estat');
});

test('la cerca troba conceptes sense exigir accents i conserva la família',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Diccionari',exact:true}).click();
  const search=page.locator('[data-dictionary-search]');
  await search.fill('delegacio');
  await expect(page.locator('[data-concept-id]')).toHaveCount(1);
  await expect(page.locator('[data-concept-family="organization-structure-authority"]')).toBeVisible();
  await expect(page.locator('[data-concept-id="b3-delegacio"]')).toContainText('Delegació');
  await expect(page.locator('[data-concept-id="b3-delegacio"]')).toContainText('Delegar ≠ desentendre’s');
});

test('el filtre del bloc 5 conserva les dues famílies conceptuals corresponents',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Diccionari',exact:true}).click();
  await page.locator('[data-dictionary-filter]').selectOption('bloc-5');
  await expect(page.locator('[data-concept-id]')).toHaveCount(10);
  await expect(page.locator('[data-dictionary-count]')).toHaveText('10');
  await expect(page.locator('[data-concept-family]')).toHaveCount(2);
  await expect(page.locator('[data-concept-family="public-administration-state"] [data-concept-id]')).toHaveCount(4);
  await expect(page.locator('[data-concept-family="european-union"] [data-concept-id]')).toHaveCount(6);
  await expect(page.locator('[data-concept-id="b5-reglament-directiva"]')).toBeVisible();
});

test('el diccionari canvia íntegrament a castellà i conserva el filtre',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Diccionari',exact:true}).click();
  await page.locator('[data-dictionary-filter]').selectOption('uf0518-bloc-1');
  await page.locator('#language-es').click();
  await expect(page.getByRole('heading',{name:'Diccionario de conceptos clave'})).toBeVisible();
  await expect(page.locator('[data-dictionary-filter]')).toHaveValue('uf0518-bloc-1');
  await expect(page.locator('[data-concept-id]')).toHaveCount(7);
  await expect(page.locator('[data-concept-family="written-communication"]')).toBeVisible();
  await expect(page.locator('[data-concept-id="uf-canal-codi"]')).toContainText('Canal vs. código');
  await expect(page.locator('[data-concept-id="uf-canal-codi"]')).toContainText('Recuerda:');
});

test('el diccionari mostra la traçabilitat de pàgina',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Diccionari',exact:true}).click();
  await page.locator('[data-dictionary-search]').fill('transposició');
  await expect(page.locator('[data-concept-id="b5-transposicio"] .concept-source')).toHaveText('B5 · p. 19');
});


test('el nou bloc UF0518 B2 aporta 9 conceptes connectats en dues famílies',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Diccionari',exact:true}).click();
  await page.locator('[data-dictionary-filter]').selectOption('uf0518-bloc-2');
  await expect(page.locator('[data-concept-id]')).toHaveCount(9);
  await expect(page.locator('[data-dictionary-count]')).toHaveText('9');
  await expect(page.locator('[data-concept-family="digital-office-communication"] [data-concept-id="uf2-cc-cco"]')).toBeVisible();
  await expect(page.locator('[data-concept-family="correspondence-shipping-security"] [data-concept-id]')).toHaveCount(6);
  await expect(page.locator('[data-concept-family="document-archive-management"] [data-concept-id]')).toHaveCount(2);
  await expect(page.locator('[data-concept-id="uf2-tracabilitat"]')).toContainText('Traçabilitat');
});

test('el nou bloc UF0518 B3 aporta 12 conceptes connectats a arxiu i comunicació digital',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Diccionari',exact:true}).click();
  await page.locator('[data-dictionary-filter]').selectOption('uf0518-bloc-3');
  await expect(page.locator('[data-concept-id]')).toHaveCount(12);
  await expect(page.locator('[data-dictionary-count]')).toHaveText('12');
  await expect(page.locator('[data-concept-family="document-archive-management"] [data-concept-id]')).toHaveCount(7);
  await expect(page.locator('[data-concept-family="digital-office-communication"] [data-concept-id]')).toHaveCount(5);
  await expect(page.locator('[data-concept-id="uf3-arxiu-documental"]')).toContainText('Arxiu documental');
  await expect(page.locator('[data-concept-id="uf3-phishing"]')).toContainText('Phishing');
});

test('el diccionari no desborda en mòbil',async({browser})=>{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto('/');
  await page.getByRole('button',{name:'Diccionari',exact:true}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth)).toBe(false);
  await expect(page.locator('[data-concept-family]')).toHaveCount(17);
  await page.locator('[data-dictionary-search]').fill('sinergia');
  await expect(page.locator('[data-concept-id]')).toHaveCount(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth)).toBe(false);
  await page.close();
});


test('UF0519 incorpora conceptes de documents, facturació i nòmina',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Diccionari',exact:true}).click();
  await page.locator('[data-dictionary-filter]').selectOption('uf0519-bloc-2');
  await expect(page.locator('[data-concept-id]')).toHaveCount(8);
  await expect(page.locator('[data-concept-id="uf519-albara"]')).toContainText('Albarà');
  await expect(page.locator('[data-concept-id="uf519-iva-repercutit-suportat"]')).toBeVisible();
  await page.locator('#language-es').click();
  await expect(page.locator('[data-concept-id="uf519-albara"]')).toContainText('Albarán');
});
