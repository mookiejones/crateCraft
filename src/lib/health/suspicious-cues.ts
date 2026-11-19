/**
 * Preview and apply same-time cue cleanup from Health Overview.
 */

import type { SuspiciousCuePlan } from "../api-types";
import { postJSON } from "../api";
import { state } from "../state";

function requestBody(action: "preview" | "apply", confirm: boolean): Record<string, unknown> {
  return {
    action,
    space: state.space,
    crate: state.activeCrate,
    ...(confirm ? { confirm: true } : {}),
  };
}

/** List duplicate cues that share a start time. Nothing is written. */
export function previewSuspiciousCues(): Promise<SuspiciousCuePlan> {
  return postJSON<SuspiciousCuePlan>("/api/suspicious-cues", requestBody("preview", false));
}

/** Remove those extras. Serato must be quit. */
export function applySuspiciousCues(): Promise<SuspiciousCuePlan> {
  return postJSON<SuspiciousCuePlan>("/api/suspicious-cues", requestBody("apply", true));
}
