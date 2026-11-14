/**
 * Quick-open: one box for views, crates, tracks, and files on disk.
 *
 * Views and crates are scored from the rail and the loaded library.
 * Tracks are scored from the loaded library. Files come from
 * GET /api/files?q=, which is read-only. Enter opens the highlighted
 * row. Esc closes the box. A view jump uses setMode, so the hash
 * updates and Back works.
 */

import { readJSONOr } from "../api";
import type { Crate, FileEntry, FilesPayload, Track } from "../api-types";
import { el } from "../dom";
import { t } from "../i18n";
import { scoreQuery } from "../fuzzy";
import { ROW, state } from "../state";
import { groupForMode, modeForGroup, NAV_GROUPS, type ViewMode } from "./nav";
import { VIEW_LABEL_KEYS } from "./sheet-chrome";
import { HASH_SCROLL } from "./motion";
import { buttonEl } from "./tooltip";
import { quickOpenHit } from "./tooltip-strings";
import { focusCrateItem, focusFileByPath, loadFolder, selectCrate, selectTrack, setMode } from "./views";

/** Wait before asking the disk, so a fast typist does not search every letter. */
export const QUICK_OPEN_MS = 200;

const LIMIT = 8;

const KIND_RANK = { view: 0, crate: 1, track: 2, file: 3 } as const;

export interface ViewHit {
  kind: "view";
  key: string;
  title: string;
  detail: string;
  score: number;
  mode: ViewMode;
}

export interface CrateHit {
  kind: "crate";
  key: string;
  title: string;
  detail: string;
  score: number;
  crateId: number | "all";
}

interface TrackHit {
  kind: "track";
  key: string;
  title: string;
  detail: string;
  score: number;
  trackId: number;
}

interface FileHit {
  kind: "file";
  key: string;
  title: string;
  detail: string;
  score: number;
  path: string;
}

type QuickHit = ViewHit | CrateHit | TrackHit | FileHit;

let returnFocus: HTMLElement | null = null;
let timer = 0;
let requestToken = 0;
let hits: QuickHit[] = [];
let active = 0;
let phase: "idle" | "loading" | "ready" | "error" = "idle";
let truncated = false;
let pendingQuery = "";

/**
 * Return the parent folder of a track path.
 *
 * Windows drive roots keep their slash. A POSIX root is `/`.
 *
 * @param path File path from the file search.
 * @returns The folder that contains the file.
 */
export function parentDirectory(path: string): string {
  const slash = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  if (slash < 0) return path;
  const parent = path.slice(0, slash);
  if (/^[A-Za-z]:$/.test(parent)) return `${parent}\\`;
  if (parent === "") return path.slice(0, slash + 1);
  return parent;
}

/**
 * Return whether the quick-open dialog is open.
 *
 * @returns True when the dialog is showing.
 */
export function quickOpenIsOpen(): boolean {
  return el("quick-open").open;
}

/**
 * Score rail views and parent groups against the query.
 *
 * Group names that differ from the first child (Music, Health, Gig)
 * open the same view the rail primary does. Duplicate titles for the
 * same view are dropped. Blank text matches nothing.
 *
 * @param query Text the person typed.
 * @returns Matching view hits, highest score first.
 */
export function matchViewHits(query: string): ViewHit[] {
  const text = query.trim();
  if (!text) return [];
  const found: ViewHit[] = [];
  const seen = new Set<string>();
  const add = (hit: ViewHit): void => {
    const id = `${hit.mode}:${hit.title}`;
    if (seen.has(id)) return;
    seen.add(id);
    found.push(hit);
  };
  for (const group of NAV_GROUPS) {
    const groupTitle = t(group.labelKey);
    for (const mode of group.modes) {
      const title = t(VIEW_LABEL_KEYS[mode]);
      const score = scoreQuery(text, title);
      if (score == null) continue;
      add({
        kind: "view",
        key: `view:${mode}`,
        title,
        detail: groupTitle,
        score,
        mode,
      });
    }
    const first = modeForGroup(group.id);
    const score = scoreQuery(text, groupTitle);
    if (score == null) continue;
    add({
      kind: "view",
      key: `view-group:${group.id}`,
      title: groupTitle,
      detail: t(VIEW_LABEL_KEYS[first]),
      score,
      mode: first,
    });
  }
  found.sort(byScore);
  return found.slice(0, LIMIT);
}

