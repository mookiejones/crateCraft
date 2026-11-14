import type { Meta, StoryObj } from "@storybook/react-vite";
import { ThemeProvider } from "@mui/material/styles";
import { SettingsProvider } from "../../containers/SettingsContext";
import {
  settingsArgTypes,
  settingsStoryArgs,
  settingsValueFromArgs,
  type SettingsStoryArgs,
} from "../../lib/storybook/args";
import { createAppTheme } from "../../lib/ui/mui-theme";
import { SettingsPanel } from "../../pages/SettingsPanel";

function Host(args: SettingsStoryArgs) {
  return (
    <ThemeProvider theme={createAppTheme(args.colorway)}>
      <div data-colorway={args.colorway}>
        <SettingsProvider value={settingsValueFromArgs(args)}>
          <div id="settings-dialog">
            <SettingsPanel />
          </div>
        </SettingsProvider>
      </div>
    </ThemeProvider>
  );
}

const meta = {
  title: "Pages/SettingsPanel",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: settingsStoryArgs,
  argTypes: settingsArgTypes,
  render: (args) => <Host {...args} />,
} satisfies Meta<SettingsStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DarkClub: Story = {
  args: { colorway: "dark-club" },
};

export const SharingOn: Story = {
  args: { telemetryOn: true },
};
