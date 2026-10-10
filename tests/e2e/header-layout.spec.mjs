import {test,expect} from "@playwright/test";

test("la capçalera d'escriptori manté les tres zones sense salts",async({page})=>{
  await page.setViewportSize({width:1600,height:900});
  await page.goto("/");
  await expect(page.getByText("1036 preguntes")).toBeVisible();

  const header=page.locator(".site-header-inner");
  const brand=page.locator("#home-link");
  const nav=page.locator(".primary-nav");
  const utilities=page.locator(".header-utilities");
  await expect(header).toBeVisible();
  await expect(page.locator("#mobile-menu-toggle")).toBeHidden();
  await expect(nav.locator("button")).toHaveCount(5);
  await expect(nav).toBeVisible();
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
  const tops=await nav.locator("button").evaluateAll(buttons=>buttons.map(button=>Math.round(button.getBoundingClientRect().top)));
  expect(new Set(tops).size).toBe(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
});

test("el menú de mòbil s'obre, es tanca i es tradueix sense ocultar les utilitats",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/");
  await expect(page.getByText("1036 preguntes")).toBeVisible();
  const toggle=page.locator("#mobile-menu-toggle");
  const nav=page.locator("#primary-nav");
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded","false");
  await expect(nav).toBeHidden();
  await expect(page.locator("#language-ca")).toBeInViewport();
  await expect(page.locator("#language-es")).toBeInViewport();
  await expect(page.locator("#theme-toggle")).toBeInViewport();

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded","true");
  await expect(nav).toBeVisible();
  await expect(nav.getByRole("button",{name:"Exemples pràctics"})).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(nav).toBeHidden();
  await expect(toggle).toBeFocused();

  await page.locator("#language-es").click();
  await expect(page.locator("html")).toHaveAttribute("lang","es");
  await toggle.click();
  await expect(nav.getByRole("button",{name:"Ejemplos prácticos"})).toBeVisible();
  await nav.getByRole("button",{name:"Diccionario"}).click();
  await expect(page.locator("#concept-dictionary-screen")).toBeVisible();
  await expect(nav).toBeHidden();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
});

test("cap desbordament horitzontal a les amplades estretes",async({page})=>{
  for(const width of [320,360,390,760,1024]){
    await page.setViewportSize({width,height:844});
    await page.goto("/");
    await expect(page.getByText("1036 preguntes")).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),`Viewport ${width}`).toBe(true);
    await expect(page.locator("#theme-toggle")).toBeInViewport();
    if(width<=760){await page.locator("#mobile-menu-toggle").click();await expect(page.locator("#primary-nav")).toBeVisible();}
  }
});
