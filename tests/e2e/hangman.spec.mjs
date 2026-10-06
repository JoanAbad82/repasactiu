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
  await expect(page.locator('.hangman-summary')).toContainText('308 conceptes disponibles');
  await expect(page.locator('[data-hangman-filter] option')).toHaveCount(18);

  const firstId=await page.locator('[data-hangman-entry]').getAttribute('data-hangman-entry');
  page.once('dialog',async dialog=>{
    expect(dialog.message()).toContain("reiniciarà la ronda actual");
    await dialog.accept();
  });
  await page.locator('#language-es').click();
  await expect(page.getByRole('heading',{name:'Ahorcado de conceptos'})).toBeVisible();
  await expect(page.locator('[data-hangman-entry]')).toHaveAttribute('data-hangman-entry',firstId);
  await expect(page.locator('.hangman-keyboard button')).toHaveCount(27);
  await expect(page.locator('.hangman-summary')).toContainText('308 conceptos disponibles');
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


test('les paraules compostes salten de línia senceres i mai es parteixen entre lletres',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(()=>{Math.random=()=>0.03793103448275863;});
  await page.goto('/');
  await page.locator('#language-es').click();
  await page.locator('#hangman-card').click();
  await page.locator('[data-hangman-filter]').selectOption('uf0519-unitat-2-bloc-2');

  const entry=page.locator('[data-hangman-entry]');
  await expect(entry).toHaveAttribute('data-hangman-entry','dict:uf519-descompte-comercial');
  const tokens=page.locator('.hangman-word-token');
  await expect(tokens).toHaveCount(2);

  const layout=await tokens.evaluateAll(nodes=>nodes.map(node=>{
    const rect=node.getBoundingClientRect();
    const childTops=[...node.querySelectorAll('.hangman-char,.hangman-punct')].map(child=>Math.round(child.getBoundingClientRect().top));
    return {top:Math.round(rect.top),right:rect.right,width:rect.width,childRows:new Set(childTops).size};
  }));
  expect(layout[0].childRows).toBe(1);
  expect(layout[1].childRows).toBe(1);
  expect(layout[1].top).toBeGreaterThan(layout[0].top);
  const wordRight=await page.locator('.hangman-word').evaluate(node=>node.getBoundingClientRect().right);
  expect(layout.every(item=>item.right<=wordRight+1)).toBe(true);
});

test('una paraula llarga es compacta en mòbil sense desbordar ni partir-se',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(()=>{Math.random=()=>0.1952380952380952;});
  await page.goto('/');
  await page.locator('#language-es').click();
  await page.locator('#hangman-card').click();
  await page.locator('[data-hangman-filter]').selectOption('bloc-3');

  await expect(page.locator('[data-hangman-entry]')).toHaveAttribute('data-hangman-entry','dict:b3-descentralitzacio');
  const token=page.locator('.hangman-word-token');
  await expect(token).toHaveCount(1);
  await expect(token).toHaveClass(/is-long-word/);
  const layout=await token.evaluate(node=>{
    const rect=node.getBoundingClientRect();
    const parent=node.parentElement.getBoundingClientRect();
    const childTops=[...node.querySelectorAll('.hangman-char,.hangman-punct')].map(child=>Math.round(child.getBoundingClientRect().top));
    return {fits:rect.width<=parent.width+1,rightFits:rect.right<=parent.right+1,childRows:new Set(childTops).size};
  });
  expect(layout).toEqual({fits:true,rightFits:true,childRows:1});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth)).toBe(false);
});


test('el penjat cobreix els 17 blocs publicats i Actius i passius té contingut propi',async({page})=>{
  await page.goto('/');
  await page.locator('#hangman-card').click();
  const filter=page.locator('[data-hangman-filter]');
  await expect(filter.locator('option')).toHaveCount(18);
  await filter.selectOption('uf0519-bloc-6');
  await expect(page.locator('.hangman-summary')).toContainText('6 conceptes disponibles');
  await expect(page.locator('[data-hangman-entry]')).toHaveCount(1);
  await expect(page.locator('.hangman-definition')).not.toBeEmpty();

  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#language-es').click();
  await expect(page.locator('.hangman-summary')).toContainText('6 conceptos disponibles');
  await expect(page.locator('[data-hangman-entry]')).toHaveCount(1);
});
