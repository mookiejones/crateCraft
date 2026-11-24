/**
 * Back up this Serato stick on Check drive (#481).
 */

import { useEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type { StickBackupReport } from "../lib/api-types";
import { failureOf } from "../lib/api";
import { t } from "../lib/i18n";
import {
  fetchStickBackupPreview,
  fetchStickBackupStatus,
  postStickBackup,
} from "../lib/gig/stick-backup";
import {
  hasStickBackupDest,
  stickBackupStatusText,
  type StickBackupAction,
} from "../lib/gig/stick-backup-view";
import { portableDriveRoot } from "../lib/gig/portable";
import { tooltipRef } from "./tooltip-ref";
import { tips } from "../lib/ui/tooltip-strings";

const BUTTON_SX = { textTransform: "none" as const, minHeight: 44 };

/**
 * Hash-checked stick backup. Never writes the source stick.
 */
export function StickBackupPanel() {
  const [dest, setDest] = useState("");
  const [report, setReport] = useState<StickBackupReport | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const tokenRef = useRef(0);
  const source = portableDriveRoot(
    (document.getElementById("portable-drive") as HTMLSelectElement | null)?.value || "",
  );
  const ready = Boolean(source) && hasStickBackupDest(dest) && !busy;

  useEffect(() => {
    if (!source) {
      setReport(null);
      return;
    }
    const token = ++tokenRef.current;
    setError("");
    void fetchStickBackupStatus(source)
      .then((payload) => {
        if (token !== tokenRef.current) return;
        setReport(payload);
        const remembered = payload.last_backup?.dest;
        if (typeof remembered === "string" && remembered.trim()) {
          setDest(remembered);
        }
      })
      .catch((caught) => {
        if (token !== tokenRef.current) return;
        setError(failureOf(caught).message);
      });
  }, [source]);

  async function run(action: StickBackupAction, confirm: boolean): Promise<void> {
    const token = ++tokenRef.current;
    setBusy(true);
    setError("");
    try {
      const payload =
        action === "preview" && !confirm
          ? await fetchStickBackupPreview(source, dest)
          : await postStickBackup(action, source, dest, confirm);
      if (token !== tokenRef.current) return;
      setReport(payload);
    } catch (caught) {
      if (token !== tokenRef.current) return;
      setError(failureOf(caught).message);
    } finally {
      if (token === tokenRef.current) setBusy(false);
    }
  }

  return (
    <section id="stick-backup" className="operations" aria-labelledby="stick-backup-heading">
      <h2 id="stick-backup-heading" className="operations-heading">
        {t("stickBackup.heading")}
      </h2>
      <p className="notice">{t("stickBackup.intro")}</p>
      <TextField
        id="stick-backup-dest"
        label={t("stickBackup.dest")}
        size="small"
        fullWidth
        value={dest}
        autoComplete="off"
        slotProps={{ htmlInput: { spellCheck: false } }}
        inputRef={tooltipRef(tips.stickBackupDest)}
        onChange={(event) => setDest(event.target.value)}
      />
      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", gap: 1 }}>
        <Button
          id="stick-backup-preview"
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          disabled={!ready}
          ref={tooltipRef(tips.stickBackupPreview)}
          onClick={() => {
            void run("preview", false);
          }}
        >
          {t("stickBackup.preview")}
        </Button>
        <Button
          id="stick-backup-copy"
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          disabled={!ready}
          ref={tooltipRef(tips.stickBackupCopy)}
          onClick={() => {
            void run("copy", true);
          }}
        >
          {t("stickBackup.copy")}
        </Button>
      </Stack>
      <p id="stick-backup-status" className="notice" role="status" aria-live="polite">
        {error || stickBackupStatusText(report) || t("stickBackup.never")}
      </p>
    </section>
  );
}
