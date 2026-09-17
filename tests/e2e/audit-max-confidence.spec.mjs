import {test,expect} from '@playwright/test';

async function waitForHome(page,language='ca'){
  await expect(page.getByText(language==='es'?'526 preguntas':'526 preguntes')).toBeVisible();
}

test('un error pendent persisteix i es pot obrir en mode de repàs',async({page})=>{
  await page.goto('/');
  await page.evaluate(()=>localStorage.setItem('repasActiu:v1',JSON.stringify({
    version:1,
    theme:'system',
    language:'ca',
    errorScores:{'b1-001':2},
    questionStats:{'b1-001':{attempts:2,correct:0,incorrect:2,blank:0}},
    history:[]
  })));
  await page.reload();
  await waitForHome(page);
  await expect(page.getByText('Preguntes pendents de repàs: 1')).toBeVisible();
  await page.getByRole('button',{name:'Repassar errors',exact:true}).click();
  await page.getByRole('button',{name:'Començar',exact:true}).click();
  await expect(page.locator('[data-answer-option]')).toHaveCount(4);
  await expect(page.locator('.question-card h1')).not.toBeEmpty();
  await page.locator('#language-es').click();
  await expect(page.locator('html')).toHaveAttribute('lang','es');
  await expect(page.locator('[data-answer-option]')).toHaveCount(4);
  await page.reload();
  await waitForHome(page,'es');
  await expect(page.getByText('Preguntas pendientes de repaso: 1')).toBeVisible();
});

test('un examen de 10 preguntas llega a resultados y contabiliza blancos',async({page})=>{
  await page.goto('/');
  await waitForHome(page);
  await page.locator('[data-selection="bloc-1"]').click();
  await page.getByLabel('Mode Examen').check();
  await page.getByLabel('10 preguntes').check();
  await page.getByRole('button',{name:'Començar'}).click();

  await page.locator('[data-answer-option]').first().click();
  for(let i=1;i<=9;i++){
    await page.getByRole('button',{name:i===9?'Finalitzar examen':'Següent'}).click();
  }

  await expect(page.locator('.results')).toBeVisible();
  await expect(page.getByText('En blanc: 9')).toBeVisible();
  await expect(page.getByRole('button',{name:'Revisar respostes'})).toBeVisible();
  await page.getByRole('button',{name:'Revisar respostes'}).click();
  await expect(page.locator('.review-item')).toHaveCount(10);
});

test('UF0518 és usable en castellà en viewport mòbil sense desbordament horitzontal',async({browser})=>{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto('/');
  await waitForHome(page);
  await page.locator('#language-es').click();
  await waitForHome(page,'es');
  await page.locator('[data-selection="uf0518-bloc-1"]').click();
  await page.getByLabel('Modo Estudio').check();
  await page.getByLabel('10 preguntas').check();
  await page.getByRole('button',{name:'Comenzar'}).click();
  await expect(page.locator('[data-answer-option]')).toHaveCount(4);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  await page.close();
});
