import type { Meta, StoryObj } from "@storybook/react-vite";
import { HistoryProvider } from "../containers/HistoryContext";
import { historyValue } from "../lib/storybook/fixtures";
import { HistoryDetail } from "./HistoryDetail";

const meta = {
  title: "Pages/HistoryDetail",
  component: HistoryDetail,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof HistoryDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Entry: Story = {
  render: () => (
    <HistoryProvider value={historyValue()}>
      <HistoryDetail />
    </HistoryProvider>
  ),
};

export const Empty: Story = {
  render: () => (
    <HistoryProvider value={historyValue({ entries: [], selectedId: null })}>
      <HistoryDetail />
    </HistoryProvider>
  ),
};
