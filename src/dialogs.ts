/**
 * Dialogs for Rekordbox export, duplicate merge, crate replace, relink, and sharing.
 *
 * Importing this module does not open a dialog and does not fetch.
 * wireDialogs attaches the listeners. app.ts calls it once at startup.
 * Confirm still posts only after the person confirms.
 */

import { failureOf, getRelink, postJSON, readJSONOr } from "./api";
import type { LibraryStatusNotice, OpenOptions } from "./wizard-view";
import type {
  CratesReplacePreview,
  FilesPayload,
  LogsPayload,
  MergeCrate,
  MergeCueCopy,
  MergePreview,
  RelinkCandidate,
  RelinkMatch,
  RelinkPlan,
  SettingsPayload,
  Track,
} from "./api-types";
import { bridge } from "./bridge";
import { bindCrateActions } from "./crate-store";
import { el } from "./dom";
import { scoreQuery } from "./fuzzy";
import { applyLayout } from "./layout";
import { state } from "./state";
import { inputEl, selectEl, setTooltip } from "./tooltip";
import { keepCopy, openReplaceCopy, tips } from "./tooltip-strings";
import { openFilesDialog, startRenameFromTags } from "./files";
import { mountFilesIslands } from "./files-mount";
import {
  applyStatus,
  crateNamesFor,
  loadDuplicates,
  loadLibrary,
  lockDown,
  playlistCrate,
  selectTrack,
  selectedDuplicateGroup,
  setNotice,
} from "./views";
import { PSEUDO, getLocale, isLanguage, resolveLocale, serverMessage, setLocale, t } from "./i18n";

let rekordboxXml = "";
let mergePreview: MergePreview | null = null;
let mergeToken = 0;
let mergeLoading = false;
let replaceFromId: number | null = null;
let replaceToId: number | null = null;
let replacePreview: CratesReplacePreview | null = null;
let replaceToken = 0;
let replaceLoading = false;
let consentSettled = false;
let privacySync = false;
let appearanceSync = false;

const COLORWAYS = ["serato-like", "dark-club", "light", "classic"] as const;
const LEGACY_COLORWAYS: Record<string, (typeof COLORWAYS)[number]> = {
  motown: "classic",
  "deep-house": "classic",
  "daisy-age": "classic",
};

function isColorway(value: unknown): value is (typeof COLORWAYS)[number] {
  return typeof value === "string" && (COLORWAYS as readonly string[]).includes(value);
}

function resolveColorway(value: unknown): (typeof COLORWAYS)[number] {
  if (isColorway(value)) return value;
  if (typeof value === "string") {
    const mapped = LEGACY_COLORWAYS[value];
    if (mapped !== undefined) return mapped;
  }
  return "serato-like";
}
let relinkPlan: RelinkPlan | null = null;
let relinkLoading = false;
const relinkChosen = new Map<number, string>();
const relinkChecked = new Set<number>();

/**
 * Build the Rekordbox export URL for the current space and crate.
 *
 * The report form asks for the loss report as JSON. The file form is the
 * XML download, which starts only after the dialog is confirmed.
 * Hot loops sends ``hot_loops=1`` while the box is checked and
 * ``hot_loops=0`` while it is clear. The box starts clear.
 * wireDialogs loads the saved dialog options before the person exports.
 * Off Crates the crate is ``all``, but the Rekordbox button does not fetch.
 *
 * @param {boolean} report True asks for the loss report instead of the file.
 * @returns {string} The request path and query.
 */
export function rekordboxExportUrl(report: boolean) {
  const crate = playlistCrate() ?? "all";
  const memory = el("rekordbox-memory").checked ? "1" : "0";
  const hotLoops = el("rekordbox-hot-loops").checked ? "1" : "0";
  const key = el("rekordbox-key").value;
  const base = `/api/export.rekordbox.xml?space=${encodeURIComponent(state.space)}&crate=${encodeURIComponent(crate)}&memory=${memory}&hot_loops=${hotLoops}&key=${encodeURIComponent(key)}`;
  return report ? `${base}&report=1` : base;
}

/** Bumps when the Rekordbox options change, so a late settings response is ignored. */
let rekordboxToken = 0;
/** Bumps when a new report fetch starts, so a late report is ignored. */
let rekordboxReportToken = 0;

/**
 * Apply saved Rekordbox options to the three dialog controls.
 *
 * Only boolean cues and a known key notation are copied. A missing
 * section leaves the controls as they are. Does not fetch.
 *
 * @param {object} payload Settings object from the server.
 * @returns {void}
 */
export function applyRekordboxExport(payload: SettingsPayload): void {
  const section = payload.rekordbox;
  if (section == null) return;
  if (typeof section.hot_loops === "boolean") {
    el("rekordbox-hot-loops").checked = section.hot_loops;
  }
  if (typeof section.memory_cues === "boolean") {
    el("rekordbox-memory").checked = section.memory_cues;
  }
  if (
    section.key_notation === "asis"
    || section.key_notation === "camelot"
    || section.key_notation === "classical"
  ) {
    el("rekordbox-key").value = section.key_notation;
  }
}

/**
 * POST the Rekordbox dialog options.
 *
 * The body is the three controls as they are now. A failed request leaves
 * those controls in place, and the export reads them directly.
 *
 * @returns {Promise<void>}
 */
export async function saveRekordboxExport(): Promise<void> {
  const key = el("rekordbox-key").value;
  const notation = key === "camelot" || key === "classical" ? key : "asis";
  const token = ++rekordboxToken;
  try {
    const payload = await postJSON<SettingsPayload>("/api/settings", {
      rekordbox: {
        hot_loops: el("rekordbox-hot-loops").checked,
        memory_cues: el("rekordbox-memory").checked,
        key_notation: notation,
      },
    });
    if (token === rekordboxToken) applyRekordboxExport(payload);
  } catch {
    // The boxes stay as set. The export still uses them.
  }
}

/**
 * Fill the export dialog list with one item per loss-report line.
 *
 * Text is set with textContent. An empty report leaves the list empty.
 *
 * @param {string[]} lines Sentences from the export.
 * @returns {void}
 */
function fillRekordboxReport(lines: string[]) {
  const list = el("rekordbox-report");
  list.replaceChildren();
  for (const line of lines) {
    const item = document.createElement("li");
    item.textContent = line;
    list.append(item);
  }
}

/**
 * Fetch the loss report and XML, then open the dialog when it is closed.
 *
 * A later call ignores an earlier reply. Failure writes the dialog status
 * while the dialog is open, and the notice bar otherwise.
 *
 * @returns {void}
 */
