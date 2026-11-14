/**
 * Bulk field editor for checked Crates rows (#27).
 *
 * Review posts edit-preview. Apply stays off until that preview matches
 * the current field, value, and ids. Audio files stay as they are.
 */

import { useEffect, useMemo, useState } from "react";
import Button from "@mui/material/Button";
import { failureOf } from "../lib/api";
import type { TagClusterPlan } from "../lib/api-types";
import { applyFieldEdit, previewFieldEdit } from "../lib/crates/field-edit";
import {
  EDIT_FIELDS,
  fieldEditApplyReady,
  fieldEditLabel,
  fieldEditPreviewText,
  fieldEditSelectedText,
  fieldEditShows,
  type EditField,
  type FieldEditRequest,
} from "../lib/crates/field-edit-view";
import { t } from "../lib/i18n";
import { tips } from "../lib/ui/tooltip-strings";
import { useTrackList } from "../containers/TrackListContext";
import { tooltipRef } from "./tooltip-ref";

const BUTTON_SX = { textTransform: "none" as const, minHeight: 44 };

export type FieldEditorBarProps = {
  selectedIds: readonly number[];
};

function asEditField(value: string): EditField {
  return (EDIT_FIELDS as readonly string[]).includes(value) ? (value as EditField) : "genre";
}

/**
 * Bar above the Crates grid when two or more rows are checked.
 *
 * @param props Checked track ids from the list window.
 */
export function FieldEditorBar({ selectedIds }: FieldEditorBarProps) {
  const list = useTrackList();
  const [field, setField] = useState<EditField>("genre");
  const [value, setValue] = useState("");
  const [plan, setPlan] = useState<TagClusterPlan | null>(null);
  const [previewed, setPreviewed] = useState<FieldEditRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const idsKey = selectedIds.join(",");

  useEffect(() => {
    const count = idsKey === "" ? 0 : idsKey.split(",").filter(Boolean).length;
    setPlan(null);
    setPreviewed(null);
    setBusy(false);
    setStatus(fieldEditShows(count) ? fieldEditSelectedText(count) : "");
  }, [idsKey]);

  const current = useMemo<FieldEditRequest>(
    () => ({ ids: [...selectedIds], field, value }),
    [selectedIds, field, value],
  );
  const applyReady = fieldEditApplyReady(plan, previewed, current, list.writable, busy);

  if (!fieldEditShows(selectedIds.length)) return null;

  async function onPreview(): Promise<void> {
    const fieldNode = document.querySelector<HTMLSelectElement>("#field-edit-field");
    const valueNode = document.querySelector<HTMLInputElement>("#field-edit-value");
    const nextField = asEditField(fieldNode?.value ?? field);
    const nextValue = valueNode?.value ?? value;
    setField(nextField);
    setValue(nextValue);
    const request: FieldEditRequest = { ids: [...selectedIds], field: nextField, value: nextValue };
    setBusy(true);
    setStatus(t("fieldEdit.checking"));
    try {
      const nextPlan = await previewFieldEdit(request.ids, request.field, request.value);
      setPlan(nextPlan);
      setPreviewed(request);
      setStatus(fieldEditPreviewText(nextPlan));
    } catch (error) {
      setPlan(null);
      setPreviewed(null);
      setStatus(failureOf(error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onApply(): Promise<void> {
    if (!fieldEditApplyReady(plan, previewed, current, list.writable, busy)) return;
    setBusy(true);
    try {
      await applyFieldEdit(current.ids, current.field, current.value);
    } catch {
      // applyFieldEdit already noticed and locked on 409.
    } finally {
      setBusy(false);
    }
  }

  return (
    <div id="field-edit" className="field-edit">
      <p id="field-edit-count">{fieldEditSelectedText(selectedIds.length)}</p>
      <label className="field-edit-field">
        {t("tags.field")}
        <select
          id="field-edit-field"
          value={field}
          disabled={busy}
          ref={tooltipRef(tips.fieldEditField)}
          onChange={(event) => setField(asEditField(event.currentTarget.value))}
        >
          {EDIT_FIELDS.map((name) => (
            <option key={name} value={name}>
              {fieldEditLabel(name)}
            </option>
          ))}
        </select>
      </label>
      <label className="field-edit-value">
        {t("fieldEdit.value")}
        <input
          id="field-edit-value"
          type="text"
          value={value}
          disabled={busy}
          ref={tooltipRef(tips.fieldEditValue)}
          onChange={(event) => setValue(event.currentTarget.value)}
          onInput={(event) => setValue(event.currentTarget.value)}
        />
      </label>
      <Button
        id="field-edit-preview"
        type="button"
        size="small"
        variant="outlined"
        sx={BUTTON_SX}
        ref={tooltipRef(tips.fieldEditPreview)}
        disabled={busy}
        onClick={() => {
          void onPreview();
        }}
      >
        {t("tags.preview")}
      </Button>
      <Button
        id="field-edit-apply"
        type="button"
        size="small"
        variant="outlined"
        sx={BUTTON_SX}
        ref={tooltipRef(tips.fieldEditApply)}
        disabled={!applyReady}
        onClick={() => {
          void onApply();
        }}
      >
        {t("tags.apply")}
      </Button>
      <p id="field-edit-status" className="field-edit-status" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
