/**
 * Track detail pane: fields, Play, cues, beatgrid, related.
 *
 * Play reads PlayerContext. Selection and editor fields read
 * TrackListContext. Cue pads stay eight slots in Serato colours. The
 * beatgrid block is view-only.
 */

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { CopyRow, Marker, Track } from "../lib/api-types";
import { bridge } from "../lib/bridge";
import { useTrackList } from "../containers/TrackListContext";
import { formatCueTime } from "../lib/ui/cue-view";
import { clockLabel, colorHex } from "../lib/format";
import { t, type MessageKey } from "../lib/i18n";
import { playerStrings } from "../lib/player/player-strings";
import { COLORS } from "../lib/state";
import type { TrackSaveFields } from "../lib/ui/track-list-store";
import {
  DETAIL_JUMP_LOCK_MS,
  DETAIL_SECTION_IDS,
  copyCount,
  crateMembershipCount,
  fieldGroupCount,
  markerCount,
  markersAreEmpty,
  scrollDetailSection,
  type DetailSectionId,
} from "../lib/ui/detail-sections";
import { tooltipRef } from "../lib/ui/tooltip";
import {
  editField,
  membershipTip,
  openCopy,
  openReplaceCopy,
  tips,
} from "../lib/ui/tooltip-strings";
import { BeatgridBlock } from "./BeatgridBlock";
import { CueEditor } from "./CueEditor";
import {
  DetailHead,
  DetailSection,
  DetailSectionNav,
  detailSwatch,
  detailTitle,
  type DetailChip,
} from "./DetailChrome";
import { RelatedTracks } from "./RelatedTracks";

const EDITOR_FIELDS: Array<[keyof TrackSaveFields | "name", MessageKey, boolean]> = [
  ["name", "column.title", true],
  ["artist", "column.artist", false],
  ["album", "field.album", false],
  ["genre", "field.genre", false],
  ["year", "field.year", false],
  ["composer", "field.composer", false],
  ["remixer", "field.remixer", false],
  ["label", "field.label", false],
  ["grouping", "field.grouping", false],
  ["key", "column.key", false],
  ["bpm", "column.bpm", false],
  ["emoji", "field.emoji", false],
  ["comments", "field.comments", true],
];

function fieldsFromForm(form: HTMLFormElement): TrackSaveFields | { error: string } {
  const data = new FormData(form);
  const bpm = data.get("bpm");
  const fields: TrackSaveFields = {
    name: String(data.get("name") ?? ""),
    artist: String(data.get("artist") ?? ""),
    album: String(data.get("album") ?? ""),
    genre: String(data.get("genre") ?? ""),
    year: String(data.get("year") ?? ""),
    composer: String(data.get("composer") ?? ""),
    remixer: String(data.get("remixer") ?? ""),
    label: String(data.get("label") ?? ""),
    grouping: String(data.get("grouping") ?? ""),
    comments: String(data.get("comments") ?? ""),
    key: String(data.get("key") ?? ""),
    emoji: String(data.get("emoji") ?? ""),
    bpm: bpm === "" ? null : Number(bpm),
    color: Number(data.get("color")),
    rating: data.get("rating") === "" ? null : Number(data.get("rating")),
    is_beatgrid_locked: Boolean(form.querySelector<HTMLInputElement>("[name=is_beatgrid_locked]")?.checked),
  };
  if (bpm !== "" && Number.isNaN(fields.bpm)) return { error: t("detail.bpmNumber") };
  return fields;
}

function MarkerSection({ track, writable }: { track: Track; writable: boolean }) {
  return (
    <>
      <CueEditor track={track} writable={writable} />
      {(track.loops || []).map((loop, index) => (
        <LoopRow key={`loop-${index}`} loop={loop} />
      ))}
      {(track.flips || []).map((flip, index) => (
        <div key={`flip-${index}`} className="marker">
          <span />
          <span />
          <span>{flip.enabled ? t("common.on") : t("common.off")}</span>
          <span>{flip.name || t("markers.flip", { number: (flip.index as number) + 1 })}</span>
        </div>
      ))}
      <BeatgridBlock track={track} />
    </>
  );
}

function LoopRow({ loop }: { loop: Marker }) {
  return (
    <div className="marker">
      <span />
      <span className="swatch" style={loop.color ? { background: loop.color } : undefined} />
      <span>{`${formatCueTime(loop.start_ms)}–${formatCueTime(loop.end_ms)}`}</span>
      <span>
        {loop.name || t(loop.locked ? "markers.loopLocked" : "markers.loop", { number: (loop.index as number) + 1 })}
      </span>
    </div>
  );
}

