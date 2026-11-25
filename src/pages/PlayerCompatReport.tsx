/**
 * Won't play report painted by React.
 *
 * Before a check, the mark is unknown. A failure uses a hatched triangle
 * as well as the words, so the result does not rely on colour alone.
 */

import type { GridColDef } from "@mui/x-data-grid";
import { useGig } from "../containers/GigContext";
import { ReportGrid } from "../components/ReportGrid";
import {
  noteText,
  playersViewRows,
  type PlayersViewRow,
} from "../lib/gig/players-view";
import { t } from "../lib/i18n";

function VerdictMark({ verdict, label, rowId }: { verdict: string; label: string; rowId: number }) {
  const hatch = `players-hatch-${rowId}`;
  return (
    <span className="verdict" data-verdict={verdict}>
      {verdict === "wont_play" ? (
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <defs>
            <pattern id={hatch} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="4" stroke="currentColor" strokeWidth="1.5" />
            </pattern>
          </defs>
          <path d="M8 1.2 14.5 14.2H1.5Z" fill={`url(#${hatch})`} stroke="currentColor" strokeWidth="1.4" />
        </svg>
      ) : null}
      {verdict === "check_first" ? (
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path d="M8 1.5 14.5 8 8 14.5 1.5 8Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      ) : null}
      {verdict === "will_play" ? (
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      ) : null}
      {verdict === "unknown" ? (
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2 2" />
        </svg>
      ) : null}
      <span>{label}</span>
    </span>
  );
}

function playerColumns(): GridColDef<PlayersViewRow>[] {
  return [
    { field: "title", headerName: t("players.column.track"), flex: 1.1, minWidth: 140 },
    { field: "file", headerName: t("players.column.file"), flex: 0.7, minWidth: 100 },
    {
      field: "result",
      headerName: t("players.column.result"),
      flex: 0.7,
      minWidth: 130,
      renderCell: (params) => (
        <VerdictMark verdict={params.row.verdict} label={params.row.result} rowId={params.row.id} />
      ),
    },
    { field: "reason", headerName: t("players.column.reason"), flex: 1.6, minWidth: 220 },
    { field: "fix", headerName: t("players.column.fix"), flex: 1.2, minWidth: 180 },
  ];
}

/**
 * Unknown state, the manual notes, and the track table.
 */
export function PlayerCompatReport() {
  const { players } = useGig();
  const payload = players.report;
  if (!payload) {
    return (
      <>
        <p className="gig-note verdict" data-verdict="unknown">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2 2" />
          </svg>
          {t("players.notChecked")}
        </p>
        <p className="gig-note">{t("players.notCheckedDetail")}</p>
      </>
    );
  }
  const rows = playersViewRows(payload, players.show);
  const counts = payload.counts;
  const docs = payload.documents.map((item) => item.code).join(", ");
  return (
    <>
      <p className="gig-note">{t("players.caveat")}</p>
      <p className="gig-note">{t("players.manual", { docs })}</p>
      <p className="gig-note">{t("players.filesystems", { listed: payload.filesystems.join(", ") })}</p>
      {payload.filesystems_not_supported.length ? (
        <p className="gig-note">
          {t("players.filesystemsAbsent", { absent: payload.filesystems_not_supported.join(", ") })}
        </p>
      ) : null}
      {payload.notes.map((code) => (
        <p className="gig-note" key={code}>{noteText(code)}</p>
      ))}
      <p className="gig-note">
        {t("players.summary", {
          wont: counts.wont_play,
          check: counts.check_first,
          ok: counts.will_play,
          unknown: counts.unknown,
        })}
      </p>
      {rows.length ? (
        <ReportGrid rows={rows} columns={playerColumns()} getRowId={(row) => row.id} />
      ) : (
        <p className="gig-note">{t("players.emptyFilter")}</p>
      )}
    </>
  );
}
