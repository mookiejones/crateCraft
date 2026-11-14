import type { Meta, StoryObj } from "@storybook/react-vite";
import { SnapshotsProvider } from "../../containers/SnapshotsContext";
import {
  snapshotsArgTypes,
  snapshotsStoryArgs,
  snapshotsValueFromArgs,
  type SnapshotsStoryArgs,
} from "../../lib/storybook/args";
import { SnapshotsPanel } from "../../pages/SnapshotsPanel";

function Host(args: SnapshotsStoryArgs) {
  return (
    <SnapshotsProvider value={snapshotsValueFromArgs(args)}>
      <SnapshotsPanel />
    </SnapshotsProvider>
  );
}

const meta = {
  title: "Pages/SnapshotsPanel",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: snapshotsStoryArgs,
  argTypes: snapshotsArgTypes,
  render: (args) => <Host {...args} />,
} satisfies Meta<SnapshotsStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const List: Story = {};

export const Loading: Story = {
  args: { loading: true },
};

export const Empty: Story = {
  args: { empty: true },
};
