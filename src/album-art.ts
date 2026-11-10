/**
 * Preview and embed a Cover Art Archive image from Library health.
 *
 * POST /api/album-art preview looks up covers. embed with confirm true
 * writes the JPEG or PNG into the audio file. Cue points stay. The
 * dialog is painted with text nodes and labelled radios.
 *
 * Page text is in the locale catalogs under health.art*.
 */

import { failureOf, postJSON } from "./api";
import type { AlbumArtCandidate, AlbumArtPlan } from "./api-types";
import { bridge } from "./bridge";
import { el } from "./dom";
import { t } from "./i18n";
import { state } from "./state";
import { inputEl } from "./tooltip";
import { tips } from "./tooltip-strings";

let latest: AlbumArtPlan | null = null;
let trackId: number | null = null;
let busy = false;
let onWrote: (() => void) | null = null;

/**
 * Attach the album-art dialog. Called once from wireHealth.
 *
 * @param wrote Refresh the health report after a successful embed.
 * @returns {void}
 */
export function wireAlbumArt(wrote: () => void): void {
  onWrote = wrote;
  const dialog = el("album-art-dialog");
  if (dialog.dataset.albumArtWired === "true") return;
  dialog.dataset.albumArtWired = "true";
  el("album-art-cancel").addEventListener("click", () => dialog.close());
  el("album-art-embed").addEventListener("click", () => {
    void embedCover();
  });
  el("album-art-choices").addEventListener("change", () => syncEmbedEnabled());
}

/**
 * Look up covers for one track and open the dialog.
 *
 * @param id Asset id from the health report.
 * @returns {Promise<void>}
 */
export async function openAlbumArt(id: number): Promise<void> {
  if (!Number.isInteger(id) || id <= 0) return;
  if (typeof el("album-art-dialog").showModal !== "function") return;
  trackId = id;
  latest = null;
  busy = true;
  paintDialog();
  if (!el("album-art-dialog").open) el("album-art-dialog").showModal();
  el("album-art-cancel").focus();
  try {
    const plan = await postJSON<AlbumArtPlan>("/api/album-art", {
      action: "preview",
      space: state.space,
      id,
    });
    if (trackId !== id) return;
    latest = plan;
    el("album-art-status").textContent = plan.candidates.length
      ? ""
      : t("health.artNone");
    paintDialog();
    const first = el("album-art-choices").querySelector("input");
    if (first instanceof HTMLInputElement) first.focus();
    else el("album-art-cancel").focus();
  } catch (error) {
    if (trackId !== id) return;
    failStatus(failureOf(error).message);
    el("album-art-cancel").focus();
  } finally {
    if (trackId === id) busy = false;
    paintDialog();
  }
}

/**
 * Paint the last preview again in the active language.
 *
 * @returns {void}
 */
export function repaintAlbumArt(): void {
  if (el("album-art-dialog").open) paintDialog();
}

async function embedCover(): Promise<void> {
  const id = trackId;
  const chosen = selectedRelease();
  if (id === null || !chosen || !state.writable || busy) return;
  busy = true;
  paintDialog();
  try {
    const written = await postJSON<AlbumArtPlan>("/api/album-art", {
      action: "embed",
      space: state.space,
      id,
      release_id: chosen,
      confirm: true,
    });
    latest = written;
    busy = false;
    el("album-art-dialog").close();
    onWrote?.();
  } catch (error) {
    const failed = failureOf(error);
    failStatus(failed.message);
    if (failed.status === 409) bridge.lockDown(error);
  } finally {
    busy = false;
    paintDialog();
  }
}

function paintDialog(): void {
  const plan = latest;
  el("album-art-track").textContent = plan
    ? t("health.row", { title: [plan.artist, plan.name].filter(Boolean).join(" — ") || plan.file })
    : t("health.artLooking");
  const list = el("album-art-choices");
  const selected = selectedRelease();
  list.replaceChildren();
  const candidates = plan?.candidates ?? [];
  candidates.forEach((candidate, index) => {
    list.append(choiceRow(candidate, selected, index === 0));
  });
  if (busy && !plan) el("album-art-status").textContent = t("health.artLooking");
  syncEmbedEnabled();
}

function choiceRow(
  candidate: AlbumArtCandidate,
  selected: string | null,
  fallback: boolean,
): HTMLLabelElement {
  const row = document.createElement("label");
  row.className = "check album-art-choice";
  const radio = inputEl(tips.healthArtPick);
  radio.type = "radio";
  radio.name = "album-art-pick";
  radio.value = candidate.release_id;
  radio.checked = selected === candidate.release_id || (selected === null && fallback);
  const image = document.createElement("img");
  image.src = candidate.thumb;
  image.alt = candidate.title || t("health.artEmbed");
  image.width = 96;
  image.height = 96;
  const caption = document.createElement("span");
  caption.textContent = [candidate.artist, candidate.title].filter(Boolean).join(" — ")
    || candidate.release_id;
  row.append(radio, image, caption);
  return row;
}

function selectedRelease(): string | null {
  const chosen = el("album-art-choices").querySelector<HTMLInputElement>(
    "input[name='album-art-pick']:checked",
  );
  return chosen?.value || null;
}

function syncEmbedEnabled(): void {
  const button = el("album-art-embed");
  button.disabled = busy || !state.writable || selectedRelease() === null;
}

function failStatus(message: string): void {
  el("album-art-status").textContent = message;
}
