/**
 * Streaming repair: list greyed-out Beatport and Beatsource tracks.
 *
 * GET /api/streaming-swap is read-only. POST apply writes only when
 * confirm is true, with Serato closed. The same library row is pointed
 * at the local file, so colour and crate order stay. Cue points in the
 * file are not rewritten. StreamingSwapPanel paints the grid.
 *
 * Page text is in the locale catalogs under streams.*.
 */

import { createElement } from "react";
import { failureOf, postJSON, readJSON } from "../api";
import { isQueuedWrite } from "../crates/queue-notice";
import type { StreamingSwapPlan } from "../api-types";
import { mountIsland, type IslandRoot } from "../../app/mount";
import { highSwaps, StreamingSwapPanel } from "../../pages/StreamingSwapPanel";
import { bridge } from "../bridge";
import { el } from "../dom";
import { serverMessage, t } from "../i18n";
import { state } from "../state";

let latest: StreamingSwapPlan | null = null;
let confirmRepair = false;
let reportRoot: IslandRoot | undefined;
let reportHost: HTMLElement | null = null;

const BUTTONS = ["streams-refresh", "streams-repair"] as const;

function beginBusy(): void {
  for (const id of BUTTONS) {
    const button = document.getElementById(id);
    if (button instanceof HTMLButtonElement) button.disabled = true;
  }
  el("streams-panel").setAttribute("aria-busy", "true");
}

function endBusy(): void {
  el("streams-panel").setAttribute("aria-busy", "false");
  const refresh = el("streams-refresh");
  if (refresh instanceof HTMLButtonElement) refresh.disabled = false;
  const repair = el("streams-repair");
  if (repair instanceof HTMLButtonElement) {
    repair.disabled = !state.writable || highSwaps(latest || emptyPlan()).length === 0;
  }
}

function emptyPlan(): StreamingSwapPlan {
  return {
    tracks: [],
    truncated: false,
    cues: "kept-on-row",
    note: "",
    roots: [],
    preview: true,
    written: false,
  };
}

/**
 * Attach Check again, Repair, and the confirm button.
 *
 * Called once at startup. A later call is a no-op.
 *
 * @returns {void}
 */
export function wireStreamingSwap(): void {
  const panel = el("streams-panel");
  if (panel.dataset.streamsWired === "true") return;
  panel.dataset.streamsWired = "true";
  el("streams-refresh").addEventListener("click", () => {
    void loadStreamingSwap();
  });
  el("streams-repair").addEventListener("click", () => {
    confirmRepair = true;
    if (latest) renderStreamingSwap(latest);
    el("streams-report").focus();
  });
  el("streams-report").addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-streams-action]");
    if (!button || button.disabled) return;
    if (button.dataset.streamsAction === "confirm-repair") void applyRepair();
  });
}

/**
 * Ask for the streaming repair list.
 *
 * Nothing is written. A stale reply is ignored.
 *
 * @returns {Promise<void>}
 */
export async function loadStreamingSwap(): Promise<void> {
  const token = ++state.streamsToken;
  confirmRepair = false;
  beginBusy();
  el("streams-status").textContent = "";
  let settle: "report" | "retry" | "none" = "none";
  try {
    const response = await fetch(`/api/streaming-swap?space=${encodeURIComponent(state.space)}`);
    if (token !== state.streamsToken) return;
    const payload = await readJSON<StreamingSwapPlan>(response).catch((): null => null);
    if (token !== state.streamsToken) return;
    if (!response.ok || payload === null) {
      el("streams-status").textContent = serverMessage(payload, t("streams.loadFailed"));
      settle = "retry";
      return;
    }
    latest = payload;
    renderStreamingSwap(payload);
    settle = "report";
  } catch {
    if (token !== state.streamsToken) return;
    el("streams-status").textContent = t("streams.unreachable");
    settle = "retry";
  } finally {
    if (token !== state.streamsToken) return;
    endBusy();
    if (settle === "retry") el("streams-refresh").focus();
    if (settle === "report") el("streams-report").focus();
  }
}

/**
 * Show a scan or write failure in the status line.
 *
 * @param error Failure from the streaming repair view.
 * @returns {void}
 */
export function showStreamingSwapFailure(error: unknown): void {
  const failed = failureOf(error);
  el("streams-status").textContent = failed.message || t("streams.loadFailed");
  endBusy();
  if (failed.status === 409) bridge.lockDown(error);
  el("streams-refresh").focus();
}

/**
 * Paint the list.
 *
 * @param payload JSON from GET /api/streaming-swap.
 * @returns {void}
 */
export function renderStreamingSwap(payload: StreamingSwapPlan): void {
  el("streams-scope").textContent = t("gig.wholeSpace");
  const report = el("streams-report");
  if (reportRoot && reportHost !== report) {
    reportRoot.unmount();
    reportRoot = undefined;
  }
  reportHost = report;
  reportRoot = mountIsland(
    report,
    createElement(StreamingSwapPanel, {
      payload,
      confirmRepair,
      writable: state.writable,
    }),
    reportRoot,
  );
  endBusy();
}

/**
 * Drop the grid. Tests call this after the document is gone.
 *
 * @returns {void}
 */
export function unmountStreamingSwap(): void {
  reportRoot?.unmount();
  reportRoot = undefined;
  reportHost = null;
  latest = null;
  confirmRepair = false;
}

/**
 * Paint the list again in the active language.
 *
 * @returns {void}
 */
export function repaintStreamingSwap(): void {
  el("streams-scope").textContent = t("gig.wholeSpace");
  if (latest) renderStreamingSwap(latest);
}

async function applyRepair(): Promise<void> {
  if (!latest || !state.writable) return;
  const swaps = highSwaps(latest);
  if (!swaps.length) return;
  const token = ++state.streamsToken;
  const roots = latest.roots;
  beginBusy();
  try {
    const payload = await postJSON<StreamingSwapPlan>("/api/streaming-swap", {
      action: "apply",
      confirm: true,
      space: state.space,
      roots,
      swaps,
    });
    if (token !== state.streamsToken) return;
    if (isQueuedWrite(payload)) {
      el("streams-status").textContent = t("gigLock.queued");
      confirmRepair = false;
      return;
    }
    confirmRepair = false;
    latest = payload;
    el("streams-status").textContent = payload.written
      ? t("streams.written", { count: payload.swaps?.length || swaps.length })
      : t("streams.none");
    renderStreamingSwap(payload);
    if (payload.written) await bridge.reloadLibrary();
    if (token !== state.streamsToken) return;
    el("streams-report").focus();
  } catch (error) {
    if (token !== state.streamsToken) return;
    showStreamingSwapFailure(error);
  } finally {
    if (token === state.streamsToken) endBusy();
  }
}
