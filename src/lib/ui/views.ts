/**
 * Crates, history, play stats, missing tracks, duplicates, stems, library health, damaged files, suspect quality, tag spellings, tempo drift, and the portable drive check.
 *
 * Files is React on FilesContext. This module re-exports that store so
 * existing callers keep one import. Play stats fetch is history-stats.ts;
 * StatsPanel paints the Accordion report. Nothing in this module runs a
 * request when the file is imported. Listeners are attached by
 * wireLibrary, which app.ts calls once at startup.
 */

import { failureOf, postJSON, readJSONOr } from "../api";
import type {
  CopyRow,
  Crate,
  DuplicatePayload,
  ErrorBody,
  HistoryPayload,
  LibraryPayload,
  RelatedPayload,
  RelatedTrack,
  SeratoStatus,
  Track,
} from "../api-types";
import { bridge } from "../bridge";
import { el } from "../dom";
import { clickPane, paintDualChrome } from "../crates/dual-crate-view";
import { colorHex, compare, durationLabel, isNumericSort, sizeLabel } from "../format";
import { loadGigCheck, showGigFailure } from "../gig/gig";
import { loadDrift, showDriftFailure } from "../gig/drift";
import { loadHealth, mountHealthListChrome, showHealthFailure } from "../health/health";
import { healthListNote } from "../health/health-list";
import { loadHistoryStats, showHistoryStatsFailure } from "../history/history-stats";
import { loadScan, showScanFailure } from "../health/scan";
import { loadBitrate, showBitrateFailure } from "../health/bitrate";
import { loadTags, showTagsFailure } from "../health/tags";
import { loadPortableView, showPortableFailure } from "../gig/portable";
import { mountFilesIslands } from "../files/files-mount";
import {
  FILES_SEARCH_MS,
  failFiles,
  focusFileByPath,
  loadFolder,
  moveFileList,
  openFileList,
  renderFiles,
  selectedFiles,
} from "../files/files";
export {
  FILES_SEARCH_MS,
  failFiles,
  focusFileByPath,
  loadFolder,
  moveFileList,
  openFileList,
  renderFiles,
  selectedFiles,
};
import { appendBeatgrid } from "./beatgrid-view";
import { appendCueSlots, formatCueTime } from "./cue-view";
import { syncFolderSyncButton } from "../crates/folder-sync-view";
import { presetFoot, syncPresetButtons } from "../crates/preset-view";
import { failSnapshots, loadSnapshots } from "../snapshots/restore";
import { isTextSearchField, matchesQuery, parseQuery, type ParsedQuery } from "./search-filters";
import { COLOR_NAMES, COLORS, state } from "../state";
import { createElement, type ReactNode } from "react";
import { mountIsland, type IslandRoot } from "../../app/mount";
import { CrateActions } from "../../pages/CrateActions";
import { CrateBrowserActions } from "../../pages/CrateBrowserActions";
import { CrateTree } from "../../pages/CrateTree";
import { HistoryDetail } from "../../pages/HistoryDetail";
import { HistorySessions } from "../../pages/HistorySessions";
import { PlayButton } from "../../components/PlayButton";
import { TrackDetailPane } from "../../components/TrackDetail";
import { bindCrateActions, emitCrates } from "../crates/crate-store";
import { openConfirm, openCratePrompt } from "./shared-dialog";
import { mountSharedDialogs } from "./shared-dialog-mount";
import { historyActions, notifyHistory } from "../../containers/HistoryContext";
import { play } from "../player/player";
import { playerStrings } from "../player/player-strings";
import {
  registerTrackListActions,
  setTrackDetail,
  type TrackSaveFields,
} from "./track-list-store";
import { buttonEl, inputEl, selectEl, setTooltip, textareaEl } from "./tooltip";
import {
  chooseRelated,
  editField,
  membershipTip,
  openCopy,
  openReplaceCopy,
  openRelated,
  removeRelatedTip,
  revealTip,
  saveSuggestion,
  tips,
} from "./tooltip-strings";
import { paintRows } from "./virtual-scroll";
import { codedText, formatNumber, messageParams, serverMessage, t, type MessageKey } from "../i18n";
import { modeForGroup, paintNav, rememberMode } from "./nav";
import { paintSheetChrome } from "./sheet-chrome";

/**
 * Related-track request counter.
 *
 * A slow reply must not paint into a track the user has already left.
 * Incremented by loadRelated. Not sent anywhere.
 */
let relatedRequest = 0;
// Last track painted in the detail pane, so a language change can repaint it.
let lastDetail: Track | null = null;
let detailRoot: IslandRoot | null = null;
let detailPlayRoot: IslandRoot | null = null;
let crateListRoot: IslandRoot | null = null;
let crateListHost: HTMLElement | null = null;
let crateActionsRoot: IslandRoot | null = null;
let crateActionsHost: HTMLElement | null = null;
let crateBrowserRoot: IslandRoot | null = null;
let crateBrowserHost: HTMLElement | null = null;
let historyDetailRoot: IslandRoot | null = null;
let historyDetailHost: HTMLElement | null = null;
let sessionRoot: IslandRoot | null = null;
let sessionHost: HTMLElement | null = null;

function clearDetailIslands(): void {
  detailRoot?.unmount();
  detailRoot = null;
  detailPlayRoot?.unmount();
  detailPlayRoot = null;
  historyDetailRoot?.unmount();
  historyDetailRoot = null;
  historyDetailHost = null;
}

/**
 * Unmount the detail pane islands.
 *
 * Tests replace `document.body` between cases. Unmount first so the
 * MUI scheduler does not run after jsdom tears the window down.
 *
 * @returns {void}
 */
export function unmountDetailIslands(): void {
  clearDetailIslands();
}

function paintDetailIsland(): void {
  clearDetailIslands();
  detailRoot = mountIsland(el("detail"), createElement(TrackDetailPane));
}

function remountIsland(host: HTMLElement, node: ReactNode, slot: {
  host: HTMLElement | null;
  root: IslandRoot | null;
}): IslandRoot {
  if (slot.root && slot.host !== host) {
    slot.root.unmount();
    slot.root = null;
  }
  slot.host = host;
  slot.root = mountIsland(host, node, slot.root ?? undefined);
  return slot.root;
}

function mountCrateIsland(
  host: HTMLElement | null,
  node: ReactNode,
  root: IslandRoot | null,
  previous: HTMLElement | null,
): { root: IslandRoot | null; host: HTMLElement | null } {
  if (!host) return { root: null, host: null };
  if (root && previous === host) {
    return { root: mountIsland(host, node, root), host };
  }
  root?.unmount();
  return { root: mountIsland(host, node), host };
}

/**
 * Paint the crate tree and crate actions into their page hosts.
 *
 * Called from renderCrates and renderShell. A missing host is skipped so
 * a test page that omitted that markup can still load tracks.
 *
 * @returns {void}
 */
export function mountCrates(): void {
  const list = document.getElementById("crate-list");
  const listMount = mountCrateIsland(
    list instanceof HTMLElement ? list : null,
    createElement(CrateTree),
    crateListRoot,
    crateListHost,
  );
  crateListRoot = listMount.root;
  crateListHost = listMount.host;
  const actions = document.getElementById("crate-actions");
  const actionsMount = mountCrateIsland(
    actions instanceof HTMLElement ? actions : null,
    createElement(CrateActions),
    crateActionsRoot,
    crateActionsHost,
  );
  crateActionsRoot = actionsMount.root;
  crateActionsHost = actionsMount.host;
  const browser = document.getElementById("crate-browser-actions");
  const browserMount = mountCrateIsland(
    browser instanceof HTMLElement ? browser : null,
    createElement(CrateBrowserActions),
    crateBrowserRoot,
    crateBrowserHost,
  );
  crateBrowserRoot = browserMount.root;
  crateBrowserHost = browserMount.host;
  emitCrates();
}

/**
 * Match a list row against the search box and the field picker.
 *
 * Related-track search calls matchesQuery without a picker field.
 *
 * @param {Track} track Track or history row.
 * @param {ParsedQuery} query Words and filters from the search box.
 * @returns {boolean} True when the row passes the search.
 */
function listMatches(track: Track, query: ParsedQuery) {
  const field = isTextSearchField(state.searchField) ? state.searchField : undefined;
  return matchesQuery(track, query, field);
}

/**
 * Read the track search box.
 *
 * Reads state.query, which the search field copies on each input event.
 * Does not fetch the library.
 *
 * @returns {ParsedQuery} Lowercased words and filters.
 */
function queryTerms() {
  return parseQuery(state.query);
}

/**
 * Open every ancestor of a crate so the selection stays on screen.
 *
 * Writes those ancestor ids into state.expanded. Stops if the parent
 * chain cycles. Does not tell the server; the click that selects the
 * crate saves the expanded flag separately.
 *
 * @param {number} id Crate whose parents should be expanded.
 * @returns {void}
 */
function expandAncestors(id: number | "all") {
  const byId = new Map(state.crates.map((crate) => [crate.id, crate]));
  let crate = id === "all" ? undefined : byId.get(id);
  const guard = new Set();
  while (crate && !guard.has(crate.id)) {
    guard.add(crate.id);
    const parent = byId.get(crate.parent as number);
    if (!parent) break;
    state.expanded.add(parent.id);
    crate = parent;
  }
}

/**
 * Return the tracks that belong to the current view before search.
 *
 * Missing, stems, duplicates, and a single crate each filter state.tracks.
 * All tracks and history are handled by the caller. Does not fetch.
 *
 * @returns {object[]} Tracks for the active mode.
 */
function tracksForCrate(crate: number | "all"): Track[] {
  if (crate === "all") return state.tracks;
  const ids = state.crateTracks.get(crate);
  return ids ? state.tracks.filter((track) => ids.has(track.id)) : [];
}

function modeTracks() {
  let tracks = state.tracks;
  if (state.mode === "missing") tracks = tracks.filter((track) => track.missing);
  else if (state.mode === "stems") tracks = tracks.filter((track) => track.stems);
  else if (state.mode === "duplicates") {
    const ids = state.duplicateIds;
    tracks = ids ? tracks.filter((track) => ids.has(track.id)) : [];
  } else if (state.mode === "crates" && state.activeCrate !== "all") {
    tracks = tracksForCrate(state.activeCrate);
  }
  return tracks;
}

/**
 * Build the sorted rows the list will paint.
 *
 * History rows are reshaped so they share the columns of a track row.
 * The result is stored on state.view for the virtualized painter. Does
 * not contact the server.
 *
 * @returns {object[]} Rows after search and sort.
 */
export function buildView() {
  if (state.mode === "history") {
    const terms = queryTerms();
    const result = state.entries.filter((entry) => listMatches(entry, terms)).map((entry) => ({
      id: entry.id,
      name: entry.name,
      artist: entry.artist,
      album: entry.album,
      file: entry.file,
      genre: "",
      key: entry.key,
      bpm: entry.bpm,
      length_ms: entry.length_ms,
      deck: entry.deck,
      played: entry.played ? t("common.yes") : "",
      start: entry.start_time,
      missing: entry.missing,
      entry: true,
      asset_id: entry.asset_id,
      notes: entry.notes,
    } as Track));
    result.sort(compare);
    state.view = result;
    return result;
  }
  const terms = queryTerms();
  const result = modeTracks().filter((track) => listMatches(track, terms));
  result.sort(compare);
  state.view = result;
  if (state.mode === "crates" && state.splitCrates) {
    const viewB = tracksForCrate(state.secondCrate).filter((track) => listMatches(track, terms));
    viewB.sort(compare);
    state.viewB = viewB;
  } else {
    state.viewB = [];
  }
  return result;
}

