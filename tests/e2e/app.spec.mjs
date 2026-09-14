import { test, expect } from '@playwright/test';

test('la portada mostra dues unitats, sis blocs i 320 preguntes', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Repàs Actiu').first()).toBeVisible();
  await expect(page.getByText('Operacions auxiliars de serveis administratius i generals')).toBeVisible();
  await expect(page.getByText('Unitat 1 — Organització empresarial')).toBeVisible();
  await expect(page.getByText('Unitat 2 — L’organització dels recursos humans')).toBeVisible();
  await expect(page.locator('[data-unit-group]')).toHaveCount(2);
  await expect(page.locator('[data-block-card]')).toHaveCount(7);
  await expect(page.getByText('320 preguntes')).toBeVisible();
  await expect(page.locator('[data-selection="bloc-1"]')).toContainText('42 preguntes');
  await expect(page.locator('[data-selection="bloc-2"]')).toContainText('56 preguntes');
  await expect(page.locator('[data-selection="bloc-3"]')).toContainText('56 preguntes');
  await expect(page.locator('[data-selection="bloc-4"]')).toContainText('40 preguntes');
  await expect(page.locator('[data-selection="bloc-5"]')).toContainText('46 preguntes');
  await expect(page.locator('[data-selection="unitat-2-bloc-1"]')).toContainText('80 preguntes');
  await expect(page.locator('[href*="openutilitylab"]')).toHaveCount(0);
});

test('tota la interfície canvia a castellà i la preferència persisteix', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#language-ca')).toHaveAttribute('aria-pressed','true');
  await page.locator('#language-es').click();
  await expect(page.locator('html')).toHaveAttribute('lang','es');
  await expect(page.locator('#language-es')).toHaveAttribute('aria-pressed','true');
  await expect(page.getByText('Operaciones auxiliares de servicios administrativos y generales')).toBeVisible();
  await expect(page.getByText('Unidad 1 — Organización empresarial')).toBeVisible();
  await expect(page.getByText('Unidad 2 — La organización de los recursos humanos')).toBeVisible();
  await expect(page.getByText('320 preguntas')).toBeVisible();
  await expect(page.getByRole('button',{name:'Temario',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Repasar errores',exact:true})).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang','es');
  await expect(page.locator('#language-es')).toHaveAttribute('aria-pressed','true');
  await expect(page.getByText('320 preguntas')).toBeVisible();
});

test('el peu d’avís es mostra en català i canvia íntegrament a castellà', async ({ page }) => {
  await page.goto('/');
  const footer=page.locator('.site-footer');
  const caTitle=page.locator('#material-notice-title .material-notice-ca');
  const esTitle=page.locator('#material-notice-title .material-notice-es');
  await expect(footer).toBeVisible();
  await expect(caTitle).toBeVisible();
  await expect(esTitle).toBeHidden();
  await expect(caTitle).toHaveText('Avís sobre el material');
  await expect(page.locator('#material-notice-primary .material-notice-ca')).toContainText('El contingut no és material oficial');
  await expect(page.locator('#material-notice-temporary .material-notice-ca')).toContainText('Un cop finalitzat el curs, està previst retirar-ne el contingut.');
  await page.locator('#language-es').click();
  await expect(caTitle).toBeHidden();
  await expect(esTitle).toBeVisible();
  await expect(esTitle).toHaveText('Aviso sobre el material');
  await expect(page.locator('#material-notice-primary .material-notice-es')).toContainText('El contenido no es material oficial');
  await expect(page.locator('#material-notice-temporary .material-notice-es')).toContainText('Una vez finalizado el curso, está previsto retirar su contenido.');
});

test('les preguntes i explicacions també es mostren en castellà', async ({ page }) => {
  await page.goto('/');
  await page.locator('#language-es').click();
  await page.locator('[data-selection="bloc-1"]').click();
  await page.getByLabel('Modo Estudio').check();
  await page.getByLabel('10 preguntas').check();
  await page.getByRole('button',{name:'Comenzar'}).click();
  await expect(page.locator('[data-answer-option]')).toHaveCount(4);
  const questionText=await page.locator('.question-card h1').innerText();
  expect(questionText).not.toMatch(/\bQuina\b|\bQuin\b|\bQuè\b|\bD’on\b/);
  await page.locator('[data-answer-option]').first().click();
  await expect(page.locator('#study-feedback')).toContainText(/Respuesta correcta|Respuesta incorrecta/);
  await expect(page.getByRole('button',{name:'Siguiente'})).toBeEnabled();
});

test('el canvi d’idioma durant un test conserva la resposta seleccionada', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-selection="bloc-1"]').click();
  await page.getByRole('button',{name:'Començar'}).click();
  await page.locator('[data-answer-option]').first().click();
  await expect(page.locator('[data-answer-option]').first()).toHaveAttribute('aria-pressed','true');
  await page.locator('#language-es').click();
  await expect(page.locator('html')).toHaveAttribute('lang','es');
  await expect(page.locator('[data-answer-option]').first()).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#study-feedback')).toContainText(/Respuesta correcta|Respuesta incorrecta/);
});

