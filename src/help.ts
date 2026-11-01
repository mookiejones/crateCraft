/**
 * Help menu. Report a bug or request a feature on GitHub.
 *
 * The app does not post the issue. GET /api/help shows the diagnostics
 * and a redacted log. POST /api/help builds the link and, when it is
 * short enough, opens it in the system browser. A long report is copied
 * instead. Importing this module does not fetch.
 */

import { readJSONOr } from "./api";
import { el } from "./dom";
import { serverMessage, t } from "./i18n";

type ReportKind = "bug" | "feature";

interface HelpPreview {
  diagnostics?: string;
  log?: string;
  log_truncated?: boolean;
  error?: string;
}

interface HelpLink {
  mode?: string;
  url?: string;
  text?: string;
  opened?: boolean;
  error?: string;
}

let kind: ReportKind = "bug";

/**
 * Attach Help, the report form, and Copy log.
 *
 * Called once at startup.
 *
 * @returns {void}
 */
export function wireHelp(): void {
  el("open-help").addEventListener("click", () => {
    el("help-dialog").showModal();
  });
  el("help-close").addEventListener("click", () => {
    el("help-dialog").close();
  });
  el("help-bug").addEventListener("click", () => {
    void openReport("bug");
  });
  el("help-feature").addEventListener("click", () => {
    void openReport("feature");
  });
  el("help-report-close").addEventListener("click", () => {
    el("help-report-dialog").close();
  });
  el("help-open-github").addEventListener("click", () => {
    void submitReport();
  });
  el("help-copy-log").addEventListener("click", () => {
    void copyLog();
  });
  document.addEventListener("serato-locale", () => {
    if (el("help-report-dialog").open) paintReport();
  });
}

/**
 * Open the report dialog and load the diagnostics.
 *
 * @param next Bug or feature.
 * @returns {Promise<void>}
 */
export async function openReport(next: ReportKind): Promise<void> {
  kind = next;
  el("help-happened").value = "";
  el("help-expected").value = "";
  el("help-names").checked = false;
  el("help-log-fallback").hidden = true;
  el("help-report-status").textContent = "";
  el("help-diagnostics").textContent = t("help.loading");
  paintReport();
  el("help-dialog").close();
  el("help-report-dialog").showModal();
  try {
    const response = await fetch("/api/help");
    const payload = await readJSONOr<HelpPreview>(response, {});
    if (!response.ok) throw new Error(serverMessage(payload, t("help.loadFailed")));
    el("help-diagnostics").textContent = payload.diagnostics || t("help.loadFailed");
  } catch {
    el("help-diagnostics").textContent = t("help.loadFailed");
  }
}

function paintReport(): void {
  const feature = kind === "feature";
  el("help-report-title").textContent = t(feature ? "help.featureTitle" : "help.bugTitle");
  el("help-happened-name").textContent = t(feature ? "help.change" : "help.happened");
  el("help-expected-label").hidden = feature;
}

async function submitReport(): Promise<void> {
  const button = el("help-open-github");
  button.disabled = true;
  el("help-report-status").textContent = t("help.opening");
  try {
    const response = await fetch("/api/help", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind,
        happened: el("help-happened").value,
        expected: el("help-expected").value,
        change: kind === "feature" ? el("help-happened").value : "",
        include_names: el("help-names").checked,
        open: true,
      }),
    });
    const payload = await readJSONOr<HelpLink>(response, {});
    if (!response.ok) throw new Error(serverMessage(payload, t("help.loadFailed")));
    if (payload.opened === true) {
      el("help-report-status").textContent = t("help.opened");
      return;
    }
    const copied = await copyText(payload.text || "");
    if (!copied) {
      el("help-log-fallback").hidden = false;
      el("help-log-fallback").value = payload.text || "";
      el("help-report-status").textContent = t("help.copyFailed");
      return;
    }
    const linked = (payload.url || "").includes("diagnostics=");
    el("help-report-status").textContent = linked ? t("help.copied") : t("help.tooLong");
  } catch {
    el("help-report-status").textContent = t("help.loadFailed");
  } finally {
    button.disabled = false;
  }
}

async function copyLog(): Promise<void> {
  const names = el("help-names").checked ? "1" : "0";
  el("help-report-status").textContent = t("logs.copying");
  try {
    const response = await fetch(`/api/help?include_names=${names}`);
    const payload = await readJSONOr<HelpPreview>(response, {});
    if (!response.ok) throw new Error(serverMessage(payload, t("help.copyFailed")));
    const text = payload.log || "";
    if (!text) {
      el("help-report-status").textContent = t("help.logEmpty");
      return;
    }
    const copied = await copyText(text);
    if (copied) {
      el("help-log-fallback").hidden = true;
      el("help-report-status").textContent = payload.log_truncated ? t("logs.copiedTruncated") : t("help.logCopied");
      return;
    }
    el("help-log-fallback").hidden = false;
    el("help-log-fallback").value = text;
    el("help-log-fallback").focus();
    el("help-log-fallback").select();
    el("help-report-status").textContent = t("logs.copyManual");
  } catch {
    el("help-report-status").textContent = t("help.copyFailed");
  }
}

async function copyText(text: string): Promise<boolean> {
  if (!text || !navigator.clipboard || !window.isSecureContext) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
