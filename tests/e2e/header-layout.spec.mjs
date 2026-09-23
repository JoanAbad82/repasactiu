import {test,expect} from "@playwright/test";

test("la capçalera d'escriptori manté marca, navegació i utilitats en tres zones sense salts de línia",async({page})=>{
  await page.setViewportSize({width:1600,height:900});
  await page.goto("/");
  await expect(page.getByText("830 preguntes")).toBeVisible();

  const header=page.locator(".site-header-inner");
  const brand=page.locator("#home-link");
  const nav=page.locator(".primary-nav");
  const utilities=page.locator(".header-utilities");
  await expect(header).toBeVisible();
  await expect(nav.locator("button")).toHaveCount(5);
  await expect(utilities.locator("#language-ca")).toBeVisible();
  await expect(utilities.locator("#theme-toggle")).toBeVisible();

  const [brandBox,navBox,utilitiesBox]=await Promise.all([
    brand.boundingBox(),nav.boundingBox(),utilities.boundingBox()
  ]);
  expect(brandBox).not.toBeNull();
  expect(navBox).not.toBeNull();
  expect(utilitiesBox).not.toBeNull();
  expect(brandBox.x).toBeLessThan(navBox.x);
  expect(navBox.x+navBox.width).toBeLessThanOrEqual(utilitiesBox.x+1);

  const boxes=await nav.locator("button").evaluateAll(buttons=>buttons.map(button=>{
    const rect=button.getBoundingClientRect();
    const style=getComputedStyle(button);
    return {top:rect.top,height:rect.height,whiteSpace:style.whiteSpace};
  }));
  expect(new Set(boxes.map(box=>Math.round(box.top))).size).toBe(1);
  expect(boxes.every(box=>box.whiteSpace==="nowrap")).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
});

test("la capçalera continua sent usable en mòbil sense desbordar la pàgina",async({browser})=>{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto("/");
  await expect(page.getByText("830 preguntes")).toBeVisible();
  await expect(page.locator("#home-link")).toBeVisible();
  await expect(page.locator(".language-switcher")).toBeVisible();
  await expect(page.locator("#theme-toggle")).toBeVisible();
  await expect(page.locator(".primary-nav")).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);

  await page.locator("#language-es").click();
  await expect(page.locator("html")).toHaveAttribute("lang","es");
  await expect(page.getByRole("button",{name:"Correspondencia",exact:true})).toBeVisible();
  await page.close();
});
