/**
 * Domain providers for Storybook islands. Stories inject fixtures.
 */

import type { ReactNode } from "react";
import { CrateProvider } from "../../containers/CrateContext";
import { FilesProvider } from "../../containers/FilesContext";
import { GigStateProvider } from "../../containers/GigContext";
import { HealthProvider } from "../../containers/HealthContext";
import { HistoryProvider } from "../../containers/HistoryContext";
import { PlayerProvider } from "../../containers/PlayerContext";
import { SettingsProvider } from "../../containers/SettingsContext";
import { SnapshotsProvider } from "../../containers/SnapshotsContext";
import { TrackListProvider } from "../../containers/TrackListContext";
import { WaveformClockProvider, WaveformProvider } from "../../containers/WaveformContext";
import { WizardProvider } from "../../containers/WizardContext";
import {
  crateValue,
  filesValue,
  gigValue,
  healthValue,
  historyValue,
  playerValue,
  settingsValue,
  snapshotsValue,
  storyClock,
  trackListValue,
  wizardValue,
} from "./fixtures";

/**
 * Wrap a story in every domain provider with fixture values.
 *
 * @param children Island under test.
 */
export function StoryProviders({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider value={settingsValue()}>
      <PlayerProvider value={playerValue()}>
        <WaveformProvider>
          <WaveformClockProvider clock={storyClock()}>
            <TrackListProvider value={trackListValue()}>
              <CrateProvider value={crateValue()}>
                <FilesProvider value={filesValue()}>
                  <HealthProvider value={healthValue()}>
                    <HistoryProvider value={historyValue()}>
                      <GigStateProvider value={gigValue()}>
                        <SnapshotsProvider value={snapshotsValue()}>
                          <WizardProvider value={wizardValue()}>{children}</WizardProvider>
                        </SnapshotsProvider>
                      </GigStateProvider>
                    </HistoryProvider>
                  </HealthProvider>
                </FilesProvider>
              </CrateProvider>
            </TrackListProvider>
          </WaveformClockProvider>
        </WaveformProvider>
      </PlayerProvider>
    </SettingsProvider>
  );
}
