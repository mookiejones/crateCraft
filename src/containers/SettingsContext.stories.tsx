import type { Meta, StoryObj } from "@storybook/react-vite";
import { SettingsProvider } from "./SettingsContext";
import { settingsValue } from "../lib/storybook/fixtures";
import { SettingsPanel } from "../pages/SettingsPanel";

const meta = {
  title: "Containers/Settings",
  component: SettingsPanel,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof SettingsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <SettingsProvider value={settingsValue()}>
      <div id="settings-dialog">
        <SettingsPanel />
      </div>
    </SettingsProvider>
  ),
};

export const SharingOn: Story = {
  render: () => (
    <SettingsProvider value={settingsValue({ telemetryOn: true, telemetryConfigured: true })}>
      <div id="settings-dialog">
        <SettingsPanel />
      </div>
    </SettingsProvider>
  ),
};
