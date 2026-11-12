/**
 * Crate presets: the dialog, Refresh, and the refresh when the page opens (part 2 of #26).
 *
 * POST /api/smart-preset previews, creates, refreshes one crate, or
 * refreshes them all. The server saves a normal crate whose name ends in
 * ⟳ and refuses every write while Serato is running. A preview only reads.
 * A newer preview request makes a late answer be ignored.
 */

import { failureOf, postJSON } from "../api";
import type { PresetSpec } from "../api-types";
import { el } from "../dom";
import { t } from "../i18n";
import { presetName, readPresetForm, scopeCrate, syncPresetFields } from "./preset-view";
import { state } from "../state";
import { bindCrateActions } from "./crate-store";
import { mountSharedDialogs } from "../ui/shared-dialog-mount";
import { loadLibrary, lockDown, selectCrate, setNotice } from "../ui/views";

const PREVIEW_DELAY_MS = 250;

interface PreviewReply {
  count?: number;
}

interface CreateReply {
  id?: number;
  name?: string;
  added?: number;
  warning?: string | null;
}

interface RefreshReply {
  added?: number;
  removed?: number;
  warning?: string | null;
}

interface RefreshAllReply {
  changed?: number[];
  warning?: string | null;
}

let previewTimer = 0;
let previewToken = 0;
let creating = false;

/**
 * Name the crate field's placeholder after the preset in the form.
 *
 * @param {PresetSpec | null} preset The preset, or null.
 * @returns {void}
 */
function syncNamePlaceholder(preset: PresetSpec | null): void {
  el("preset-name").placeholder = preset ? presetName(preset) : "";
}

/**
 * Count the tracks the form's preset matches, without writing.
 *
 * @returns {Promise<void>}
 */
export async function previewPreset(): Promise<void> {
  const token = ++previewToken;
  const preset = readPresetForm();
  syncNamePlaceholder(preset);
  el("preset-create").disabled = !preset || creating;
  if (!preset) {
    el("preset-preview").textContent = "";
    return;
  }
  el("preset-preview").textContent = t("presets.counting");
  try {
    const reply = await postJSON<PreviewReply>("/api/smart-preset", { action: "preview", space: state.space, preset });
    if (token !== previewToken) return;
    el("preset-preview").textContent = t("presets.matches", { count: Number(reply.count) || 0 });
  } catch (error) {
    if (token !== previewToken) return;
    el("preset-preview").textContent = failureOf(error).message;
    el("preset-create").disabled = true;
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
    void previewPreset();
  }, PREVIEW_DELAY_MS);
}

/**
 * Open the preset dialog, filled from the selected track and crate.
 *
 * The key and BPM come from the selected track when it has them. When a
 * normal crate is selected, the preset is limited to it by default.
 *
 * @returns {Promise<void>}
 */
export async function openPresetDialog(): Promise<void> {
  mountSharedDialogs();
  if (!state.writable) {
    setNotice(el("status").textContent || "");
    return;
  }
  const track = state.selectedId == null ? undefined : state.byId.get(state.selectedId);
  el("preset-key").value = track?.key?.trim() || el("preset-key").value;
  const bpm = Number(track?.bpm);
  if (Number.isFinite(bpm) && bpm > 0) el("preset-bpm").value = String(Math.round(bpm * 10) / 10);
  const scope = scopeCrate();
  el("preset-scope-label").hidden = !scope;
  el("preset-scope").checked = Boolean(scope);
  el("preset-scope-text").textContent = scope ? t("presets.scope", { name: scope.name }) : "";
  el("preset-name").value = "";
  el("preset-status").textContent = "";
  syncPresetFields();
  if (!el("preset-dialog").open) el("preset-dialog").showModal();
  el("preset-kind").focus();
  await previewPreset();
}

/**
 * Save the form's preset as a new crate and select it.
 *
 * @returns {Promise<void>}
 */
