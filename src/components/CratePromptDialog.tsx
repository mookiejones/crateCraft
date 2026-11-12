/**
 * Name/color prompt that replaced window.prompt for crate actions.
 *
 * Confirm still required before the caller POSTs. Esc and Cancel return
 * null. The field is labelled. Tooltips sit on the field and buttons.
 */

import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { t } from "../lib/i18n";
import {
  cancelCratePrompt,
  confirmCratePrompt,
  getCratePrompt,
  isSharedDialogOpen,
  setCratePromptValue,
} from "../lib/ui/shared-dialog";
import { tooltipRef } from "./tooltip-ref";
import { tips } from "../lib/ui/tooltip-strings";
import { CenteredDialog } from "./CenteredDialog";

/**
 * Crate new/rename/color/save-view prompt.
 */
export function CratePromptDialog() {
  const prompt = getCratePrompt();
  const open = isSharedDialogOpen("crate-prompt-dialog");
  const ready = Boolean(prompt.value.trim());
  return (
    <CenteredDialog id="crate-prompt-dialog" labelledBy="crate-prompt-title">
      <DialogTitle id="crate-prompt-title">{prompt.title}</DialogTitle>
      <TextField
        id="crate-prompt-input"
        inputRef={tooltipRef(tips.cratePromptName)}
        label={t("crates.promptName")}
        value={prompt.value}
        autoComplete="off"
        autoFocus={open}
        fullWidth
        margin="dense"
        onChange={(event) => setCratePromptValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter" || !ready) return;
          event.preventDefault();
          confirmCratePrompt();
        }}
      />
      <DialogActions>
        <Button
          id="crate-prompt-cancel"
          ref={tooltipRef(tips.cratePromptCancel)}
          type="button"
          sx={{ minHeight: 44 }}
          onClick={() => cancelCratePrompt()}
        >
          {t("common.cancel")}
        </Button>
        <Button
          id="crate-prompt-confirm"
          ref={tooltipRef(tips.cratePromptConfirm)}
          type="button"
          variant="contained"
          disabled={!ready}
          sx={{ minHeight: 44 }}
          onClick={() => confirmCratePrompt()}
        >
          {prompt.confirmLabel || t("common.confirm")}
        </Button>
      </DialogActions>
    </CenteredDialog>
  );
}
