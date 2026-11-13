import type { Meta, StoryObj } from "@storybook/react-vite";
import { nightTrack, storyTrack } from "../../lib/storybook/fixtures";
import { BeatgridBlock } from "../../components/BeatgridBlock";

const meta = {
  title: "Components/BeatgridBlock",
  component: BeatgridBlock,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof BeatgridBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ViewOnly: Story = {
  args: { track: nightTrack },
};

export const Suspect: Story = {
  args: {
    track: storyTrack(4, "Night", {
      beatgrid: [{ position: "0.500", beats: 4 }],
      beatgrid_warning_code: "beatgrid_truncated",
    }),
  },
};

export const MissingFile: Story = {
  args: { track: storyTrack(4, "Night", { markers_unavailable: true }) },
};
