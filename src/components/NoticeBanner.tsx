/**
 * Persistent MUI Alert under the AppBar lock banner.
 *
 * Empty notice renders nothing. Error and warning use role=alert.
 * Success and info use role=status. Dismiss stays until the next notice.
 */

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import { useNotice } from "../containers/NoticeContext";
import { t } from "../lib/i18n";

/**
 * App-wide action-flash banner.
 *
 * @returns The Alert, or null when nothing is showing.
 */
export function NoticeBanner() {
  const { notice, dismiss } = useNotice();
  if (!notice) return null;
  const assertive = notice.severity === "error" || notice.severity === "warning";
  return (
    <Box sx={{ px: 2, py: 1, flexShrink: 0 }}>
      <Alert
        id="app-notice"
        severity={notice.severity}
        role={assertive ? "alert" : "status"}
        onClose={dismiss}
        slotProps={{
          closeButton: { "aria-label": t("common.close") },
        }}
      >
        {notice.text}
      </Alert>
    </Box>
  );
}
