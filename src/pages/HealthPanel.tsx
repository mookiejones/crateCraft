/**
 * Library health report painted from HealthContext.
 *
 * Accordion sections list counts and sample tracks. Not a Data Grid.
 */

import { useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Button from "@mui/material/Button";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import type {
  LibraryHealthDuplicateGroup,
  LibraryHealthReport,
  LibraryHealthSection,
  LibraryHealthTrack,
} from "../lib/api-types";
import { openAlbumArt } from "../lib/health/album-art";
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
    listed += payload.empty_genre.count;
    listed += payload.no_crate.count;
    listed += payload.unused.count;
    listed += payload.duplicates.count;
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
              <Section
                key={spec.key}
                label={t(spec.label)}
                section={payload[spec.key]}
                {...(spec.action ? { action: spec.action } : {})}
                {...(spec.key === "no_artwork" ? { findArt: true } : {})}
                onNavigate={health.navigate}
              />
            ))}
            <Unused section={payload.unused} onNavigate={health.navigate} />
            <Duplicates section={payload.duplicates} onNavigate={health.navigate} />
            <Bitrate onNavigate={health.navigate} />
            {listed ? null : <p className="gig-note">{t("health.clear")}</p>}
          </>
        ) : null}
      </div>
    </>
  );
}
