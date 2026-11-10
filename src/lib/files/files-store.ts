/**
 * Subscriber list for the Files view store.
 *
 * Kept in its own file so portable.ts can notify without importing the
 * folder loader.
 */

const listeners = new Set<() => void>();

/**
 * Subscribe to Files store updates.
 *
 * @param listener Called after folder, dialog, or portable state changes.
 * @returns Unsubscribe.
 */
export function subscribeFiles(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Notify Files islands.
 *
 * @returns {void}
 */
export function emitFiles(): void {
  for (const listener of listeners) listener();
}