/**
 * Keep one crate row tabbable after the rail is redrawn.
 *
 * The roving tabindex stays on the crate that had focus, or the first
 * crate when that id is gone. Does not move DOM focus by itself.
 *
 * @param {string|null} previousId data-id of the crate that held focus.
 * @returns {HTMLElement|null} The tabbable crate button, or null when the rail is empty.
 */
function placeCrateFocus(previousId: string | number | null) {
  const items = [...el("crate-list").querySelectorAll<HTMLButtonElement>(".crate")];
  if (!items.length) return null;
  const current = items.find((item) => item.dataset.id === previousId) || items[0];
  for (const item of items) item.tabIndex = item === current ? 0 : -1;
  return current;
}

/**
 * Redraw the crate rail and restore scroll and focus.
 *
 * Counts reflect the current track search. An All tracks row is always
 * first. Paints the React crate islands. Does not fetch or write the library.
 *
 * @returns {void}
 */
export function renderCrates() {
  const list = el("crate-list");
  const scroll = list.scrollTop;
  const active = document.activeElement;
  const restore = list.contains(active)
    ? active!.closest(".crate-row")?.querySelector<HTMLElement>(".crate")?.dataset.id ?? null
    : null;
  mountCrates();
  const focused = placeCrateFocus(restore);
  if (restore && focused) focused.focus({ preventScroll: true });
  list.scrollTop = scroll;
  renderRules();
}

/**
 * Show the smart-crate rule summary and its JSON editor.
 *
 * The editor is disabled while the library is locked. Saving posts the
 * JSON through saveRules. Removes any previous rule block first so a
 * crate change does not leave a stale editor.
 *
 * @returns {void}
 */
function renderRules() {
  document.querySelector(".rules")?.remove();
  document.querySelector(".rule-edit")?.remove();
  const crate = state.crates.find((item) => item.id === state.activeCrate);
  if (!crate || !crate.rules || state.mode !== "crates") return;
  const line = document.createElement("p");
  line.className = "rules";
  if (Array.isArray(crate.rules.rules)) {
    const lead = document.createElement("strong");
    lead.textContent = t("rules.matches");
    const parts = crate.rules.rules.map((rule) => {
      const attribute = rule.attribute || "field";
      const operation = String(rule.operation || "").toLowerCase().replaceAll("_", " ");
      return `${attribute} ${operation} “${rule.value ?? ""}”`;
    });
    const join = crate.rules.conjunction === "OR" ? t("rules.or") : t("rules.and");
    line.append(lead, document.createTextNode(` ${parts.join(` ${join} `) || t("rules.none")}`));
  }
  const editor = document.createElement("div");
  editor.className = "rule-edit";
  const area = textareaEl(tips.smartRules);
  area.value = JSON.stringify(crate.rules, null, 2);
  area.disabled = !state.writable;
  area.setAttribute("aria-label", t("rules.label"));
  const save = buttonEl(tips.saveRules);
  save.className = "text-button";
  save.textContent = t("rules.save");
  save.disabled = !state.writable;
  save.addEventListener("click", () => saveRules(crate.id, area.value));
  editor.append(area, save);
  const bar = document.querySelector<HTMLElement>(".browser-bar")!;
  bar.after(editor);
  bar.after(line);
}

/**
 * Mark History chrome on the list host.
 *
 * The Data Grid swaps column defs. This class is for layout min-width.
 *
 * @returns {void}
 */
function markHistoryColumns(): void {
  const history = state.mode === "history";
  document.querySelector(".browser")?.classList.toggle("for-history", history);
  el("list").classList.toggle("for-history", history);
}

/**
 * Relabel list chrome for tracks or history.
 *
 * The Data Grid owns the header buttons. This only marks `#list` and
 * `.browser` so History can drop the extra crate columns.
 *
 * @returns {void}
 */
export function renderColumns() {
  markHistoryColumns();
}

/**
 * Crate id Export, Import, and Rekordbox may use.
 *
 * Those controls live on Crates. Other views return null so a click
 * does not export the whole space.
 *
 * @returns {number|"all"|null} The selected crate, or null off Crates.
 */
export function playlistCrate(): number | "all" | null {
  if (state.mode !== "crates") return null;
  return state.activeCrate;
}

/**
 * Download an M3U of the selected crate.
 *
 * Off Crates this does nothing. Does not write the library.
 *
 * @returns {void}
 */
export function exportPlaylistM3u(): void {
  const crate = playlistCrate();
  if (crate == null) return;
  const link = document.createElement("a");
  link.href = `/api/export.m3u?space=${encodeURIComponent(state.space)}&crate=${encodeURIComponent(crate)}`;
  link.download = "crate.m3u";
  link.click();
}

/**
 * Show the controls and footer that belong to the current view.
 *
 * Hides crate tools outside the crate view, marks the selected view and
 * crate sort, and disables crate edits while Serato holds the lock. The
 * footer totals the tracks in the view, not the search result.
 *
 * @returns {void}
 */
export function renderShell() {
  markHistoryColumns();
  const cratesMode = state.mode === "crates";
  const gigMode = state.mode === "gig";
  const portableMode = state.mode === "portable";
  const driftMode = state.mode === "drift";
  const healthMode = state.mode === "health";
  const statsMode = state.mode === "stats";
  const scanMode = state.mode === "scan";
  const bitrateMode = state.mode === "bitrate";
  const tagsMode = state.mode === "tags";
  const historyMode = state.mode === "history";
  const showCrates = cratesMode || gigMode || driftMode || healthMode || scanMode || bitrateMode;
  el("crate-tools").hidden = !showCrates;
  el("crate-actions").hidden = !cratesMode;
  el("crate-list").hidden = !showCrates;
  el("export-m3u").hidden = !cratesMode;
  el("export-rekordbox").hidden = !cratesMode;
  el("import-m3u").hidden = !cratesMode;
  el("session-list").hidden = !historyMode;
  el("mode-note").hidden = cratesMode || historyMode;
  const filesMode = state.mode === "files";
  const snapshotsMode = state.mode === "snapshots";
  const panelMode = filesMode || snapshotsMode || gigMode || portableMode || driftMode || healthMode || statsMode || scanMode || bitrateMode || tagsMode;
  el("browser").hidden = panelMode;
  el("track-splitter").hidden = panelMode;
  el("detail").hidden = panelMode;
  el("files-panel").hidden = !filesMode;
  el("snapshots-panel").hidden = !snapshotsMode;
  el("gig-panel").hidden = !gigMode;
  el("portable-panel").hidden = !portableMode;
  el("drift-panel").hidden = !driftMode;
  el("health-panel").hidden = !healthMode;
  el("stats-panel").hidden = !statsMode;
  el("scan-panel").hidden = !scanMode;
  el("bitrate-panel").hidden = !bitrateMode;
  el("tags-panel").hidden = !tagsMode;
  const listNote = healthListNote();
  if (listNote) el("mode-note").textContent = listNote;
  if (filesMode) el("mode-note").textContent = t("mode.files");
  if (gigMode) {
    el("mode-note").textContent = t("mode.gig");
    document.querySelector(".rules")?.remove();
  }
  if (portableMode) {
    el("mode-note").textContent = t("mode.portable");
    document.querySelector(".rules")?.remove();
  }
  if (driftMode) {
    el("mode-note").textContent = t("mode.drift");
    document.querySelector(".rules")?.remove();
  }
  if (healthMode) {
    el("mode-note").textContent = t("mode.health");
    document.querySelector(".rules")?.remove();
  }
  if (statsMode) {
    el("mode-note").textContent = t("mode.stats");
    document.querySelector(".rules")?.remove();
  }
  if (scanMode) {
    el("mode-note").textContent = t("mode.scan");
    document.querySelector(".rules")?.remove();
  }
  if (bitrateMode) {
    el("mode-note").textContent = t("mode.bitrate");
    document.querySelector(".rules")?.remove();
  }
  if (tagsMode) {
    el("mode-note").textContent = t("mode.tags");
    document.querySelector(".rules")?.remove();
  }
  if (snapshotsMode) {
    el("mode-note").textContent = t("mode.snapshots");
  }
  paintNav(state.mode);
  paintSheetChrome({
    mode: state.mode,
    space: state.space,
    activeCrate: state.activeCrate,
    crates: state.crates,
  });
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-crate-sort]")) {
    button.setAttribute("aria-pressed", String(button.dataset.crateSort === state.crateSort));
  }
  mountCrates();
  const crateChosen = state.activeCrate !== "all";
  el("crate-new").disabled = !state.writable;
  el("crate-rename").disabled = !state.writable || !crateChosen;
  el("crate-color").disabled = !state.writable || !crateChosen;
  el("crate-delete").disabled = !state.writable || !crateChosen;
  syncPresetButtons();
  syncFolderSyncButton();
  syncMergeButton();
  syncRelinkButton();
  if (portableMode) {
    el("crate-foot").textContent = "";
    return;
  }
  if (filesMode) {
    if (state.filesAtRoots) {
      el("crate-foot").textContent = state.filesLoading
        ? t("files.readingRoots")
        : t("files.rootCount", { count: state.filesRoots.length });
      return;
    }
    const listed = state.filesEntries.filter((entry) => entry.kind === "file").length;
    el("crate-foot").textContent = state.filesLoading ? t("files.readingFolder") : t("files.fileCount", { count: listed });
    return;
  }
  if (gigMode || healthMode || scanMode || bitrateMode) {
    const crate = state.crates.find((item) => item.id === state.activeCrate);
    el("crate-foot").textContent = state.activeCrate === "all" ? t("crates.allTracks") : (crate?.name ?? t("crates.selectedCrate"));
    return;
  }
  if (tagsMode || statsMode) {
    el("crate-foot").textContent = t("gig.wholeSpace");
    return;
  }
  if (snapshotsMode) {
    el("crate-foot").textContent = state.snapshotLoading ? t("snapshots.reading") : t("snapshots.count", { count: state.snapshots.length });
    return;
  }
  const pool = state.mode === "history" ? state.entries : footerTracks();
  const bytes = pool.reduce((sum, track) => sum + (Number(track.file_size) || 0), 0);
  const ms = pool.reduce((sum, track) => sum + (Number(track.length_ms) || 0), 0);
  const preset = state.mode === "crates" ? presetFoot(state.activeCrate) : "";
  el("crate-foot").textContent = `${formatNumber(pool.length)} · ${durationLabel(ms)} · ${sizeLabel(bytes)}${preset}`;
}

/**
 * Return the tracks the footer should count for this view.
 *
 * Ignores the text search so the footer stays the size of the crate,
 * missing set, stem set, or duplicate set. History uses entries instead.
 *
 * @returns {object[]} Tracks included in the footer totals.
 */
function footerTracks() {
  if (state.mode === "crates" && state.activeCrate !== "all") {
    const ids = state.crateTracks.get(state.activeCrate);
    return ids ? state.tracks.filter((track) => ids.has(track.id)) : [];
  }
  if (state.mode === "missing") return state.tracks.filter((track) => track.missing);
  if (state.mode === "stems") return state.tracks.filter((track) => track.stems);
  if (state.mode === "duplicates") {
    const duplicateIds = state.duplicateIds;
    return duplicateIds ? state.tracks.filter((track) => duplicateIds.has(track.id)) : [];
  }
  return state.tracks;
}

/**
 * Refresh the shell, the count, and the visible rows.
 *
 * Selects the first row when the previous selection is no longer in the
 * view. History opens a session detail; other views fetch the track.
 * Does not itself request /api/library.
 *
 * @returns {void}
 */