function requestRekordboxReport(): void {
  const token = ++rekordboxReportToken;
  rekordboxXml = "";
  fetch(rekordboxExportUrl(true))
    .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
    .then(({ ok, body }) => {
      if (token !== rekordboxReportToken) return;
      if (!ok || typeof body.xml !== "string" || !body.xml.startsWith("<?xml")) {
        const message = serverMessage(body, t("rekordbox.failed"));
        if (el("rekordbox-dialog").open) el("rekordbox-status").textContent = message;
        else setNotice(message);
        return;
      }
      rekordboxXml = body.xml;
      fillRekordboxReport(body.report || []);
      el("rekordbox-status").textContent = "";
      if (!el("rekordbox-dialog").open) el("rekordbox-dialog").showModal();
    })
    .catch((error) => {
      if (token !== rekordboxReportToken) return;
      const message = failureOf(error).message;
      if (el("rekordbox-dialog").open) el("rekordbox-status").textContent = message;
      else setNotice(message);
    });
}

/**
 * Read the keep-copy radio the dialog currently has selected.
 *
 * Falls back to the track selected in the list. Does not fetch.
 *
 * @returns {number|null} Asset id, or null when no radio is checked.
 */
function selectedMergeKeepId() {
  const checked = el("merge-choices").querySelector<HTMLInputElement>("input:checked");
  if (checked) return Number(checked.value);
  return state.selectedId;
}

/**
 * Format one merge-preview value for the dialog.
 *
 * Empty values read as "empty". A date added includes the year and the
 * seconds, so two copies added in the same minute still look different.
 * Other values stay as the server sent them. Does not fetch.
 *
 * @param {string} field Column name.
 * @param {unknown} value Value from the plan.
 * @returns {string} Text for one side of a change.
 */
function previewFieldValue(field: string, value: string | number | null | undefined) {
  if (value == null || value === "") return "empty";
  if (field === "time_added") {
    const date = new Date(Number(value) * 1000);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      });
    }
  }
  return String(value);
}

/**
 * Name the frames a merge will copy.
 *
 * @param {object} copy Plan from ``cue_copy``.
 * @returns {string} "cues", "beatgrid", or both.
 */
function mergeCopyWhat(copy: MergeCueCopy): string {
  if (copy.markers && copy.beatgrid) return t("merge.copyCuesWhatBoth");
  if (copy.markers) return t("merge.copyCuesWhatMarkers");
  return t("merge.copyCuesWhatGrid");
}

/**
 * Build the planned or finished cue-copy sentence.
 *
 * @param {object} copy Plan from ``cue_copy``.
 * @param {boolean} done True after the frames have been written.
 * @returns {string} Localized sentence. No path.
 */
function mergeCopyLine(copy: MergeCueCopy, done: boolean): string {
  return t(done ? "merge.copiedCues" : "merge.copyCues", {
    file: copy.file ?? "",
    what: mergeCopyWhat(copy),
  });
}

/**
 * Show one merge plan in the dialog.
 *
 * The list is built with text nodes. File paths from the server are not
 * part of this payload. Does not fetch.
 *
 * @param {object|null} preview Plan from POST /api/duplicates/merge, or null while it loads.
 * @returns {void}
 */
export function renderMergePreview(preview: MergePreview | null) {
  el("merge-preview").replaceChildren();
  if (!preview) {
    const pending = document.createElement("p");
    pending.textContent = t("merge.readingPreview");
    el("merge-preview").append(pending);
    return;
  }
  const list = document.createElement("ul");
  list.className = "merge-preview";
  const added = preview.crates_added || [];
  const item = (text: string) => {
    const line = document.createElement("li");
    line.textContent = text;
    list.append(line);
  };
  if (added.length) {
    const names = added.map((crate) => (
      crate.space && crate.space !== state.space ? `${crate.name} (${crate.space})` : crate.name
    ));
    item(t("merge.addToCrates", { crates: names.join(", ") }));
  } else if ((preview.crates_kept || []).length) {
    item(t("merge.alreadyInCrates"));
  } else {
    item(t("merge.noCrates"));
  }
  for (const space of preview.spaces_added || []) item(t("merge.addToSpace", { space }));
  if ((preview.fields || []).length) {
    for (const field of preview.fields || []) {
      const before = previewFieldValue(field.field || "", field.before);
      const after = previewFieldValue(field.field || "", field.after);
      item(t("merge.fieldChange", { label: field.label ?? "", before, after }));
    }
  } else {
    item(t("merge.noFields"));
  }
  if (preview.history_repointed) {
    const count = Number(preview.history_entries) || 0;
    item(count
      ? t("merge.repointHistory", { count })
      : t("merge.noHistory"));
  } else {
    item(t("merge.noHistoryId"));
  }
  const removed = (preview.removed || []).length;
  item(t("merge.removeCopies", { count: removed }));
  for (const file of preview.files || []) {
    if (file.reason) item(`${file.file}: ${file.reason}`);
  }
  const copy = preview.cue_copy;
  if (copy && (copy.markers || copy.beatgrid) && copy.status !== "failed") {
    item(mergeCopyLine(copy, copy.status === "copied"));
  }
  el("merge-preview").append(list);
  if (preview.cue_warning) {
    const warning = document.createElement("p");
    warning.className = "merge-warning";
    warning.textContent = preview.cue_warning;
    el("merge-preview").append(warning);
  }
  const files = document.createElement("p");
  files.id = "merge-file-note";
  files.className = "dialog-note";
  el("merge-preview").append(files);
}

/**
 * Match the Trash checkbox and the confirm button to the current plan.
 *
 * The checkbox stays off, and stays disabled, unless a duplicate file can
 * be moved safely. Does not fetch.
 *
 * @returns {void}
 */
function syncTrashChoice() {
  const files = mergePreview?.files || [];
  const trashable = files.filter((file) => file.on_disk && !file.blocks_trash);
  const blocked = files.some((file) => file.blocks_trash);
  el("merge-trash").disabled = !mergePreview || mergeLoading || blocked || trashable.length === 0;
  if (el("merge-trash").disabled) el("merge-trash").checked = false;
  const danger = el("merge-trash").checked;
  el("merge-confirm").classList.toggle("danger", danger);
  el("merge-confirm").textContent = mergeLoading ? t("merge.merging") : (danger ? t("merge.confirmTrash") : t("merge.title"));
  setTooltip(
    el("merge-confirm"),
    mergeLoading ? tips.merging : (danger ? tips.mergeConfirmTrash : tips.mergeConfirm),
  );
  el("merge-confirm").disabled = mergeLoading || !mergePreview || mergePreview.writable === false;
  const note = el("merge-file-note");
  if (!note) return;
  if (danger) note.textContent = t("merge.trashFiles", { files: trashable.map((file) => file.file).join(", ") });
  else note.textContent = t("merge.filesStay");
}

