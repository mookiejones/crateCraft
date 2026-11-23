/**
 * Every control on the loaded page has a tooltip, and focus shows it.
 *
 * Screenshots are written for the review. They are not pixel baselines.
 */

import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

async function saveShot(page: Page, name: string): Promise<void> {
  mkdirSync("e2e/output", { recursive: true });
  const local = `e2e/output/${name}.png`;
  await page.screenshot({ path: local });
  try {
    mkdirSync("/opt/cursor/artifacts", { recursive: true });
    copyFileSync(local, `/opt/cursor/artifacts/${name}.png`);
  } catch {
    // The artifact directory is only present for the cloud review.
  }
}

test.beforeEach(async ({ page }) => {
  const html = readFileSync("static/index.html", "utf8").replace(/<script[\s\S]*?<\/script>/g, "");
  await page.setContent(html, { waitUntil: "domcontentloaded" });
  await page.addStyleTag({ path: "static/tokens.css" });
  await page.addStyleTag({ path: "static/app.css" });
  await page.addScriptTag({ path: "e2e/dist/tooltips.js" });
  await page.waitForFunction(() => {
    const status = document.body.dataset.tooltips ?? "";
    if (status === "failed") throw new Error("tooltip fixture failed");
    return status === "ready";
  });
});

test("every control has a tooltip, and focus shows it", async ({ page }) => {
  const missing = await page.evaluate(() => window.tooltipAudit.missing());
  expect(missing).toEqual([]);

  await page.locator("#settings-dialog").evaluate((node) => {
    if (node instanceof HTMLDialogElement) node.showModal();
  });
  await expect(page.locator("[data-settings-react]")).toHaveCount(1);
  const shortcuts = page.locator("#shortcuts-title");
  await shortcuts.focus();
  const tip = page.locator("#app-tooltip");
  await expect(tip).toBeVisible();
  await expect(tip).toHaveText("Keyboard shortcuts for this screen. ? opens this list.");
  await expect(shortcuts).toHaveAttribute("aria-describedby", /app-tooltip/);
  expect(await tip.evaluate((node) => node.matches(":popover-open"))).toBe(true);
  await saveShot(page, "tooltip_shortcuts");

  // The modal makes the page behind it inert, so close it before focusing search.
  await page.locator("#settings-dialog").evaluate((node) => {
    if (node instanceof HTMLDialogElement) node.close();
  });
  await page.locator("#search").focus();
  await expect(tip).toContainText("Ctrl/Cmd+F");
  await expect(tip).toContainText("Esc");
  await expect(shortcuts).not.toHaveAttribute("aria-describedby");
  await saveShot(page, "tooltip_search");

  await page.locator("#rekordbox-dialog").evaluate((node) => {
    const dialog = node as HTMLDialogElement;
    if (typeof dialog.showModal === "function") dialog.showModal();
  });
  const loops = page.locator("#rekordbox-hot-loops");
  await loops.focus();
  await expect(loops).toHaveAttribute("aria-describedby", /rekordbox-hot-loops-help/);
  await expect(loops).toHaveAttribute("aria-describedby", /app-tooltip/);
  await page.locator("#rekordbox-dialog").evaluate((node) => {
    const dialog = node as HTMLDialogElement;
    if (typeof dialog.close === "function") dialog.close();
  });

  // Compact AppBar has no zoom. Overview stays hidden until a track
  // loads a wave, so this fixture unhides the player slot and checks Play.
  await page.locator(".app-bar-player").evaluate((node) => {
    if (node instanceof HTMLElement) {
      node.hidden = false;
      node.style.display = "flex";
    }
  });

  await expect(page.locator("#files-list")).toContainText("Sets");
  await expect(page.locator("#files-path")).toContainText("House");

  await page.locator(".player-play").focus();
  await expect(tip).toContainText("Space");
  await saveShot(page, "tooltip_play");
});

function overlaps(a: { left: number; top: number; right: number; bottom: number }, b: { left: number; top: number; right: number; bottom: number }): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

