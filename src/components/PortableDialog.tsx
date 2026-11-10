/**
 * Read-only portable drive report painted by React.
 *
 * The request is GET /api/drive-check. Nothing on the drive is written.
 */

import { useFiles } from "../containers/FilesContext";
import { t } from "../lib/i18n";
import { FINDING_CAP, closePortable, portableKindLabel } from "../lib/gig/portable";
import { setTooltip } from "../lib/ui/tooltip";
import { tips } from "../lib/ui/tooltip-strings";

/**
 * Portable drive dialog body.
 */
export function PortableDialog() {
  const files = useFiles();
  const report = files.portableReport;
  let verdict = "";
  if (report) {
    if (report.missing_drive) verdict = t("portable.missing");
    else if (report.ready) verdict = t("portable.ready");
    else verdict = t("portable.notReady");
  }
  const shown = report ? report.findings.slice(0, FINDING_CAP) : [];
  const hidden = report ? report.findings.length - shown.length : 0;

  return (
    <>
      <h2 id="portable-title">{t("portable.title")}</h2>
      <p id="portable-note" className="dialog-note">{t("portable.readOnly")}</p>
      <p id="portable-verdict">{verdict}</p>
      <p id="portable-summary">{report?.summary ?? ""}</p>
      <ul id="portable-findings">
        {shown.map((finding, index) => (
          <li key={`finding-${index}`}>
            <span className="portable-kind">{portableKindLabel(finding.kind)}</span>
            {finding.fix
              ? (
                <>
                  {" "}
                  <span className="portable-fix">{finding.fix}</span>
                </>
              )
              : null}
          </li>
        ))}
        {(report?.errors ?? []).map((error, index) => (
          <li key={`error-${index}`}>{error.crate ? `${error.crate}: ${error.message}` : error.message}</li>
        ))}
        {hidden > 0 ? <li>{t("files.andMore", { count: hidden })}</li> : null}
      </ul>
      <p id="portable-status" className="dialog-status" role="status" aria-live="polite">
        {files.portableStatus}
      </p>
      <div className="dialog-actions">
        <button
          id="portable-close"
          type="button"
          ref={(element) => {
            if (element) setTooltip(element, tips.portableClose);
          }}
          onClick={() => closePortable()}
        >
          {t("common.close")}
        </button>
      </div>
    </>
  );
}
