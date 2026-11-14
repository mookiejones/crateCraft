import type { Meta, StoryObj } from "@storybook/react-vite";
import { CrateProvider } from "../../containers/CrateContext";
import {
  crateArgTypes,
  crateStoryArgs,
  crateValueFromArgs,
  type CrateStoryArgs,
} from "../../lib/storybook/args";
import { CrateTree } from "../../pages/CrateTree";

function Host(args: CrateStoryArgs) {
  return (
    <CrateProvider value={crateValueFromArgs(args)}>
      <div id="crate-list" role="tree">
        <CrateTree />
      </div>
    </CrateProvider>
  );
}

const meta = {
  title: "Pages/CrateTree",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: crateStoryArgs,
  argTypes: crateArgTypes,
  render: (args) => <Host {...args} />,
} satisfies Meta<CrateStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { empty: true },
};

export const CrateChosen: Story = {
  args: { crateChosen: true },
};
