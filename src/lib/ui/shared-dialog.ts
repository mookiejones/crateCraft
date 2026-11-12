/**
 * Open state for centered MUI dialogs.
 *
 * Engines still call showModal/close on the dialog node. Those methods
 * write this store. The React tree reads it. POST bodies stay in the
 * engines. Confirm still posts only after the person confirms.
 */

export const SHARED_DIALOG_IDS = [
  "consent-dialog",
  "merge-dialog",
  "album-art-dialog",
  "crates-replace-dialog",
  "relink-dialog",
  "preset-dialog",
  "folder-sync-dialog",
  "rekordbox-dialog",
  "crate-prompt-dialog",
] as const;

export type SharedDialogId = (typeof SHARED_DIALOG_IDS)[number];

const WIDE: Partial<Record<SharedDialogId, "sm" | "md" | "lg">> = {
  "merge-dialog": "md",
  "crates-replace-dialog": "md",
  "rekordbox-dialog": "md",
  "relink-dialog": "lg",
};

export type CratePromptState = {
  title: string;
  value: string;
  confirmLabel: string;
};

const openIds = new Set<SharedDialogId>();
const listeners = new Set<() => void>();
let cratePrompt: CratePromptState = { title: "", value: "", confirmLabel: "" };
let cratePromptResolve: ((value: string | null) => void) | null = null;
let ensureMount: () => void = () => {};

/**
 * Bind the React mount so a prompt can open from views without a cycle.
 *
 * @param fn Mount SharedDialogs into `#shared-dialogs`.
 * @returns {void}
 */
export function bindSharedDialogMount(fn: () => void): void {
  ensureMount = fn;
}

/**
 * Mount the MUI dialogs if a host is in the document.
 *
 * @returns {void}
 */
export function ensureSharedDialogs(): void {
  ensureMount();
}

/**
 * Subscribe to open-state changes.
 *
 * @param listener Called after a dialog opens or closes.
 * @returns Unsubscribe.
 */
export function subscribeSharedDialogs(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let escapeBound = false;

function bindEscape(): void {
  if (escapeBound) return;
  escapeBound = true;
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || event.defaultPrevented) return;
    const id = [...openIds].at(-1);
    if (!id) return;
    event.preventDefault();
    setSharedDialogOpen(id, false);
  });
}

function emit(): void {
  bindEscape();
  for (const listener of listeners) listener();
}

/**
 * Whether a shared dialog is open.
 *
 * @param id Dialog element id.
 * @returns True while that dialog is shown.
 */
export function isSharedDialogOpen(id: SharedDialogId): boolean {
  return openIds.has(id);
}

/**
 * Open or close a shared dialog.
 *
 * Closing dispatches `close` on the node so the consent listener still
 * runs. A no-op when the state did not change.
 *
 * @param id Dialog element id.
 * @param open True shows the dialog.
 * @returns {void}
 */
export function setSharedDialogOpen(id: SharedDialogId, open: boolean): void {
  const was = openIds.has(id);
  if (open === was) return;
  if (open) openIds.add(id);
  else openIds.delete(id);
  emit();
  if (!open) {
    document.getElementById(id)?.dispatchEvent(new Event("close"));
    if (id === "crate-prompt-dialog") {
      const resolve = cratePromptResolve;
      cratePromptResolve = null;
      resolve?.(null);
    }
  }
}

/**
 * Max width for one shared dialog.
 *
 * Relink is wider for the match table. The rest stay the old card size.
 *
 * @param id Dialog element id.
 * @returns MUI maxWidth.
 */
export function sharedDialogMaxWidth(id: SharedDialogId): "sm" | "md" | "lg" {
  return WIDE[id] ?? "sm";
}

/**
 * Attach HTMLDialogElement-like open/showModal/close on a MUI root.
 *
 * Engines and tests keep calling those methods. They write this store.
 *
 * @param root MUI Dialog root.
 * @param id Dialog element id.
 * @returns {void}
 */
export function bindDialogApi(root: HTMLElement, id: SharedDialogId): void {
  Object.defineProperty(root, "open", {
    configurable: true,
    enumerable: true,
    get() {
      return isSharedDialogOpen(id);
    },
    set(value: boolean) {
      setSharedDialogOpen(id, Boolean(value));
    },
  });
  Object.assign(root, {
    showModal() {
      ensureSharedDialogs();
      setSharedDialogOpen(id, true);
    },
    close() {
      setSharedDialogOpen(id, false);
    },
  });
}

/**
 * Read the crate name/color prompt fields.
 *
 * @returns Title, value, and confirm label.
 */
export function getCratePrompt(): CratePromptState {
  return cratePrompt;
}

/**
 * Type into the crate prompt without settling it.
 *
 * @param value Field text.
 * @returns {void}
 */
export function setCratePromptValue(value: string): void {
  cratePrompt = { ...cratePrompt, value };
  emit();
}

function settleCratePrompt(value: string | null): void {
  const resolve = cratePromptResolve;
  cratePromptResolve = null;
  setSharedDialogOpen("crate-prompt-dialog", false);
  resolve?.(value);
}

/**
 * Close the crate prompt without a write.
 *
 * @returns {void}
 */
export function cancelCratePrompt(): void {
  settleCratePrompt(null);
}

/**
 * Close the crate prompt and return the typed text.
 *
 * @returns {void}
 */
export function confirmCratePrompt(): void {
  settleCratePrompt(cratePrompt.value);
}

/**
 * Open the crate name/color dialog and wait for Confirm or Cancel.
 *
 * An empty confirm still resolves, and the caller treats blank as cancel.
 * Esc and Cancel resolve null. A second prompt cancels the first.
 *
 * @param next Title, starting value, and confirm label.
 * @returns The typed text, or null when cancelled.
 */
export function openCratePrompt(next: CratePromptState): Promise<string | null> {
  ensureSharedDialogs();
  if (cratePromptResolve) {
    const previous = cratePromptResolve;
    cratePromptResolve = null;
    previous(null);
  }
  cratePrompt = next;
  emit();
  setSharedDialogOpen("crate-prompt-dialog", true);
  return new Promise((resolve) => {
    cratePromptResolve = resolve;
  });
}

/**
 * True when `id` is a shared MUI dialog.
 *
 * @param id Element id.
 * @returns True for the dialogs this child owns.
 */
export function isSharedDialogId(id: string): id is SharedDialogId {
  return (SHARED_DIALOG_IDS as readonly string[]).includes(id);
}
