/**
 * Files view engine: folder load, search, dialogs, and the React store.
 *
 * The page paints through FilesContext. This module is the one store those
 * islands subscribe to. GET /api/library-roots and GET /api/files are
 * read-only. Writes go through the review dialog and POST /api/files.
 */

import { failureOf, fetchLibraryRoots, isLibraryRoot, postJSON, readJSONOr } from "../api";
import type {
  FileCrumb,
  FileEntry,
  FileRoot,
  FilesBody,
  FilesPayload,
} from "../api-types";
import { bridge } from "../bridge";
import { el } from "../dom";
import { serverMessage, t } from "../i18n";
import { emitFiles } from "./files-store";
import { FILE_ROW, ROOT_ROW, state } from "../state";

export { emitFiles, subscribeFiles } from "./files-store";

/** Wait before searching the disk, so a fast typist does not search every letter. */
export const FILES_SEARCH_MS = 200;

const FILE_OVERSCAN = 8;

let filesRequest = 0;
let filesSearchTimer = 0;
let mountHook: () => void = () => {};

/**
 * Point folder paint at the Files React islands.
 *
 * @param fn Mounts the panel and dialogs.
 * @returns {void}
 */
export function bindFilesMount(fn: () => void): void {
  mountHook = fn;
}

let filesPreview: FilesPayload | null = null;
let filesAction = "";
let filesTagScope: "paths" | "crate" = "paths";
let filesTrigger: HTMLElement | null = null;
let dialogName = "";
let dialogReplacement = "";
let dialogStatus = "";

/**
 * Paint the Files islands from current state.
 *
 * @returns {void}
 */
export function renderFiles(): void {
  mountHook();
  emitFiles();
  bridge.renderShell();
}

export function mountFiles(): void {
  mountHook();
}

/**
 * Show a folder error in the Files view.
 *
 * @param error Failed folder read or save.
 * @returns {void}
 */
export function failFiles(error: unknown): void {
  state.filesLoading = false;
  state.filesError = failureOf(error).message || t("error.folder_unreadable");
  renderFiles();
}

/**
 * Load music roots, or one folder.
 *
 * An empty path asks GET /api/library-roots. A folder asks GET /api/files.
 * ``elsewhere`` asks to browse outside those folders. ``refresh`` recomputes
 * the roots. Selection is cleared because the previous paths are no longer
 * the rows on screen. A success message can be kept when the reload follows
 * a save.
 *
 * @param path Folder to open. Empty selects the music roots.
 * @param options keepMessage retains the last save note. elsewhere lists outside the roots. refresh recomputes the roots.
 * @returns {Promise<void>}
 */
