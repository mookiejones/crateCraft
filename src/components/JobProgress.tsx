/**
 * Determinate or indeterminate progress under Apply or Restore.
 *
 * Cancel shows while the job is still cancelable. After commit the
 * worker ignores cancel, so the button hides when `cancelable` is false.
 */

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import type { Job } from "../lib/api-types";
import { t } from "../lib/i18n";
import { isActive, progressText } from "../lib/jobs/job-view";
import { tips } from "../lib/ui/tooltip-strings";
import { tooltipRef } from "./tooltip-ref";

/**
 * Live progress for one in-flight write.
 *
 * @param job Queued or running job, or null when idle.
 * @param onCancel Cancel the job. Omitted when cancel is not offered.
 * @returns The progress block, or null.
 */
export function JobProgress({
  job,
  onCancel,
}: {
  job: Job | null;
  onCancel?: (() => void) | undefined;
}) {
  if (!isActive(job) || job == null) return null;
  const line = progressText(job);
  const determinate = job.total > 0;
  const value = determinate ? Math.min(100, (job.done / job.total) * 100) : 0;
  return (
    <Box
      id="job-progress"
      aria-live="polite"
      sx={{ display: "grid", gap: 1, mt: 1, width: "100%" }}
    >
      <p id="job-progress-text">{line}</p>
      <LinearProgress
        variant={determinate ? "determinate" : "indeterminate"}
        value={determinate ? value : undefined}
        aria-label={line}
      />
      {job.cancelable && onCancel ? (
        <Button
          type="button"
          size="small"
          id="job-cancel"
          ref={tooltipRef(tips.jobsCancel)}
          onClick={onCancel}
          sx={{ textTransform: "none", justifySelf: "start", minHeight: 44 }}
        >
          {t("jobs.cancel")}
        </Button>
      ) : null}
    </Box>
  );
}
