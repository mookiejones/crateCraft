/**
 * Read-only gig check view.
 *
 * Typed against the fields GET /api/gig-check returns. The request does
 * not write. A newer selection ignores a late response. The report is
 * painted with text nodes. Five steps lead to a done screen. #gig-ready-art
 * is the empty slot for the done artwork Pixel supplies.
 *
 * Page text is in the locale catalogs under gig.*. The report sentences
 * the server writes (holding_it_back, snapshot_note, empty-crate
 * warnings) stay in English, as the Rekordbox loss report does.
 */

import { readJSON } from "./api";
import type { GigReport } from "./api-types";
import { el } from "./dom";
import { formatDate, serverMessage, t, type MessageKey } from "./i18n";
import { state } from "./state";
import { buttonEl } from "./tooltip";
import { tips } from "./tooltip-strings";

const STEP_COUNT = 5;
const LIST_CAP = 100;

interface GigStep {
  title: MessageKey;
  action: MessageKey;
  empty: MessageKey;
}

const STEPS: readonly GigStep[] = [
  { title: "gig.drives", action: "gig.drivesAction", empty: "gig.drivesEmpty" },
  { title: "gig.missing", action: "gig.missingAction", empty: "gig.missingEmpty" },
  { title: "gig.streaming", action: "gig.streamingAction", empty: "gig.streamingEmpty" },
  { title: "gig.emptyCrates", action: "gig.emptyCratesAction", empty: "gig.emptyCratesEmpty" },
  { title: "gig.since", action: "gig.sinceAction", empty: "gig.sinceEmpty" },
];

let stepIndex = 0;
let latest: GigReport | null = null;
let checkedAt: Date | null = null;
let exitGig: () => void = () => {};

/**
 * Attach Check again, Back, the step verb, and Exit gig check.
 *
 * Called once at startup. A later call only replaces the exit handler.
 *
 * @param exit Leaves the Gig view.
 * @returns {void}
 */
export function wireGigCheck(exit: () => void): void {
  exitGig = exit;
  const panel = el("gig-panel");
  if (panel.dataset.gigWired === "true") return;
  panel.dataset.gigWired = "true";
  el("gig-refresh").addEventListener("click", () => {
    void loadGigCheck(true);
  });
  panel.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest("button");
    if (!(button instanceof HTMLButtonElement) || !latest) return;
    const action = button.dataset.gigAction;
    if (action === "next") stepIndex = Math.min(stepIndex + 1, STEP_COUNT);
    else if (action === "back") stepIndex = Math.max(0, stepIndex - 1);
    else if (action === "exit") {
      exitGig();
      return;
    } else return;
    renderGigReport(latest);
    focusHeading();
  });
}

/**
 * Ask for a read-only gig check of the open space and crate.
 *
 * The previous report stays on screen until this reply arrives. The
 * Check again button is disabled while the request runs.
 *
 * @param keepStep Keep the step the person is on. Check again passes true.
 * @returns {Promise<void>}
 */
export async function loadGigCheck(keepStep = false): Promise<void> {
  const token = ++state.gigToken;
  if (!keepStep) stepIndex = 0;
  beginBusy();
  let settle: "heading" | "retry" | "none" = "none";
  const crate = state.activeCrate === "all" ? "all" : String(state.activeCrate);
  try {
    const response = await fetch(
      `/api/gig-check?space=${encodeURIComponent(state.space)}&crate=${encodeURIComponent(crate)}`,
    );
    if (token !== state.gigToken) return;
    const payload = await readJSON<GigReport>(response).catch((): null => null);
    if (token !== state.gigToken) return;
    if (!response.ok || payload === null) {
      failStatus(serverMessage(payload, t("gig.unreadable")));
      settle = "retry";
      return;
    }
    checkedAt = new Date();
    latest = payload;
    el("gig-status").textContent = "";
    renderGigReport(payload);
    settle = "heading";
  } catch {
    if (token !== state.gigToken) return;
    failStatus(t("gig.unreachable"));
    settle = "retry";
  } finally {
    if (token !== state.gigToken) return;
    endBusy();
    if (settle === "retry") el("gig-refresh").focus();
    if (settle === "heading") focusHeading();
  }
}

