/**
 * Pure labels for the Cloud-only view and the gig-check step.
 *
 * Strings come from the locale catalogs. Paths and titles stay as stored.
 */

import type { CloudLocation, CloudTrack } from "../api-types";
import { t, type MessageKey } from "../i18n";
import { state } from "../state";

const PROVIDER_KEYS: Record<string, MessageKey> = {
  icloud: "cloud.provider.icloud",
  dropbox: "cloud.provider.dropbox",
  onedrive: "cloud.provider.onedrive",
  other: "cloud.provider.other",
  "file-provider": "cloud.provider.fileProvider",
};

/**
 * Crate name for the scope line, or the whole-space sentence.
 *
 * @returns Scope label for the open crate.
 */
export function cloudScopeLabel(): string {
  if (state.activeCrate === "all") return t("gig.wholeSpace");
  const crate = state.crates.find((row) => row.id === state.activeCrate);
  return crate?.name || t("gig.wholeSpace");
}

/**
 * The folder name a DJ reads for a provider id.
 *
 * @param provider Provider id from the report.
 * @returns Translated place name. An unknown id uses the other-folder sentence.
 */
export function cloudPlace(provider: string): string {
  const key = PROVIDER_KEYS[provider];
  return key ? t(key) : t("cloud.provider.other");
}

/**
 * One warning that a library or music folder sits in the cloud.
 *
 * Optimize Mac Storage is appended only when the report says it is on.
 *
 * @param item Location from GET /api/cloud-files.
 * @returns The sentence for that row.
 */
export function cloudLocationText(item: CloudLocation): string {
  const place = cloudPlace(item.provider);
  const base = t(item.role === "library" ? "cloud.location.library" : "cloud.location.music", { place });
  if (item.optimize_storage === true) return `${base} ${t("cloud.optimize")}`;
  return base;
}

/**
 * One track line: title, path, and where the audio lives.
 *
 * @param item Cloud or unknown track.
 * @returns Display row.
 */
export function cloudTrackLine(item: CloudTrack): string {
  return t("cloud.track", {
    title: item.title,
    path: item.path,
    place: cloudPlace(item.provider),
  });
}
