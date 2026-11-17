/**
 * Compare two crates: tracks in both, only in A, or only in B.
 *
 * GET /api/crate-compare is read-only. POST create re-compares, then
 * saves one set as a crate through crate_action with Serato closed.
 * An empty set does not write. Audio files are not rewritten. A newer
 * selection ignores a late response. CrateComparePanel paints the three
 * sets. The view covers the whole space.
 *
 * Page text is in the locale catalogs under compare.*.
 */

import { createElement } from "react";
import { failureOf, postJSON, readJSON } from "../api";
import { isQueuedWrite } from "./queue-notice";
import type { Crate, CrateComparePlan, CrateCompareReport } from "../api-types";
import { mountIsland, type IslandRoot } from "../../app/mount";
import { CrateComparePanel } from "../../pages/CrateComparePanel";
import { bridge } from "../bridge";
import { el } from "../dom";
import { serverMessage, t } from "../i18n";
import { state } from "../state";

type CompareSet = "both" | "only_a" | "only_b";

let latest: CrateCompareReport | null = null;
let busy = false;
let reportRoot: IslandRoot | undefined;
let reportHost: HTMLElement | null = null;

/**
 * Attach Compare and Save crate.
 *
 * Called once at startup. A later call is a no-op.
 *
 * @returns {void}
 */
export function wireCrateCompare(): void {
  const panel = el("compare-panel");
  if (panel.dataset.compareWired === "true") return;
  panel.dataset.compareWired = "true";
  el("compare-refresh").addEventListener("click", () => {
    void loadCrateCompare();
  });
  el("compare-report").addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>("[data-compare-set]");
    if (!button) return;
    const setKey = button.dataset.compareSet;
    if (setKey === "both" || setKey === "only_a" || setKey === "only_b") {
      void saveSet(setKey);
    }
  });
}

/**
 * Ask for a read-only compare of the two selected crates.
 *
 * The previous report stays on screen until this reply arrives. Compare
 * is disabled while the request runs. Fewer than two crates skips the
 * request.
 *
 * @returns {Promise<void>}
 */
export async function loadCrateCompare(): Promise<void> {
  fillCrateSelects();
  if (state.crates.length < 2) {
    latest = null;
    failStatus(t("compare.needTwo"));
    clearReport();
    return;
  }
  const token = ++state.compareToken;
  beginBusy("check");
  let settle: "report" | "retry" | "none" = "none";
  try {
    const a = Number(el("compare-a").value);
    const b = Number(el("compare-b").value);
    const subcrates = el("compare-subcrates").checked;
    const extra = subcrates ? "&subcrates=1" : "";
    const response = await fetch(
      `/api/crate-compare?space=${encodeURIComponent(state.space)}&a=${a}&b=${b}${extra}`,
    );
    if (token !== state.compareToken) return;
    const payload = await readJSON<CrateCompareReport>(response).catch((): null => null);
    if (token !== state.compareToken) return;
    if (!response.ok || payload === null) {
      failStatus(serverMessage(payload, t("compare.unreadable")));
      settle = "retry";
      return;
    }
    latest = payload;
    el("compare-status").textContent = "";
    renderCrateCompareReport(payload);
    settle = "report";
  } catch {
    if (token !== state.compareToken) return;
    failStatus(t("compare.unreachable"));
    settle = "retry";
  } finally {
    if (token !== state.compareToken) return;
    endBusy();
    if (settle === "retry") el("compare-refresh").focus();
    if (settle === "report") el("compare-report").focus();
  }
}

/**
 * Show a compare failure in the status line.
 *
 * The report already on screen stays. Focus moves to Compare.
 *
 * @param error Failure from loadCrateCompare.
 * @returns {void}
 */
export function showCrateCompareFailure(error: unknown): void {
  const message = error instanceof Error && error.message
    ? error.message
    : t("compare.unreadable");
  failStatus(message);
  endBusy();
  el("compare-refresh").focus();
}

/**
 * Paint the three sets.
 *
 * @param payload JSON from GET /api/crate-compare.
 * @returns {void}
 */