/**
 * Show a gig-check failure in the status line, not in the track detail.
 *
 * The report already on screen stays. Focus moves to Check again.
 *
 * @param {unknown} error Failure from loadGigCheck.
 * @returns {void}
 */
export function showGigFailure(error: unknown): void {
  const message = error instanceof Error && error.message
    ? error.message
    : t("gig.unreadable");
  failStatus(message);
  endBusy();
  el("gig-refresh").focus();
}

/**
 * Paint the ready score and the current step.
 *
 * Color is not the only signal: the verdict is ✓ Ready or ✕ Not ready.
 *
 * @param {GigReport} payload JSON from GET /api/gig-check.
 * @returns {void}
 */
export function renderGigReport(payload: GigReport): void {
  const report = el("gig-report");
  el("gig-scope").textContent = payload.scope?.crate_name || t("gig.wholeSpace");
  report.replaceChildren(scoreBlock(payload));
  if (stepIndex >= STEP_COUNT) {
    report.append(doneScreen(payload));
    return;
  }
  const step = STEPS[stepIndex]!;
  report.append(kicker(stepIndex), heading(t(step.title)));
  if (stepIndex === STEP_COUNT - 1) renderSince(report, payload);
  else renderStepList(report, step, linesFor(payload, stepIndex));
  report.append(actions(t(step.action)));
}

/**
 * Paint the last report again in the active language.
 *
 * locale-wiring calls this on a language change. Nothing is fetched,
 * and the step the person is on is kept.
 *
 * @returns {void}
 */
export function repaintGig(): void {
  if (latest) renderGigReport(latest);
}

function beginBusy(): void {
  const button = el("gig-refresh");
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  el("gig-panel").setAttribute("aria-busy", "true");
  el("gig-status").textContent = t("gig.checking");
}

function endBusy(): void {
  const button = el("gig-refresh");
  button.disabled = false;
  button.setAttribute("aria-busy", "false");
  el("gig-panel").setAttribute("aria-busy", "false");
}

function failStatus(message: string): void {
  el("gig-status").textContent = message;
}

function focusHeading(): void {
  const headingNode = document.getElementById("gig-step-heading");
  if (headingNode instanceof HTMLElement) headingNode.focus();
}

function formatCheckedAt(date: Date | null): string {
  return date ? formatDate(date, { hour: "numeric", minute: "2-digit" }) : "";
}

function scoreBlock(payload: GigReport): HTMLParagraphElement {
  const score = document.createElement("p");
  score.className = "gig-score";
  const verdictWord = t(payload.ready ? "gig.wordReady" : "gig.wordNotReady");
  score.setAttribute("aria-label", t("gig.scoreLabel", { score: payload.score, verdict: verdictWord }));
  const value = document.createElement("span");
  value.className = "gig-score-value";
  value.textContent = t("gig.score", { score: payload.score });
  const verdict = document.createElement("span");
  verdict.className = payload.ready ? "gig-verdict" : "gig-verdict not-ready";
  verdict.textContent = t(payload.ready ? "gig.verdictReady" : "gig.verdictNotReady");
  score.append(value, verdict);
  return score;
}

function kicker(index: number): HTMLParagraphElement {
  const step = document.createElement("p");
  step.className = "gig-kicker";
  step.textContent = t("gig.stepOf", { index: index + 1, total: STEP_COUNT });
  return step;
}

function heading(text: string): HTMLHeadingElement {
  const title = document.createElement("h3");
  title.id = "gig-step-heading";
  title.tabIndex = -1;
  title.textContent = text;
  return title;
}

function linesFor(payload: GigReport, index: number): string[] {
  if (index === 0) {
    return (payload.unavailable_drives || []).map((drive) =>
      t("gig.driveUnavailable", { name: drive.name, count: drive.track_count }),
    );
  }
  if (index === 1) return (payload.missing_files || []).map((item) => item.path);
  if (index === 2) return (payload.streaming_tracks || []).map((item) => `${item.service}: ${item.title}`);
  if (index === 3) return (payload.empty_crates || []).map((item) => `${item.name} — ${item.warning}`);
  return [];
}

