import type { Meta, StoryObj } from "@storybook/react-vite";
import { PlayerProvider } from "./PlayerContext";
import { TrackListProvider } from "./TrackListContext";
import { playerValue, trackListValue } from "../lib/storybook/fixtures";
import { TrackListWindow } from "../components/TrackListWindow";

const meta = {
  title: "Containers/TrackList",
  component: TrackListWindow,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: { pane: "a", onFocusList: () => {} },
} satisfies Meta<typeof TrackListWindow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rows: Story = {
  render: () => (
    <PlayerProvider value={playerValue()}>
      <TrackListProvider value={trackListValue()}>
        <div className="list">
          <TrackListWindow pane="a" onFocusList={() => {}} />
        </div>
      </TrackListProvider>
    </PlayerProvider>
  ),
};
