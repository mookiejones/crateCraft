/**
 * One global action-flash notice for the AppShell banner.
 *
 * Dialog and player status lines stay local. Empty text clears the
 * banner. The next write replaces the previous notice.
 */

export type NoticeSeverity = "error" | "warning" | "info" | "success";

export type Notice = {
  text: string;
  severity: NoticeSeverity;
};

let current: Notice | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

/**
 * Current banner, or null when nothing is showing.
 *
 * @returns The last notice, or null.
 */
export function getNotice(): Notice | null {
  return current;
}

/**
 * Show a banner, or hide it when `text` is empty.
 *
 * @param text Message. Empty or whitespace-only clears.
 * @param severity Alert color. Defaults to info.
 */
export function setNotice(text: string, severity: NoticeSeverity = "info"): void {
  const trimmed = text.trim();
  current = trimmed ? { text: trimmed, severity } : null;
  emit();
}

/**
 * Hide the banner.
 */
export function dismissNotice(): void {
  if (current === null) return;
  current = null;
  emit();
}

/**
 * Subscribe to banner changes.
 *
 * @param listener Called after a write or dismiss.
 * @returns Unsubscribe.
 */
export function subscribeNotice(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Clear the banner and drop listeners. Tests call this between cases.
 */
export function resetNotice(): void {
  current = null;
  listeners.clear();
}