/**
 * Ask for a merge plan for the selected keep copy.
 *
 * POST /api/duplicates/merge with preview true. A slow reply is ignored
 * when a newer choice has already been made. The dialog shows the error
 * and leaves the library unchanged.
 *
 * @returns {Promise<void>}
 */
async function refreshMergePreview() {
  const keepId = selectedMergeKeepId();
  const token = ++mergeToken;
  mergeLoading = false;
  mergePreview = null;
  el("merge-status").textContent = "";
  renderMergePreview(null);
  syncTrashChoice();
  el("merge-confirm").disabled = true;
  try {
    const preview = await postJSON("/api/duplicates/merge", {
      space: state.space,
      keep_id: keepId,
      preview: true,
    });
    if (token !== mergeToken) return;
    mergePreview = preview;
    renderMergePreview(preview);
    if (preview.writable === false) {
      el("merge-status").textContent = t("merge.quitSerato");
    }
    syncTrashChoice();
  } catch (error) {
    if (token !== mergeToken) return;
    mergePreview = null;
    el("merge-preview").replaceChildren();
    const failed = document.createElement("p");
    failed.textContent = t("merge.previewFailed");
    el("merge-preview").append(failed);
    el("merge-status").textContent = failureOf(error).message;
    syncTrashChoice();
  }
}

/**
 * Build the keep-copy radios for the selected duplicate group.
 *
 * The selected track starts checked. Changing the radio loads a new plan.
 * Does not write the library.
 *
 * @returns {void}
 */
function renderMergeChoices() {
  const group = selectedDuplicateGroup();
  el("merge-choices").replaceChildren();
  if (!group) return;
  for (const id of group.ids || []) {
    const track = state.byId.get(id) || { id, file: "", play_count: null, missing: false };
    const label = document.createElement("label");
    label.className = "merge-choice";
    label.htmlFor = `merge-keep-${id}`;
    const input = inputEl(keepCopy(track.file || `Track ${id}`));
    input.type = "radio";
    input.name = "merge-keep";
    input.id = `merge-keep-${id}`;
    input.value = String(id);
    input.checked = id === state.selectedId;
    input.addEventListener("change", () => {
      if (input.checked) refreshMergePreview().catch((error) => setNotice(failureOf(error).message));
    });
    const text = document.createElement("span");
    const name = document.createElement("span");
    name.textContent = track.file || t("track.numbered", { id: String(id) });
    const meta = document.createElement("span");
    meta.className = "merge-meta";
    const parts = [];
    if (track.play_count != null) parts.push(t("merge.plays", { count: Number(track.play_count) }));
    const crates = crateNamesFor(id);
    if (crates.length) parts.push(crates.join(", "));
    if (track.offline) parts.push(t("track.offlineBadge"));
    else if (track.missing) parts.push(t("track.missingBadge"));
    meta.textContent = parts.join(" · ");
    text.append(name, meta);
    label.append(input, text);
    el("merge-choices").append(label);
  }
}

/**
 * Open the merge dialog for the selected duplicate group.
 *
 * The Trash option starts off. The plan is loaded before Merge can be
 * pressed. Cancel closes the dialog without a request that writes.
 *
 * @returns {Promise<void>}
 */
async function openMergeDialog() {
  if (!selectedDuplicateGroup() || !state.writable) return;
  if (typeof el("merge-dialog").showModal !== "function") return;
  el("merge-trash").checked = false;
  el("merge-status").textContent = "";
  renderMergeChoices();
  if (!el("merge-dialog").open) el("merge-dialog").showModal();
  el("merge-cancel").focus();
  await refreshMergePreview();
}

/**
 * Merge the selected group into the chosen copy.
 *
 * POST /api/duplicates/merge with confirm true. Moving files also sends
 * confirm_delete_files. The button stays disabled until the request
 * finishes. A 409 locks the page and closes the dialog.
 *
 * @returns {Promise<void>}
 */
async function confirmMerge() {
  const keepId = selectedMergeKeepId();
  if (keepId == null || mergeLoading) return;
  const trash = el("merge-trash").checked;
  mergeLoading = true;
  syncTrashChoice();
  el("merge-status").textContent = "";
  try {
    const result = await postJSON("/api/duplicates/merge", {
      space: state.space,
      keep_id: keepId,
      confirm: true,
      delete_files: trash,
      confirm_delete_files: trash,
    });
    el("merge-dialog").close();
    const count = (result.removed || []).length;
    const name = result.kept?.file || t("merge.keptCopy");
    let message = t("merge.merged", { count, name });
    if (result.warning) message = `${message} ${result.warning}`;
    const copy = result.cue_copy;
    if (copy && (copy.markers || copy.beatgrid) && copy.status === "copied") {
      message = `${message} ${mergeCopyLine(copy, true)}`;
    }
    if (result.cue_warning) message = `${message} ${result.cue_warning}`;
    setNotice(message);
    state.selectedId = keepId;
    await loadLibrary();
    if (state.mode === "duplicates") await loadDuplicates();
    if (state.byId.has(keepId)) selectTrack(keepId);
  } catch (error) {
    el("merge-status").textContent = failureOf(error).message;
    if (failureOf(error).status === 409) {
      lockDown(error);
      el("merge-dialog").close();
    }
  } finally {
    mergeLoading = false;
    syncTrashChoice();
  }
}

const REPLACE_CHOICE_LIMIT = 12;

/**
 * Rank tracks that can sit in the original track's crates.
 *
 * The original is excluded. A blank query keeps library order. A scored
 * query uses file, title, and artist. A pinned id stays first.
 *
 * @param {number} fromId Track whose crate slots are copied.
 * @param {string} query Search text. Blank keeps library order.
 * @param {number} [toId] Replacement already chosen, kept first.
 * @returns {object[]} At most twelve tracks.
 */
export function rankReplaceCandidates(fromId: number, query: string, toId?: number): Track[] {
  const others = state.tracks.filter((track) => track.id !== fromId);
  const trimmed = query.trim();
  let ranked: Track[];
  if (!trimmed) {
    ranked = others.slice();
  } else {
    const scored: Array<{ track: Track; score: number }> = [];
    for (const track of others) {
      const haystack = [track.file, track.name, track.artist].filter(Boolean).join(" ");
      const score = scoreQuery(trimmed, haystack);
      if (score != null) scored.push({ track, score });
    }
    scored.sort((a, b) => b.score - a.score);
    ranked = scored.map((item) => item.track);
  }
  if (toId != null) {
    const pinned = others.find((track) => track.id === toId);
    if (pinned) ranked = [pinned, ...ranked.filter((track) => track.id !== toId)];
  }
  return ranked.slice(0, REPLACE_CHOICE_LIMIT);
}

