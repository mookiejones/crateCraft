import type { Meta, StoryObj } from "@storybook/react-vite";
import { PlayerProvider } from "../../containers/PlayerContext";
import { playerValue } from "../../lib/storybook/fixtures";
import { PlayButton } from "../../components/PlayButton";

const meta = {
  title: "Components/PlayButton",
  component: PlayButton,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: { variant: "detail", trackId: 4, name: "Night" },
  decorators: [
    (Story) => (
      <PlayerProvider value={playerValue()}>
        <Story />
      </PlayerProvider>
    ),
  ],
} satisfies Meta<typeof PlayButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DetailPlay: Story = {};

export const DetailPause: Story = {
  decorators: [
    (Story) => (
      <PlayerProvider value={playerValue({ playing: true })}>
        <Story />
      </PlayerProvider>
    ),
  ],
};

export const Row: Story = {
  args: { variant: "row", trackId: 4, name: "Night" },
};

export const Bar: Story = {
  args: { variant: "bar", name: "Night" },
};
