import type { Meta, StoryObj } from "@storybook/react-vite";
import type { EnergyPlan } from "../../lib/api-types";
import { EnergyPanel } from "../../pages/EnergyPanel";

const report: EnergyPlan = {
  checked: 4,
  unreadable: 1,
  fixes: [
    {
      asset_id: 1,
      path: "/music/friday.mp3",
      grouping: "",
      energy: 7,
      source: "tag",
      proposed: "Energy 7",
    },
    {
      asset_id: 2,
      path: "/music/peak.wav",
      grouping: "",
      energy: 4,
      source: "audio",
      proposed: "Energy 4",
    },
  ],
};

const meta = {
  title: "Pages/EnergyPanel",
  component: EnergyPanel,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof EnergyPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Fixes: Story = {
  args: { payload: report },
};

export const Clear: Story = {
  args: { payload: { checked: 4, unreadable: 0, fixes: [] } },
};
