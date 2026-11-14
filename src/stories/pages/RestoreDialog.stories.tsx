import type { Meta, StoryObj } from "@storybook/react-vite";
import { SnapshotsProvider } from "../../containers/SnapshotsContext";
import {
  snapshotsArgTypes,
  snapshotsStoryArgs,
  snapshotsValueFromArgs,
  type SnapshotsStoryArgs,
} from "../../lib/storybook/args";
import { RestoreDialog } from "../../pages/RestoreDialog";

function Host(args: SnapshotsStoryArgs) {
  return (
    <SnapshotsProvider value={snapshotsValueFromArgs(args)}>
      <dialog id="snapshot-dialog" open>
        <RestoreDialog />
      </dialog>
    </SnapshotsProvider>
  );
}

const meta = {
  title: "Pages/RestoreDialog",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: { ...snapshotsStoryArgs, planOpen: true },
  argTypes: snapshotsArgTypes,
  render: (args) => <Host {...args} />,
} satisfies Meta<SnapshotsStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DryRun: Story = {};

export const Blocked: Story = {
  args: { blocked: true },
};
