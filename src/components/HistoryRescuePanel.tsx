/**
 * History rescue on Music → History (#482).
 */

import { useRef, useState } from "react";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type { HistoryRescueReport, HistoryRescueSource } from "../lib/api-types";
import { failureOf } from "../lib/api";
import { t } from "../lib/i18n";
import {
  fetchHistoryRescueCatalog,
  fetchHistoryRescueCompare,
  postHistoryRescue,
} from "../lib/history/history-rescue";
import {
  historyRescueStatusText,
  parseSessionIds,
  type HistoryRescueAction,
} from "../lib/history/history-rescue-view";
import { isQueuedWrite } from "../lib/crates/queue-notice";
import { setNotice } from "../lib/ui/notice-store";
import { tooltipRef } from "./tooltip-ref";
import { tips } from "../lib/ui/tooltip-strings";

const BUTTON_SX = { textTransform: "none" as const, minHeight: 44 };

/**
 * Compare, restore, or rebuild history sessions.
 */
export function HistoryRescuePanel() {
  const [source, setSource] = useState("");
  const [sessions, setSessions] = useState("");
  const [sources, setSources] = useState<HistoryRescueSource[]>([]);
  const [report, setReport] = useState<HistoryRescueReport | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const tokenRef = useRef(0);
  const ids = parseSessionIds(sessions);
  const readyCompare = Boolean(source) && !busy;
  const readyWrite = ids.length > 0 && !busy;

  async function run(
    action: HistoryRescueAction,
    confirm: boolean,
  ): Promise<void> {
    const token = ++tokenRef.current;
    setBusy(true);
    setError("");
    try {
      let payload: HistoryRescueReport;
      if (action === "scan") {
        payload = await fetchHistoryRescueCatalog();
        setSources(Array.isArray(payload.sources) ? payload.sources : []);
      } else if (action === "preview" && source && ids.length === 0) {
        payload = await fetchHistoryRescueCompare(source);
      } else {
        payload = await postHistoryRescue(action, source || "live", ids, confirm);
      }
      if (token !== tokenRef.current) return;
      if (isQueuedWrite(payload)) {
        setNotice(t("gigLock.queued"));
        return;
      }
      setReport(payload);
      if (Array.isArray(payload.sources)) {
        setSources(payload.sources);
      }
    } catch (caught) {
      if (token !== tokenRef.current) return;
      setError(failureOf(caught).message);
    } finally {
      if (token === tokenRef.current) setBusy(false);
    }
  }

  return (
    <section
      id="history-rescue"
      className="operations"
      aria-labelledby="history-rescue-heading"
    >
      <h2 id="history-rescue-heading" className="operations-heading">
        {t("historyRescue.heading")}
      </h2>
      <p className="notice">{t("historyRescue.intro")}</p>
      <TextField
        id="history-rescue-source"
        select
        label={t("historyRescue.source")}
        size="small"
        fullWidth
        value={source}
        inputRef={tooltipRef(tips.historyRescueSource)}
        onChange={(event) => setSource(event.target.value)}
        sx={{ mt: 1 }}
      >
        <MenuItem value="">{t("historyRescue.source")}</MenuItem>
        {sources
          .filter((item) => item.id && item.id !== "live")
          .map((item) => (
            <MenuItem key={String(item.id)} value={String(item.id)}>
              {item.status === "not_checked"
                ? `${item.label || item.id} (${t("historyRescue.notChecked")})`
                : item.label || item.id}
            </MenuItem>
          ))}
      </TextField>
      <TextField
        id="history-rescue-sessions"
        label={t("historyRescue.sessions")}
        size="small"
        fullWidth
        value={sessions}
        autoComplete="off"
        inputRef={tooltipRef(tips.historyRescueSessions)}
        onChange={(event) => setSessions(event.target.value)}
        sx={{ mt: 1 }}
      />
      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", gap: 1 }}>
        <Button
          id="history-rescue-scan"
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          disabled={busy}
          ref={tooltipRef(tips.historyRescueScan)}
          onClick={() => {
            void run("scan", false);
          }}
        >
          {t("historyRescue.scan")}
        </Button>
        <Button
          id="history-rescue-compare"
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          disabled={!readyCompare}
          ref={tooltipRef(tips.historyRescueCompare)}
          onClick={() => {
            void run("preview", false);
          }}
        >
          {t("historyRescue.compare")}
        </Button>
        <Button
          id="history-rescue-crates"
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          disabled={!readyWrite}
          ref={tooltipRef(tips.historyRescueCrates)}
          onClick={() => {
            void run("crates", true);
          }}
        >
          {t("historyRescue.crates")}
        </Button>
        <Button
          id="history-rescue-restore"
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          disabled={!readyWrite || !source}
          ref={tooltipRef(tips.historyRescueRestore)}
          onClick={() => {
            void run("restore", true);
          }}
        >
          {t("historyRescue.restore")}
        </Button>
      </Stack>
      <p id="history-rescue-status" className="notice" role="status" aria-live="polite">
        {error || historyRescueStatusText(report)}
      </p>
    </section>
  );
}
