/**
 * Broken smart crates: type-2 crates that lost their rules (#489).
 *
 * GET /api/broken-smart is read-only. Repair posts a preview, then
 * Confirm writes only the checked crates through safe_write with Serato
 * closed. Undo puts that snapshot back. A newer selection ignores a late
 * response. BrokenSmartPanel paints the list. The view covers the whole
 * space.
 *
 * Page text is in the locale catalogs under broken.*.
 */

import { createElement } from "react";
import { failureOf, postJSON, readJSON } from "../api";
import { isQueuedWrite } from "../crates/queue-notice";
import type { BrokenSmartPlan } from "../api-types";
import { mountIsland, type IslandRoot } from "../../app/mount";
import { BrokenSmartPanel } from "../../pages/BrokenSmartPanel";
import { bridge } from "../bridge";
import { el } from "../dom";
import { serverMessage, t } from "../i18n";
import { state } from "../state";

let latest: BrokenSmartPlan | null = null;
let selected = new Set<number>();
let confirming = false;
let snapshotId: string | null = null;
let reportRoot: IslandRoot | undefined;
let reportHost: HTMLElement | null = null;

/**
 * Attach Check again, Repair, Undo, and the confirm click.
 *
 * Called once at startup. A later call is a no-op.
 *
 * @returns {void}
 */
export function wireBrokenSmart(): void {
  const panel = el("broken-panel");
  if (panel.dataset.brokenWired === "true") return;
  panel.dataset.brokenWired = "true";
  el("broken-refresh").addEventListener("click", () => {
    confirming = false;
    void loadBrokenSmart();
  });
  el("broken-repair").addEventListener("click", () => {
    void previewRepair();
  });
  el("broken-undo").addEventListener("click", () => {
    void undoRepair();
  });
  el("broken-report").addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest("[data-broken-action='confirm']");
    if (button instanceof HTMLButtonElement) void confirmRepair();
  });
}

/**
 * Ask for a read-only scan of the open space.
 *
 * The previous report stays on screen until this reply arrives. Check
 * again is disabled while the request runs. Restorable crates start
 * checked.
 *
 * @returns {Promise<void>}
 */
export async function loadBrokenSmart(): Promise<void> {
  const token = ++state.brokenToken;
  beginBusy("check");
  let settle: "report" | "retry" | "none" = "none";
  try {
    const response = await fetch(
      `/api/broken-smart?space=${encodeURIComponent(state.space)}`,
    );
    if (token !== state.brokenToken) return;
    const payload = await readJSON<BrokenSmartPlan>(response).catch((): null => null);
    if (token !== state.brokenToken) return;
    if (!response.ok || payload === null) {
      failStatus(serverMessage(payload, t("broken.unreadable")));
      settle = "retry";
      return;
    }
    latest = payload;
    selected = new Set(
      (payload.crates || []).filter((crate) => crate.restorable).map((crate) => crate.id),
    );
    el("broken-status").textContent = "";
    renderBrokenSmartReport();
    settle = "report";
  } catch {
    if (token !== state.brokenToken) return;
    failStatus(t("broken.unreachable"));
    settle = "retry";
  } finally {
    if (token !== state.brokenToken) return;
    endBusy();
    if (settle === "retry") el("broken-refresh").focus();
    if (settle === "report") el("broken-report").focus();
  }
}

/**
 * Show a scan failure in the status line.
 *
 * The report already on screen stays. Focus moves to Check again.
 *
 * @param error Failure from loadBrokenSmart.
 * @returns {void}
 */
export function showBrokenSmartFailure(error: unknown): void {
  const message = error instanceof Error && error.message
    ? error.message
    : t("broken.unreadable");
  failStatus(message);
  endBusy();
  el("broken-refresh").focus();
}

/**
 * Paint the last report again in the active language.
 *
 * locale-wiring calls this on a language change. Nothing is fetched.
 *
 * @returns {void}
 */
export function repaintBrokenSmart(): void {
  el("broken-scope").textContent = t("gig.wholeSpace");
  if (latest) renderBrokenSmartReport();
}

/**
 * Unmount the report island.
 *
 * Tests replace `document.body` between cases. Unmount first so a React
 * scheduler does not run after jsdom tears the window down.
 *
 * @returns {void}
 */
export function unmountBrokenSmart(): void {
  state.brokenToken += 1;
  confirming = false;
  if (!reportRoot) return;
  try {
    reportRoot.unmount();
  } catch {
    // installPage already dropped the host.
  }
  reportRoot = undefined;
  reportHost = null;
}

function renderBrokenSmartReport(): void {
  if (!latest) return;
  el("broken-scope").textContent = t("gig.wholeSpace");
  const report = el("broken-report");
  if (reportRoot && reportHost !== report) {
    reportRoot.unmount();
    reportRoot = undefined;
  }
  reportHost = report;
  reportRoot = mountIsland(
    report,
    createElement(BrokenSmartPanel, {
      payload: latest,
      selected,
      confirm: confirming,
      writable: state.writable,
      onToggle: toggleCrate,
    }),
    reportRoot,
  );
}

