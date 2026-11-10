/**
 * Damaged-files report painted from HealthContext.
 */

import type { FileScanProblem } from "../api-types";
import { useHealth } from "../context/HealthContext";
import { t, type MessageKey } from "../i18n";
import { tips } from "../tooltip-strings";
import { tooltipRef } from "./tooltip-ref";

const LIST_CAP = 100;
const PROBLEM_ORDER = [
  "empty",
  "unreadable",
  "wrong_format",
  "serato_flagged",
  "undecodable",
  "decode_error",
  "short",
] as const;

const PROBLEM_KEYS: Record<string, MessageKey> = {
  empty: "scan.problem.empty",
  unreadable: "scan.problem.unreadable",
  wrong_format: "scan.problem.wrong_format",
  serato_flagged: "scan.problem.serato_flagged",
  undecodable: "scan.problem.undecodable",
  decode_error: "scan.problem.decode_error",
  short: "scan.problem.short",
};

function problemHeading(kind: string): string {
  return t(PROBLEM_KEYS[kind] ?? "scan.problem.unknown");
}

function problemDetail(item: FileScanProblem): string {
  const heading = problemHeading(item.problem);
  if (item.problem === "wrong_format" && item.detail) {
    return t("scan.wrongFormatDetail", { detail: item.detail });
  }
  if ((item.problem === "decode_error" || item.problem === "short") && item.detail) {
    return t(item.problem === "short" ? "scan.shortDetail" : "scan.decodeErrorDetail", {
      detail: item.detail,
    });
  }
  if (item.problem === "serato_flagged" && item.detail) {
    return `${heading}: ${item.detail}`;
  }
  return heading;
}

function problemLine(item: FileScanProblem): string {
  const title = [item.artist, item.name].filter(Boolean).join(" — ") || item.file;
  return t("scan.row", { title, file: item.file, problem: problemDetail(item) });
}

function problemKinds(problems: FileScanProblem[]): string[] {
  const seen = new Set(problems.map((item) => item.problem));
  const known = PROBLEM_ORDER.filter((kind) => seen.has(kind));
  const extra = [...seen].filter((kind) => !PROBLEM_ORDER.includes(kind as (typeof PROBLEM_ORDER)[number])).sort();
  return [...known, ...extra];
}

function ProblemGroup({
  kind,
  rows,
  expanded,
  onExpand,
}: {
  kind: string;
  rows: FileScanProblem[];
  expanded: boolean;
  onExpand: () => void;
}) {
  const lines = rows.map(problemLine);
  const shown = expanded ? lines : lines.slice(0, LIST_CAP);
  return (
    <details className="gig-group" open>
      <summary>{t("gig.groupCount", { label: problemHeading(kind), count: lines.length })}</summary>
      <ul>
        {shown.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      {lines.length > LIST_CAP && !expanded ? (
        <button type="button" ref={tooltipRef(tips.gigShowAll)} className="gig-show-all" onClick={onExpand}>
          {t("gig.showAll", { count: lines.length })}
        </button>
      ) : null}
    </details>
  );
}

/**
 * Quick check, Full decode, and the damaged-file report.
 */
export function ScanPanel() {
  const health = useHealth();
  const payload = health.scanReport;
  const problems = payload?.problems ?? [];

  return (
    <>
      <h2 id="scan-heading" className="visually-hidden">{t("scan.heading")}</h2>
      <div className="browser-bar">
        <p id="scan-scope" className="files-path">{health.scanScope}</p>
        <button
          id="scan-quick"
          type="button"
          ref={tooltipRef(tips.scanQuick)}
          disabled={health.scanBusy}
          aria-busy={health.scanBusy ? "true" : "false"}
          onClick={() => {
            void health.loadScan("quick");
          }}
        >
          {t("scan.checkQuick")}
        </button>
        <button
          id="scan-full"
          type="button"
          ref={tooltipRef(tips.scanFull)}
          disabled={health.scanBusy || health.scanFullDisabled}
          aria-busy={health.scanBusy ? "true" : "false"}
          onClick={() => {
            void health.loadScan("full");
          }}
        >
          {t("scan.checkFull")}
        </button>
      </div>
      <p id="scan-hint" className="gig-note">{t("scan.intro")}</p>
      <p id="scan-status" className="gig-status" role="status" aria-live="polite">{health.scanStatus}</p>
      <div id="scan-report" className="gig-report" tabIndex={-1}>
        {payload ? (
          <>
            <p className="gig-note">
              {problems.length
                ? t("scan.summary", { checked: payload.checked, count: problems.length })
                : t("scan.summaryClear", { checked: payload.checked })}
            </p>
            {payload.not_found ? <p className="gig-note">{t("scan.notFound", { count: payload.not_found })}</p> : null}
            {payload.unchecked ? <p className="gig-note">{t("scan.unchecked", { count: payload.unchecked })}</p> : null}
            {problems.length ? problemKinds(problems).map((kind) => (
              <ProblemGroup
                key={kind}
                kind={kind}
                rows={problems.filter((item) => item.problem === kind)}
                expanded={health.scanExpanded.has(kind)}
                onExpand={() => health.expandScan(kind)}
              />
            )) : <p className="gig-note">{t("scan.empty")}</p>}
          </>
        ) : null}
      </div>
    </>
  );
}
