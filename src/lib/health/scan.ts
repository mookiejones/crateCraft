/**
 * Read-only damaged-file scan.
 *
 * Typed against GET /api/file-scan. The request does not write. A newer
 * selection ignores a late response. ScanPanel paints from HealthContext.
 * A full decode needs a crate.
 *
 * Page text is in the locale catalogs under scan.*.
 */

import { createElement } from "react";
import { readJSON } from "../api";
import type { FileScanReport } from "../api-types";
import { mountIsland, type IslandRoot } from "../../app/mount";
import { ScanPanel } from "../../pages/ScanPanel";
import type { ScanDepth } from "../../containers/HealthContext";
import { el } from "../dom";
import { emitHealth } from "./health-events";
import { crateScopeLabel } from "./health-list";
import { serverMessage, t } from "../i18n";
import { state } from "../state";

let latest: FileScanReport | null = null;
let status = "";
let busy = false;
let lastDepth: ScanDepth = "quick";
const expanded = new Set<string>();
let panelRoot: IslandRoot | undefined;
let panelHost: HTMLElement | null = null;

/**
 * Snapshot HealthProvider reads for Damaged files.
 *
 * @returns Report, status, busy, and whether Full decode is offered.
 */
export function getScanSnapshot(): {
  scanReport: FileScanReport | null;
  scanStatus: string;
  scanBusy: boolean;
  scanScope: string;
  scanFullDisabled: boolean;
  scanExpanded: ReadonlySet<string>;
} {
  return {
    scanReport: latest,
    scanStatus: status,
    scanBusy: busy,
    scanScope: crateScopeLabel(),
    scanFullDisabled: state.activeCrate === "all",
    scanExpanded: expanded,
  };
}

/**
 * Show every row in one problem group.
 *
 * @param kind Problem key from the report.
 * @returns {void}
 */
export function expandScan(kind: string): void {
  expanded.add(kind);
  emitHealth();
}

/**
 * Attach Quick check and Full decode.
 *
 * Called once at startup. A later call remounts the same host.
 *
 * @returns {void}
 */
export function wireScan(): void {
  const panel = el("scan-panel");
  if (panelRoot && panelHost !== panel) {
    panelRoot.unmount();
    panelRoot = undefined;
  }
  panelHost = panel;
  panelRoot = mountIsland(panel, createElement(ScanPanel), panelRoot);
}

/**
 * Unmount the Damaged-files Data Grid island.
 *
 * Tests replace `document.body` between cases. Unmount first so the
 * Data Grid scheduler does not run after jsdom tears the window down.
 * A pending load is ignored so it does not look up a host that is gone.
 *
 * @returns {void}
 */
export function unmountScan(): void {
  state.scanToken += 1;
  if (!panelRoot) return;
  try {
    panelRoot.unmount();
  } catch {
    // installPage already dropped the host.
  }
  panelRoot = undefined;
  panelHost = null;
}

/**
 * Ask for a read-only file check of the open space and crate.
 *
 * The previous report stays on screen until this reply arrives. Both
 * check buttons are disabled while the request runs. A full decode of
 * the whole space is refused before the request.
 *
 * @param depth `quick` reads headers; `full` also decodes. Omit to
 *     repeat the last depth, falling back to quick when no crate is
 *     selected.
 * @returns {Promise<void>}
 */
export async function loadScan(depth?: ScanDepth): Promise<void> {
  const chosen = resolveDepth(depth);
  const token = ++state.scanToken;
  beginBusy();
  let settle: "report" | "retry" | "none" = "none";
  if (chosen === "full" && state.activeCrate === "all") {
    failStatus(t("error.scan_full_needs_crate"));
    endBusy();
    el("scan-full").focus();
    return;
  }
  lastDepth = chosen;
  const crate = state.activeCrate === "all" ? "all" : String(state.activeCrate);
  try {
    const response = await fetch(
      `/api/file-scan?space=${encodeURIComponent(state.space)}&crate=${encodeURIComponent(crate)}&depth=${encodeURIComponent(chosen)}`,
    );
    if (token !== state.scanToken) return;
    const payload = await readJSON<FileScanReport>(response).catch((): null => null);
    if (token !== state.scanToken) return;
    if (!response.ok || payload === null) {
      failStatus(serverMessage(payload, t("scan.unreadable")));
      settle = "retry";
      return;
    }
    latest = payload;
    expanded.clear();
    status = "";
    emitHealth();
    settle = "report";
  } catch {
    if (token !== state.scanToken) return;
    failStatus(t("scan.unreachable"));
    settle = "retry";
  } finally {
    if (token !== state.scanToken) return;
    endBusy();
    if (settle === "retry") el("scan-quick").focus();
    if (settle === "report") el("scan-report").focus();
  }
}

/**
 * Show a scan failure in the status line.
 *
 * The report already on screen stays. Focus moves to Quick check.
 *
 * @param error Failure from loadScan.
 * @returns {void}
 */
export function showScanFailure(error: unknown): void {
  const message = error instanceof Error && error.message
    ? error.message
    : t("scan.unreadable");
  failStatus(message);
  endBusy();
  el("scan-quick").focus();
}

/**
 * Keep the last report and refresh labels in the active language.
 *
 * locale-wiring calls this on a language change. Nothing is fetched.
 *
 * @returns {void}
 */
export function repaintScan(): void {
  emitHealth();
}

/**
 * Store a report and paint it.
 *
 * @param payload JSON from GET /api/file-scan.
 * @returns {void}
 */
export function renderScanReport(payload: FileScanReport): void {
  latest = payload;
  status = "";
  emitHealth();
}

function resolveDepth(depth: ScanDepth | undefined): ScanDepth {
  if (depth === "quick" || depth === "full") return depth;
  if (lastDepth === "full" && state.activeCrate === "all") return "quick";
  return lastDepth;
}

function beginBusy(): void {
  busy = true;
  status = t("scan.checking");
  el("scan-panel").setAttribute("aria-busy", "true");
  emitHealth();
}

function endBusy(): void {
  busy = false;
  el("scan-panel").setAttribute("aria-busy", "false");
  emitHealth();
}

function failStatus(message: string): void {
  status = message;
  emitHealth();
}
