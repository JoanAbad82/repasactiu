import {test,expect} from '@playwright/test';

async function waitForHome(page,language='ca'){
  await expect(page.getByText(language==='es'?'596 preguntas':'596 preguntes')).toBeVisible();
}

test('Examen difícil funciona des de Tot el temari i conserva selecció en canviar d idioma',async({page})=>{
  await page.goto('/');
  await waitForHome(page);
  await page.locator('[data-selection="all"]').click();
  await page.getByLabel('Mode Examen difícil').check();
  await page.getByLabel('10 preguntes').check();
  await page.getByRole('button',{name:'Començar'}).click();

  await expect(page.locator('[data-answer-option]')).toHaveCount(4);
  await expect(page.locator('#study-feedback')).toHaveCount(0);
  await page.locator('[data-answer-option]').nth(1).click();
  await expect(page.locator('[data-answer-option]').nth(1)).toHaveAttribute('aria-pressed','true');

  await page.locator('#language-es').click();
  await expect(page.locator('html')).toHaveAttribute('lang','es');
  await expect(page.locator('[data-answer-option]')).toHaveCount(4);
  await expect(page.locator('[data-answer-option]').nth(1)).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#study-feedback')).toHaveCount(0);
  await expect(page.locator('.memory-aid')).toHaveCount(0);
});

test('Examen difícil completa 10 preguntes, compta blancs, aplica penalització i conserva les opcions a la revisió',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>0;});
  await page.goto('/');
  await waitForHome(page);
  await page.locator('[data-selection="bloc-1"]').click();
  await page.getByLabel('Mode Examen difícil').check();
  await page.getByLabel('10 preguntes').check();
  await page.getByLabel('Amb penalització (−0,33 per error)').check();
  await page.getByRole('button',{name:'Començar'}).click();

  const firstCard=page.locator('.question-card');
  const firstQuestion=await firstCard.locator('h1').innerText();
  const firstOptions=await firstCard.locator('[data-answer-option] > span:nth-child(2)').allInnerTexts();
  expect(firstOptions).toHaveLength(4);

  await firstCard.locator('[data-answer-option]').first().click();
  for(let i=0;i<9;i++){
    await page.getByRole('button',{name:'Següent'}).click();
  }
  await page.getByRole('button',{name:'Finalitzar examen'}).click();

  await expect(page.locator('.results')).toBeVisible();
  await expect(page.getByText('En blanc: 9')).toBeVisible();
  await expect(page.getByText('Puntuació amb penalització')).toBeVisible();

  const history=await page.evaluate(()=>JSON.parse(localStorage.getItem('repasActiu:v1')).history.at(-1));
  expect(history.mode).toBe('hard-exam');
  expect(history.requestedCount).toBe(10);
  expect(history.penaltyEnabled).toBe(true);
  expect(history.total).toBe(10);
  expect(history.blank).toBe(9);

  await page.getByRole('button',{name:'Revisar respostes'}).click();
  await expect(page.locator('.review-item')).toHaveCount(10);
  const firstReview=page.locator('.review-item').first();
  await expect(firstReview.locator('h2')).toHaveText(firstQuestion);
  const reviewText=await firstReview.innerText();
  expect(firstOptions.some(option=>reviewText.includes(option))).toBe(true);
});

test('Examen difícil és usable en castellà en mòbil sense desbordament horitzontal',async({browser})=>{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto('/');
  await waitForHome(page);
  await page.locator('#language-es').click();
  await waitForHome(page,'es');
  await page.locator('[data-selection="uf0518-bloc-1"]').click();
  await page.getByLabel('Modo Examen difícil').check();
  await page.getByLabel('10 preguntas').check();
  await page.getByRole('button',{name:'Comenzar'}).click();

  await expect(page.locator('[data-answer-option]')).toHaveCount(4);
  await expect(page.locator('#study-feedback')).toHaveCount(0);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  await page.close();
});
