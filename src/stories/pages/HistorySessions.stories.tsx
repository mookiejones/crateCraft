import type { Meta, StoryObj } from "@storybook/react-vite";
import { HistoryProvider } from "../../containers/HistoryContext";
import {
  historyArgTypes,
  historyStoryArgs,
  historyValueFromArgs,
  type HistoryStoryArgs,
} from "../../lib/storybook/args";
import { HistorySessions } from "../../pages/HistorySessions";

function Host(args: HistoryStoryArgs) {
  return (
    <HistoryProvider value={historyValueFromArgs(args)}>
      <div id="session-list" role="listbox">
        <HistorySessions />
      </div>
    </HistoryProvider>
  );
}

const meta = {
  title: "Pages/HistorySessions",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: historyStoryArgs,
  argTypes: historyArgTypes,
  render: (args) => <Host {...args} />,
} satisfies Meta<HistoryStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Sessions: Story = {};

export const Empty: Story = {
  args: { empty: true },
};
