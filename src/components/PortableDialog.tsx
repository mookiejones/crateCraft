/**
 * Portable drive report painted by React.
 *
 * Check drive is GET /api/drive-check. Copy smart crates and Restore
 * smart crates POST /api/portable-smart for the drive that was checked.
 */

import { useFiles } from "../containers/FilesContext";
import { t } from "../lib/i18n";
import {
  FINDING_CAP,
  closePortable,
  confirmPortableRestore,
  copyPortableSmart,
  overwritePortableSmart,
  portableKindLabel,
  previewPortableRestore,
} from "../lib/gig/portable";
import { setTooltip } from "../lib/ui/tooltip";
import { tips } from "../lib/ui/tooltip-strings";

/**
 * Portable drive dialog body.
 */
export function PortableDialog() {
  const files = useFiles();
  const report = files.portableReport;
  const busy = files.portableSmartBusy;
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
      <p id="portable-dialog-smart-note" className="dialog-note">{t("portable.smartNote")}</p>
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
          id="portable-dialog-smart-copy"
          type="button"
          disabled={busy}
          ref={(element) => {
            if (element) setTooltip(element, tips.portableSmartCopy);
          }}
          onClick={() => {
            void copyPortableSmart(false, "dialog");
          }}
        >
          {t("portable.smartCopy")}
        </button>
        <button
          id="portable-dialog-smart-restore"
          type="button"
          disabled={busy}
          ref={(element) => {
            if (element) setTooltip(element, tips.portableSmartRestore);
          }}
          onClick={() => {
            void previewPortableRestore("dialog");
          }}
        >
          {t("portable.smartRestore")}
        </button>
        <button
          id="portable-dialog-smart-confirm"
          type="button"
          hidden={!files.portableSmartConfirm}
          disabled={busy}
          ref={(element) => {
            if (element) setTooltip(element, tips.portableSmartConfirm);
          }}
          onClick={() => {
            void confirmPortableRestore("dialog");
          }}
        >
          {t("portable.smartConfirm")}
        </button>
        <button
          id="portable-dialog-smart-overwrite"
          type="button"
          hidden={!files.portableSmartOverwrite}
          disabled={busy}
          ref={(element) => {
            if (element) setTooltip(element, tips.portableSmartOverwrite);
          }}
          onClick={() => {
            void overwritePortableSmart("dialog");
          }}
        >
          {t("portable.smartOverwrite")}
        </button>
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
