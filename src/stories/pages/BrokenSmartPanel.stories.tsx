import type { Meta, StoryObj } from "@storybook/react-vite";
import type { BrokenSmartPlan } from "../../lib/api-types";
import { BrokenSmartPanel } from "../../pages/BrokenSmartPanel";

const report: BrokenSmartPlan = {
  checked: 2,
  crates: [
    {
      id: 8,
      name: "Warmup",
      path: "Warmup",
      reason: "missing_rules",
      restorable: true,
      source: "backup",
      source_at: "2026-11-01T12:00:00Z",
    },
    {
      id: 10,
      name: "Late",
      path: "Friday / Late",
      reason: "missing_rules",
      restorable: false,
      source: null,
      source_at: null,
    },
  ],
};

const meta = {
  title: "Pages/BrokenSmartPanel",
  component: BrokenSmartPanel,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof BrokenSmartPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Listed: Story = {
  args: {
    payload: report,
    selected: new Set([8]),
    confirm: true,
    writable: true,
    onToggle: () => undefined,
  },
};
