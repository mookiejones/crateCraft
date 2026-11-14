import type { Meta, StoryObj } from "@storybook/react-vite";
import { CrateProvider } from "../../containers/CrateContext";
import {
  crateArgTypes,
  crateStoryArgs,
  crateValueFromArgs,
  type CrateStoryArgs,
} from "../../lib/storybook/args";
import { CrateBrowserActions } from "../../pages/CrateBrowserActions";

function Host(args: CrateStoryArgs) {
  return (
    <CrateProvider value={crateValueFromArgs(args)}>
      <div id="crate-browser-actions">
        <CrateBrowserActions />
      </div>
    </CrateProvider>
  );
}

const meta = {
  title: "Pages/CrateBrowserActions",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: crateStoryArgs,
  argTypes: crateArgTypes,
  render: (args) => <Host {...args} />,
} satisfies Meta<CrateStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SplitOn: Story = {
  args: { splitPressed: true },
};
