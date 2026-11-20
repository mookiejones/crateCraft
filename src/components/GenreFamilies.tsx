/**
 * Genre families on Tag spellings (#365).
 *
 * Drag a genre onto a family, or pick Move to and press Move.
 * The map is saved beside settings. Grouping or Comment is a separate
 * previewed write and skips text that is already there unless Replace is on.
 */

import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import { postJSON } from "../lib/api";
import {
  fetchFamilies,
  moveTargets,
  parsePlan,
  parseReport,
  type GenreFamilyReport,
  type GenreNotePlan,
} from "../lib/health/genre-families";
import { t } from "../lib/i18n";
import { state } from "../lib/state";
import { tips } from "../lib/ui/tooltip-strings";
import { tooltipRef } from "./tooltip-ref";

const BUTTON_SX = {
  textTransform: "none" as const,
  minHeight: 44,
  color: "var(--color-text)",
  borderColor: "var(--color-text)",
  "&:hover": {
    color: "var(--color-text)",
    borderColor: "var(--color-text)",
  },
  "&.Mui-disabled": {
    color: "var(--color-text-muted)",
    borderColor: "var(--color-border)",
  },
};

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function GenreFamilies({
  writable,
  paused,
  revision,
}: {
  writable: boolean;
  paused: boolean;
  revision: unknown;
}) {
  const space = state.space;
  const [report, setReport] = useState<GenreFamilyReport | null>(null);
  const [status, setStatus] = useState(() => t("families.loading"));
  const [drag, setDrag] = useState("");
  const [drop, setDrop] = useState("");
  const [genre, setGenre] = useState("");
  const [parent, setParent] = useState("");
  const [field, setField] = useState<"grouping" | "comments">("grouping");
  const [overwrite, setOverwrite] = useState(false);
  const [plan, setPlan] = useState<GenreNotePlan | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let alive = true;
    void (async () => {
      try {
        const next = await fetchFamilies(space, controller.signal);
        if (!alive) return;
        setReport(next);
        setStatus(next.saved ? t("families.saved") : t("families.seeded"));
      } catch (error: unknown) {
        if (!alive || controller.signal.aborted) return;
        setStatus(messageOf(error, t("families.badReport")));
      }
    })();
    return () => {
      alive = false;
      controller.abort();
    };
  }, [revision, space]);

  const names = report ? Object.keys(report.parents).sort((left, right) => left.localeCompare(right)) : [];
  const selected = names.includes(genre) ? genre : (names[0] ?? "");
  const targets = report && selected ? moveTargets(report.parents, selected) : [];
  const parentValue = parent !== "" && targets.includes(parent) ? parent : "";
  const locked = paused || busy;

  async function move(name: string, nextParent: string | null): Promise<void> {
    if (!name || locked) return;
    setBusy(true);
    try {
      const payload: unknown = await postJSON("/api/genre-families", {
        action: "reparent",
        space,
        genre: name,
        parent: nextParent,
      });
      const next = parseReport(payload);
      if (!next) {
        setStatus(t("families.badReport"));
        return;
      }
      setReport(next);
      setPlan(null);
      setStatus(nextParent
        ? t("families.statusMoved", { genre: name, parent: nextParent })
        : t("families.statusRoot", { genre: name }));
    } catch (error: unknown) {
      setStatus(messageOf(error, t("families.badReport")));
    } finally {
      setBusy(false);
      setDrag("");
      setDrop("");
    }
  }

  function canDrop(target: string | null, source: string): boolean {
    if (!report || !source || !(source in report.parents)) return false;
    if (target === null) return report.parents[source] != null;
    return moveTargets(report.parents, source).includes(target);
  }

  function onDragStart(event: React.DragEvent<HTMLButtonElement>, name: string): void {
    setDrag(name);
    event.dataTransfer.setData("text/plain", name);
    event.dataTransfer.effectAllowed = "move";
  }

  async function onDrop(event: React.DragEvent<HTMLDivElement>, target: string | null): Promise<void> {
    event.preventDefault();
    const source = event.dataTransfer.getData("text/plain") || drag;
    setDrop("");
    if (!canDrop(target, source)) return;
    await move(source, target);
  }

  async function preview(): Promise<void> {
    setBusy(true);
    try {
      const payload: unknown = await postJSON("/api/genre-families", {
        action: "write-preview",
        space,
        field,
        overwrite,
      });
      const next = parsePlan(payload);
      if (!next) {
        setStatus(t("families.badReport"));
        return;
      }
      setPlan(next);
      setStatus(next.changes.length
        ? t("families.previewReady", { count: next.changes.length, blocked: next.blocked.length })
        : t("families.nothing"));
    } catch (error: unknown) {
      setStatus(messageOf(error, t("families.badReport")));
    } finally {
      setBusy(false);
    }
  }

  async function apply(): Promise<void> {
    if (!writable || !plan || plan.changes.length === 0) return;
    setBusy(true);
    try {
      const payload: unknown = await postJSON("/api/genre-families", {
        action: "write-apply",
        space,
        field,
        overwrite,
        confirm: true,
      });
      const next = parsePlan(payload);
      if (!next) {
        setStatus(t("families.badReport"));
        return;
      }
      setPlan(next);
      setStatus(next.written
        ? t("families.written", { count: next.changes.length })
        : t("families.nothing"));
    } catch (error: unknown) {
      setStatus(messageOf(error, t("families.badReport")));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="genre-families" aria-labelledby="genre-families-heading" aria-busy={busy}>
      <h3 id="genre-families-heading">{t("families.heading")}</h3>
      <p className="gig-note">{t("families.intro")}</p>
      <p id="genre-families-status" className="gig-status" role="status" aria-live="polite">{status}</p>
      {report && report.families.length === 0 ? <p className="gig-note">{t("families.empty")}</p> : null}
      {report && report.families.length > 0 ? (
        <div className="genre-family-list">
          <div
            className="genre-family"
            data-drop={drop === "root" ? "on" : "off"}
            onDragOver={(event) => {
              if (!canDrop(null, drag)) return;
              event.preventDefault();
              setDrop("root");
            }}
            onDragLeave={() => setDrop((current) => (current === "root" ? "" : current))}
            onDrop={(event) => void onDrop(event, null)}
          >
            <span ref={tooltipRef(tips.familiesRoot)}>{t("families.root")}</span>
          </div>
          {report.families.map((family) => (
            <div
              key={family.name}
              className="genre-family"
              data-drop={drop === family.name ? "on" : "off"}
              onDragOver={(event) => {
                if (!canDrop(family.name, drag)) return;
                event.preventDefault();
                setDrop(family.name);
              }}
              onDragLeave={() => setDrop((current) => (current === family.name ? "" : current))}
              onDrop={(event) => void onDrop(event, family.name)}
            >
              <button
                type="button"
                draggable
                ref={tooltipRef(tips.familiesDrag)}
                onDragStart={(event) => onDragStart(event, family.name)}
                onDragEnd={() => {
                  setDrag("");
                  setDrop("");
                }}
              >
                {family.name}
              </button>
              <span>{t("families.tracks", { count: family.tracks })}</span>
              {family.children.length > 0 ? (
                <ul>
                  {family.children.map((child) => (
                    <li key={child.name}>
                      <button
                        type="button"
                        draggable
                        ref={tooltipRef(tips.familiesDrag)}
                        onDragStart={(event) => onDragStart(event, child.name)}
                        onDragEnd={() => {
                          setDrag("");
                          setDrop("");
                        }}
                      >
                        {child.name}
                      </button>
                      <span>{t("families.tracks", { count: child.tracks })}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      {names.length > 0 ? (
        <div className="tags-actions">
          <label htmlFor="genre-family-genre">
            {t("families.genre")}
            <select
              id="genre-family-genre"
              value={selected}
              disabled={locked}
              ref={tooltipRef(tips.familiesGenre)}
              onChange={(event) => {
                setGenre(event.target.value);
                setParent("");
              }}
            >
              {names.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
          <label htmlFor="genre-family-parent">
            {t("families.moveTo")}
            <select
              id="genre-family-parent"
              value={parentValue}
              disabled={locked}
              ref={tooltipRef(tips.familiesMoveTo)}
              onChange={(event) => setParent(event.target.value)}
            >
              <option value="">{t("families.root")}</option>
              {targets.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
          <Button
            id="genre-family-move"
            type="button"
            size="small"
            variant="outlined"
            sx={BUTTON_SX}
            ref={tooltipRef(tips.familiesMove)}
            data-family-action="move"
            disabled={locked || !selected}
            onClick={() => void move(selected, parentValue || null)}
          >
            {t("families.move")}
          </Button>
          <label htmlFor="genre-family-field">
            {t("families.field")}
            <select
              id="genre-family-field"
              value={field}
              disabled={locked}
              ref={tooltipRef(tips.familiesField)}
              onChange={(event) => {
                const next = event.target.value;
                if (next === "grouping" || next === "comments") {
                  setField(next);
                  setPlan(null);
                }
              }}
            >
              <option value="grouping">{t("families.field.grouping")}</option>
              <option value="comments">{t("families.field.comments")}</option>
            </select>
          </label>
          <label className="tags-write-files" htmlFor="genre-family-overwrite">
            <input
              id="genre-family-overwrite"
              type="checkbox"
              checked={overwrite}
              disabled={locked}
              ref={tooltipRef(tips.familiesOverwrite)}
              onChange={(event) => {
                setOverwrite(event.target.checked);
                setPlan(null);
              }}
            />
            {t("families.overwrite")}
          </label>
          <Button
            id="genre-family-preview"
            type="button"
            size="small"
            variant="outlined"
            sx={BUTTON_SX}
            ref={tooltipRef(tips.familiesPreview)}
            data-family-action="preview"
            disabled={locked}
            onClick={() => void preview()}
          >
            {t("families.preview")}
          </Button>
          <Button
            id="genre-family-apply"
            type="button"
            size="small"
            variant="outlined"
            sx={BUTTON_SX}
            ref={tooltipRef(tips.familiesApply)}
            data-family-action="apply"
            disabled={locked || !writable || !plan || plan.changes.length === 0}
            onClick={() => void apply()}
          >
            {t("families.apply")}
          </Button>
        </div>
      ) : null}
      {plan && (plan.changes.length > 0 || plan.blocked.length > 0) ? (
        <ul id="genre-families-plan">
          {plan.changes.map((change) => (
            <li key={`change-${String(change.id)}`}>{t("families.changeRow", { id: change.id, to: change.to })}</li>
          ))}
          {plan.blocked.map((change) => (
            <li key={`blocked-${String(change.id)}`}>{t("families.blockedRow", { id: change.id, from: change.from })}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
