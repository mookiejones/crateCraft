import type { Meta, StoryObj } from "@storybook/react-vite";
import { GigStateProvider } from "../../containers/GigContext";
import {
  gigArgTypes,
  gigStoryArgs,
  gigValueFromArgs,
  type GigStoryArgs,
} from "../../lib/storybook/args";
import { PlayerCompatReport } from "../../pages/PlayerCompatReport";

function Host(args: GigStoryArgs) {
  return (
    <GigStateProvider value={gigValueFromArgs(args)}>
      <PlayerCompatReport />
    </GigStateProvider>
  );
}

const meta = {
  title: "Pages/PlayerCompatReport",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: gigStoryArgs,
  argTypes: gigArgTypes,
  render: (args) => <Host {...args} />,
} satisfies Meta<GigStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Refusals: Story = {};

export const NotChecked: Story = {
  args: { emptyPlayers: true },
};
