/**
 * Update banner and the update-check switches in Settings (#97).
 *
 * The check is off until the person turns it on, in setup or here. While
 * it is off, GET /api/update makes no request to GitHub. The banner shows
 * only when the server reports ``update: true``. Download asks the server
 * to open the release page; the page never builds that URL. Skip this
 * version is saved on the server. Not now hides the banner until the next
 * launch. A language change repaints the banner from the last answer.
 */

import { postJSON } from "./api";
import { el } from "./dom";
import { t } from "./i18n";
import { bindUpdateSaves, patchSettings, settingsIslandMounted } from "./settings";

/** The setup wizard fires this after it saves the choice. */
export const UPDATE_CHOICE_EVENT = "serato-update-choice";

export interface UpdateLatest {
  version: string;
  url: string;
  prerelease: boolean;
}

export interface UpdateStatus {
  enabled: boolean | null;
  include_prereleases: boolean;
  current: string;
  update: boolean;
  latest: UpdateLatest | null;
}

let latest: UpdateStatus | null = null;
let dismissed = false;
let token = 0;
let wired = false;

/**
 * Accept a GET /api/update body. A wrong shape is null, not a throw.
 *
 * @param value JSON body.
 * @returns The status, or null.
 */
export function parseUpdateStatus(value: unknown): UpdateStatus | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const enabled = body.enabled;
  if (enabled !== null && typeof enabled !== "boolean") return null;
  if (typeof body.update !== "boolean" || typeof body.current !== "string") return null;
  let release: UpdateLatest | null = null;
  const raw = body.latest;
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    const item = raw as Record<string, unknown>;
    if (typeof item.version === "string" && typeof item.url === "string") {
      release = { version: item.version, url: item.url, prerelease: item.prerelease === true };
    }
  }
  return {
    enabled,
    include_prereleases: body.include_prereleases === true,
    current: body.current,
    update: body.update && release !== null,
    latest: release,
  };
}

/**
 * Ask the server for the update status and paint the banner and switches.
 *
 * A failed request leaves the banner hidden. A newer request wins over a
 * late reply.
 *
 * @returns {Promise<void>}
 */
export async function loadUpdate(): Promise<void> {
  const mine = ++token;
  try {
    const response = await fetch("/api/update");
    const body: unknown = response.ok ? await response.json() : null;
    if (mine !== token) return;
    latest = parseUpdateStatus(body);
  } catch {
    if (mine !== token) return;
    latest = null;
  }
  paintUpdate();
}

/**
 * Paint the banner and the Settings switches from the last answer.
 *
 * @returns {void}
 */
export function paintUpdate(): void {
  const status = latest;
  const toggle = document.getElementById("update-toggle");
  const pre = document.getElementById("update-prereleases");
  if (toggle instanceof HTMLInputElement && !settingsIslandMounted()) {
    toggle.checked = status?.enabled === true;
  }
  if (pre instanceof HTMLInputElement && !settingsIslandMounted()) {
    pre.checked = status?.include_prereleases === true;
    pre.disabled = status?.enabled !== true;
  }
  patchSettings({
    updateEnabled: status?.enabled === true,
    updatePrereleases: status?.include_prereleases === true,
    updatePrereleasesDisabled: status?.enabled !== true,
    updateBusy: false,
  });
  const banner = el("update-banner");
  const release = status?.latest ?? null;
  if (!status || status.enabled !== true || !status.update || !release || dismissed) {
    banner.hidden = true;
    return;
  }
  const key = release.prerelease ? "update.availableTest" : "update.available";
  el("update-text").textContent = t(key, { version: release.version, current: status.current });
  banner.hidden = false;
}

/** Repaint after a language change without asking the server again. */
export function repaintUpdate(): void {
  paintUpdate();
}

/**
 * Attach the banner buttons, the Settings switches, and the wizard event.
 *
 * Safe to call more than once.
 *
 * @returns {void}
 */
export function wireUpdate(): void {
  if (wired) return;
  wired = true;
  bindUpdateSaves(
    (on) => save({ enabled: on }),
    (on) => save({ include_prereleases: on }),
  );
  el("update-download").addEventListener("click", () => {
    void download();
  });
  el("update-skip").addEventListener("click", () => {
    void skip();
  });
  el("update-dismiss").addEventListener("click", () => {
    dismissed = true;
    paintUpdate();
  });
  if (!settingsIslandMounted()) {
    el("update-toggle").addEventListener("change", () => {
      void save({ enabled: el("update-toggle").checked });
    });
    el("update-prereleases").addEventListener("change", () => {
      void save({ include_prereleases: el("update-prereleases").checked });
    });
  }
  window.addEventListener(UPDATE_CHOICE_EVENT, () => {
    void loadUpdate();
  });
}

async function save(choice: { enabled: boolean } | { include_prereleases: boolean }): Promise<void> {
  const toggle = document.getElementById("update-toggle");
  const pre = document.getElementById("update-prereleases");
  const note = document.getElementById("update-status");
  if (toggle instanceof HTMLInputElement) toggle.disabled = true;
  if (pre instanceof HTMLInputElement) pre.disabled = true;
  if (note) note.textContent = "";
  patchSettings({ updateBusy: true, updateStatus: "" });
  try {
    await postJSON("/api/update", choice);
    if (toggle instanceof HTMLInputElement) toggle.disabled = false;
    await loadUpdate();
  } catch {
    if (toggle instanceof HTMLInputElement) toggle.disabled = false;
    const message = t("settings.updatesFailed");
    if (note) note.textContent = message;
    patchSettings({ updateBusy: false, updateStatus: message });
    paintUpdate();
  }
}

async function download(): Promise<void> {
  try {
    const reply = await postJSON<{ opened?: boolean }>("/api/update", { open: true });
    if (reply.opened !== true) el("update-text").textContent = t("update.openFailed");
  } catch {
    el("update-text").textContent = t("update.openFailed");
  }
}

async function skip(): Promise<void> {
  const release = latest?.latest;
  if (!release) return;
  try {
    await postJSON("/api/update", { skip: release.version });
    await loadUpdate();
  } catch {
    dismissed = true;
    paintUpdate();
  }
}

/** Reset module state between tests. */
export function resetUpdateForTests(): void {
  latest = null;
  dismissed = false;
  token = 0;
  wired = false;
}
