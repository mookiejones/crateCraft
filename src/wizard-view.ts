/**
 * First-run wizard screen.
 *
 * The state machine in wizard.ts decides the step. This file talks to
 * the local server, owns the session, and mounts the MUI Dialog inside
 * the native `#wizard` host so the shell stays dimmed. Cancel and Esc
 * do not write wizard_complete.
 */

import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { WizardScreen } from "./pages/WizardScreen";
import {
  idleWizardValue,
  WizardProvider,
  type FolderRow,
  type WizardContextValue,
} from "./containers/WizardContext";
import { onLocaleChange, serverMessage, t, type MessageKey } from "./lib/i18n";
import {
  canGoBack,
  createWizard,
  primaryAction,
  primaryEnabled,
  reduceWizard,
  snapshotBlocked,
  type LibraryStatus,
  type WizardModel,
} from "./lib/wizard/wizard";

export interface SettingsPayload {
  telemetry_consent: boolean | null;
  needs_consent_prompt: boolean;
  wizard_complete: boolean;
  telemetry_configured: boolean;
  app_version: string;
}

export interface LibraryStatusNotice {
  message: string;
  writable: boolean;
  open: boolean;
  serato_running: boolean;
  process: string | null;
}

export interface OpenOptions {
  force?: boolean;
  returnFocus?: HTMLElement | null;
  onSettings?: (payload: SettingsPayload) => void;
  onStatus?: (status: LibraryStatusNotice) => void;
}

interface SetupInfo {
  found: boolean;
  summary: string;
  next: string;
  seratoRunning: boolean;
  statusMessage: string;
  statusWritable: boolean;
}

let wired = false;
let starting = false;
let generation = 0;
let busy = false;
let model: WizardModel = createWizard({
  needsConsent: true,
  library: "pending",
  seratoRunning: false,
});
let options: OpenOptions = {};
let summary: Note | null = null;
let nextText: Note | null = null;
let statusNote: Note | null = null;
let folderOpen = false;
let folderPath = "";
let folderParent: string | null = null;
let folderName = "";
let folders: FolderRow[] = [];
let pollTimer = 0;
let polling = false;
let focusToken = 0;
let reactHost: HTMLElement | null = null;
let reactRoot: Root | null = null;

type Note = () => string;
const noteKey = (key: MessageKey): Note => () => t(key);
const noteText = (value: string): Note => () => value;

/** Open setup. A finished setup stays closed unless force is set. */
export function open(next: OpenOptions = {}): void {
  wire();
  if (starting) return;
  const dialog = wizardDialog();
  if (dialog.open && !next.force) return;
  options = next;
  starting = true;
  void begin(next).finally(() => {
    starting = false;
  });
}

function wire(): void {
  if (wired) return;
  wired = true;
  onLocaleChange(() => {
    if (wizardDialog().open) paint(false);
  });
  wizardDialog().addEventListener("cancel", (event) => {
    event.preventDefault();
    if (folderOpen) {
      closeFolders();
      return;
    }
    cancel();
  });
}

async function begin(next: OpenOptions): Promise<void> {
  generation += 1;
  const token = generation;
  stopPoll();
  folderOpen = false;
  folderPath = "";
  folderParent = null;
  folderName = "";
  folders = [];
  statusNote = null;
  busy = false;
  const settings = await loadSettings();
  if (token !== generation) return;
  if (settings.wizard_complete && !next.force) return;
  const needsUpdates = await updateChoiceMissing();
  if (token !== generation) return;
  const setup = await loadSetup();
  if (token !== generation) return;
  summary = setup ? noteText(setup.summary) : noteKey("wizard.lookFailed");
  nextText = setup ? noteText(setup.next) : noteKey("wizard.chooseCheckAgain");
  if (setup) publishStatus(setup);
  const library: LibraryStatus = setup === null ? "error" : setup.found ? "found" : "missing";
  model = createWizard({
    needsConsent: settings.needs_consent_prompt,
    library,
    seratoRunning: setup?.seratoRunning ?? false,
    needsUpdates,
  });
  paint(true);
  const dialog = wizardDialog();
  if (!dialog.open) dialog.showModal();
  ensurePoll();
}

function onBack(): void {
  if (!canGoBack(model) || busy) return;
  folderOpen = false;
  statusNote = null;
  model = reduceWizard(model, { type: "back" });
  paint(true);
  ensurePoll();
}