/**
 * Score loaded crates, including All tracks, against the query.
 *
 * Blank text matches nothing. An empty crate name is skipped.
 *
 * @param query Text the person typed.
 * @returns Matching crate hits, highest score first.
 */
export function matchCrateHits(query: string): CrateHit[] {
  const text = query.trim();
  if (!text) return [];
  const found: CrateHit[] = [];
  const allTitle = t("crates.allTracks");
  const allScore = scoreQuery(text, allTitle);
  if (allScore != null) {
    found.push({
      kind: "crate",
      key: "crate:all",
      title: allTitle,
      detail: t("quickOpen.crate"),
      score: allScore,
      crateId: "all",
    });
  }
  for (const crate of state.crates) {
    const hit = scoreCrate(crate, text);
    if (hit) found.push(hit);
  }
  found.sort(byScore);
  return found.slice(0, LIMIT);
}

/** Fill the find-box labels in the active language. */
function labelQuickOpen(): void {
  el("quick-open-title").textContent = t("quickOpen.title");
  el("quick-open-label").textContent = t("quickOpen.label");
  el("quick-open-query").placeholder = t("quickOpen.placeholder");
  el("quick-open-close").textContent = t("common.close");
  el("quick-open-retry").textContent = t("common.tryAgain");
  el("quick-open-list").setAttribute("aria-label", t("quickOpen.matches"));
}

/**
 * Repaint the find box when it is open.
 *
 * @returns {void}
 */
export function repaintQuickOpen(): void {
  const dialog = document.getElementById("quick-open");
  if (!(dialog instanceof HTMLDialogElement) || !dialog.open) return;
  labelQuickOpen();
  paint();
}

export function openQuickOpen(): void {
  const dialog = el("quick-open");
  if (dialog.open) return;
  returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  pendingQuery = "";
  hits = [];
  active = 0;
  phase = "idle";
  truncated = false;
  window.clearTimeout(timer);
  el("quick-open-query").value = "";
  labelQuickOpen();
  paint();
  dialog.showModal();
  el("quick-open-query").focus();
}

/**
 * Close the find box.
 *
 * Focus returns to the control that opened it.
 *
 * @returns {void}
 */
export function closeQuickOpen(): void {
  const dialog = el("quick-open");
  if (dialog.open) dialog.close();
}

function closeQuickOpenOnHash(): void {
  const dialog = document.getElementById("quick-open");
  if (!(dialog instanceof HTMLDialogElement) || !dialog.open) return;
  returnFocus = null;
  dialog.close();
}

/**
 * Attach quick-open listeners.
 *
 * Called from wireShortcuts after the page markup exists. Does not fetch
 * until the person types.
 *
 * @returns {void}
 */
export function wireQuickOpen(): void {
  const dialog = el("quick-open");
  dialog.addEventListener("keydown", onDialogKey);
  dialog.addEventListener("close", () => {
    window.clearTimeout(timer);
    const node = returnFocus;
    returnFocus = null;
    if (node && node.isConnected && !node.closest("[hidden]")) node.focus();
  });
  window.addEventListener("hashchange", closeQuickOpenOnHash);
  window.addEventListener("popstate", closeQuickOpenOnHash);
  el("quick-open-query").addEventListener("input", () => schedule());
  el("quick-open-close").addEventListener("click", () => closeQuickOpen());
  el("quick-open-retry").addEventListener("click", () => {
    const query = el("quick-open-query").value.trim();
    if (query) void loadFiles(query, localHits(query));
  });
}

function onDialogKey(event: KeyboardEvent): void {
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Enter") return;
  if (!hits.length && event.key !== "Enter") return;
  event.preventDefault();
  if (event.key === "ArrowDown") active = Math.min(hits.length - 1, active + 1);
  else if (event.key === "ArrowUp") active = Math.max(0, active - 1);
  else {
    const chosen = hits[active];
    if (chosen) void activate(chosen);
  }
  if (event.key !== "Enter") paint();
}

