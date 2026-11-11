/**
 * Tag spellings report painted from HealthContext.
 */

import type { TagClusterGroup, TagClusterPlan } from "../lib/api-types";
import { useHealth } from "../containers/HealthContext";
import { t } from "../lib/i18n";
import {
  groupHeading,
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
        <button
          type="button"
          ref={tooltipRef(tips.tagsApplyMappings)}
          data-tags-action="refresh-apply"
          disabled={!canApply}
          onClick={onApply}
        >
          {t("tags.applyMappings")}
        </button>
      </div>
    </div>
  );
}

function GroupCard({
  group,
  open,
  chosen,
  plan,
  busy,
  canApply,
  onPreview,
  onApply,
  onSelect,
}: {
  group: TagClusterGroup;
  open: boolean;
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
    <details className="gig-group" open={open} data-key={group.key}>
      <summary ref={tooltipRef(tips.tagsGroup)}>{groupHeading(group)}</summary>
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
        <button
          type="button"
          ref={tooltipRef(tips.tagsPreview)}
          data-tags-action="preview"
          data-key={group.key}
          disabled={busy || !chosen}
          onClick={onPreview}
        >
          {t("tags.preview")}
        </button>
        <button
          type="button"
          ref={tooltipRef(tips.tagsApply)}
          data-tags-action="apply"
          data-key={group.key}
          disabled={!canApply || Boolean(plan && plan.value === chosen && !plan.changes.length)}
          onClick={onApply}
        >
          {t("tags.apply")}
        </button>
      </div>
    </details>
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
        <button
          type="button"
          ref={tooltipRef(tips.tagsApplyTitles)}
          data-tags-action="clean-apply"
          disabled={!canApply}
          onClick={onApply}
        >
          {t("tags.apply")}
        </button>
      </div>
    </>
  );
}

/**
 * Genre, Artist, Titles, Check again, and the spelling groups.
 */
export function TagsPanel() {
  const health = useHealth();
  const field = health.tagsField;
  const groups = health.tagsClusters?.groups ?? [];

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

  return (
    <>
      <h2 id="tags-heading" className="visually-hidden">{t("tags.heading")}</h2>
      <div className="browser-bar">
        <p id="tags-scope" className="files-path">{t("gig.wholeSpace")}</p>
        <div id="tags-fields" role="group" aria-label={t("tags.field")}>
          <button
            id="tags-genre"
            type="button"
            ref={tooltipRef(tips.tagsGenre)}
            aria-pressed={field === "genre"}
            disabled={health.tagsBusy}
            aria-busy={health.tagsBusy ? "true" : "false"}
            onClick={() => onField("genre")}
          >
            {t("tags.genre")}
          </button>
          <button
            id="tags-artist"
            type="button"
            ref={tooltipRef(tips.tagsArtist)}
            aria-pressed={field === "artist"}
            disabled={health.tagsBusy}
            aria-busy={health.tagsBusy ? "true" : "false"}
            onClick={() => onField("artist")}
          >
            {t("tags.artist")}
          </button>
          <button
            id="tags-titles"
            type="button"
            ref={tooltipRef(tips.tagsTitles)}
            aria-pressed={field === "titles"}
            disabled={health.tagsBusy}
            aria-busy={health.tagsBusy ? "true" : "false"}
            onClick={() => onField("titles")}
          >
            {t("tags.titles")}
          </button>
        </div>
        <button
          id="tags-refresh"
          type="button"
          ref={tooltipRef(tips.tagsRefresh)}
          disabled={health.tagsBusy}
          aria-busy={health.tagsBusy ? "true" : "false"}
          onClick={() => {
            void health.loadTags();
          }}
        >
          {t("gig.checkAgain")}
        </button>
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
            {groups.map((group, index) => {
              const chosen = health.tagsSelected.get(group.key) ?? group.suggested ?? "";
              return (
                <GroupCard
                  key={group.key}
                  group={group}
                  open={index === 0 || health.tagsOpen.has(group.key)}
                  chosen={chosen}
                  plan={health.tagsPlans.get(group.key)}
                  busy={health.tagsBusy}
                  canApply={canApply(group.key)}
                  onPreview={() => void health.previewGroup(group.key)}
                  onApply={() => void health.applyGroup(group.key)}
                  onSelect={(value) => health.selectSpelling(group.key, value)}
                />
              );
            })}
          </>
        ) : null}
      </div>
    </>
  );
}
