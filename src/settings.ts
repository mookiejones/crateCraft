/**
 * Settings snapshot for the React Settings island.
 *
 * Language, appearance, sharing, About, and the update switches live
 * here. The dialog markup is painted by `SettingsPanel`. Callers in
 * dialogs, version, and update write this store so every island sees
 * the same values. Python and the API stay unchanged.
 */

import { createElement } from "react";
import { postJSON, readJSONOr } from "./api";
import type { LogsPayload, SettingsPayload } from "./api-types";
import { mountIsland, type IslandRoot } from "./app/mount";
import { SettingsPanel } from "./components/SettingsPanel";
import { PSEUDO, getLocale, isLanguage, resolveLocale, serverMessage, setLocale, t } from "./i18n";
import { state } from "./state";

export const COLORWAYS = ["serato-like", "dark-club", "light", "classic"] as const;
export type Colorway = (typeof COLORWAYS)[number];

const LEGACY_COLORWAYS: Record<string, Colorway> = {
  motown: "classic",
  "deep-house": "classic",
  "daisy-age": "classic",
};

export type SettingsSnapshot = {
  language: string;
  languageStatus: string;
  colorway: Colorway;
  iconFollowsTheme: boolean;
  iconStatus: string;
  telemetryOn: boolean;
  telemetryConfigured: boolean;
  sharingBusy: boolean;
  settingsStatus: string;
  logFallback: string;
  logFallbackHidden: boolean;
  logsBusy: boolean;
  aboutVersion: string;
  versionCopyStatus: string;
  updateEnabled: boolean;
  updatePrereleases: boolean;
  updatePrereleasesDisabled: boolean;
  updateBusy: boolean;
  updateStatus: string;
};

const DEFAULT_SNAPSHOT: SettingsSnapshot = {
  language: "",
  languageStatus: "",
  colorway: "serato-like",
  iconFollowsTheme: true,
  iconStatus: "",
  telemetryOn: false,
  telemetryConfigured: false,
  sharingBusy: false,
  settingsStatus: "",
  logFallback: "",
  logFallbackHidden: true,
  logsBusy: false,
  aboutVersion: "",
  versionCopyStatus: "",
  updateEnabled: false,
  updatePrereleases: false,
  updatePrereleasesDisabled: true,
  updateBusy: false,
  updateStatus: "",
};

let snapshot: SettingsSnapshot = { ...DEFAULT_SNAPSHOT };
const listeners = new Set<() => void>();
let islandRoot: IslandRoot | null = null;
let appearanceSync = false;
let rerunSetupHandler: (() => void) | null = null;
let copyVersionHandler: (() => Promise<void>) | null = null;
let saveUpdateEnabledHandler: ((on: boolean) => Promise<void>) | null = null;
let saveUpdatePrereleasesHandler: ((on: boolean) => Promise<void>) | null = null;

/**
 * Return whether a value is a shipped colorway id.
 *
 * @param value Candidate id.
 * @returns True for a known theme.
 */
export function isColorway(value: unknown): value is Colorway {
  return typeof value === "string" && (COLORWAYS as readonly string[]).includes(value);
}

/**
 * Map a saved theme id to a shipped colorway.
 *
 * Unknown ids become Serato-like. The retired Motown, Deep House, and
 * Daisy Age ids load as Classic.
 *
 * @param value Saved id, or anything else.
 * @returns A colorway the picker offers.
 */
export function resolveColorway(value: unknown): Colorway {
  if (isColorway(value)) return value;
  if (typeof value === "string") {
    const mapped = LEGACY_COLORWAYS[value];
    if (mapped !== undefined) return mapped;
  }
  return "serato-like";
}

/**
 * Return the current Settings snapshot.
 *
 * Do not mutate it. Subscribe for later changes.
 *
 * @returns The last written Settings values.
 */
export function getSettingsState(): SettingsSnapshot {
  return snapshot;
}

/**
 * Run a callback after each Settings change.
 *
 * The callback is not run immediately.
 *
 * @param listener Called after a write.
 * @returns Unsubscribes the listener.
 */
