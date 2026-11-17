import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CrateCompareReport } from "../../lib/api-types";
import { CrateComparePanel } from "../../pages/CrateComparePanel";

const report: CrateCompareReport = {
  a: { id: 5, name: "Warmup", smart: false, tracks: 3 },
  b: { id: 6, name: "Peak", smart: true, tracks: 2 },
  subcrates: false,
  both: [{ id: 10, name: "Shared", artist: "DJ A" }],
  only_a: [{ id: 12, name: "Warm only", artist: "DJ B" }],
  only_b: [],
};

const meta = {
  title: "Pages/CrateComparePanel",
  component: CrateComparePanel,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof CrateComparePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overlap: Story = {
  args: { payload: report, writable: true, busy: false },
};

export const Locked: Story = {
  args: { payload: report, writable: false, busy: false },
};
