import type { Meta, StoryObj } from "@storybook/react-vite";
import { CueEditor } from "../../components/CueEditor";
import { PlayerProvider } from "../../containers/PlayerContext";
import { TrackListProvider } from "../../containers/TrackListContext";
import { nightTrack, playerValue, storyTrack, trackListValue } from "../../lib/storybook/fixtures";

const meta = {
  title: "Components/CueEditor",
  component: CueEditor,
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
} satisfies Meta<typeof CueEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithCues: Story = {
  args: { track: nightTrack, writable: false },
};

export const Empty: Story = {
  args: {
    track: storyTrack(4, "Night", {
      cues: [],
      loops: [],
      flips: [],
      markers_found: false,
      beatgrid: [],
    }),
    writable: false,
  },
};
