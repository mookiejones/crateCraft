import type { Meta, StoryObj } from "@storybook/react-vite";
import { PlayerProvider } from "../containers/PlayerContext";
import { TrackListProvider } from "../containers/TrackListContext";
import { dawnTrack, nightTrack, playerValue, trackListValue } from "../lib/storybook/fixtures";
import { TrackRow } from "./TrackRow";

const meta = {
  title: "Components/TrackRow",
  component: TrackRow,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: { track: nightTrack, selected: true, onFocusList: () => {} },
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
} satisfies Meta<typeof TrackRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Selected: Story = {};

export const Unselected: Story = {
  args: { track: dawnTrack, selected: false, onFocusList: () => {} },
};
