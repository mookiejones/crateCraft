/**
 * Tag spellings report painted from HealthContext.
 *
 * Review and Apply stay above a Community Data Grid of clusters.
 * Suggested spelling and counts are columns. Radios pick the spelling
 * for the selected row.
 */

import { useMemo, useState } from "react";
import type { GridColDef } from "@mui/x-data-grid";
import Button from "@mui/material/Button";
import type { TagClusterGroup, TagClusterPlan } from "../lib/api-types";
import { HealthDataGrid, type HealthGridRow } from "../components/HealthDataGrid";
import { useHealth } from "../containers/HealthContext";
import { t } from "../lib/i18n";
import {
  mappingPreviewSummary,
  previewLines,
  spellingLabel,
  tagsSummary,
  titlesSummary,
  type TagField,
} from "../lib/health/tags-view";
import { tips } from "../lib/ui/tooltip-strings";
import { tooltipRef } from "../components/tooltip-ref";

const LIST_CAP = 100;
const TITLE_KEY = "clean";
const MAPPING_KEY = "saved";
const BUTTON_SX = { textTransform: "none" as const, minHeight: 44 };

type ClusterRow = HealthGridRow & TagClusterGroup;

function DiffLines({ plan }: { plan: TagClusterPlan }) {
  const lines = previewLines(plan.changes).slice(0, LIST_CAP);
  if (!lines.length) return null;
  return (
    <ul>
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}

function MappingCard({
  plan,
  canApply,
  onApply,
}: {
  plan: TagClusterPlan;
  canApply: boolean;
  onApply: () => void;
}) {
  if (!plan.changes.length) return null;
  return (
    <div className="tags-mappings">
      <p className="gig-note">{mappingPreviewSummary(plan)}</p>
      <DiffLines plan={plan} />
      <div className="tags-actions">
        <Button
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          ref={tooltipRef(tips.tagsApplyMappings)}
          data-tags-action="refresh-apply"
          disabled={!canApply}
          onClick={onApply}
        >
          {t("tags.applyMappings")}
        </Button>
      </div>
    </div>
  );
}

function TitlesReport({
  plan,
  canApply,
  onApply,
}: {
  plan: TagClusterPlan;
  canApply: boolean;
  onApply: () => void;
}) {
  return (
    <>
      <p className="gig-note">{titlesSummary(plan.changes.length)}</p>
      <DiffLines plan={plan} />
      <div className="tags-actions">
        <Button
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          ref={tooltipRef(tips.tagsApplyTitles)}
          data-tags-action="clean-apply"
          disabled={!canApply}
          onClick={onApply}
        >
          {t("tags.apply")}
        </Button>
      </div>
    </>
  );
}

function ClusterActions({
  group,
  chosen,
  plan,
  busy,
  canApply,
  onPreview,
  onApply,
  onSelect,
}: {
  group: TagClusterGroup;
  chosen: string;
  plan: TagClusterPlan | undefined;
  busy: boolean;
  canApply: boolean;
  onPreview: () => void;
  onApply: () => void;
  onSelect: (value: string) => void;
}) {
  const showPlan = plan && plan.value === chosen;
  return (
    <div className="tags-cluster-chrome">
      <ul className="tags-spellings">
        {group.spellings.map((spelling) => (
          <li key={spelling.value}>
            <label className="tags-spelling">
              <input
                ref={tooltipRef(tips.tagsSpelling)}
                type="radio"
                name={`tags-${group.key}`}
                value={spelling.value}
                checked={spelling.value === chosen}
                disabled={busy}
                onChange={(event) => onSelect(event.currentTarget.value)}
              />
              <span>{spellingLabel(spelling.value, spelling.count, spelling.value === group.suggested)}</span>
            </label>
          </li>
        ))}
      </ul>
      {showPlan ? <DiffLines plan={plan} /> : null}
      <div className="tags-actions">
        <Button
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          ref={tooltipRef(tips.tagsPreview)}
          data-tags-action="preview"
          data-key={group.key}
          disabled={busy || !chosen}
          onClick={onPreview}
        >
          {t("tags.preview")}
        </Button>
        <Button
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          ref={tooltipRef(tips.tagsApply)}
          data-tags-action="apply"
          data-key={group.key}
          disabled={!canApply || Boolean(plan && plan.value === chosen && !plan.changes.length)}
          onClick={onApply}
        >
          {t("tags.apply")}
        </Button>
      </div>
    </div>
  );
}

/**
 * Genre, Artist, Titles, Check again, and the spelling Data Grid.
 */
export function TagsPanel() {
  const health = useHealth();
  const field = health.tagsField;
  const groups = health.tagsClusters?.groups ?? [];
  const [selectedKey, setSelectedKey] = useState("");
  const selected = groups.find((row) => row.key === selectedKey) ?? groups[0];

  function onField(next: TagField): void {
    if (health.tagsField === next) return;
    health.setTagsField(next);
    void health.loadTags();
  }

  function canApply(key: string): boolean {
    const plan = health.tagsPlans.get(key);
    const group = groups.find((row) => row.key === key);
    const value = health.tagsSelected.get(key) ?? group?.suggested ?? "";
    return Boolean(
      plan && plan.value === value && plan.changes.length && health.tagsWritable && !health.tagsBusy
        && health.tagsActionKey !== key,
    );
  }

  const canApplyTitles = Boolean(
    health.titlePlan?.changes.length && health.tagsWritable && !health.tagsBusy && health.tagsActionKey !== TITLE_KEY,
  );
  const canApplyMappings = Boolean(
    health.mappingPlan?.changes.length && health.tagsWritable && !health.tagsBusy && health.tagsActionKey !== MAPPING_KEY,
  );

  const rows = useMemo<ClusterRow[]>(
    () => groups.map((group) => ({ ...group, id: group.key })),
    [groups],
  );
  const columns = useMemo<GridColDef<ClusterRow>[]>(() => [
    {
      field: "suggested",
      headerName: t("tags.column.suggested"),
      flex: 1.4,
      minWidth: 160,
    },
    {
      field: "tracks",
      headerName: t("tags.column.tracks"),
      width: 110,
      type: "number",
    },
    {
      field: "spellings",
      headerName: t("tags.column.spellings"),
      width: 120,
      type: "number",
      valueGetter: (_value, row) => row.spellings.length,
    },
  ], []);

  return (
    <>
      <h2 id="tags-heading" className="visually-hidden">{t("tags.heading")}</h2>
      <div className="browser-bar">
        <p id="tags-scope" className="files-path">{t("gig.wholeSpace")}</p>
        <div id="tags-fields" role="group" aria-label={t("tags.field")}>
          <Button
            id="tags-genre"
            type="button"
            size="small"
            variant="outlined"
            sx={BUTTON_SX}
            ref={tooltipRef(tips.tagsGenre)}
            aria-pressed={field === "genre"}
            disabled={health.tagsBusy}
            aria-busy={health.tagsBusy ? "true" : "false"}
            onClick={() => onField("genre")}
          >
            {t("tags.genre")}
          </Button>
          <Button
            id="tags-artist"
            type="button"
            size="small"
            variant="outlined"
            sx={BUTTON_SX}
            ref={tooltipRef(tips.tagsArtist)}
            aria-pressed={field === "artist"}
            disabled={health.tagsBusy}
            aria-busy={health.tagsBusy ? "true" : "false"}
            onClick={() => onField("artist")}
          >
            {t("tags.artist")}
          </Button>
          <Button
            id="tags-titles"
            type="button"
            size="small"
            variant="outlined"
            sx={BUTTON_SX}
            ref={tooltipRef(tips.tagsTitles)}
            aria-pressed={field === "titles"}
            disabled={health.tagsBusy}
            aria-busy={health.tagsBusy ? "true" : "false"}
            onClick={() => onField("titles")}
          >
            {t("tags.titles")}
          </Button>
        </div>
        <Button
          id="tags-refresh"
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          ref={tooltipRef(tips.tagsRefresh)}
          disabled={health.tagsBusy}
          aria-busy={health.tagsBusy ? "true" : "false"}
          onClick={() => {
            void health.loadTags();
          }}
        >
          {t("gig.checkAgain")}
        </Button>
      </div>
      <p id="tags-hint" className="gig-note">
        {field === "titles" ? t("tags.introTitles") : t("tags.intro")}
      </p>
      <p id="tags-status" className="gig-status" role="status" aria-live="polite">{health.tagsStatus}</p>
      <div id="tags-report" className="gig-report" tabIndex={-1}>
        {field === "titles" && health.titlePlan ? (
          <TitlesReport plan={health.titlePlan} canApply={canApplyTitles} onApply={() => void health.applyTitles()} />
        ) : null}
        {field !== "titles" && health.tagsClusters ? (
          <>
            <p className="gig-note">
              {tagsSummary(field, health.tagsClusters.values ?? 0, groups.length)}
            </p>
            {health.mappingPlan ? (
              <MappingCard
                plan={health.mappingPlan}
                canApply={canApplyMappings}
                onApply={() => void health.applyMappings()}
              />
            ) : null}
            {selected ? (
              <ClusterActions
                group={selected}
                chosen={health.tagsSelected.get(selected.key) ?? selected.suggested ?? ""}
                plan={health.tagsPlans.get(selected.key)}
                busy={health.tagsBusy}
                canApply={canApply(selected.key)}
                onPreview={() => void health.previewGroup(selected.key)}
                onApply={() => void health.applyGroup(selected.key)}
                onSelect={(value) => health.selectSpelling(selected.key, value)}
              />
            ) : null}
            {selected ? (
              <HealthDataGrid
                rows={rows}
                columns={columns}
                selectedId={selected.key}
                onSelectId={(id) => setSelectedKey(String(id))}
              />
            ) : null}
          </>
        ) : null}
      </div>
    </>
  );
}
