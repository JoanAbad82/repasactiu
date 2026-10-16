import {test,expect} from '@playwright/test';
async function openPractice(page){
 await page.goto('/');
 await page.locator('#home-shortcut-examples').click();
 await page.locator('[data-practical-category="communication"]').click();
 await expect(page.locator('[data-communication-practice]')).toBeVisible();
}
test('UF0520 communication/information exercise reproduces five original situations and scores classifications only after justifications',async({page})=>{
 await openPractice(page);
 await expect(page.locator('[data-comm-case]')).toHaveCount(5);
 await expect(page.locator('[data-comm-feedback]')).toHaveCount(0);
 await page.locator('[data-comm-form] button[type="submit"]').click();
 await expect(page.locator('[data-comm-incomplete]')).toBeVisible();
 const values=['informacio','comunicacio','informacio','comunicacio','informacio'];
 for(let i=0;i<5;i++){
  const key=String(i+1).padStart(2,'0');
  await page.locator('[data-comm-case="'+key+'"] input[value="'+values[i]+'"]').check();
  await page.locator('[data-comm-reason="'+key+'"]').fill('Aquest cas descriu el nivell d’intercanvi entre les persones.');
 }
 await expect(page.locator('[data-comm-feedback]')).toHaveCount(0);
 await page.locator('[data-comm-form] button[type="submit"]').click();
 await expect(page.locator('[data-comm-feedback]')).toHaveCount(5);
 await expect(page.locator('[data-comm-score]')).toContainText('5 de 5');
 await expect(page.locator('[data-comm-feedback="01"]')).toContainText('no s’hi descriu cap intercanvi de respostes');
 await page.locator('[data-comm-case="01"] input[value="comunicacio"]').check();
 await expect(page.locator('[data-comm-score]')).toHaveCount(0);
 await expect(page.locator('[data-comm-feedback]')).toHaveCount(0);
 await page.locator('[data-comm-reset]').click();
 await expect(page.locator('[data-comm-score]')).toHaveCount(0);
 await expect(page.locator('[data-comm-case="01"] input:checked')).toHaveCount(0);
});
test('UF0520 exercise keeps answers and free-text justifications when changing language, and works at narrow mobile width',async({page})=>{
 await page.setViewportSize({width:360,height:760});
 await openPractice(page);
 await expect(page.locator('[data-comm-case]')).toHaveCount(5);
 await page.locator('[data-comm-case="02"] input[value="comunicacio"]').check();
 await page.locator('[data-comm-reason="02"]').fill('Parlen i intercanvien respostes.');
 await page.locator('#language-es').click();
 await expect(page.locator('[data-comm-case="02"] legend')).toContainText('Una clienta pregunta');
 await expect(page.locator('[data-comm-case="02"] input[value="comunicacio"]')).toBeChecked();
 await expect(page.locator('[data-comm-reason="02"]')).toHaveValue('Parlen i intercanvien respostes.');
 await expect(page.locator('[data-communication-practice]')).toContainText('En sentido amplio');
 const overflows=await page.locator('[data-communication-practice]').evaluate(el=>el.scrollWidth>el.clientWidth+2);
 expect(overflows).toBe(false);
});
