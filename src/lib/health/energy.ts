/**
 * Energy: 1–10 written into a blank Grouping field.
 *
 * GET /api/energy is read-only and needs a crate. POST apply writes
 * `Energy N` through safe_write with Serato closed. It re-plans so a
 * Grouping that gained text is never overwritten. An empty plan does
 * not write. Audio files are not rewritten. A newer selection ignores
 * a late response. EnergyPanel paints a Data Grid.
 *
 * Page text is in the locale catalogs under energy.*.
 */

import { createElement } from "react";
import { failureOf, postJSON, readJSON } from "../api";
import { isQueuedWrite } from "../crates/queue-notice";
import type { EnergyPlan } from "../api-types";
import { mountIsland, type IslandRoot } from "../../app/mount";
import { EnergyPanel } from "../../pages/EnergyPanel";
import { bridge } from "../bridge";
import { el } from "../dom";
import { serverMessage, t } from "../i18n";
import { state } from "../state";

let latest: EnergyPlan | null = null;
let reportRoot: IslandRoot | undefined;
let reportHost: HTMLElement | null = null;

/**
 * Attach Check again and Apply.
 *
 * Called once at startup. A later call is a no-op.
 *
 * @returns {void}
 */
export function wireEnergy(): void {
  const panel = el("energy-panel");
  if (panel.dataset.energyWired === "true") return;
  panel.dataset.energyWired = "true";
  el("energy-refresh").addEventListener("click", () => {
    void loadEnergy();
  });
  el("energy-apply").addEventListener("click", () => {
    void applyEnergy();
  });
}

/**
 * Ask for a read-only energy plan of the open crate.
 *
 * The previous report stays on screen until this reply arrives. Check
 * again is disabled while the request runs. A whole-space check is
 * refused before the request.
 *
 * @returns {Promise<void>}
 */
export async function loadEnergy(): Promise<void> {
  const token = ++state.energyToken;
  beginBusy("check");
  let settle: "report" | "retry" | "none" = "none";
  if (state.activeCrate === "all") {
    failStatus(t("error.energy_needs_crate"));
    endBusy();
    el("energy-refresh").focus();
    return;
  }
  const crate = String(state.activeCrate);
  try {
    const response = await fetch(
      `/api/energy?space=${encodeURIComponent(state.space)}&crate=${encodeURIComponent(crate)}`,
    );
    if (token !== state.energyToken) return;
    const payload = await readJSON<EnergyPlan>(response).catch((): null => null);
    if (token !== state.energyToken) return;
    if (!response.ok || payload === null) {
      failStatus(serverMessage(payload, t("energy.unreadable")));
      settle = "retry";
      return;
    }
    latest = payload;
    el("energy-status").textContent = "";
    renderEnergyReport(payload);
    settle = "report";
  } catch {
    if (token !== state.energyToken) return;
    failStatus(t("energy.unreachable"));
    settle = "retry";
  } finally {
    if (token !== state.energyToken) return;
    endBusy();
    if (settle === "retry") el("energy-refresh").focus();
    if (settle === "report") el("energy-report").focus();
  }
}

/**
 * Show an energy failure in the status line.
 *
 * The report already on screen stays. Focus moves to Check again.
 *
 * @param error Failure from loadEnergy.
 * @returns {void}
 */
export function showEnergyFailure(error: unknown): void {
  const message = error instanceof Error && error.message
    ? error.message
    : t("energy.unreadable");
  failStatus(message);
  endBusy();
  el("energy-refresh").focus();
}

/**
 * Paint the counts and the blank-Grouping Data Grid.
 *
 * @param payload JSON from GET /api/energy.
 * @returns {void}
 */
export function renderEnergyReport(payload: EnergyPlan): void {
  el("energy-scope").textContent = scopeLabel();
  const report = el("energy-report");
  if (reportRoot && reportHost !== report) {
    reportRoot.unmount();
    reportRoot = undefined;
  }
  reportHost = report;
  reportRoot = mountIsland(
    report,
    createElement(EnergyPanel, { payload }),
    reportRoot,
  );
}

/**
 * Unmount the Energy Data Grid island.
 *
 * Tests replace `document.body` between cases. Unmount first so the
 * Data Grid scheduler does not run after jsdom tears the window down.
 * A pending load is ignored so it does not look up a host that is gone.
 *
 * @returns {void}
 */
export function unmountEnergy(): void {
  state.energyToken += 1;
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
export function repaintEnergy(): void {
  el("energy-scope").textContent = scopeLabel();
  if (latest) renderEnergyReport(latest);
}

async function applyEnergy(): Promise<void> {
  if (state.activeCrate === "all" || !latest?.fixes.length || !state.writable) return;
  const token = ++state.energyToken;
  const crate = state.activeCrate;
  beginBusy("apply");
  try {
    const payload = await postJSON<EnergyPlan>("/api/energy", {
      action: "apply",
      space: state.space,
      crate,
    });
    if (token !== state.energyToken) return;
    if (isQueuedWrite(payload)) {
      el("energy-status").textContent = t("gigLock.queued");
      return;
    }
    const writtenCount = payload.written ? payload.fixes.length : 0;
    await bridge.reloadLibrary();
    if (token !== state.energyToken) return;
    const response = await fetch(
      `/api/energy?space=${encodeURIComponent(state.space)}&crate=${encodeURIComponent(String(crate))}`,
    );
    if (token !== state.energyToken) return;
    const remaining = await readJSON<EnergyPlan>(response).catch((): null => null);
    if (token !== state.energyToken) return;
    if (!response.ok || remaining === null) {
      failStatus(serverMessage(remaining, t("energy.unreadable")));
      el("energy-refresh").focus();
      return;
    }
    latest = remaining;
    el("energy-status").textContent = writtenCount
      ? t("energy.written", { count: writtenCount })
      : "";
    renderEnergyReport(remaining);
    el("energy-report").focus();
  } catch (error) {
    if (token !== state.energyToken) return;
    const failed = failureOf(error);
    failStatus(failed.message);
    if (failed.status === 409) bridge.lockDown(error);
    el("energy-apply").focus();
  } finally {
    if (token !== state.energyToken) return;
    endBusy();
  }
}

function beginBusy(kind: "check" | "apply"): void {
  for (const id of ["energy-refresh", "energy-apply"] as const) {
    const button = el(id);
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
  }
  el("energy-panel").setAttribute("aria-busy", "true");
  el("energy-status").textContent = kind === "apply" ? t("energy.applying") : t("energy.checking");
}

function endBusy(): void {
  const noCrate = state.activeCrate === "all";
  const refresh = el("energy-refresh");
  refresh.disabled = noCrate;
  refresh.setAttribute("aria-busy", "false");
  const apply = el("energy-apply");
  apply.disabled = noCrate || !state.writable || !latest?.fixes.length;
  apply.setAttribute("aria-busy", "false");
  el("energy-panel").setAttribute("aria-busy", "false");
}

function failStatus(message: string): void {
  el("energy-status").textContent = message;
}

function scopeLabel(): string {
  if (state.activeCrate === "all") return t("crates.allTracks");
  const crate = state.crates.find((row) => row.id === state.activeCrate);
  return crate?.name || t("crates.selectedCrate");
}
