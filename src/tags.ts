/**
 * Tag spellings view: groups, preview, apply, and title cleanup.
 *
 * GET /api/tag-clusters lists genre and artist groups. POST preview
 * lists the rows a chosen spelling would rewrite. POST apply writes
 * through safe_write. Titles uses POST clean-preview and clean-apply.
 * Audio files are not rewritten. A newer load ignores a late response.
 *
 * Page text is in the locale catalogs under tags.*.
 */

import { failureOf, postJSON, readJSON } from "./api";
import type { TagClusterGroup, TagClusterPlan, TagClusters } from "./api-types";
import { bridge } from "./bridge";
import { el } from "./dom";
import { serverMessage, t } from "./i18n";
import { state } from "./state";
import {
  groupHeading,
  previewLines,
  previewSummary,
  spellingLabel,
  tagsSummary,
  titlesPreviewSummary,
  titlesSummary,
  titlesWrittenSummary,
  writtenSummary,
  type TagField,
} from "./tags-view";
import { buttonEl, inputEl, setTooltip } from "./tooltip";
import { tips } from "./tooltip-strings";

const LIST_CAP = 100;
const FIELD_BUTTONS = ["tags-genre", "tags-artist", "tags-titles", "tags-refresh"] as const;
const TITLE_KEY = "clean";

let latest: TagClusters | null = null;
let titlePlan: TagClusterPlan | null = null;
const plans = new Map<string, TagClusterPlan>();
const selectedByKey = new Map<string, string>();
let panelBusy = false;
let actionKey = "";

/**
 * Attach Genre, Artist, Titles, Check again, and the report actions.
 *
 * Called once at startup. A later call is a no-op.
 *
 * @returns {void}
 */
export function wireTags(): void {
  const panel = el("tags-panel");
  if (panel.dataset.tagsWired === "true") return;
  panel.dataset.tagsWired = "true";
  el("tags-genre").addEventListener("click", () => {
    if (currentField() === "genre") return;
    setField("genre");
    void loadTags();
  });
  el("tags-artist").addEventListener("click", () => {
    if (currentField() === "artist") return;
    setField("artist");
    void loadTags();
  });
  el("tags-titles").addEventListener("click", () => {
    if (currentField() === "titles") return;
    setField("titles");
    void loadTags();
  });
  el("tags-refresh").addEventListener("click", () => {
    void loadTags();
  });
  el("tags-report").addEventListener("change", (event) => {
    const input = (event.target as HTMLElement).closest("input[type='radio']");
    if (!(input instanceof HTMLInputElement) || !input.name.startsWith("tags-")) return;
    const key = input.name.slice("tags-".length);
    selectedByKey.set(key, input.value);
    plans.delete(key);
    if (latest) renderTagsReport(latest);
  });
  el("tags-report").addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-tags-action]");
    if (!button || button.disabled) return;
    if (button.dataset.tagsAction === "clean-apply") {
      void applyTitles();
      return;
    }
    const key = button.dataset.key ?? "";
    if (!key) return;
    if (button.dataset.tagsAction === "preview") void previewGroup(key);
    if (button.dataset.tagsAction === "apply") void applyGroup(key);
  });
}

/**
 * Ask for spelling groups of the open space and field.
 *
 * The previous report stays on screen until this reply arrives. Genre,
 * Artist, Titles, and Check again are disabled while the request runs.
 *
 * @returns {Promise<void>}
 */
export async function loadTags(): Promise<void> {
  const token = ++state.tagsToken;
  const field = currentField();
  plans.clear();
  selectedByKey.clear();
  beginBusy();
  let settle: "report" | "retry" | "none" = "none";
  try {
    if (field === "titles") {
      const payload = await postJSON<TagClusterPlan>("/api/tag-clusters", {
        action: "clean-preview",
        space: state.space,
      });
      if (token !== state.tagsToken) return;
      titlePlan = payload;
      latest = null;
      el("tags-status").textContent = titlesPreviewSummary(payload);
      settle = "report";
    } else {
      const response = await fetch(
        `/api/tag-clusters?space=${encodeURIComponent(state.space)}&field=${encodeURIComponent(field)}`,
      );
      if (token !== state.tagsToken) return;
      const payload = await readJSON<TagClusters>(response).catch((): null => null);
      if (token !== state.tagsToken) return;
      if (!response.ok || payload === null) {
        failStatus(serverMessage(payload, t("tags.unreadable")));
        settle = "retry";
        return;
      }
      latest = payload;
      titlePlan = null;
      el("tags-status").textContent = "";
      settle = "report";
    }
  } catch (error) {
    if (token !== state.tagsToken) return;
    if (error instanceof TypeError) failStatus(t("tags.unreachable"));
    else failStatus(failureOf(error).message);
    settle = "retry";
  } finally {
    if (token !== state.tagsToken) return;
    endBusy();
    if (settle === "report") paintReport();
    if (settle === "retry") el("tags-refresh").focus();
    if (settle === "report") el("tags-report").focus();
  }
}

