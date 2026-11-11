import type { Meta, StoryObj } from "@storybook/react-vite";
import { PlayerProvider } from "./PlayerContext";
import { playerValue } from "../lib/storybook/fixtures";
import { PlayerBar } from "../components/PlayerBar";

const meta = {
  title: "Containers/Player",
  component: PlayerBar,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof PlayerBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Paused: Story = {
  render: () => (
    <PlayerProvider value={playerValue()}>
      <PlayerBar />
    </PlayerProvider>
  ),
};

export const Playing: Story = {
  render: () => (
    <PlayerProvider value={playerValue({ playing: true })}>
      <PlayerBar />
    </PlayerProvider>
  ),
};