export async function loadFolder(
  path: string,
  options: { keepMessage?: boolean; elsewhere?: boolean; refresh?: boolean } = {},
): Promise<void> {
  window.clearTimeout(filesSearchTimer);
  state.filesQuery = "";
  state.filesSearching = false;
  const searchField = document.getElementById("files-search");
  if (searchField instanceof HTMLInputElement) searchField.value = "";
  const elsewhere = options.elsewhere === true;
  const refresh = options.refresh === true;
  const atRoots = path === "" && !elsewhere;
  const token = ++filesRequest;
  state.filesLoading = true;
  state.filesError = "";
  if (!options.keepMessage) state.filesMessage = "";
  state.filesSelected = new Set();
  state.filesActive = 0;
  state.filesAtRoots = atRoots;
  state.filesElsewhere = elsewhere;
  if (atRoots) {
    state.filesPath = "";
    state.filesParent = null;
    state.filesEntries = [];
    state.filesBreadcrumb = [];
    state.filesRoot = null;
  }
  renderFiles();
  if (refresh || atRoots) {
    const rootsPayload = await fetchLibraryRoots(refresh);
    if (token !== filesRequest) return;
    state.filesRoots = rootsPayload.roots.filter(isLibraryRoot);
  }
  if (atRoots) {
    state.filesPath = "";
    state.filesParent = null;
    state.filesEntries = [];
    state.filesBreadcrumb = [];
    state.filesRoot = null;
    state.filesElsewhere = false;
    state.filesAtRoots = true;
    state.filesTruncated = false;
    state.filesLoading = false;
    const list = document.getElementById("files-list");
    if (list) list.scrollTop = 0;
    renderFiles();
    return;
  }
  const params = new URLSearchParams();
  if (path) params.set("path", path);
  if (elsewhere) params.set("elsewhere", "1");
  const query = params.size ? `?${params.toString()}` : "";
  const response = await fetch(`/api/files${query}`);
  const payload = await readJSONOr<FilesPayload>(response, {});
  if (token !== filesRequest) return;
  if (!response.ok) throw new Error(serverMessage(payload, t("error.folder_unreadable")));
  state.filesPath = payload.path || "";
  state.filesParent = typeof payload.parent === "string" && payload.parent ? payload.parent : null;
  state.filesEntries = Array.isArray(payload.entries) ? payload.entries : [];
  state.filesRoot = isFileRoot(payload.root) ? payload.root : null;
  state.filesBreadcrumb = Array.isArray(payload.breadcrumb) ? payload.breadcrumb.filter(isFileCrumb) : [];
  state.filesElsewhere = Boolean(payload.elsewhere);
  state.filesAtRoots = !state.filesPath && !state.filesElsewhere;
  state.filesTruncated = Boolean(payload.truncated);
  state.filesLoading = false;
  const list = document.getElementById("files-list");
  if (list) list.scrollTop = 0;
  if (payload.serato) bridge.applyStatus(payload.serato);
  renderFiles();
}

/**
 * Search file names under the open folder, or under every music folder.
 *
 * Uses GET /api/files?q=. The request is read-only. A newer folder open
 * or a newer search replaces a slow reply.
 *
 * @param query Name to find.
 * @returns {Promise<void>}
 */
export async function searchFiles(query: string): Promise<void> {
  const token = ++filesRequest;
  const scope = state.filesAtRoots ? "" : state.filesPath;
  const elsewhere = state.filesElsewhere && !state.filesAtRoots;
  state.filesLoading = true;
  state.filesError = "";
  state.filesSearching = true;
  state.filesQuery = query;
  renderFiles();
  const params = new URLSearchParams();
  params.set("q", query);
  if (scope) params.set("path", scope);
  if (elsewhere) params.set("elsewhere", "1");
  const response = await fetch(`/api/files?${params.toString()}`);
  const payload = await readJSONOr<FilesPayload>(response, {});
  if (token !== filesRequest) return;
  if (!response.ok) throw new Error(payload.error || "Files could not be searched.");
  const entries = Array.isArray(payload.entries) ? payload.entries.filter(isListedFile) : [];
  state.filesEntries = entries;
  state.filesTruncated = Boolean(payload.truncated);
  state.filesLoading = false;
  state.filesSearching = true;
  state.filesActive = 0;
  state.filesSelected = new Set();
  const list = document.getElementById("files-list");
  if (list) list.scrollTop = 0;
  renderFiles();
}

/**
 * Schedule a name search, or reload when the box is cleared.
 *
 * @param value Search box contents.
 * @returns {void}
 */
export function onFilesSearchInput(value: string): void {
  window.clearTimeout(filesSearchTimer);
  state.filesQuery = value;
  if (!value.trim()) {
    if (state.filesAtRoots && !state.filesPath) {
      state.filesSearching = false;
      state.filesEntries = [];
      state.filesError = "";
      state.filesTruncated = false;
      state.filesLoading = false;
      renderFiles();
      return;
    }
    loadFolder(state.filesPath, { elsewhere: state.filesElsewhere && Boolean(state.filesPath) }).catch((error) => failFiles(error));
    return;
  }
  filesSearchTimer = window.setTimeout(() => {
    searchFiles(value.trim()).catch((error) => failFiles(error));
  }, FILES_SEARCH_MS);
}

function isListedFile(value: unknown): value is FileEntry {
  if (!value || typeof value !== "object") return false;
  const row = value as FileEntry;
  return typeof row.name === "string" && typeof row.path === "string" && typeof row.kind === "string";
}

