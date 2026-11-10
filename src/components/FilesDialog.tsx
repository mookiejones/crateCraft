/**
 * Rename, move, replace, and trash review dialog painted by React.
 *
 * Confirm posts only after a preview that can be saved. The crate
 * Rename from tags control opens this same dialog.
 */

import { useEffect } from "react";
import { useFiles } from "../context/FilesContext";
import { t } from "../i18n";
import { setTooltip } from "../tooltip";
import { tips, type TipSpec } from "../tooltip-strings";

function tooltipRef(spec: TipSpec) {
  return (element: HTMLElement | null) => {
    if (element) setTooltip(element, spec);
  };
}

/**
 * Review dialog for one file action.
 */
export function FilesDialog() {
  const files = useFiles();
  useEffect(() => {
    const dialog = document.getElementById("files-dialog");
    if (!(dialog instanceof HTMLDialogElement)) return;
    const onCancel = (event: Event) => {
      event.preventDefault();
      files.closeDialog();
    };
    dialog.addEventListener("cancel", onCancel);
    return () => dialog.removeEventListener("cancel", onCancel);
  }, [files.closeDialog]);
  const action = files.dialogAction;
  const preview = files.dialogPreview;
  const ready = Boolean(preview?.ok && files.writable && preview.needs_confirm);
  const reviewHidden = action === "delete"
    || action === "move"
    || action === "move_folder"
    || action === "rename_from_tags";
  const status = !files.writable
    ? (document.getElementById("status")?.textContent ?? files.dialogStatus)
    : files.dialogStatus;
  const confirmLabel = action === "delete" ? t("files.moveToTrash") : t("common.confirm");
  const confirmTip = action === "delete" ? tips.filesMoveTrash : tips.filesConfirm;

  return (
    <>
      <h2 id="files-dialog-title">{t("files.reviewTitle")}</h2>
      <p id="files-summary">{preview?.summary || ""}</p>
      <p className="dialog-note">{t("files.nothingUntilConfirm")}</p>
      <label id="files-name-label" className="files-field" hidden={action !== "rename"}>
        <span>{t("files.newName")}</span>
        <input
          id="files-name"
          ref={tooltipRef(tips.filesName)}
          type="text"
          autoComplete="off"
          value={files.dialogName}
          onInput={(event) => files.setDialogName(event.currentTarget.value)}
        />
      </label>
      <label id="files-replace-label" className="files-field" hidden={action !== "replace"}>
        <span>{t("files.newFile")}</span>
        <input
          id="files-replacement"
          ref={tooltipRef(tips.filesReplacement)}
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={files.dialogReplacement}
          onInput={(event) => files.setDialogReplacement(event.currentTarget.value)}
        />
      </label>
      <ul id="files-changes">
        {(preview?.changes || []).map((change, index) => {
          const crates = Array.isArray(change.crates) && change.crates.length
            ? ` ${t("files.changeCrates", { crates: change.crates.join(", ") })}`
            : "";
          const effect = change.effect === "trash" ? t("files.trash") : change.to;
          return (
            <li key={`change-${index}`}>{`${change.from} → ${effect}${crates}`}</li>
          );
        })}
        {(preview?.skipped || []).map((skip, index) => (
          <li key={`skip-${index}`}>{skip}</li>
        ))}
        {preview?.more
          ? <li key="more">{t("files.andMore", { count: Number(preview.more) })}</li>
          : null}
      </ul>
      <p id="files-warning" className="dialog-note">{preview?.warning || ""}</p>
      <p id="files-dialog-status" className="dialog-status" role="status" aria-live="polite">{status}</p>
      <div className="dialog-actions">
        <button
          id="files-cancel"
          type="button"
          ref={tooltipRef(tips.filesCancel)}
          onClick={() => files.closeDialog()}
        >
          {t("common.cancel")}
        </button>
        <button
          id="files-review"
          type="button"
          ref={tooltipRef(tips.filesReview)}
          hidden={reviewHidden}
          onClick={() => {
            void files.review();
          }}
        >
          {t("files.review")}
        </button>
        <button
          id="files-confirm"
          type="button"
          ref={tooltipRef(confirmTip)}
          className={action === "delete" ? "danger" : undefined}
          disabled={!ready}
          onClick={() => {
            void files.confirm();
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </>
  );
}
