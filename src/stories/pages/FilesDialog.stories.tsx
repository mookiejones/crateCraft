import type { Meta, StoryObj } from "@storybook/react-vite";
import { FilesProvider } from "../../containers/FilesContext";
import {
  filesArgTypes,
  filesStoryArgs,
  filesValueFromArgs,
  type FilesStoryArgs,
} from "../../lib/storybook/args";
import { FilesDialog } from "../../pages/FilesDialog";

function Host(args: FilesStoryArgs) {
  return (
    <FilesProvider value={filesValueFromArgs(args)}>
      <FilesDialog />
    </FilesProvider>
  );
}

const meta = {
  title: "Pages/FilesDialog",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: { ...filesStoryArgs, dialogAction: "rename" },
  argTypes: filesArgTypes,
  render: (args) => <Host {...args} />,
} satisfies Meta<FilesStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rename: Story = {};

export const Delete: Story = {
  args: { dialogAction: "delete" },
};
