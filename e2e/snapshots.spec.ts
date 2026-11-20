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
  await expect(page.locator("#snapshots-list .MuiDataGrid-columnHeader[data-field='created']")).toHaveCount(1);
  await expect(page.locator("#snapshots-list .MuiDataGrid-columnHeader[data-field='size']")).toHaveCount(1);
  await expect(page.locator("#snapshots-list .MuiDataGrid-columnHeader[data-field='status']")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Review restore" })).toHaveCount(1);
  await expect(page.locator('#snapshots-list [data-action="prune"]')).toHaveText("Prune");
  await expect(page.locator("#snapshots-take")).toHaveAttribute("data-tooltip", /.+/);
  await expect(page.locator("#music-mirror-heading")).toHaveText("Music files");
  await expect(page.locator("#music-mirror-dest")).toBeVisible();
  await expect(page.locator("#music-mirror-preview")).toBeDisabled();
  await page.locator("#music-mirror-dest").fill("/Volumes/Backup");
  await expect(page.locator("#music-mirror-preview")).toBeEnabled();
  await expect(page.locator("#music-mirror-copy")).toBeEnabled();
  await page.locator("#music-mirror").scrollIntoViewIfNeeded();
  await expect(page.locator("#gig-lock-heading")).toHaveText("Gig Lock");
  await expect(page.locator("#gig-lock-preview")).toBeVisible();
  await expect(page.locator("#gig-lock-apply")).toBeVisible();
  await expect(page.locator("#gig-lock-drop")).toBeVisible();
  await page.locator("#gig-lock-queue").scrollIntoViewIfNeeded();
  await expect(page.locator("#batch-heading")).toHaveText("Batch");
  await expect(page.locator("#batch-preview")).toBeDisabled();
  await expect(page.locator("#batch-preview")).toHaveAttribute("data-tooltip", /.+/);
  await expect(page.locator("#batch-apply")).toBeDisabled();
  await page.locator("#batch-queue").scrollIntoViewIfNeeded();
  await saveShot(page, "snapshots_list");
});

test("review restore lists crate membership and deleted crates", async ({ page }) => {
  await page.evaluate(() => {
    window.fetch = async (input, init) => {
      const url = String(input);
      const method = (init && init.method) || "GET";
      if (url.includes("/api/snapshots") && method === "POST") {
        return new Response(JSON.stringify({
          dry_run: true,
          crates: {
            added: [],
            removed: [],
            changed: [{
              name: "House",
              tracks_added: ["track.mp3"],
              tracks_removed: ["other.mp3"],
            }],
            unavailable: [],
          },
          deleted: { crates: [{ name: "Old" }], tracks: [], cues: [], grids: [] },
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      return new Response("{}", { status: 404 });
    };
  });
  await page.locator("#snapshots-panel").evaluate((node) => {
    if (node instanceof HTMLElement) node.hidden = false;
  });
  await page.getByRole("button", { name: "Review restore" }).click();
  await expect(page.locator("#snapshot-plan")).toContainText("House: tracks added track.mp3. tracks removed other.mp3");
  await expect(page.locator("#snapshot-plan")).toContainText("Deleted crates: 1. Old");
  await expect(page.locator("#snapshot-touched")).toHaveText("What changed: master.sqlite");
  await saveShot(page, "snapshot_restore_plan");
});
