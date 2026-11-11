/**
 * Dual crate panes and save-this-list (#13).
 *
 * Split is page-only: two lists share the search and sort. Save view
 * posts POST /api/crate with action create and the focused list's ids
 * in one write. Serato must be quit for that write.
 */

import { failureOf, postJSON } from "../api";
import { el } from "../dom";
import { focusedView, paintDualChrome, saveViewIds } from "./dual-crate-view";
import { t } from "../i18n";
import { state } from "../state";
import { bindCrateActions } from "./crate-store";
import { loadLibrary, lockDown, renderList, selectCrate, setNotice } from "../ui/views";

interface CreateReply {
  id?: number;
  name?: string;
  added?: number;
  warning?: string | null;
}

let saving = false;

/**
 * Turn the second crate pane on or off.
 *
 * Opening split starts pane B on All tracks. Closing it keeps pane A.
 * Does not write the library.
 *
 * @returns {void}
 */
export function toggleSplit(): void {
  state.splitCrates = !state.splitCrates;
  if (state.splitCrates) {
    state.secondCrate = "all";
    state.focusedPane = "a";
  }
  renderList();
}

/**
 * Prompt for a name and save the focused list as a normal crate.
 *
 * An empty list does not write. POST /api/crate with action create and
 * assets. A 409 locks the page.
 *
 * @returns {Promise<void>}
 */
export async function saveFocusedView(): Promise<void> {
  if (saving || !state.writable) return;
  const assets = saveViewIds(focusedView());
  if (!assets.length) {
    setNotice(t("crates.saveViewEmpty"));
    return;
  }
  const name = prompt(t("crates.saveViewPrompt"));
  if (!name || !name.trim()) return;
  const source = state.splitCrates && state.focusedPane === "b" ? state.secondCrate : state.activeCrate;
  const parent = source === "all" ? state.rootId : source;
  saving = true;
  try {
    const result = await postJSON<CreateReply>("/api/crate", {
      action: "create",
      name: name.trim(),
      parent,
      assets,
      space: state.space,
    });
    setNotice(result.warning || t("crates.saveViewCreated", { count: Number(result.added) || assets.length }));
    await loadLibrary();
    if (typeof result.id === "number") selectCrate(result.id);
  } catch (error) {
    if (failureOf(error).status === 409) lockDown(error);
    else setNotice(failureOf(error).message);
  } finally {
    saving = false;
  }
}

/**
 * Attach Split and Save view, and focus a pane when its list is clicked.
 *
 * Called once from app.ts. Does not fetch.
 *
 * @returns {void}
 */
export function wireDualCrates(): void {
  el("crate-split").addEventListener("click", () => toggleSplit());
  el("crate-save-view").addEventListener("click", () => {
    saveFocusedView().catch((error) => setNotice(failureOf(error).message));
  });
  el("crate-pane-a").addEventListener("focusin", () => {
    if (!state.splitCrates || state.focusedPane === "a") return;
    state.focusedPane = "a";
    paintDualChrome();
  });
  el("crate-pane-b").addEventListener("focusin", () => {
    if (!state.splitCrates || state.focusedPane === "b") return;
    state.focusedPane = "b";
    paintDualChrome();
  });
}

bindCrateActions({
  split: toggleSplit,
  saveView: () => {
    saveFocusedView().catch((error) => setNotice(failureOf(error).message));
  },
});
