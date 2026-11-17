/**
 * Crate trees: the dialog that previews and creates BPM, key, or genre
 * subcrates (part 2 of #31).
 *
 * POST /api/crate-tree previews or creates. Preview only reads. Create
 * writes the parent and every non-empty subcrate through safe_write.
 * A newer preview request makes a late answer be ignored.
 */

import { failureOf, postJSON } from "../api";
import type { CrateTreeSpec } from "../api-types";
import { el } from "../dom";
import { t } from "../i18n";
import { isQueuedWrite } from "./queue-notice";
import {
  crateTreeHasChildren,
  crateTreePreviewText,
  defaultTreeName,
  readTreeForm,
  syncTreeFields,
  type CrateTreeChild,
  type CrateTreeCreateReply,
  type CrateTreePreviewReply,
} from "./crate-trees-view";
import { scopeCrate } from "./preset-view";
import { state } from "../state";
import { bindCrateActions } from "./crate-store";
import { mountSharedDialogs } from "../ui/shared-dialog-mount";
import { loadLibrary, lockDown, selectCrate, setNotice } from "../ui/views";

const PREVIEW_DELAY_MS = 250;

let previewTimer = 0;
let previewToken = 0;
let creating = false;

/**
 * Name the crate field's placeholder after the tree kind in the form.
 *
 * @param {CrateTreeSpec | null} tree The tree, or null.
 * @returns {void}
 */
function syncNamePlaceholder(tree: CrateTreeSpec | null): void {
  el("crate-tree-name").placeholder = tree ? defaultTreeName(tree.kind) : "";
}

/**
 * List the subcrates the form's tree would make, without writing.
 *
 * @returns {Promise<void>}
 */
export async function previewCrateTree(): Promise<void> {
  const token = ++previewToken;
  const tree = readTreeForm();
  syncNamePlaceholder(tree);
  el("crate-tree-create").disabled = true;
  if (!tree) {
    el("crate-tree-preview").textContent = "";
    return;
  }
  el("crate-tree-preview").textContent = t("crateTree.counting");
  try {
    const reply = await postJSON<CrateTreePreviewReply>("/api/crate-tree", {
      action: "preview",
      space: state.space,
      tree,
    });
    if (token !== previewToken) return;
    const children: CrateTreeChild[] = Array.isArray(reply.children) ? reply.children : [];
    el("crate-tree-preview").textContent = crateTreePreviewText(children);
    el("crate-tree-create").disabled = creating || !crateTreeHasChildren(children);
  } catch (error) {
    if (token !== previewToken) return;
    el("crate-tree-preview").textContent = failureOf(error).message;
    el("crate-tree-create").disabled = true;
  }
}

/**
 * Preview again after the person stops typing.
 *
 * @returns {void}
 */
function schedulePreview(): void {
  window.clearTimeout(previewTimer);
  previewTimer = window.setTimeout(() => {
    void previewCrateTree();
  }, PREVIEW_DELAY_MS);
}

/**
 * Open the crate-tree dialog.
 *
 * When a normal crate is selected, the tree is limited to it by default.
 *
 * @returns {Promise<void>}
 */
export async function openCrateTreeDialog(): Promise<void> {
  mountSharedDialogs();
  if (!state.writable) {
    setNotice(el("status").textContent || "");
    return;
  }
  const scope = scopeCrate();
  el("crate-tree-scope-label").hidden = !scope;
  el("crate-tree-scope").checked = Boolean(scope);
  el("crate-tree-scope-text").textContent = scope ? t("presets.scope", { name: scope.name }) : "";
  el("crate-tree-name").value = "";
  el("crate-tree-status").textContent = "";
  syncTreeFields();
  if (!el("crate-tree-dialog").open) el("crate-tree-dialog").showModal();
  el("crate-tree-kind").focus();
  await previewCrateTree();
}

/**
 * Save the form's tree as a parent crate plus subcrates, and select it.
 *
 * @returns {Promise<void>}
 */
export async function createCrateTree(): Promise<void> {
  mountSharedDialogs();
  const tree = readTreeForm();
  if (!tree || creating) return;
  creating = true;
  el("crate-tree-create").disabled = true;
  el("crate-tree-status").textContent = "";
  const name = el("crate-tree-name").value.trim() || defaultTreeName(tree.kind);
  try {
    const reply = await postJSON<CrateTreeCreateReply>("/api/crate-tree", {
      action: "create",
      space: state.space,
      tree,
      name,
    });
    el("crate-tree-dialog").close();
    if (isQueuedWrite(reply)) {
      setNotice(t("gigLock.queued"));
      return;
    }
    const count = Array.isArray(reply.children) ? reply.children.length : 0;
    const message = t("crateTree.created", { name: reply.name || name, count });
    setNotice(reply.warning ? `${message} ${reply.warning}` : message);
    await loadLibrary();
    if (typeof reply.id === "number") selectCrate(reply.id);
  } catch (error) {
    el("crate-tree-status").textContent = failureOf(error).message;
    if (failureOf(error).status === 409) {
      lockDown(error);
      el("crate-tree-dialog").close();
    }
  } finally {
    creating = false;
    const form = readTreeForm();
    el("crate-tree-create").disabled = !form;
  }
}

/**
 * Wire the Tree button and dialog fields.
 *
 * Called once at startup. Does not fetch.
 *
 * @returns {void}
 */
export function wireCrateTrees(): void {
  mountSharedDialogs();
  el("crate-tree").addEventListener("click", () => {
    openCrateTreeDialog().catch((error) => setNotice(failureOf(error).message, "error"));
  });
  el("crate-tree-kind").addEventListener("change", () => {
    syncTreeFields();
    void previewCrateTree();
  });
  for (const id of [
    "crate-tree-low",
    "crate-tree-high",
    "crate-tree-width",
    "crate-tree-step",
    "crate-tree-min-tracks",
    "crate-tree-limit",
  ] as const) {
    el(id).addEventListener("input", schedulePreview);
  }
  el("crate-tree-scope").addEventListener("change", () => {
    void previewCrateTree();
  });
  el("crate-tree-cancel").addEventListener("click", () => el("crate-tree-dialog").close());
  el("crate-tree-create").addEventListener("click", () => {
    createCrateTree().catch((error) => setNotice(failureOf(error).message, "error"));
  });
}

bindCrateActions({
  tree: () => {
    openCrateTreeDialog().catch((error) => setNotice(failureOf(error).message, "error"));
  },
});
