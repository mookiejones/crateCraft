import type { Meta, StoryObj } from "@storybook/react-vite";
import { PlayerCuePads } from "../../components/PlayerCuePads";
import { PlayerProvider } from "../../containers/PlayerContext";
import type { CueMarker } from "../../lib/player/player";
import { playerValue } from "../../lib/storybook/fixtures";

const twoPads: CueMarker[] = [
  { index: 0, seconds: 1.5, color: "#CC0000", label: "Drop" },
  { index: 2, seconds: 8, color: "#FAC313", label: "Break" },
];

const meta = {
  title: "Components/PlayerCuePads",
  component: PlayerCuePads,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <PlayerProvider value={playerValue({ cues: twoPads, currentTime: 8 })}>
        <Story />
      </PlayerProvider>
    ),
  ],
} satisfies Meta<typeof PlayerCuePads>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PadThreeLit: Story = {};

export const Empty: Story = {
  decorators: [
    (Story) => (
      <PlayerProvider value={playerValue({ cues: [], currentTime: 0 })}>
        <Story />
      </PlayerProvider>
    ),
  ],
};
