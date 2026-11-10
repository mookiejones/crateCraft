/**
 * Settings dialog painted by React.
 *
 * Shortcut cheat sheet, language, appearance, sharing, updates, and
 * About read `useSettings`. Tooltips use the same sentences as the
 * static markup they replace.
 */

import { useSettings } from "../containers/SettingsContext";
import { LANGUAGES, LANGUAGE_NAMES, t } from "../lib/i18n";
import { COLORWAYS, type Colorway } from "../lib/ui/settings";
import { cheatSheetModel, chordLabel } from "../lib/ui/shortcuts";
import { state } from "../lib/state";
import { setTooltip } from "../lib/ui/tooltip";
import { tips, type TipSpec } from "../lib/ui/tooltip-strings";

const COLORWAY_KEY = {
  "serato-like": "settings.colorway.seratoLike",
  "dark-club": "settings.colorway.darkClub",
  light: "settings.colorway.light",
  classic: "settings.colorway.classic",
} as const;

function tooltipRef(spec: TipSpec) {
  return (element: HTMLElement | null) => {
    if (element) setTooltip(element, spec);
  };
}

function telemetryNote(): string {
  if (!state.telemetryConfigured) return t("sharing.noKeys");
  if (state.telemetryConsent === true) return t("sharing.canSend");
  return t("sharing.nothingSent");
}

/**
 * Cheat-sheet tables from the shortcut list.
 */
