import type { Meta, StoryObj } from "@storybook/react-vite";
import { PlayerBar } from "../../components/PlayerBar";
import { PlayerProvider } from "../../containers/PlayerContext";
import {
  playerArgTypes,
  playerStoryArgs,
  playerValueFromArgs,
  type PlayerStoryArgs,
} from "../../lib/storybook/args";

function Host(args: PlayerStoryArgs) {
  return (
    <PlayerProvider value={playerValueFromArgs(args)}>
      <PlayerBar />
    </PlayerProvider>
  );
}

const meta = {
  title: "Containers/Player",
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: playerStoryArgs,
  argTypes: playerArgTypes,
  render: (args) => <Host {...args} />,
} satisfies Meta<PlayerStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Paused: Story = {};

export const Playing: Story = {
  args: { playing: true },
};

export const Empty: Story = {
  args: { empty: true },
};