function CopySection({ fromId, copies, writable }: { fromId: number; copies: CopyRow[]; writable: boolean }) {
  const list = useTrackList();
  return (
    <>
      {copies.map((copy) => {
        const name = copy.file || t("track.numbered", { id: String(copy.id) });
        const file = copy.file || `Track ${copy.id}`;
        return (
          <div key={copy.id} className="copy-row">
            <button
              type="button"
              className="text-button"
              ref={tooltipRef(openCopy(file))}
              onClick={() => copy.id != null && list.selectTrack(copy.id)}
            >
              {name}
            </button>
            <span>{copy.bitrate == null ? "" : String(copy.bitrate)}</span>
            <span>{copy.play_count == null ? "" : String(copy.play_count)}</span>
            <span>{copy.missing ? "missing" : (copy.crates || "")}</span>
            <button
              type="button"
              className="text-button"
              ref={tooltipRef(openReplaceCopy(file))}
              disabled={!writable}
              onClick={() => {
                void bridge.openReplaceInCratesDialog(fromId, copy.id as number).catch((error) => {
                  list.setNotice(String(error), "error");
                });
              }}
            >
              {t("copies.useInCrates")}
            </button>
          </div>
        );
      })}
    </>
  );
}

function MembershipSection({ track, writable }: { track: Track; writable: boolean }) {
  const list = useTrackList();
  const chosen = new Set(track.crate_ids || []);
  const crates = [...list.crates].filter((crate) => !crate.smart).sort((a, b) => a.name.localeCompare(b.name));
  const smart = list.crates.filter((crate) => crate.smart && chosen.has(crate.id));
  return (
    <>
      {smart.length ? (
        <p className="detail-kicker">
          {t("crates.smartList", { names: smart.map((crate) => crate.name).join(", ") })}
        </p>
      ) : null}
      <div className="member-list">
        {crates.map((crate) => (
          <label key={crate.id} className="member">
            <input
              ref={tooltipRef(membershipTip(crate.name))}
              type="checkbox"
              defaultChecked={chosen.has(crate.id)}
              disabled={!writable}
              onChange={(event) => {
                const add = event.currentTarget.checked;
                void list.setMembership(track.id, crate.id, add).then((ok) => {
                  if (!ok) event.currentTarget.checked = !add;
                });
              }}
            />
            <span>{crate.name}</span>
          </label>
        ))}
      </div>
    </>
  );
}

function FieldGroups({ track }: { track: Track }) {
  return (
    <>
      {(track.groups || []).map((group) => (
        <FieldGroupBlock key={group.name ?? ""} group={group} />
      ))}
    </>
  );
}

function FieldGroupBlock({ group }: { group: NonNullable<Track["groups"]>[number] }) {
  const open = group.name !== "Search copies";
  const [shown, setShown] = useState(open);
  const rows = group.fields.map((field, index) => (
    <div key={`${field.column ?? field.label ?? index}`} className="field">
      <div className="label">
        {field.label ?? ""}
        <span className="column">{field.column ?? ""}</span>
      </div>
      <div className="value">
        {field.column === "color" && field.display.startsWith("#") ? (
          <span className="color-value">
            <span className="swatch" style={{ background: field.display }} />
            {field.display}
          </span>
        ) : field.display}
      </div>
    </div>
  ));
  if (!open) {
    return (
      <>
        <button
          type="button"
          className="text-button"
          ref={tooltipRef(shown ? tips.hideSearchCopies : tips.showSearchCopies)}
          onClick={() => setShown((value) => !value)}
        >
          {shown ? t("detail.hideSearchCopies") : t("detail.searchCopies", { count: group.fields.length })}
        </button>
        <section className="group" hidden={!shown}>
          <h3>{group.name ?? ""}</h3>
          {rows}
        </section>
      </>
    );
  }
  return (
    <section className="group">
      <h3>{group.name ?? ""}</h3>
      {rows}
    </section>
  );
}

