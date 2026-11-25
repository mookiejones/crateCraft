import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReanalyzePlan } from "../../lib/api-types";
import { ReanalyzePanel } from "../../pages/ReanalyzePanel";

const report: ReanalyzePlan = {
  preview: true,
  written: false,
  count: 2,
  tracks: [
    {
      id: 10,
      name: "Drop",
      artist: "A",
      file: "ready.mp3",
      analysis_flags: 4,
      locked: false,
      cleared: ["BeatGrid", "Autotags"],
      has_markers2: true,
    },
    {
      id: 11,
      name: "Peak",
      artist: "B",
      file: "peak.wav",
      analysis_flags: 5,
      locked: false,
      cleared: ["BeatGrid"],
      has_markers2: true,
    },
  ],
  locked: [],
  clear_frames: true,
  include_locked: false,
  markers2: "unchanged",
  message: "Markers2 cues stay.",
};

const meta = {
  title: "Pages/ReanalyzePanel",
  component: ReanalyzePanel,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof ReanalyzePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Preview: Story = {
  args: {
    payload: report,
    writable: true,
    confirmReady: true,
  },
};

export const Clear: Story = {
  args: {
    payload: {
      ...report,
      count: 0,
      tracks: [],
      preview: true,
      written: false,
    },
    writable: true,
    confirmReady: false,
  },
};
