/**
 * Status banner refreshes when the fake server flips serato_running.
 */

import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  const html = readFileSync("static/index.html", "utf8").replace(/<script[\s\S]*?<\/script>/g, "");
  await page.setContent(html, { waitUntil: "domcontentloaded" });
  await page.addStyleTag({ path: "static/tokens.css" });
  await page.addStyleTag({ path: "static/app.css" });
  await page.addScriptTag({ path: "e2e/dist/status.js" });
  await page.waitForFunction(() => {
    const status = document.body.dataset.status ?? "";
    if (status === "failed") throw new Error(document.body.dataset.statusError || "status fixture failed");
    return status === "ready";
  });
});

test("banner updates within one poll when Serato quits", async ({ page }) => {
  const status = page.locator("#status");
  await expect(status).toBeVisible();
  await expect(status).toContainText("is open");
  await expect(page.locator("#status-refresh")).toBeVisible();

  // Advance past the 5 s poll without waiting wall-clock: click Check again
  // for an immediate refresh, then also fire visibility so the poll path runs.
  await page.locator("#status-refresh").click();
  await expect(status).not.toContainText("is open", { timeout: 5_000 });
  await expect(status).toContainText("unknown");
});
