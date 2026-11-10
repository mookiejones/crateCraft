/**
 * Snapshots panel paints from SnapshotsContext.
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
  await page.addScriptTag({ path: "e2e/dist/snapshots.js" });
  await page.waitForFunction(() => document.body.dataset.snapshots === "ready");
});

test("the snapshots list renders from context", async ({ page }) => {
  await page.locator("#snapshots-panel").evaluate((node) => {
    if (node instanceof HTMLElement) node.hidden = false;
  });
  await expect(page.locator("#snapshots-list")).toContainText("manual");
  await expect(page.locator("#snapshots-list button")).toHaveText("Review restore");
  await expect(page.locator("#snapshots-take")).toHaveAttribute("data-tooltip", /.+/);
  await saveShot(page, "snapshots_list");
});
