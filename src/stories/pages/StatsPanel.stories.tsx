import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatsProvider } from "../../containers/StatsContext";
import { statsValue } from "../../lib/storybook/fixtures";
import { StatsPanel } from "../../pages/StatsPanel";

const meta = {
  title: "Pages/StatsPanel",
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

export const Empty: Story = {
  render: () => (
    <StatsProvider value={statsValue({ report: null })}>
      <StatsPanel />
    </StatsProvider>
  ),
};
