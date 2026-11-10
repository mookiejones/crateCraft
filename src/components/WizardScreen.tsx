/**
 * First-run setup dialog painted from `useWizard`.
 *
 * The step machine stays in `wizard.ts`. Copy uses `t()`. Tooltips stay
 * on every control. Decorative art is the inlined SVG from index.html.
 */

import { useEffect, useRef, useState } from "react";
import { useWizard } from "../context/WizardContext";
import { getLocale, onLocaleChange, t, type MessageKey } from "../i18n";
import { setTooltip } from "../tooltip";
import { tips, wizardFolder, wizardPrimaryTip, type TipSpec } from "../tooltip-strings";
import {
  canGoBack,
  primaryAction,
  primaryEnabled,
  snapshotBlocked,
  stepAnnouncement,
  stepPosition,
  type PrimaryAction,
  type WizardModel,
} from "../wizard";

const LABELS: Record<Exclude<PrimaryAction, "none">, MessageKey> = {
  "get-started": "wizard.action.getStarted",
  looking: "wizard.action.looking",
  "use-library": "wizard.action.useLibrary",
  "check-again": "wizard.action.checkAgain",
  "take-snapshot": "wizard.action.takeSnapshot",
  "try-again": "wizard.action.tryAgain",
  continue: "wizard.action.continue",
  "open-library": "wizard.action.openLibrary",
};

const HEADINGS: Record<WizardModel["step"], MessageKey> = {
  welcome: "wizard.heading.welcome",
  library: "wizard.heading.library",
  snapshot: "wizard.heading.snapshot",
  consent: "wizard.heading.consent",
  updates: "wizard.heading.updates",
  done: "wizard.done",
};

const ART: Readonly<Partial<Record<WizardModel["step"], string>>> = {
  welcome:
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" aria-hidden="true" focusable="false"><rect x="20" y="70" width="120" height="70" rx="12" fill="var(--illus-surface, currentColor)" stroke="var(--illus-ink, currentColor)" stroke-width="4"/><circle cx="58" cy="62" r="34" fill="var(--illus-primary, currentColor)"/><circle cx="58" cy="62" r="8" fill="var(--illus-surface, currentColor)"/><circle cx="104" cy="66" r="30" fill="var(--illus-accent, var(--illus-primary, currentColor))"/><circle cx="104" cy="66" r="7" fill="var(--illus-surface, currentColor)"/><rect x="20" y="88" width="120" height="52" rx="12" fill="var(--illus-surface, currentColor)" stroke="var(--illus-ink, currentColor)" stroke-width="4"/><path d="M60 112 h40" stroke="var(--illus-ink, currentColor)" stroke-width="6" stroke-linecap="round"/></svg>',
  library:
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" aria-hidden="true" focusable="false"><path d="M20 50 h44 l10 12 h66 v76 h-120 Z" fill="var(--illus-surface, currentColor)" stroke="var(--illus-ink, currentColor)" stroke-width="4" stroke-linejoin="round"/><circle cx="76" cy="98" r="26" fill="var(--illus-primary, currentColor)"/><circle cx="76" cy="98" r="7" fill="var(--illus-surface, currentColor)"/><circle cx="112" cy="108" r="20" fill="none" stroke="var(--illus-ink, currentColor)" stroke-width="7"/><path d="M126 122 l18 18" stroke="var(--illus-ink, currentColor)" stroke-width="9" stroke-linecap="round"/></svg>',
  snapshot:
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" aria-hidden="true" focusable="false"><path d="M80 18 L136 40 v40 c0 34 -24 56 -56 66 c-32 -10 -56 -32 -56 -66 v-40 Z" fill="var(--illus-surface, currentColor)" stroke="var(--illus-ink, currentColor)" stroke-width="4" stroke-linejoin="round"/><circle cx="80" cy="78" r="30" fill="var(--illus-primary, currentColor)"/><circle cx="80" cy="78" r="8" fill="var(--illus-surface, currentColor)"/><path d="M62 118 l12 12 l26 -26" fill="none" stroke="var(--illus-accent, var(--illus-primary, currentColor))" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  consent:
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" aria-hidden="true" focusable="false"><rect x="34" y="20" width="92" height="120" rx="10" fill="var(--illus-surface, currentColor)" stroke="var(--illus-ink, currentColor)" stroke-width="4"/><path d="M50 46 h60 M50 64 h60 M50 82 h40" stroke="var(--illus-ink, currentColor)" stroke-width="5" stroke-linecap="round" opacity=".6"/><rect x="50" y="100" width="22" height="22" rx="5" fill="var(--illus-primary, currentColor)"/><path d="M55 111 l5 5 l9 -10" fill="none" stroke="var(--illus-surface, currentColor)" stroke-width="4" stroke-linecap="round"/><path d="M80 112 h30" stroke="var(--illus-ink, currentColor)" stroke-width="5" stroke-linecap="round"/></svg>',
  done:
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" aria-hidden="true" focusable="false"><circle cx="80" cy="80" r="60" fill="var(--illus-primary, currentColor)"/><circle cx="80" cy="80" r="42" fill="none" stroke="var(--illus-surface, currentColor)" stroke-width="3" opacity=".5"/><path d="M52 82 l18 18 l38 -40" fill="none" stroke="var(--illus-surface, currentColor)" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><circle cx="138" cy="26" r="6" fill="var(--illus-accent, var(--illus-primary, currentColor))"/><circle cx="22" cy="40" r="5" fill="var(--illus-accent, var(--illus-primary, currentColor))"/><circle cx="140" cy="132" r="4" fill="var(--illus-ink, currentColor)"/></svg>',
};