function replaceCrateLabel(crate: MergeCrate): string {
  const name = crate.name || "";
  return crate.space && crate.space !== state.space ? `${name} (${crate.space})` : name;
}

/**
 * Show one crate-replace plan in the dialog.
 *
 * The list is built with text nodes. Does not fetch.
 *
 * @param {object|null} preview Plan from POST /api/replace-in-crates, or null while it loads.
 * @returns {void}
 */
export function renderCratesReplacePreview(preview: CratesReplacePreview | null): void {
  el("crates-replace-preview").replaceChildren();
  if (!preview) {
    const pending = document.createElement("p");
    pending.textContent = t("cratesReplace.readingPreview");
    el("crates-replace-preview").append(pending);
    return;
  }
  const list = document.createElement("ul");
  list.className = "merge-preview";
  const item = (text: string) => {
    const line = document.createElement("li");
    line.textContent = text;
    list.append(line);
  };
  const added = preview.crates_added || [];
  const kept = preview.crates_kept || [];
  const removed = preview.crates_removed || [];
  if (added.length) {
    item(t("cratesReplace.addToCrates", { crates: added.map(replaceCrateLabel).join(", ") }));
  } else if (kept.length) {
    item(t("cratesReplace.alreadyInCrates"));
  } else {
    item(t("cratesReplace.noCrates"));
  }
  if (preview.retire && removed.length) {
    item(t("cratesReplace.removeFromCrates", { crates: removed.map(replaceCrateLabel).join(", ") }));
  }
  el("crates-replace-preview").append(list);
}

function syncReplaceConfirm(): void {
  const writable = replacePreview?.writable !== false;
  el("crates-replace-confirm").disabled = (
    replaceLoading || replaceToId == null || !replacePreview || !writable
  );
  el("crates-replace-confirm").textContent = replaceLoading
    ? t("cratesReplace.updating")
    : t("cratesReplace.confirm");
  setTooltip(el("crates-replace-confirm"), tips.cratesReplaceConfirm);
}

function renderReplaceChoices(): void {
  const fromId = replaceFromId;
  el("crates-replace-choices").replaceChildren();
  if (fromId == null) return;
  const ranked = rankReplaceCandidates(fromId, el("crates-replace-search").value, replaceToId ?? undefined);
  for (const track of ranked) {
    const label = document.createElement("label");
    label.className = "merge-choice";
    label.htmlFor = `crates-replace-to-${track.id}`;
    const input = inputEl(openReplaceCopy(track.file || `Track ${track.id}`));
    input.type = "radio";
    input.name = "crates-replace-to";
    input.id = `crates-replace-to-${track.id}`;
    input.value = String(track.id);
    input.checked = track.id === replaceToId;
    input.addEventListener("change", () => {
      if (!input.checked) return;
      replaceToId = track.id;
      refreshReplacePreview().catch((error) => setNotice(failureOf(error).message));
    });
    const text = document.createElement("span");
    const name = document.createElement("span");
    name.textContent = track.file || t("track.numbered", { id: String(track.id) });
    const meta = document.createElement("span");
    meta.className = "merge-meta";
    const parts = [];
    if (track.artist) parts.push(track.artist);
    if (track.name && track.name !== track.file) parts.push(track.name);
    meta.textContent = parts.join(" · ");
    text.append(name, meta);
    label.append(input, text);
    el("crates-replace-choices").append(label);
  }
}

/**
 * Ask for a crate-replace plan for the chosen replacement.
 *
 * POST /api/replace-in-crates with preview true. A slow reply is ignored
 * when a newer choice has already been made.
 *
 * @returns {Promise<void>}
 */
async function refreshReplacePreview(): Promise<void> {
  const fromId = replaceFromId;
  const toId = replaceToId;
  const token = ++replaceToken;
  replaceLoading = false;
  replacePreview = null;
  el("crates-replace-status").textContent = "";
  if (fromId == null || toId == null) {
    el("crates-replace-preview").replaceChildren();
    const missing = document.createElement("p");
    missing.textContent = t("cratesReplace.noReplacement");
    el("crates-replace-preview").append(missing);
    syncReplaceConfirm();
    return;
  }
  renderCratesReplacePreview(null);
  syncReplaceConfirm();
  el("crates-replace-confirm").disabled = true;
  try {
    const preview = await postJSON<CratesReplacePreview>("/api/replace-in-crates", {
      space: state.space,
      from_id: fromId,
      to_id: toId,
      preview: true,
      retire: el("crates-replace-retire").checked,
    });
    if (token !== replaceToken) return;
    replacePreview = preview;
    renderCratesReplacePreview(preview);
    if (preview.writable === false) {
      el("crates-replace-status").textContent = t("cratesReplace.quitSerato");
    }
    syncReplaceConfirm();
  } catch (error) {
    if (token !== replaceToken) return;
    replacePreview = null;
    el("crates-replace-preview").replaceChildren();
    const failed = document.createElement("p");
    failed.textContent = t("cratesReplace.previewFailed");
    el("crates-replace-preview").append(failed);
    el("crates-replace-status").textContent = failureOf(error).message;
    syncReplaceConfirm();
  }
}

/**
 * Open the crate-replace dialog for one library track.
 *
 * Keep both starts on. The plan loads when a replacement is already
 * chosen. Cancel closes the dialog without a write.
 *
 * @param {number} fromId Track whose crate slots are copied.
 * @param {number} [toId] Replacement already chosen from Other copies.
 * @returns {Promise<void>}
 */
async function openCratesReplaceDialog(fromId: number, toId?: number): Promise<void> {
  if (!state.writable) return;
  if (typeof el("crates-replace-dialog").showModal !== "function") return;
  replaceFromId = fromId;
  replaceToId = toId ?? null;
  replacePreview = null;
  replaceLoading = false;
  el("crates-replace-keep").checked = true;
  el("crates-replace-retire").checked = false;
  el("crates-replace-search").value = "";
  el("crates-replace-status").textContent = "";
  renderReplaceChoices();
  if (!el("crates-replace-dialog").open) el("crates-replace-dialog").showModal();
  el("crates-replace-cancel").focus();
  await refreshReplacePreview();
}

/**
 * Put the replacement in the original track's crates.
 *
 * POST /api/replace-in-crates with confirm true. The button stays
 * disabled until the request finishes. A 409 locks the page and closes
 * the dialog.
 *
 * @returns {Promise<void>}
 */