function cancel(): void {
  generation += 1;
  stopPoll();
  folderOpen = false;
  busy = false;
  model = reduceWizard(model, { type: "cancel" });
  closeDialog();
}

async function onPrimary(): Promise<void> {
  if (busy || !primaryEnabled(model)) return;
  const action = primaryAction(model);
  if (action === "get-started" || action === "use-library" || action === "continue") {
    folderOpen = false;
    statusNote = null;
    model = reduceWizard(model, { type: "next" });
    paint(true);
    ensurePoll();
    if (model.step === "snapshot") void refreshSerato();
    return;
  }
  if (action === "check-again") {
    await recheck();
    return;
  }
  if (action === "take-snapshot" || action === "try-again") {
    await takeSnapshot();
    return;
  }
  if (action === "open-library") {
    await finish();
  }
}

async function recheck(): Promise<void> {
  const token = generation;
  busy = true;
  statusNote = null;
  paint(false);
  const setup = await loadSetup();
  if (token !== generation) return;
  busy = false;
  if (setup === null) {
    summary = noteKey("wizard.lookFailed");
    nextText = noteKey("wizard.chooseCheckAgain");
    model = reduceWizard(model, { type: "library", status: "error" });
  } else {
    summary = noteText(setup.summary);
    nextText = noteText(setup.next);
    publishStatus(setup);
    model = reduceWizard(model, { type: "serato", running: setup.seratoRunning });
    model = reduceWizard(model, { type: "library", status: setup.found ? "found" : "missing" });
  }
  paint(false);
}

async function takeSnapshot(): Promise<void> {
  if (snapshotBlocked(model)) return;
  const token = generation;
  busy = true;
  statusNote = null;
  model = reduceWizard(model, { type: "snapshot", phase: "saving" });
  paint(false);
  try {
    await postJSON("/api/snapshots", { action: "create" }, 10 * 60 * 1000);
    if (token !== generation) return;
    model = reduceWizard(model, { type: "snapshot", phase: "saved" });
  } catch {
    if (token !== generation) return;
    model = reduceWizard(model, { type: "snapshot", phase: "error" });
    statusNote = noteKey("wizard.snapshotFailed");
  } finally {
    if (token === generation) {
      busy = false;
      paint(false);
    }
  }
}

async function chooseConsent(value: boolean): Promise<void> {
  if (busy || model.step !== "consent") return;
  const token = generation;
  busy = true;
  statusNote = noteKey("wizard.saving");
  paint(false);
  try {
    const payload = await postJSON("/api/settings", { telemetry_consent: value }, 15000);
    if (token !== generation) return;
    const settings = readSettings(payload);
    if (settings) options.onSettings?.(settings);
    busy = false;
    statusNote = null;
    model = reduceWizard(model, { type: "consent", value });
    paint(true);
  } catch {
    if (token !== generation) return;
    busy = false;
    statusNote = noteKey("wizard.consentFailed");
    paint(false);
  }
}

/** Event the main page listens for, so Settings and the banner refresh. */
export const UPDATE_CHOICE_EVENT = "serato-update-choice";

async function chooseUpdates(value: boolean): Promise<void> {
  if (busy || model.step !== "updates") return;
  const token = generation;
  busy = true;
  statusNote = noteKey("wizard.saving");
  paint(false);
  try {
    await postJSON("/api/update", { enabled: value }, 15000);
    if (token !== generation) return;
    busy = false;
    statusNote = null;
    model = reduceWizard(model, { type: "updates", value });
    window.dispatchEvent(new CustomEvent(UPDATE_CHOICE_EVENT, { detail: { enabled: value } }));
    paint(true);
  } catch {
    if (token !== generation) return;
    busy = false;
    statusNote = noteKey("wizard.updatesFailed");
    paint(false);
  }
}

/**
 * Whether setup should ask about the update check.
 *
 * Only an unanswered choice (``enabled: null``) is asked. A failed request
 * does not ask, so the check simply stays off.
 */
async function updateChoiceMissing(): Promise<boolean> {
  try {
    const payload = await getJSON("/api/update", 15000);
    return isRecord(payload) && payload.enabled === null;
  } catch {
    return false;
  }
}

