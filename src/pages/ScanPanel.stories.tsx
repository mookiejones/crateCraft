import type { Meta, StoryObj } from "@storybook/react-vite";
import { HealthProvider } from "../containers/HealthContext";
import { healthValue, scanReport } from "../lib/storybook/fixtures";
import { ScanPanel } from "./ScanPanel";

const meta = {
  title: "Pages/ScanPanel",
  component: ScanPanel,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof ScanPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Problems: Story = {
  render: () => (
    <HealthProvider value={healthValue({ scanReport, scanExpanded: new Set(["empty"]) })}>
      <ScanPanel />
    </HealthProvider>
  ),
};

export const Idle: Story = {
  render: () => (
    <HealthProvider value={healthValue()}>
      <ScanPanel />
    </HealthProvider>
  ),
};