export function renderCrateCompareReport(payload: CrateCompareReport): void {
  el("compare-scope").textContent = t("gig.wholeSpace");
  const report = el("compare-report");
  if (reportRoot && reportHost !== report) {
    reportRoot.unmount();
    reportRoot = undefined;
  }
  reportHost = report;
  reportRoot = mountIsland(
    report,
    createElement(CrateComparePanel, {
      payload,
      writable: state.writable,
      busy,
    }),
    reportRoot,
  );
}

/**
 * Unmount the Compare crates island.
 *
 * Tests replace `document.body` between cases. Unmount first so the
 * Data Grid scheduler does not run after jsdom tears the window down.
 * A pending load is ignored so it does not look up a host that is gone.
 *
 * @returns {void}
 */
export function unmountCrateCompare(): void {
  state.compareToken += 1;
  busy = false;
  latest = null;
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
export function repaintCrateCompare(): void {
  el("compare-scope").textContent = t("gig.wholeSpace");
  if (latest) renderCrateCompareReport(latest);
}

function fillCrateSelects(): void {
  const crates = state.crates;
  const aSelect = el("compare-a");
  const bSelect = el("compare-b");
  const prevA = Number(aSelect.value);
  const prevB = Number(bSelect.value);
  aSelect.replaceChildren();
  bSelect.replaceChildren();
  for (const crate of crates) {
    aSelect.append(optionFor(crate));
    bSelect.append(optionFor(crate));
  }
  const ids = crates.map((crate) => crate.id);
  const preferredA = typeof state.activeCrate === "number" && ids.includes(state.activeCrate)
    ? state.activeCrate
    : ids[0];
  const a = ids.includes(prevA) ? prevA : preferredA;
  const b = ids.includes(prevB) && prevB !== a
    ? prevB
    : ids.find((id) => id !== a);
  if (a != null) aSelect.value = String(a);
  if (b != null) bSelect.value = String(b);
}

function optionFor(crate: Crate): HTMLOptionElement {
  const node = document.createElement("option");
  node.value = String(crate.id);
  node.textContent = crate.name;
  return node;
}

async function saveSet(setKey: CompareSet): Promise<void> {
  if (!latest || !state.writable) return;
  const tracks = latest[setKey] || [];
  if (!tracks.length) return;
  const token = ++state.compareToken;
  beginBusy("save");
  try {
    const payload = await postJSON<CrateComparePlan>("/api/crate-compare", {
      action: "create",
      space: state.space,
      a: Number(el("compare-a").value),
      b: Number(el("compare-b").value),
      set: setKey,
      subcrates: el("compare-subcrates").checked,
    });
    if (token !== state.compareToken) return;
    if (isQueuedWrite(payload)) {
      el("compare-status").textContent = t("gigLock.queued");
      return;
    }
    await bridge.reloadLibrary();
    if (token !== state.compareToken) return;
    fillCrateSelects();
    latest = payload;
    el("compare-status").textContent = payload.written
      ? t("compare.written", { count: payload.count, name: payload.name })
      : t("compare.empty");
    renderCrateCompareReport(payload);
    el("compare-report").focus();
  } catch (error) {
    if (token !== state.compareToken) return;
    const failed = failureOf(error);
    failStatus(failed.message);
    if (failed.status === 409) bridge.lockDown(error);
    el("compare-report").focus();
  } finally {
    if (token !== state.compareToken) return;
    endBusy();
  }
}

function beginBusy(kind: "check" | "save"): void {
  busy = true;
  const refresh = el("compare-refresh");
  refresh.disabled = true;
  refresh.setAttribute("aria-busy", "true");
  el("compare-panel").setAttribute("aria-busy", "true");
  el("compare-status").textContent = kind === "save" ? t("compare.saving") : t("compare.checking");
  if (latest) renderCrateCompareReport(latest);
}

function endBusy(): void {
  busy = false;
  const refresh = el("compare-refresh");
  refresh.disabled = false;
  refresh.setAttribute("aria-busy", "false");
  el("compare-panel").setAttribute("aria-busy", "false");
  if (latest) renderCrateCompareReport(latest);
}

function clearReport(): void {
  el("compare-scope").textContent = t("gig.wholeSpace");
  if (!reportRoot) return;
  try {
    reportRoot.unmount();
  } catch {
    // Host already gone.
  }
  reportRoot = undefined;
  reportHost = null;
  el("compare-report").replaceChildren();
}

function failStatus(message: string): void {
  el("compare-status").textContent = message;
}