export async function createPreset(): Promise<void> {
  mountSharedDialogs();
  const preset = readPresetForm();
  if (!preset || creating) return;
  creating = true;
  el("preset-create").disabled = true;
  el("preset-status").textContent = "";
  const name = el("preset-name").value.trim() || presetName(preset);
  try {
    const reply = await postJSON<CreateReply>("/api/smart-preset", { action: "create", space: state.space, preset, name });
    el("preset-dialog").close();
    const message = t("presets.created", { name: reply.name || name, count: Number(reply.added) || 0 });
    setNotice(reply.warning ? `${message} ${reply.warning}` : message);
    await loadLibrary();
    if (typeof reply.id === "number") selectCrate(reply.id);
  } catch (error) {
    el("preset-status").textContent = failureOf(error).message;
    if (failureOf(error).status === 409) {
      lockDown(error);
      el("preset-dialog").close();
    }
  } finally {
    creating = false;
    el("preset-create").disabled = !readPresetForm();
  }
}

/**
 * Pick the tracks of the selected preset crate again.
 *
 * @returns {Promise<void>}
 */
export async function refreshActivePreset(): Promise<void> {
  const id = state.activeCrate;
  if (id === "all" || !state.writable) return;
  const crate = state.crates.find((item) => item.id === id);
  try {
    const reply = await postJSON<RefreshReply>("/api/smart-preset", { action: "refresh", id });
    const message = t("presets.refreshed", {
      name: crate?.name ?? "",
      added: Number(reply.added) || 0,
      removed: Number(reply.removed) || 0,
    });
    setNotice(reply.warning ? `${message} ${reply.warning}` : message);
    await loadLibrary();
  } catch (error) {
    if (failureOf(error).status === 409) lockDown(error);
    else setNotice(failureOf(error).message);
    if (failureOf(error).status === 404) await loadLibrary();
  }
}

/**
 * Refresh every preset crate once when the page opens.
 *
 * Skipped while edits are not allowed or when there are no preset crates.
 * The server writes only when a crate changed. A refusal because Serato is
 * running stays quiet: the status line already says Serato is open.
 *
 * @returns {Promise<void>}
 */
export async function refreshPresetsOnOpen(): Promise<void> {
  if (!state.writable || Object.keys(state.presets).length === 0) return;
  try {
    const reply = await postJSON<RefreshAllReply>("/api/smart-preset", { action: "refresh_all" });
    const changed = reply.changed?.length ?? 0;
    if (!changed) return;
    const message = t("presets.refreshedOnOpen", { count: changed });
    setNotice(reply.warning ? `${message} ${reply.warning}` : message);
    await loadLibrary();
  } catch (error) {
    if (failureOf(error).status !== 409) setNotice(failureOf(error).message);
  }
}

/**
 * Wire the Preset and Refresh buttons and the dialog fields.
 *
 * Called once at startup. Does not fetch.
 *
 * @returns {void}
 */
export function wirePresets(): void {
  mountSharedDialogs();
  el("crate-preset").addEventListener("click", () => {
    openPresetDialog().catch((error) => setNotice(failureOf(error).message));
  });
  el("crate-refresh").addEventListener("click", () => {
    refreshActivePreset().catch((error) => setNotice(failureOf(error).message));
  });
  el("preset-kind").addEventListener("change", () => {
    syncPresetFields();
    void previewPreset();
  });
  for (const id of ["preset-key", "preset-bpm", "preset-range", "preset-months"] as const) {
    el(id).addEventListener("input", schedulePreview);
  }
  el("preset-scope").addEventListener("change", () => {
    void previewPreset();
  });
  el("preset-cancel").addEventListener("click", () => el("preset-dialog").close());
  el("preset-create").addEventListener("click", () => {
    createPreset().catch((error) => setNotice(failureOf(error).message));
  });
}

bindCrateActions({
  preset: () => {
    openPresetDialog().catch((error) => setNotice(failureOf(error).message));
  },
  refresh: () => {
    refreshActivePreset().catch((error) => setNotice(failureOf(error).message));
  },
});