export function subscribeSettings(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Tell every Settings island to paint again.
 *
 * Used when the locale changes and the stored values did not.
 *
 * @returns {void}
 */
export function notifySettings(): void {
  for (const listener of listeners) listener();
}

/**
 * Merge fields into the snapshot and notify islands.
 *
 * @param patch Fields to replace.
 * @returns {void}
 */
export function patchSettings(patch: Partial<SettingsSnapshot>): void {
  snapshot = { ...snapshot, ...patch };
  notifySettings();
}

/**
 * Return whether the Settings dialog is a React island.
 *
 * @returns True after `mountSettings` filled `#settings-dialog`.
 */
export function settingsIslandMounted(): boolean {
  return islandRoot !== null;
}

/**
 * Paint Settings into `#settings-dialog`.
 *
 * Called once from app.ts. A missing host does nothing, so a test page
 * that has not installed the markup can still call the save helpers.
 *
 * @param host Element to fill. Defaults to `#settings-dialog`.
 */
export function mountSettings(host?: HTMLElement | null): void {
  islandRoot?.unmount();
  islandRoot = null;
  const root = host === undefined ? document.getElementById("settings-dialog") : host;
  if (!root) return;
  islandRoot = mountIsland(root, createElement(SettingsPanel));
}

/**
 * Remove the Settings island.
 *
 * Tests call this after a render into a temporary host.
 *
 * @returns {void}
 */
export function unmountSettings(): void {
  islandRoot?.unmount();
  islandRoot = null;
}

/**
 * Reset the snapshot between tests.
 *
 * @returns {void}
 */
export function resetSettingsForTests(): void {
  snapshot = { ...DEFAULT_SNAPSHOT };
  appearanceSync = false;
  unmountSettings();
}

function systemLanguages(): string[] {
  return Array.isArray(navigator.languages) && navigator.languages.length
    ? [...navigator.languages]
    : [navigator.language || "en"];
}

function selectValue(id: string): string {
  const node = document.getElementById(id);
  return node instanceof HTMLSelectElement ? node.value : "";
}

function checkboxChecked(id: string): boolean {
  const node = document.getElementById(id);
  return node instanceof HTMLInputElement ? node.checked : false;
}

function setText(id: string, text: string): void {
  const node = document.getElementById(id);
  if (node) node.textContent = text;
}

/**
 * Describe the current sharing choice in one sentence.
 *
 * @returns Status sentence for the settings dialog.
 */
export function telemetryNoteText(): string {
  if (!state.telemetryConfigured) return t("sharing.noKeys");
  if (state.telemetryConsent === true) return t("sharing.canSend");
  return t("sharing.nothingSent");
}

/**
 * Apply a /api/settings payload to sharing state.
 *
 * A null consent leaves the checkbox off. No request is made.
 *
 * @param payload Settings object from the server.
 * @returns {void}
 */
export function applyPrivacy(payload: SettingsPayload): void {
  state.telemetryConsent = payload.telemetry_consent ?? null;
  state.telemetryConfigured = Boolean(payload.telemetry_configured);
  state.wizardComplete = payload.wizard_complete === true;
  patchSettings({
    telemetryOn: state.telemetryConsent === true,
    telemetryConfigured: state.telemetryConfigured,
  });
  const toggle = document.getElementById("telemetry-toggle");
  if (toggle instanceof HTMLInputElement && !settingsIslandMounted()) {
    toggle.checked = state.telemetryConsent === true;
  }
  if (!settingsIslandMounted()) setText("telemetry-note", telemetryNoteText());
}

/**
 * Apply the saved language to the picker and the page.
 *
 * A payload without `language` leaves both alone. A saved code switches
 * the page to it. Null follows the OS language. The pseudo-locale from
 * the URL is kept, since it is only for layout checks. No request is made.
 *
 * @param payload Settings object from the server.
 * @returns {void}
 */
export function applyLanguage(payload: SettingsPayload): void {
  if (!("language" in payload)) return;
  const saved = isLanguage(payload.language) ? payload.language : null;
  patchSettings({ language: saved ?? "" });
  const select = document.getElementById("language-select");
  if (select instanceof HTMLSelectElement && !settingsIslandMounted()) {
    select.value = saved ?? "";
  }
  if (getLocale() !== PSEUDO) setLocale(resolveLocale(saved, systemLanguages()));
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
  const current = snapshot;
  const colorway = hasColorway
    ? resolveColorway(payload.colorway)
    : resolveColorway(selectValue("colorway-select") || current.colorway);
  const follow = hasFollow
    ? payload.icon_follows_theme !== false
    : settingsIslandMounted()
      ? current.iconFollowsTheme
      : checkboxChecked("icon-follows-theme");
  appearanceSync = true;
  patchSettings({ colorway, iconFollowsTheme: follow });
  if (!settingsIslandMounted()) {
    if (hasColorway) {
      const select = document.getElementById("colorway-select");
      if (select instanceof HTMLSelectElement) select.value = colorway;
    }
    if (hasFollow) {
      const box = document.getElementById("icon-follows-theme");
      if (box instanceof HTMLInputElement) box.checked = follow;
    }
  }
  appearanceSync = false;
  const shown = resolveColorway(selectValue("colorway-select") || colorway);
  document.documentElement.dataset.colorway = shown;
  const preview = document.getElementById("colorway-preview");
  if (preview instanceof HTMLImageElement) {
    preview.src = `/img/icons/placeholder-${shown}.svg`;
    preview.alt = t("settings.colorwayPreview");
  }
  const href = hasHref && typeof payload.icon_href === "string"
    ? payload.icon_href
    : follow
      ? `/img/icons/placeholder-${shown}.svg`
      : "/img/icons/default.svg";
  const icon = document.getElementById("app-icon");
  if (icon instanceof HTMLLinkElement) icon.href = href;
}

/** Sentence under the theme controls after a save. */
export function iconStatusText(icon: SettingsPayload["icon"]): string {
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
 * @param next Colorway from the picker, or the control's current value.
 * @returns {Promise<void>}
 */
export async function saveColorway(next?: string): Promise<void> {
  if (appearanceSync) return;
  const value = next ?? selectValue("colorway-select");
  if (!isColorway(value)) return;
  document.documentElement.dataset.colorway = value;
  const preview = document.getElementById("colorway-preview");
  if (preview instanceof HTMLImageElement) {
    preview.src = `/img/icons/placeholder-${value}.svg`;
  }
  patchSettings({ colorway: value, iconStatus: "" });
  setText("icon-status", "");
  try {
    const payload = await postJSON<SettingsPayload>("/api/settings", { colorway: value });
    applyAppearance(payload);
    const status = iconStatusText(payload.icon);
    patchSettings({ iconStatus: status });
    setText("icon-status", status);
  } catch {
    const status = t("settings.iconNotSaved");
    patchSettings({ iconStatus: status });
    setText("icon-status", status);
  }
}

/**
 * Save whether the running icon follows the theme.
 *
 * False is sent as false. A failed save says so and keeps the checkbox
 * where the person left it for this session.
 *
 * @param next Checkbox value, or the control's current value.
 * @returns {Promise<void>}
 */
export async function saveIconFollow(next?: boolean): Promise<void> {
  if (appearanceSync) return;
  const follow = next ?? checkboxChecked("icon-follows-theme");
  patchSettings({ iconFollowsTheme: follow, iconStatus: "" });
  setText("icon-status", "");
  try {
    const payload = await postJSON<SettingsPayload>("/api/settings", { icon_follows_theme: follow });
    applyAppearance(payload);
    const status = iconStatusText(payload.icon);
    patchSettings({ iconStatus: status });
    setText("icon-status", status);
  } catch {
    const status = t("settings.iconNotSaved");
    patchSettings({ iconStatus: status });
    setText("icon-status", status);
  }
}

/**
 * Save the language picked in Settings and switch the page now.
 *
 * The page switches before the save answers, so the choice shows at once.
 * A failed save says so and keeps the new language for this session.
 *
 * @param next Picker value, or the control's current value.
 * @returns {Promise<void>}
 */
export async function saveLanguage(next?: string): Promise<void> {
  const value = next ?? selectValue("language-select");
  const saved = isLanguage(value) ? value : null;
  patchSettings({ language: saved ?? "", languageStatus: "" });
  setText("language-status", "");
  setLocale(resolveLocale(saved, systemLanguages()));
  try {
    await postJSON("/api/settings", { language: saved });
  } catch {
    const status = t("settings.languageNotSaved");
    patchSettings({ languageStatus: status });
    setText("language-status", status);
  }
}

/**
 * POST the sharing choice.
 *
 * False is sent as false. A failure leaves the previous choice in place.
 *
 * @param value True to share, false to send nothing.
 * @param status Element that receives the result sentence when the island is not mounted.
 * @returns True when the server stored the choice.
 */
export async function saveSharing(value: boolean, status?: HTMLElement): Promise<boolean> {
  const saving = t("wizard.saving");
  patchSettings({ sharingBusy: true, settingsStatus: saving, telemetryOn: value });
  if (status) status.textContent = saving;
  else setText("settings-status", saving);
  try {
    const payload = await postJSON<SettingsPayload>("/api/settings", { telemetry_consent: value });
    applyPrivacy(payload);
    const message = value ? t("sharing.on") : t("sharing.off");
    patchSettings({ sharingBusy: false, settingsStatus: message, telemetryOn: value });
    if (status) status.textContent = message;
    else setText("settings-status", message);
    return true;
  } catch {
    const message = t("wizard.consentFailed");
    patchSettings({
      sharingBusy: false,
      settingsStatus: message,
      telemetryOn: state.telemetryConsent === true,
    });
    if (status) status.textContent = message;
    else setText("settings-status", message);
    const toggle = document.getElementById("telemetry-toggle");
    if (toggle instanceof HTMLInputElement && !settingsIslandMounted()) {
      toggle.checked = state.telemetryConsent === true;
    }
    return false;
  }
}

/**
 * Open the logs folder through the server.
 *
 * @returns {Promise<void>}
 */
export async function openLogs(): Promise<void> {
  patchSettings({ logsBusy: true, settingsStatus: t("wizard.opening") });
  setText("settings-status", t("wizard.opening"));
  try {
    await postJSON("/api/logs/open", {});
    const message = t("logs.opened");
    patchSettings({ logsBusy: false, settingsStatus: message });
    setText("settings-status", message);
  } catch {
    const message = t("logs.openFailed");
    patchSettings({ logsBusy: false, settingsStatus: message });
    setText("settings-status", message);
  }
}

/**
 * Copy the local log, or show it for a manual copy.
 *
 * @returns {Promise<void>}
 */
export async function copyLogs(): Promise<void> {
  patchSettings({ logsBusy: true, settingsStatus: t("logs.copying") });
  setText("settings-status", t("logs.copying"));
  try {
    const response = await fetch("/api/logs");
    const payload = await readJSONOr<LogsPayload>(response, {});
    if (!response.ok) throw new Error(serverMessage(payload, t("logs.copyFailed")));
    const text = payload.text || "";
    if (!text) {
      const message = t("logs.empty");
      patchSettings({ logsBusy: false, settingsStatus: message });
      setText("settings-status", message);
      return;
    }
    let copied = false;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        copied = true;
      } catch {
        copied = false;
      }
    }
    if (copied) {
      const message = payload.truncated ? t("logs.copiedTruncated") : t("logs.copied");
      patchSettings({ logsBusy: false, settingsStatus: message, logFallbackHidden: true });
      setText("settings-status", message);
      const fallback = document.getElementById("log-fallback");
      if (fallback instanceof HTMLTextAreaElement) fallback.hidden = true;
      return;
    }
    patchSettings({
      logsBusy: false,
      settingsStatus: t("logs.copyManual"),
      logFallback: text,
      logFallbackHidden: false,
    });
    const fallback = document.getElementById("log-fallback");
    if (fallback instanceof HTMLTextAreaElement) {
      fallback.hidden = false;
      fallback.value = text;
      fallback.focus();
      fallback.select();
    }
    setText("settings-status", t("logs.copyManual"));
  } catch {
    const message = t("logs.copyFailed");
    patchSettings({ logsBusy: false, settingsStatus: message });
    setText("settings-status", message);
  }
}

