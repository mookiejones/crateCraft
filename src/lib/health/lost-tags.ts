/**
 * Lost tags: blank title or artist the audio file can fill.
 *
 * GET /api/lost-tags is read-only. POST apply writes still-blank name
 * and artist through safe_write with Serato closed. It re-plans so a
 * field that gained a value is never overwritten. An empty plan does
 * not write. Audio files are not rewritten. A newer selection ignores
 * a late response. LostTagsPanel paints a Data Grid. The view covers
 * the whole space.
 *
 * Page text is in the locale catalogs under lost.*.
 */

import { createElement } from "react";
import { failureOf, postJSON, readJSON } from "../api";
import { isQueuedWrite } from "../crates/queue-notice";
import type { LostTagsPlan } from "../api-types";
import { mountIsland, type IslandRoot } from "../../app/mount";
import { LostTagsPanel } from "../../pages/LostTagsPanel";
import { bridge } from "../bridge";
import { el } from "../dom";
import { serverMessage, t } from "../i18n";
import { state } from "../state";

let latest: LostTagsPlan | null = null;
let reportRoot: IslandRoot | undefined;
let reportHost: HTMLElement | null = null;

/**
 * Attach Check again and Apply.
 *
 * Called once at startup. A later call is a no-op.
 *
 * @returns {void}
 */
export function wireLostTags(): void {
  const panel = el("lost-panel");
  if (panel.dataset.lostWired === "true") return;
  panel.dataset.lostWired = "true";
  el("lost-refresh").addEventListener("click", () => {
    void loadLostTags();
  });
  el("lost-apply").addEventListener("click", () => {
    void applyLostTags();
  });
}

/**
 * Ask for a read-only lost-tags plan of the open space.
 *
 * The previous report stays on screen until this reply arrives. Check
 * again is disabled while the request runs.
 *
 * @returns {Promise<void>}
 */
export async function loadLostTags(): Promise<void> {
  const token = ++state.lostToken;
  beginBusy("check");
  let settle: "report" | "retry" | "none" = "none";
  try {
    const response = await fetch(
      `/api/lost-tags?space=${encodeURIComponent(state.space)}`,
    );
    if (token !== state.lostToken) return;
    const payload = await readJSON<LostTagsPlan>(response).catch((): null => null);
    if (token !== state.lostToken) return;
    if (!response.ok || payload === null) {
      failStatus(serverMessage(payload, t("lost.unreadable")));
      settle = "retry";
      return;
    }
    latest = payload;
    el("lost-status").textContent = "";
    renderLostTagsReport(payload);
    settle = "report";
  } catch {
    if (token !== state.lostToken) return;
    failStatus(t("lost.unreachable"));
    settle = "retry";
  } finally {
    if (token !== state.lostToken) return;
    endBusy();
    if (settle === "retry") el("lost-refresh").focus();
    if (settle === "report") el("lost-report").focus();
  }
}

/**
 * Show a lost-tags failure in the status line.
 *
 * The report already on screen stays. Focus moves to Check again.
 *
 * @param error Failure from loadLostTags.
 * @returns {void}
 */
export function showLostTagsFailure(error: unknown): void {
  const message = error instanceof Error && error.message
    ? error.message
    : t("lost.unreadable");
  failStatus(message);
  endBusy();
  el("lost-refresh").focus();
}

/**
 * Paint the counts and the blank-field Data Grid.
 *
 * @param payload JSON from GET /api/lost-tags.
 * @returns {void}
 */
export function renderLostTagsReport(payload: LostTagsPlan): void {
  el("lost-scope").textContent = t("gig.wholeSpace");
  const report = el("lost-report");
  if (reportRoot && reportHost !== report) {
    reportRoot.unmount();
    reportRoot = undefined;
  }
  reportHost = report;
  reportRoot = mountIsland(
    report,
    createElement(LostTagsPanel, { payload }),
    reportRoot,
  );
}

/**
 * Unmount the Lost-tags Data Grid island.
 *
 * Tests replace `document.body` between cases. Unmount first so the
 * Data Grid scheduler does not run after jsdom tears the window down.
 * A pending load is ignored so it does not look up a host that is gone.
 *
 * @returns {void}
 */
export function unmountLostTags(): void {
  state.lostToken += 1;
  if (!reportRoot) return;
  try {
    reportRoot.unmount();
  } catch {
    // installPage already dropped the host.
  }
  reportRoot = undefined;
  reportHost = null;
}

/**
 * Paint the last report again in the active language.
 *
 * locale-wiring calls this on a language change. Nothing is fetched.
 *
 * @returns {void}
 */
export function repaintLostTags(): void {
  el("lost-scope").textContent = t("gig.wholeSpace");
  if (latest) renderLostTagsReport(latest);
}

async function applyLostTags(): Promise<void> {
  if (!latest?.fixes.length || !state.writable) return;
  const token = ++state.lostToken;
  beginBusy("apply");
  try {
    const payload = await postJSON<LostTagsPlan>("/api/lost-tags", {
      action: "apply",
      space: state.space,
    });
    if (token !== state.lostToken) return;
    if (isQueuedWrite(payload)) {
      el("lost-status").textContent = t("gigLock.queued");
      return;
    }
    const writtenCount = payload.written ? payload.fixes.length : 0;
    await bridge.reloadLibrary();
    if (token !== state.lostToken) return;
    const response = await fetch(
      `/api/lost-tags?space=${encodeURIComponent(state.space)}`,
    );
    if (token !== state.lostToken) return;
    const remaining = await readJSON<LostTagsPlan>(response).catch((): null => null);
    if (token !== state.lostToken) return;
    if (!response.ok || remaining === null) {
      failStatus(serverMessage(remaining, t("lost.unreadable")));
      el("lost-refresh").focus();
      return;
    }
    latest = remaining;
    el("lost-status").textContent = writtenCount
      ? t("lost.written", { count: writtenCount })
      : "";
    renderLostTagsReport(remaining);
    el("lost-report").focus();
  } catch (error) {
    if (token !== state.lostToken) return;
    const failed = failureOf(error);
    failStatus(failed.message);
    if (failed.status === 409) bridge.lockDown(error);
    el("lost-apply").focus();
  } finally {
    if (token !== state.lostToken) return;
    endBusy();
  }
}

function beginBusy(kind: "check" | "apply"): void {
  for (const id of ["lost-refresh", "lost-apply"] as const) {
    const button = el(id);
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
  }
  el("lost-panel").setAttribute("aria-busy", "true");
  el("lost-status").textContent = kind === "apply" ? t("lost.applying") : t("lost.checking");
}

function endBusy(): void {
  const refresh = el("lost-refresh");
  refresh.disabled = false;
  refresh.setAttribute("aria-busy", "false");
  const apply = el("lost-apply");
  apply.disabled = !state.writable || !latest?.fixes.length;
  apply.setAttribute("aria-busy", "false");
  el("lost-panel").setAttribute("aria-busy", "false");
}

function failStatus(message: string): void {
  el("lost-status").textContent = message;
}
