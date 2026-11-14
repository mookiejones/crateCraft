import type { Meta, StoryObj } from "@storybook/react-vite";
import { CrateProvider } from "../../containers/CrateContext";
import {
  crateArgTypes,
  crateStoryArgs,
  crateValueFromArgs,
  type CrateStoryArgs,
} from "../../lib/storybook/args";
import { CrateActions } from "../../pages/CrateActions";

function Host(args: CrateStoryArgs) {
  return (
    <CrateProvider value={crateValueFromArgs(args)}>
      <div className="crate-actions">
        <CrateActions />
      </div>
    </CrateProvider>
  );
}

const meta = {
  title: "Pages/CrateActions",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: crateStoryArgs,
  argTypes: crateArgTypes,
  render: (args) => <Host {...args} />,
} satisfies Meta<CrateStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllTracks: Story = {};

export const CrateChosen: Story = {
  args: { crateChosen: true },
};

export const ReadOnly: Story = {
  args: { writable: false, crateChosen: true },
};