/**
 * Close the Settings dialog.
 *
 * @returns {void}
 */
export function closeSettings(): void {
  const dialog = document.getElementById("settings-dialog");
  if (dialog instanceof HTMLDialogElement) dialog.close();
}

/**
 * Register Run setup again. dialogs.ts binds this at wire time.
 *
 * @param handler Close Settings and open the wizard.
 * @returns {void}
 */
export function bindRerunSetup(handler: () => void): void {
  rerunSetupHandler = handler;
}

/**
 * Run setup again from Settings.
 *
 * @returns {void}
 */
export function rerunSetup(): void {
  rerunSetupHandler?.();
}

/**
 * Register Copy version. version.ts binds this at wire time.
 *
 * @param handler Copy the version line.
 * @returns {void}
 */
export function bindCopyVersion(handler: () => Promise<void>): void {
  copyVersionHandler = handler;
}

/**
 * Copy the version line from About.
 *
 * @returns {Promise<void>}
 */
export async function copySettingsVersion(): Promise<void> {
  await copyVersionHandler?.();
}

/**
 * Register the update-switch saves. update.ts binds these at wire time.
 *
 * @param enabled Save the daily-check switch.
 * @param prereleases Save the test-version switch.
 * @returns {void}
 */
export function bindUpdateSaves(
  enabled: (on: boolean) => Promise<void>,
  prereleases: (on: boolean) => Promise<void>,
): void {
  saveUpdateEnabledHandler = enabled;
  saveUpdatePrereleasesHandler = prereleases;
}

/**
 * Save the daily update-check switch.
 *
 * @param on True to check GitHub.
 * @returns {Promise<void>}
 */
export async function saveUpdateEnabled(on: boolean): Promise<void> {
  patchSettings({ updateEnabled: on, updateBusy: true, updateStatus: "" });
  await saveUpdateEnabledHandler?.(on);
}

/**
 * Save the test-version switch.
 *
 * @param on True to include beta and rc releases.
 * @returns {Promise<void>}
 */
export async function saveUpdatePrereleases(on: boolean): Promise<void> {
  patchSettings({ updatePrereleases: on, updateBusy: true, updateStatus: "" });
  await saveUpdatePrereleasesHandler?.(on);
}