function CheatSheet() {
  const groups = cheatSheetModel();
  return (
    <section id="shortcuts-section" className="shortcuts-section" aria-labelledby="shortcuts-title">
      <h3 id="shortcuts-title" tabIndex={-1} ref={tooltipRef(tips.shortcuts)}>
        {t("shortcuts.title")}
      </h3>
      <p id="shortcuts-intro">{t("shortcuts.intro")}</p>
      <div id="shortcuts-body">
        {groups.map((group) => (
          <div key={group.group}>
            <h3>{t(group.headingKey)}</h3>
            {group.playNote ? <p className="dialog-note">{t("shortcuts.playNote")}</p> : null}
            <table className="shortcut-table">
              <thead>
                <tr>
                  <th scope="col">{t("shortcuts.action")}</th>
                  <th scope="col">{t("shortcuts.key")}</th>
                </tr>
              </thead>
              <tbody>
                {group.rows.map((row) => (
                  <tr key={row.id}>
                    <th scope="row">{t(row.actionKey)}</th>
                    <td>
                      {row.chords.map((chord, index) => (
                        <span key={`${row.id}-${index}`}>
                          {index > 0 ? " or " : null}
                          <kbd>{chordLabel(chord)}</kbd>
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Settings: sharing, updates, theme, language, shortcuts, About.
 */
export function SettingsPanel() {
  const settings = useSettings();
  const preview = `/img/icons/placeholder-${settings.colorway}.svg`;

  return (
    <div data-settings-react="true">
      <h2 id="settings-title">{t("settings.title")}</h2>
      <label className="check">
        <input
          id="telemetry-toggle"
          ref={tooltipRef(tips.telemetry)}
          type="checkbox"
          checked={settings.telemetryOn}
          disabled={settings.sharingBusy}
          onChange={(event) => {
            void settings.saveSharing(event.currentTarget.checked);
          }}
        />
        <span>{t("settings.share")}</span>
      </label>
      <p id="telemetry-note" className="dialog-note">{telemetryNote()}</p>
      <label className="check">
        <input
          id="update-toggle"
          ref={tooltipRef(tips.updateToggle)}
          type="checkbox"
          checked={settings.updateEnabled}
          disabled={settings.updateBusy}
          onChange={(event) => {
            void settings.saveUpdateEnabled(event.currentTarget.checked);
          }}
        />
        <span>{t("settings.updates")}</span>
      </label>
      <label className="check">
        <input
          id="update-prereleases"
          ref={tooltipRef(tips.updatePrereleases)}
          type="checkbox"
          checked={settings.updatePrereleases}
          disabled={settings.updatePrereleasesDisabled || settings.updateBusy}
          onChange={(event) => {
            void settings.saveUpdatePrereleases(event.currentTarget.checked);
          }}
        />
        <span>{t("settings.updatesPrereleases")}</span>
      </label>
      <p id="update-status" className="dialog-note" role="status" aria-live="polite">
        {settings.updateStatus}
      </p>
      <div className="colorway-row">
        <label className="settings-field">
          <span>{t("settings.colorway")}</span>
          <select
            id="colorway-select"
            ref={tooltipRef(tips.colorway)}
            value={settings.colorway}
            onChange={(event) => {
              void settings.saveColorway(event.currentTarget.value as Colorway);
            }}
          >
            {COLORWAYS.map((id) => (
              <option key={id} value={id}>
                {t(COLORWAY_KEY[id])}
              </option>
            ))}
          </select>
        </label>
        <img
          id="colorway-preview"
          className="colorway-preview"
          width={64}
          height={64}
          alt={t("settings.colorwayPreview")}
          src={preview}
        />
      </div>
      <label className="check">
        <input
          id="icon-follows-theme"
          ref={tooltipRef(tips.iconFollowsTheme)}
          type="checkbox"
          checked={settings.iconFollowsTheme}
          onChange={(event) => {
            void settings.saveIconFollow(event.currentTarget.checked);
          }}
        />
        <span>{t("settings.iconFollowsTheme")}</span>
      </label>
      <p id="icon-status" className="dialog-status" role="status" aria-live="polite">
        {settings.iconStatus}
      </p>
      <label className="settings-field">
        <span>{t("settings.language")}</span>
        <select
          id="language-select"
          ref={tooltipRef(tips.language)}
          value={settings.language}
          onChange={(event) => {
            void settings.saveLanguage(event.currentTarget.value);
          }}
        >
          <option value="">{t("settings.languageSystem")}</option>
          {LANGUAGES.map((code) => (
            <option key={code} value={code} lang={code}>
              {LANGUAGE_NAMES[code]}
            </option>
          ))}
        </select>
      </label>
      <p id="language-status" className="dialog-status" role="status" aria-live="polite">
        {settings.languageStatus}
      </p>
      <CheatSheet />
      <section className="about" aria-labelledby="about-title">
        <h3 id="about-title">{t("settings.about")}</h3>
        <p id="about-version" className="about-version">{settings.aboutVersion}</p>
        <p>
          <a
            id="about-github"
            ref={tooltipRef(tips.helpGithub)}
            href="https://github.com/mookiejones/crateCraft"
          >
            {t("help.github")}
          </a>
        </p>
        <div className="dialog-actions">
          <button
            id="copy-version"
            ref={tooltipRef(tips.copyVersion)}
            type="button"
            onClick={() => {
              void settings.copyVersion();
            }}
          >
            {t("settings.copyVersion")}
          </button>
        </div>
        <p id="version-copy-status" className="dialog-status" role="status" aria-live="polite">
          {settings.versionCopyStatus}
        </p>
      </section>
      <div className="dialog-actions">
        <button
          id="rerun-wizard"
          ref={tooltipRef(tips.rerunWizard)}
          className="wizard-quiet"
          type="button"
          onClick={() => settings.rerunSetup()}
        >
          {t("settings.rerunSetup")}
        </button>
        <button
          id="open-logs"
          ref={tooltipRef(tips.openLogs)}
          type="button"
          disabled={settings.logsBusy}
          onClick={() => {
            void settings.openLogs();
          }}
        >
          {t("settings.openLogs")}
        </button>
        <button
          id="copy-logs"
          ref={tooltipRef(tips.copyLogs)}
          type="button"
          disabled={settings.logsBusy}
          onClick={() => {
            void settings.copyLogs();
          }}
        >
          {t("settings.copyLogs")}
        </button>
        <button
          id="settings-close"
          ref={tooltipRef(tips.settingsClose)}
          type="button"
          onClick={() => settings.close()}
        >
          {t("common.close")}
        </button>
      </div>
      <p id="settings-status" className="dialog-status" role="status" aria-live="polite">
        {settings.settingsStatus}
      </p>
      <textarea
        id="log-fallback"
        ref={tooltipRef(tips.logFallback)}
        className="log-fallback"
        readOnly
        hidden={settings.logFallbackHidden}
        aria-label={t("settings.logText")}
        value={settings.logFallback}
      />
    </div>
  );
}
