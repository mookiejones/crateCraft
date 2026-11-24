import type { Meta, StoryObj } from "@storybook/react-vite";
import type { GainChangedReport } from "../../lib/api-types";
import { GainChangedPanel } from "../../pages/GainChangedPanel";

const report: GainChangedReport = {
  checked: 4,
  offline: 0,
  not_found: 0,
  unreadable: 0,
  folder: "_crateCraft generated",
  name: "Gain changed",
  note: "Only the stored gain changes. Auto gain, cues, the beatgrid, overview, and analysis stay.",
  tracks: [
    {
      id: 1,
      name: "Night Drive",
      artist: "Ada",
      file: "night.mp3",
      path: "/tmp/slm-example/night.mp3",
      gain_db: -1.5,
      gain_text: "-1.500",
      auto_gain: -3.257,
      bpm: "128.00",
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

export const Listed: Story = {
  args: {
    payload: report,
    confirmCrate: false,
    confirmReset: true,
    writable: true,
  },
};

export const Clear: Story = {
  args: {
    payload: { ...report, tracks: [] },
    confirmCrate: false,
    confirmReset: false,
    writable: true,
  },
};
