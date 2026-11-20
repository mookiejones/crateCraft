/**
 * Batch on Backups: queue, preview the first item, apply, cancel, undo.
 */

import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { useBatch } from "../containers/BatchContext";
import { useCrates } from "../containers/CrateContext";
import { failureOf } from "../lib/api";
import { refreshBatch, type BatchPost } from "../lib/batch/batch-store";
import { activeCrateId, canQueueActiveCrate } from "../lib/crates/crate-store";
import { t } from "../lib/i18n";
import { tips } from "../lib/ui/tooltip-strings";
import { tooltipRef } from "./tooltip-ref";

const BUTTON_SX = { textTransform: "none" as const, minHeight: 44 };

/**
 * Preview, apply, cancel, and undo for one queued batch.
 */
export function BatchPanel() {
  const batch = useBatch();
  useCrates();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const listing = batch.listing;
  const queued = listing.queue.length > 0;
  const canDest = canQueueActiveCrate();

  useEffect(() => {
    void refreshBatch().catch(() => undefined);
  }, []);

  async function run(body: BatchPost): Promise<void> {
    setBusy(true);
    setError("");
    try {
      await batch.postBatch(body);
    } catch (caught) {
      setError(failureOf(caught).message);
    } finally {
      setBusy(false);
    }
  }

  const destination = listing.destination
    ? t("batch.destination", { name: listing.destination.name || String(listing.destination.id) })
    : t("batch.noDestination");
  const preview = listing.preview;
  const status = error
    || (preview
      ? `${t("batch.first", { name: preview.first.name || String(preview.first.id) })} ${t("batch.wouldAdd", { count: preview.would_add })}`
      : queued
        ? listing.queue.map((item) => item.name || String(item.id)).join(", ")
        : t("batch.empty"));

  return (
    <section id="batch-queue" className="operations" aria-labelledby="batch-heading">
      <h2 id="batch-heading" className="operations-heading">{t("batch.heading")}</h2>
      <p className="notice">{t("batch.intro")}</p>
      <p id="batch-destination-label" className="notice">{destination}</p>
      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", gap: 1 }}>
        <Button
          id="batch-destination"
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          disabled={busy || !canDest}
          ref={tooltipRef(tips.batchDestination)}
          onClick={() => {
            const id = activeCrateId();
            if (id !== null) void run({ action: "destination", id });
          }}
        >
          {t("batch.useCrate")}
        </Button>
        <Button
          id="batch-preview"
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          disabled={busy || !queued || listing.destination === null}
          ref={tooltipRef(tips.batchPreview)}
          onClick={() => {
            void run({ action: "preview" });
          }}
        >
          {t("batch.preview")}
        </Button>
        <Button
          id="batch-apply"
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          disabled={busy || preview === null}
          ref={tooltipRef(tips.batchApply)}
          onClick={() => {
            void run({ action: "apply", confirm: true });
          }}
        >
          {t("batch.apply")}
        </Button>
        <Button
          id="batch-cancel"
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          disabled={busy || (!queued && listing.destination === null && preview === null)}
          ref={tooltipRef(tips.batchCancel)}
          onClick={() => {
            void run({ action: "cancel" });
          }}
        >
          {t("batch.cancel")}
        </Button>
        <Button
          id="batch-undo"
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          disabled={busy || !listing.can_undo}
          ref={tooltipRef(tips.batchUndo)}
          onClick={() => {
            void run({ action: "undo", confirm: true });
          }}
        >
          {t("batch.undo")}
        </Button>
      </Stack>
      <p id="batch-status" className="notice" role="status" aria-live="polite">{status}</p>
    </section>
  );
}
