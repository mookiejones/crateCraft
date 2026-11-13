import type { Meta, StoryObj } from "@storybook/react-vite";
import { PlayerProvider } from "../containers/PlayerContext";
import { TrackListProvider } from "../containers/TrackListContext";
import { playerValue, trackListValue } from "../lib/storybook/fixtures";
import { TrackDetailPane } from "./TrackDetail";

const meta = {
  title: "Components/TrackDetail",
  component: TrackDetailPane,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <PlayerProvider value={playerValue()}>
        <TrackListProvider value={trackListValue()}>
          <Story />
        </TrackListProvider>
      </PlayerProvider>
    ),
  ],
} satisfies Meta<typeof TrackDetailPane>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OpenTrack: Story = {};

export const Empty: Story = {
  decorators: [
    (Story) => (
      <PlayerProvider value={playerValue()}>
        <TrackListProvider value={trackListValue({ detail: { kind: "empty", message: "Select a track." } })}>
          <Story />
        </TrackListProvider>
      </PlayerProvider>
    ),
  ],
};

export const Reading: Story = {
  decorators: [
    (Story) => (
      <PlayerProvider value={playerValue()}>
        <TrackListProvider value={trackListValue({ detail: { kind: "reading" } })}>
          <Story />
        </TrackListProvider>
      </PlayerProvider>
    ),
  ],
};
