import type { Meta, StoryObj } from "@storybook/react-vite";
import { GigStateProvider } from "../../containers/GigContext";
import {
  gigArgTypes,
  gigStoryArgs,
  gigValueFromArgs,
  type GigStoryArgs,
} from "../../lib/storybook/args";
import { PortableReport } from "../../pages/PortableReport";

function Host(args: GigStoryArgs) {
  return (
    <GigStateProvider value={gigValueFromArgs(args)}>
      <PortableReport />
    </GigStateProvider>
  );
}

const meta = {
  title: "Pages/PortableReport",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: gigStoryArgs,
  argTypes: gigArgTypes,
  render: (args) => <Host {...args} />,
} satisfies Meta<GigStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Findings: Story = {};

export const Empty: Story = {
  args: { emptyPortable: true },
};
