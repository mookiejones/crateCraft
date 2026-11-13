/**
 * Related-tracks section in the detail pane.
 *
 * GET /api/related is read-only. Saving a link writes the sidecar file.
 * The Serato crate button requires a quit library.
 */

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { failureOf, postJSON, readJSONOr } from "../lib/api";
import type { RelatedPayload, RelatedTrack, Track } from "../lib/api-types";
import { bridge } from "../lib/bridge";
import { useTrackList } from "../containers/TrackListContext";
import { t } from "../lib/i18n";
import { matchesQuery, parseQuery } from "../lib/ui/search-filters";
import { tooltipRef } from "../lib/ui/tooltip";
import { openConfirm } from "../lib/ui/shared-dialog";
import {
  chooseRelated,
  openRelated,
  removeRelatedTip,
  saveSuggestion,
  tips,
} from "../lib/ui/tooltip-strings";

function relatedPath(track: Track): string {
  return track.resolved_path || track.edit?.portable_id || "";
}

function relatedLabel(item: { title?: string; name?: string; artist?: string }): string {
  const title = item.title || item.name || t("track.untitled");
  return item.artist ? `${title} · ${item.artist}` : title;
}

/**
 * Saved links, search, suggestions, and the Related crate button.
 *
 * @param props Open track and whether writes are allowed.
 */
