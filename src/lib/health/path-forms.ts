/**
 * Preview and apply NFC/NFD path cleanup from Health Overview.
 */

import type { PathFormPlan } from "../api-types";
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

/** List extra path spellings. Nothing is written. */
export function previewPathForms(): Promise<PathFormPlan> {
  return postJSON<PathFormPlan>("/api/path-forms", requestBody("preview", false));
}

/** Keep one library row. Serato must be quit. The audio file stays. */
export function applyPathForms(): Promise<PathFormPlan> {
  return postJSON<PathFormPlan>("/api/path-forms", requestBody("apply", true));
}
