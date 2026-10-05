import {test,expect} from '@playwright/test';

test('Actius i passius permet estudiar les 20 preguntes sense barrejar tresoreria',async({page})=>{
  await page.goto('/');
  const block=page.locator('[data-selection="uf0519-bloc-6"]');
  await expect(block).toContainText('Actius i passius');
  await expect(block).toContainText('20 preguntes');
  await block.click();
  await page.getByLabel('Mode Examen',{exact:true}).check();
  await page.getByLabel('Totes les disponibles',{exact:true}).check();
  await page.getByRole('button',{name:'Començar',exact:true}).click();
  const ids=new Set();
  for(let i=0;i<20;i++){
    const id=await page.locator('.question-card').getAttribute('data-question-id');
    expect(id).toMatch(/^uf0519-(b5-06[2-9]|b6-0(0[1-9]|1[0-2]))$/);
    ids.add(id);
    if(i<19)await page.getByRole('button',{name:'Següent',exact:true}).click();
  }
  expect(ids.size).toBe(20);
});

test('el bloc independent conserva el progrés i conté 20 targetes bilingües',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('repasActiu:v1',JSON.stringify({version:1,language:'ca',questionStats:{'uf0519-b5-062':{attempts:1,correct:1,incorrect:0,blank:0}},errorScores:{},history:[]})));
  await page.goto('/');
  await expect(page.locator('[data-selection="uf0519-bloc-6"]')).toContainText('100 %');
  await page.getByRole('button',{name:'Targetes de memòria',exact:true}).click();
  await page.locator('[data-study-block="uf0519-bloc-6"] input').check();
  await expect(page.locator('#study-selected-count')).toHaveText('20');
  await page.getByRole('button',{name:'Començar repàs',exact:true}).click();
  const ids=new Set();
  for(let i=0;i<20;i++){
    ids.add(await page.locator('[data-study-card]').getAttribute('data-study-id'));
    await page.locator('[data-study-card]').click();
    await expect(page.locator('[data-study-mnemonic]')).not.toBeEmpty();
    if(i<19)await page.getByRole('button',{name:'Següent targeta',exact:true}).click();
  }
  expect(ids.size).toBe(20);
  const id=await page.locator('[data-study-card]').getAttribute('data-study-id');
  await page.locator('#language-es').click();
  await expect(page.locator('[data-study-card]')).toHaveAttribute('data-study-id',id);
});
