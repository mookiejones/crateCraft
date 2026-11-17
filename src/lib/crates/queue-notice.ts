/**
 * Detect a write that sat in the Gig Lock queue instead of applying.
 */

/**
 * True when the POST stored the edit and left the library untouched.
 *
 * @param result JSON body from a crate, track, or file write.
 * @returns True when `queued` is true.
 */
export function isQueuedWrite(result: unknown): boolean {
  return (
    typeof result === "object" &&
    result !== null &&
    "queued" in result &&
    result.queued === true
  );
}
