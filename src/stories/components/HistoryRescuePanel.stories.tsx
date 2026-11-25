import type { Meta, StoryObj } from "@storybook/react-vite";
import { HistoryRescuePanel } from "../../components/HistoryRescuePanel";

const meta = {
  title: "Components/HistoryRescuePanel",
  component: HistoryRescuePanel,
  parameters: { layout: "padded" },
} satisfies Meta<typeof HistoryRescuePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