async function confirmReplaceInCrates(): Promise<void> {
  const fromId = replaceFromId;
  const toId = replaceToId;
  if (fromId == null || toId == null || replaceLoading) return;
  replaceLoading = true;
  syncReplaceConfirm();
  el("crates-replace-status").textContent = "";
  try {
    const result = await postJSON<CratesReplacePreview>("/api/replace-in-crates", {
      space: state.space,
      from_id: fromId,
      to_id: toId,
      confirm: true,
      retire: el("crates-replace-retire").checked,
    });
    el("crates-replace-dialog").close();
    const added = (result.crates_added || []).length;
    const removed = (result.crates_removed || []).length;
    const name = result.to?.file || result.to?.name || t("cratesReplace.title");
    let message = added
      ? t("cratesReplace.placed", { count: added, name })
      : t("cratesReplace.nothingToDo");
    if (result.retire && removed) {
      message = `${message} ${t("cratesReplace.retired", { name: result.from?.file || result.from?.name || "" })}`;
    }
    if (!added && removed && result.retire) message = t("cratesReplace.updated");
    if (result.warning) message = `${message} ${result.warning}`;
    setNotice(message);
    await loadLibrary();
    if (state.byId.has(fromId)) selectTrack(fromId);
  } catch (error) {
    el("crates-replace-status").textContent = failureOf(error).message;
    if (failureOf(error).status === 409) {
      lockDown(error);
      el("crates-replace-dialog").close();
    }
  } finally {
    replaceLoading = false;
    syncReplaceConfirm();
  }
}

/**
 * Describe the current sharing choice in one sentence.
 *
 * The note sits under the settings checkbox. It does not include the
 * install id or any library data. No request is made.
 *
 * @returns {string} Status sentence for the settings dialog.
 */
function telemetryNoteText() {
  if (!state.telemetryConfigured) {
    return t("sharing.noKeys");
  }
  if (state.telemetryConsent === true) {
    return t("sharing.canSend");
  }
  return t("sharing.nothingSent");
}

/**
 * Apply a /api/settings payload to the checkbox and the note.
 *
 * privacySync keeps the checkbox assignment from posting the choice
 * again. A null consent leaves the checkbox off. No request is made.
 *
 * @param {object} payload Settings object from the server.
 * @returns {void}
 */
/**
 * Apply the saved language to the picker and the page.
 *
 * A payload without `language` leaves both alone. A saved code switches
 * the page to it. Null follows the OS language. The pseudo-locale from
 * the URL is kept, since it is only for layout checks. No request is made.
 *
 * @param {object} payload Settings object from the server.
 * @returns {void}
 */
export function applyLanguage(payload: SettingsPayload): void {
  if (!("language" in payload)) return;
  const saved = isLanguage(payload.language) ? payload.language : null;
  el("language-select").value = saved ?? "";
  if (getLocale() !== PSEUDO) setLocale(resolveLocale(saved, systemLanguages()));
}

function systemLanguages(): string[] {
  return Array.isArray(navigator.languages) && navigator.languages.length
    ? [...navigator.languages]
    : [navigator.language || "en"];
}

/**
 * Apply the saved theme to the picker, the page, and the icon preview.
 *
 * A payload without theme fields leaves the controls alone. The checkbox
 * defaults to on. The preview shows the colorway icon even when the
 * running icon stays the usual one. No request is made.
 *
 * @param payload Settings object from the server.
 * @returns {void}
 */
export function applyAppearance(payload: SettingsPayload): void {
  const hasColorway = "colorway" in payload;
  const hasFollow = "icon_follows_theme" in payload;
  const hasHref = "icon_href" in payload;
  if (!hasColorway && !hasFollow && !hasHref) return;
  const colorway = hasColorway ? resolveColorway(payload.colorway) : resolveColorway(el("colorway-select").value);
  const follow = hasFollow ? payload.icon_follows_theme !== false : el("icon-follows-theme").checked;
  appearanceSync = true;
  if (hasColorway) el("colorway-select").value = colorway;
  if (hasFollow) el("icon-follows-theme").checked = follow;
  appearanceSync = false;
  const shown = resolveColorway(el("colorway-select").value);
  document.documentElement.dataset.colorway = shown;
  const preview = el("colorway-preview");
  preview.src = `/img/icons/placeholder-${shown}.svg`;
  preview.alt = t("settings.colorwayPreview");
  const href = hasHref && typeof payload.icon_href === "string"
    ? payload.icon_href
    : follow
      ? `/img/icons/placeholder-${shown}.svg`
      : "/img/icons/default.svg";
  const icon = document.getElementById("app-icon");
  if (icon instanceof HTMLLinkElement) icon.href = href;
}

/** Sentence under the theme controls after a save. */
function iconStatusText(icon: SettingsPayload["icon"]): string {
  if (!icon) return t("settings.iconSaved");
  if (!icon.follows_theme) return t("settings.iconDefault");
  if (icon.applied && icon.target === "dock") return t("settings.iconAppliedDock");
  if (icon.applied && icon.target === "window") return t("settings.iconAppliedWindow");
  if (!icon.applied && (icon.reason === "unsupported" || icon.reason === "no-window")) {
    return t("settings.iconUnsupported");
  }
  return t("settings.iconSaved");
}

/**
 * Save the theme picked in Settings and paint it now.
 *
 * The page switches before the save answers. A failed save says so and
 * keeps the new theme for this session.
 *
 * @returns {Promise<void>}
 */
export async function saveColorway(): Promise<void> {
  if (appearanceSync) return;
  const value = el("colorway-select").value;
  if (!isColorway(value)) return;
  document.documentElement.dataset.colorway = value;
  el("colorway-preview").src = `/img/icons/placeholder-${value}.svg`;
  el("icon-status").textContent = "";
  try {
    const payload = await postJSON<SettingsPayload>("/api/settings", { colorway: value });
    applyAppearance(payload);
    el("icon-status").textContent = iconStatusText(payload.icon);
  } catch {
    el("icon-status").textContent = t("settings.iconNotSaved");
  }
}

/**
 * Save whether the running icon follows the theme.
 *
 * False is sent as false. A failed save says so and keeps the checkbox
 * where the person left it for this session.
 *
 * @returns {Promise<void>}
 */
export async function saveIconFollow(): Promise<void> {
  if (appearanceSync) return;
  const follow = el("icon-follows-theme").checked;
  el("icon-status").textContent = "";
  try {
    const payload = await postJSON<SettingsPayload>("/api/settings", { icon_follows_theme: follow });
    applyAppearance(payload);
    el("icon-status").textContent = iconStatusText(payload.icon);
  } catch {
    el("icon-status").textContent = t("settings.iconNotSaved");
  }
}

/**
 * Save the language picked in Settings and switch the page now.
 *
 * The page switches before the save answers, so the choice shows at once.
 * A failed save says so and keeps the new language for this session.
 *
 * @returns {Promise<void>}
 */
export async function saveLanguage(): Promise<void> {
  const value = el("language-select").value;
  const saved = isLanguage(value) ? value : null;
  el("language-status").textContent = "";
  setLocale(resolveLocale(saved, systemLanguages()));
  try {
    await postJSON("/api/settings", { language: saved });
  } catch {
    el("language-status").textContent = t("settings.languageNotSaved");
  }
}

