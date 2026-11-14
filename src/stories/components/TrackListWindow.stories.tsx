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

type WindowStoryArgs = TrackListStoryArgs & { pane: "a" | "b" };

function Host(args: WindowStoryArgs) {
  return (
    <PlayerProvider value={playerValueFromArgs(playerStoryArgs)}>
      <TrackListProvider value={trackListValueFromArgs(args)}>
        <div className="list">
          <TrackListWindow pane={args.pane} onFocusList={() => {}} />
        </div>
      </TrackListProvider>
    </PlayerProvider>
  );
}

const meta = {
  title: "Components/TrackListWindow",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: { ...trackListStoryArgs, pane: "a" },
  argTypes: {
    ...trackListArgTypes,
    pane: {
      control: "select" as const,
      options: ["a", "b"],
      description: "Which crate pane the grid belongs to.",
    },
  },
  render: (args) => <Host {...args} />,
} satisfies Meta<WindowStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoRows: Story = {};

export const Empty: Story = {
  args: { empty: true },
};
