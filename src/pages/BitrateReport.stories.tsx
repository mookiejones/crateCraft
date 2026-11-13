import type { Meta, StoryObj } from "@storybook/react-vite";
import { bitratePlan, bitrateReport } from "../lib/storybook/fixtures";
import { BitrateReport } from "./BitrateReport";

const meta = {
  title: "Pages/BitrateReport",
  component: BitrateReport,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof BitrateReport>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Suspects: Story = {
  args: {
    payload: bitrateReport,
    cratePlan: bitratePlan,
    writable: true,
  },
};

export const Clear: Story = {
  args: {
    payload: { ...bitrateReport, suspects: [], not_found: 0, unreadable: 0, too_quiet: 0, unchecked: 0 },
    cratePlan: null,
    writable: true,
  },
};