/**
 * Paint open dialogs again in the active language.
 *
 * The merge plan, the sharing note, and the file dialog's confirm label
 * are built in code, so a language change repaints them here.
 *
 * @returns {void}
 */
export function repaintDialogs(): void {
  el("telemetry-note").textContent = telemetryNoteText();
  el("colorway-preview").alt = t("settings.colorwayPreview");
  if (el("merge-dialog").open) {
    renderMergePreview(mergeLoading ? null : mergePreview);
    syncTrashChoice();
  }
  if (el("crates-replace-dialog").open) {
    renderReplaceChoices();
    if (replaceToId == null) {
      el("crates-replace-preview").replaceChildren();
      const missing = document.createElement("p");
      missing.textContent = t("cratesReplace.noReplacement");
      el("crates-replace-preview").append(missing);
    } else {
      renderCratesReplacePreview(replaceLoading ? null : replacePreview);
    }
    syncReplaceConfirm();
  }
  if (el("relink-dialog").open) {
    fillRelinkBanner();
    renderRelinkRows();
  }
}

function applyPrivacy(payload: SettingsPayload) {
  state.telemetryConsent = payload.telemetry_consent ?? null;
  state.telemetryConfigured = Boolean(payload.telemetry_configured);
  state.wizardComplete = payload.wizard_complete === true;
  privacySync = true;
  el("telemetry-toggle").checked = state.telemetryConsent === true;
  privacySync = false;
  el("telemetry-note").textContent = telemetryNoteText();
}

/**
 * POST the sharing choice.
 *
 * False is sent as false. The button or checkbox stays disabled until
 * the response arrives. A failure leaves the previous choice in place
 * and shows what to do next.
 *
 * @param {boolean} value True to share, false to send nothing.
 * @param {HTMLElement} status Element that receives the result sentence.
 * @returns {Promise<boolean>} True when the server stored the choice.
 */
async function saveConsent(value: boolean, status: HTMLElement) {
  status.textContent = t("wizard.saving");
  try {
    const payload = await postJSON("/api/settings", { telemetry_consent: value });
    applyPrivacy(payload);
    status.textContent = value ? t("sharing.on") : t("sharing.off");
    return true;
  } catch (error) {
    status.textContent = t("wizard.consentFailed");
    return false;
  }
}

/**
 * Open the first-launch dialog when the person has not chosen yet.
 *
 * Focus moves to Don't share. Escape and a failed save are handled by
 * the dialog listeners. No library fields are included.
 *
 * @returns {void}
 */
function showConsent() {
  if (typeof el("consent-dialog").showModal !== "function") return;
  if (el("consent-dialog").open) return;
  consentSettled = false;
  el("consent-status").textContent = "";
  el("consent-dialog").showModal();
  el("consent-decline").focus();
}

/**
 * Open setup when it is not finished, or when Settings asks to run it again.
 *
 * The wizard script is a separate bundle. A missing script falls through
 * to the sharing dialog. No library rows are sent.
 *
 * @param force Show setup again after it was completed.
 * @param returnFocus Control to focus when setup closes.
 * @returns True when the wizard script is present.
 */
function openWizard(force: boolean, returnFocus: HTMLElement): boolean {
  const wizard = (globalThis as { SeratoWizard?: { open: (options: OpenOptions) => void } }).SeratoWizard;
  if (!wizard || typeof wizard.open !== "function") return false;
  const options: OpenOptions = {
    force,
    returnFocus,
    onSettings(payload) {
      applyPrivacy(payload);
    },
    onStatus(info: LibraryStatusNotice) {
      applyStatus({
        message: info.message,
        writable: info.writable,
        open: info.open,
      });
    },
  };
  wizard.open(options);
  return true;
}

/**
 * Load sharing settings and show the prompt when no choice is saved.
 *
 * GET /api/settings. A failure leaves sharing off and says so. It does
 * not block the library view. Setup, when it is not finished, asks the
 * sharing question itself.
 *
 * @returns {Promise<void>}
 */
export async function loadPrivacy() {
  const token = rekordboxToken;
  const response = await fetch("/api/settings");
  const payload = await readJSONOr<SettingsPayload>(response, {});
  if (!response.ok) throw new Error(serverMessage(payload, t("sharing.loadFailed")));
  applyPrivacy(payload);
  applyLanguage(payload);
  applyLayout(payload);
  applyAppearance(payload);
  if (token === rekordboxToken) applyRekordboxExport(payload);
  if (!state.wizardComplete && openWizard(false, el("search"))) return;
  if (payload.needs_consent_prompt) showConsent();
}

function relinkReason(reason: string): string {
  if (reason === "same name and size") return t("relink.reason.nameAndSize");
  if (reason === "same name") return t("relink.reason.name");
  if (reason === "same size") return t("relink.reason.size");
  if (reason === "folder moved") return t("relink.reason.folder");
  return t("relink.reason.unknown", { reason });
}

function relinkConfidence(value: string): string {
  if (value === "high") return t("relink.confidence.high");
  if (value === "medium") return t("relink.confidence.medium");
  if (value === "low") return t("relink.confidence.low");
  return value;
}

function chosenCandidate(match: RelinkMatch): RelinkCandidate | undefined {
  const candidates = match.candidates || [];
  const path = relinkChosen.get(match.asset_id);
  return candidates.find((item) => item.path === path) || candidates[0];
}

function selectedRelinkMatches(): { id: number; path: string }[] {
  const matches: { id: number; path: string }[] = [];
  for (const match of relinkPlan?.matches || []) {
    if (!relinkChecked.has(match.asset_id)) continue;
    const chosen = chosenCandidate(match);
    if (!chosen?.path) continue;
    matches.push({ id: match.asset_id, path: chosen.path });
  }
  return matches;
}

function fillRelinkBanner(): void {
  const banner = el("relink-banner");
  const parts: string[] = [];
  if (relinkPlan?.truncated) parts.push(t("relink.truncated"));
  const unavailable = relinkPlan?.unavailable_drives || [];
  if (unavailable.length) parts.push(t("relink.unavailable", { count: unavailable.length }));
  for (const remap of relinkPlan?.remaps || []) {
    parts.push(t("relink.remap", {
      from: remap.from || "",
      to: remap.to || "",
      count: remap.count || 0,
    }));
  }
  if (typeof relinkPlan?.scanned === "number") {
    parts.push(t("relink.scanned", { count: relinkPlan.scanned }));
  }
  banner.textContent = parts.join(" ");
  banner.hidden = parts.length === 0;
}

