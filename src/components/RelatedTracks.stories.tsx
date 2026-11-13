import type { Meta, StoryObj } from "@storybook/react-vite";
import { TrackListProvider } from "../containers/TrackListContext";
import { nightTrack, trackListValue } from "../lib/storybook/fixtures";
import { RelatedTracks } from "./RelatedTracks";

const meta = {
  title: "Components/RelatedTracks",
  component: RelatedTracks,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: { track: nightTrack, writable: true },
  decorators: [
    (Story) => (
      <TrackListProvider value={trackListValue()}>
        <Story />
      </TrackListProvider>
    ),
  ],
} satisfies Meta<typeof RelatedTracks>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Writable: Story = {};

export const ReadOnly: Story = {
  args: { track: nightTrack, writable: false },
};
