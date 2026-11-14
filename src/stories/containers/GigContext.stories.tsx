import type { Meta, StoryObj } from "@storybook/react-vite";
import { GigStateProvider } from "../../containers/GigContext";
import {
  gigArgTypes,
  gigStoryArgs,
  gigValueFromArgs,
  type GigStoryArgs,
} from "../../lib/storybook/args";
import { GigReport } from "../../pages/GigReport";

function Host(args: GigStoryArgs) {
  return (
    <GigStateProvider value={gigValueFromArgs(args)}>
      <GigReport />
    </GigStateProvider>
  );
}

const meta = {
  title: "Containers/Gig",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: gigStoryArgs,
  argTypes: gigArgTypes,
  render: (args) => <Host {...args} />,
} satisfies Meta<GigStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NotReady: Story = {};

export const Empty: Story = {
  args: { empty: true },
};