export function renderList() {
  renderShell();
  if (state.mode === "files") {
    renderFiles();
    paintDualChrome();
    return;
  }
  if (state.mode === "gig") {
    renderCrates();
    paintDualChrome();
    return;
  }
  if (state.mode === "portable") {
    paintDualChrome();
    return;
  }
  if (state.mode === "health") {
    renderCrates();
    paintDualChrome();
    return;
  }
  if (state.mode === "scan") {
    renderCrates();
    paintDualChrome();
    return;
  }
  if (state.mode === "bitrate") {
    renderCrates();
    paintDualChrome();
    return;
  }
  if (state.mode === "tags") {
    paintDualChrome();
    return;
  }
  renderColumns();
  const view = buildView();
  if (state.mode === "crates" && state.splitCrates) {
    el("count").textContent = t("count.split", {
      a: t("count.tracks", { count: view.length }),
      b: t("count.tracks", { count: state.viewB.length }),
    });
  } else {
    el("count").textContent = t(state.mode === "history" ? "count.plays" : "count.tracks", { count: view.length });
  }
  if (state.mode === "crates") renderCrates();
  else document.querySelector(".rules")?.remove();
  paintDualChrome();
  paintRows();
  if (!view.some((track) => track.id === state.selectedId)) {
    if (!view.length) {
      state.selectedId = null;
      if (state.mode === "history") {
        const empty = document.createElement("p");
        empty.className = "detail-empty";
        empty.textContent = !state.historyId ? t("history.chooseSession") : t("list.noMatches");
        clearDetailIslands();
        el("detail").replaceChildren(empty);
      } else {
        setTrackDetail({
          kind: "empty",
          message: t("list.noMatches"),
        });
        paintDetailIsland();
      }
    } else if (state.mode === "history") selectEntry(view[0]!.id);
    else selectTrack(view[0]!.id);
  }
}

/**
 * Expand or collapse a crate and save that flag when edits are allowed.
 *
 * A crate search forces every match open, so the twist does nothing then.
 * The POST goes to /api/crate with action expanded. A 409 means Serato
 * took the lock and the page stops offering writes.
 *
 * @param {number|string} id Crate id.
 * @returns {void}
 */
export function toggleCrate(id: number | "all") {
  if (state.crateQuery) return;
  if (state.expanded.has(id)) state.expanded.delete(id);
  else state.expanded.add(id);
  renderCrates();
  if (!state.writable) return;
  postJSON("/api/crate", {
    action: "expanded",
    id,
    expanded: state.expanded.has(id),
    space: state.space,
  }).then((result) => {
    if (result.warning) setNotice(result.warning);
  }).catch((error) => {
    if (failureOf(error).status === 409) lockDown(error);
    else setNotice(failureOf(error).message);
  });
}

/**
 * Show one crate, or all tracks, and scroll the list to the top.
 *
 * Opens ancestor crates so the selection is visible. Does not write the
 * database; membership changes go through the detail pane.
 *
 * @param {number|string} id Crate id, or "all".
 * @param {MouseEvent} [event] Click that chose the crate. Alt or Shift fills the other pane.
 * @returns {void}
 */
export function selectCrate(id: number | "all", event?: MouseEvent) {
  const alt = Boolean(event?.altKey || event?.shiftKey);
  const pane = clickPane(state.splitCrates && state.mode === "crates", state.focusedPane, alt);
  if (pane === "b") state.secondCrate = id;
  else state.activeCrate = id;
  if (!alt && state.splitCrates && state.mode === "crates") state.focusedPane = pane;
  if (id !== "all") expandAncestors(id);
  const list = pane === "b" ? el("list-b") : el("list");
  list.scrollTop = 0;
  renderList();
  if (state.mode === "gig") loadGigCheck().catch(showGigFailure);
  if (state.mode === "drift") loadDrift().catch(showDriftFailure);
  if (state.mode === "health") loadHealth().catch(showHealthFailure);
  if (state.mode === "scan") loadScan().catch(showScanFailure);
  if (state.mode === "bitrate") loadBitrate().catch(showBitrateFailure);
}

/**
 * Move the roving tabindex and DOM focus to one crate button.
 *
 * Used by the rail's arrow keys. Does nothing when item is missing.
 *
 * @param {HTMLElement|undefined|null} item Crate button to focus.
 * @returns {void}
 */
export function focusCrateItem(item: HTMLElement | undefined) {
  if (!item) return;
  for (const button of el("crate-list").querySelectorAll<HTMLButtonElement>(".crate")) button.tabIndex = -1;
  item.tabIndex = 0;
  item.focus();
}

/**
 * Load one track's detail and ignore a response that lost the race.
 *
 * Increments state.request so a slow reply cannot overwrite a newer
 * selection. GET /api/track reads the row, its crates, and the cue tags.
 * The list selection is painted immediately.
 *
 * @param {number} id Asset id.
 * @returns {Promise<void>}
 */
export async function selectTrack(id: number) {
  state.selectedId = id;
  syncMergeButton();
  syncRelinkButton();
  paintRows();
  const token = ++state.request;
  setTrackDetail({ kind: "reading" });
  paintDetailIsland();
  try {
    const response = await fetch(`/api/track?id=${id}&space=${encodeURIComponent(state.space)}`);
    const payload = await readJSONOr<Track & ErrorBody>(response, {} as Track & ErrorBody);
    if (!response.ok) throw new Error(serverMessage(payload, t("detail.readFailed", { status: String(response.status) })));
    if (token !== state.request) return;
    if (payload.serato) applyStatus(payload.serato);
    setTrackDetail({ kind: "track", track: payload });
    paintDetailIsland();
  } catch (error) {
    if (token !== state.request) return;
    setTrackDetail({ kind: "error", message: failureOf(error).message });
    paintDetailIsland();
  }
}

/**
 * Show one history entry in the detail pane.
 *
 * History entries are already loaded with the session, so this does not
 * fetch. An entry that still has an asset id can be opened in the library.
 *
 * @param {number} id History entry id.
 * @returns {void}
 */
export function selectEntry(id: number) {
  state.selectedId = id;
  paintRows();
  notifyHistory();
  if (!state.entries.some((item) => item.id === id)) return;
  const host = el("detail");
  detailRoot?.unmount();
  detailRoot = null;
  detailPlayRoot?.unmount();
  detailPlayRoot = null;
  historyDetailRoot = remountIsland(host, createElement(HistoryDetail), {
    host: historyDetailHost,
    root: historyDetailRoot,
  });
  historyDetailHost = host;
}

/**
 * Build one labeled editor control for a track field.
 *
 * Comments use a textarea. BPM asks for a decimal keyboard. The control
 * name matches the field save_track accepts. Nothing is saved until the
 * form is submitted.
 *
 * @param {string} name Field name.
 * @param {string} label Visible label.
 * @param {string|number|null|undefined} value Current value.
 * @param {boolean} [wide=false] True when the control spans the pane.
 * @returns {HTMLLabelElement} The labeled control.
 */
function fieldInput(name: string, label: string, value: string | number | null | undefined, wide: boolean = false) {
  const wrap = document.createElement("label");
  if (wide) wrap.className = "wide";
  wrap.append(document.createTextNode(label));
  const input = name === "comments"
    ? textareaEl(editField(label))
    : inputEl(editField(label));
  input.name = name;
  input.value = String(value ?? "");
  if (name === "bpm") input.inputMode = "decimal";
  wrap.append(input);
  return wrap;
}

/**
 * Fill the detail pane from a /api/track payload.
 *
 * The form edits the fields save_track accepts. Controls stay disabled
 * while the library is locked. Reveal, Prepare, relocate, and remove call
 * the matching POST routes. Related tracks load from /api/related. Cue
 * data is shown and is not written back.
 *
 * @param {object} track Payload from GET /api/track.
 * @returns {void}
 */
function renderDetail(track: Track) {
  lastDetail = track;
  const writable = Boolean(track.serato?.writable && state.writable);
  const body = document.createElement("div");
  body.className = "detail-body";

  if (track.album) {
    const kicker = document.createElement("p");
    kicker.className = "detail-kicker";
    kicker.textContent = track.album;
    body.append(kicker);
  }
  const title = document.createElement("h2");
  title.textContent = track.title ?? "";
  body.append(title);
  if (track.artist) {
    const artist = document.createElement("p");
    artist.className = "artist";
    artist.textContent = track.artist ?? "";
    body.append(artist);
  }

  const playTitle = track.title || track.name || playerStrings.untitled;
  clearDetailIslands();
  const playHost = document.createElement("span");
  detailPlayRoot = mountIsland(playHost, createElement(PlayButton, {
    variant: "detail",
    trackId: track.id,
    name: playTitle,
  }));
  body.append(playHost);

  const deck = document.createElement("div");
  deck.className = "deck";
  const facts: Array<[MessageKey, string | number | null | undefined]> = [["column.bpm", track.bpm], ["column.key", track.key || "—"], ["column.time", track.length]];
  for (const [key, value] of facts) {
    const label = t(key);
    const cell = document.createElement("div");
    const strong = document.createElement("strong");
    strong.textContent = String(value || "—");
    if (key === "column.bpm") strong.className = "bpm";
    const span = document.createElement("span");
    span.textContent = label;
    cell.append(strong, span);
    deck.append(cell);
  }
  if (track.color) {
    const cell = document.createElement("div");
    const swatch = document.createElement("span");
    swatch.className = "swatch swatch-lg";
    swatch.style.background = String(track.color ?? "");
    const span = document.createElement("span");
    span.textContent = t("field.color");
    cell.append(swatch, span);
    deck.append(cell);
  }
  body.append(deck);

  const note = document.createElement("p");
  note.className = "lock-note";
  note.textContent = track.serato?.message || el("status").textContent;
  body.append(note);

  const form = document.createElement("form");
  form.className = "editor";
  const edit = track.edit || {};
  const editorFields: Array<[string, MessageKey, boolean]> = [
    ["name", "column.title", true],
    ["artist", "column.artist", false],
    ["album", "field.album", false],
    ["genre", "field.genre", false],
    ["year", "field.year", false],
    ["composer", "field.composer", false],
    ["remixer", "field.remixer", false],
    ["label", "field.label", false],
    ["grouping", "field.grouping", false],
    ["key", "column.key", false],
    ["bpm", "column.bpm", false],
    ["emoji", "field.emoji", false],
    ["comments", "field.comments", true],
  ];
  for (const [name, label, wide] of editorFields) {
    form.append(fieldInput(name, t(label), String(edit[name] ?? ""), wide));
  }

  const colorLabel = document.createElement("label");
  colorLabel.append(document.createTextNode(t("field.color")));
  const colorSelect = selectEl(tips.trackColor);
  colorSelect.name = "color";
  const currentColor = Number(edit.color ?? 0xffffff);
  const palette: Array<[number, string]> = COLORS.map(([value, key]) => [value, t(key)]);
  if (!COLORS.some(([value]) => value === currentColor)) palette.push([currentColor, colorHex(currentColor) || t("color.custom")]);
  for (const [value, label] of palette) {
    const option = document.createElement("option");
    option.value = String(value);
    option.textContent = label;
    option.selected = value === currentColor;
    colorSelect.append(option);
  }
  colorLabel.append(colorSelect);
  form.append(colorLabel);

  const ratingLabel = document.createElement("label");
  ratingLabel.append(document.createTextNode(t("field.rating")));
  const ratingSelect = selectEl(tips.trackRating);
  ratingSelect.name = "rating";
  const ratings: Array<[string, string]> = [
    ["", t("rating.none")],
    ...([["0.2", 1], ["0.4", 2], ["0.6", 3], ["0.8", 4], ["1", 5]] as const).map(([value, stars]): [string, string] => [value, t("rating.stars", { count: stars })]),
  ];
  if (edit.rating != null && !ratings.some(([value]) => Number(value) === Number(edit.rating))) {
    ratings.push([String(edit.rating), `${edit.rating}`]);
  }
  for (const [value, label] of ratings) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label ?? "";
    option.selected = value === (edit.rating == null ? "" : String(edit.rating));
    ratingSelect.append(option);
  }
  ratingLabel.append(ratingSelect);
  form.append(ratingLabel);

  const lock = document.createElement("label");
  lock.className = "check";
  const lockInput = inputEl(tips.beatgridLock);
  lockInput.type = "checkbox";
  lockInput.name = "is_beatgrid_locked";
  lockInput.checked = Boolean(edit.is_beatgrid_locked);
  lock.append(lockInput, document.createTextNode(t("field.beatgridLocked")));
  form.append(lock);

  const save = buttonEl(tips.saveTrack);
  save.type = "submit";
  save.className = "text-button wide";
  save.textContent = t("detail.saveTrack");
  form.append(save);
  for (const control of form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement>("input, select, textarea, button")) control.disabled = !writable;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveTrackFromForm(track.id, form);
  });
  body.append(form);

  const actions = document.createElement("div");
  actions.className = "actions";
  const reveal = buttonEl(revealTip(track.serato?.file_manager || state.serato?.file_manager || "Finder"));
  const manager = track.serato?.file_manager || state.serato?.file_manager || "Finder";
  reveal.textContent = t("detail.reveal", { manager });
  reveal.disabled = !track.file_on_disk;
  reveal.addEventListener("click", () => revealTrack(track.id));
  const prepare = buttonEl(track.in_prepare ? tips.prepareRemove : tips.prepareAdd);
  prepare.textContent = track.in_prepare ? t("detail.removePrepare") : t("detail.sendPrepare");
  prepare.disabled = !writable;
  prepare.addEventListener("click", () => prepareTrack(track.id, !track.in_prepare));
  const relocate = buttonEl(tips.relocate);
  relocate.textContent = t("detail.relocate");
  relocate.disabled = !writable;
  relocate.addEventListener("click", () => relocateTrack(track));
  const remove = buttonEl(tips.removeTrack);
  remove.textContent = t("detail.removeFromLibrary");
  remove.disabled = !writable;
  remove.addEventListener("click", () => removeTrack(track.id));
  const useInCrates = buttonEl(tips.useInCrates);
  useInCrates.textContent = t("detail.useInCrates");
  useInCrates.disabled = !writable;
  useInCrates.addEventListener("click", () => {
    bridge.openReplaceInCratesDialog(track.id).catch((error) => setNotice(failureOf(error).message));
  });
  actions.append(reveal, prepare, relocate, remove, useInCrates);
  if (state.mode === "duplicates" && selectedDuplicateGroup()) {
    const merge = buttonEl(tips.mergeDuplicates);
    merge.textContent = t("merge.title");
    merge.disabled = !writable;
    merge.addEventListener("click", () => {
      bridge.openMergeDialog().catch((error) => setNotice(failureOf(error).message));
    });
    actions.append(merge);
  }
  body.append(actions);

  body.append(relatedSection(track, writable));
  body.append(markerSection(track));
  if (track.copies?.length) body.append(copySection(track.id, track.copies, writable));
  body.append(membershipSection(track, writable));

  for (const group of track.groups || []) {
    const section = document.createElement("section");
    section.className = "group";
    const heading = document.createElement("h3");
    heading.textContent = group.name ?? "";
    section.append(heading);
    const open = group.name !== "Search copies";
    if (!open) {
      const toggle = buttonEl(tips.showSearchCopies);
      toggle.className = "text-button";
      toggle.textContent = t("detail.searchCopies", { count: group.fields.length });
      let shown = false;
      section.hidden = true;
      toggle.addEventListener("click", () => {
        shown = !shown;
        section.hidden = !shown;
        toggle.textContent = shown ? t("detail.hideSearchCopies") : t("detail.searchCopies", { count: group.fields.length });
        setTooltip(toggle, shown ? tips.hideSearchCopies : tips.showSearchCopies);
      });
      body.append(toggle);
    }
    for (const field of group.fields) {
      const row = document.createElement("div");
      row.className = "field";
      const label = document.createElement("div");
      label.className = "label";
      label.textContent = field.label ?? "";
      const column = document.createElement("span");
      column.className = "column";
      column.textContent = field.column ?? "";
      label.append(column);
      const value = document.createElement("div");
      value.className = "value";
      if (field.column === "color" && field.display.startsWith("#")) {
        const wrap = document.createElement("span");
        wrap.className = "color-value";
        const swatch = document.createElement("span");
        swatch.className = "swatch";
        swatch.style.background = field.display;
        wrap.append(swatch, document.createTextNode(field.display));
        value.append(wrap);
      } else {
        value.textContent = field.display;
      }
      row.append(label, value);
      section.append(row);
    }
    body.append(section);
  }
  el("detail").replaceChildren(body);
}

