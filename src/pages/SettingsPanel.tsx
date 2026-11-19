/**
 * Settings Main page painted by React.
 *
 * Shortcut cheat sheet, language, appearance, sharing, updates, and
 * About read `useSettings`. The Drawer footer still opens this page.
 * Tooltips use the same sentences as the static markup they replace.
 */

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { MuiThemeProof } from "../components/MuiThemeProof";
import { ShortcutTable } from "../components/ShortcutTable";
import { useSettings } from "../containers/SettingsContext";
import { LANGUAGES, LANGUAGE_NAMES, t } from "../lib/i18n";
import { COLORWAYS, type Colorway } from "../lib/ui/settings";
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

function selectValue(event: { target: EventTarget }): string {
  const target = event.target;
  return target instanceof HTMLSelectElement ? target.value : "";
}

/**
 * Settings: sharing, updates, theme, language, shortcuts, About.
 */
export function SettingsPanel() {
  const settings = useSettings();
  const preview = `/img/icons/placeholder-${settings.colorway}.svg`;

  return (
    <Stack data-settings-react="true" data-settings-page="true" spacing={2} sx={{ maxWidth: 720 }}>
      <Typography id="settings-title" variant="h5" component="h2">{t("settings.title")}</Typography>
      <FormControlLabel
        control={
          <Switch
            id="telemetry-toggle"
            slotProps={{ input: { ref: tooltipRef(tips.telemetry) } }}
            checked={settings.telemetryOn}
            disabled={settings.sharingBusy}
            onChange={(event) => {
              void settings.saveSharing(event.currentTarget.checked);
            }}
          />
        }
        label={t("settings.share")}
      />
      <Typography id="telemetry-note" className="dialog-note" component="p">{telemetryNote()}</Typography>
      <FormControlLabel
        control={
          <Switch
            id="update-toggle"
            slotProps={{ input: { ref: tooltipRef(tips.updateToggle) } }}
            checked={settings.updateEnabled}
            disabled={settings.updateBusy}
            onChange={(event) => {
              void settings.saveUpdateEnabled(event.currentTarget.checked);
            }}
          />
        }
        label={t("settings.updates")}
      />
      <FormControlLabel
        control={
          <Switch
            id="update-prereleases"
            slotProps={{ input: { ref: tooltipRef(tips.updatePrereleases) } }}
            checked={settings.updatePrereleases}
            disabled={settings.updatePrereleasesDisabled || settings.updateBusy}
            onChange={(event) => {
              void settings.saveUpdatePrereleases(event.currentTarget.checked);
            }}
          />
        }
        label={t("settings.updatesPrereleases")}
      />
      <Typography id="update-status" className="dialog-note" component="p" role="status" aria-live="polite">
        {settings.updateStatus}
      </Typography>
      <Stack className="colorway-row" direction="row" spacing={2} sx={{ alignItems: "center" }}>
        <FormControl className="settings-field" size="small" fullWidth>
          <InputLabel htmlFor="colorway-select" shrink>{t("settings.colorway")}</InputLabel>
          <Select
            native
            id="colorway-select"
            label={t("settings.colorway")}
            inputRef={tooltipRef(tips.colorway)}
            value={settings.colorway}
            onChange={(event) => {
              void settings.saveColorway(selectValue(event) as Colorway);
            }}
          >
            {COLORWAYS.map((id) => (
              <option key={id} value={id}>
                {t(COLORWAY_KEY[id])}
              </option>
            ))}
          </Select>
        </FormControl>
        <Box
          component="img"
          id="colorway-preview"
          className="colorway-preview"
          width={64}
          height={64}
          alt={t("settings.colorwayPreview")}
          src={preview}
        />
      </Stack>
      <MuiThemeProof />
      <FormControlLabel
        control={
          <Switch
            id="icon-follows-theme"
            slotProps={{ input: { ref: tooltipRef(tips.iconFollowsTheme) } }}
            checked={settings.iconFollowsTheme}
            onChange={(event) => {
              void settings.saveIconFollow(event.currentTarget.checked);
            }}
          />
        }
        label={t("settings.iconFollowsTheme")}
      />
      <FormControlLabel
        control={
          <Switch
            id="gig-lock"
            slotProps={{ input: { ref: tooltipRef(tips.gigLock) } }}
            checked={settings.gigLock}
            onChange={(event) => {
              void settings.saveGigLock(event.currentTarget.checked);
            }}
          />
        }
        label={t("settings.gigLock")}
      />
      <FormControlLabel
        control={
          <Switch
            id="protect-bpm"
            slotProps={{ input: { ref: tooltipRef(tips.protectBpm) } }}
            checked={settings.protectBpm}
            onChange={(event) => {
              void settings.saveProtected("bpm", event.currentTarget.checked);
            }}
          />
        }
        label={t("settings.protectBpm")}
      />
      <FormControlLabel
        control={
          <Switch
            id="protect-key"
            slotProps={{ input: { ref: tooltipRef(tips.protectKey) } }}
            checked={settings.protectKey}
            onChange={(event) => {
              void settings.saveProtected("key", event.currentTarget.checked);
            }}
          />
        }
        label={t("settings.protectKey")}
      />
      <FormControlLabel
        control={
          <Switch
            id="protect-cues"
            slotProps={{ input: { ref: tooltipRef(tips.protectCues) } }}
            checked={settings.protectCues}
            onChange={(event) => {
              void settings.saveProtected("cues", event.currentTarget.checked);
            }}
          />
        }
        label={t("settings.protectCues")}
      />
      <FormControl className="settings-field" size="small" fullWidth>
        <InputLabel htmlFor="min-copies" shrink>{t("settings.minCopies")}</InputLabel>
        <Select
          native
          id="min-copies"
          label={t("settings.minCopies")}
          inputRef={tooltipRef(tips.minCopies)}
          value={String(settings.minCopies)}
          onChange={(event) => {
            void settings.saveMinCopies(Number(selectValue(event)));
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((count) => (
            <option key={count} value={String(count)}>{count}</option>
          ))}
        </Select>
      </FormControl>
      <TextField
        id="untrusted-volumes"
        size="small"
        fullWidth
        label={t("settings.untrustedVolumes")}
        value={settings.untrustedVolumes}
        inputRef={tooltipRef(tips.untrustedVolumes)}
        onChange={(event) => settings.setUntrustedDraft(event.target.value)}
        onBlur={() => {
          void settings.saveUntrustedVolumes();
        }}
      />
      <Typography id="icon-status" className="dialog-status" component="p" role="status" aria-live="polite">
        {settings.iconStatus}
      </Typography>
      <FormControl className="settings-field" size="small" fullWidth>
        <InputLabel htmlFor="language-select" shrink>{t("settings.language")}</InputLabel>
        <Select
          native
          id="language-select"
          label={t("settings.language")}
          inputRef={tooltipRef(tips.language)}
          value={settings.language}
          onChange={(event) => {
            void settings.saveLanguage(selectValue(event));
          }}
        >
          <option value="">{t("settings.languageSystem")}</option>
          {LANGUAGES.map((code) => (
            <option key={code} value={code} lang={code}>
              {LANGUAGE_NAMES[code]}
            </option>
          ))}
        </Select>
      </FormControl>
      <Typography id="language-status" className="dialog-status" component="p" role="status" aria-live="polite">
        {settings.languageStatus}
      </Typography>
      <ShortcutTable />
      <Box className="about" component="section" aria-labelledby="about-title">
        <Typography id="about-title" variant="h6" component="h3">{t("settings.about")}</Typography>
        <Typography id="about-version" className="about-version" component="p">{settings.aboutVersion}</Typography>
        <Typography component="p">
          <a
            id="about-github"
            ref={tooltipRef(tips.helpGithub)}
            href="https://github.com/mookiejones/crateCraft"
          >
            {t("help.github")}
          </a>
        </Typography>
        <Stack className="dialog-actions" direction="row" spacing={1}>
          <Button
            id="copy-version"
            ref={tooltipRef(tips.copyVersion)}
            type="button"
            variant="outlined"
            onClick={() => {
              void settings.copyVersion();
            }}
          >
            {t("settings.copyVersion")}
          </Button>
        </Stack>
        <Typography id="version-copy-status" className="dialog-status" component="p" role="status" aria-live="polite">
          {settings.versionCopyStatus}
        </Typography>
      </Box>
      <Stack className="dialog-actions" direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
        <Button
          id="rerun-wizard"
          ref={tooltipRef(tips.rerunWizard)}
          className="wizard-quiet"
          type="button"
          variant="text"
          onClick={() => settings.rerunSetup()}
        >
          {t("settings.rerunSetup")}
        </Button>
        <Button
          id="open-logs"
          ref={tooltipRef(tips.openLogs)}
          type="button"
          variant="outlined"
          disabled={settings.logsBusy}
          onClick={() => {
            void settings.openLogs();
          }}
        >
          {t("settings.openLogs")}
        </Button>
        <Button
          id="copy-logs"
          ref={tooltipRef(tips.copyLogs)}
          type="button"
          variant="outlined"
          disabled={settings.logsBusy}
          onClick={() => {
            void settings.copyLogs();
          }}
        >
          {t("settings.copyLogs")}
        </Button>
        <Button
          id="settings-close"
          ref={tooltipRef(tips.settingsClose)}
          type="button"
          variant="contained"
          onClick={() => settings.close()}
        >
          {t("common.close")}
        </Button>
      </Stack>
      <Typography id="settings-status" className="dialog-status" component="p" role="status" aria-live="polite">
        {settings.settingsStatus}
      </Typography>
      <textarea
        id="log-fallback"
        ref={tooltipRef(tips.logFallback)}
        className="log-fallback"
        readOnly
        hidden={settings.logFallbackHidden}
        aria-label={t("settings.logText")}
        value={settings.logFallback}
      />
    </Stack>
  );
}
