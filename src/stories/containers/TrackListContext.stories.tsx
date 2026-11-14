import type { Meta, StoryObj } from "@storybook/react-vite";
import { TrackListWindow } from "../../components/TrackListWindow";
import { PlayerProvider } from "../../containers/PlayerContext";
import { TrackListProvider } from "../../containers/TrackListContext";
import {
  playerStoryArgs,
  playerValueFromArgs,
  trackListArgTypes,
  trackListStoryArgs,
  trackListValueFromArgs,
  type TrackListStoryArgs,
} from "../../lib/storybook/args";

function Host(args: TrackListStoryArgs) {
  return (
    <PlayerProvider value={playerValueFromArgs(playerStoryArgs)}>
      <TrackListProvider value={trackListValueFromArgs(args)}>
        <div className="list">
          <TrackListWindow pane="a" onFocusList={() => {}} />
        </div>
      </TrackListProvider>
    </PlayerProvider>
  );
}

const meta = {
  title: "Containers/TrackList",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: trackListStoryArgs,
  argTypes: trackListArgTypes,
  render: (args) => <Host {...args} />,
} satisfies Meta<TrackListStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rows: Story = {};

export const Empty: Story = {
  args: { empty: true },
};