function TrackEditor({ track, writable }: { track: Track; writable: boolean }) {
  const list = useTrackList();
  const edit = track.edit || {};
  const currentColor = Number(edit.color ?? 0xffffff);
  const palette: Array<[number, string]> = COLORS.map(([value, key]) => [value, t(key)]);
  if (!COLORS.some(([value]) => value === currentColor)) {
    palette.push([currentColor, colorHex(currentColor) || t("color.custom")]);
  }
  const ratings: Array<[string, string]> = [
    ["", t("rating.none")],
    ...([["0.2", 1], ["0.4", 2], ["0.6", 3], ["0.8", 4], ["1", 5]] as const).map(
      ([value, stars]): [string, string] => [value, t("rating.stars", { count: stars })],
    ),
  ];
  if (edit.rating != null && !ratings.some(([value]) => Number(value) === Number(edit.rating))) {
    ratings.push([String(edit.rating), `${edit.rating}`]);
  }
  const ratingValue = edit.rating == null ? "" : String(edit.rating);

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const fields = fieldsFromForm(event.currentTarget);
    if ("error" in fields) {
      list.setNotice(fields.error, "error");
      return;
    }
    void list.saveTrack(track.id, fields);
  }

  return (
    <form className="editor" onSubmit={onSubmit}>
      {EDITOR_FIELDS.map(([name, label, wide]) => (
        <label key={name} className={wide ? "wide" : undefined}>
          {t(label)}
          {name === "comments" ? (
            <textarea
              ref={tooltipRef(editField(t(label)))}
              name={name}
              defaultValue={String(edit[name] ?? "")}
              disabled={!writable}
            />
          ) : (
            <input
              ref={tooltipRef(editField(t(label)))}
              name={name}
              defaultValue={String(edit[name] ?? "")}
              inputMode={name === "bpm" ? "decimal" : undefined}
              disabled={!writable}
            />
          )}
        </label>
      ))}
      <label>
        {t("field.color")}
        <select
          ref={tooltipRef(tips.trackColor)}
          name="color"
          defaultValue={String(currentColor)}
          disabled={!writable}
        >
          {palette.map(([value, label]) => (
            <option key={value} value={String(value)}>{label}</option>
          ))}
        </select>
      </label>
      <label>
        {t("field.rating")}
        <select
          ref={tooltipRef(tips.trackRating)}
          name="rating"
          defaultValue={ratingValue}
          disabled={!writable}
        >
          {ratings.map(([value, label]) => (
            <option key={value || "none"} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <label className="check">
        <input
          ref={tooltipRef(tips.beatgridLock)}
          type="checkbox"
          name="is_beatgrid_locked"
          defaultChecked={Boolean(edit.is_beatgrid_locked)}
          disabled={!writable}
        />
        {t("field.beatgridLocked")}
      </label>
      <button
        type="submit"
        className="text-button wide"
        ref={tooltipRef(tips.saveTrack)}
        disabled={!writable}
      >
        {t("detail.saveTrack")}
      </button>
    </form>
  );
}

function shownFact(value: string | number | null | undefined): string {
  return value ? String(value) : "—";
}

function TrackBody({ track }: { track: Track }) {
  const list = useTrackList();
  const writable = Boolean(track.serato?.writable && list.writable);
  const playTitle = track.title || track.name || playerStrings.untitled;
  const bodyRef = useRef<HTMLDivElement>(null);
  const jumpLock = useRef<DetailSectionId | null>(null);
  const jumpTimer = useRef(0);
  const [active, setActive] = useState<DetailSectionId>("related");
  const path = track.resolved_path || track.edit?.portable_id || "";
  const pathKey = `${track.id}:${path}`;
  const [countKey, setCountKey] = useState(pathKey);
  const [relatedCount, setRelatedCount] = useState<number | null>(path ? null : 0);
  if (countKey !== pathKey) {
    setCountKey(pathKey);
    setRelatedCount(path ? null : 0);
  }
  const reportSaved = useCallback((count: number | null) => {
    setRelatedCount(count);
  }, []);
  const mixes = t("detail.nav.related");
  const cuesLabel = t("detail.nav.markers");
  const cratesLabel = t("crates.heading");
  const copiesLabel = t("detail.nav.copies");
  const tagsLabel = t("detail.nav.fields");
  const chips: DetailChip[] = [
    { id: "related", label: mixes, count: relatedCount },
    { id: "markers", label: cuesLabel, count: markerCount(track) },
    { id: "crates", label: cratesLabel, count: crateMembershipCount(track) },
    { id: "copies", label: copiesLabel, count: copyCount(track) },
    { id: "fields", label: tagsLabel, count: fieldGroupCount(track) },
  ];
  const groups = track.groups || [];
  const libraryHasCrates = list.crates.length > 0;

  function jump(id: DetailSectionId): void {
    jumpLock.current = id;
    window.clearTimeout(jumpTimer.current);
    jumpTimer.current = window.setTimeout(() => {
      if (jumpLock.current === id) jumpLock.current = null;
    }, DETAIL_JUMP_LOCK_MS);
    setActive(id);
    const scope = bodyRef.current;
    if (scope) scrollDetailSection(id, scope);
  }

  useEffect(() => {
    const scope = bodyRef.current;
    if (!scope || typeof IntersectionObserver === "undefined") return;
    jumpLock.current = null;
    window.clearTimeout(jumpTimer.current);
    setActive("related");
    const root = scope.closest(".detail");
    const nodes = DETAIL_SECTION_IDS.flatMap((id) => {
      const node = scope.querySelector(`[data-detail-section="${id}"]`);
      return node instanceof HTMLElement ? [[id, node] as const] : [];
    });
    const visible = new Map<HTMLElement, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target instanceof HTMLElement) visible.set(entry.target, entry.isIntersecting);
        }
        const next = nodes.find(([, node]) => visible.get(node) === true)?.[0];
        if (next && !jumpLock.current) setActive(next);
      },
      {
        root: root instanceof Element ? root : null,
        rootMargin: "-8% 0px -75% 0px",
        threshold: [0, 0.1],
      },
    );
    for (const [, node] of nodes) observer.observe(node);
    return () => {
      observer.disconnect();
      window.clearTimeout(jumpTimer.current);
    };
  }, [track.id]);

  return (
    <div className="detail-body" ref={bodyRef}>
      <div className="detail-sticky">
        <DetailHead
          title={detailTitle(track)}
          artist={track.artist || ""}
          album={track.album || ""}
          bpm={shownFact(track.bpm)}
          musicalKey={shownFact(track.key)}
          length={shownFact(track.length)}
          color={detailSwatch(track.color)}
          trackId={track.id}
          playName={playTitle}
        />
        <DetailSectionNav chips={chips} active={active} onJump={jump} />
      </div>
      <p className="lock-note">{track.serato?.message || list.serato?.message || ""}</p>
      <TrackEditor track={track} writable={writable} />
      <DetailSection id="related" title={mixes} count={relatedCount}>
        <RelatedTracks track={track} writable={writable} embedded onSavedCount={reportSaved} />
      </DetailSection>
      <DetailSection
        id="markers"
        title={t("detail.markersTitle")}
        count={markerCount(track)}
        empty={markersAreEmpty(track) ? t("detail.emptyMarkers") : undefined}
      >
        <MarkerSection track={track} writable={writable} />
      </DetailSection>
      <DetailSection
        id="crates"
        title={cratesLabel}
        count={crateMembershipCount(track)}
        empty={libraryHasCrates ? undefined : t("detail.emptyCrates")}
      >
        <MembershipSection track={track} writable={writable} />
      </DetailSection>
      <DetailSection
        id="copies"
        title={t("copies.heading")}
        count={copyCount(track)}
        empty={copyCount(track) === 0 ? t("detail.emptyCopies") : undefined}
      >
        <CopySection fromId={track.id} copies={track.copies || []} writable={writable} />
      </DetailSection>
      <DetailSection
        id="fields"
        title={t("detail.fieldsTitle")}
        count={fieldGroupCount(track)}
        empty={groups.length === 0 ? t("detail.emptyFields") : undefined}
      >
        <FieldGroups track={track} />
      </DetailSection>
    </div>
  );
}