function toggleCrate(id: number): void {
  confirming = false;
  if (selected.has(id)) selected.delete(id);
  else selected.add(id);
  renderBrokenSmartReport();
  endBusy();
}

function chosenIds(): number[] {
  return [...selected];
}

async function previewRepair(): Promise<void> {
  const ids = chosenIds();
  if (!latest || !ids.length || !state.writable) return;
  const token = ++state.brokenToken;
  beginBusy("check");
  try {
    const payload = await postJSON<BrokenSmartPlan>("/api/broken-smart", {
      action: "preview",
      space: state.space,
      ids,
    });
    if (token !== state.brokenToken) return;
    if (payload.preview !== true) {
      failStatus(serverMessage(payload, t("broken.unreadable")));
      return;
    }
    confirming = true;
    el("broken-status").textContent = "";
    renderBrokenSmartReport();
    const confirm = document.querySelector<HTMLButtonElement>("[data-broken-action='confirm']");
    (confirm ?? el("broken-report")).focus();
  } catch (error) {
    if (token !== state.brokenToken) return;
    failStatus(failureOf(error).message);
    el("broken-repair").focus();
  } finally {
    if (token !== state.brokenToken) return;
    endBusy();
  }
}

async function confirmRepair(): Promise<void> {
  const ids = chosenIds();
  if (!ids.length || !state.writable) return;
  const token = ++state.brokenToken;
  beginBusy("apply");
  try {
    const payload = await postJSON<BrokenSmartPlan>("/api/broken-smart", {
      action: "apply",
      space: state.space,
      ids,
      confirm: true,
    });
    if (token !== state.brokenToken) return;
    if (isQueuedWrite(payload)) {
      confirming = false;
      el("broken-status").textContent = t("gigLock.queued");
      return;
    }
    const writtenCount = payload.written ? (payload.crates || []).length : 0;
    if (payload.snapshot_id) snapshotId = payload.snapshot_id;
    confirming = false;
    await bridge.reloadLibrary();
    if (token !== state.brokenToken) return;
    await refreshReport(token);
    if (token !== state.brokenToken) return;
    el("broken-status").textContent = writtenCount
      ? t("broken.written", { count: writtenCount })
      : "";
  } catch (error) {
    if (token !== state.brokenToken) return;
    const failed = failureOf(error);
    failStatus(failed.message);
    if (failed.status === 409) bridge.lockDown(error);
    el("broken-repair").focus();
  } finally {
    if (token !== state.brokenToken) return;
    endBusy();
  }
}

async function undoRepair(): Promise<void> {
  if (!snapshotId || !state.writable) return;
  const token = ++state.brokenToken;
  beginBusy("apply");
  try {
    const payload = await postJSON<BrokenSmartPlan>("/api/broken-smart", {
      action: "undo",
      snapshot_id: snapshotId,
      confirm: true,
    });
    if (token !== state.brokenToken) return;
    if (isQueuedWrite(payload)) {
      el("broken-status").textContent = t("gigLock.queued");
      return;
    }
    snapshotId = null;
    confirming = false;
    await bridge.reloadLibrary();
    if (token !== state.brokenToken) return;
    await refreshReport(token);
  } catch (error) {
    if (token !== state.brokenToken) return;
    const failed = failureOf(error);
    failStatus(failed.message);
    if (failed.status === 409) bridge.lockDown(error);
    el("broken-undo").focus();
  } finally {
    if (token !== state.brokenToken) return;
    endBusy();
  }
}

async function refreshReport(token: number): Promise<void> {
  const response = await fetch(
    `/api/broken-smart?space=${encodeURIComponent(state.space)}`,
  );
  if (token !== state.brokenToken) return;
  const payload = await readJSON<BrokenSmartPlan>(response).catch((): null => null);
  if (token !== state.brokenToken) return;
  if (!response.ok || payload === null) {
    failStatus(serverMessage(payload, t("broken.unreadable")));
    return;
  }
  latest = payload;
  selected = new Set(
    (payload.crates || []).filter((crate) => crate.restorable).map((crate) => crate.id),
  );
  renderBrokenSmartReport();
}

function beginBusy(kind: "check" | "apply"): void {
  for (const id of ["broken-refresh", "broken-repair", "broken-undo"] as const) {
    const button = el(id);
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
  }
  el("broken-panel").setAttribute("aria-busy", "true");
  el("broken-status").textContent = kind === "apply" ? t("broken.applying") : t("broken.checking");
}

function endBusy(): void {
  const refresh = el("broken-refresh");
  refresh.disabled = false;
  refresh.setAttribute("aria-busy", "false");
  const repair = el("broken-repair");
  repair.disabled = !state.writable || chosenIds().length === 0;
  repair.setAttribute("aria-busy", "false");
  const undo = el("broken-undo");
  undo.disabled = !state.writable || !snapshotId;
  undo.setAttribute("aria-busy", "false");
  el("broken-panel").setAttribute("aria-busy", "false");
}

function failStatus(message: string): void {
  el("broken-status").textContent = message;
}
