import type { Meta, StoryObj } from "@storybook/react-vite";
import { SettingsProvider } from "../../containers/SettingsContext";
import { settingsValue } from "../../lib/storybook/fixtures";
import { SettingsPanel } from "../../pages/SettingsPanel";

const meta = {
  title: "Pages/SettingsPanel",
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

export const DarkClub: Story = {
  render: () => (
    <SettingsProvider value={settingsValue({ colorway: "dark-club", aboutVersion: "v1.4.2" })}>
      <div id="settings-dialog">
        <SettingsPanel />
      </div>
    </SettingsProvider>
  ),
};