function isFileRoot(value: unknown): value is FileRoot {
  if (!value || typeof value !== "object") return false;
  const record = value as FileRoot;
  return typeof record.name === "string" && typeof record.path === "string" && typeof record.kind === "string";
}

function isFileCrumb(value: unknown): value is FileCrumb {
  if (!value || typeof value !== "object") return false;
  const record = value as FileCrumb;
  return typeof record.name === "string" && typeof record.path === "string";
}

/**
 * Return the crumbs for the open location.
 *
 * @returns Path crumbs. The root list is one crumb.
 */
export function visibleCrumbs(): FileCrumb[] {
  if (state.filesBreadcrumb.length) return state.filesBreadcrumb;
  if (state.filesAtRoots) return [{ name: t("files.roots"), path: "" }];
  if (state.filesPath) return [{ name: state.filesPath, path: state.filesPath }];
  return [{ name: t("files.roots"), path: "" }];
}

/**
 * Row height for the current list.
 *
 * @returns Pixel height of one row.
 */
export function filesRowHeight(): number {
  if (state.filesSearching) return FILE_ROW;
  return state.filesAtRoots ? ROOT_ROW : FILE_ROW;
}

/**
 * Return the rows in the order they are shown.
 *
 * Roots keep the order from the server. A folder lists directories, then
 * files, then shortcuts.
 *
 * @returns Rows for the virtual window.
 */
export function browserRows(): FileEntry[] {
  if (state.filesSearching) return state.filesEntries;
  if (state.filesAtRoots) {
    return state.filesRoots.map((root) => {
      const entry: FileEntry = {
        name: root.label,
        path: root.path,
        detail: root.detail,
        kind: root.kind === "serato_drive" ? "drive" : "folder",
        missing: root.missing,
        removable: root.removable,
        serato: root.serato,
      };
      return entry;
    });
  }
  const rank: Record<string, number> = { dir: 0, file: 1, link: 2 };
  return [...state.filesEntries].sort((left, right) => {
    return (rank[left.kind] ?? 3) - (rank[right.kind] ?? 3)
      || left.name.localeCompare(right.name, undefined, { numeric: true, sensitivity: "base" });
  });
}

/**
 * Visible slice of the virtual file list.
 *
 * @param scrollTop Current list scroll offset.
 * @param viewHeight List client height.
 * @returns Start index, end index, and the rows in that window.
 */
export function fileWindow(scrollTop: number, viewHeight: number): { start: number; end: number; rows: FileEntry[] } {
  const rows = browserRows();
  if (state.filesActive >= rows.length) state.filesActive = Math.max(0, rows.length - 1);
  if (state.filesActive < 0) state.filesActive = 0;
  const rowHeight = filesRowHeight();
  const view = viewHeight || 600;
  const maxScroll = Math.max(0, rows.length * rowHeight - view);
  const top = Math.min(Math.max(0, scrollTop), maxScroll);
  const start = Math.max(0, Math.floor(top / rowHeight) - FILE_OVERSCAN);
  const end = Math.min(rows.length, Math.ceil((top + view) / rowHeight) + FILE_OVERSCAN);
  return { start, end, rows };
}

/**
 * Return the selected files that are still in this folder.
 *
 * @returns Selected file entries.
 */
export function selectedFiles(): FileEntry[] {
  return state.filesEntries.filter((entry) => entry.kind === "file" && state.filesSelected.has(entry.path));
}

/**
 * Move the keyboard cursor to one row and keep that row on screen.
 *
 * @param index Row index in browserRows.
 * @returns {void}
 */
export function focusFilesIndex(index: number): void {
  const rows = browserRows();
  if (!rows.length) return;
  state.filesActive = Math.max(0, Math.min(rows.length - 1, index));
  const list = document.getElementById("files-list");
  if (list) {
    const rowHeight = filesRowHeight();
    const view = list.clientHeight || 600;
    const top = state.filesActive * rowHeight;
    const maxScroll = Math.max(0, rows.length * rowHeight - view);
    if (top < list.scrollTop) list.scrollTop = top;
    if (top + rowHeight > list.scrollTop + view) list.scrollTop = Math.min(maxScroll, top + rowHeight - view);
  }
  renderFiles();
  const control = list?.querySelector<HTMLElement>(`[data-files-index="${state.filesActive}"]`);
  control?.focus();
}

