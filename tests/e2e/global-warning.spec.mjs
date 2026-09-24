import {test,expect} from "@playwright/test";

const caWarning="Contrasteu sempre les respostes amb els apunts i materials oficials del curs.";
const esWarning="Contrasta siempre las respuestas con los apuntes y materiales oficiales del curso.";

test("l'avís global es mostra a dalt i es manté en navegar per la web",async({page})=>{
  await page.goto("/");
  await expect(page.getByText("842 preguntes")).toBeVisible();
  const warning=page.locator(".official-material-warning");
  await expect(warning).toBeVisible();
  await expect(warning).toContainText("MOLT IMPORTANT:");
  await expect(warning).toContainText(caWarning);
  await expect(warning).toContainText("Repàs Actiu és una eina de suport no oficial i pot contenir errors.");

  await page.locator('[data-selection="uf0518-bloc-3"]').click();
  await expect(page.locator("#setup-screen")).toBeVisible();
  await expect(warning).toBeVisible();

  await page.getByRole("button",{name:"Temari",exact:true}).click();
  await page.getByRole("button",{name:"Diccionari",exact:true}).click();
  await expect(page.locator("#concept-dictionary-screen")).toBeVisible();
  await expect(warning).toBeVisible();
});

test("l'avís canvia completament a castellà amb el selector d'idioma",async({page})=>{
  await page.goto("/");
  await expect(page.getByText("842 preguntes")).toBeVisible();
  const warning=page.locator(".official-material-warning");
  await page.locator("#language-es").click();
  await expect(page.locator("html")).toHaveAttribute("lang","es");
  await expect(warning).toContainText("MUY IMPORTANTE:");
  await expect(warning).toContainText(esWarning);
  await expect(warning).toContainText("Repàs Actiu es una herramienta de apoyo no oficial y puede contener errores.");
  await expect(warning.locator(".material-notice-ca")).toBeHidden();
  await expect(warning.locator(".material-notice-es")).toBeVisible();
});

test("l'avís és compacte i no provoca desbordament en mòbil",async({browser})=>{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto("/");
  await expect(page.getByText("842 preguntes")).toBeVisible();
  const warning=page.locator(".official-material-warning");
  await expect(warning).toBeVisible();
  const box=await warning.boundingBox();
  expect(box).not.toBeNull();
  expect(box.height).toBeLessThan(90);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
  await page.close();
});