function HistoryBody({ entry }: { entry: Track }) {
  const list = useTrackList();
  const lines: Array<[string, string]> = [
    [t("column.played"), entry.played ? t("common.yes") : t("common.no")],
    [t("column.deck"), entry.deck || "—"],
    [t("history.started"), clockLabel(entry.start_time) || "—"],
    [t("history.file"), entry.file || "—"],
  ];
  if (entry.notes) lines.push([t("history.notes"), entry.notes]);
  return (
    <div className="detail-body">
      <h2>{entry.name || t("track.untitled")}</h2>
      {entry.artist ? <p className="artist">{entry.artist}</p> : null}
      {lines.map(([label, value]) => (
        <div key={label} className="field">
          <div className="label">{label}</div>
          <div className="value">{value}</div>
        </div>
      ))}
      {entry.asset_id ? (
        <button
          type="button"
          className="text-button"
          ref={tooltipRef(tips.openInLibrary)}
          onClick={() => list.openInLibrary(entry.asset_id as number)}
        >
          {t("history.openInLibrary")}
        </button>
      ) : null}
    </div>
  );
}

/**
 * Detail pane driven by TrackListContext.
 *
 * Empty, reading, error, history entry, or the library track editor.
 */
export function TrackDetailPane() {
  const list = useTrackList();
  const { detail } = list;
  if (detail.kind === "none") {
    return <p className="detail-empty">{t("detail.empty")}</p>;
  }
  if (detail.kind === "empty") {
    return <p className="detail-empty">{detail.message}</p>;
  }
  if (detail.kind === "reading") {
    return <p className="detail-empty">{t("detail.reading")}</p>;
  }
  if (detail.kind === "error") {
    return <p className="detail-error">{detail.message}</p>;
  }
  if (detail.kind === "entry") {
    return <HistoryBody entry={detail.entry} />;
  }
  return <TrackBody track={detail.track} />;
}
