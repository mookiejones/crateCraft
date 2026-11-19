/**
 * Completion snackbar for a finished write job.
 *
 * Undo restores the before-write snapshot. View details opens the
 * error list. Failed jobs use role=alert; others use role=status.
 */

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Snackbar from "@mui/material/Snackbar";
import { failureOf } from "../lib/api";
import { bridge } from "../lib/bridge";
import { t } from "../lib/i18n";
import { toastSeverity, toastText } from "../lib/jobs/job-view";
import { setNotice } from "../lib/ui/notice-store";
import { useJobs } from "../containers/JobContext";
import { tips } from "../lib/ui/tooltip-strings";
import { tooltipRef } from "./tooltip-ref";

/**
 * App-wide job completion toast and details dialog.
 *
 * @returns Snackbar, details dialog, or null.
 */
export function JobToast() {
  const jobs = useJobs();
  const toast = jobs.toast;
  const details = jobs.details;

  async function onUndo(): Promise<void> {
    if (!toast) return;
    try {
      await jobs.undoJob(toast.id);
      jobs.dismissToast();
      await bridge.reloadLibrary();
    } catch (error) {
      setNotice(failureOf(error).message, "error");
    }
  }

  return (
    <>
      {toast ? (
        <Snackbar
          open
          autoHideDuration={8000}
          onClose={(_, reason) => {
            if (reason === "clickaway") return;
            jobs.dismissToast();
          }}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            id="job-toast"
            severity={toastSeverity(toast.state)}
            role={toast.state === "failed" ? "alert" : "status"}
            aria-live={toast.state === "failed" ? "assertive" : "polite"}
            onClose={jobs.dismissToast}
            slotProps={{
              closeButton: { "aria-label": t("common.close") },
            }}
            action={
              <>
                {toast.snapshot_id ? (
                  <Button
                    color="inherit"
                    size="small"
                    id="job-undo"
                    ref={tooltipRef(tips.jobsUndo)}
                    onClick={() => {
                      void onUndo();
                    }}
                  >
                    {t("jobs.undo")}
                  </Button>
                ) : null}
                <Button
                  color="inherit"
                  size="small"
                  id="job-details"
                  ref={tooltipRef(tips.jobsDetails)}
                  onClick={() => jobs.openDetails(toast)}
                >
                  {t("jobs.details")}
                </Button>
              </>
            }
          >
            {toastText(toast)}
          </Alert>
        </Snackbar>
      ) : null}
      <Dialog
        open={details !== null}
        onClose={jobs.closeDetails}
        aria-labelledby="job-details-title"
      >
        <DialogTitle id="job-details-title">{details?.label ?? ""}</DialogTitle>
        <DialogContent>
          <ul id="job-details-errors" aria-live="assertive">
            {(details?.errors ?? []).map((line, index) => (
              <li key={`${index}:${line}`}>{line}</li>
            ))}
          </ul>
          {details && details.errors.length === 0 ? (
            <p>{toastText(details)}</p>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button type="button" onClick={jobs.closeDetails}>
            {t("jobs.closeDetails")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
