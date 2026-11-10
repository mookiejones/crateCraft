/**
 * Actions the native desktop menu asks the page to run.
 *
 * The menu itself is built in desktop_menu.py. A click calls
 * window.seratoDesktop.run with an action id. python3 server.py has no
 * menu, and every action is still on the page.
 */

import { el } from "../dom";
import { openQuickOpen } from "./quick-open";
import { openCheatSheet } from "./shortcuts";
import { state } from "../state";
import { selectCrate, setMode } from "./views";

const CLICKS: Record<string, string> = {
  "new-crate": "crate-new",
  "rename-crate": "crate-rename",
  "delete-crate": "crate-delete",
  "import-playlist": "import-m3u",
  "export-playlist": "export-m3u",
  "export-rekordbox": "export-rekordbox",
  reload: "reload",
  settings: "open-settings",
  "rerun-setup": "rerun-wizard",
  merge: "merge-duplicates",
  "take-snapshot": "snapshots-take",
  "review-undo": "snapshots-undo-button",
  "open-logs": "open-logs",
  "copy-version": "copy-version",
  help: "open-help",
  "help-bug": "help-bug",
  "help-feature": "help-feature",
  "help-github": "help-github",
  "help-releases": "help-releases",
};

const VIEWS: Record<string, string> = {
  "view-crates": "crates",
  "view-history": "history",
  "view-stats": "stats",
  "view-files": "files",
  "view-missing": "missing",
  "view-duplicates": "duplicates",
  "view-stems": "stems",
  "view-health": "health",
  "view-scan": "scan",
  "view-bitrate": "bitrate",
  "view-tags": "tags",
  "view-snapshots": "snapshots",
  "view-gig": "gig",
  "view-portable": "portable",
  "view-drift": "drift",
};

/**
 * Run one menu action.
 *
 * An unknown id does nothing. Close and Minimize are handled by the
 * desktop process before this runs.
 *
 * @param action Action id from the menu.
 * @returns {void}
 */
export function runDesktopAction(action: string): void {
  if (action === "find") {
    openQuickOpen();
    return;
  }
  if (action === "focus-search") {
    const field = state.mode === "files" ? el("files-search") : el("search");
    field.focus();
    if (typeof field.select === "function") field.select();
    return;
  }
  if (action === "shortcuts") {
    openCheatSheet();
    return;
  }
  if (action === "about") {
    const dialog = el("settings-dialog");
    if (!dialog.open) dialog.showModal();
    const title = el("about-title");
    title.tabIndex = -1;
    title.focus();
    if (typeof title.scrollIntoView === "function") title.scrollIntoView({ block: "nearest" });
    return;
  }
  if (action === "view-all") {
    setMode("crates");
    selectCrate("all");
    return;
  }
  if (action === "related") {
    document.querySelector<HTMLInputElement>(".related-search input")?.focus();
    return;
  }
  if (action === "reset-width") {
    el("track-splitter").dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    return;
  }
  if (action.startsWith("space:")) {
    const select = el("space");
    select.value = action.slice("space:".length);
    select.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }
  const view = VIEWS[action];
  if (view) {
    setMode(view);
    return;
  }
  const id = CLICKS[action];
  if (!id) return;
  const node = document.getElementById(id);
  if (node instanceof HTMLElement) node.click();
}

/**
 * Publish the menu hook on window.
 *
 * Called once at startup. A second call replaces the hook.
 *
 * @returns {void}
 */
export function installDesktopActions(): void {
  const host = window as Window & { seratoDesktop?: { run(action: string): void } };
  host.seratoDesktop = { run: runDesktopAction };
}