/**
 * Build the cue, loop, flip, and beatgrid section.
 *
 * The copy says the markers were read from the audio file and are not
 * written back. Pads 1–8 always show, in Serato colours, when the file
 * could be read. A missing file is explained instead of showing empty
 * pads. The beatgrid block says it is view-only and flags a grid this
 * parser cannot read. Does not fetch.
 *
 * @param {object} track Track payload including cues, loops, flips, and beatgrid.
 * @returns {HTMLElement} The section, not yet inserted.
 */
function markerSection(track: Track) {
  const section = document.createElement("section");
  section.className = "group";
  const heading = document.createElement("h3");
  heading.textContent = t("markers.heading");
  section.append(heading);
  const note = document.createElement("p");
  note.className = "detail-kicker";
  if (track.markers_unavailable) note.textContent = t("markers.unavailable");
  else if (!track.markers_found) note.textContent = t("markers.none");
  else note.textContent = t("markers.readOnly");
  section.append(note);
  /**
   * Format a loop time as m:ss.sss.
   *
   * Nested in markerSection. Three decimal places keep a loop distinguishable
   * inside one second. Cue rows use `formatCueTime` in cue-view.ts.
   *
   * @param {number|string} value Time in milliseconds.
   * @returns {string} Minutes, seconds, and milliseconds.
   */
  const ms = (value: number | string | null | undefined) => formatCueTime(value);
  if (!track.markers_unavailable) appendCueSlots(section, track.cues || []);
  for (const loop of track.loops || []) {
    const row = document.createElement("div");
    row.className = "marker";
    const swatch = document.createElement("span");
    swatch.className = "swatch";
    if (loop.color) swatch.style.background = loop.color;
    const time = document.createElement("span");
    time.textContent = `${ms(loop.start_ms)}–${ms(loop.end_ms)}`;
    const name = document.createElement("span");
    name.textContent = loop.name || t(loop.locked ? "markers.loopLocked" : "markers.loop", { number: (loop.index as number) + 1 });
    row.append(document.createElement("span"), swatch, time, name);
    section.append(row);
  }
  for (const flip of track.flips || []) {
    const row = document.createElement("div");
    row.className = "marker";
    const time = document.createElement("span");
    time.textContent = flip.enabled ? t("common.on") : t("common.off");
    const name = document.createElement("span");
    name.textContent = flip.name || t("markers.flip", { number: (flip.index as number) + 1 });
    row.append(document.createElement("span"), document.createElement("span"), time, name);
    section.append(row);
  }
  appendBeatgrid(section, track);
  return section;
}

/**
 * List other copies of this track and let a click select one.
 *
 * Copies share title, artist, and whole-second length. Selecting one
 * calls selectTrack, which fetches that asset. This builder only creates
 * the nodes.
 *
 * @param {number} fromId Open track whose crates the replacement should join.
 * @param {object[]} copies Copy summaries from the track payload.
 * @param {boolean} writable False disables Use in crates.
 * @returns {HTMLElement} The section.
 */
function copySection(fromId: number, copies: CopyRow[], writable: boolean) {
  const section = document.createElement("section");
  section.className = "group";
  const heading = document.createElement("h3");
  heading.textContent = t("copies.heading");
  section.append(heading);
  for (const copy of copies) {
    const row = document.createElement("div");
    row.className = "copy-row";
    const button = buttonEl(openCopy(copy.file || `Track ${copy.id}`));
    button.className = "text-button";
    button.textContent = copy.file || t("track.numbered", { id: String(copy.id) });
    button.addEventListener("click", () => selectTrack(copy.id as number));
    const rate = document.createElement("span");
    rate.textContent = copy.bitrate == null ? "" : String(copy.bitrate);
    const plays = document.createElement("span");
    plays.textContent = copy.play_count == null ? "" : String(copy.play_count);
    const crates = document.createElement("span");
    crates.textContent = copy.missing ? "missing" : (copy.crates || "");
    const replace = buttonEl(openReplaceCopy(copy.file || `Track ${copy.id}`));
    replace.className = "text-button";
    replace.textContent = t("copies.useInCrates");
    replace.disabled = !writable;
    replace.addEventListener("click", () => {
      bridge.openReplaceInCratesDialog(fromId, copy.id as number).catch((error) => setNotice(failureOf(error).message));
    });
    row.append(button, rate, plays, crates, replace);
    section.append(row);
  }
  return section;
}

/**
 * Build the related-tracks section and start its request.
 *
 * The section lists saved links, a search box that links another track,
 * and suggestions. Saving a link writes the sidecar file and does not
 * require Serato to be quit. The Serato crate button does. Text from the
 * server is assigned with textContent.
 *
 * @param {object} track Track payload from GET /api/track.
 * @param {boolean} writable False disables the Serato crate button.
 * @returns {HTMLElement} The section, with a loading line until the reply arrives.
 */
function relatedSection(track: Track, writable: boolean) {
  const section = document.createElement("section");
  section.className = "group";
  section.dataset.trackId = String(track.id);
  const heading = document.createElement("h3");
  heading.id = `related-heading-${track.id}`;
  heading.textContent = t("related.heading");
  section.setAttribute("aria-labelledby", heading.id);
  section.setAttribute("aria-busy", "true");
  const status = document.createElement("p");
  status.className = "detail-kicker";
  status.setAttribute("role", "status");
  const path = track.resolved_path || track.edit?.portable_id || "";
  status.textContent = path ? t("related.loading") : t("related.noPath");
  section.append(heading, status);
  if (path) loadRelated(track, section, writable, "");
  return section;
}

/**
 * Fetch related tracks for the open track.
 *
 * GET /api/related uses the resolved path. A reply for an older selection
 * is ignored. Does not write the Serato library.
 *
 * @param {object} track Track payload.
 * @param {HTMLElement} section Section built by relatedSection.
 * @param {boolean} writable False disables the Serato crate button.
 * @param {string} query Search text to keep after a refresh.
 * @returns {Promise<void>}
 */
async function loadRelated(track: Track, section: HTMLElement, writable: boolean, query: string) {
  const token = ++relatedRequest;
  const path = track.resolved_path || track.edit?.portable_id || "";
  const params = new URLSearchParams({ path, space: state.space });
  try {
    const response = await fetch(`/api/related?${params}`);
    const payload = await readJSONOr<RelatedPayload>(response, {});
    if (token !== relatedRequest || !section.isConnected) return;
    if (!response.ok) throw new Error(serverMessage(payload, t("related.loadFailed")));
    renderRelated(track, section, writable, payload, query);
  } catch (error) {
    if (token !== relatedRequest || !section.isConnected) return;
    section.setAttribute("aria-busy", "false");
    const status = section.querySelector("[role=status]");
    if (status) status.textContent = failureOf(error).message;
  }
}

/**
 * Paint saved links, the link form, and suggestions.
 *
 * Replaces the section body except the heading. Notes and titles are
 * text, not HTML. Does not fetch.
 *
 * @param {object} track Open track.
 * @param {HTMLElement} section Related section.
 * @param {boolean} writable False disables the Serato crate button.
 * @param {object} payload GET /api/related body.
 * @param {string} query Search text to restore.
 * @returns {void}
 */
