import {test,expect} from "@playwright/test";

async function openGuide(page){
  await page.goto("/");
  await expect(page.getByText("664 preguntes")).toBeVisible();
  await page.getByRole("button",{name:"Correspondència",exact:true}).click();
}

test("Correspondència comercial mostra la guia i les 10 parts de la carta",async({page})=>{
  await openGuide(page);
  await expect(page.getByRole("heading",{name:"Correspondència comercial"})).toBeVisible();
  await expect(page.locator(".correspondence-structure-item")).toHaveCount(10);
  await expect(page.getByText("Capçalera: dades de l’empresa remitent")).toBeVisible();
  await expect(page.getByRole("heading",{name:"Plantilla de treball"})).toBeVisible();
});

test("els vuit models estan agrupats i es poden consultar",async({page})=>{
  await openGuide(page);
  await page.getByRole("button",{name:"Models",exact:true}).click();
  await expect(page.locator("[data-commercial-model]")).toHaveCount(8);
  const reclamacio=page.locator('[data-commercial-model="reclamacio"]');
  await reclamacio.locator("summary").click();
  await expect(reclamacio).toContainText("Reclamació per mercaderia deteriorada");
  await expect(reclamacio).toContainText("Sol·licitem la recollida dels articles afectats");
  await expect(reclamacio).toContainText("Material del curs · p. 9");
});

test("la secció d'abreviatures publica 26 entrades per idioma i la font oficial",async({page})=>{
  await openGuide(page);
  await page.getByRole("button",{name:"Abreviatures",exact:true}).click();
  await expect(page.locator(".abbreviation-entry")).toHaveCount(26);
  await expect(page.getByText("a/",{exact:true})).toBeVisible();
  await expect(page.getByText("Generalitat de Catalunya · Abreviacions · 3a edició revisada (2021)")).toBeVisible();

  await page.locator("#language-es").click();
  await expect(page.getByRole("heading",{name:"Correspondencia comercial"})).toBeVisible();
  await expect(page.getByRole("button",{name:"Abreviaturas",exact:true})).toHaveAttribute("aria-pressed","true");
  await expect(page.locator(".abbreviation-entry")).toHaveCount(26);
  await expect(page.getByText("A/A",{exact:true})).toBeVisible();
  const source=page.getByRole("link",{name:/Real Academia Española/});
  await expect(source).toBeVisible();
  await expect(source).toHaveAttribute("href",/rae\.es\/buen-uso-espa/);
});

test("la guia no desborda horitzontalment en mòbil",async({browser})=>{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await openGuide(page);
  await page.getByRole("button",{name:"Models",exact:true}).click();
  await page.locator('[data-commercial-model="presentacio"] summary').click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth)).toBe(false);
  await page.getByRole("button",{name:"Abreviatures",exact:true}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth)).toBe(false);
  await page.close();
});