function schedule(): void {
  window.clearTimeout(timer);
  const query = el("quick-open-query").value;
  pendingQuery = query;
  const local = localHits(query);
  hits = local;
  active = 0;
  truncated = false;
  if (!query.trim()) {
    phase = "idle";
    requestToken += 1;
    paint();
    return;
  }
  phase = "loading";
  paint();
  timer = window.setTimeout(() => {
    void loadFiles(query.trim(), local);
  }, QUICK_OPEN_MS);
}

function localHits(query: string): QuickHit[] {
  return mergeHits(matchViewHits(query), matchCrateHits(query), trackHits(query), []);
}

async function loadFiles(query: string, local: QuickHit[]): Promise<void> {
  const token = ++requestToken;
  phase = "loading";
  try {
    const response = await fetch(`/api/files?q=${encodeURIComponent(query)}`);
    const payload = await readJSONOr<FilesPayload>(response, {});
    if (token !== requestToken) return;
    if (!response.ok) throw new Error(payload.error || t("quickOpen.fileError"));
    const files = fileHits(payload);
    const views = local.filter((hit): hit is ViewHit => hit.kind === "view");
    const crates = local.filter((hit): hit is CrateHit => hit.kind === "crate");
    const tracks = local.filter((hit): hit is TrackHit => hit.kind === "track");
    hits = mergeHits(views, crates, tracks, files);
    truncated = Boolean(payload.truncated);
    phase = "ready";
    if (active >= hits.length) active = Math.max(0, hits.length - 1);
    paint();
  } catch {
    if (token !== requestToken) return;
    hits = local;
    phase = "error";
    paint();
  }
}

function trackHits(query: string): TrackHit[] {
  const text = query.trim();
  if (!text) return [];
  const found: TrackHit[] = [];
  for (const track of state.tracks) {
    const hit = scoreTrack(track, text);
    if (hit) found.push(hit);
  }
  found.sort(byScore);
  return found.slice(0, LIMIT);
}

function scoreTrack(track: Track, query: string): TrackHit | null {
  const title = track.name || "Untitled";
  const artist = track.artist ?? "";
  const album = track.album ?? "";
  const file = track.file ?? "";
  const score = scoreQuery(query, `${title} ${artist} ${album} ${file}`);
  if (score == null) return null;
  const detail = [artist, album].filter((part) => part !== "").join(" · ");
  return { kind: "track", key: `track:${track.id}`, title, detail, score, trackId: track.id };
}

function scoreCrate(crate: Crate, query: string): CrateHit | null {
  const title = crate.name || "";
  if (!title) return null;
  const score = scoreQuery(query, title);
  if (score == null) return null;
  return {
    kind: "crate",
    key: `crate:${crate.id}`,
    title,
    detail: crateParentName(crate),
    score,
    crateId: crate.id,
  };
}

function crateParentName(crate: Crate): string {
  if (crate.parent == null) return t("quickOpen.crate");
  const parent = state.crates.find((row) => row.id === crate.parent);
  return parent?.name || t("quickOpen.crate");
}

function fileHits(payload: FilesPayload): FileHit[] {
  const rows = Array.isArray(payload.entries) ? payload.entries : [];
  const found: FileHit[] = [];
  for (const entry of rows) {
    if (!isFileEntry(entry)) continue;
    const score = typeof entry.score === "number" ? entry.score : 0;
    found.push({
      kind: "file",
      key: `file:${entry.path}`,
      title: entry.name,
      detail: entry.detail || entry.path,
      score,
      path: entry.path,
    });
  }
  found.sort(byScore);
  return found.slice(0, LIMIT);
}

function isFileEntry(value: unknown): value is FileEntry {
  if (!value || typeof value !== "object") return false;
  const row = value as FileEntry;
  return typeof row.name === "string" && typeof row.path === "string" && typeof row.kind === "string";
}

