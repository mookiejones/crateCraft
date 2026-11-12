/**
 * Confirm dialog that replaced window.confirm for crate delete, remove
 * from library, and removing a related link.
 *
 * Confirm still required before the caller POSTs. Esc and Cancel return
 * false. The title is the action. The body is the existing confirm copy.
 * Tooltips sit on both buttons.
 */

import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { t } from "../lib/i18n";
import {
  cancelConfirm,
  confirmConfirm,
  getConfirm,
  isSharedDialogOpen,
} from "../lib/ui/shared-dialog";
import { tooltipRef } from "./tooltip-ref";
import { tips } from "../lib/ui/tooltip-strings";
import { CenteredDialog } from "./CenteredDialog";

/**
 * Destructive confirm: title, existing copy, Cancel + action.
 */
export function ConfirmDialog() {
  const prompt = getConfirm();
  const open = isSharedDialogOpen("confirm-dialog");
  return (
    <CenteredDialog
      id="confirm-dialog"
      labelledBy="confirm-title"
      describedBy="confirm-message"
    >
      <DialogTitle id="confirm-title">{prompt.title}</DialogTitle>
      <DialogContentText id="confirm-message" sx={{ px: 3, pb: 1 }}>
        {prompt.message}
      </DialogContentText>
      <DialogActions>
        <Button
          id="confirm-cancel"
          ref={tooltipRef(tips.confirmCancel)}
          type="button"
          autoFocus={open}
          sx={{ minHeight: 44 }}
          onClick={() => cancelConfirm()}
        >
          {t("common.cancel")}
        </Button>
        <Button
          id="confirm-confirm"
          ref={tooltipRef(tips.confirmAction)}
          type="button"
          variant="contained"
          sx={{ minHeight: 44 }}
          onClick={() => confirmConfirm()}
        >
          {prompt.confirmLabel || t("common.confirm")}
        </Button>
      </DialogActions>
    </CenteredDialog>
  );
}
