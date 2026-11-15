/**
 * Music files on Backups: dest folder, preview, copy, restore, crate, relink.
 */

import { useRef, useState } from "react";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type { MusicMirrorReport } from "../lib/api-types";
import { failureOf } from "../lib/api";
import { t } from "../lib/i18n";
import { fetchMirrorPreview, postMirror } from "../lib/snapshots/music-mirror";
import { hasMirrorDest, mirrorStatusText, type MusicMirrorAction } from "../lib/snapshots/music-mirror-view";
import { tooltipRef } from "./tooltip-ref";
import { tips } from "../lib/ui/tooltip-strings";

const BUTTON_SX = { textTransform: "none" as const, minHeight: 44 };

/**
 * Hash-checked copy of library audio to a second drive.
 */
export function MusicMirrorPanel() {
  const [dest, setDest] = useState("");
  const [report, setReport] = useState<MusicMirrorReport | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const tokenRef = useRef(0);
  const ready = hasMirrorDest(dest) && !busy;

  async function run(action: MusicMirrorAction, confirm: boolean): Promise<void> {
    const token = ++tokenRef.current;
    setBusy(true);
    setError("");
    try {
      const payload = action === "preview" && !confirm
        ? await fetchMirrorPreview(dest)
        : await postMirror(action, dest, confirm);
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
    <section id="music-mirror" className="operations" aria-labelledby="music-mirror-heading">
      <h2 id="music-mirror-heading" className="operations-heading">{t("musicMirror.heading")}</h2>
      <p className="notice">{t("musicMirror.intro")}</p>
      <TextField
        id="music-mirror-dest"
        label={t("musicMirror.dest")}
        size="small"
        fullWidth
        value={dest}
        autoComplete="off"
        slotProps={{ htmlInput: { spellCheck: false } }}
        inputRef={tooltipRef(tips.musicMirrorDest)}
        onChange={(event) => setDest(event.target.value)}
      />
      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", gap: 1 }}>
        <Button
          id="music-mirror-preview"
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          disabled={!ready}
          ref={tooltipRef(tips.musicMirrorPreview)}
          onClick={() => {
            void run("preview", false);
          }}
        >
          {t("musicMirror.preview")}
        </Button>
        <Button
          id="music-mirror-copy"
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          disabled={!ready}
          ref={tooltipRef(tips.musicMirrorCopy)}
          onClick={() => {
            void run("copy", true);
          }}
        >
          {t("musicMirror.copy")}
        </Button>
        <Button
          id="music-mirror-restore"
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          disabled={!ready}
          ref={tooltipRef(tips.musicMirrorRestore)}
          onClick={() => {
            void run("restore", true);
          }}
        >
          {t("musicMirror.restore")}
        </Button>
        <Button
          id="music-mirror-crate"
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          disabled={!ready}
          ref={tooltipRef(tips.musicMirrorCrate)}
          onClick={() => {
            void run("crate", true);
          }}
        >
          {t("musicMirror.crate")}
        </Button>
        <Button
          id="music-mirror-relink"
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          disabled={!ready}
          ref={tooltipRef(tips.musicMirrorRelink)}
          onClick={() => {
            void run("relink", true);
          }}
        >
          {t("musicMirror.relink")}
        </Button>
      </Stack>
      <p id="music-mirror-status" className="notice" role="status" aria-live="polite">
        {error || mirrorStatusText(report)}
      </p>
    </section>
  );
}