/**
 * Open the active folder or toggle the active file.
 *
 * @param index Row index in browserRows.
 * @returns {void}
 */
export function activateFilesIndex(index: number): void {
  const entry = browserRows()[index];
  if (!entry) return;
  if (entry.kind === "file") {
    if (state.filesSelected.has(entry.path)) state.filesSelected.delete(entry.path);
    else state.filesSelected.add(entry.path);
    renderFiles();
    focusFilesIndex(index);
    return;
  }
  if (entry.kind === "link") return;
  openBrowserRow(entry);
}

/**
 * Open a folder, a music root, or a drive.
 *
 * A folder opened while browsing elsewhere stays outside the roots.
 * A root returns to rooted browsing.
 *
 * @param entry Row to open.
 * @returns {void}
 */
export function openBrowserRow(entry: FileEntry): void {
  if (entry.missing) return;
  const elsewhere = state.filesElsewhere && entry.kind === "dir";
  loadFolder(entry.path, { elsewhere }).catch((error) => failFiles(error));
}

/**
 * Handle arrow keys, Home, and End for the file list.
 *
 * @param event Key event from the list or a row.
 * @returns {void}
 */
export function onFilesKey(event: KeyboardEvent): void {
  if (state.mode !== "files") return;
  const list = document.getElementById("files-list");
  if (!list || !(event.target instanceof Node) || !list.contains(event.target)) return;
  const rows = browserRows();
  if (!rows.length) return;
  if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Home" || event.key === "End") {
    event.preventDefault();
    if (event.key === "ArrowDown") focusFilesIndex(state.filesActive + 1);
    else if (event.key === "ArrowUp") focusFilesIndex(state.filesActive - 1);
    else if (event.key === "Home") focusFilesIndex(0);
    else focusFilesIndex(rows.length - 1);
    return;
  }
  if (event.key !== "Enter" && event.key !== " ") return;
  const control = event.target instanceof HTMLElement ? event.target.closest("button, input") : null;
  if (control && list.contains(control)) return;
  event.preventDefault();
  activateFilesIndex(state.filesActive);
}

/**
 * Move the file-list cursor by one row.
 *
 * @param delta 1 for the next row, -1 for the previous row.
 * @returns {void}
 */
export function moveFileList(delta: number): void {
  if (!browserRows().length) return;
  focusFilesIndex(state.filesActive + delta);
}

/**
 * Open the active file row.
 *
 * @returns {void}
 */
export function openFileList(): void {
  if (!browserRows().length) return;
  activateFilesIndex(state.filesActive);
}

/**
 * Move the file-list cursor to a path from quick-open.
 *
 * @param path File path returned by the search.
 * @returns {void}
 */
export function focusFileByPath(path: string): void {
  const index = browserRows().findIndex((entry) => entry.path === path);
  if (index < 0) return;
  focusFilesIndex(index);
}

/**
 * Toggle one file checkbox.
 *
 * @param entry File row.
 * @param index Row index.
 * @param checked Next checked state.
 * @returns {void}
 */
export function toggleFile(entry: FileEntry, index: number, checked: boolean): void {
  state.filesActive = index;
  if (checked) state.filesSelected.add(entry.path);
  else state.filesSelected.delete(entry.path);
  renderFiles();
}

/**
 * Mark a missing drive row as the keyboard cursor.
 *
 * @param index Row index.
 * @returns {void}
 */
export function markFilesActive(index: number): void {
  state.filesActive = index;
  renderFiles();
}

export function goFilesUp(): void {
  if (state.filesParent) {
    loadFolder(state.filesParent, { elsewhere: state.filesElsewhere }).catch((error) => failFiles(error));
  }
}

