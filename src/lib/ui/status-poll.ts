/**
 * Keep the write-lock banner in step with Serato.
 *
 * Polls GET /api/status while the window is visible (every 5 s, and right
 * away on focus / visibilitychange). Stops while the page is hidden. A
 * Check again button triggers the same refresh.
 */

import type { SeratoStatus } from "../api-types";
import { failureOf, readJSONOr } from "../api";
import { t } from "../i18n";
import { setTooltip } from "./tooltip";
import { tips } from "./tooltip-strings";

const POLL_MS = 5000;

export type ApplyStatus = (info: SeratoStatus | null | undefined) => void;
export type SetNotice = (text: string, severity?: "info" | "error") => void;

let applyStatus: ApplyStatus = () => {};
let setNotice: SetNotice = () => {};
let timer: ReturnType<typeof setInterval> | null = null;
let inFlight: Promise<void> | null = null;
let wired = false;

/**
 * Fetch GET /api/status and push it through applyStatus.
 *
 * @returns Resolves after the banner updates, or after a failed read.
 */
export async function refreshStatus(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const response = await fetch("/api/status");
      const info = await readJSONOr<SeratoStatus>(response, {} as SeratoStatus);
      if (!response.ok) {
        throw new Error(t("status.refreshFailed"));
      }
      applyStatus(info);
    } catch (error: unknown) {
      setNotice(failureOf(error).message, "error");
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

function pageVisible(): boolean {
  return typeof document !== "undefined" && document.visibilityState !== "hidden";
}

function stopPolling(): void {
  if (timer == null) return;
  clearInterval(timer);
  timer = null;
}

function startPolling(): void {
  if (timer != null || !pageVisible()) return;
  timer = setInterval(() => {
    if (!pageVisible()) {
      stopPolling();
      return;
    }
    void refreshStatus();
  }, POLL_MS);
}

function onVisibilityOrFocus(): void {
  if (!pageVisible()) {
    stopPolling();
    return;
  }
  void refreshStatus();
  startPolling();
}

/**
 * Show or hide Check again with the status line.
 *
 * @param info Latest status. Null before the first answer.
 * @returns {void}
 */
export function paintStatusRefresh(info: SeratoStatus | null | undefined): void {
  const button = document.getElementById("status-refresh");
  if (!(button instanceof HTMLButtonElement)) return;
  const show = info?.writable === false;
  button.hidden = !show;
  button.textContent = t("status.checkAgain");
  button.setAttribute("aria-label", t("status.checkAgain"));
  setTooltip(button, tips.statusRefresh);
}

/**
 * Wire the poll and the Check again button.
 *
 * Safe to call once. applyStatus and setNotice are the live page hooks.
 *
 * @param hooks applyStatus and setNotice from views.
 * @returns {void}
 */
export function wireStatusPoll(hooks: { applyStatus: ApplyStatus; setNotice: SetNotice }): void {
  applyStatus = hooks.applyStatus;
  setNotice = hooks.setNotice;
  if (wired) return;
  wired = true;
  const button = document.getElementById("status-refresh");
  if (button instanceof HTMLButtonElement) {
    button.addEventListener("click", () => {
      void refreshStatus();
    });
  }
  document.addEventListener("visibilitychange", onVisibilityOrFocus);
  window.addEventListener("focus", onVisibilityOrFocus);
  if (pageVisible()) startPolling();
}

/**
 * Stop the poll. Tests call this so a timer does not outlive the document.
 *
 * @returns {void}
 */
export function stopStatusPoll(): void {
  stopPolling();
  wired = false;
  applyStatus = () => {};
  setNotice = () => {};
  document.removeEventListener("visibilitychange", onVisibilityOrFocus);
  window.removeEventListener("focus", onVisibilityOrFocus);
}
