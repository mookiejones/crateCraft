import type { Meta, StoryObj } from "@storybook/react-vite";
import { ThemeProvider } from "@mui/material/styles";
import { ShortcutTable } from "../../components/ShortcutTable";
import { SettingsProvider } from "../../containers/SettingsContext";
import { settingsValue } from "../../lib/storybook/fixtures";
import { createAppTheme } from "../../lib/ui/mui-theme";

function Host({ remapped = false }: { remapped?: boolean }) {
  const value = settingsValue(
    remapped ? { shortcuts: { "play-pause": [{ key: "q" }] } } : {},
  );
  return (
    <ThemeProvider theme={createAppTheme(value.colorway)}>
      <div data-colorway={value.colorway}>
        <SettingsProvider value={value}>
          <ShortcutTable />
        </SettingsProvider>
      </div>
    </ThemeProvider>
  );
}

const meta = {
  title: "Components/ShortcutTable",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  render: () => <Host />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Defaults: Story = {};

export const RemappedPlayPause: Story = {
  render: () => <Host remapped />,
};
