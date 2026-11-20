import type { Meta, StoryObj } from "@storybook/react-vite";
import type { AudioChangedReport } from "../../lib/api-types";
import { AudioChangedPanel } from "../../pages/AudioChangedPanel";

const report: AudioChangedReport = {
  checked: 4,
  offline: 1,
  not_found: 0,
  unreadable: 0,
  warning: "Cues and the beatgrid may not fit this audio.",
  changed: [
    {
      id: 1,
      name: "Night Drive",
      artist: "Ada",
      file: "night.mp3",
      path: "/music/night.mp3",
      reasons: ["size", "hash"],
      size: 1200,
      duration_ms: 180000,
      hash: "abc",
    },
  ],
};

const meta = {
  title: "Pages/AudioChangedPanel",
  component: AudioChangedPanel,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof AudioChangedPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Changed: Story = {
  args: { payload: report, cratePlan: null, reanalyzePlan: null, writable: true },
};

export const Clear: Story = {
  args: {
    payload: { ...report, offline: 0, changed: [] },
    cratePlan: null,
    reanalyzePlan: null,
    writable: true,
  },
};
