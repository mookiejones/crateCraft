import type { Meta, StoryObj } from "@storybook/react-vite";
import { PlayerProvider } from "../../containers/PlayerContext";
import { TrackListProvider } from "../../containers/TrackListContext";
import { nightTrack, playerValue, trackListValue } from "../../lib/storybook/fixtures";
import { TrackDetailPane } from "../../components/TrackDetail";

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

export const Sections: Story = {
  decorators: [
    (Story) => (
      <PlayerProvider value={playerValue()}>
        <TrackListProvider
          value={trackListValue({
            detail: {
              kind: "track",
              track: {
                ...nightTrack,
                color: 0xcc0000,
                crate_ids: [2],
                copies: [{ id: 9, file: "night-copy.mp3" }],
                groups: [{ name: "Genre", fields: [{ label: "Genre", display: "House", column: "genre" }] }],
                loops: [{ index: 0, start_ms: 1000, end_ms: 2000, name: "Loop" }],
              },
            },
          })}
        >
          <div className="detail" style={{ height: 480, overflow: "auto" }}>
            <Story />
          </div>
        </TrackListProvider>
      </PlayerProvider>
    ),
  ],
};