async function finish(): Promise<void> {
  const token = generation;
  busy = true;
  statusNote = noteKey("wizard.opening");
  paint(false);
  try {
    const payload = await postJSON("/api/settings", { wizard_complete: true }, 15000);
    if (token !== generation) return;
    const settings = readSettings(payload);
    if (settings) options.onSettings?.(settings);
    model = reduceWizard(model, { type: "finish" });
    closeDialog();
  } catch (error) {
    if (token !== generation) return;
    statusNote = error instanceof Error ? noteText(error.message) : noteKey("wizard.finishFailed");
    busy = false;
    paint(false);
  }
}

async function showFolders(): Promise<void> {
  folderOpen = true;
  paint(false);
  await browse(folderPath);
}

function closeFolders(): void {
  folderOpen = false;
  paint(false);
  const secondary = document.getElementById("wizard-secondary");
  if (secondary instanceof HTMLButtonElement) secondary.focus();
}

async function browse(path: string): Promise<void> {
  const token = generation;
  try {
    const query = path ? `?browse=${encodeURIComponent(path)}` : "?browse=";
    const payload = await getJSON(`/api/setup${query}`, 15000);
    if (token !== generation) return;
    const listing = readBrowse(payload);
    if (!listing) {
      statusNote = noteKey("error.folder_unreadable");
      paint(false);
      return;
    }
    folderPath = listing.path;
    folderParent = listing.parent;
    folderName = listing.name;
    folders = listing.folders.slice();
    paint(false);
  } catch {
    if (token !== generation) return;
    statusNote = noteKey("error.folder_unreadable");
    paint(false);
  }
}

async function useFolder(): Promise<void> {
  if (!folderPath || busy) return;
  const token = generation;
  busy = true;
  paint(false);
  try {
    const payload = await postJSON("/api/setup", { folder: folderPath }, 15000);
    if (token !== generation) return;
    const setup = readSetup(payload);
    if (!setup) {
      statusNote = noteKey("error.folder_unreadable");
      return;
    }
    summary = noteText(setup.summary);
    nextText = noteText(setup.next);
    publishStatus(setup);
    model = reduceWizard(model, { type: "serato", running: setup.seratoRunning });
    model = reduceWizard(model, { type: "library", status: setup.found ? "found" : "missing" });
    if (setup.found) folderOpen = false;
    statusNote = null;
  } catch (error) {
    if (token !== generation) return;
    statusNote = error instanceof Error ? noteText(error.message) : noteKey("error.folder_unreadable");
  } finally {
    if (token === generation) {
      busy = false;
      paint(false);
      if (model.context.library === "found") {
        const primary = document.getElementById("wizard-primary");
        if (primary instanceof HTMLButtonElement) primary.focus();
      }
    }
  }
}

function readValue(): WizardContextValue {
  return {
    ...idleWizardValue(),
    model,
    busy,
    folderOpen,
    folderName,
    folderParent,
    folders,
    summary: summary ? summary() : "",
    nextHint: nextText ? nextText() : "",
    statusNote: statusNote ? statusNote() : "",
    focusToken,
    onPrimary: () => {
      void onPrimary();
    },
    onBack,
    onCancel: cancel,
    onChooseFolder: () => {
      void showFolders();
    },
    onConsent: (value) => {
      void chooseConsent(value);
    },
    onUpdates: (value) => {
      void chooseUpdates(value);
    },
    onFolderUp: () => {
      if (folderParent) void browse(folderParent);
    },
    onFolderUse: () => {
      void useFolder();
    },
    onFolderClose: closeFolders,
    onBrowse: (path) => {
      void browse(path);
    },
  };
}

function paint(moveFocus: boolean): void {
  if (moveFocus) focusToken += 1;
  flushSync(() => {
    wizardRoot().render(
      createElement(WizardProvider, {
        value: readValue(),
        children: createElement(WizardScreen),
      }),
    );
  });
}

function wizardRoot(): Root {
  const dialog = wizardDialog();
  if (reactRoot && reactHost === dialog) return reactRoot;
  reactRoot?.unmount();
  reactHost = dialog;
  reactRoot = createRoot(dialog);
  return reactRoot;
}

function publishStatus(setup: SetupInfo): void {
  if (setup.statusMessage.length === 0) return;
  options.onStatus?.({
    message: setup.statusMessage,
    writable: setup.statusWritable,
    open: setup.seratoRunning,
    serato_running: setup.seratoRunning,
    process: setup.seratoRunning ? "Serato DJ" : null,
  });
}