export function RelatedTracks({ track, writable }: { track: Track; writable: boolean }) {
  const list = useTrackList();
  const path = relatedPath(track);
  const [busy, setBusy] = useState(Boolean(path));
  const [loadError, setLoadError] = useState("");
  const [payload, setPayload] = useState<RelatedPayload | null>(null);
  const [query, setQuery] = useState("");
  const [chosen, setChosen] = useState<Track | null>(null);
  const [note, setNote] = useState("");
  const [rating, setRating] = useState("");
  const [mutual, setMutual] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!path) {
      setBusy(false);
      setPayload(null);
      setLoadError("");
      return;
    }
    let cancelled = false;
    setBusy(true);
    setLoadError("");
    const params = new URLSearchParams({ path, space: list.space });
    void (async () => {
      try {
        const response = await fetch(`/api/related?${params}`);
        const body = await readJSONOr<RelatedPayload>(response, {});
        if (cancelled) return;
        if (!response.ok) throw new Error(t("related.loadFailed"));
        setPayload(body);
        setBusy(false);
      } catch (error) {
        if (cancelled) return;
        setBusy(false);
        setLoadError(failureOf(error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [path, list.space, track.id]);

  const hits = useMemo(() => {
    const parsed = parseQuery(query);
    if (!parsed.terms.length && !parsed.filters.length) return null;
    return list.tracks
      .filter((item) => item.id !== track.id && matchesQuery(item, parsed))
      .slice(0, 8);
  }, [query, list.tracks, track.id]);

  async function reload(): Promise<void> {
    const params = new URLSearchParams({ path, space: list.space });
    const response = await fetch(`/api/related?${params}`);
    const body = await readJSONOr<RelatedPayload>(response, {});
    if (!response.ok) throw new Error(t("related.loadFailed"));
    setPayload(body);
    setLoadError("");
  }

  async function saveLink(body: Record<string, unknown>): Promise<void> {
    try {
      await postJSON("/api/related", body);
      list.setNotice(t("related.saved"));
      setChosen(null);
      await reload();
    } catch (error) {
      if (failureOf(error).status === 409) bridge.lockDown(error);
      else list.setNotice(failureOf(error).message, "error");
      setLoadError(failureOf(error).message);
    }
  }

  async function onRemove(link: RelatedTrack): Promise<void> {
    const label = link.track?.title || t("related.thisTrack");
    if (!(await openConfirm({
      title: t("common.remove"),
      message: t("related.confirmRemove", { name: label }),
      confirmLabel: t("common.remove"),
    }))) return;
    try {
      await postJSON("/api/related", { action: "remove", id: link.id });
      list.setNotice(t("related.removed"));
      await reload();
    } catch (error) {
      list.setNotice(failureOf(error).message, "error");
    }
  }

  async function onCrate(): Promise<void> {
    setSaving(true);
    try {
      const result = await postJSON("/api/related", { action: "crate", asset: track.id, space: list.space });
      list.setNotice(result.warning || t("related.crateUpdated", { name: String(result.name ?? "") }));
      await bridge.reloadLibrary();
      list.selectTrack(track.id);
    } catch (error) {
      if (failureOf(error).status === 409) {
        bridge.lockDown(error);
      } else {
        list.setNotice(failureOf(error).message, "error");
        setSaving(false);
      }
    }
  }

  const saved = Array.isArray(payload?.saved) ? payload.saved : [];
  const suggested = Array.isArray(payload?.suggested) ? payload.suggested : [];
  const crateName = payload?.crate_name || "Related";
  const headingId = `related-heading-${track.id}`;
  const status = !path
    ? t("related.noPath")
    : loadError
      ? loadError
      : busy
        ? t("related.loading")
        : saved.length
          ? t("related.savedCount", { count: saved.length })
          : t("related.noneSaved");

  function onSearch(event: FormEvent<HTMLInputElement>): void {
    setQuery(event.currentTarget.value);
    setChosen(null);
  }

  return (
    <section className="group" data-track-id={String(track.id)} aria-labelledby={headingId} aria-busy={busy}>
      <h3 id={headingId}>{t("related.heading")}</h3>
      <p className="detail-kicker" role="status">{status}</p>
      {payload && saved.length > 0 && (
        <ul className="related-list">
          {saved.map((link) => {
            const other = link.track || {};
            const label = other.title || t("track.untitled");
            const bits: string[] = [];
            if (other.artist) bits.push(other.artist);
            if (other.key) bits.push(other.key);
            if (other.bpm != null && other.bpm !== "") bits.push(t("markers.bpm", { bpm: String(other.bpm) }));
            bits.push(link.mutual ? t("related.twoWay") : t("related.oneWay"));
            if (link.rating != null) bits.push(t("related.ratingOutOf", { rating: String(link.rating) }));
            if (!other.in_library) bits.push(t("related.notInLibrary"));
            return (
              <li key={String(link.id)} className="related-row">
                <div>
                  {other.asset_id != null && other.in_library ? (
                    <button
                      type="button"
                      className="text-button"
                      ref={tooltipRef(openRelated(label))}
                      onClick={() => list.selectTrack(other.asset_id as number)}
                    >
                      {label}
                    </button>
                  ) : (
                    <span>{label}</span>
                  )}
                  <p className="related-meta">{bits.join(" · ")}</p>
                  {link.note ? <p className="related-note">{link.note}</p> : null}
                </div>
                <button
                  type="button"
                  className="text-button"
                  ref={tooltipRef(removeRelatedTip(label))}
                  aria-label={t("related.removeLink", { name: label })}
                  onClick={() => void onRemove(link)}
                >
                  {t("common.remove")}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {payload && (
        <div className="related-search">
          <label>
            {t("related.find")}
            <input
              ref={tooltipRef(tips.findRelated)}
              type="search"
              autoComplete="off"
              placeholder={t("related.findPlaceholder")}
              value={query}
              onInput={onSearch}
            />
          </label>
          <ul className="related-results">
            {hits === null ? (
              <li className="related-meta">{t("related.typeHint")}</li>
            ) : hits.length === 0 ? (
              <li className="related-meta">{t("list.noMatches")}</li>
            ) : (
              hits.map((hit) => {
                const name = relatedLabel(hit);
                return (
                  <li key={hit.id}>
                    <button
                      type="button"
                      className="text-button"
                      ref={tooltipRef(chooseRelated(name))}
                      onClick={() => {
                        setChosen(hit);
                        setNote("");
                        setRating("");
                        setMutual(true);
                      }}
                    >
                      {name}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          {chosen && (
            <div className="related-form">
              <p className="related-meta">{relatedLabel(chosen)}</p>
              <label>
                {t("related.note")}
                <input
                  ref={tooltipRef(tips.linkNote)}
                  type="text"
                  maxLength={500}
                  placeholder={t("related.notePlaceholder")}
                  value={note}
                  onChange={(event) => setNote(event.currentTarget.value)}
                />
              </label>
              <label>
                {t("related.linkRating")}
                <select
                  ref={tooltipRef(tips.linkRating)}
                  value={rating}
                  onChange={(event) => setRating(event.currentTarget.value)}
                >
                  <option value="">{t("rating.none")}</option>
                  {["1", "2", "3", "4", "5"].map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label className="check">
                <input
                  ref={tooltipRef(tips.linkMutual)}
                  type="checkbox"
                  checked={mutual}
                  onChange={(event) => setMutual(event.currentTarget.checked)}
                />
                {t("related.twoWayLink")}
              </label>
              <button
                type="button"
                className="text-button"
                ref={tooltipRef(tips.saveLink)}
                onClick={() => void saveLink({
                  action: "add",
                  asset: track.id,
                  target: chosen.id,
                  mutual,
                  note,
                  rating: rating === "" ? null : Number(rating),
                  space: list.space,
                })}
              >
                {t("related.saveLink")}
              </button>
            </div>
          )}
        </div>
      )}
      {payload && (
        <>
          <p className="detail-kicker">
            {suggested.length ? t("related.suggested") : t("related.noSuggestions")}
          </p>
          {suggested.length > 0 && (
            <ul className="related-list">
              {suggested.map((item, index) => (
                <li key={`${item.asset_id ?? index}`} className="related-row">
                  <div>
                    <span>{relatedLabel(item)}</span>
                    <p className="related-meta">{Array.isArray(item.reasons) ? item.reasons.join(" · ") : ""}</p>
                  </div>
                  <button
                    type="button"
                    className="text-button"
                    ref={tooltipRef(saveSuggestion(item.title || "Untitled"))}
                    aria-label={t("related.saveLinkTo", { name: item.title || t("track.untitled") })}
                    onClick={() => void saveLink({
                      action: "add",
                      asset: track.id,
                      target: item.asset_id,
                      mutual: true,
                      note: "",
                      rating: null,
                      space: list.space,
                    })}
                  >
                    {t("common.save")}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className="text-button"
            data-related-crate="true"
            ref={tooltipRef(tips.updateRelated)}
            disabled={!writable || saving}
            onClick={() => void onCrate()}
          >
            {t("related.updateCrate")}
          </button>
          <p className="detail-kicker">
            {writable ? t("related.crateNote", { name: crateName }) : t("related.quitSerato")}
          </p>
        </>
      )}
    </section>
  );
}
