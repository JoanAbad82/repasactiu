import {test,expect} from "@playwright/test";

const ADMIN_TAB="Documents administratius i comercials";

async function openAdmin(page){
  await page.goto("/");
  await expect(page.getByText("948 preguntes")).toBeVisible();
  await page.getByRole("button",{name:"Exemples pràctics",exact:true}).click();
  await page.getByRole("button",{name:ADMIN_TAB,exact:true}).click();
  await expect(page.getByRole("heading",{name:ADMIN_TAB})).toBeVisible();
}

const goSheet=(page,id)=>page.locator(`.admin-sheet-nav [data-admin-sheet="${id}"]`).click();

const sheet6={
  orderNumber:"123/08",
  orderDate:"2025-11-05",
  buyerName:"Software Reus, SL",
  buyerNif:"B08999999",
  buyerAddress:"carrer Arenys, 56 de Barcelona (08000)",
  supplierName:"Distrisoft, SA",
  supplierNif:"A08444445",
  supplierAddress:"carrer Gran, 4 de Tarragona (43000)",
  item1Ref:"MM",item1Qty:"10",item1Price:"290",item1Line:"2900",
  item2Ref:"GG",item2Qty:"50",item2Price:"130",item2Line:"6500",
  item3Ref:"UU",item3Qty:"30",item3Price:"200",item3Line:"6000",
  item4Ref:"LL",item4Qty:"75",item4Price:"250",item4Line:"18750",
  discountPercent:"3",
  deliveryAddress:"carrer Arenys, 56 de Barcelona (08000)",
  paymentDays:"30",
  maxDeliveryDays:"10",
  latestDelivery:"2025-11-15",
  subtotal:"34150",
  discountAmount:"1024,5",
  totalBeforeTax:"33125,5"
};

async function fillSheet6(page){
  for(const [key,value] of Object.entries(sheet6))await page.locator(`[data-admin-input="${key}"]`).fill(value);
  await page.locator('[data-admin-input="paymentMethod"]').selectOption("transfer");
}

test("la nova categoria d'exemples pràctics mostra els 9 fulls d'exercicis",async({page})=>{
  await openAdmin(page);
  await expect(page.locator("[data-admin-sheet]")).toHaveCount(9);
  await expect(page.getByText("Full 1 de 9")).toBeVisible();
  await expect(page.locator(".admin-reference")).toContainText("Cicle comercial de la compravenda");
  await expect(page.locator(".admin-reference")).toContainText("Categories de gestió documental");
  await goSheet(page,"sheet-6");
  await expect(page.getByText("Full 6 de 9")).toBeVisible();
  await expect(page.locator(".admin-scenario")).toContainText("Software Reus, SL");
});

test("es poden resoldre els fulls 1 i 3 amb correcció objectiva",async({page})=>{
  await openAdmin(page);
  await page.locator('[data-admin-input="s1-q1"]').fill("muebles garcia sl");
  await page.locator('[data-admin-input="s1-q2"]').fill("DecoHogar, S.A.");
  await page.locator('[data-admin-input="s1-q3"]').selectOption("factura");
  await page.getByRole("button",{name:"Comprovar",exact:true}).click();
  await expect(page.locator(".admin-feedback-correct")).toContainText("Molt bé!");

  await goSheet(page,"sheet-3");
  await page.locator('[data-admin-input="s3-rank-pedido"]').selectOption("1");
  await page.locator('[data-admin-input="s3-rank-albaran"]').selectOption("2");
  await page.locator('[data-admin-input="s3-rank-factura"]').selectOption("3");
  await page.locator('[data-admin-input="s3-explanation"]').fill("La comanda demana, l’albarà lliura i la factura cobra.");
  await page.getByRole("button",{name:"Comprovar",exact:true}).click();
  await expect(page.locator(".admin-feedback-correct")).toContainText("Molt bé!");
  await expect(page.locator(".admin-model")).toContainText("La factura detalla l’operació realitzada");
});

test("després de dos intents fallits es poden revelar els valors esperats",async({page})=>{
  await openAdmin(page);
  await page.getByRole("button",{name:"Comprovar",exact:true}).click();
  await expect(page.locator(".admin-feedback-wrong")).toContainText("Encara hi ha camps per corregir");
  await expect(page.getByRole("button",{name:"Mostrar els valors esperats",exact:true})).toHaveCount(0);
  await expect(page.locator('[data-admin-field="s1-q1"] .admin-field-note')).toContainText("Pista");

  await page.getByRole("button",{name:"Comprovar",exact:true}).click();
  await page.getByRole("button",{name:"Mostrar els valors esperats",exact:true}).click();
  await expect(page.locator('[data-admin-field="s1-q1"] .admin-field-note')).toContainText("Muebles García S.L.");
});

test("la comanda del full 6 es pot confeccionar completament",async({page})=>{
  await openAdmin(page);
  await goSheet(page,"sheet-6");
  await expect(page.getByText("Total abans d’impostos = subtotal − descompte")).toBeVisible();
  await expect(page.getByText("No hi afegeixis IVA")).toBeVisible();
  await fillSheet6(page);
  await page.getByRole("button",{name:"Comprovar",exact:true}).click();
  await expect(page.locator(".admin-feedback-correct")).toContainText("Molt bé!");
  await expect(page.locator(".admin-sheet-done")).toHaveCount(1);
});

test("la calculadora envia el resultat al camp numèric seleccionat",async({page})=>{
  await openAdmin(page);
  await goSheet(page,"sheet-6");
  await page.locator('[data-admin-input="item1Line"]').click();
  const calc=page.getByRole("complementary",{name:"Calculadora"});
  for(const key of ["1","0","×","2","9","0"])await calc.locator(`[data-admin-calc-key="${key}"]`).click();
  await calc.locator("[data-admin-calc-equals]").click();
  await expect(calc.locator("[data-admin-calc-display]")).toHaveText("2900");
  await calc.locator("[data-admin-calc-use]").click();
  await expect(page.locator('[data-admin-input="item1Line"]')).toHaveValue("2900");
});

test("l'ajuda de dates calcula i copia la data límit de lliurament",async({page})=>{
  await openAdmin(page);
  await goSheet(page,"sheet-6");
  const helper=page.locator(".admin-date-helper");
  await helper.locator("[data-admin-date-base]").fill("2025-11-05");
  await helper.locator("[data-admin-date-days]").fill("10");
  await helper.getByRole("button",{name:"Calcular data",exact:true}).click();
  await expect(helper.locator("[data-admin-date-result]")).toHaveText("15/11/2025");
  await helper.getByRole("button",{name:"Copiar a la data de lliurament",exact:true}).click();
  await expect(page.locator('[data-admin-input="latestDelivery"]')).toHaveValue("2025-11-15");
});

test("els fulls 6-9 mostren una nota de traducció del lloc en castellà",async({page})=>{
  await openAdmin(page);
  await page.locator("#language-es").click();
  await expect(page.getByRole("heading",{name:"Documentos administrativos y comerciales"})).toBeVisible();
  await goSheet(page,"sheet-6");
  await expect(page.locator(".admin-translation-note")).toContainText("traducción del sitio web");
  await goSheet(page,"sheet-1");
  await expect(page.locator(".admin-translation-note")).toHaveCount(0);
});

test("la comanda no desborda horitzontalment en mòbil",async({browser})=>{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await openAdmin(page);
  await goSheet(page,"sheet-6");
  await expect(page.locator('[data-admin-input="subtotal"]')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth)).toBe(false);
  await page.close();
});
