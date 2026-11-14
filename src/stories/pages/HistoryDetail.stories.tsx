import type { Meta, StoryObj } from "@storybook/react-vite";
import { HistoryProvider } from "../../containers/HistoryContext";
import {
  historyArgTypes,
  historyStoryArgs,
  historyValueFromArgs,
  type HistoryStoryArgs,
} from "../../lib/storybook/args";
import { HistoryDetail } from "../../pages/HistoryDetail";

function Host(args: HistoryStoryArgs) {
  return (
    <HistoryProvider value={historyValueFromArgs(args)}>
      <HistoryDetail />
    </HistoryProvider>
  );
}

const meta = {
  title: "Pages/HistoryDetail",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: historyStoryArgs,
  argTypes: historyArgTypes,
  render: (args) => <Host {...args} />,
} satisfies Meta<HistoryStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Entry: Story = {};

export const Empty: Story = {
  args: { empty: true },
};
