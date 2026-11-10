/**
 * Read-only library health report view.
 *
 * Typed against the fields GET /api/library-health returns. The request
 * does not write. A newer selection ignores a late response. The report
 * is painted with text nodes. Missing, duplicate, and unused sections
 * open those views. A track row opens Crates on that id.
 *
 * Page text is in the locale catalogs under health.*.
 */

import { readJSON } from "./api";
import type {
  LibraryHealthDuplicateGroup,
  LibraryHealthReport,
  LibraryHealthSection,
  LibraryHealthTrack,
} from "./api-types";
import { el } from "./dom";
import { serverMessage, t, type MessageKey } from "./i18n";
import { state } from "./state";
import { buttonEl } from "./tooltip";
import { tips } from "./tooltip-strings";

type HealthAction = "missing" | "duplicates" | "track" | "files" | "bitrate";

const SECTIONS: Array<{
  key: "missing" | "no_bpm" | "no_key" | "no_beatgrid" | "no_artwork" | "empty_genre" | "no_crate";
  label: MessageKey;
  action?: "missing";
}> = [
  { key: "missing", label: "health.missing", action: "missing" },
  { key: "no_bpm", label: "health.noBpm" },
  { key: "no_key", label: "health.noKey" },
  { key: "no_beatgrid", label: "health.noBeatgrid" },
  { key: "no_artwork", label: "health.noArtwork" },
  { key: "empty_genre", label: "health.emptyGenre" },
  { key: "no_crate", label: "health.noCrate" },
];

let latest: LibraryHealthReport | null = null;
let go: ((action: HealthAction, id?: number) => void) | null = null;

/**
 * Attach Check again and the report's open links.
 *
 * Called once at startup. A later call is a no-op.
 *
 * @param navigate Open Missing files, Duplicates, or a track in Crates.
 * @returns {void}
 */
export function wireHealth(navigate: (action: HealthAction, id?: number) => void): void {
  go = navigate;
  const panel = el("health-panel");
  if (panel.dataset.healthWired === "true") return;
  panel.dataset.healthWired = "true";
  el("health-refresh").addEventListener("click", () => {
    void loadHealth();
  });
  panel.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest("button");
    if (!(button instanceof HTMLButtonElement)) return;
    const action = button.dataset.healthAction;
    if (action === "missing" || action === "duplicates" || action === "files" || action === "bitrate") {
      go?.(action);
      return;
    }
    if (action === "track") {
      const id = Number(button.dataset.healthId);
      if (Number.isInteger(id) && id > 0) go?.("track", id);
    }
  });
}

/**
 * Ask for a read-only health report of the open space and crate.
 *
 * The previous report stays on screen until this reply arrives. Check
 * again is disabled while the request runs.
 *
 * @returns {Promise<void>}
 */
export async function loadHealth(): Promise<void> {
  const token = ++state.healthToken;
  beginBusy();
  let settle: "report" | "retry" | "none" = "none";
  const crate = state.activeCrate === "all" ? "all" : String(state.activeCrate);
  try {
    const response = await fetch(
      `/api/library-health?space=${encodeURIComponent(state.space)}&crate=${encodeURIComponent(crate)}`,
    );
    if (token !== state.healthToken) return;
    const payload = await readJSON<LibraryHealthReport>(response).catch((): null => null);
    if (token !== state.healthToken) return;
    if (!response.ok || payload === null) {
      failStatus(serverMessage(payload, t("health.unreadable")));
      settle = "retry";
      return;
    }
    latest = payload;
    el("health-status").textContent = "";
    renderHealthReport(payload);
    settle = "report";
  } catch {
    if (token !== state.healthToken) return;
    failStatus(t("health.unreachable"));
    settle = "retry";
  } finally {
    if (token !== state.healthToken) return;
    endBusy();
    if (settle === "retry") el("health-refresh").focus();
    if (settle === "report") el("health-report").focus();
  }
}

/**
 * Show a health-report failure in the status line.
 *
 * The report already on screen stays. Focus moves to Check again.
 *
 * @param error Failure from loadHealth.
 * @returns {void}
 */
export function showHealthFailure(error: unknown): void {
  const message = error instanceof Error && error.message
    ? error.message
    : t("health.unreadable");
  failStatus(message);
  endBusy();
  el("health-refresh").focus();
}

/**
 * Paint the counts and sample rows.
 *
 * Color is not the only signal: each section names the problem in words.
 *
 * @param payload JSON from GET /api/library-health.
 * @returns {void}
 */
export function renderHealthReport(payload: LibraryHealthReport): void {
  el("health-scope").textContent = scopeLabel();
  const report = el("health-report");
  const summary = document.createElement("p");
  summary.className = "gig-note";
  summary.textContent = t("health.summary", { count: payload.checked });
  report.replaceChildren(summary);
  let listed = 0;
  for (const spec of SECTIONS) {
    listed += paintSection(report, t(spec.label), payload[spec.key], spec.action);
  }
  listed += paintUnused(report, payload.unused);
  listed += paintDuplicates(report, payload.duplicates);
  if (!listed) report.append(noteLine(t("health.clear")));
  paintBitrateLink(report);
}

