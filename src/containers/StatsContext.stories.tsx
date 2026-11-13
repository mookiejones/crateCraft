import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatsProvider } from "./StatsContext";
import { statsValue } from "../lib/storybook/fixtures";
import { StatsPanel } from "../pages/StatsPanel";

const meta = {
  title: "Containers/Stats",
  component: StatsPanel,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof StatsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Report: Story = {
  render: () => (
    <StatsProvider value={statsValue()}>
      <StatsPanel />
    </StatsProvider>
  ),
};

export const Idle: Story = {
  render: () => (
    <StatsProvider value={statsValue({ report: null })}>
      <StatsPanel />
    </StatsProvider>
  ),
};