function renderRelated(track: Track, section: HTMLElement, writable: boolean, payload: RelatedPayload, query: string) {
  const heading = section.querySelector("h3");
  section.replaceChildren(heading!);
  section.setAttribute("aria-busy", "false");
  const saved = Array.isArray(payload.saved) ? payload.saved : [];
  const suggested = Array.isArray(payload.suggested) ? payload.suggested : [];
  const status = document.createElement("p");
  status.className = "detail-kicker";
  status.setAttribute("role", "status");
  status.textContent = saved.length
    ? t("related.savedCount", { count: saved.length })
    : t("related.noneSaved");
  section.append(status);
  if (saved.length) section.append(relatedSavedList(track, section, saved));

  section.append(relatedSearch(track, section, query));

  const suggestHeading = document.createElement("p");
  suggestHeading.className = "detail-kicker";
  suggestHeading.textContent = suggested.length
    ? t("related.suggested")
    : t("related.noSuggestions");
  section.append(suggestHeading);
  if (suggested.length) section.append(relatedSuggestList(track, section, suggested));

  const crate = buttonEl(tips.updateRelated);
  crate.className = "text-button";
  crate.dataset.relatedCrate = "true";
  const crateName = payload.crate_name || "Related";
  crate.textContent = t("related.updateCrate");
  crate.disabled = !writable;
  crate.addEventListener("click", () => refreshRelatedCrate(track, section));
  const crateNote = document.createElement("p");
  crateNote.className = "detail-kicker";
  crateNote.textContent = writable
    ? t("related.crateNote", { name: crateName })
    : t("related.quitSerato");
  section.append(crate, crateNote);
}

/**
 * List saved links with a remove button.
 *
 * A track that is still in the library opens when its name is clicked.
 * Does not fetch until the user removes a link.
 *
 * @param {object} track Open track.
 * @param {HTMLElement} section Related section.
 * @param {object[]} saved Saved link objects.
 * @returns {HTMLElement} The list.
 */
function relatedSavedList(track: Track, section: HTMLElement, saved: RelatedTrack[]) {
  const list = document.createElement("ul");
  list.className = "related-list";
  for (const link of saved) {
    const item = document.createElement("li");
    item.className = "related-row";
    const main = document.createElement("div");
    const other = link.track || {};
    const label = other.title || t("track.untitled");
    if (other.asset_id != null && other.in_library) {
      const open = buttonEl(openRelated(label));
      open.className = "text-button";
      open.textContent = label;
      open.addEventListener("click", () => selectTrack(other.asset_id as number));
      main.append(open);
    } else {
      const name = document.createElement("span");
      name.textContent = label;
      main.append(name);
    }
    const meta = document.createElement("p");
    meta.className = "related-meta";
    const bits = [];
    if (other.artist) bits.push(other.artist);
    if (other.key) bits.push(other.key);
    if (other.bpm != null && other.bpm !== "") bits.push(t("markers.bpm", { bpm: String(other.bpm) }));
    bits.push(link.mutual ? t("related.twoWay") : t("related.oneWay"));
    if (link.rating != null) bits.push(t("related.ratingOutOf", { rating: String(link.rating) }));
    if (!other.in_library) bits.push(t("related.notInLibrary"));
    meta.textContent = bits.join(" · ");
    main.append(meta);
    if (link.note) {
      const note = document.createElement("p");
      note.className = "related-note";
      note.textContent = link.note;
      main.append(note);
    }
    const remove = buttonEl(removeRelatedTip(label));
    remove.className = "text-button";
    remove.textContent = t("common.remove");
    remove.setAttribute("aria-label", t("related.removeLink", { name: label }));
    remove.addEventListener("click", () => removeRelated(track, section, link));
    item.append(main, remove);
    list.append(item);
  }
  return list;
}

/**
 * Build the search box used to link another track.
 *
 * Matches the tracks already loaded in this space. Choosing one reveals
 * the note, rating, and two-way controls. Does not fetch.
 *
 * @param {object} track Open track.
 * @param {HTMLElement} section Related section.
 * @param {string} query Current search text.
 * @returns {HTMLElement} The search block.
 */
function relatedSearch(track: Track, section: HTMLElement, query: string) {
  const block = document.createElement("div");
  block.className = "related-search";
  const label = document.createElement("label");
  label.append(document.createTextNode(t("related.find")));
  const input = inputEl(tips.findRelated);
  input.type = "search";
  input.autocomplete = "off";
  input.placeholder = t("related.findPlaceholder");
  input.value = query || "";
  label.append(input);
  const results = document.createElement("ul");
  results.className = "related-results";
  const form = document.createElement("div");
  form.className = "related-form";
  form.hidden = true;
  block.append(label, results, form);

  /**
   * Show matches for the current search text.
   *
   * Nested in relatedSearch. An empty box explains what to type. Does
   * not fetch.
   *
   * @returns {void}
   */
  const paint = () => {
    results.replaceChildren();
    form.hidden = true;
    form.replaceChildren();
    const query = parseQuery(input.value);
    if (!query.terms.length && !query.filters.length) {
      const hint = document.createElement("li");
      hint.className = "related-meta";
      hint.textContent = t("related.typeHint");
      results.append(hint);
      return;
    }
    const hits = state.tracks
      .filter((item) => item.id !== track.id && matchesQuery(item, query))
      .slice(0, 8);
    if (!hits.length) {
      const empty = document.createElement("li");
      empty.className = "related-meta";
      empty.textContent = t("list.noMatches");
      results.append(empty);
      return;
    }
    for (const hit of hits) {
      const item = document.createElement("li");
      const name = hit.artist ? `${hit.name || t("track.untitled")} · ${hit.artist}` : (hit.name || t("track.untitled"));
      const choose = buttonEl(chooseRelated(name));
      choose.className = "text-button";
      choose.textContent = hit.artist ? `${hit.name || t("track.untitled")} · ${hit.artist}` : (hit.name || t("track.untitled"));
      choose.addEventListener("click", () => relatedLinkForm(track, section, form, hit, input.value));
      item.append(choose);
      results.append(item);
    }
  };
  input.addEventListener("input", paint);
  paint();
  return block;
}

/**
 * Show the note, rating, and direction controls for one chosen track.
 *
 * Save posts /api/related. The default direction is two-way. Does not
 * fetch until Save is clicked.
 *
 * @param {object} track Open track.
 * @param {HTMLElement} section Related section.
 * @param {HTMLElement} form Form container inside the search block.
 * @param {object} hit Track from the library list.
 * @param {string} query Search text to restore after a save.
 * @returns {void}
 */
