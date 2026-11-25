/**
 * Won't play report engine.
 *
 * Typed against GET /api/player-compat. The request reads file headers
 * and does not write. A newer selection ignores a late response. The
 * report is painted by `PlayerCompatReport` on `GigContext`. All tracks
 * checks the whole space. A crate checks that crate.
 *
 * Page text is in the locale catalogs under players.*.
 */

import { createElement } from "react";
import { readJSON } from "../api";
import type { PlayerCompatReport } from "../api-types";
import { mountIsland, type IslandRoot } from "../../app/mount";
import type { PlayersSnapshot } from "../../containers/GigContext";
import { PlayerCompatReport as PlayerCompatReportView } from "../../pages/PlayerCompatReport";
import { el } from "../dom";
import { serverMessage, t } from "../i18n";
import { state } from "../state";
import { playersScopeLabel } from "./players-view";

type PlayersListener = (snapshot: PlayersSnapshot) => void;

const listeners = new Set<PlayersListener>();

let latest: PlayerCompatReport | null = null;
let show = "problems";
let islandRoot: IslandRoot | null = null;

function emit(): void {
  const snapshot = getPlayersSnapshot();
  for (const listener of listeners) listener(snapshot);
}

function beginBusy(): void {
  const button = el("players-refresh");
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  el("players-panel").setAttribute("aria-busy", "true");
  el("players-status").textContent = t("players.checking");
}

function endBusy(): void {
  const button = el("players-refresh");
  button.disabled = false;
  button.setAttribute("aria-busy", "false");
  el("players-panel").setAttribute("aria-busy", "false");
}

function failStatus(message: string): void {
  el("players-status").textContent = message;
}

function updateScope(): void {
  el("players-scope").textContent = playersScopeLabel();
}

/**
 * Return a copy of the Won't play snapshot.
 *
 * @returns The current report, scope label, and Show-menu value.
 */
export function getPlayersSnapshot(): PlayersSnapshot {
  return { report: latest, scope: playersScopeLabel(), show };
}

/**
 * Run a callback after each Won't play change.
 *
 * The callback is not run immediately. Call `getPlayersSnapshot` for the
 * current snapshot. The returned function removes the callback.
 *
 * @param listener Called with a snapshot. Do not mutate it.
 * @returns Unsubscribes the listener.
 */
export function subscribePlayers(listener: PlayersListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Attach the player menu, the Show menu, and Check again.
 *
 * Called once at startup. A later call is a no-op.
 *
 * @returns {void}
 */
export function wirePlayers(): void {
  const panel = el("players-panel");
  if (panel.dataset.playersWired === "true") return;
  panel.dataset.playersWired = "true";
  el("players-refresh").addEventListener("click", () => {
    void loadPlayers();
  });
  el("players-target").addEventListener("change", () => {
    void loadPlayers();
  });
  el("players-show").addEventListener("change", () => {
    show = el("players-show").value || "problems";
    emit();
  });
  islandRoot = mountIsland(el("players-report"), createElement(PlayerCompatReportView));
}

/**
 * Unmount the Won't play Data Grid island.
 *
 * Tests replace `document.body` between cases. Unmount first so the
 * Data Grid scheduler does not run after jsdom tears the window down.
 *
 * @returns {void}
 */
export function unmountPlayers(): void {
  state.playersToken += 1;
  latest = null;
  show = "problems";
  if (!islandRoot) return;
  try {
    islandRoot.unmount();
  } catch {
    // installPage already dropped the host.
  }
  islandRoot = null;
}

/**
 * Ask for a read-only player check of the open crate, or the whole space.
 *
 * The previous report stays on screen until this reply arrives. Check
 * again is disabled while the request runs.
 *
 * @returns {Promise<void>}
 */
export async function loadPlayers(): Promise<void> {
  const token = ++state.playersToken;
  beginBusy();
  let settle: "report" | "retry" | "none" = "none";
  const player = el("players-target").value || "club";
  const params = new URLSearchParams({
    space: state.space,
    player,
    scope: state.activeCrate === "all" ? "library" : "crate",
  });
  if (state.activeCrate !== "all") params.set("crate", String(state.activeCrate));
  try {
    const response = await fetch(`/api/player-compat?${params.toString()}`);
    if (token !== state.playersToken) return;
    const payload = await readJSON<PlayerCompatReport>(response).catch((): null => null);
    if (token !== state.playersToken) return;
    if (!response.ok || payload === null) {
      failStatus(serverMessage(payload, t("players.unreadable")));
      settle = "retry";
      return;
    }
    latest = payload;
    el("players-status").textContent = "";
    updateScope();
    emit();
    settle = "report";
  } catch {
    if (token !== state.playersToken) return;
    failStatus(t("players.unreachable"));
    settle = "retry";
  } finally {
    if (token !== state.playersToken) return;
    endBusy();
    if (settle === "retry") el("players-refresh").focus();
    if (settle === "report") el("players-report").focus();
  }
}

/**
 * Show a player-check failure in the status line.
 *
 * The report already on screen stays. Focus moves to Check again.
 *
 * @param error Failure from loadPlayers.
 * @returns {void}
 */
export function showPlayersFailure(error: unknown): void {
  const message = error instanceof Error && error.message
    ? error.message
    : t("players.unreadable");
  failStatus(message);
  endBusy();
  el("players-refresh").focus();
}

/**
 * Paint the last report again in the active language.
 *
 * locale-wiring calls this on a language change. Nothing is fetched.
 *
 * @returns {void}
 */
export function repaintPlayers(): void {
  updateScope();
  emit();
}
