import {test,expect} from "@playwright/test";
const widths=[320,390,800,1440];
for(const width of widths){
 for(const theme of ["light","dark"]){
  test("Visual sobri "+width+"px "+theme+": icones, marcs, llegibilitat i sense desbordament",async({page})=>{
   await page.setViewportSize({width,height:900});
   await page.goto("/");
   await expect(page.getByText("1036 preguntes")).toBeVisible();
   if(theme==="dark")await page.locator("#theme-toggle").click();
   await expect(page.locator("html")).toHaveAttribute("data-theme",theme);
   await expect(page.locator("#home-screen .tool-motif svg")).toHaveCount(4);
   await expect(page.locator("#home-screen .block-file-icon svg")).toHaveCount(18);
   await expect(page.locator("#home-screen .unit-group")).toHaveCount(6);
   await expect(page.locator("#home-screen #course-title")).toBeVisible();
   const visible=await page.evaluate(()=>{
    const doc=document.documentElement;
    const select=selector=>{const el=document.querySelector(selector),s=getComputedStyle(el),rect=el.getBoundingClientRect();return {color:s.color,bg:s.backgroundColor,border:s.borderTopColor,display:s.display,width:rect.width,height:rect.height};};
    return {overflow:doc.scrollWidth-doc.clientWidth,hero:select(".hero"),tool:select(".home-tool"),block:select(".unit-group .block-card"),brand:select(".site-header .brand")};
   });
   expect(visible.overflow).toBeLessThanOrEqual(1);
   expect(visible.hero.width).toBeGreaterThan(250);
   expect(visible.tool.height).toBeGreaterThan(85);
   expect(visible.block.height).toBeGreaterThan(65);
   const sr=await page.locator("#home-shortcut-dictionary .tool-motif").getAttribute("aria-hidden");
   expect(sr).toBe("true");
   await page.locator("#home-shortcut-examples").click();
   await expect(page.locator(".practical-tabs button")).toHaveCount(5);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
   await page.locator("#home-link").click();
   await page.locator('[data-selection="uf0519-unitat-3-bloc-1"]').click();
   await expect(page.locator("#setup-screen h1")).toContainText("Configura el test");
   await page.locator("#start-quiz").click();
   await expect(page.locator(".question-card")).toBeVisible();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });
 }
}
test("decoració sense alterar la semàntica ni fer peticions externes",async({page})=>{
 const requests=[];
 page.on("request",r=>requests.push(r.url()));
 await page.goto("/");
 await expect(page.getByText("1036 preguntes")).toBeVisible();
 const origin=new URL(page.url()).origin;
 // Cloudflare Web Analytics és preexistent a producció, no forma part de la decoració.
 const existingAnalytics=new Set(["static.cloudflareinsights.com","cloudflareinsights.com"]);
 expect(requests.filter(url=>{const u=new URL(url);return u.origin!==origin&&!existingAnalytics.has(u.hostname)})).toEqual([]);
 await expect(page.getByRole("button",{name:"Obrir diccionari"})).toBeVisible();
 await expect(page.getByRole("button",{name:"Obrir exemples pràctics"})).toBeVisible();
});