/**
 * Paint the last report again in the active language.
 *
 * locale-wiring calls this on a language change. Nothing is fetched.
 *
 * @returns {void}
 */
export function repaintHealth(): void {
  el("health-scope").textContent = scopeLabel();
  if (latest) renderHealthReport(latest);
}

function beginBusy(): void {
  const button = el("health-refresh");
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  el("health-panel").setAttribute("aria-busy", "true");
  el("health-status").textContent = t("health.checking");
}

function endBusy(): void {
  const button = el("health-refresh");
  button.disabled = false;
  button.setAttribute("aria-busy", "false");
  el("health-panel").setAttribute("aria-busy", "false");
}

function failStatus(message: string): void {
  el("health-status").textContent = message;
}

function scopeLabel(): string {
  if (state.activeCrate === "all") return t("gig.wholeSpace");
  const crate = state.crates.find((row) => row.id === state.activeCrate);
  return crate?.name || t("gig.wholeSpace");
}

function noteLine(text: string): HTMLParagraphElement {
  const line = document.createElement("p");
  line.className = "gig-note";
  line.textContent = text;
  return line;
}

function paintSection(
  report: HTMLElement,
  label: string,
  section: LibraryHealthSection | undefined,
  action?: "missing",
): number {
  const count = section?.count ?? 0;
  const tracks = section?.tracks ?? [];
  const details = document.createElement("details");
  details.className = "gig-group";
  details.open = count > 0;
  const heading = document.createElement("summary");
  heading.textContent = t("gig.groupCount", { label, count });
  details.append(heading);
  if (action === "missing") details.append(openButton("missing", "health.openMissing", tips.healthOpenMissing));
  const list = document.createElement("ul");
  for (const track of tracks) list.append(trackItem(track));
  details.append(list);
  if (count > tracks.length) {
    details.append(noteLine(t("health.more", { count: count - tracks.length })));
  }
  report.append(details);
  return count;
}

function paintUnused(
  report: HTMLElement,
  section: LibraryHealthReport["unused"] | undefined,
): number {
  const count = section?.count ?? 0;
  const files = section?.files ?? [];
  const details = document.createElement("details");
  details.className = "gig-group";
  details.open = count > 0;
  const heading = document.createElement("summary");
  heading.textContent = t("gig.groupCount", { label: t("health.unused"), count });
  details.append(heading);
  details.append(openButton("files", "health.openFiles", tips.healthOpenFiles));
  const list = document.createElement("ul");
  for (const row of files) {
    const item = document.createElement("li");
    item.textContent = t("health.fileRow", { file: row.file });
    list.append(item);
  }
  details.append(list);
  if (count > files.length) {
    details.append(noteLine(t("health.more", { count: count - files.length })));
  }
  report.append(details);
  return count;
}

function paintDuplicates(
  report: HTMLElement,
  section: LibraryHealthReport["duplicates"] | undefined,
): number {
  const count = section?.count ?? 0;
  const groups = section?.groups ?? [];
  const details = document.createElement("details");
  details.className = "gig-group";
  details.open = count > 0;
  const heading = document.createElement("summary");
  heading.textContent = t("gig.groupCount", { label: t("health.duplicates"), count });
  details.append(heading);
  details.append(openButton("duplicates", "health.openDuplicates", tips.healthOpenDuplicates));
  const list = document.createElement("ul");
  for (const group of groups) list.append(groupItem(group));
  details.append(list);
  if (count > groups.length) {
    details.append(noteLine(t("health.more", { count: count - groups.length })));
  }
  report.append(details);
  return count;
}

function paintBitrateLink(report: HTMLElement): void {
  const details = document.createElement("details");
  details.className = "gig-group";
  details.open = true;
  const heading = document.createElement("summary");
  heading.textContent = t("health.bitrate");
  details.append(heading);
  details.append(openButton("bitrate", "health.openBitrate", tips.healthOpenBitrate));
  details.append(noteLine(t("health.bitrateNote")));
  report.append(details);
}

function openButton(
  action: "missing" | "duplicates" | "files" | "bitrate",
  label: MessageKey,
  tip: (typeof tips)["healthOpenMissing"],
): HTMLButtonElement {
  const button = buttonEl(tip);
  button.dataset.healthAction = action;
  button.textContent = t(label);
  return button;
}

function trackItem(track: LibraryHealthTrack): HTMLLIElement {
  const row = document.createElement("li");
  const button = buttonEl(tips.healthTrack);
  button.dataset.healthAction = "track";
  button.dataset.healthId = String(track.id);
  button.textContent = trackLine(track);
  row.append(button);
  return row;
}

function groupItem(group: LibraryHealthDuplicateGroup): HTMLLIElement {
  const row = document.createElement("li");
  row.textContent = t("health.duplicateRow", {
    title: [group.artist, group.name].filter(Boolean).join(" — ") || group.name,
    count: group.ids.length,
  });
  return row;
}

function trackLine(track: LibraryHealthTrack): string {
  return t("health.row", {
    title: [track.artist, track.name].filter(Boolean).join(" — ") || track.file,
  });
}
