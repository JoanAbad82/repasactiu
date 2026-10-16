import {test,expect} from '@playwright/test';
async function openEmotions(page){
 await page.goto('/');
 await page.locator('#home-shortcut-examples').click();
 await page.locator('[data-practical-category="communication"]').click();
 await page.locator('[data-communication-variant="emotions"]').click();
 await expect(page.locator('[data-emotions-practice]')).toBeVisible();
}
test('Marta-Àlex-Sònia case, stages, six open questions and solution gate are operational',async({page})=>{
 await openEmotions(page);
 await expect(page.locator('[data-emotion-item]')).toHaveCount(6);
 await expect(page.locator('[data-emotion-solution]')).toHaveCount(0);
 await expect(page.locator('[data-emotions-practice]')).toContainText('Aquesta activitat no té nota');
 await page.locator('[data-emotions-form] button[type=submit]').click();
 await expect(page.locator('[data-emotion-incomplete]')).toBeVisible();
 for(const id of ['1','2','3','4','5','reflection'])await page.locator('[data-emotion-answer="'+id+'"]').fill('El grup proposa identificar els fets, revisar el correu i parlar amb respecte.');
 await page.locator('[data-emotions-form] button[type=submit]').click();
 await expect(page.locator('[data-emotion-solution]')).toHaveCount(6);
 await expect(page.locator('[data-emotion-note]')).toContainText('no es corregeixen automàticament');
 await page.locator('[data-emotion-answer="3"]').fill('Una nova proposta');
 await expect(page.locator('[data-emotion-solution]')).toHaveCount(0);
 await page.locator('[data-emotion-reset]').click();
 await expect(page.locator('[data-emotion-answer="3"]')).toHaveValue('');
 await page.locator('[data-communication-variant="activities"]').click();
 await expect(page.locator('[data-communication-activities]')).toBeVisible();
});
test('mobile and language switching retain group responses and the original classification exercise',async({page})=>{
 await page.setViewportSize({width:360,height:780});
 await openEmotions(page);
 await page.locator('[data-emotion-members]').fill('Grup 1');
 await page.locator('[data-emotion-answer="1"]').fill('La Marta està preocupada pel termini.');
 await page.locator('#language-es').click();
 await expect(page.locator('[data-emotions-practice]')).toContainText('Comunicación y gestión');
 await expect(page.locator('[data-emotion-members]')).toHaveValue('Grup 1');
 await expect(page.locator('[data-emotion-answer="1"]')).toHaveValue('La Marta està preocupada pel termini.');
 await page.locator('#theme-toggle').click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 expect(await page.locator('[data-emotions-practice]').evaluate(el=>el.scrollWidth>el.clientWidth+2)).toBe(false);
 await page.locator('[data-communication-variant="classification"]').click();
 await expect(page.locator('[data-comm-case]')).toHaveCount(5);
});
