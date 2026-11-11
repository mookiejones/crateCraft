import type { Meta, StoryObj } from "@storybook/react-vite";
import { PlayerProvider } from "../containers/PlayerContext";
import { playerValue } from "../lib/storybook/fixtures";
import { PlayerBar } from "./PlayerBar";

const meta = {
  title: "Components/PlayerBar",
  component: PlayerBar,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <PlayerProvider value={playerValue()}>
        <div className="player-bar-host">
          <Story />
        </div>
      </PlayerProvider>
    ),
  ],
} satisfies Meta<typeof PlayerBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Paused: Story = {};

export const Playing: Story = {
  decorators: [
    (Story) => (
      <PlayerProvider value={playerValue({ playing: true, currentTime: 45 })}>
        <div className="player-bar-host">
          <Story />
        </div>
      </PlayerProvider>
    ),
  ],
};

export const Empty: Story = {
  decorators: [
    (Story) => (
      <PlayerProvider
        value={playerValue({
          trackId: null,
          title: "",
          artist: "",
          canTogglePlay: false,
          canSkipPrevious: false,
          canSkipNext: false,
          cues: [],
          duration: 0,
          currentTime: 0,
        })}
      >
        <div className="player-bar-host">
          <Story />
        </div>
      </PlayerProvider>
    ),
  ],
};
