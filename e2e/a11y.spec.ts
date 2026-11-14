/**
 * Keyboard, names, reduced motion, and axe on findability chrome.
 */

import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const COLORWAYS = ["serato-like", "dark-club", "light", "classic"] as const;

async function loadA11y(page: Page, lang = "en"): Promise<void> {
  const html = readFileSync("static/index.html", "utf8").replace(/<script[\s\S]*?<\/script>/g, "");
  await page.setContent(html, { waitUntil: "domcontentloaded" });
  await page.addStyleTag({ path: "static/tokens.css" });
  await page.addStyleTag({ path: "static/app.css" });
  await page.evaluate((next) => {
    document.documentElement.lang = next;
  }, lang);
  await page.addScriptTag({ path: "e2e/dist/a11y.js" });
  await page.waitForFunction(() => document.body.dataset.a11y === "ready");
}

test("Tab reaches Music, a crate, More, Find, and a dialog, then returns", async ({ page }) => {
  await loadA11y(page);
  await page.locator("#skip-to-content").focus();
  await expect(page.locator("#skip-to-content")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator("#drawer-toggle")).toBeFocused();

  const music = page.locator('#views [data-nav="library"]');
  let guard = 0;
  while (guard < 40) {
    const id = await page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset.nav ?? "");
    if (id === "library") break;
    await page.keyboard.press("Tab");
    guard += 1;
  }
  await expect(music).toBeFocused();

  const crate = page.locator('#crate-list .crate[tabindex="0"]');
  guard = 0;
  while (guard < 40) {
    const inTree = await page.evaluate(
      () => document.activeElement instanceof HTMLElement && document.activeElement.classList.contains("crate") && Boolean(document.activeElement.closest("#crate-list")),
    );
    if (inTree) break;
    await page.keyboard.press("Tab");
    guard += 1;
  }
  await expect(crate).toBeFocused();

  const more = page.locator("#crate-actions-more");
  guard = 0;
  while (guard < 40) {
    const id = await page.evaluate(() => (document.activeElement as HTMLElement | null)?.id ?? "");
    if (id === "crate-actions-more") break;
    await page.keyboard.press("Tab");
    guard += 1;
  }
  await expect(more).toBeFocused();
  await expect(more).toHaveAttribute("aria-label", "More crate actions");
  await page.keyboard.press("Enter");
  await expect(more).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(more).toBeFocused();
  await expect(more).toHaveAttribute("aria-expanded", "false");

  await page.keyboard.press("Control+k");
  await expect(page.locator("#quick-open")).toHaveJSProperty("open", true);
  await expect(page.locator("#quick-open-query")).toBeFocused();
  await expect(page.locator("#quick-open-title")).toHaveText("Find a view, crate, track, or file");
  await page.keyboard.press("Escape");
  await expect(page.locator("#quick-open")).toHaveJSProperty("open", false);
  await expect(more).toBeFocused();

  await page.locator("#crate-new").click();
  const dialog = page.locator("#crate-prompt-dialog [role='dialog']");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.locator("#crate-new")).toBeFocused();
});

test("hash change moves focus off a hidden view tab", async ({ page }) => {
  await loadA11y(page);
  await page.locator('#view-children [data-view="history"]').focus();
  await page.evaluate(() => {
    history.replaceState(null, "", "#library/files");
  });
  await page.evaluate(() => window.a11yFixture.applyIncomingHash());
  await expect.poll(() => page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset.nav ?? "")).toBe("files");
});

test("reduced motion turns off hash and overlay animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await loadA11y(page);
  const reduced = await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  expect(reduced).toBe(true);
  const duration = await page.locator("#app-drawer").evaluate((node) => getComputedStyle(node).transitionDuration);
  const seconds = duration.split(",").map((part) => {
    const raw = part.trim();
    const n = Number.parseFloat(raw);
    if (Number.isNaN(n)) return 0;
    return raw.includes("ms") ? n / 1000 : n;
  });
  expect(Math.max(0, ...seconds)).toBeLessThanOrEqual(0.001);
  const scroll = await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
  expect(scroll).toBe("auto");
});

test("axe is clean on findability chrome across colorways", async ({ page }) => {
  await loadA11y(page);
  for (const colorway of COLORWAYS) {
    await page.evaluate((next) => window.a11yFixture.setColorway(next), colorway);
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.colorway)).toBe(colorway);
    const results = await new AxeBuilder({ page })
      .include("#skip-to-content")
      .include("#crate-actions-more")
      .include("#crate-browser-more")
      .include("#quick-open")
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(results.violations, colorway).toEqual([]);
  }
});

test("Find and More have Spanish names", async ({ page }) => {
  await loadA11y(page, "es");
  await expect(page.locator("#skip-to-content")).toHaveText("Saltar al contenido");
  await expect(page.locator("#crate-actions-more")).toHaveAttribute("aria-label", "Más acciones de caja");
  await expect(page.locator("#crate-browser-more")).toHaveAttribute("aria-label", "Más acciones de lista");
  await page.keyboard.press("Control+k");
  await expect(page.locator("#quick-open-title")).toHaveText("Buscar una vista, una caja, una pista o un archivo");
});
