/**
 * Bulk field edit on selected crate tracks (#27).
 *
 * POST /api/tag-clusters edit-preview lists rows that would change.
 * edit-apply writes that value through safe_write. files: true also
 * writes ID3 and MP4 text. Omit files when the box is unchecked.
 */

import { failureOf, postJSON } from "../api";
import type { TagClusterPlan } from "../api-types";
import { bridge } from "../bridge";
import { t } from "../i18n";
import { state } from "../state";
import { setNotice } from "../ui/notice-store";
import { fieldEditWrittenText } from "./field-edit-view";
import { isQueuedWrite } from "./queue-notice";

function body(
  action: "edit-preview" | "edit-apply",
  ids: readonly number[],
  field: string,
  value: string,
  files: boolean,
) {
  const payload: {
    action: "edit-preview" | "edit-apply";
    space: string;
    ids: number[];
    field: string;
    value: string;
    files?: true;
  } = {
    action,
    space: state.space,
    ids: [...ids],
    field,
    value,
  };
  if (files) payload.files = true;
  return payload;
}

/**
 * Count the selected rows that would change, without writing.
 *
 * @param ids Selected track ids.
 * @param field Library text field.
 * @param value Value to write on rows that do not already have it.
 * @returns Preview plan.
 */
export async function previewFieldEdit(
  ids: readonly number[],
  field: string,
  value: string,
  files = false,
): Promise<TagClusterPlan> {
  return postJSON<TagClusterPlan>("/api/tag-clusters", body("edit-preview", ids, field, value, files));
}

/**
 * Write the previewed value through safe_write.
 *
 * Reloads when the plan wrote. A 409 lock turns writes off.
 *
 * @param ids Selected track ids.
 * @param field Library text field.
 * @param value Value to write on rows that do not already have it.
 * @returns Apply plan.
 */
export async function applyFieldEdit(
  ids: readonly number[],
  field: string,
  value: string,
  files = false,
): Promise<TagClusterPlan> {
  try {
    const plan = await postJSON<TagClusterPlan>(
      "/api/tag-clusters",
      body("edit-apply", ids, field, value, files),
    );
    if (isQueuedWrite(plan)) {
      setNotice(t("gigLock.queued"));
      return plan;
    }
    if (plan.written) {
      await bridge.reloadLibrary();
      setNotice(fieldEditWrittenText(plan));
    }
    return plan;
  } catch (error) {
    const failed = failureOf(error);
    setNotice(failed.message, "error");
    if (failed.status === 409) {
      bridge.lockDown(error);
    }
    throw error;
  }
}
