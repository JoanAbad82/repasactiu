import {test,expect} from "@playwright/test";
test("la unitat 3 publica les onze activitats i l'enunciat complet de proveïdors",async({page})=>{
 await page.goto("/");
 await expect(page.getByText("1036 preguntes")).toBeVisible();
 await page.locator("#home-shortcut-examples").click();
 await page.locator('[data-practical-category="stock"]').click();
 await expect(page.locator("[data-stock-exercise]")).toHaveCount(11);
 await page.locator('[data-stock-exercise="004"]').click();
 await expect(page.locator(".stock-reference")).toContainText("Oferta A: 4,00");
 const answers={"a":"48","b":"53,40","c":"52,80","valid":"BC","chosen":"C","saving":"0,60","excluded":"late"};
 for(const [key,value] of Object.entries(answers))await fillStock(page,key,value);
 await page.locator("[data-stock-guided-form] button[type=submit]").click();
 await expect(page.locator(".stock-summary")).toContainText("7/7");
});
async function fillStock(page,key,value){
 const input=page.locator('[data-stock-answer="'+key+'"]');
 if(await input.evaluate(el=>el.tagName==="SELECT"))await input.selectOption(value);
 else await input.fill(value);
}
test("la calculadora funciona dins del cas de trasllats",async({page})=>{
 await page.goto("/");
 await expect(page.getByText("1036 preguntes")).toBeVisible();
 await page.locator("#home-shortcut-examples").click();
 await page.locator('[data-practical-category="stock"]').click();
 await page.locator('[data-stock-exercise="010"]').click();
 await page.locator('[data-stock-answer="a"]').focus();
 await page.locator("[data-stock-calc-a]").fill("50");
 await page.locator('[data-stock-calc-op]').selectOption("-");
 await page.locator("[data-stock-calc-b]").fill("25");
 await page.locator("[data-stock-calc-equals]").click();
 await page.locator("[data-stock-calc-use]").click();
 await expect(page.locator('[data-stock-answer="a"]')).toHaveValue("25");
});
test("la simulació d'oficina calcula les 21 línies sense eines externes",async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto("/");
 await expect(page.getByText("1036 preguntes")).toBeVisible();
 await page.locator("#home-shortcut-examples").click();
 await page.locator('[data-practical-category="stock"]').click();
 await page.locator('[data-stock-exercise="011"]').click();
 await expect(page.locator("[data-stock-office-row]")).toHaveCount(21);
 await expect(page.locator(".stock-reference")).toContainText("SIMULATS");
 const before=await page.locator("[data-stock-office-total]").textContent();
 await page.locator('[data-stock-office-quantity="1"]').fill("3");
 await expect(page.locator('[data-stock-line-total="1"]')).toHaveText("495,00 €");
 expect(await page.locator("[data-stock-office-total]").textContent()).not.toBe(before);
 for(let i=1;i<=21;i++)await page.locator('[data-stock-office-kind="'+i+'"]').selectOption(i<=13?"NF":"F");
 await page.locator("[data-stock-office-check]").click();
 await expect(page.locator(".stock-office-final")).toContainText("21/21");
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
});
test("la categoria d'existències es tradueix al castellà i recupera el progrés",async({page})=>{
 await page.goto("/");
 await expect(page.getByText("1036 preguntes")).toBeVisible();
 await page.locator("#home-shortcut-examples").click();
 await page.locator('[data-practical-category="stock"]').click();
 await page.locator('[data-stock-exercise="003"]').click();
 await page.locator('[data-stock-answer="paper"]').selectOption("F");
 await page.locator("#home-link").click();
 await page.locator("#language-es").click();
 await page.locator("#home-shortcut-examples").click();
 await page.locator('[data-practical-category="stock"]').click();
 await page.locator('[data-stock-exercise="003"]').click();
 await expect(page.locator('[data-stock-answer="paper"]')).toHaveValue("F");
 await expect(page.locator(".stock-reference")).toContainText("F: consumible");
});
