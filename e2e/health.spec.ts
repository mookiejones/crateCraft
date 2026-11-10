/**
 * Library health panel from HealthContext in Chromium.
 */

import { expect, test } from "@playwright/test";

test("paints the health report from context", async ({ page }) => {
  await page.setContent(
    "<!DOCTYPE html><html><head></head><body><div id=\"health-root\"></div><div id=\"app-tooltip\" hidden></div></body></html>",
  );
  await page.addStyleTag({ path: "static/tokens.css" });
  await page.addStyleTag({ path: "static/app.css" });
  await page.addScriptTag({ path: "e2e/dist/health.js" });
  await page.waitForFunction(() => document.getElementById("health-root")?.dataset.healthFixture === "ready");

  await expect(page.locator("#health-report")).toContainText("4 tracks checked.");
  await expect(page.locator("#health-report")).toContainText("Missing files (1)");
  await expect(page.locator("#health-refresh")).toHaveAttribute("data-tooltip-key", "tooltip.healthRefresh");
  await page.locator("#health-refresh").focus();
  await expect(page.locator("#app-tooltip")).toBeVisible();
});
