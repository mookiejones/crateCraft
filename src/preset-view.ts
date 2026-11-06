/**
 * Pure helpers for crate presets (#26).
 *
 * views.ts paints the crate actions and footer with these, and presets.ts
 * runs the dialog and the requests. Keeping these here means views.ts
 * does not import presets.ts, which imports views.ts. Nothing here fetches.
 */

import type { Crate, PresetSpec } from "./api-types";
import { el } from "./dom";
import { formatDate, formatNumber, t } from "./i18n";
import { state } from "./state";

export type PresetKind = PresetSpec["kind"];

/**
 * Name a preset crate in the page language.
 *
 * The server adds ⟳ at the end, so it is not part of this name.
 *
 * @param {PresetSpec} preset The preset.
 * @returns {string} For example "Mixes with 8A" or "BPM 124 ±3".
 */
export function presetName(preset: PresetSpec): string {
  if (preset.kind === "harmonic") return t("presets.name.harmonic", { key: preset.key });
  if (preset.kind === "bpm") {
    return t("presets.name.bpm", {
      bpm: formatNumber(preset.bpm, { maximumFractionDigits: 1 }),
      range: formatNumber(preset.range, { maximumFractionDigits: 1 }),
    });
  }
  return t("presets.name.unplayed", { count: preset.months });
}

/**
 * Read a whole or decimal number from an input.
 *
 * @param {HTMLInputElement} input The field.
 * @returns {number | null} The number, or null when blank or not finite.
 */
function numberFrom(input: HTMLInputElement): number | null {
  const text = input.value.trim();
  if (!text) return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

/**
 * The crate a preset may be limited to: the selected crate when it is a normal crate.
 *
 * Smart crates are left out because their tracks come from Serato's rules.
 *
 * @returns {Crate | null} The crate, or null for All tracks or a smart crate.
 */
export function scopeCrate(): Crate | null {
  if (state.activeCrate === "all") return null;
  const crate = state.crates.find((item) => item.id === state.activeCrate);
  return crate && !crate.smart ? crate : null;
}

/**
 * Build the preset the dialog describes.
 *
 * Only checks what the page can check. The server checks every field again.
 *
 * @returns {PresetSpec | null} The preset, or null while a field is blank or out of range.
 */
export function readPresetForm(): PresetSpec | null {
  const kind = el("preset-kind").value as PresetKind;
  const scope = scopeCrate();
  const crate = scope && el("preset-scope").checked ? { crate: scope.id } : {};
  if (kind === "harmonic") {
    const key = el("preset-key").value.trim();
    return key ? { kind, key, ...crate } : null;
  }
  if (kind === "bpm") {
    const bpm = numberFrom(el("preset-bpm"));
    const range = numberFrom(el("preset-range")) ?? 3;
    if (bpm == null || bpm <= 0 || range < 0 || range > 50) return null;
    return { kind, bpm, range, ...crate };
  }
  if (kind === "unplayed") {
    const months = numberFrom(el("preset-months")) ?? 12;
    if (!Number.isInteger(months) || months < 1 || months > 240) return null;
    return { kind, months, ...crate };
  }
  return null;
}

/**
 * Show only the fields of the chosen preset kind.
 *
 * @returns {void}
 */
export function syncPresetFields(): void {
  const kind = el("preset-kind").value;
  for (const field of document.querySelectorAll<HTMLElement>("#preset-dialog [data-preset-kind]")) {
    field.hidden = field.dataset.presetKind !== kind;
  }
}

/**
 * Tell whether a crate was made from a preset.
 *
 * @param {number | "all"} id Crate id.
 * @returns {boolean} True when GET /api/library listed it as a preset crate.
 */
export function isPresetCrate(id: number | "all"): boolean {
  return id !== "all" && Object.hasOwn(state.presets, String(id));
}

/**
 * The footer note for a preset crate: when it was last refreshed.
 *
 * @param {number | "all"} id Crate id.
 * @returns {string} " · ⟳ updated Nov 3, 9:15 PM", or "" for other crates.
 */
export function presetFoot(id: number | "all"): string {
  if (!isPresetCrate(id)) return "";
  const updated = Number(state.presets[String(id)]?.updated);
  if (!Number.isFinite(updated) || updated <= 0) return "";
  const date = formatDate(new Date(updated * 1000), { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  return ` · ${t("presets.updated", { date })}`;
}

/**
 * Enable Preset while edits are allowed, and show Refresh on a preset crate.
 *
 * @returns {void}
 */
export function syncPresetButtons(): void {
  el("crate-preset").disabled = !state.writable;
  const preset = isPresetCrate(state.activeCrate);
  el("crate-refresh").hidden = !preset;
  el("crate-refresh").disabled = !state.writable || !preset;
}
