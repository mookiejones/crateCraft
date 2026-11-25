/**
 * History rescue on Music → History (#482).
 */

import { useRef, useState } from "react";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import type { HistoryRescueReport, HistoryRescueSource } from "../lib/api-types";
import { failureOf } from "../lib/api";
import { t } from "../lib/i18n";
import {
  fetchHistoryRescueCatalog,
  fetchHistoryRescueCompare,
  postHistoryRescue,
} from "../lib/history/history-rescue";
import {
  historyRescueSessionRows,
  historyRescueSideLabel,
  historyRescueStatusText,
  type HistoryRescueAction,
} from "../lib/history/history-rescue-view";
import { isQueuedWrite } from "../lib/crates/queue-notice";
import { setNotice } from "../lib/ui/notice-store";
import { tooltipRef } from "./tooltip-ref";
import { tips } from "../lib/ui/tooltip-strings";

const BUTTON_SX = { textTransform: "none" as const, minHeight: 44 };

/**
 * Compare, restore, or rebuild history sessions.
 *
 * Catalog and compare stay behind Scan / Compare so a language repaint of
 * History does not fetch.
 */
export function HistoryRescuePanel() {
  const [source, setSource] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [sources, setSources] = useState<HistoryRescueSource[]>([]);
  const [report, setReport] = useState<HistoryRescueReport | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const tokenRef = useRef(0);
  const rows = historyRescueSessionRows(report);
  const ids = selected.filter((id) => rows.some((row) => row.id === id && row.selectable));
  const readyCompare = Boolean(source) && !busy;
  const readyWrite = ids.length > 0 && !busy;

  function toggleSession(id: number, on: boolean): void {
    setSelected((prev) => {
      if (on) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((value) => value !== id);
    });
  }

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
        setSelected([]);
      } else if (action === "preview" && source && ids.length === 0) {
        payload = await fetchHistoryRescueCompare(source);
        setSelected([]);
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
      <label className="field" htmlFor="history-rescue-source">
        <span className="field-label">{t("historyRescue.source")}</span>
        <select
          id="history-rescue-source"
          value={source}
          ref={tooltipRef(tips.historyRescueSource)}
          onChange={(event) => setSource(event.target.value)}
        >
          <option value="">{t("historyRescue.source")}</option>
          {sources
            .filter((item) => item.id && item.id !== "live")
            .map((item) => (
              <option key={String(item.id)} value={String(item.id)}>
                {item.status === "not_checked"
                  ? `${item.label || item.id} (${t("historyRescue.notChecked")})`
                  : item.label || item.id}
              </option>
            ))}
        </select>
      </label>
      <div
        id="history-rescue-sessions"
        className="history-rescue-sessions"
        role="group"
        aria-label={t("historyRescue.sessions")}
        ref={tooltipRef(tips.historyRescueSessions)}
      >
        <p className="field-label">{t("historyRescue.sessions")}</p>
        {rows.length === 0 ? (
          <p className="notice">{t("historyRescue.sessionsEmpty")}</p>
        ) : (
          <ul className="history-rescue-session-list">
            {rows.map((row) => (
              <li key={`${row.side}-${row.id}`}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={selected.includes(row.id)}
                      disabled={!row.selectable || busy}
                      onChange={(event) => toggleSession(row.id, event.target.checked)}
                      slotProps={{
                        input: {
                          "aria-label": t("historyRescue.sessionRow", {
                            id: row.id,
                            name: row.name,
                            side: historyRescueSideLabel(row.side),
                          }),
                          ref: tooltipRef(tips.historyRescueSession),
                        },
                      }}
                    />
                  }
                  label={t("historyRescue.sessionRow", {
                    id: row.id,
                    name: row.name,
                    side: historyRescueSideLabel(row.side),
                  })}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
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