function mergeHits(views: ViewHit[], crates: CrateHit[], tracks: TrackHit[], files: FileHit[]): QuickHit[] {
  return [...views, ...crates, ...tracks, ...files].sort(byScore).slice(0, LIMIT * 2);
}

function byScore(left: QuickHit, right: QuickHit): number {
  return right.score - left.score || KIND_RANK[left.kind] - KIND_RANK[right.kind] || left.title.localeCompare(right.title);
}

function kindLabel(hit: QuickHit): string {
  if (hit.kind === "view") return t("quickOpen.view");
  if (hit.kind === "crate") return t("quickOpen.crate");
  if (hit.kind === "track") return t("quickOpen.track");
  return t("quickOpen.file");
}

async function activate(hit: QuickHit): Promise<void> {
  closeQuickOpen();
  if (hit.kind === "view") {
    setMode(hit.mode);
    focusOpened(hit);
    return;
  }
  if (hit.kind === "crate") {
    if (state.mode !== "crates") setMode("crates");
    selectCrate(hit.crateId);
    focusOpened(hit);
    return;
  }
  if (hit.kind === "track") {
    if (state.mode === "files" || state.mode === "snapshots" || state.mode === "history") setMode("crates");
    selectCrate("all");
    await selectTrack(hit.trackId);
    const index = state.view.findIndex((row) => row.id === hit.trackId);
    if (index >= 0) el("list").scrollTop = index * ROW;
    return;
  }
  setMode("files");
  await loadFolder(parentDirectory(hit.path));
  focusFileByPath(hit.path);
}

function focusOpened(hit: ViewHit | CrateHit): void {
  if (hit.kind === "view") {
    const child = document.querySelector<HTMLElement>(`#view-children [data-view="${hit.mode}"]`);
    if (child && !child.hidden) {
      child.focus();
      return;
    }
    const primary = document.querySelector<HTMLElement>(`#views [data-nav="${groupForMode(hit.mode)}"]`);
    if (primary) primary.focus();
    return;
  }
  const item = document.querySelector<HTMLElement>(`#crate-list .crate[data-id="${String(hit.crateId)}"]`);
  if (item) focusCrateItem(item);
}

function paint(): void {
  const status = el("quick-open-status");
  const list = el("quick-open-list");
  const retry = el("quick-open-retry");
  const query = pendingQuery.trim();
  retry.hidden = phase !== "error";
  list.replaceChildren();
  if (!query) status.textContent = t("quickOpen.empty");
  else if (phase === "loading") status.textContent = t("quickOpen.searching");
  else if (phase === "error") status.textContent = t("quickOpen.fileError");
  else if (!hits.length) status.textContent = t("quickOpen.none", { query });
  else status.textContent = truncated ? t("quickOpen.truncated") : t("quickOpen.matchCount", { count: hits.length });
  hits.forEach((hit, index) => {
    const item = document.createElement("li");
    const kind = kindLabel(hit);
    const button = buttonEl(quickOpenHit(kind, hit.title, hit.detail));
    button.className = "quick-open-option";
    button.id = `quick-open-option-${index}`;
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", String(index === active));
    button.tabIndex = -1;
    if (index === active) button.classList.add("is-active");
    const kindEl = document.createElement("span");
    kindEl.className = "quick-open-kind";
    kindEl.textContent = kind;
    const title = document.createElement("span");
    title.className = "quick-open-name";
    title.textContent = hit.title;
    const detail = document.createElement("span");
    detail.className = "quick-open-detail";
    detail.textContent = hit.detail;
    button.append(kindEl, title, detail);
    button.addEventListener("click", () => {
      active = index;
      void activate(hit);
    });
    item.append(button);
    list.append(item);
  });
  const field = el("quick-open-query");
  const current = hits[active];
  if (current) field.setAttribute("aria-activedescendant", `quick-open-option-${active}`);
  else field.removeAttribute("aria-activedescendant");
  const chosen = list.querySelector<HTMLElement>(".is-active");
  if (chosen && typeof chosen.scrollIntoView === "function") {
    chosen.scrollIntoView({ block: "nearest", behavior: HASH_SCROLL });
  }
}
