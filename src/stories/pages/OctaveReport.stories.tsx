import type { Meta, StoryObj } from "@storybook/react-vite";
import { GigStateProvider } from "../../containers/GigContext";
import {
  gigArgTypes,
  gigStoryArgs,
  gigValueFromArgs,
  type GigStoryArgs,
} from "../../lib/storybook/args";
import { OctaveReport } from "../../pages/OctaveReport";

function Host(args: GigStoryArgs) {
  return (
    <GigStateProvider value={gigValueFromArgs(args)}>
      <OctaveReport />
    </GigStateProvider>
  );
}

const meta = {
  title: "Pages/OctaveReport",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: gigStoryArgs,
  argTypes: gigArgTypes,
  render: (args) => <Host {...args} />,
} satisfies Meta<GigStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Flags: Story = {};

export const Empty: Story = {
  args: { emptyOctave: true },
};
