import {test,expect} from "@playwright/test";

async function ready(page){
 await page.goto("/");
 await expect(page.getByText("1055 preguntes")).toBeVisible();
}
const contrast=(rgb1,rgb2)=>{
 const channels=s=>(s.match(/[\d.]+/g)||[]).slice(0,3).map(Number).map(c=>{
  const x=c/255;return x<=0.04045?x/12.92:((x+0.055)/1.055)**2.4;
 });
 const l=a=>{const v=channels(a);return v[0]*0.2126+v[1]*0.7152+v[2]*0.0722;};
 const [a,b]=[l(rgb1),l(rgb2)].sort((x,y)=>y-x);
 return (a+0.05)/(b+0.05);
};
test("01: els quatre accessos tenen contrast AA en mode fosc",async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await ready(page);
 await page.locator("#theme-toggle").click();
 await expect(page.locator("html")).toHaveAttribute("data-theme","dark");
 for(const id of ["#home-shortcut-study","#home-shortcut-dictionary","#home-shortcut-examples","#hangman-card"]){
  const colors=await page.locator(id).evaluate(el=>{
   const s=getComputedStyle(el),child=getComputedStyle(el.querySelector("strong"));
   return {background:s.backgroundColor,text:child.color};
  });
  expect(contrast(colors.text,colors.background),id+" "+JSON.stringify(colors)).toBeGreaterThanOrEqual(4.5);
 }
});
for(const width of [390,800,1440]){
 test("02: totes les categories visibles, sense retallades a "+width+"px",async({page})=>{
  await page.setViewportSize({width,height:900});
  await ready(page);
  await page.locator("#home-shortcut-examples").click();
  const nav=page.locator(".practical-tabs");
  await expect(nav.locator("button")).toHaveCount(6);
  const geometry=await nav.evaluate(el=>{
   const bounds=el.getBoundingClientRect();
   return {overflow:el.scrollWidth>el.clientWidth,buttons:[...el.querySelectorAll("button")].map(b=>{
    const r=b.getBoundingClientRect();return {left:r.left,right:r.right,text:b.innerText};
   }),left:bounds.left,right:bounds.right};
  });
  expect(geometry.overflow).toBe(false);
  for(const item of geometry.buttons){
   expect(item.left,"left "+item.text).toBeGreaterThanOrEqual(geometry.left-1);
   expect(item.right,"right "+item.text).toBeLessThanOrEqual(geometry.right+1);
  }
  await nav.locator('[data-practical-category="stock"]').click();
  await expect(nav.locator('[data-practical-category="stock"]')).toHaveAttribute("aria-pressed","true");
  await expect(page.locator("[data-stock-exercise]")).toHaveCount(11);
 });
}
test("03: capçalera mòbil més compacta sense perdre controls ni menú",async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await ready(page);
 const height=await page.locator(".site-header").evaluate(el=>el.getBoundingClientRect().height);
 expect(height).toBeLessThanOrEqual(110);
 for(const id of ["#mobile-menu-toggle","#language-ca","#language-es","#theme-toggle"]){
  const box=await page.locator(id).boundingBox();
  expect(box).not.toBeNull();
  expect(box.height,id).toBeGreaterThanOrEqual(39);
 }
 await page.locator("#mobile-menu-toggle").click();
 await expect(page.locator("#primary-nav")).toBeVisible();
 await page.keyboard.press("Escape");
 await expect(page.locator("#primary-nav")).toBeHidden();
 await page.locator("#language-es").click();
 await expect(page.locator("html")).toHaveAttribute("lang","es");
});
test("04: referència curta a les fitxes i traçabilitat completa al detall",async({page})=>{
 await ready(page);
 await page.locator("#home-shortcut-examples").click();
 await page.locator('[data-practical-category="stock"]').click();
 const first=page.locator('[data-stock-exercise="001"]');
 await expect(first.locator("small")).toContainText("Fitxa del curs");
 await expect(first.locator("small")).not.toContainText(".docx");
 await first.click();
 await expect(page.locator(".stock-source")).toContainText("UF0519_U3_01_Material_i_arxiu_Exercicis.docx");
 await page.locator("[data-stock-back]").click();
 await page.locator('[data-stock-exercise="011"]').click();
 await expect(page.locator(".stock-source")).toContainText("Excel oficina.xlsx");
});
test("05: configuració mostra codi curt i títol temàtic amb la referència completa",async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await ready(page);
 await page.locator('[data-selection="uf0519-unitat-3-bloc-1"]').click();
 await expect(page.locator(".setup-context")).toHaveText("UF0519 · Unitat 3 · Bloc 1");
 await expect(page.locator(".setup-topic")).toContainText("Material d'oficina");
 await expect(page.locator(".setup-context")).toHaveAttribute("title",/Gestió auxiliar/);
 await expect(page.locator("#setup-screen h1")).toHaveText("Configura el test");
 await page.locator("#language-es").click();
 await expect(page.locator(".setup-context")).toHaveText("UF0519 · Unidad 3 · Bloque 1");
 await expect(page.locator(".setup-topic")).toContainText("Material de oficina");
 await page.locator("#home-link").click();
 await page.locator('[data-selection="all"]').click();
 await expect(page.locator(".setup-topic")).toHaveCount(0);
});