function relatedLinkForm(track: Track, section: HTMLElement, form: HTMLElement, hit: RelatedTrack, query: string) {
  form.hidden = false;
  form.replaceChildren();
  const chosen = document.createElement("p");
  chosen.className = "related-meta";
  chosen.textContent = hit.artist ? `${hit.name || t("track.untitled")} · ${hit.artist}` : (hit.name || t("track.untitled"));
  const noteLabel = document.createElement("label");
  noteLabel.append(document.createTextNode(t("related.note")));
  const note = inputEl(tips.linkNote);
  note.type = "text";
  note.maxLength = 500;
  note.placeholder = t("related.notePlaceholder");
  noteLabel.append(note);
  const ratingLabel = document.createElement("label");
  ratingLabel.append(document.createTextNode(t("related.linkRating")));
  const rating = selectEl(tips.linkRating);
  for (const [value, text] of [["", t("rating.none")], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"]] as Array<[string, string]>) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = text;
    rating.append(option);
  }
  ratingLabel.append(rating);
  const mutualLabel = document.createElement("label");
  mutualLabel.className = "check";
  const mutual = inputEl(tips.linkMutual);
  mutual.type = "checkbox";
  mutual.checked = true;
  mutualLabel.append(mutual, document.createTextNode(t("related.twoWayLink")));
  const save = buttonEl(tips.saveLink);
  save.className = "text-button";
  save.textContent = t("related.saveLink");
  save.addEventListener("click", () => {
    save.disabled = true;
    saveRelated(track, section, {
      action: "add",
      asset: track.id,
      target: hit.id,
      mutual: mutual.checked,
      note: note.value,
      rating: rating.value === "" ? null : Number(rating.value),
      space: state.space,
    }, query);
  });
  form.append(chosen, noteLabel, ratingLabel, mutualLabel, save);
}

/**
 * List suggestions with a one-click save.
 *
 * Each Save posts a two-way link with no note and no rating. Does not
 * fetch until Save is clicked.
 *
 * @param {object} track Open track.
 * @param {HTMLElement} section Related section.
 * @param {object[]} suggested Suggestion objects.
 * @returns {HTMLElement} The list.
 */
function relatedSuggestList(track: Track, section: HTMLElement, suggested: RelatedTrack[]) {
  const list = document.createElement("ul");
  list.className = "related-list";
  for (const item of suggested) {
    const row = document.createElement("li");
    row.className = "related-row";
    const main = document.createElement("div");
    const name = document.createElement("span");
    name.textContent = item.artist ? `${item.title || t("track.untitled")} · ${item.artist}` : (item.title || t("track.untitled"));
    const reasons = document.createElement("p");
    reasons.className = "related-meta";
    reasons.textContent = Array.isArray(item.reasons) ? item.reasons.join(" · ") : "";
    main.append(name, reasons);
    const save = buttonEl(saveSuggestion(item.title || "Untitled"));
    save.className = "text-button";
    save.textContent = t("common.save");
    save.setAttribute("aria-label", t("related.saveLinkTo", { name: item.title || t("track.untitled") }));
    save.addEventListener("click", () => {
      save.disabled = true;
      saveRelated(track, section, {
        action: "add",
        asset: track.id,
        target: item.asset_id,
        mutual: true,
        note: "",
        rating: null,
        space: state.space,
      }, "");
    });
    row.append(main, save);
    list.append(row);
  }
  return list;
}

/**
 * POST a new related-track link and reload the section.
 *
 * The body is the add action. A failure stays in the section status and
 * the notice. Titles and paths are not added to the request beyond the
 * asset ids the server already knows.
 *
 * @param {object} track Open track.
 * @param {HTMLElement} section Related section.
 * @param {object} body POST /api/related body.
 * @param {string} query Search text to restore.
 * @returns {Promise<void>}
 */
async function saveRelated(track: Track, section: HTMLElement, body: Record<string, unknown>, query: string) {
  try {
    await postJSON("/api/related", body);
    setNotice(t("related.saved"));
    const kept = section.querySelector<HTMLInputElement>(".related-search input");
    await loadRelated(track, section, Boolean(track.serato?.writable && state.writable), kept ? kept.value : query);
  } catch (error) {
    if (failureOf(error).status === 409) lockDown(error);
    else setNotice(failureOf(error).message);
    const status = section.querySelector("[role=status]");
    if (status) status.textContent = failureOf(error).message;
  }
}

/**
 * Remove one saved link after a confirmation.
 *
 * POST /api/related with action remove. The audio file and the Serato
 * library are not changed.
 *
 * @param {object} track Open track.
 * @param {HTMLElement} section Related section.
 * @param {object} link Saved link, including its id and track title.
 * @returns {Promise<void>}
 */
async function removeRelated(track: Track, section: HTMLElement, link: RelatedTrack) {
  const label = link.track?.title || t("related.thisTrack");
  if (!(await openConfirm({
    title: t("common.remove"),
    message: t("related.confirmRemove", { name: label }),
    confirmLabel: t("common.remove"),
  }))) return;
  try {
    await postJSON("/api/related", { action: "remove", id: link.id });
    setNotice(t("related.removed"));
    const kept = section.querySelector<HTMLInputElement>(".related-search input");
    await loadRelated(track, section, Boolean(track.serato?.writable && state.writable), kept ? kept.value : "");
  } catch (error) {
    setNotice(failureOf(error).message);
  }
}

/**
 * Create or refresh the Serato crate for this track's saved links.
 *
 * POST /api/related with action crate. Serato must be quit. A 409 locks
 * the page the same way other library writes do.
 *
 * @param {object} track Open track.
 * @param {HTMLElement} section Related section.
 * @returns {Promise<void>}
 */
async function refreshRelatedCrate(track: Track, section: HTMLElement) {
  const button = section.querySelector<HTMLButtonElement>("[data-related-crate]");
  if (button) button.disabled = true;
  try {
    const result = await postJSON("/api/related", { action: "crate", asset: track.id, space: state.space });
    setNotice(result.warning || t("related.crateUpdated", { name: String(result.name ?? "") }));
    await loadLibrary();
    selectTrack(track.id);
  } catch (error) {
    if (failureOf(error).status === 409) {
      lockDown(error);
      if (button) button.disabled = true;
    } else {
      setNotice(failureOf(error).message);
      if (button) button.disabled = !state.writable;
    }
  }
}

/**
 * List normal crates as checkboxes and name the smart crates.
 *
 * Checking a box posts an add or remove. Smart crates are shown but not
 * edited here because their membership comes from rules. The list is
 * built from state.crates, not from a new request.
 *
 * @param {object} track Track payload with crate_ids.
 * @param {boolean} writable False disables every checkbox.
 * @returns {HTMLElement} The section.
 */
function membershipSection(track: Track, writable: boolean) {
  const section = document.createElement("section");
  section.className = "group";
  const heading = document.createElement("h3");
  heading.textContent = t("crates.heading");
  section.append(heading);
  const holder = document.createElement("div");
  holder.className = "member-list";
  const chosen = new Set(track.crate_ids || []);
  const crates = [...state.crates].filter((crate) => !crate.smart).sort((a, b) => a.name.localeCompare(b.name));
  for (const crate of crates) {
    const label = document.createElement("label");
    label.className = "member";
    const input = inputEl(membershipTip(crate.name));
    input.type = "checkbox";
    input.checked = chosen.has(crate.id);
    input.disabled = !writable;
    input.addEventListener("change", () => setMembership(track.id, crate.id, input.checked, input));
    const name = document.createElement("span");
    name.textContent = crate.name;
    label.append(input, name);
    holder.append(label);
  }
  const smart = state.crates.filter((crate) => crate.smart && chosen.has(crate.id));
  if (smart.length) {
    const line = document.createElement("p");
    line.className = "detail-kicker";
    line.textContent = t("crates.smartList", { names: smart.map((crate) => crate.name).join(", ") });
    section.append(line);
  }
  section.append(holder);
  return section;
}

/**
 * Paint the library screen again in the active language.
 *
 * Repaints the shell, list headers, crates, rows, files, history
 * sessions, and the open detail pane from what the page already has.
 * The library is not fetched again. The related-tracks list in the
 * detail pane is read again from GET /api/related.
 *
 * @returns {void}
 */
export function repaintViews(): void {
  // The static markup pass resets the status line, so put the server's back.
  if (state.serato) el("status").textContent = statusLine(state.serato);
  paintGeneration(state.serato);
  renderList();
  if (state.mode === "history") {
    renderSessions();
    if (state.selectedId != null) selectEntry(state.selectedId);
    return;
  }
  if (detailRoot) paintDetailIsland();
}

/**
 * Show or hide the notice line above the track list.
 *
 * An empty string hides it. Used for save warnings and request errors.
 * Does not change the library.
 *
 * @param {string} text Notice text.
 * @returns {void}
 */
export function setNotice(text: string) {
  el("notice").textContent = text || "";
  el("notice").hidden = !text;
}

/**
 * Store the lock status and refresh the controls that depend on it.
 *
 * state.writable gates every edit. The status line repeats the server's
 * message, including which file manager Reveal will use.
 *
 * @param {object|null|undefined} info Status payload from /api/status or a library response.
 * @returns {void}
 */
/**
 * The rail status line, in the active language.
 *
 * A notice with a code is translated. `params` fill its placeholders, so
 * the unknown Serato version names the build in Spanish and in the
 * pseudo-locale. A sentence without a code stays as the server sent it.
 *
 * @param info Status payload. Null before the server answers.
 * @returns The text for `#status`.
 */
export function statusLine(info: SeratoStatus | null | undefined): string {
  if (info?.code) return codedText(info.message || t("status.library"), info.code, messageParams(info.params));
  return info?.message || t("status.library");
}

const GENERATION_LABELS: Record<string, MessageKey> = {
  serato4: "generation.serato4",
  serato5: "generation.serato5",
  legacy: "generation.legacy",
  unknown: "generation.unknown",
};

const GENERATION_REASONS: Record<string, MessageKey> = {
  log: "generation.reason.log",
  version: "generation.reason.version",
  fallback: "generation.reason.fallback",
  unknown: "generation.reason.unknown",
  unmounted: "generation.reason.unmounted",
  downgrade: "generation.reason.downgrade",
  mismatch: "generation.reason.mismatch",
  installed: "generation.reason.installed",
  installUnknown: "generation.reason.installUnknown",
};

/**
 * The short name for the generation button.
 *
 * @param info Status payload. Null before the server answers.
 * @returns The catalog key for the visible label.
 */
function generationKind(info: SeratoStatus | null | undefined): MessageKey {
  const kind = info?.generation?.kind ?? "";
  return GENERATION_LABELS[kind] ?? "generation.checking";
}

/**
 * The sentence under the generation button.
 *
 * @param info Status payload. Null before the server answers.
 * @returns The reason in the active language.
 */
function generationReason(info: SeratoStatus | null | undefined): string {
  const generation = info?.generation;
  const key = GENERATION_REASONS[generation?.reason ?? ""] ?? "generation.reason.pending";
  return t(key, {
    log: generation?.log_name || "",
    version: generation?.version || "",
    newest: generation?.newest_version || "",
    database: generation?.database || "",
  });
}

/**
 * Paint the library-generation button from the status payload.
 *
 * The visible name is the generation. The accessible name adds that it is
 * the library generation, and the tooltip says where that answer came from.
 * Those three strings are not the same. Opening the button shows the reason.
 *
 * @param info Status payload. Null before the server answers.
 * @returns {void}
 */
export function paintGeneration(info: SeratoStatus | null | undefined): void {
  const button = document.getElementById("library-generation");
  if (!(button instanceof HTMLButtonElement)) return;
  const kind = t(generationKind(info));
  button.textContent = kind;
  button.setAttribute("aria-label", t("generation.named", { kind }));
  setTooltip(button, tips.libraryGeneration);
  const note = document.getElementById("library-generation-note");
  if (note) {
    note.textContent = generationReason(info);
    note.hidden = button.getAttribute("aria-expanded") !== "true";
  }
  if (button.dataset.bound === "1") return;
  button.dataset.bound = "1";
  button.addEventListener("click", () => {
    const next = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", next ? "true" : "false");
    const panel = document.getElementById("library-generation-note");
    if (panel) panel.hidden = !next;
  });
}

export function applyStatus(info: SeratoStatus | null | undefined) {
  state.serato = info;
  state.writable = Boolean(info?.writable);
  el("status").textContent = statusLine(info);
  paintGeneration(info);
  renderShell();
}

/**
 * Stop offering writes after Serato takes the database lock.
 *
 * A 409 carries a serato object. The page applies that status and shows
 * the error. Later saves stay disabled until a reload says the lock is gone.
 *
 * @param {Error & {payload?: object, message: string}} error Failed write.
 * @returns {void}
 */
export function lockDown(error: unknown) {
  const failed = failureOf(error);
  applyStatus(failed.payload?.serato || { writable: false, message: failed.message });
  setNotice(failed.message);
}

/**
 * Save the detail form through POST /api/track.
 *
 * Empty BPM is stored as null. A BPM that is not a number is refused in
 * the page before the request. On success the library is reloaded and the
 * same track is selected again. A 409 locks the page.
 *
 * @param {number} id Asset id.
 * @param {TrackSaveFields} fields Editor values from the React detail pane.
 * @returns {Promise<void>}
 */
async function saveTrack(id: number, fields: TrackSaveFields) {
  if (fields.bpm != null && Number.isNaN(fields.bpm)) {
    setNotice(t("detail.bpmNumber"));
    return;
  }
  try {
    const result = await postJSON("/api/track", { id, space: state.space, fields });
    setNotice(result.warning || t("common.saved"));
    await loadLibrary();
    selectTrack(id);
  } catch (error) {
    if (failureOf(error).status === 409) lockDown(error);
    else setNotice(failureOf(error).message);
  }
}

async function saveTrackFromForm(id: number, form: HTMLFormElement) {
  const data = new FormData(form);
  const bpm = data.get("bpm");
  const fields: TrackSaveFields = {
    name: String(data.get("name") ?? ""),
    artist: String(data.get("artist") ?? ""),
    album: String(data.get("album") ?? ""),
    genre: String(data.get("genre") ?? ""),
    year: String(data.get("year") ?? ""),
    composer: String(data.get("composer") ?? ""),
    remixer: String(data.get("remixer") ?? ""),
    label: String(data.get("label") ?? ""),
    grouping: String(data.get("grouping") ?? ""),
    comments: String(data.get("comments") ?? ""),
    key: String(data.get("key") ?? ""),
    emoji: String(data.get("emoji") ?? ""),
    bpm: bpm === "" ? null : Number(bpm),
    color: Number(data.get("color")),
    rating: data.get("rating") === "" ? null : Number(data.get("rating")),
    is_beatgrid_locked: Boolean(form.querySelector<HTMLInputElement>("[name=is_beatgrid_locked]")?.checked),
  };
  await saveTrack(id, fields);
}

/**
 * Ask the server to show the audio file in the host file manager.
 *
 * POST /api/reveal. The server runs Finder on macOS and File Explorer on
 * Windows. A missing file is reported in the notice. The database is not
 * modified.
 *
 * @param {number} id Asset id.
 * @returns {Promise<void>}
 */
async function revealTrack(id: number) {
  try {
    await postJSON("/api/reveal", { id });
  } catch (error) {
    setNotice(failureOf(error).message);
  }
}

/**
 * Add or remove a track in the Prepare space.
 *
 * POST /api/crate with action prepare. Reloads the library afterwards.
 * A 409 locks the page. The audio file stays where it is.
 *
 * @param {number} id Asset id.
 * @param {boolean} add True adds the track. False removes it from Prepare.
 * @returns {Promise<void>}
 */
async function prepareTrack(id: number, add: boolean) {
  try {
    const result = await postJSON("/api/crate", { action: "prepare", asset: id, add, space: state.space });
    setNotice(result.warning || (add ? t("detail.sentPrepare") : t("detail.removedPrepare")));
    await loadLibrary();
    selectTrack(id);
  } catch (error) {
    if (failureOf(error).status === 409) lockDown(error);
    else setNotice(failureOf(error).message);
  }
}

/**
 * Point a library row at a different audio path.
 *
 * Prompts for a path and posts it as portable_id. The server accepts the
 * path only when that file exists, and it stores a home-relative id when
 * it can. A 409 locks the page.
 *
 * @param {object} track Track payload. The prompt starts from its resolved path.
 * @returns {Promise<void>}
 */
export async function relocateTrack(track: Track) {
  const path = await openCratePrompt({
    title: t("detail.relocate"),
    value: track.resolved_path || track.edit?.portable_id || "",
    confirmLabel: t("detail.relocate"),
    fieldLabel: t("detail.relocatePrompt"),
  });
  if (!path) return;
  try {
    const result = await postJSON("/api/track", {
      id: track.id,
      space: state.space,
      fields: { portable_id: path },
    });
    setNotice(result.warning || t("detail.relocated"));
    await loadLibrary();
    selectTrack(track.id);
  } catch (error) {
    if (failureOf(error).status === 409) lockDown(error);
    else setNotice(failureOf(error).message);
  }
}

/**
 * Remove a track from this space after a confirmation.
 *
 * POST /api/crate with action remove_library. The audio file stays on
 * disk. The selection is cleared and the list reloads. A 409 locks the page.
 *
 * @param {number} id Asset id.
 * @returns {Promise<void>}
 */
export async function removeTrack(id: number) {
  if (!(await openConfirm({
    title: t("detail.removeFromLibrary"),
    message: t("detail.confirmRemove"),
    confirmLabel: t("detail.removeFromLibrary"),
  }))) return;
  try {
    const result = await postJSON("/api/crate", { action: "remove_library", asset: id, space: state.space });
    setNotice(result.warning || t("detail.removed"));
    state.selectedId = null;
    await loadLibrary();
  } catch (error) {
    if (failureOf(error).status === 409) lockDown(error);
    else setNotice(failureOf(error).message);
  }
}

/**
 * Add or remove a track from one crate.
 *
 * POST /api/crate with action add or remove. If the request fails, the
 * checkbox returns to its previous state. A 409 locks the page. The audio
 * file is not moved.
 *
 * @param {number} assetId Asset id.
 * @param {number} crateId Crate id.
 * @param {boolean} add True adds the membership.
 * @param {HTMLInputElement} [input] Checkbox to restore on failure.
 * @returns {Promise<boolean>} True when the membership write succeeded.
 */
async function setMembership(assetId: number, crateId: number, add: boolean, input?: HTMLInputElement): Promise<boolean> {
  try {
    const result = await postJSON("/api/crate", {
      action: add ? "add" : "remove",
      id: crateId,
      asset: assetId,
      space: state.space,
    });
    if (result.warning) setNotice(result.warning);
    await loadLibrary();
    selectTrack(assetId);
    return true;
  } catch (error) {
    if (input) input.checked = !add;
    if (failureOf(error).status === 409) lockDown(error);
    else setNotice(failureOf(error).message);
    return false;
  }
}

/**
 * Save smart-crate rules from the JSON editor.
 *
 * The text must parse as JSON before it is sent. POST /api/crate with
 * action rules. Reloads the library and reselects the crate. A 409 locks
 * the page. Invalid JSON is reported and not sent.
 *
 * @param {number} id Smart crate id.
 * @param {string} text Editor contents.
 * @returns {Promise<void>}
 */
async function saveRules(id: number, text: string) {
  let rules;
  try {
    rules = JSON.parse(text);
  } catch {
    setNotice(t("error.smart_rules_json"));
    return;
  }
  try {
    const result = await postJSON("/api/crate", { action: "rules", id, rules, space: state.space });
    setNotice(result.warning || t("rules.saved"));
    await loadLibrary();
    selectCrate(id);
  } catch (error) {
    if (failureOf(error).status === 409) lockDown(error);
    else setNotice(failureOf(error).message);
  }
}

/**
 * Ask for a name and create a crate under the current selection.
 *
 * All tracks uses the space root as the parent. POST /api/crate with
 * action create. The new crate is selected after the reload. A 409 locks
 * the page.
 *
 * @returns {Promise<void>}
 */
export async function createCrate() {
  mountSharedDialogs();
  const name = await openCratePrompt({
    title: t("crates.newPrompt"),
    value: "",
    confirmLabel: t("crates.new"),
  });
  if (!name || !name.trim()) return;
  const parent = state.activeCrate === "all" ? state.rootId : state.activeCrate;
  try {
    const result = await postJSON("/api/crate", { action: "create", name: name.trim(), parent, space: state.space });
    setNotice(result.warning || t("crates.created"));
    await loadLibrary();
    selectCrate(result.id as number);
  } catch (error) {
    if (failureOf(error).status === 409) lockDown(error);
    else setNotice(failureOf(error).message);
  }
}

/**
 * Ask for a new name and rename the selected crate.
 *
 * An empty name, or the same name, does not send a request. POST /api/crate
 * with action rename. A 409 locks the page.
 *
 * @returns {Promise<void>}
 */
export async function renameCrate() {
  const crate = state.crates.find((item) => item.id === state.activeCrate);
  if (!crate) return;
  mountSharedDialogs();
  const name = await openCratePrompt({
    title: t("crates.renamePrompt"),
    value: crate.name,
    confirmLabel: t("crates.rename"),
  });
  if (!name || !name.trim() || name.trim() === crate.name) return;
  try {
    const result = await postJSON("/api/crate", { action: "rename", id: crate.id, name: name.trim(), space: state.space });
    setNotice(result.warning || t("crates.renamed"));
    await loadLibrary();
    selectCrate(crate.id);
  } catch (error) {
    if (failureOf(error).status === 409) lockDown(error);
    else setNotice(failureOf(error).message);
  }
}

/**
 * Read a palette name typed at the color prompt.
 *
 * The name can be English or in the active language, in any case.
 *
 * @param {string} choice Text the person typed.
 * @returns {number|undefined} The Serato color, or undefined for an unknown name.
 */
export function colorFromName(choice: string): number | undefined {
  const wanted = choice.trim().toLocaleLowerCase();
  const english = COLOR_NAMES[wanted];
  if (english != null) return english;
  return COLORS.find(([, key]) => t(key).toLocaleLowerCase() === wanted)?.[0];
}

/**
 * Ask for a palette name and save it on the selected crate.
 *
 * The names match COLOR_NAMES. White is sent as null, which is Serato's
 * "no color" value. POST /api/crate with action color. A 409 locks the page.
 *
 * @returns {Promise<void>}
 */
export async function colorCrate() {
  const crate = state.crates.find((item) => item.id === state.activeCrate);
  if (!crate) return;
  mountSharedDialogs();
  const names = COLORS.map(([, key]) => t(key).toLocaleLowerCase());
  const choice = await openCratePrompt({
    title: t("crates.colorPrompt", { names: names.join(", ") }),
    value: "",
    confirmLabel: t("field.color"),
  });
  if (choice == null) return;
  const color = colorFromName(choice);
  if (color == null) {
    setNotice(t("crates.colorUnknown"));
    return;
  }
  try {
    const result = await postJSON("/api/crate", {
      action: "color",
      id: crate.id,
      color: color === 0xffffff ? null : color,
      space: state.space,
    });
    setNotice(result.warning || t("crates.colorSaved"));
    await loadLibrary();
  } catch (error) {
    if (failureOf(error).status === 409) lockDown(error);
    else setNotice(failureOf(error).message);
  }
}

/**
 * Delete the selected crate and the crates nested inside it.
 *
 * Asks for confirmation first. Tracks stay in the library. POST /api/crate
 * with action delete, then the rail returns to All tracks. A 409 locks
 * the page.
 *
 * @returns {Promise<void>}
 */
export async function deleteCrate() {
  const crate = state.crates.find((item) => item.id === state.activeCrate);
  if (!crate) return;
  if (!(await openConfirm({
    title: t("common.delete"),
    message: t("crates.confirmDelete", { name: crate.name }),
    confirmLabel: t("common.delete"),
  }))) return;
  try {
    const result = await postJSON("/api/crate", { action: "delete", id: crate.id, space: state.space });
    state.activeCrate = "all";
    setNotice(result.warning || t("crates.deleted"));
    await loadLibrary();
  } catch (error) {
    if (failureOf(error).status === 409) lockDown(error);
    else setNotice(failureOf(error).message);
  }
}

/**
 * Create a crate from an M3U file chosen in the page.
 *
 * Reads the file text in the browser and posts it to /api/import.m3u.
 * The server adds only tracks whose portable_id matches a playlist line.
 * The notice reports how many lines did not match. A 409 locks the page.
 *
 * @param {File} file Playlist file from the hidden file input.
 * @returns {Promise<void>}
 */
export async function importPlaylist(file: File) {
  const text = await file.text();
  const name = file.name.replace(/\.m3u8?$/i, "") || t("import.defaultName");
  const parent = state.activeCrate === "all" ? state.rootId : state.activeCrate;
  try {
    const result = await postJSON("/api/import.m3u", { space: state.space, parent, name, text });
    const missed = result.unmatched_count ? ` ${t("import.unmatched", { count: Number(result.unmatched_count) })}` : "";
    setNotice(`${t("import.added", { count: Number(result.added) || 0 })}${missed}${result.warning ? ` ${result.warning}` : ""}`);
    await loadLibrary();
    selectCrate(result.id as number);
  } catch (error) {
    if (failureOf(error).status === 409) lockDown(error);
    else setNotice(failureOf(error).message);
  }
}

/**
 * Redraw the history-session list from state.historySessions.
 *
 * Each row selects that session. The meta text is the played count.
 * Does not fetch; loadHistory and openSession do.
 *
 * @returns {void}
 */
export function renderSessions() {
  notifyHistory();
  const host = el("session-list");
  sessionRoot = remountIsland(host, createElement(HistorySessions), {
    host: sessionHost,
    root: sessionRoot,
  });
  sessionHost = host;
}

/**
 * Load history sessions from GET /api/history.
 *
 * Stores them on state and redraws the session rail. Throws when the
 * server reports an error so the caller can show it. Does not open a session.
 *
 * @returns {Promise<void>}
 */
export async function loadHistory() {
  const response = await fetch("/api/history");
  const payload = await readJSONOr<HistoryPayload>(response, {});
  if (!response.ok) throw new Error(serverMessage(payload, t("history.readFailed")));
  state.historySessions = payload.sessions || [];
  notifyHistory();
  renderSessions();
}

/**
 * Load one history session and show its entries.
 *
 * GET /api/history with the session id. Replaces state.entries and resets
 * the scroll position. A failed read stays on the notice line.
 *
 * @param {number} id history_session id.
 * @returns {Promise<void>}
 */
export async function openSession(id: number) {
  state.historyId = id;
  state.selectedId = null;
  notifyHistory();
  renderSessions();
  const response = await fetch(`/api/history?session=${id}`);
  const payload = await readJSONOr<HistoryPayload>(response, {});
  if (!response.ok) {
    setNotice(serverMessage(payload, t("history.sessionFailed")));
    return;
  }
  state.entries = payload.entries || [];
  notifyHistory();
  el("list").scrollTop = 0;
  renderList();
}

/**
 * Load duplicate groups for the current space.
 *
 * GET /api/duplicates. The ids are stored as a set so the list can filter
 * without another request. The list is redrawn only when that view is active.
 *
 * @returns {Promise<void>}
 */
export async function loadDuplicates() {
  state.duplicateIds = null;
  state.duplicateGroups = [];
  const response = await fetch(`/api/duplicates?space=${encodeURIComponent(state.space)}`);
  const payload = await readJSONOr<DuplicatePayload>(response, {});
  if (!response.ok) throw new Error(serverMessage(payload, t("duplicates.readFailed")));
  const ids = new Set<number>();
  state.duplicateGroups = payload.groups || [];
  for (const group of state.duplicateGroups) for (const id of group.ids || []) ids.add(id);
  state.duplicateIds = ids;
  state.duplicateSpace = state.space;
  if (state.mode === "duplicates") renderList();
}

/**
 * Leave history and select the same track in the Serato Library space.
 *
 * Switches the space menu, reloads that space, and fetches the track
 * detail. Used from a history entry that still has an asset id.
 *
 * @param {number} assetId Asset id in the Serato Library space.
 * @returns {Promise<void>}
 */
export async function openInLibrary(assetId: number) {
  state.space = "Serato Library";
  el("space").value = state.space;
  state.mode = "crates";
  state.activeCrate = "all";
  state.selectedId = assetId;
  await loadLibrary();
  selectTrack(assetId);
}

/**
 * Reload the current space from GET /api/library.
 *
 * Replaces tracks, crates, membership sets, and the lock status. Keeps
 * the selected crate and track when they still exist. Clears duplicate
 * ids when the space changed so the duplicate view cannot mix spaces.
 *
 * @returns {Promise<void>} Resolves after the list is painted. Throws on a failed read.
 */
export async function loadLibrary() {
  el("count").textContent = t("library.loading");
  const response = await fetch(`/api/library?space=${encodeURIComponent(state.space)}`);
  const library = await readJSONOr<LibraryPayload>(response, {} as LibraryPayload);
  if (!response.ok) throw new Error(serverMessage(library, t("library.readFailed", { status: String(response.status) })));
  const selected = state.selectedId;
  const active = state.activeCrate;
  state.tracks = library.tracks;
  state.byId = new Map(library.tracks.map((track) => [track.id, track]));
  state.crates = library.crates;
  state.rootId = library.root_id;
  state.crateTracks = new Map(library.crates.map((crate) => [crate.id, new Set(crate.tracks)]));
  state.presets = library.presets ?? {};
  state.expanded = new Set<number | "all">(library.crates.filter((crate) => crate.expanded).map((crate) => crate.id));
  state.activeCrate = active === "all" || library.crates.some((crate) => crate.id === active) ? active : "all";
  state.selectedId = selected;
  if (state.duplicateSpace !== state.space) {
    state.duplicateIds = null;
    state.duplicateGroups = [];
  }
  applyStatus(library.serato);
  renderList();
}

/**
 * Switch among crates, history, play stats, missing, duplicates, stems, library
 * health, damaged files, suspect quality, tag spellings, files, snapshots, gig, Check drive, and tempo drift.
 *
 * History sorts by start time descending and loads sessions once.
 * Duplicates load when this space has not been scanned yet. Files loads
 * the current folder. Other modes only change which tracks renderList keeps.
 *
 * @param {string} mode View name from the rail buttons.
 * @returns {void}
 */
export function setMode(mode: string) {
  rememberMode(mode);
  state.mode = mode;
  el("list").scrollTop = 0;
  if (mode === "history") {
    state.sort = "start";
    state.sortDir = -1;
    if (!state.historySessions.length) loadHistory().catch((error) => setNotice(failureOf(error).message));
  } else if (state.sort === "start" || state.sort === "deck" || state.sort === "played") {
    state.sort = "name";
    state.sortDir = 1;
  }
  if (mode === "duplicates" && state.duplicateSpace !== state.space) {
    loadDuplicates().catch((error) => setNotice(failureOf(error).message));
  }
  if (mode === "files") {
    state.filesLoading = true;
    const path = state.filesAtRoots ? "" : (state.filesPath || "");
    loadFolder(path, { elsewhere: state.filesElsewhere && !state.filesAtRoots }).catch((error) => failFiles(error));
  }
  if (mode === "snapshots") {
    loadSnapshots().catch((error) => failSnapshots(error));
  }
  if (mode === "gig") loadGigCheck().catch(showGigFailure);
  if (mode === "portable") loadPortableView().catch(showPortableFailure);
  if (mode === "drift") loadDrift().catch(showDriftFailure);
  if (mode === "health") loadHealth().catch(showHealthFailure);
  if (mode === "stats") loadHistoryStats().catch(showHistoryStatsFailure);
  if (mode === "scan") loadScan("quick").catch(showScanFailure);
  if (mode === "bitrate") loadBitrate().catch(showBitrateFailure);
  if (mode === "tags") loadTags().catch(showTagsFailure);
  renderList();
}

/**
 * Replace the detail pane when the library cannot be read.
 *
 * Used for the first load and for reload failures. The count line says
 * the library is unavailable. Does not retry by itself.
 *
 * @param {Error} error Failure from loadLibrary or a related request.
 * @returns {void}
 */
export function showFailure(error: unknown) {
  el("count").textContent = t("library.unavailable");
  setTrackDetail({ kind: "error", message: failureOf(error).message });
  paintDetailIsland();
}

/**
 * Return the duplicate group that contains the selected track.
 *
 * Groups come from GET /api/duplicates. A track outside that view, or a
 * track that is not in a group, returns null. Does not fetch.
 *
 * @returns {object|null} The group, with an ids array, or null.
 */
export function selectedDuplicateGroup() {
  if (state.mode !== "duplicates" || state.selectedId == null) return null;
  return (state.duplicateGroups || []).find((group) => (group.ids || []).includes(state.selectedId as number)) || null;
}

/**
 * Enable Merge copies when a duplicate group is selected and Serato is quit.
 *
 * The button lives in the duplicates rail. Other views hide it. Does not fetch.
 *
 * @returns {void}
 */
export function syncMergeButton() {
  mountHealthListChrome();
}

/**
 * Show Relink missing files on the Missing view while Serato is quit.
 *
 * The button lives in the missing rail. Other views hide it. Does not fetch.
 *
 * @returns {void}
 */
export function syncRelinkButton() {
  mountHealthListChrome();
}

/**
 * List normal-crate names that contain one asset.
 *
 * Smart crates are omitted. The names come from the loaded library.
 *
 * @param {number} assetId Asset id.
 * @returns {string[]} Crate names.
 */
export function crateNamesFor(assetId: number) {
  return state.crates
    .filter((crate) => !crate.smart && (crate.tracks || []).includes(assetId))
    .map((crate) => crate.name);
}

/**
 * Attach the library, crate, history, and list-header listeners.
 *
 * Called once from app.ts after the spacer is mounted. The handlers call
 * the functions in this module. They do not open the database themselves.
 *
 * @returns {void}
 */
export function wireLibrary(): void {
  mountFilesIslands();

  el("search").addEventListener("input", () => {
    state.query = el("search").value;
    el("list").scrollTop = 0;
    renderList();
  });

  el("search-field").addEventListener("change", () => {
    state.searchField = el("search-field").value;
    el("list").scrollTop = 0;
    renderList();
  });

  el("crate-search").addEventListener("input", (event) => {
    state.crateQuery = (event.target as HTMLInputElement).value;
    renderCrates();
  });

  el("reload").addEventListener("click", () => {
    const jobs = [loadLibrary()];
    if (state.mode === "history") jobs.push(loadHistory());
    if (state.mode === "duplicates") jobs.push(loadDuplicates());
    if (state.mode === "gig") jobs.push(loadGigCheck().catch(showGigFailure));
    if (state.mode === "portable") jobs.push(loadPortableView().catch(showPortableFailure));
    if (state.mode === "drift") jobs.push(loadDrift().catch(showDriftFailure));
    if (state.mode === "health") jobs.push(loadHealth().catch(showHealthFailure));
    if (state.mode === "stats") jobs.push(loadHistoryStats().catch(showHistoryStatsFailure));
    if (state.mode === "scan") jobs.push(loadScan().catch(showScanFailure));
    if (state.mode === "bitrate") jobs.push(loadBitrate().catch(showBitrateFailure));
    if (state.mode === "tags") jobs.push(loadTags().catch(showTagsFailure));
    Promise.all(jobs).catch(showFailure);
  });

  el("export-m3u").addEventListener("click", () => exportPlaylistM3u());
  el("import-m3u").addEventListener("click", () => {
    if (playlistCrate() == null) return;
    if (!state.writable) {
      setNotice(el("status").textContent);
      return;
    }
    el("import-file").click();
  });

  el("import-file").addEventListener("change", (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    (event.target as HTMLInputElement).value = "";
    if (file) importPlaylist(file).catch((error) => setNotice(failureOf(error).message));
  });

  el("space").addEventListener("change", () => {
    state.space = el("space").value;
    state.activeCrate = "all";
    state.selectedId = null;
    state.duplicateIds = null;
    state.duplicateGroups = [];
    loadLibrary().then(() => {
      if (state.mode === "duplicates") return loadDuplicates();
      if (state.mode === "gig") return loadGigCheck().catch(showGigFailure);
      if (state.mode === "portable") return loadPortableView().catch(showPortableFailure);
      if (state.mode === "drift") return loadDrift().catch(showDriftFailure);
      if (state.mode === "health") return loadHealth().catch(showHealthFailure);
      if (state.mode === "stats") return loadHistoryStats().catch(showHistoryStatsFailure);
      if (state.mode === "scan") return loadScan().catch(showScanFailure);
      if (state.mode === "bitrate") return loadBitrate().catch(showBitrateFailure);
      if (state.mode === "tags") return loadTags().catch(showTagsFailure);
      return null;
    }).catch(showFailure);
  });

  el("views").addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest("button");
    if (button?.dataset.nav) setMode(modeForGroup(button.dataset.nav));
  });
  el("view-children").addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest("button");
    if (button?.dataset.view) setMode(button.dataset.view);
  });
  el("sheet-scope-all").addEventListener("click", () => {
    selectCrate("all");
  });
  document.querySelector<HTMLElement>(".sort-crates")!.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest("button");
    if (!button?.dataset.crateSort) return;
    state.crateSort = button.dataset.crateSort;
    renderCrates();
    renderShell();
  });

  el("crate-new").addEventListener("click", () => createCrate().catch((error) => setNotice(failureOf(error).message)));
  el("crate-rename").addEventListener("click", () => renameCrate().catch((error) => setNotice(failureOf(error).message)));
  el("crate-color").addEventListener("click", () => colorCrate().catch((error) => setNotice(failureOf(error).message)));
  el("crate-delete").addEventListener("click", () => deleteCrate().catch((error) => setNotice(failureOf(error).message)));
  // Arrow keys follow the tree: Right opens a crate, Left closes it or
  // jumps to the parent. Enter and Space select. The roving tabindex keeps
  // one crate button in the tab order.
  el("crate-list").addEventListener("keydown", (event) => {
    const item = (event.target as HTMLElement).closest<HTMLButtonElement>(".crate");
    if (!item || !el("crate-list").contains(item)) return;
    const items = [...el("crate-list").querySelectorAll<HTMLButtonElement>(".crate")];
    const index = items.indexOf(item);
    const id = item.dataset.id === "all" ? "all" : Number(item.dataset.id);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusCrateItem(items[Math.min(items.length - 1, index + 1)]);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusCrateItem(items[Math.max(0, index - 1)]);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusCrateItem(items[0]);
    } else if (event.key === "End") {
      event.preventDefault();
      focusCrateItem(items[items.length - 1]);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      if (!state.crateQuery && item.getAttribute("aria-expanded") === "false") toggleCrate(id);
      else if (item.getAttribute("aria-expanded") === "true") focusCrateItem(items[index + 1]);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (!state.crateQuery && item.getAttribute("aria-expanded") === "true") toggleCrate(id);
      else if (item.dataset.parent) {
        focusCrateItem(items.find((button) => button.dataset.id === item.dataset.parent));
      }
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectCrate(id);
    }
  });
}

