/**
 * Gig Lock on Backups: pending writes, preview, apply, drop, undo.
 */

import { useEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import type { WriteQueueItem, WriteQueueListing, WriteQueueUndoItem } from "../lib/api-types";
import { failureOf } from "../lib/api";
import { t } from "../lib/i18n";
import { fetchWriteQueue, postWriteQueue } from "../lib/snapshots/write-queue";
import { queueStatusText } from "../lib/snapshots/write-queue-view";
import { tooltipRef } from "./tooltip-ref";
import { tips } from "../lib/ui/tooltip-strings";

const BUTTON_SX = { textTransform: "none" as const, minHeight: 44 };

/**
 * Queue of crate and track edits while Gig Lock is on.
 */
export function GigLockPanel() {
  const [listing, setListing] = useState<WriteQueueListing | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const tokenRef = useRef(0);

  async function load(): Promise<void> {
    const token = ++tokenRef.current;
    setBusy(true);
    setError("");
    try {
      const payload = await fetchWriteQueue();
      if (token !== tokenRef.current) return;
      setListing(payload);
    } catch (caught) {
      if (token !== tokenRef.current) return;
      setError(failureOf(caught).message);
    } finally {
      if (token === tokenRef.current) setBusy(false);
    }
  }

  async function run(action: "preview" | "apply" | "drop" | "undo", confirm = false, id?: string): Promise<void> {
    const token = ++tokenRef.current;
    setBusy(true);
    setError("");
    try {
      const payload = await postWriteQueue(action, confirm, id);
      if (token !== tokenRef.current) return;
      setListing(payload);
    } catch (caught) {
      if (token !== tokenRef.current) return;
      setError(failureOf(caught).message);
    } finally {
      if (token === tokenRef.current) setBusy(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const pending = listing?.pending ?? [];
  const undo = listing?.undo ?? [];
  const locked = listing?.locked === true;
  const hasPending = pending.length > 0;

  return (
    <section id="gig-lock-queue" className="operations" aria-labelledby="gig-lock-heading">
      <h2 id="gig-lock-heading" className="operations-heading">{t("gigLock.heading")}</h2>
      <p className="notice">{t("gigLock.intro")}</p>
      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", gap: 1 }}>
        <Button
          id="gig-lock-preview"
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          disabled={busy || !hasPending}
          ref={tooltipRef(tips.gigLockPreview)}
          onClick={() => {
            void run("preview");
          }}
        >
          {t("gigLock.preview")}
        </Button>
        <Button
          id="gig-lock-apply"
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          disabled={busy || locked || !hasPending}
          ref={tooltipRef(tips.gigLockApply)}
          onClick={() => {
            void run("apply", true);
          }}
        >
          {t("gigLock.apply")}
        </Button>
        <Button
          id="gig-lock-drop"
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          disabled={busy || !hasPending}
          ref={tooltipRef(tips.gigLockDrop)}
          onClick={() => {
            void run("drop");
          }}
        >
          {t("gigLock.drop")}
        </Button>
      </Stack>
      <ul className="operations-list">
        {pending.map((item: WriteQueueItem) => (
          <li key={String(item.id)}>
            {item.label}
            {item.conflict && item.layer ? ` ${t("gigLock.conflict", { layer: item.layer })}` : ""}
          </li>
        ))}
      </ul>
      <ul className="operations-list">
        {undo.map((item: WriteQueueUndoItem) => (
          <li key={String(item.id)}>
            {item.label}
            <Button
              type="button"
              size="small"
              variant="outlined"
              sx={{ ...BUTTON_SX, ml: 1 }}
              disabled={busy || locked || !item.id}
              ref={tooltipRef(tips.gigLockUndo)}
              onClick={() => {
                if (item.id) void run("undo", true, item.id);
              }}
            >
              {t("gigLock.undo")}
            </Button>
          </li>
        ))}
      </ul>
      <p id="gig-lock-status" className="notice" role="status" aria-live="polite">
        {error || queueStatusText(listing)}
      </p>
    </section>
  );
}
