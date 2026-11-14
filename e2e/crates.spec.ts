import { mkdirSync, readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  const html = readFileSync("static/index.html", "utf8").replace(/<script[\s\S]*?<\/script>/g, "");
  await page.setContent(html, { waitUntil: "domcontentloaded" });
  await page.addStyleTag({ path: "static/tokens.css" });
  await page.addStyleTag({ path: "static/app.css" });
});

test("Crates shares tree, list, and detail at 1120px without page scroll", async ({ page }) => {
  await page.setViewportSize({ width: 1120, height: 720 });
  await page.addScriptTag({ path: "e2e/dist/crates.js" });
  await expect(page.locator("#drawer-toggle")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#crate-list")).toBeVisible();
  const widths = await page.evaluate(() => {
    const rail = document.querySelector(".rail");
    const browser = document.getElementById("browser");
    const detail = document.getElementById("detail");
    const crates = document.getElementById("crate-list");
    const drawer = document.getElementById("app-drawer");
    const root = document.documentElement;
    return {
      tree: rail instanceof HTMLElement ? rail.clientWidth : 0,
      list: browser instanceof HTMLElement ? browser.clientWidth : 0,
      detail: detail instanceof HTMLElement ? detail.clientWidth : 0,
      pageScroll: root.scrollWidth - root.clientWidth,
      cratesInDrawer: Boolean(crates && drawer?.contains(crates)),
    };
  });
  expect(widths.tree).toBeGreaterThanOrEqual(160);
  expect(widths.list).toBeGreaterThanOrEqual(360);
  expect(widths.detail).toBeGreaterThanOrEqual(300);
  expect(widths.pageScroll).toBeLessThanOrEqual(1);
  expect(widths.cratesInDrawer).toBe(false);
  const grid = page.locator("#list .MuiDataGrid-virtualScroller");
  expect(await grid.evaluate((node) => node.scrollWidth >= node.clientWidth)).toBe(true);
  mkdirSync("e2e/output", { recursive: true });
  await page.screenshot({ path: "e2e/output/crates_desktop_1120.png", animations: "disabled" });
});

test("Crates keeps crate names in Main at the 980px mini drawer", async ({ page }) => {
  await page.setViewportSize({ width: 980, height: 720 });
  await page.addScriptTag({ path: "e2e/dist/crates.js" });
  await expect(page.locator("#drawer-toggle")).toHaveAttribute("aria-expanded", "false");
  const layout = await page.evaluate(() => {
    const rail = document.querySelector(".rail");
    const crates = document.getElementById("crate-list");
    const drawer = document.getElementById("app-drawer");
    const body = document.querySelector(".app-body");
    return {
      tree: rail instanceof HTMLElement ? rail.clientWidth : 0,
      list: document.getElementById("browser")?.clientWidth ?? 0,
      detail: document.getElementById("detail")?.clientWidth ?? 0,
      stacked: body instanceof HTMLElement && getComputedStyle(body).flexDirection === "column",
      cratesInMain: Boolean(crates && rail?.contains(crates)),
      cratesInDrawer: Boolean(crates && drawer?.contains(crates)),
    };
  });
  expect(layout.cratesInMain).toBe(true);
  expect(layout.cratesInDrawer).toBe(false);
  expect(layout.stacked).toBe(false);
  expect(layout.tree).toBeGreaterThan(0);
  expect(layout.list).toBeGreaterThan(0);
  expect(layout.detail).toBeGreaterThan(0);
});

test("Crates keeps horizontal scrolling in the grid across colorways", async ({ page }) => {
  await page.addScriptTag({ path: "e2e/dist/crates.js" });
  await expect(page.locator("#list .MuiDataGrid-row").first()).toContainText("Night drive");
  await expect(page.locator("#crate-pane-b")).toBeHidden();
  await page.locator("#crate-pane-b").evaluate((node) => { (node as HTMLElement).hidden = false; });
  await expect(page.locator("#crate-pane-b")).toBeVisible();
  await page.locator("#crate-pane-b").evaluate((node) => { (node as HTMLElement).hidden = true; });
  const browser = page.locator("#browser");
  expect(await browser.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
  const grid = page.locator("#list .MuiDataGrid-virtualScroller");
  expect(await grid.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
  await grid.evaluate((node) => { node.scrollLeft = 250; });
  await expect.poll(() => grid.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
  expect(await browser.evaluate((node) => node.scrollLeft)).toBe(0);
  await grid.evaluate((node) => { node.scrollLeft = 0; });
  const active = page.locator('.drawer-nav [data-view="crates"]');
  expect(await active.evaluate((node) => getComputedStyle(node).boxShadow)).not.toBe("none");
  await page.locator('#list [role="columnheader"][data-field="name"]').focus();
  await expect(page.locator('#list [role="columnheader"][data-field="name"]')).toHaveCSS("outline-style", "solid");
  await page.locator("#search").focus();
  await page.keyboard.press("Escape");
  await page.locator("#search").evaluate((node) => { (node as HTMLElement).blur(); });
  mkdirSync("e2e/output", { recursive: true });
  for (const colorway of ["serato-like", "dark-club", "light", "classic"]) {
    // Exercise the real theme-change subscription as well as CSS tokens.
    await page.evaluate((value) => window.cratesFixture.setColorway(value), colorway);
    await page.screenshot({ path: `e2e/output/crates_refined_${colorway}.png`, animations: "disabled" });
  }
});

test("action-flash Alert sits under the AppBar on every view until dismiss", async ({ page }) => {
  await page.addScriptTag({ path: "e2e/dist/crates.js" });
  await expect(page.locator("#app-notice")).toHaveCount(0);
  await page.evaluate(() => {
    window.cratesFixture.setNotice("That file is not on disk.", "error");
  });
  const banner = page.locator("#app-notice");
  await expect(banner).toContainText("That file is not on disk.");
  await expect(banner).toHaveAttribute("role", "alert");
  expect(await page.evaluate(() => {
    const notice = document.getElementById("app-notice");
    const lock = document.querySelector(".app-bar-lock");
    return Boolean(
      notice &&
      lock?.nextElementSibling?.contains(notice) &&
      !document.getElementById("app-body")?.contains(notice),
    );
  })).toBe(true);
  await page.evaluate(() => {
    window.cratesFixture.paintNav("files");
  });
  await expect(banner).toBeVisible();
  mkdirSync("e2e/output", { recursive: true });
  await page.screenshot({ path: "e2e/output/notice_banner_files.png", animations: "disabled" });
  await page.locator("#app-notice button").click();
  await expect(banner).toHaveCount(0);
});

for (const locale of ["en", "es"]) {
test(`narrow screens keep controls in view in ${locale}`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate((value) => { document.documentElement.lang = value; }, locale);
  await page.addScriptTag({ path: "e2e/dist/crates.js" });
  await expect(page.locator("#drawer-toggle")).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#search")).toBeVisible();
  await expect(page.locator("#reload")).toBeVisible();
  for (const id of ["search", "search-field", "reload", "crate-new"]) {
    const bounds = await page.locator(`#${id}`).boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  }
  mkdirSync("e2e/output", { recursive: true });
  await page.screenshot({ path: `e2e/output/crates_refined_mobile_${locale}.png`, animations: "disabled" });
});
}
