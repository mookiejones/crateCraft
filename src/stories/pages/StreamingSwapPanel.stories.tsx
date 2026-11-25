import type { Meta, StoryObj } from "@storybook/react-vite";
import type { StreamingSwapPlan } from "../../lib/api-types";
import { StreamingSwapPanel } from "../../pages/StreamingSwapPanel";

const report: StreamingSwapPlan = {
  tracks: [
    {
      asset_id: 10,
      service: "Beatport",
      title: "Night Drive",
      artist: "Ada",
      color: 255,
      stored: "beatport:10",
      cues: "kept-on-row",
      crates: [{ id: 4, name: "Friday", list_order: 4 }],
      match: {
        path: "/tmp/slm-example/Ada - Night Drive.mp3",
        confidence: "high",
        reason: "artist and title",
        usable: true,
      },
      candidates: [
        {
          path: "/tmp/slm-example/Ada - Night Drive.mp3",
          confidence: "high",
          reason: "artist and title",
          usable: true,
        },
      ],
    },
  ],
  truncated: false,
  cues: "kept-on-row",
  note: "Colour and crate order stay. Cue points in the file stay.",
  roots: ["/tmp/slm-example"],
  preview: true,
  written: false,
};

const meta = {
  title: "Pages/StreamingSwapPanel",
  component: StreamingSwapPanel,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof StreamingSwapPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Listed: Story = {
  args: {
    payload: report,
    confirmRepair: true,
    writable: true,
  },
};

export const Clear: Story = {
  args: {
    payload: { ...report, tracks: [] },
    confirmRepair: false,
    writable: true,
  },
};
