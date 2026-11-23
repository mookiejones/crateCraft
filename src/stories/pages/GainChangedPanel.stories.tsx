import type { Meta, StoryObj } from "@storybook/react-vite";
import type { GainChangedReport } from "../../lib/api-types";
import { GainChangedPanel } from "../../pages/GainChangedPanel";

const report: GainChangedReport = {
  checked: 4,
  offline: 1,
  not_found: 0,
  unreadable: 0,
  folder: "crateCraft",
  name: "Gain changed",
  changed: [
    {
      id: 1,
      name: "Night Drive",
      artist: "Ada",
      file: "night.mp3",
      path: "/music/night.mp3",
      gain_db: 2.5,
    },
    {
      id: 2,
      name: "Peak Hour",
      artist: "Bea",
      file: "peak.wav",
      path: "/music/peak.wav",
      gain_db: -1.25,
    },
  ],
};

const meta = {
  title: "Pages/GainChangedPanel",
  component: GainChangedPanel,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof GainChangedPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Changed: Story = {
  args: { payload: report, cratePlan: null, resetPlan: null, writable: true },
};

export const Clear: Story = {
  args: {
    payload: { ...report, offline: 0, changed: [] },
    cratePlan: null,
    resetPlan: null,
    writable: true,
  },
};
