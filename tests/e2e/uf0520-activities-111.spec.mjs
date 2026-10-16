import {test,expect} from '@playwright/test';
async function openWorkbook(page){
 await page.goto('/');
 await page.locator('#home-shortcut-examples').click();
 await page.locator('[data-practical-category="communication"]').click();
 await expect(page.locator('[data-communication-practice]')).toBeVisible();
 await page.locator('[data-communication-variant="activities"]').click();
 await expect(page.locator('[data-communication-activities]')).toBeVisible();
}
test('UF0520 activities 1.1.1: original 27 questions in 4 sections; solved answers revealed only when all written',async({page})=>{
 await openWorkbook(page);
 await expect(page.locator('[data-activity-section]')).toHaveCount(4);
 await expect(page.locator('[data-activity-item]')).toHaveCount(4);
 await expect(page.locator('[data-activity-solution]')).toHaveCount(0);
 await page.locator('[data-activity-form] button[type="submit"]').click();
 await expect(page.locator('[data-activity-incomplete]')).toBeVisible();
 for(let i=1;i<=4;i++)await page.locator('[data-activity-answer="1.'+i+'"]').fill('Resposta reflexionada número '+i);
 await page.locator('[data-activity-form] button[type="submit"]').click();
 await expect(page.locator('[data-activity-solution]')).toHaveCount(4);
 await page.locator('[data-activity-answer="1.1"]').fill('He rectificat aquesta resposta');
 await expect(page.locator('[data-activity-solution]')).toHaveCount(0);
 await page.locator('[data-activity-section="2"]').click();
 await expect(page.locator('[data-activity-item]')).toHaveCount(7);
 await page.locator('[data-activity-section="3"]').click();
 await expect(page.locator('[data-activity-item]')).toHaveCount(8);
 await expect(page.locator('.comm-activities-context')).toContainText('Clara');
 await page.locator('[data-activity-section="4"]').click();
 await expect(page.locator('[data-activity-item]')).toHaveCount(8);
 await expect(page.locator('[data-activity-item="4.8"]')).toContainText('quantitats');
 await page.locator('[data-activity-section="1"]').click();
 await expect(page.locator('[data-activity-answer="1.1"]')).toHaveValue('He rectificat aquesta resposta');
 await page.locator('[data-communication-variant="classification"]').click();
 await expect(page.locator('[data-comm-case]')).toHaveCount(5);
});
test('UF0520 activities: mobile dark theme and Catalan-Spanish switching retain the same free-text answer',async({page})=>{
 await page.setViewportSize({width:360,height:780});
 await openWorkbook(page);
 await page.locator('[data-activity-answer="1.2"]').fill('Resposta en català amb exemples');
 await page.locator('#language-es').click();
 await expect(page.locator('[data-communication-activities]')).toContainText('Actividades 1.1.1');
 await expect(page.locator('[data-activity-answer="1.2"]')).toHaveValue('Resposta en català amb exemples');
 await page.locator('#theme-toggle').click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 const overflow=await page.locator('[data-communication-activities]').evaluate(el=>el.scrollWidth>el.clientWidth+2);
 expect(overflow).toBe(false);
 await page.locator('[data-activity-section="4"]').click();
 await expect(page.locator('[data-activity-item]')).toHaveCount(8);
 await expect(page.locator('[data-activity-item="4.7"]')).toContainText('9:00 a 14:00');
});
