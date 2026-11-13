import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppShell } from "../../pages/AppShell";

function ShellSlots() {
  return (
    <div style={{ height: "100vh" }}>
      <div id="space-field">
        <select id="space" aria-label="Space">
          <option>Serato Library</option>
        </select>
      </div>
      <div id="player-bar">Night — Ada</div>
      <nav id="views">
        <button type="button">Music</button>
        <button type="button">Health</button>
      </nav>
      <div id="view-children">
        <button type="button">Crates</button>
      </div>
      <div id="rail-foot">
        <button type="button" id="open-help">Help</button>
        <button type="button" id="open-settings">Settings</button>
      </div>
      <div id="app-body">
        <p>Main</p>
      </div>
      <AppShell />
    </div>
  );
}

const meta = {
  title: "Pages/AppShell",
  component: AppShell,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <ShellSlots />,
};
