/**
 * Backup Mac on Backups: staged LAN copy, never an automatic mirror.
 */

import { useRef, useState } from "react";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type { LanStageReport } from "../lib/api-types";
import { failureOf } from "../lib/api";
import { t } from "../lib/i18n";
import { isQueuedWrite } from "../lib/crates/queue-notice";
import { fetchLanStage, postLanStage } from "../lib/snapshots/lan-stage";
import {
  addedText,
  byteText,
  canPreview,
  canSend,
  listeningText,
  reasonText,
  stageStatusText,
} from "../lib/snapshots/lan-stage-view";
import { state } from "../lib/state";
import { setNotice } from "../lib/ui/notice-store";
import { tips } from "../lib/ui/tooltip-strings";
import { tooltipRef } from "./tooltip-ref";

const BUTTON_SX = { textTransform: "none" as const, minHeight: 44 };

/**
 * Pair, preview, send, and add a staged copy.
 *
 * Nothing is fetched until a button is pressed, so opening Backups
 * does not listen and does not mirror.
 */
export function LanStagePanel() {
  const [host, setHost] = useState("");
  const [port, setPort] = useState("8766");
  const [code, setCode] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [previewIds, setPreviewIds] = useState<number[]>([]);
  const [fingerprint, setFingerprint] = useState("");
  const [report, setReport] = useState<LanStageReport | null>(null);
  const [status, setStatus] = useState<LanStageReport | null>(null);
  const [inboxId, setInboxId] = useState("");
  const [acceptReady, setAcceptReady] = useState(false);
  const [discardArmed, setDiscardArmed] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const tokenRef = useRef(0);
  const crates = state.crates.filter((crate) => crate.name);
  const portNumber = Number(port);
  const sendReady = canSend(selected, previewIds, fingerprint) && host.trim() !== "" && Number.isInteger(portNumber);
  const snapshotId = report?.snapshot_id || status?.inbox?.find((item) => item.id === inboxId)?.snapshot_id || "";

  function toggleCrate(id: number, on: boolean): void {
    setSelected((prev) => {
      const next = on ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((value) => value !== id);
      return next;
    });
    setFingerprint("");
    setPreviewIds([]);
  }

  async function run(body: Record<string, unknown>): Promise<LanStageReport | null> {
    const token = ++tokenRef.current;
    setBusy(true);
    setError("");
    try {
      const payload = await postLanStage(body);
      if (token !== tokenRef.current) return null;
      if (isQueuedWrite(payload)) {
        setNotice(t("gigLock.queued"));
        return payload;
      }
      setReport(payload);
      return payload;
    } catch (caught) {
      if (token !== tokenRef.current) return null;
      setError(failureOf(caught).message);
      return null;
    } finally {
      if (token === tokenRef.current) setBusy(false);
    }
  }

  async function refresh(): Promise<void> {
    const token = ++tokenRef.current;
    setBusy(true);
    setError("");
    try {
      const payload = await fetchLanStage();
      if (token !== tokenRef.current) return;
      setStatus(payload);
      const inbox = payload.inbox ?? [];
      if (inboxId && !inbox.some((item) => item.id === inboxId)) setInboxId("");
    } catch (caught) {
      if (token !== tokenRef.current) return;
      setError(failureOf(caught).message);
    } finally {
      if (token === tokenRef.current) setBusy(false);
    }
  }

  const line = error || addedText(report) || stageStatusText(report);
  const problems = [...(report?.skipped ?? []), ...(report?.failed ?? []), ...(report?.unmatched ?? [])];

  return (
    <section id="lan-stage" className="operations" aria-labelledby="lan-stage-heading">
      <h2 id="lan-stage-heading" className="operations-heading">{t("lanStage.heading")}</h2>
      <p className="notice">{t("lanStage.intro")}</p>
      <p className="notice">{t("lanStage.never")}</p>
      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", gap: 1 }}>
        <Button
          id="lan-stage-listen"
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          disabled={busy}
          ref={tooltipRef(tips.lanStageListen)}
          onClick={() => {
            void run({ action: "listen" }).then((payload) => {
              if (payload && !isQueuedWrite(payload)) setStatus(payload);
            });
          }}
        >
          {t("lanStage.listen")}
        </Button>
        <Button
          id="lan-stage-stop"
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          disabled={busy}
          ref={tooltipRef(tips.lanStageStop)}
          onClick={() => {
            void run({ action: "stop" }).then((payload) => {
              if (payload) setStatus(payload);
            });
          }}
        >
          {t("lanStage.stop")}
        </Button>
        <Button
          id="lan-stage-refresh"
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          disabled={busy}
          ref={tooltipRef(tips.lanStageRefresh)}
          onClick={() => {
            void refresh();
          }}
        >
          {t("lanStage.refresh")}
        </Button>
      </Stack>
      <p id="lan-stage-listen-status" className="notice" role="status">{listeningText(status)}</p>
      <TextField
        id="lan-stage-inbox"
        select
        label={t("lanStage.inboxLabel")}
        size="small"
        fullWidth
        value={inboxId}
        disabled={busy || !(status?.inbox && status.inbox.length)}
        slotProps={{ htmlInput: { "aria-label": t("lanStage.inboxLabel") } }}
        inputRef={tooltipRef(tips.lanStageInbox)}
        onChange={(event) => {
          setInboxId(event.target.value);
          setAcceptReady(false);
          setDiscardArmed(false);
        }}
        sx={{ mt: 1 }}
      >
        <MenuItem value="">{t("lanStage.inboxEmpty")}</MenuItem>
        {(status?.inbox ?? []).map((item) => (
          <MenuItem key={item.id} value={item.id ?? ""}>
            {t("lanStage.inbox", {
              label: item.label || item.id || "",
              files: item.file_count ?? 0,
              size: byteText(item.byte_count ?? 0),
            })}
          </MenuItem>
        ))}
      </TextField>
      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", gap: 1 }}>
        <Button
          id="lan-stage-accept"
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          disabled={busy || !inboxId}
          ref={tooltipRef(tips.lanStageAccept)}
          onClick={() => {
            void run({ action: "accept", id: inboxId, confirm: false }).then((payload) => {
              if (payload && !payload.library_written) setAcceptReady(true);
            });
          }}
        >
          {t("lanStage.accept")}
        </Button>
        <Button
          id="lan-stage-accept-confirm"
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          disabled={busy || !acceptReady || !inboxId}
          ref={tooltipRef(tips.lanStageConfirmAccept)}
          onClick={() => {
            void run({ action: "accept", id: inboxId, confirm: true }).then((payload) => {
              if (payload?.library_written) {
                setAcceptReady(false);
                void refresh();
              }
            });
          }}
        >
          {t("lanStage.confirmAccept")}
        </Button>
        <Button
          id="lan-stage-undo"
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          disabled={busy || !snapshotId}
          ref={tooltipRef(tips.lanStageUndo)}
          onClick={() => {
            void run({ action: "undo", id: inboxId, snapshot_id: snapshotId, confirm: true }).then(() => {
              void refresh();
            });
          }}
        >
          {t("lanStage.undo")}
        </Button>
        <Button
          id="lan-stage-discard"
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          disabled={busy || !inboxId}
          ref={tooltipRef(tips.lanStageDiscard)}
          onClick={() => {
            setDiscardArmed(true);
          }}
        >
          {t("lanStage.discard")}
        </Button>
        <Button
          id="lan-stage-discard-confirm"
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          disabled={busy || !discardArmed || !inboxId}
          ref={tooltipRef(tips.lanStageConfirmDiscard)}
          onClick={() => {
            void run({ action: "discard", id: inboxId, confirm: true }).then((payload) => {
              if (payload?.removed) {
                setInboxId("");
                setDiscardArmed(false);
                setAcceptReady(false);
                void refresh();
              }
            });
          }}
        >
          {t("lanStage.confirmDiscard")}
        </Button>
      </Stack>
      <TextField
        id="lan-stage-host"
        label={t("lanStage.host")}
        size="small"
        fullWidth
        value={host}
        autoComplete="off"
        slotProps={{ htmlInput: { spellCheck: false } }}
        inputRef={tooltipRef(tips.lanStageHost)}
        onChange={(event) => setHost(event.target.value)}
        sx={{ mt: 1 }}
      />
      <TextField
        id="lan-stage-port"
        label={t("lanStage.port")}
        size="small"
        fullWidth
        value={port}
        autoComplete="off"
        slotProps={{ htmlInput: { inputMode: "numeric" } }}
        inputRef={tooltipRef(tips.lanStagePort)}
        onChange={(event) => setPort(event.target.value)}
        sx={{ mt: 1 }}
      />
      <TextField
        id="lan-stage-code"
        label={t("lanStage.code")}
        size="small"
        fullWidth
        value={code}
        autoComplete="off"
        slotProps={{ htmlInput: { spellCheck: false, autoCapitalize: "off" } }}
        inputRef={tooltipRef(tips.lanStageCode)}
        onChange={(event) => setCode(event.target.value)}
        sx={{ mt: 1 }}
      />
      <div id="lan-stage-crates" role="group" aria-label={t("lanStage.crates")}>
        <p className="field-label">{t("lanStage.crates")}</p>
        {crates.length === 0 ? (
          <p className="notice">{t("lanStage.noCrates")}</p>
        ) : (
          <ul className="history-rescue-session-list">
            {crates.map((crate) => (
              <li key={crate.id}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={selected.includes(crate.id)}
                      disabled={busy}
                      onChange={(event) => toggleCrate(crate.id, event.target.checked)}
                      slotProps={{
                        input: {
                          id: `lan-stage-crate-${crate.id}`,
                          "aria-label": crate.name,
                          ref: tooltipRef(tips.lanStageCrate),
                        },
                      }}
                    />
                  }
                  label={crate.name}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", gap: 1 }}>
        <Button
          id="lan-stage-preview"
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          disabled={busy || !canPreview(selected)}
          ref={tooltipRef(tips.lanStagePreview)}
          onClick={() => {
            void run({ action: "preview", crates: selected }).then((payload) => {
              if (payload?.fingerprint) {
                setFingerprint(payload.fingerprint);
                setPreviewIds([...selected]);
              }
            });
          }}
        >
          {t("lanStage.preview")}
        </Button>
        <Button
          id="lan-stage-send"
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          disabled={busy || !sendReady}
          ref={tooltipRef(tips.lanStageSend)}
          onClick={() => {
            void run({
              action: "send",
              host: host.trim(),
              port: portNumber,
              code: code.trim(),
              crates: selected,
              fingerprint,
              confirm: true,
            });
          }}
        >
          {t("lanStage.send")}
        </Button>
      </Stack>
      <p id="lan-stage-status" className="notice" role="status" aria-live="polite">{line}</p>
      {problems.length > 0 ? (
        <ul id="lan-stage-problems">
          {problems.map((item, index) => (
            <li key={`${item.file ?? "file"}-${index}`}>
              {(item.name || item.file || "") + (item.artist ? ` — ${item.artist}` : "")}
              {": "}
              {reasonText(item.reason_code)}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
