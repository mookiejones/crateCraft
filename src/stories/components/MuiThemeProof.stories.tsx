import type { Meta, StoryObj } from "@storybook/react-vite";
import { SettingsProvider } from "../../containers/SettingsContext";
import { settingsValue } from "../../lib/storybook/fixtures";
import { MuiThemeProof } from "../../components/MuiThemeProof";

const meta = {
  title: "Components/MuiThemeProof",
  component: MuiThemeProof,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <SettingsProvider value={settingsValue()}>
        <Story />
      </SettingsProvider>
    ),
  ],
} satisfies Meta<typeof MuiThemeProof>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HiddenProof: Story = {};
