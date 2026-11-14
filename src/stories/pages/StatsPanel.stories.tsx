import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatsProvider } from "../../containers/StatsContext";
import {
  statsArgTypes,
  statsStoryArgs,
  statsValueFromArgs,
  type StatsStoryArgs,
} from "../../lib/storybook/args";
import { StatsPanel } from "../../pages/StatsPanel";

function Host(args: StatsStoryArgs) {
  return (
    <StatsProvider value={statsValueFromArgs(args)}>
      <StatsPanel />
    </StatsProvider>
  );
}

const meta = {
  title: "Pages/StatsPanel",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: statsStoryArgs,
  argTypes: statsArgTypes,
  render: (args) => <Host {...args} />,
} satisfies Meta<StatsStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Report: Story = {};

export const Empty: Story = {
  args: { empty: true },
};
