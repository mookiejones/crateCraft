/**
 * Relocate, crate delete, remove from library, and related-link remove
 * open labeled MUI dialogs in Chromium. Native prompt/confirm must not run.
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
  await page.addInitScript(() => {
    window.prompt = () => {
      throw new Error("window.prompt should not run");
    };
    window.confirm = () => {
      throw new Error("window.confirm should not run");
    };
  });
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

test("crate delete and relocate open labeled dialogs", async ({ page }) => {
  await page.getByRole("button", { name: "Relocate" }).click();
  const prompt = page.locator("#crate-prompt-dialog [role='dialog']");
  await expect(prompt).toBeVisible();
  await expect(page.locator("#crate-prompt-title")).toHaveText("Relocate");
  await expect(page.locator("#crate-prompt-dialog label")).toContainText("Path to the audio file");
  await expect(page.locator("#crate-prompt-input")).toHaveValue("/music/night.mp3");
  await saveShot(page, "relocate_path_dialog");
  await page.locator("#crate-prompt-cancel").click();
  await expect(prompt).toBeHidden();

  // The tooltip fixture ends on Duplicates, which hides #crate-actions.
  await page.locator("#crate-actions").evaluate((node) => {
    (node as HTMLElement).hidden = false;
  });
  await page.locator("#crate-delete").evaluate((node) => {
    (node as HTMLButtonElement).disabled = false;
  });
  await page.locator("#crate-delete").click();
  const confirm = page.locator("#confirm-dialog [role='dialog']");
  await expect(confirm).toBeVisible();
  await expect(page.locator("#confirm-title")).toHaveText("Delete");
  await expect(page.locator("#confirm-message")).toContainText("Deep");
  await expect(page.locator("#confirm-confirm")).toHaveText("Delete");
  await saveShot(page, "confirm_delete_crate");
  await page.locator("#confirm-cancel").click();
  await expect(confirm).toBeHidden();
});

test("remove from library and related-link remove open labeled confirms", async ({ page }) => {
  await page.getByRole("button", { name: "Remove from library" }).click();
  await expect(page.locator("#confirm-dialog [role='dialog']")).toBeVisible();
  await expect(page.locator("#confirm-title")).toHaveText("Remove from library");
  await expect(page.locator("#confirm-message")).toContainText("audio file stays on disk");
  await saveShot(page, "confirm_remove_library");
  await page.locator("#confirm-cancel").click();
  await expect(page.locator("#confirm-dialog [role='dialog']")).toBeHidden();

  await page.locator("[aria-label='Remove link to Alpha']").click();
  await expect(page.locator("#confirm-dialog [role='dialog']")).toBeVisible();
  await expect(page.locator("#confirm-title")).toHaveText("Remove");
  await expect(page.locator("#confirm-message")).toContainText("Alpha");
  await saveShot(page, "confirm_remove_related");
  await page.keyboard.press("Escape");
  await expect(page.locator("#confirm-dialog [role='dialog']")).toBeHidden();
});
