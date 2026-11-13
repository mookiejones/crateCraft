import type { Meta, StoryObj } from "@storybook/react-vite";
import { PlayerProvider } from "../../containers/PlayerContext";
import { TrackListProvider } from "../../containers/TrackListContext";
import { playerValue, trackListValue } from "../../lib/storybook/fixtures";
import { TrackListWindow } from "../../components/TrackListWindow";

const meta = {
  title: "Components/TrackListWindow",
  component: TrackListWindow,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: { pane: "a", onFocusList: () => {} },
  decorators: [
    (Story) => (
      <PlayerProvider value={playerValue()}>
        <TrackListProvider value={trackListValue()}>
          <div className="list">
            <Story />
          </div>
        </TrackListProvider>
      </PlayerProvider>
    ),
  ],
} satisfies Meta<typeof TrackListWindow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoRows: Story = {};

export const Empty: Story = {
  decorators: [
    (Story) => (
      <PlayerProvider value={playerValue()}>
        <TrackListProvider value={trackListValue({ view: [], selectedId: null })}>
          <div className="list">
            <Story />
          </div>
        </TrackListProvider>
      </PlayerProvider>
    ),
  ],
};