function syncRelinkConfirm(refreshStatus = true): void {
  const confirm = el("relink-confirm");
  const accept = el("relink-accept-high");
  const find = el("relink-find");
  const selected = selectedRelinkMatches();
  confirm.disabled = relinkLoading || !state.writable || selected.length === 0;
  accept.disabled = relinkLoading || !relinkPlan;
  find.disabled = relinkLoading || !state.writable;
  if (refreshStatus && !relinkLoading && selected.length) {
    el("relink-status").textContent = t("relink.selected", { count: selected.length });
  }
}

function renderRelinkRows(): void {
  const body = el("relink-rows");
  body.replaceChildren();
  const matches = (relinkPlan?.matches || []).filter((item) => (item.candidates || []).length > 0);
  el("relink-empty").hidden = matches.length > 0;
  el("relink-empty").textContent = relinkPlan ? t("relink.empty") : t("relink.none");
  for (const match of matches) {
    const candidates = match.candidates || [];
    const chosen = chosenCandidate(match);
    const row = document.createElement("tr");
    const includeCell = document.createElement("td");
    const box = inputEl(tips.relinkInclude);
    box.type = "checkbox";
    box.checked = relinkChecked.has(match.asset_id);
    box.setAttribute("aria-label", t("relink.include"));
    box.addEventListener("change", () => {
      if (box.checked) relinkChecked.add(match.asset_id);
      else relinkChecked.delete(match.asset_id);
      syncRelinkConfirm();
    });
    includeCell.append(box);

    const trackCell = document.createElement("td");
    const title = document.createElement("div");
    title.textContent = match.title || "";
    const artist = document.createElement("div");
    artist.textContent = match.artist || "";
    trackCell.append(title, artist);

    const matchCell = document.createElement("td");
    if (candidates.length > 1) {
      const select = selectEl(tips.relinkPick);
      select.setAttribute("aria-label", t("relink.pick"));
      for (const candidate of candidates) {
        const option = document.createElement("option");
        option.value = candidate.path;
        option.textContent = candidate.path;
        if (candidate.path === chosen?.path) option.selected = true;
        select.append(option);
      }
      select.addEventListener("change", () => {
        relinkChosen.set(match.asset_id, select.value);
        renderRelinkRows();
      });
      matchCell.append(select);
    } else {
      const path = document.createElement("span");
      path.textContent = chosen?.path || "";
      matchCell.append(path);
    }

    const confidenceCell = document.createElement("td");
    confidenceCell.textContent = relinkConfidence(chosen?.confidence || "");
    const whyCell = document.createElement("td");
    whyCell.textContent = relinkReason(chosen?.reason || "");
    row.append(includeCell, trackCell, matchCell, confidenceCell, whyCell);
    body.append(row);
  }
  syncRelinkConfirm();
}

function seedRelinkChoices(plan: RelinkPlan): void {
  relinkChosen.clear();
  relinkChecked.clear();
  for (const match of plan.matches || []) {
    const first = (match.candidates || [])[0];
    if (!first) continue;
    relinkChosen.set(match.asset_id, first.path);
    if (first.confidence === "high") relinkChecked.add(match.asset_id);
  }
}

function acceptRelinkHigh(): void {
  for (const match of relinkPlan?.matches || []) {
    const chosen = chosenCandidate(match);
    if (chosen?.confidence === "high" && chosen.path) {
      relinkChecked.add(match.asset_id);
    }
  }
  renderRelinkRows();
}

async function scanRelink(): Promise<void> {
  if (relinkLoading || !state.writable) return;
  relinkLoading = true;
  el("relink-status").textContent = t("relink.finding");
  syncRelinkConfirm();
  try {
    const plan = await getRelink(state.space, el("relink-root").value);
    relinkPlan = plan;
    seedRelinkChoices(plan);
    fillRelinkBanner();
    renderRelinkRows();
    el("relink-status").textContent = "";
    syncRelinkConfirm();
  } catch (error) {
    el("relink-status").textContent = failureOf(error).message;
  } finally {
    relinkLoading = false;
    syncRelinkConfirm();
  }
}

async function openRelinkDialog(): Promise<void> {
  if (!state.writable) return;
  if (typeof el("relink-dialog").showModal !== "function") return;
  el("relink-status").textContent = "";
  if (!el("relink-dialog").open) el("relink-dialog").showModal();
  el("relink-cancel").focus();
  await scanRelink();
}

async function confirmRelink(): Promise<void> {
  const matches = selectedRelinkMatches();
  if (!matches.length || relinkLoading) return;
  relinkLoading = true;
  el("relink-confirm").disabled = true;
  el("relink-status").textContent = t("relink.previewing");
  try {
    const preview = await postJSON<FilesPayload>("/api/files", { action: "relink", matches });
    if (preview.serato) applyStatus(preview.serato);
    if (!preview.ok) {
      el("relink-status").textContent = preview.error || t("files.notSaved");
      return;
    }
    el("relink-status").textContent = preview.summary || t("relink.relinking");
    const result = await postJSON<FilesPayload>("/api/files", { action: "relink", matches, confirm: true });
    if (result.serato) applyStatus(result.serato);
    el("relink-dialog").close();
    let message = t("relink.done", { count: matches.length });
    if (result.summary) message = result.summary;
    if (result.warning) message = `${message} ${result.warning}`;
    setNotice(message);
    await loadLibrary();
  } catch (error) {
    el("relink-status").textContent = failureOf(error).message;
    if (failureOf(error).status === 409) {
      lockDown(error);
      el("relink-dialog").close();
    }
  } finally {
    relinkLoading = false;
    syncRelinkConfirm(false);
  }
}

/**
 * Attach dialog listeners for export, merge, sharing, logs, and files.
 *
 * Called once from app.ts. A listener opens a dialog or posts only after
 * the matching control is used.
 *
 * @returns {void}
 */
