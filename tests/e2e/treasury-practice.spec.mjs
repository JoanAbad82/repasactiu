import {test,expect} from "@playwright/test";

async function openTreasury(page){
  await page.goto("/");
  await expect(page.getByText("948 preguntes")).toBeVisible();
  await page.getByRole("button",{name:"Exemples pràctics",exact:true}).click();
  await page.getByRole("button",{name:"Tresoreria",exact:true}).click();
}

test("Exemples pràctics incorpora un circuit de tresoreria de 10 incidències amb font per pàgina",async({page})=>{
  await openTreasury(page);
  await expect(page.getByRole("heading",{name:"Circuit pràctic de tresoreria"})).toBeVisible();
  await expect(page.getByText("Incidència 1 de 10")).toBeVisible();
  await expect(page.locator(".practical-source")).toContainText("2. Gestió_bàsica_tresoreria.pdf");
  await expect(page.locator(".practical-source")).toContainText("p. 14");
  await expect(page.locator(".treasury-option")).toHaveCount(4);
});

test("la pràctica guia l’error, revela l’explicació al segon intent i permet avançar",async({page})=>{
  await openTreasury(page);

  await page.getByText("Acceptar els 1.000 € en efectiu perquè el límit només afecta imports superiors",{exact:true}).click();
  await page.getByRole("button",{name:"Comprovar resposta",exact:true}).click();
  await expect(page.getByText("Encara no és correcte.",{exact:true})).toBeVisible();
  await expect(page.locator(".practice-feedback")).toContainText("Pista:");

  await page.getByRole("button",{name:"Comprovar resposta",exact:true}).click();
  await expect(page.locator(".practice-feedback")).toContainText("Explicació:");
  await expect(page.locator(".practice-feedback")).toContainText("igual o superior a 1.000 €");

  await page.getByText("No tramitar el pagament en efectiu i utilitzar un altre mitjà admès",{exact:true}).click();
  await page.getByRole("button",{name:"Comprovar resposta",exact:true}).click();
  await expect(page.getByText("Correcte.",{exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Següent incidència",exact:true}).click();
  await expect(page.getByText("Incidència 2 de 10")).toBeVisible();
  await expect(page.locator(".practical-source")).toContainText("p. 16");
});

test("la pràctica de tresoreria canvia a castellà i és usable en mòbil",async({browser})=>{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await openTreasury(page);
  await page.locator("#language-es").click();
  await expect(page.getByRole("heading",{name:"Circuito práctico de tesorería"})).toBeVisible();
  await expect(page.getByText("Incidencia 1 de 10")).toBeVisible();
  await expect(page.getByRole("button",{name:"Comprobar respuesta",exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
  await page.close();
});