test('Mode Estudi mostra correcció i explicació immediata', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-selection="bloc-1"]').click();
  await page.getByLabel('Mode Estudi').check();
  await page.getByLabel('10 preguntes').check();
  await page.getByRole('button', { name: 'Començar' }).click();
  await expect(page.locator('[data-answer-option]')).toHaveCount(4);
  await page.locator('[data-answer-option]').first().click();
  await expect(page.locator('#study-feedback')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Següent' })).toBeEnabled();
});

test('la Unitat 2 es pot practicar de manera independent', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-selection="unitat-2-bloc-1"]').click();
  await expect(page.locator('#setup-screen .eyebrow')).toContainText('Unitat 2');
  await page.getByLabel('10 preguntes').check();
  await page.getByRole('button', { name: 'Començar' }).click();
  await expect(page.locator('[data-answer-option]')).toHaveCount(4);
});

test('Mode Examen no revela solucions durant el test i permet blancs', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-selection="bloc-1"]').click();
  await page.getByLabel('Mode Examen').check();
  await page.getByLabel('10 preguntes').check();
  await page.getByRole('button', { name: 'Començar' }).click();
  await page.locator('[data-answer-option]').first().click();
  await expect(page.locator('#study-feedback')).toHaveCount(0);
  await page.getByRole('button', { name: 'Següent' }).click();
  await expect(page.getByText('Pregunta 2 de 10')).toBeVisible();
  await page.getByRole('button', { name: 'Següent' }).click();
  await expect(page.getByText('Pregunta 3 de 10')).toBeVisible();
});

test('Repassar errors informa quan no hi ha pendents', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Repassar errors' }).click();
  await page.getByRole('button', { name: 'Començar' }).click();
  await expect(page.getByText('Encara no tens preguntes pendents de repàs')).toBeVisible();
});

test('l’estat buit de repàs es manté i es tradueix en canviar d’idioma', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Repassar errors' }).click();
  await page.getByRole('button', { name: 'Començar' }).click();
  await expect(page.getByText('Encara no tens preguntes pendents de repàs')).toBeVisible();
  await page.locator('#language-es').click();
  await expect(page.getByText('Todavía no tienes preguntas pendientes de repaso')).toBeVisible();
  await expect(page.getByRole('button',{name:'Comenzar'})).toHaveCount(0);
});

test('el mode de color es conserva després de recarregar', async ({ page }) => {
  await page.goto('/');
  const before = await page.locator('html').getAttribute('data-theme');
  await page.getByRole('button', { name: /Clar\/Fosc/ }).click();
  const after = await page.locator('html').getAttribute('data-theme');
  expect(after).not.toBe(before);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', after);
});

test('la pregunta és usable en mòbil', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('/');
  await page.locator('[data-selection="bloc-1"]').click();
  await page.getByRole('button', { name: 'Començar' }).click();
  await expect(page.locator('[data-answer-option]')).toHaveCount(4);
  await page.close();
});
