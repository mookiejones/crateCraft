import type { Meta, StoryObj } from "@storybook/react-vite";
import { HealthProvider } from "../containers/HealthContext";
import { healthReport, healthValue } from "../lib/storybook/fixtures";
import { HealthPanel } from "./HealthPanel";

const meta = {
  title: "Pages/HealthPanel",
  component: HealthPanel,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof HealthPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Report: Story = {
  render: () => (
    <HealthProvider value={healthValue({ healthReport })}>
      <HealthPanel />
    </HealthProvider>
  ),
};

export const Busy: Story = {
  render: () => (
    <HealthProvider value={healthValue({ healthBusy: true, healthStatus: "Checking…" })}>
      <HealthPanel />
    </HealthProvider>
  ),
};