function tooltipRef(spec: TipSpec) {
  return (element: HTMLElement | null) => {
    if (element) setTooltip(element, spec);
  };
}

function useLocaleTick(): void {
  const [, setLocale] = useState(getLocale);
  useEffect(() => onLocaleChange(setLocale), []);
}

function bodyText(model: WizardModel, summary: string): string {
  switch (model.step) {
    case "welcome":
      return t("wizard.welcomeBody");
    case "library":
      if (model.context.library === "pending") return t("wizard.looking");
      return summary || t("wizard.looking");
    case "snapshot":
      return t("wizard.snapshotBody");
    case "consent":
      return t("consent.body");
    case "updates":
      return t("wizard.updatesBody");
    case "done":
      return "";
    default:
      return "";
  }
}

function statusFor(
  model: WizardModel,
  statusNote: string,
): { text: string; kind: "" | "blocked" | "saved" } {
  if (snapshotBlocked(model)) return { text: t("wizard.blocked"), kind: "blocked" };
  if (model.step === "snapshot" && model.context.snapshot === "saved") {
    return { text: t("wizard.copySaved"), kind: "saved" };
  }
  if (model.step === "snapshot" && model.context.snapshot === "saving") {
    return { text: t("wizard.savingLibraryCopy"), kind: "" };
  }
  if (statusNote) return { text: statusNote, kind: "" };
  return { text: "", kind: "" };
}

/**
 * Setup dialog contents. Mount inside `WizardProvider`.
 */