/**
 * Show a tags failure in the status line.
 *
 * The report already on screen stays. Focus moves to Check again.
 *
 * @param error Failure from loadTags.
 * @returns {void}
 */
export function showTagsFailure(error: unknown): void {
  const message = error instanceof Error && error.message
    ? error.message
    : t("tags.unreadable");
  failStatus(message);
  endBusy();
  el("tags-refresh").focus();
}

/**
 * Paint the groups and the chosen spelling for each.
 *
 * Color is not the only signal: each row names the spelling in words.
 *
 * @param payload JSON from GET /api/tag-clusters.
 * @returns {void}
 */
export function renderTagsReport(payload: TagClusters): void {
  el("tags-scope").textContent = t("gig.wholeSpace");
  const field = currentField();
  const report = el("tags-report");
  const groups = payload.groups ?? [];
  const open = openKeys();
  const summary = document.createElement("p");
  summary.className = "gig-note";
  summary.textContent = tagsSummary(field, payload.values ?? 0, groups.length);
  report.replaceChildren(summary);
  if (!groups.length) return;
  groups.forEach((group, index) => {
    report.append(groupCard(group, index === 0 || open.has(group.key)));
  });
}

function paintReport(): void {
  if (currentField() === "titles") {
    if (titlePlan) renderTitleReport(titlePlan);
    return;
  }
  if (latest) renderTagsReport(latest);
}

function renderTitleReport(plan: TagClusterPlan): void {
  el("tags-scope").textContent = t("gig.wholeSpace");
  const report = el("tags-report");
  const summary = document.createElement("p");
  summary.className = "gig-note";
  summary.textContent = titlesSummary(plan.changes.length);
  report.replaceChildren(summary);
  const lines = previewLines(plan.changes);
  if (lines.length) {
    const diffs = document.createElement("ul");
    for (const line of lines.slice(0, LIST_CAP)) {
      const row = document.createElement("li");
      row.textContent = line;
      diffs.append(row);
    }
    report.append(diffs);
  }
  const actions = document.createElement("div");
  actions.className = "tags-actions";
  const apply = buttonEl(tips.tagsApplyTitles);
  apply.dataset.tagsAction = "clean-apply";
  apply.textContent = t("tags.apply");
  apply.disabled = !canApplyTitles(plan);
  actions.append(apply);
  report.append(actions);
}

/**
 * Paint the last report again in the active language.
 *
 * locale-wiring calls this on a language change. Nothing is fetched.
 *
 * @returns {void}
 */
export function repaintTags(): void {
  setField(currentField());
  el("tags-scope").textContent = t("gig.wholeSpace");
  paintReport();
}

async function previewGroup(key: string): Promise<void> {
  const group = groupByKey(key);
  const value = selectedValue(key);
  if (!group || !value) return;
  actionKey = key;
  paintReport();
  try {
    const plan = await postJSON<TagClusterPlan>("/api/tag-clusters", {
      action: "preview",
      space: state.space,
      field: currentField(),
      value,
    });
    plans.set(key, plan);
    el("tags-status").textContent = previewSummary(plan);
    paintReport();
    applyButton(key)?.focus();
  } catch (error) {
    failStatus(failureOf(error).message);
  } finally {
    actionKey = "";
    paintReport();
  }
}

async function applyGroup(key: string): Promise<void> {
  const plan = plans.get(key);
  const value = selectedValue(key);
  if (!plan || !value || plan.value !== value || !plan.changes.length || !state.writable) return;
  actionKey = key;
  panelBusy = true;
  beginBusy();
  paintReport();
  try {
    const written = await postJSON<TagClusterPlan>("/api/tag-clusters", {
      action: "apply",
      space: state.space,
      field: currentField(),
      value,
    });
    await bridge.reloadLibrary();
    actionKey = "";
    panelBusy = false;
    endBusy();
    await loadTags();
    el("tags-status").textContent = writtenSummary(written);
  } catch (error) {
    const failed = failureOf(error);
    failStatus(failed.message);
    if (failed.status === 409) {
      bridge.lockDown(error);
    }
  } finally {
    actionKey = "";
    panelBusy = false;
    endBusy();
    paintReport();
  }
}

async function applyTitles(): Promise<void> {
  const plan = titlePlan;
  if (!plan || !canApplyTitles(plan)) return;
  actionKey = TITLE_KEY;
  panelBusy = true;
  beginBusy();
  paintReport();
  try {
    const written = await postJSON<TagClusterPlan>("/api/tag-clusters", {
      action: "clean-apply",
      space: state.space,
    });
    await bridge.reloadLibrary();
    actionKey = "";
    panelBusy = false;
    endBusy();
    await loadTags();
    el("tags-status").textContent = titlesWrittenSummary(written);
  } catch (error) {
    const failed = failureOf(error);
    failStatus(failed.message);
    if (failed.status === 409) {
      bridge.lockDown(error);
    }
  } finally {
    actionKey = "";
    panelBusy = false;
    endBusy();
    paintReport();
  }
}

