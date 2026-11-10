/**
 * Gig check and Tempo drift paint from React on the page.
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
  await page.addScriptTag({ path: "e2e/dist/gig.js" });
  await page.waitForFunction(() => {
    const status = document.body.dataset.gig ?? "";
    if (status === "failed") throw new Error("gig fixture failed");
    return status === "ready";
  });
});

test("gig check and Tempo drift render from context", async ({ page }) => {
  await expect(page.locator(".gig-score")).toContainText("72/100");
  await expect(page.locator(".gig-score")).toContainText("Not ready");
  await expect(page.locator("#gig-report")).toContainText("GIGDRIVE");
  await expect(page.locator("#drift-report")).toContainText("Tempo wanders");
  await expect(page.locator("#drift-report")).toContainText("Old Tape");
  await saveShot(page, "gig_drift_react");
});
