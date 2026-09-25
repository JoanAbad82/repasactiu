import {test,expect} from "@playwright/test";

async function openGuide(page){
  await page.goto("/");
  await expect(page.getByText("842 preguntes")).toBeVisible();
  await page.getByRole("button",{name:"Exemples pràctics",exact:true}).click();
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


test("Exemples pràctics incorpora el cas de nòmina amb càlcul complet i vista bilingüe",async({page})=>{
  await page.goto("/");
  await expect(page.getByText("842 preguntes")).toBeVisible();
  await page.getByRole("button",{name:"Exemples pràctics",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Exemples pràctics"})).toBeVisible();
  await page.getByRole("button",{name:"Nòmines",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Nòmina: càlcul bàsic pas a pas"})).toBeVisible();
  await expect(page.locator(".payroll-example")).toContainText("1.496,24");
  await expect(page.locator(".payroll-example")).toContainText("P-D-B-C-I-L");
  await expect(page.locator(".payroll-table tbody tr")).toHaveCount(4);
  await page.locator("#language-es").click();
  await expect(page.getByRole("heading",{name:"Ejemplos prácticos"})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Nómina: cálculo básico paso a paso"})).toBeVisible();
  await expect(page.locator(".payroll-example")).toContainText("1.496,24");
});

test("la nòmina no desborda horitzontalment en mòbil",async({browser})=>{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto("/");
  await page.getByRole("button",{name:"Exemples pràctics",exact:true}).click();
  await page.getByRole("button",{name:"Nòmines",exact:true}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth)).toBe(false);
  await page.close();
});


test("la pràctica interactiva de nòmina guia els 11 imports i accepta formats locals",async({page})=>{
  await page.goto("/");
  await expect(page.getByText("842 preguntes")).toBeVisible();
  await page.getByRole("button",{name:"Exemples pràctics",exact:true}).click();
  await page.getByRole("button",{name:"Nòmines",exact:true}).click();
  await page.getByRole("button",{name:"Practicar una nòmina",exact:true}).click();

  await expect(page.getByRole("heading",{name:"Practica aquesta nòmina"})).toBeVisible();
  await expect(page.getByText("Pas 1 de 11")).toBeVisible();

  const input=()=>page.locator("[data-payroll-practice-input]");
  await input().fill("200");
  await page.getByRole("button",{name:"Comprovar",exact:true}).click();
  await expect(page.getByText("Pista:",{exact:false})).toBeVisible();
  await expect(page.getByText("Solució del pas:",{exact:false})).toHaveCount(0);

  await input().fill("210");
  await page.getByRole("button",{name:"Comprovar",exact:true}).click();
  await expect(page.getByText("Solució del pas:",{exact:false})).toBeVisible();
  await page.getByRole("button",{name:"Usar el resultat i continuar",exact:true}).click();

  const answers=["1.750,00","1750","82,25 €","27.13","1,75","2.63","113,76","140","253.76","1.496,24 €"];
  for(const answer of answers){
    await page.locator("[data-payroll-practice-input]").fill(answer);
    await page.getByRole("button",{name:"Comprovar",exact:true}).click();
  }

  await expect(page.getByRole("heading",{name:"Nòmina completada"})).toBeVisible();
  await expect(page.getByText("10/11 encerts al primer intent.")).toBeVisible();
  await expect(page.locator(".practice-finish")).toContainText("1.496,24 €");

  await page.locator("#language-es").click();
  await expect(page.getByRole("heading",{name:"Nómina completada"})).toBeVisible();
  await expect(page.getByText("10/11 aciertos al primer intento.")).toBeVisible();
});

test("la pràctica de nòmina és usable en mòbil sense desbordament horitzontal",async({browser})=>{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto("/");
  await page.getByRole("button",{name:"Exemples pràctics",exact:true}).click();
  await page.getByRole("button",{name:"Nòmines",exact:true}).click();
  await page.getByRole("button",{name:"Practicar una nòmina",exact:true}).click();
  await expect(page.locator("[data-payroll-practice-input]")).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth)).toBe(false);
  await page.close();
});