bridge.selectTrack = selectTrack;
bridge.selectEntry = selectEntry;
bridge.reloadLibrary = loadLibrary;
bridge.lockDown = lockDown;

registerTrackListActions({
  selectTrack: (id) => {
    void selectTrack(id);
  },
  selectEntry,
  play,
  saveTrack,
  revealTrack,
  prepareTrack,
  relocateTrack,
  removeTrack,
  setMembership,
  openInLibrary: (id) => {
    void openInLibrary(id);
  },
  setNotice,
  setSort: (key) => {
    if (state.sort === key) state.sortDir *= -1;
    else {
      state.sort = key;
      state.sortDir = isNumericSort(key) ? -1 : 1;
    }
    renderColumns();
    renderList();
  },
});
bindCrateActions({
  select: selectCrate,
  toggle: toggleCrate,
  create: () => {
    createCrate().catch((error) => setNotice(failureOf(error).message));
  },
  rename: () => {
    renameCrate().catch((error) => setNotice(failureOf(error).message));
  },
  color: () => {
    colorCrate().catch((error) => setNotice(failureOf(error).message));
  },
  remove: () => {
    deleteCrate().catch((error) => setNotice(failureOf(error).message));
  },
  exportM3u: exportPlaylistM3u,
});
historyActions.loadHistory = loadHistory;
historyActions.openSession = openSession;
historyActions.selectEntry = selectEntry;
historyActions.openInLibrary = openInLibrary;
bridge.applyStatus = applyStatus;
bridge.renderShell = renderShell;
bridge.setNotice = setNotice;