function renderStepList(parent: HTMLElement, step: GigStep, lines: string[]): void {
  if (!lines.length) {
    const empty = document.createElement("p");
    empty.className = "gig-note";
    empty.textContent = t(step.empty);
    parent.append(empty);
    return;
  }
  parent.append(detailsGroup(t(step.title), lines));
}

function renderSince(parent: HTMLElement, payload: GigReport): void {
  const note = payload.snapshot_note?.trim() ?? "";
  if (note) {
    const line = document.createElement("p");
    line.className = "gig-note";
    line.textContent = note;
    parent.append(line);
  }
  const changes = payload.changes;
  if (!changes) {
    if (!note) parent.append(noteLine(t("gig.noSnapshot")));
    return;
  }
  const groups: Array<[MessageKey, string[]]> = [
    ["gig.cratesAdded", changes.crates_added || []],
    ["gig.cratesRemoved", changes.crates_removed || []],
    ["gig.cratesEdited", changes.crates_edited || []],
    ["gig.tracksAdded", changes.tracks_added || []],
    ["gig.tracksRemoved", changes.tracks_removed || []],
    ["gig.cuesEdited", changes.cues_edited || []],
    ["gig.gridsEdited", changes.grids_edited || []],
    ["gig.tagsEdited", changes.tags_edited || []],
  ];
  let any = false;
  for (const [label, lines] of groups) {
    if (!lines.length) continue;
    parent.append(detailsGroup(t(label), lines));
    any = true;
  }
  if (!any) parent.append(noteLine(t(STEPS[STEP_COUNT - 1]!.empty)));
}

function noteLine(text: string): HTMLParagraphElement {
  const line = document.createElement("p");
  line.className = "gig-note";
  line.textContent = text;
  return line;
}

function detailsGroup(label: string, lines: string[]): HTMLDetailsElement {
  const details = document.createElement("details");
  details.className = "gig-group";
  details.open = true;
  const summary = document.createElement("summary");
  summary.textContent = t("gig.groupCount", { label, count: lines.length });
  const list = document.createElement("ul");
  const shown = lines.slice(0, LIST_CAP);
  for (const line of shown) list.append(item(line));
  details.append(summary, list);
  if (lines.length > LIST_CAP) {
    const show = buttonEl(tips.gigShowAll);
    show.className = "gig-show-all";
    show.textContent = t("gig.showAll", { count: lines.length });
    show.addEventListener("click", () => {
      list.replaceChildren();
      for (const line of lines) list.append(item(line));
      show.remove();
    });
    details.append(show);
  }
  return details;
}

function item(text: string): HTMLLIElement {
  const row = document.createElement("li");
  row.textContent = text;
  return row;
}

function actions(primary: string | null): HTMLDivElement {
  const bar = document.createElement("div");
  bar.className = "gig-actions";
  const back = buttonEl(tips.gigBack);
  back.dataset.gigAction = "back";
  back.textContent = t("common.back");
  back.disabled = stepIndex === 0;
  bar.append(back);
  if (primary) {
    const next = buttonEl(tips.gigNext);
    next.className = "gig-primary";
    next.dataset.gigAction = "next";
    next.textContent = primary;
    bar.append(next);
  }
  const exit = buttonEl(tips.gigExit);
  exit.dataset.gigAction = "exit";
  exit.textContent = t("gig.exit");
  bar.append(exit);
  return bar;
}

function doneScreen(payload: GigReport): DocumentFragment {
  const fragment = document.createDocumentFragment();
  fragment.append(heading(t("gig.done")));
  const art = document.createElement("div");
  art.id = "gig-ready-art";
  art.className = "gig-art-slot";
  art.dataset.slot = "gig-ready";
  art.setAttribute("aria-hidden", "true");
  const line = document.createElement("p");
  line.className = "gig-done";
  const crate = payload.scope?.crate_name || t("gig.wholeSpaceInline");
  line.textContent = t(payload.ready ? "gig.doneReady" : "gig.doneNotReady", {
    score: payload.score,
    crate,
    time: formatCheckedAt(checkedAt),
  });
  fragment.append(art, line);
  const holding = (payload.holding_it_back || []).map((item) => item.summary);
  if (holding.length) fragment.append(detailsGroup(t("gig.holding"), holding));
  fragment.append(actions(null));
  return fragment;
}