function currentField(): TagField {
  if (el("tags-titles").getAttribute("aria-pressed") === "true") return "titles";
  if (el("tags-artist").getAttribute("aria-pressed") === "true") return "artist";
  return "genre";
}

function setField(next: TagField): void {
  el("tags-genre").setAttribute("aria-pressed", String(next === "genre"));
  el("tags-artist").setAttribute("aria-pressed", String(next === "artist"));
  el("tags-titles").setAttribute("aria-pressed", String(next === "titles"));
  el("tags-hint").textContent = next === "titles" ? t("tags.introTitles") : t("tags.intro");
}

function beginBusy(): void {
  panelBusy = true;
  for (const id of FIELD_BUTTONS) {
    const button = el(id);
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
  }
  el("tags-panel").setAttribute("aria-busy", "true");
  el("tags-status").textContent = currentField() === "titles" ? t("tags.checkingTitles") : t("tags.checking");
  paintReport();
}

function endBusy(): void {
  panelBusy = false;
  for (const id of FIELD_BUTTONS) {
    const button = el(id);
    button.disabled = false;
    button.setAttribute("aria-busy", "false");
  }
  el("tags-panel").setAttribute("aria-busy", "false");
}

function canApplyTitles(plan: TagClusterPlan): boolean {
  return Boolean(plan.changes.length && state.writable && !panelBusy && actionKey !== TITLE_KEY);
}

function failStatus(message: string): void {
  el("tags-status").textContent = message;
}

function openKeys(): Set<string> {
  const keys = new Set<string>();
  for (const details of el("tags-report").querySelectorAll("details[data-key]")) {
    if (details instanceof HTMLDetailsElement && details.open && details.dataset.key) {
      keys.add(details.dataset.key);
    }
  }
  return keys;
}

function groupByKey(key: string): TagClusterGroup | undefined {
  return latest?.groups?.find((group) => group.key === key);
}

function selectedValue(key: string): string {
  const group = groupByKey(key);
  return selectedByKey.get(key) ?? group?.suggested ?? "";
}

function canApply(key: string): boolean {
  const plan = plans.get(key);
  const value = selectedValue(key);
  return Boolean(
    plan && plan.value === value && plan.changes.length && state.writable && !panelBusy && actionKey !== key,
  );
}

function applyButton(key: string): HTMLButtonElement | null {
  return el("tags-report").querySelector(`[data-tags-action="apply"][data-key="${cssEscape(key)}"]`);
}

function cssEscape(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") return CSS.escape(value);
  return value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

function groupCard(group: TagClusterGroup, open: boolean): HTMLDetailsElement {
  const details = document.createElement("details");
  details.className = "gig-group";
  details.open = open;
  details.dataset.key = group.key;
  const summary = document.createElement("summary");
  setTooltip(summary, tips.tagsGroup);
  summary.textContent = groupHeading(group);
  const list = document.createElement("ul");
  list.className = "tags-spellings";
  const chosen = selectedValue(group.key);
  for (const spelling of group.spellings) {
    list.append(spellingRow(group.key, spelling.value, spelling.count, spelling.value === group.suggested, spelling.value === chosen));
  }
  details.append(summary, list);
  const plan = plans.get(group.key);
  if (plan && plan.value === chosen) {
    const lines = previewLines(plan.changes);
    if (lines.length) {
      const diffs = document.createElement("ul");
      const shown = lines.slice(0, LIST_CAP);
      for (const line of shown) {
        const row = document.createElement("li");
        row.textContent = line;
        diffs.append(row);
      }
      details.append(diffs);
    }
  }
  details.append(groupActions(group.key, chosen, plan));
  return details;
}

function spellingRow(
  key: string,
  value: string,
  count: number,
  suggested: boolean,
  checked: boolean,
): HTMLLIElement {
  const row = document.createElement("li");
  const label = document.createElement("label");
  label.className = "tags-spelling";
  const radio = inputEl(tips.tagsSpelling);
  radio.type = "radio";
  radio.name = `tags-${key}`;
  radio.value = value;
  radio.checked = checked;
  radio.disabled = panelBusy;
  const text = document.createElement("span");
  text.textContent = spellingLabel(value, count, suggested);
  label.append(radio, text);
  row.append(label);
  return row;
}

function groupActions(key: string, value: string, plan: TagClusterPlan | undefined): HTMLDivElement {
  const actions = document.createElement("div");
  actions.className = "tags-actions";
  const preview = buttonEl(tips.tagsPreview);
  preview.dataset.tagsAction = "preview";
  preview.dataset.key = key;
  preview.textContent = t("tags.preview");
  preview.disabled = panelBusy || !value;
  const apply = buttonEl(tips.tagsApply);
  apply.dataset.tagsAction = "apply";
  apply.dataset.key = key;
  apply.textContent = t("tags.apply");
  apply.disabled = !canApply(key);
  if (plan && plan.value === value && !plan.changes.length) apply.disabled = true;
  actions.append(preview, apply);
  return actions;
}
