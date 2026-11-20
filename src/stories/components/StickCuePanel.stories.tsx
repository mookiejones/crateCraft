import type { Meta, StoryObj } from "@storybook/react-vite";
import { StickCuePanel } from "../../components/StickCuePanel";
import type { StickCueReport } from "../../lib/gig/stick-cues";

const listed: StickCueReport = {
  preview: true,
  written: false,
  status: "ready",
  libraryStatus: "ours",
  drive: "/Volumes/GIGDRIVE",
  count: 1,
  cues: [
    {
      file: "Deck.mp3",
      index: 1,
      startMs: 5000,
      name: "Deck",
      color: "#cc0000",
      skip: null,
    },
  ],
  skipped: [],
};

const meta = {
  title: "Components/StickCuePanel",
  component: StickCuePanel,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: { surface: "gig" },
} satisfies Meta<typeof StickCuePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Listed: Story = {
  args: { report: listed },
};
