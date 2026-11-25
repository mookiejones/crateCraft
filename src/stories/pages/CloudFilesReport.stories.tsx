import type { Meta, StoryObj } from "@storybook/react-vite";
import { GigStateProvider } from "../../containers/GigContext";
import {
  gigArgTypes,
  gigStoryArgs,
  gigValueFromArgs,
  type GigStoryArgs,
} from "../../lib/storybook/args";
import { CloudFilesReport } from "../../pages/CloudFilesReport";

function Host(args: GigStoryArgs) {
  return (
    <GigStateProvider value={gigValueFromArgs(args)}>
      <CloudFilesReport />
    </GigStateProvider>
  );
}

const meta = {
  title: "Pages/CloudFilesReport",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: gigStoryArgs,
  argTypes: gigArgTypes,
  render: (args) => <Host {...args} />,
} satisfies Meta<GigStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {};

export const Empty: Story = {
  args: { emptyCloud: true },
};