export function refreshFiles(): void {
  const path = state.filesAtRoots ? "" : state.filesPath;
  loadFolder(path, { elsewhere: state.filesElsewhere && !state.filesAtRoots, refresh: true }).catch((error) => failFiles(error));
}

export function toggleFilesElsewhere(): void {
  if (state.filesElsewhere) loadFolder("").catch((error) => failFiles(error));
  else loadFolder("", { elsewhere: true }).catch((error) => failFiles(error));
}

export function openFilesCrumb(path: string): void {
  loadFolder(path, { elsewhere: state.filesElsewhere }).catch((error) => failFiles(error));
}

export function startMoveFiles(): void {
  const selected = selectedFiles();
  if (!selected.length) {
    state.filesError = t("files.chooseMove");
    renderFiles();
    return;
  }
  state.filesPick = "move";
  state.filesPickPaths = selected.map((entry) => entry.path);
  state.filesError = "";
  state.filesMessage = t("files.chooseDestination");
  renderFiles();
}

export function startMoveFolder(): void {
  state.filesPick = "move_folder";
  state.filesPickSource = state.filesPath;
  state.filesError = "";
  state.filesMessage = t("files.chooseDestination");
  renderFiles();
}

export function cancelFilesPick(): void {
  state.filesPick = null;
  state.filesPickPaths = [];
  state.filesPickSource = "";
  state.filesMessage = "";
  renderFiles();
}

export type FilesDialogAction = string;

export type FilesDialogSnapshot = {
  action: string;
  name: string;
  replacement: string;
  status: string;
  preview: FilesPayload | null;
  scope: "paths" | "crate";
};

/**
 * Current review-dialog fields.
 *
 * @returns Dialog snapshot.
 */
export function getFilesDialog(): FilesDialogSnapshot {
  return {
    action: filesAction,
    name: dialogName,
    replacement: dialogReplacement,
    status: dialogStatus,
    preview: filesPreview,
    scope: filesTagScope,
  };
}

/**
 * Open the review dialog for one file action.
 *
 * @param action File action.
 * @param trigger Control that opened the dialog.
 * @param scope Files selection or one crate's members.
 * @returns {void}
 */
