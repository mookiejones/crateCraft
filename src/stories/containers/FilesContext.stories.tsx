import type { Meta, StoryObj } from "@storybook/react-vite";
import { FilesProvider } from "../../containers/FilesContext";
import {
  filesArgTypes,
  filesStoryArgs,
  filesValueFromArgs,
  type FilesStoryArgs,
} from "../../lib/storybook/args";
import { FilesPanel } from "../../pages/FilesPanel";

function Host(args: FilesStoryArgs) {
  return (
    <FilesProvider value={filesValueFromArgs(args)}>
      <FilesPanel />
    </FilesProvider>
  );
}

const meta = {
  title: "Containers/Files",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: filesStoryArgs,
  argTypes: filesArgTypes,
  render: (args) => <Host {...args} />,
} satisfies Meta<FilesStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Roots: Story = {};

export const Loading: Story = {
  args: { loading: true },
};