export function wireDialogs(): void {
  const saveExportBar = () => {
    saveRekordboxExport().catch(() => {
      // saveRekordboxExport already keeps the boxes. This catch is the listener boundary.
    });
    if (el("rekordbox-dialog").open) requestRekordboxReport();
  };
  el("rekordbox-hot-loops").addEventListener("change", saveExportBar);
  el("rekordbox-memory").addEventListener("change", saveExportBar);
  el("rekordbox-key").addEventListener("change", saveExportBar);
  loadPrivacy().catch((error: unknown) => {
    setNotice(failureOf(error).message || t("sharing.loadFailedOff"));
  });
  el("export-rekordbox").addEventListener("click", () => {
    if (playlistCrate() == null) return;
    requestRekordboxReport();
  });

  el("rekordbox-cancel").addEventListener("click", () => {
    rekordboxXml = "";
    el("rekordbox-dialog").close();
  });

  el("rekordbox-download").addEventListener("click", () => {
    if (!rekordboxXml.startsWith("<?xml")) {
      el("rekordbox-status").textContent = t("rekordbox.notXml");
      return;
    }
    const blob = new Blob([rekordboxXml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "rekordbox.xml";
    link.click();
    // Safari and Firefox need the object URL until the download has started.
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    rekordboxXml = "";
    el("rekordbox-dialog").close();
  });
  el("merge-duplicates").addEventListener("click", () => {
    openMergeDialog().catch((error) => setNotice(failureOf(error).message));
  });
  el("open-relink").addEventListener("click", () => {
    openRelinkDialog().catch((error) => setNotice(failureOf(error).message));
  });
  el("relink-cancel").addEventListener("click", () => el("relink-dialog").close());
  el("relink-find").addEventListener("click", () => {
    scanRelink().catch((error) => {
      el("relink-status").textContent = failureOf(error).message;
    });
  });
  el("relink-accept-high").addEventListener("click", () => acceptRelinkHigh());
  el("relink-confirm").addEventListener("click", () => {
    confirmRelink().catch((error) => setNotice(failureOf(error).message));
  });
  el("merge-cancel").addEventListener("click", () => el("merge-dialog").close());
  el("merge-confirm").addEventListener("click", () => {
    confirmMerge().catch((error) => setNotice(failureOf(error).message));
  });
  el("merge-trash").addEventListener("change", () => syncTrashChoice());
  el("crates-replace-cancel").addEventListener("click", () => el("crates-replace-dialog").close());
  el("crates-replace-confirm").addEventListener("click", () => {
    confirmReplaceInCrates().catch((error) => setNotice(failureOf(error).message));
  });
  el("crates-replace-search").addEventListener("input", () => {
    renderReplaceChoices();
  });
  el("crates-replace-keep").addEventListener("change", () => {
    if (el("crates-replace-keep").checked) {
      refreshReplacePreview().catch((error) => setNotice(failureOf(error).message));
    }
  });
  el("crates-replace-retire").addEventListener("change", () => {
    if (el("crates-replace-retire").checked) {
      refreshReplacePreview().catch((error) => setNotice(failureOf(error).message));
    }
  });
  el("consent-decline").addEventListener("click", () => {
    saveConsent(false, el("consent-status")).then((ok) => {
      if (!ok) return;
      consentSettled = true;
      el("consent-dialog").close();
    });
  });

  el("consent-accept").addEventListener("click", () => {
    saveConsent(true, el("consent-status")).then((ok) => {
      if (!ok) return;
      consentSettled = true;
      el("consent-dialog").close();
    });
  });

  el("consent-dialog").addEventListener("close", () => {
    if (consentSettled || state.telemetryConsent !== null) return;
    saveConsent(false, el("consent-status")).then((ok) => {
      if (ok) {
        consentSettled = true;
        return;
      }
      el("consent-dialog").showModal();
    });
  });

  el("open-settings").addEventListener("click", () => {
    el("settings-status").textContent = "";
    el("log-fallback").hidden = true;
    el("telemetry-note").textContent = telemetryNoteText();
    el("settings-dialog").showModal();
  });

  el("language-select").addEventListener("change", () => {
    void saveLanguage();
  });

  el("colorway-select").addEventListener("change", () => {
    void saveColorway();
  });

  el("icon-follows-theme").addEventListener("change", () => {
    void saveIconFollow();
  });

  el("settings-close").addEventListener("click", () => {
    el("settings-dialog").close();
  });

  el("rerun-wizard").addEventListener("click", () => {
    el("settings-dialog").close();
    openWizard(true, el("open-settings"));
  });

  el("telemetry-toggle").addEventListener("change", () => {
    if (privacySync) return;
    const want = el("telemetry-toggle").checked;
    el("telemetry-toggle").disabled = true;
    saveConsent(want, el("settings-status")).then((ok) => {
      el("telemetry-toggle").disabled = false;
      if (ok) {
        consentSettled = true;
        return;
      }
      privacySync = true;
      el("telemetry-toggle").checked = state.telemetryConsent === true;
      privacySync = false;
    });
  });

  el("open-logs").addEventListener("click", () => {
    const button = el("open-logs");
    button.disabled = true;
    el("settings-status").textContent = t("wizard.opening");
    postJSON("/api/logs/open", {})
      .then(() => {
        el("settings-status").textContent = t("logs.opened");
      })
      .catch(() => {
        el("settings-status").textContent = t("logs.openFailed");
      })
      .finally(() => {
        button.disabled = false;
      });
  });

  el("copy-logs").addEventListener("click", async () => {
    const button = el("copy-logs");
    button.disabled = true;
    el("settings-status").textContent = t("logs.copying");
    try {
      const response = await fetch("/api/logs");
      const payload = await readJSONOr<LogsPayload>(response, {});
      if (!response.ok) throw new Error(serverMessage(payload, t("logs.copyFailed")));
      const text = payload.text || "";
      if (!text) {
        el("settings-status").textContent = t("logs.empty");
        return;
      }
      let copied = false;
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(text);
          copied = true;
        } catch (error) {
          copied = false;
        }
      }
      if (copied) {
        el("log-fallback").hidden = true;
        el("settings-status").textContent = payload.truncated
          ? t("logs.copiedTruncated")
          : t("logs.copied");
        return;
      }
      el("log-fallback").hidden = false;
      el("log-fallback").value = text;
      el("log-fallback").focus();
      el("log-fallback").select();
      el("settings-status").textContent = t("logs.copyManual");
    } catch (error) {
      el("settings-status").textContent = t("logs.copyFailed");
    } finally {
      button.disabled = false;
    }
  });
  mountFilesIslands();
  el("crate-rename-from-tags").addEventListener("click", (event) => {
    const crate = state.activeCrate;
    if (typeof crate !== "number") return;
    startRenameFromTags(event.currentTarget, "crate");
  });
}

bridge.openMergeDialog = openMergeDialog;
bridge.openReplaceInCratesDialog = openCratesReplaceDialog;

/**
 * Open the first-run wizard from the Files empty state.
 *
 * Cancel leaves the saved setup flag as it was. The button that opened
 * setup takes focus back when the wizard closes.
 *
 * @returns {void}
 */
function openSetup(): void {
  const trigger = document.getElementById("files-run-setup");
  openWizard(true, trigger instanceof HTMLElement ? trigger : el("search"));
}

bridge.openSetup = openSetup;

bindCrateActions({
  renameFromTags: (button) => {
    const crate = state.activeCrate;
    if (typeof crate !== "number") return;
    openFilesDialog("rename_from_tags", button, "crate");
  },
  exportRekordbox: () => {
    if (playlistCrate() == null) return;
    requestRekordboxReport();
  },
});
