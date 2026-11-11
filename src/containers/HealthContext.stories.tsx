import type { Meta, StoryObj } from "@storybook/react-vite";
import { HealthProvider } from "./HealthContext";
import { healthReport, healthValue } from "../lib/storybook/fixtures";
import { HealthPanel } from "../pages/HealthPanel";

const meta = {
  title: "Containers/Health",
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

export const Idle: Story = {
  render: () => (
    <HealthProvider value={healthValue()}>
      <HealthPanel />
    </HealthProvider>
  ),
};
