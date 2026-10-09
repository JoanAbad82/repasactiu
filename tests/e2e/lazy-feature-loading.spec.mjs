import {test,expect} from '@playwright/test';

const optionalFiles=[
 'study-cards-extra.json','study-cards-semantic-v2.json','study-cards-traceability-v2.json',
 'concept-dictionary-v1.json','key-lists-v1.json','hangman-bank-v2.json',
 'commercial-correspondence-v1.json','payroll-example-2026-v1.json',
 'administrative-exercises-v1.json','treasury-practice-v1.json'
];

test('la portada no descarrega bancs opcionals fins a obrir les eines',async({page})=>{
 const requested=[];
 page.on('request',request=>requested.push(request.url()));
 await page.goto('/');
 await expect(page.getByText('1009 preguntes')).toBeVisible();
 await page.waitForLoadState('networkidle');
 expect(optionalFiles.filter(name=>requested.some(url=>url.endsWith('/'+name)))).toEqual([]);
 await page.locator('#home-shortcut-study').click();
 await expect(page.getByRole('heading',{name:'Targetes de memòria'})).toBeVisible();
 await page.waitForLoadState('networkidle');
 expect(requested.some(url=>url.endsWith('/study-cards-extra.json'))).toBe(true);
 expect(requested.some(url=>url.endsWith('/hangman-bank-v2.json'))).toBe(false);
});

test('els bancs carregats es reutilitzen en tornar a obrir el diccionari',async({page})=>{
 const files=[];
 page.on('request',request=>{if(request.url().endsWith('/concept-dictionary-v1.json'))files.push(request.url());});
 await page.goto('/');
 await expect(page.getByText('1009 preguntes')).toBeVisible();
 await page.locator('#home-shortcut-dictionary').click();
 await expect(page.getByRole('heading',{name:'Diccionari de conceptes clau'})).toBeVisible();
 await page.locator('#home-link').click();
 await page.locator('#home-shortcut-dictionary').click();
 await expect(page.getByRole('heading',{name:'Diccionari de conceptes clau'})).toBeVisible();
 expect(files).toHaveLength(1);
});

test('un error de descàrrega permet tornar a provar sense recarregar tota la web',async({page})=>{
 let failed=false;
 await page.route('**/data/hangman-bank-v2.json',route=>{
  if(!failed){failed=true;return route.fulfill({status:503,contentType:'text/plain',body:'indisponible'});}
  return route.continue();
 });
 await page.goto('/');
 await expect(page.getByText('1009 preguntes')).toBeVisible();
 await page.locator('#hangman-card').click();
 await expect(page.locator('[data-tool-error-title]')).toHaveText('No s’ha pogut carregar aquesta eina.');
 await page.locator('#language-es').click();
 await expect(page.locator('[data-tool-error-title]')).toHaveText('No se ha podido cargar esta herramienta.');
 await page.locator('[data-tool-retry]').click();
 await expect(page.getByRole('heading',{name:'Ahorcado de conceptos'})).toBeVisible();
 expect(failed).toBe(true);
});

test('una descàrrega tardana no pot reobrir una pantalla que ja s’ha abandonat',async({page})=>{
 let release;
 let signal;
 const requested=new Promise(resolve=>{signal=resolve;});
 const pending=new Promise(resolve=>{release=resolve;});
 await page.route('**/data/study-cards-extra.json',async route=>{
  signal();await pending;await route.continue();
 });
 await page.goto('/');
 await expect(page.getByText('1009 preguntes')).toBeVisible();
 await page.locator('#home-shortcut-study').click();
 await requested;
 await expect(page.locator('[data-tool-loading]')).toBeVisible();
 await page.locator('#home-link').click();
 release();
 await page.waitForLoadState('networkidle');
 await expect(page.locator('#home-screen')).toBeVisible();
 await expect(page.locator('#study-cards-screen')).toBeHidden();
});