function ensurePoll(): void {
  stopPoll();
  if (!wizardDialog().open) return;
  pollTimer = window.setInterval(() => {
    void refreshSerato();
  }, 2000);
}

async function refreshSerato(): Promise<void> {
  if (polling) return;
  if (!wizardDialog().open) {
    stopPoll();
    return;
  }
  polling = true;
  const token = generation;
  try {
    const setup = await loadSetup();
    if (token !== generation || !setup) return;
    publishStatus(setup);
    if (model.step !== "snapshot" || model.context.snapshot === "saved") return;
    const wasBlocked = snapshotBlocked(model);
    model = reduceWizard(model, { type: "serato", running: setup.seratoRunning });
    if (snapshotBlocked(model) !== wasBlocked) paint(false);
  } finally {
    polling = false;
  }
}

function stopPoll(): void {
  if (pollTimer) window.clearInterval(pollTimer);
  pollTimer = 0;
}

function closeDialog(): void {
  stopPoll();
  const dialog = wizardDialog();
  if (dialog.open) dialog.close();
  const target = options.returnFocus;
  if (target instanceof HTMLElement && target.isConnected) target.focus();
}

async function loadSettings(): Promise<SettingsPayload> {
  try {
    const payload = await getJSON("/api/settings", 15000);
    return readSettings(payload) ?? fallbackSettings();
  } catch {
    return fallbackSettings();
  }
}

async function loadSetup(): Promise<SetupInfo | null> {
  try {
    const payload = await getJSON("/api/setup", 15000);
    return readSetup(payload);
  } catch {
    return null;
  }
}

function fallbackSettings(): SettingsPayload {
  return {
    telemetry_consent: null,
    needs_consent_prompt: true,
    wizard_complete: false,
    telemetry_configured: false,
    app_version: "",
  };
}

function readSettings(value: unknown): SettingsPayload | null {
  if (!isRecord(value) || typeof value.needs_consent_prompt !== "boolean") return null;
  const consent = value.telemetry_consent;
  return {
    telemetry_consent: typeof consent === "boolean" ? consent : null,
    needs_consent_prompt: value.needs_consent_prompt,
    wizard_complete: value.wizard_complete === true,
    telemetry_configured: value.telemetry_configured === true,
    app_version: typeof value.app_version === "string" ? value.app_version : "",
  };
}

function readSetup(value: unknown): SetupInfo | null {
  if (!isRecord(value) || typeof value.found !== "boolean" || typeof value.summary !== "string") return null;
  return {
    found: value.found,
    summary: value.summary,
    next: typeof value.next === "string" ? value.next : "",
    seratoRunning: value.serato_running === true,
    statusMessage: typeof value.status_message === "string" ? value.status_message : "",
    statusWritable: value.status_writable === true,
  };
}

function readBrowse(value: unknown): { path: string; parent: string | null; name: string; folders: FolderRow[] } | null {
  if (!isRecord(value) || typeof value.path !== "string" || typeof value.name !== "string") return null;
  if (!Array.isArray(value.folders)) return null;
  const folders: FolderRow[] = [];
  for (const entry of value.folders) {
    if (!isRecord(entry) || typeof entry.name !== "string" || typeof entry.path !== "string") continue;
    folders.push({ name: entry.name, path: entry.path });
  }
  const parent = typeof value.parent === "string" ? value.parent : null;
  return { path: value.path, parent, name: value.name, folders };
}

async function getJSON(url: string, timeoutMs: number): Promise<unknown> {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(plainError(payload));
  return payload;
}

async function postJSON(url: string, body: Record<string, string | boolean>, timeoutMs: number): Promise<unknown> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(plainError(payload));
  return payload;
}

function plainError(payload: unknown): string {
  const raw = isRecord(payload) && typeof payload.error === "string" ? payload.error : "";
  if (!raw || raw.includes("/") || raw.includes("\\") || raw.toLowerCase().includes("sqlite")) {
    return t("wizard.genericError");
  }
  const code = isRecord(payload) && typeof payload.code === "string" ? payload.code : undefined;
  return serverMessage({ error: raw, code }, raw);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function wizardDialog(): HTMLDialogElement {
  const node = document.getElementById("wizard");
  if (!(node instanceof HTMLDialogElement)) throw new Error("Missing wizard");
  return node;
}