export function WizardScreen() {
  useLocaleTick();
  const wizard = useWizard();
  const {
    model,
    busy,
    folderOpen,
    folderName,
    folderParent,
    folders,
    summary,
    nextHint,
    statusNote,
    focusToken,
  } = wizard;
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (focusToken === 0) return;
    setAnnouncement(stepAnnouncement(model));
    titleRef.current?.focus();
  }, [focusToken]);

  const position = stepPosition(model);
  const body = bodyText(model, summary);
  const hintText = nextHint;
  const showHint = model.step === "library" && model.context.library !== "found" && hintText.length > 0;
  const status = statusFor(model, statusNote);
  const action = primaryAction(model);
  const saving = model.step === "snapshot" && model.context.snapshot === "saving";
  const saved = model.step === "snapshot" && model.context.snapshot === "saved";
  const primaryLabel = saving
    ? t("wizard.savingCopy")
    : action === "none" ? "" : t(LABELS[action]);
  const segments = Array.from({ length: position.count }, (_, offset) => {
    const index = offset + 1;
    const state = index < position.index ? "done" : index === position.index ? "current" : "upcoming";
    return <span key={index} className="wizard-segment" data-state={state} />;
  });

  return (
    <>
      <p id="wizard-step" className="wizard-step">
        <span id="wizard-step-label">{t("wizard.stepOf", { index: position.index, count: position.count })}</span>
        <span id="wizard-segments" className="wizard-segments" aria-hidden="true">{segments}</span>
      </p>
      <p id="wizard-announce" className="visually-hidden" aria-live="polite">{announcement}</p>
      {(["welcome", "library", "snapshot", "consent", "done"] as const).map((slot) => {
        const svg = ART[slot];
        const current = slot === model.step && svg !== undefined;
        if (svg === undefined) {
          return <div key={slot} className="wizard-art" data-art-slot={slot} hidden />;
        }
        return (
          <div
            key={slot}
            className="wizard-art"
            data-art-slot={slot}
            hidden={!current}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        );
      })}
      <h2 id="wizard-title" tabIndex={-1} ref={titleRef}>{t(HEADINGS[model.step])}</h2>
      <p id="wizard-body" hidden={body.length === 0}>{body}</p>
      <p id="wizard-next" className="dialog-note" hidden={!showHint}>{showHint ? hintText : ""}</p>
      <p
        id="wizard-status"
        className={status.kind ? `wizard-status is-${status.kind}` : "wizard-status"}
        role="status"
        aria-live="polite"
        hidden={status.text.length === 0}
      >
        {status.text}
      </p>
      {saving ? (
        <progress id="wizard-progress" max={1} aria-label={t("wizard.progressLabel")} />
      ) : (
        <progress
          id="wizard-progress"
          max={1}
          value={saved ? 1 : 0}
          hidden={!saved}
          aria-label={t("wizard.progressLabel")}
        />
      )}
      <div id="wizard-folders" hidden={!(folderOpen && model.step === "library")}>
        <p id="wizard-folder-name" className="wizard-folder-name">{folderName}</p>
        <div
          id="wizard-folder-list"
          className="wizard-folders"
          role="group"
          aria-label={t("wizard.folders")}
        >
          {folders.length === 0 ? (
            <p className="wizard-folder-empty">{t("wizard.noSubfolders")}</p>
          ) : folders.map((folder) => (
            <button
              key={folder.path}
              type="button"
              className="wizard-folder"
              ref={tooltipRef(wizardFolder(folder.name))}
              onClick={() => wizard.onBrowse(folder.path)}
            >
              {folder.name}
            </button>
          ))}
        </div>
        <div className="wizard-folder-actions">
          <button
            id="wizard-folder-up"
            className="wizard-quiet"
            type="button"
            ref={tooltipRef(tips.wizardFolderUp)}
            disabled={folderParent === null}
            onClick={() => wizard.onFolderUp()}
          >
            {t("common.up")}
          </button>
          <button
            id="wizard-folder-use"
            type="button"
            ref={tooltipRef(tips.wizardFolderUse)}
            disabled={busy}
            onClick={() => wizard.onFolderUse()}
          >
            {t("wizard.useFolder")}
          </button>
          <button
            id="wizard-folder-close"
            className="wizard-quiet"
            type="button"
            ref={tooltipRef(tips.wizardFolderClose)}
            onClick={() => wizard.onFolderClose()}
          >
            {t("wizard.closeFolders")}
          </button>
        </div>
      </div>
      <div id="wizard-consent" className="wizard-choices" hidden={model.step !== "consent"}>
        <button
          id="wizard-no"
          className="wizard-choice"
          type="button"
          ref={tooltipRef(tips.wizardNo)}
          disabled={busy}
          onClick={() => wizard.onConsent(false)}
        >
          {t("wizard.no")}
        </button>
        <button
          id="wizard-yes"
          className="wizard-choice"
          type="button"
          ref={tooltipRef(tips.wizardYes)}
          disabled={busy}
          onClick={() => wizard.onConsent(true)}
        >
          {t("wizard.yes")}
        </button>
      </div>
      <div id="wizard-updates" className="wizard-choices" hidden={model.step !== "updates"}>
        <button
          id="wizard-updates-no"
          className="wizard-choice"
          type="button"
          ref={tooltipRef(tips.wizardUpdatesNo)}
          disabled={busy}
          onClick={() => wizard.onUpdates(false)}
        >
          {t("wizard.updatesNo")}
        </button>
        <button
          id="wizard-updates-yes"
          className="wizard-choice"
          type="button"
          ref={tooltipRef(tips.wizardUpdatesYes)}
          disabled={busy}
          onClick={() => wizard.onUpdates(true)}
        >
          {t("wizard.updatesYes")}
        </button>
      </div>
      <div className="wizard-actions">
        <div className="wizard-actions-start">
          <button
            id="wizard-back"
            className="wizard-quiet"
            type="button"
            ref={tooltipRef(tips.wizardBack)}
            hidden={!canGoBack(model)}
            disabled={busy}
            onClick={() => wizard.onBack()}
          >
            {t("common.back")}
          </button>
          <button
            id="wizard-cancel"
            className="wizard-quiet"
            type="button"
            ref={tooltipRef(tips.wizardCancel)}
            onClick={() => wizard.onCancel()}
          >
            {t("common.cancel")}
          </button>
          <button
            id="wizard-secondary"
            className="wizard-quiet"
            type="button"
            ref={tooltipRef(tips.wizardSecondary)}
            hidden={model.step !== "library"}
            disabled={busy}
            onClick={() => wizard.onChooseFolder()}
          >
            {t("wizard.chooseFolder")}
          </button>
        </div>
        <button
          id="wizard-primary"
          type="button"
          ref={tooltipRef(wizardPrimaryTip(action, saving))}
          hidden={action === "none"}
          disabled={busy || !primaryEnabled(model)}
          onClick={() => wizard.onPrimary()}
        >
          {primaryLabel}
        </button>
      </div>
    </>
  );
}
