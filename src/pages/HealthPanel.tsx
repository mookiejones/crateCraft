/**
 * Library health report painted from HealthContext.
 *
 * Accordion sections list counts and sample tracks. Not a Data Grid.
 */

import { Fragment, useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Button from "@mui/material/Button";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import type {
  LibraryHealthDuplicateGroup,
  LibraryHealthQualityTrack,
  LibraryHealthReport,
  LibraryHealthSection,
  LibraryHealthTrack,
  PathFormsSection,
} from "../lib/api-types";
import { openAlbumArt } from "../lib/health/album-art";
import { applyPathForms, previewPathForms } from "../lib/health/path-forms";
import { clearQualityDismissals, dismissQuality } from "../lib/health/quality";
import { qualityLine } from "../lib/health/quality-view";
import { applySuspiciousCues, previewSuspiciousCues } from "../lib/health/suspicious-cues";
import { useHealth, type HealthAction } from "../containers/HealthContext";
import { t, type MessageKey } from "../lib/i18n";
import { tips } from "../lib/ui/tooltip-strings";
import { tooltipRef } from "../components/tooltip-ref";

const BUTTON_SX = { textTransform: "none" as const, minHeight: 44 };

const ACCORDION_SX = {
  disableGutters: true,
  square: true,
  elevation: 0,
  slotProps: { transition: { timeout: 0 } },
} as const;

function useSectionOpen(start: boolean) {
  const [open, setOpen] = useState(start);
  return {
    expanded: open,
    onChange: (_event: unknown, next: boolean) => {
      setOpen(next);
    },
  };
}

const SECTIONS: Array<{
  key: "missing" | "no_bpm" | "no_key" | "no_beatgrid" | "no_artwork" | "empty_genre" | "no_crate";
  label: MessageKey;
  action?: "missing";
}> = [
  { key: "missing", label: "health.missing", action: "missing" },
  { key: "no_bpm", label: "health.noBpm" },
  { key: "no_key", label: "health.noKey" },
  { key: "no_beatgrid", label: "health.noBeatgrid" },
  { key: "no_artwork", label: "health.noArtwork" },
  { key: "empty_genre", label: "health.emptyGenre" },
  { key: "no_crate", label: "health.noCrate" },
];

function trackLine(track: LibraryHealthTrack): string {
  return t("health.row", {
    title: [track.artist, track.name].filter(Boolean).join(" — ") || track.file,
  });
}

function Section({
  label,
  section,
  action,
  findArt,
  onNavigate,
}: {
  label: string;
  section: LibraryHealthSection | undefined;
  action?: "missing";
  findArt?: boolean;
  onNavigate: (action: HealthAction, id?: number) => void;
}) {
  const count = section?.count ?? 0;
  const tracks = section?.tracks ?? [];
  const accordion = useSectionOpen(count > 0);
  return (
    <Accordion
      className="health-accordion"
      expanded={accordion.expanded}
      onChange={accordion.onChange}
      {...ACCORDION_SX}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />} ref={tooltipRef(tips.healthSection)}>
        {t("gig.groupCount", { label, count })}
      </AccordionSummary>
      <AccordionDetails>
        {action === "missing" ? (
          <Button
            type="button"
            size="small"
            variant="outlined"
            sx={BUTTON_SX}
            ref={tooltipRef(tips.healthOpenMissing)}
            data-health-action="missing"
            onClick={() => onNavigate("missing")}
          >
            {t("health.openMissing")}
          </Button>
        ) : null}
        <ul>
          {tracks.map((track) => (
            <li key={track.id} className={findArt ? "health-art-row" : ""}>
              <Button
                type="button"
                size="small"
                variant="text"
                sx={BUTTON_SX}
                ref={tooltipRef(tips.healthTrack)}
                data-health-action="track"
                data-health-id={String(track.id)}
                onClick={() => onNavigate("track", track.id)}
              >
                {trackLine(track)}
              </Button>
              {findArt ? (
                <Button
                  type="button"
                  size="small"
                  variant="outlined"
                  sx={BUTTON_SX}
                  ref={tooltipRef(tips.healthFindArt)}
                  data-health-action="artwork"
                  data-health-id={String(track.id)}
                  onClick={() => {
                    void openAlbumArt(track.id);
                  }}
                >
                  {t("health.findArt")}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
        {count > tracks.length ? <p className="gig-note">{t("health.more", { count: count - tracks.length })}</p> : null}
      </AccordionDetails>
    </Accordion>
  );
}

function Quality({
  section,
  onNavigate,
}: {
  section: LibraryHealthReport["quality"] | undefined;
  onNavigate: (action: HealthAction, id?: number) => void;
}) {
  const count = section?.count ?? 0;
  const dismissed = section?.dismissed ?? 0;
  const tracks = section?.tracks ?? [];
  const accordion = useSectionOpen(count > 0 || dismissed > 0);
  return (
    <Accordion
      className="health-accordion"
      expanded={accordion.expanded}
      onChange={accordion.onChange}
      {...ACCORDION_SX}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />} ref={tooltipRef(tips.healthSection)}>
        {t("gig.groupCount", { label: t("health.quality"), count })}
      </AccordionSummary>
      <AccordionDetails>
        <ul>
          {tracks.map((track: LibraryHealthQualityTrack) => {
            const line = qualityLine(track.quality);
            return (
              <li key={track.id} className="health-art-row">
                <Button
                  type="button"
                  size="small"
                  variant="text"
                  sx={BUTTON_SX}
                  ref={tooltipRef(tips.healthTrack)}
                  data-health-action="track"
                  data-health-id={String(track.id)}
                  onClick={() => onNavigate("track", track.id)}
                >
                  {trackLine(track)}
                </Button>
                {line ? <span className="gig-note">{line}</span> : null}
                <Button
                  type="button"
                  size="small"
                  variant="outlined"
                  sx={BUTTON_SX}
                  ref={tooltipRef(tips.notAProblem)}
                  data-health-action="not-a-problem"
                  data-health-id={String(track.id)}
                  onClick={() => {
                    void dismissQuality(track.id);
                  }}
                >
                  {t("health.notAProblem")}
                </Button>
              </li>
            );
          })}
        </ul>
        {dismissed > 0 ? (
          <Button
            type="button"
            size="small"
            variant="outlined"
            sx={BUTTON_SX}
            ref={tooltipRef(tips.showDismissed)}
            data-health-action="show-dismissed"
            onClick={() => {
              void clearQualityDismissals();
            }}
          >
            {t("health.showDismissed")}
          </Button>
        ) : null}
        <p className="gig-note">{t("health.qualityNote")}</p>
      </AccordionDetails>
    </Accordion>
  );
}

function SuspiciousCues({
  section,
  onReload,
}: {
  section: LibraryHealthSection | undefined;
  onReload: () => Promise<void>;
}) {
  const count = section?.count ?? 0;
  const tracks = section?.tracks ?? [];
  const accordion = useSectionOpen(count > 0);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [canApply, setCanApply] = useState(false);

  async function review(): Promise<void> {
    setBusy(true);
    setCanApply(false);
    try {
      const plan = await previewSuspiciousCues();
      setCanApply(plan.dropped > 0);
      setNote(plan.dropped > 0 ? t("health.cuesDropped", { count: plan.dropped }) : t("health.cuesClear"));
    } catch (error) {
      setNote(error instanceof Error ? error.message : t("health.unreadable"));
    } finally {
      setBusy(false);
    }
  }

  async function removeDuplicates(): Promise<void> {
    setBusy(true);
    try {
      const plan = await applySuspiciousCues();
      setCanApply(false);
      setNote(plan.written ? t("health.cuesRemoved", { count: plan.dropped }) : t("health.cuesClear"));
      await onReload();
    } catch (error) {
      setNote(error instanceof Error ? error.message : t("health.unreadable"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Accordion
      className="health-accordion"
      expanded={accordion.expanded}
      onChange={accordion.onChange}
      {...ACCORDION_SX}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />} ref={tooltipRef(tips.healthSection)}>
        {t("gig.groupCount", { label: t("health.suspiciousCues"), count })}
      </AccordionSummary>
      <AccordionDetails>
        <Button
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          ref={tooltipRef(tips.suspiciousCues)}
          data-health-action="cues-preview"
          disabled={busy}
          onClick={() => {
            void review();
          }}
        >
          {t("health.reviewCues")}
        </Button>
        <Button
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          ref={tooltipRef(tips.suspiciousCues)}
          data-health-action="cues-apply"
          disabled={busy || !canApply}
          onClick={() => {
            void removeDuplicates();
          }}
        >
          {t("health.applyCues")}
        </Button>
        <p className="gig-note">{t("health.cuesNote")}</p>
        {note ? <p className="gig-note">{note}</p> : null}
        <ul>
          {tracks.map((track) => (
            <li key={track.id}>{trackLine(track)}</li>
          ))}
        </ul>
        {count > tracks.length ? <p className="gig-note">{t("health.more", { count: count - tracks.length })}</p> : null}
      </AccordionDetails>
    </Accordion>
  );
}

function Bitrate({ onNavigate }: { onNavigate: (action: HealthAction) => void }) {
  const accordion = useSectionOpen(true);
  return (
    <Accordion
      className="health-accordion"
      expanded={accordion.expanded}
      onChange={accordion.onChange}
      {...ACCORDION_SX}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />} ref={tooltipRef(tips.healthSection)}>
        {t("health.bitrate")}
      </AccordionSummary>
      <AccordionDetails>
        <Button
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          ref={tooltipRef(tips.healthOpenBitrate)}
          data-health-action="bitrate"
          onClick={() => onNavigate("bitrate")}
        >
          {t("health.openBitrate")}
        </Button>
        <p className="gig-note">{t("health.bitrateNote")}</p>
      </AccordionDetails>
    </Accordion>
  );
}

function Unused({
  section,
  onNavigate,
}: {
  section: LibraryHealthReport["unused"] | undefined;
  onNavigate: (action: HealthAction) => void;
}) {
  const count = section?.count ?? 0;
  const files = section?.files ?? [];
  const accordion = useSectionOpen(count > 0);
  return (
    <Accordion
      className="health-accordion"
      expanded={accordion.expanded}
      onChange={accordion.onChange}
      {...ACCORDION_SX}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />} ref={tooltipRef(tips.healthSection)}>
        {t("gig.groupCount", { label: t("health.unused"), count })}
      </AccordionSummary>
      <AccordionDetails>
        <Button
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          ref={tooltipRef(tips.healthOpenFiles)}
          data-health-action="files"
          onClick={() => onNavigate("files")}
        >
          {t("health.openFiles")}
        </Button>
        <ul>
          {files.map((row) => (
            <li key={row.path || row.file}>{t("health.fileRow", { file: row.file })}</li>
          ))}
        </ul>
        {count > files.length ? <p className="gig-note">{t("health.more", { count: count - files.length })}</p> : null}
      </AccordionDetails>
    </Accordion>
  );
}

function PathForms({
  section,
  onReload,
}: {
  section: PathFormsSection | undefined;
  onReload: () => Promise<void>;
}) {
  const count = section?.count ?? 0;
  const groups = section?.groups ?? [];
  const accordion = useSectionOpen(count > 0);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [canApply, setCanApply] = useState(false);

  async function review(): Promise<void> {
    setBusy(true);
    setCanApply(false);
    try {
      const plan = await previewPathForms();
      setCanApply(plan.dropped > 0);
      setNote(
        plan.dropped > 0
          ? t("health.pathFormsReady", { count: plan.dropped })
          : t("health.pathFormsClear"),
      );
    } catch (error) {
      setNote(error instanceof Error ? error.message : t("health.unreadable"));
    } finally {
      setBusy(false);
    }
  }

  async function keepOne(): Promise<void> {
    setBusy(true);
    try {
      const plan = await applyPathForms();
      setCanApply(false);
      setNote(plan.written ? t("health.pathFormsDone", { count: plan.dropped }) : t("health.pathFormsClear"));
      await onReload();
    } catch (error) {
      setNote(error instanceof Error ? error.message : t("health.unreadable"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Accordion
      className="health-accordion"
      expanded={accordion.expanded}
      onChange={accordion.onChange}
      {...ACCORDION_SX}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />} ref={tooltipRef(tips.healthPathForms)}>
        {t("gig.groupCount", { label: t("health.pathForms"), count })}
      </AccordionSummary>
      <AccordionDetails>
        <Button
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          ref={tooltipRef(tips.healthPathFormsReview)}
          data-health-action="path-forms-preview"
          disabled={busy}
          onClick={() => {
            void review();
          }}
        >
          {t("health.pathFormsReview")}
        </Button>
        <Button
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          ref={tooltipRef(tips.healthPathFormsConfirm)}
          data-health-action="path-forms-apply"
          disabled={busy || !canApply}
          onClick={() => {
            void keepOne();
          }}
        >
          {t("health.pathFormsConfirm")}
        </Button>
        <p className="gig-note">{t("health.pathFormsNote")}</p>
        {note ? <p className="gig-note">{note}</p> : null}
        <ul>
          {groups.flatMap((group) =>
            group.paths
              .filter((entry) => !entry.keep)
              .map((entry) => (
                <li key={`${group.keep_id}-${entry.id}`}>{t("health.pathFormRow", { path: entry.path })}</li>
              )),
          )}
        </ul>
      </AccordionDetails>
    </Accordion>
  );
}

function Duplicates({
  section,
  onNavigate,
}: {
  section: LibraryHealthReport["duplicates"] | undefined;
  onNavigate: (action: HealthAction) => void;
}) {
  const count = section?.count ?? 0;
  const groups = section?.groups ?? [];
  const accordion = useSectionOpen(count > 0);
  return (
    <Accordion
      className="health-accordion"
      expanded={accordion.expanded}
      onChange={accordion.onChange}
      {...ACCORDION_SX}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />} ref={tooltipRef(tips.healthSection)}>
        {t("gig.groupCount", { label: t("health.duplicates"), count })}
      </AccordionSummary>
      <AccordionDetails>
        <Button
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          ref={tooltipRef(tips.healthOpenDuplicates)}
          data-health-action="duplicates"
          onClick={() => onNavigate("duplicates")}
        >
          {t("health.openDuplicates")}
        </Button>
        <ul>
          {groups.map((group: LibraryHealthDuplicateGroup) => (
            <li key={group.ids.join(",")}>
              {t("health.duplicateRow", {
                title: [group.artist, group.name].filter(Boolean).join(" — ") || group.name,
                count: group.ids.length,
              })}
            </li>
          ))}
        </ul>
        {count > groups.length ? <p className="gig-note">{t("health.more", { count: count - groups.length })}</p> : null}
      </AccordionDetails>
    </Accordion>
  );
}

/**
 * Check again, the status line, and the health report.
 */
export function HealthPanel() {
  const health = useHealth();
  const payload = health.healthReport;
  let listed = 0;
  if (payload) {
    listed += payload.missing.count;
    listed += payload.no_bpm.count;
    listed += payload.no_key.count;
    listed += payload.no_beatgrid.count;
    listed += payload.no_artwork.count;
    listed += payload.suspicious_cues.count;
    listed += payload.empty_genre.count;
    listed += payload.no_crate.count;
    listed += payload.unused.count;
    listed += payload.duplicates.count;
    listed += payload.path_forms?.count ?? 0;
    listed += payload.quality.count;
    listed += payload.quality.dismissed;
  }

  return (
    <>
      <h2 id="health-heading" className="visually-hidden">{t("health.heading")}</h2>
      <div className="browser-bar">
        <p id="health-scope" className="files-path">{health.healthScope}</p>
        <Button
          id="health-refresh"
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          ref={tooltipRef(tips.healthRefresh)}
          disabled={health.healthBusy}
          aria-busy={health.healthBusy ? "true" : "false"}
          onClick={() => {
            void health.loadHealth();
          }}
        >
          {t("gig.checkAgain")}
        </Button>
      </div>
      <p id="health-hint" className="gig-note">{t("health.intro")}</p>
      <p id="health-status" className="gig-status" role="status" aria-live="polite">{health.healthStatus}</p>
      <div id="health-report" className="gig-report" tabIndex={-1}>
        {payload ? (
          <>
            <p className="gig-note">{t("health.summary", { count: payload.checked })}</p>
            {SECTIONS.map((spec) => (
              <Fragment key={spec.key}>
                <Section
                  label={t(spec.label)}
                  section={payload[spec.key]}
                  {...(spec.action ? { action: spec.action } : {})}
                  {...(spec.key === "no_artwork" ? { findArt: true } : {})}
                  onNavigate={health.navigate}
                />
                {spec.key === "no_artwork" ? (
                  <SuspiciousCues section={payload.suspicious_cues} onReload={health.loadHealth} />
                ) : null}
              </Fragment>
            ))}
            <Unused section={payload.unused} onNavigate={health.navigate} />
            <PathForms section={payload.path_forms} onReload={health.loadHealth} />
            <Duplicates section={payload.duplicates} onNavigate={health.navigate} />
            <Quality section={payload.quality} onNavigate={health.navigate} />
            <Bitrate onNavigate={health.navigate} />
            {listed ? null : <p className="gig-note">{t("health.clear")}</p>}
          </>
        ) : null}
      </div>
    </>
  );
}
