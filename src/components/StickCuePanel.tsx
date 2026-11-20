/**
 * Stick-only cues under Check drive.
 *
 * Review lists cues that are on the stick and not in the library.
 * Import copies those cues into empty pads. A pad the library already
 * uses stays. Both buttons stay enabled so their tooltips can show.
 */

import { useSyncExternalStore } from "react";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { PortableReport } from "../pages/PortableReport";
import { failureOf } from "../lib/api";
import { lengthLabel } from "../lib/format";
import { portableSnapshot, setStickCueState, subscribePortable } from "../lib/gig/portable";
import {
  importStickCues,
  reviewStickCues,
  stickDriveLabel,
  type StickCue,
  type StickCueReport,
} from "../lib/gig/stick-cues";
import { t } from "../lib/i18n";
import { setNotice } from "../lib/ui/notice-store";
import { tooltipRef } from "./tooltip-ref";
import { tips } from "../lib/ui/tooltip-strings";

const BUTTON_SX = { textTransform: "none" as const, minHeight: 44 };

export type StickSurface = "gig" | "files";

/**
 * Cues the stick has that the library does not already show as the same cue.
 *
 * A filled pad is still listed. Import leaves that pad alone.
 *
 * @param report Preview or apply body.
 * @returns Cue rows to paint.
 */
export function listedStickCues(report: StickCueReport | null): StickCue[] {
  return (report?.cues ?? []).filter((cue) => cue.skip === null || cue.skip === "slot_filled");
}

function cueText(cue: StickCue): string {
  const line = t("stick.cueLine", {
    file: cue.file,
    index: cue.index + 1,
    time: lengthLabel(cue.startMs),
  });
  return cue.name ? `${line} ${cue.name}` : line;
}

function libraryNote(report: StickCueReport): string {
  if (report.status === "not_connected" || report.libraryStatus === "not_connected") {
    return t("stick.notConnected", { name: stickDriveLabel(report.drive) });
  }
  if (report.libraryStatus === "different") return t("stick.different");
  if (report.libraryStatus === "ours") return t("stick.ours");
  if (report.libraryStatus === "empty") return t("stick.emptyLibrary");
  return "";
}

/**
 * Review and import controls for one Check drive surface.
 *
 * Gig and Files can both be in the document, so ids include the surface.
 */
export function StickCuePanel({
  surface,
  report: reportOverride,
}: {
  surface: StickSurface;
  report?: StickCueReport | null;
}) {
  const live = useSyncExternalStore(subscribePortable, portableSnapshot, portableSnapshot);
  const report = reportOverride !== undefined ? reportOverride : live.stickReport ?? null;
  const status = reportOverride !== undefined ? "" : live.stickStatus ?? "";
  const listed = listedStickCues(report);
  const suffix = surface === "files" ? "-files" : "";
  const titleId = `stick-title${suffix}`;
  const statusId = `stick-status${suffix}`;
  const listId = `stick-list${suffix}`;
  let detail = status;
  if (!detail && report) {
    detail = libraryNote(report);
    if (!detail && report.status === "ready" && listed.length === 0) detail = t("stick.empty");
  }

  async function review(): Promise<void> {
    const drive = portableSnapshot().stickDrive ?? "";
    setStickCueState(portableSnapshot().stickReport ?? null, t("stick.reviewing"));
    try {
      setStickCueState(await reviewStickCues(drive), "");
    } catch (caught) {
      const message = failureOf(caught).message;
      setStickCueState(null, message);
      setNotice(message, "error");
    }
  }

  async function copyEmpty(): Promise<void> {
    const drive = portableSnapshot().stickDrive ?? "";
    setStickCueState(portableSnapshot().stickReport ?? null, t("stick.reviewing"));
    try {
      const next = await importStickCues(drive);
      setStickCueState(next, "");
      if (next.written) setNotice(t("stick.imported", { count: next.count }));
    } catch (caught) {
      const message = failureOf(caught).message;
      setStickCueState(portableSnapshot().stickReport ?? null, message);
      setNotice(message, "error");
    }
  }

  return (
    <section className="operations" aria-labelledby={titleId}>
      <h3 id={titleId} className="operations-heading">{t("stick.title")}</h3>
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
        <Button
          id={surface === "files" ? "stick-review-files" : "stick-review"}
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          ref={tooltipRef(tips.stickReview)}
          onClick={() => {
            void review();
          }}
        >
          {t("stick.review")}
        </Button>
        <Button
          id={surface === "files" ? "stick-import-files" : "stick-import"}
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          ref={tooltipRef(tips.stickImport)}
          onClick={() => {
            void copyEmpty();
          }}
        >
          {t("stick.import")}
        </Button>
      </Stack>
      <p id={statusId} className="notice" role="status" aria-live="polite">{detail}</p>
      <ul id={listId}>
        {listed.map((cue) => (
          <li key={`${cue.file}-${cue.index}`}>{cueText(cue)}</li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Check-drive findings plus the stick-cue controls.
 *
 * Mounted into the Gig panel. The Files dialog mounts the panel itself.
 */
export function PortableFindings() {
  return (
    <>
      <PortableReport />
      <StickCuePanel surface="gig" />
    </>
  );
}