async function expectDrawerTipBesideNext(page: Page): Promise<void> {
  const buttons = page.locator("#app-drawer .drawer-nav button");
  const current = buttons.nth(0);
  const next = buttons.nth(1);
  await current.hover();
  const tip = page.locator("#app-tooltip");
  await expect(tip).toBeVisible();
  const hit = await page.evaluate(() => {
    const tipNode = document.getElementById("app-tooltip");
    const nodes = [...document.querySelectorAll("#app-drawer .drawer-nav button")].filter(
      (node) => node instanceof HTMLElement && node.getClientRects().length > 0,
    );
    const first = nodes[0];
    const second = nodes[1];
    if (!(tipNode instanceof HTMLElement) || !(first instanceof HTMLElement) || !(second instanceof HTMLElement)) {
      return { ok: false, reason: "missing" };
    }
    const tipBox = tipNode.getBoundingClientRect();
    const firstBox = first.getBoundingClientRect();
    const nextBox = second.getBoundingClientRect();
    const x = tipBox.left + tipBox.width / 2;
    const y = tipBox.top + tipBox.height / 2;
    const previous = tipNode.style.pointerEvents;
    tipNode.style.pointerEvents = "auto";
    const top = document.elementFromPoint(x, y);
    tipNode.style.pointerEvents = previous;
    return {
      ok: top === tipNode || tipNode.contains(top),
      tip: { left: tipBox.left, top: tipBox.top, right: tipBox.right, bottom: tipBox.bottom },
      first: { left: firstBox.left, top: firstBox.top, right: firstBox.right, bottom: firstBox.bottom },
      next: { left: nextBox.left, top: nextBox.top, right: nextBox.right, bottom: nextBox.bottom },
    };
  });
  expect(hit.ok).toBe(true);
  if (!hit.tip || !hit.next || !hit.first) throw new Error("missing tooltip boxes");
  expect(overlaps(hit.tip, hit.next)).toBe(false);
  expect(hit.tip.left).toBeGreaterThanOrEqual(hit.first.right - 1);
}

test("drawer tooltips sit to the right of the icon in both drawer widths", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("#app-drawer")).toBeVisible();
  await expect(page.locator("#app-drawer")).not.toHaveAttribute("data-mini");
  await expectDrawerTipBesideNext(page);
  await saveShot(page, "tooltip_drawer_expanded");

  await page.locator("#drawer-toggle").click();
  await expect(page.locator("#app-drawer")).toHaveAttribute("data-mini");
  await page.mouse.move(0, 0);
  await expect(page.locator("#app-tooltip")).toBeHidden();
  await expectDrawerTipBesideNext(page);
  await saveShot(page, "tooltip_drawer_mini");
});

test("a drawer tooltip stays on top when popover is missing", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => {
    delete (HTMLElement.prototype as { showPopover?: () => void }).showPopover;
  });
  await expectDrawerTipBesideNext(page);
  const z = await page.locator("#app-tooltip").evaluate((node) => getComputedStyle(node).zIndex);
  expect(z).toBe("1500");
});

test("reduced motion shows the tooltip as soon as the pointer arrives", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator("#reload").hover();
  await expect(page.locator("#app-tooltip")).toBeVisible({ timeout: 150 });
  await expect(page.locator("#app-tooltip")).toHaveText("Reload the library from Serato.");
});

test("Check drive sits under Gig with a labelled picker", async ({ page }) => {
  await expect(page.locator('[data-nav="gig"]')).toHaveText("Gig");
  await page.locator('[data-nav="gig"]').click();
  await expect(page.locator("#view-children [data-view='gig']")).toHaveText("Ready");
  await expect(page.locator("#view-children [data-view='portable']")).toHaveText("Check drive");
  await expect(page.locator("#view-children [data-view='drift']")).toHaveText("Tempo drift");
  await expect(page.locator("#view-children [data-view='octave']")).toHaveText("BPM check");
  await expect(page.locator("#sheet-title")).toHaveText("Ready · Serato Library");
  await expect(page.locator("#sheet-scope")).toBeVisible();
  await expect(page.locator("#sheet-scope-text")).toHaveText("Scope: Deep");
  await expect(page.locator("#sheet-scope-all")).toBeVisible();
  await expect(page.locator("#sheet-scope-all")).toHaveText("All tracks");
  const tab = page.locator('[data-view="portable"]');
  await tab.click();
  await expect(page.locator("#sheet-title")).toHaveText("Check drive · Serato Library");
  await expect(page.locator("#sheet-scope")).toBeHidden();
  await tab.focus();
  await expect(page.locator("#app-tooltip")).toContainText("Pick a connected drive");
  await page.locator("#portable-panel").evaluate((node) => {
    if (node instanceof HTMLElement) node.hidden = false;
  });
  const drive = page.locator("#portable-drive");
  await expect(drive).toBeVisible();
  await expect(page.locator("label").filter({ has: drive })).toContainText("Drive");
  await drive.focus();
  await expect(page.locator("#app-tooltip")).toContainText("unplugged drive");
  await page.locator("#portable-check").focus();
  await expect(page.locator("#app-tooltip")).toContainText("Nothing is written");
  await saveShot(page, "portable_view");
});