export function openFilesDialog(
  action: string,
  trigger: EventTarget | null,
  scope: "paths" | "crate" = "paths",
): void {
  filesAction = action;
  filesTagScope = scope;
  filesPreview = null;
  filesTrigger = trigger instanceof HTMLElement ? trigger : null;
  dialogStatus = "";
  const selected = selectedFiles();
  dialogName = action === "rename" && selected.length === 1 ? selected[0]!.name : "";
  dialogReplacement = "";
  mountFiles();
  emitFiles();
  const dialog = el("files-dialog");
  if (typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();
  if (
    action === "delete" ||
    action === "move" ||
    action === "move_folder" ||
    action === "rename_from_tags"
  ) {
    el("files-cancel").focus();
    reviewFiles().catch((error) => {
      dialogStatus = failureOf(error).message;
      emitFiles();
    });
  } else if (action === "rename") {
    document.getElementById("files-name")?.focus();
  } else {
    document.getElementById("files-replacement")?.focus();
  }
}

export function setDialogName(value: string): void {
  dialogName = value;
  filesPreview = null;
  emitFiles();
}

export function setDialogReplacement(value: string): void {
  dialogReplacement = value;
  filesPreview = null;
  emitFiles();
}

export function setDialogStatus(value: string): void {
  dialogStatus = value;
  emitFiles();
}

/**
 * Ask for a preview and store the paths that would change.
 *
 * @returns {Promise<void>}
 */
export async function reviewFiles(): Promise<void> {
  const body = filesBody(false);
  dialogStatus = t("files.checking");
  emitFiles();
  const payload = await postJSON("/api/files", body);
  filesPreview = payload;
  dialogStatus = payload.ok ? "" : serverMessage(payload, t("files.notSaved"));
  if (payload.serato) bridge.applyStatus(payload.serato);
  emitFiles();
}

/**
 * Close the file dialog and return focus to the control that opened it.
 *
 * @returns {void}
 */
export function closeFilesDialog(): void {
  const trigger = filesTrigger;
  filesTrigger = null;
  filesTagScope = "paths";
  const dialog = document.getElementById("files-dialog");
  if (dialog instanceof HTMLDialogElement && dialog.open) dialog.close();
  if (trigger instanceof HTMLElement) trigger.focus();
  emitFiles();
}

/**
 * Save a confirmed file change and reload the folder and the library.
 *
 * @returns {Promise<void>}
 */
export async function confirmFiles(): Promise<void> {
  if (!filesPreview?.ok || !state.writable) return;
  dialogStatus = t("files.saving");
  emitFiles();
  const crateScope = filesAction === "rename_from_tags" && filesTagScope === "crate";
  try {
    const payload = await postJSON("/api/files", filesBody(true));
    if (payload.serato) bridge.applyStatus(payload.serato);
    closeFilesDialog();
    state.filesPick = null;
    state.filesPickPaths = [];
    state.filesPickSource = "";
    let message = payload.summary || t("files.updated");
    if (payload.warning) message = `${message} ${payload.warning}`;
    if (crateScope && state.mode !== "files") {
      bridge.setNotice(message);
      await bridge.reloadLibrary();
      return;
    }
    state.filesMessage = message;
    await loadFolder(payload.browse || state.filesPath || "", { keepMessage: true });
    await bridge.reloadLibrary();
    renderFiles();
  } catch (error) {
    if (failureOf(error).status === 409) bridge.lockDown(error);
    dialogStatus = failureOf(error).message;
    emitFiles();
  }
}

function filesBody(confirm: boolean): FilesBody {
  const body: FilesBody = { action: filesAction };
  if (confirm) body.confirm = true;
  if (filesAction === "rename") {
    const selected = selectedFiles();
    body.path = (selected[0]?.path || state.filesPickPaths[0]) as string;
    body.name = dialogName;
  } else if (filesAction === "move") {
    body.paths = state.filesPickPaths.length ? [...state.filesPickPaths] : selectedFiles().map((entry) => entry.path);
    body.destination = state.filesPath;
  } else if (filesAction === "move_folder") {
    body.path = state.filesPickSource || state.filesPath;
    body.destination = state.filesPath;
  } else if (filesAction === "replace") {
    const selected = selectedFiles();
    body.path = selected[0]?.path || "";
    body.replacement = dialogReplacement.trim();
  } else if (filesAction === "delete") {
    body.paths = selectedFiles().map((entry) => entry.path);
  } else if (filesAction === "rename_from_tags") {
    if (filesTagScope === "crate") {
      const crate = state.activeCrate;
      if (typeof crate === "number") {
        body.crate = crate;
        body.space = state.space;
      }
    } else {
      body.paths = selectedFiles().map((entry) => entry.path);
    }
  }
  return body;
}

export function startRename(trigger: EventTarget | null): void {
  if (selectedFiles().length !== 1) {
    state.filesError = t("files.chooseOneRename");
    renderFiles();
    return;
  }
  openFilesDialog("rename", trigger);
}

export function startRenameFromTags(trigger: EventTarget | null, scope: "paths" | "crate" = "paths"): void {
  if (scope === "paths" && !selectedFiles().length) {
    state.filesError = t("files.chooseRenameFromTags");
    renderFiles();
    return;
  }
  openFilesDialog("rename_from_tags", trigger, scope);
}

export function startReplace(trigger: EventTarget | null): void {
  if (selectedFiles().length !== 1) {
    state.filesError = t("files.chooseOneReplace");
    renderFiles();
    return;
  }
  openFilesDialog("replace", trigger);
}

export function startDelete(trigger: EventTarget | null): void {
  if (!selectedFiles().length) {
    state.filesError = t("files.chooseDelete");
    renderFiles();
    return;
  }
  openFilesDialog("delete", trigger);
}

export function confirmMoveHere(trigger: EventTarget | null): void {
  openFilesDialog(state.filesPick === "move_folder" ? "move_folder" : "move", trigger);
}
