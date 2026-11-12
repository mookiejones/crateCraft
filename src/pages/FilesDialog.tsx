/**
 * Rename, move, replace, and trash review dialog painted by React.
 *
 * Confirm posts only after a preview that can be saved. The crate
 * Rename from tags control opens this same dialog. Host stays
 * `#files-dialog`; the modal is MUI Dialog.
 */

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { useFiles } from "../containers/FilesContext";
import { t } from "../lib/i18n";
import { setTooltip } from "../lib/ui/tooltip";
import { tips, type TipSpec } from "../lib/ui/tooltip-strings";

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
    <Dialog
      open={files.dialogOpen}
      onClose={(_event, reason) => {
        if (reason === "backdropClick") return;
        files.closeDialog();
      }}
      aria-labelledby="files-dialog-title"
      disableAutoFocus
      disableScrollLock
      keepMounted
      fullWidth
      maxWidth="sm"
      sx={{ "& .MuiDialog-paper": { maxWidth: "42rem" } }}
    >
      <DialogTitle id="files-dialog-title" component="h2">
        {t("files.reviewTitle")}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="files-summary" component="p">
          {preview?.summary || ""}
        </DialogContentText>
        <DialogContentText className="dialog-note" component="p">
          {t("files.nothingUntilConfirm")}
        </DialogContentText>
        <Box
          id="files-name-label"
          className="files-field"
          hidden={action !== "rename"}
          sx={action !== "rename" ? { display: "none" } : undefined}
        >
          <TextField
            id="files-name"
            label={t("files.newName")}
            fullWidth
            autoComplete="off"
            value={files.dialogName}
            inputRef={tooltipRef(tips.filesName)}
            onInput={(event) => files.setDialogName((event.target as HTMLInputElement).value)}
          />
        </Box>
        <Box
          id="files-replace-label"
          className="files-field"
          hidden={action !== "replace"}
          sx={action !== "replace" ? { display: "none" } : undefined}
        >
          <TextField
            id="files-replacement"
            label={t("files.newFile")}
            fullWidth
            autoComplete="off"
            value={files.dialogReplacement}
            inputRef={tooltipRef(tips.filesReplacement)}
            slotProps={{ htmlInput: { spellCheck: false } }}
            onInput={(event) => files.setDialogReplacement((event.target as HTMLInputElement).value)}
          />
        </Box>
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
      </DialogContent>
      <DialogActions className="dialog-actions">
        <Button
          id="files-cancel"
          type="button"
          ref={tooltipRef(tips.filesCancel)}
          onClick={() => files.closeDialog()}
        >
          {t("common.cancel")}
        </Button>
        <Button
          id="files-review"
          type="button"
          ref={tooltipRef(tips.filesReview)}
          hidden={reviewHidden}
          sx={reviewHidden ? { display: "none" } : undefined}
          onClick={() => {
            void files.review();
          }}
        >
          {t("files.review")}
        </Button>
        <Button
          id="files-confirm"
          type="button"
          ref={tooltipRef(confirmTip)}
          className={action === "delete" ? "danger" : undefined}
          color={action === "delete" ? "error" : "primary"}
          variant="contained"
          disabled={!ready}
          onClick={() => {
            void files.confirm();
          }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
