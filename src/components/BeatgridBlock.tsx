/**
 * View-only beatgrid block for the track detail pane.
 *
 * Helpers stay in `beatgrid-view.ts`. This parser never writes the grid.
 */

import type { Marker, Track } from "../api-types";
import {
  beatSeconds,
  beatgridIsSuspect,
  beatgridViewOnly,
  beatgridWarningKey,
} from "../beatgrid-view";
import { formatNumber, t } from "../i18n";

/**
 * One beatgrid row: time and BPM or beat count.
 *
 * @param props Marker from `GET /api/track`.
 */
export function BeatgridMarker({ mark }: { mark: Marker }) {
  const bpmNumber = Number(mark.bpm);
  let name = "";
  if (mark.bpm != null && mark.bpm !== "" && Number.isFinite(bpmNumber)) {
    name = t("markers.bpm", { bpm: formatNumber(bpmNumber, { maximumFractionDigits: 20 }) });
  } else if (mark.beats != null) {
    name = t("markers.beats", { count: Number(mark.beats) });
  }
  return (
    <div className="marker">
      <span />
      <span />
      <span>{beatSeconds(mark.position)}</span>
      <span>{name}</span>
    </div>
  );
}

/**
 * Heading, view-only note, suspect flag, and rows.
 *
 * A missing file renders nothing.
 *
 * @param props Track payload including beatgrid fields.
 */
export function BeatgridBlock({ track }: { track: Track }) {
  if (!beatgridViewOnly(track.markers_unavailable)) return null;
  const suspect = beatgridIsSuspect(track.beatgrid_warning_code);
  const key = beatgridWarningKey(track.beatgrid_warning_code);
  const reason = key === "markers.gridUnknown"
    ? (typeof track.beatgrid_warning === "string" && track.beatgrid_warning
      ? track.beatgrid_warning
      : t("markers.gridUnknown"))
    : t(key ?? "markers.gridUnknown");
  const empty = !suspect && !(track.beatgrid && track.beatgrid.length > 0);
  return (
    <>
      <h4>{t("markers.gridHeading")}</h4>
      <p className="detail-kicker">{t("markers.gridViewOnly")}</p>
      {suspect ? (
        <p className="detail-kicker warn" role="status">
          {t("markers.gridSuspect", { reason })}
        </p>
      ) : empty ? (
        <p className="detail-kicker">{t("markers.gridNone")}</p>
      ) : null}
      {(track.beatgrid || []).map((mark, index) => (
        <BeatgridMarker key={`${beatSeconds(mark.position)}-${index}`} mark={mark} />
      ))}
    </>
  );
}
