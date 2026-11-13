import type { Meta, StoryObj } from "@storybook/react-vite";
import { HistoryProvider } from "./HistoryContext";
import { historyValue } from "../lib/storybook/fixtures";
import { HistorySessions } from "../pages/HistorySessions";

const meta = {
  title: "Containers/History",
  component: HistorySessions,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof HistorySessions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Sessions: Story = {
  render: () => (
    <HistoryProvider value={historyValue()}>
      <div id="session-list" role="listbox">
        <HistorySessions />
      </div>
    </HistoryProvider>
  ),
};

export const Empty: Story = {
  render: () => (
    <HistoryProvider value={historyValue({ sessions: [], historyId: null })}>
      <div id="session-list" role="listbox">
        <HistorySessions />
      </div>
    </HistoryProvider>
  ),
};
