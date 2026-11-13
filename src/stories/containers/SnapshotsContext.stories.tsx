import type { Meta, StoryObj } from "@storybook/react-vite";
import { SnapshotsProvider } from "../../containers/SnapshotsContext";
import { snapshotsValue } from "../../lib/storybook/fixtures";
import { SnapshotsPanel } from "../../pages/SnapshotsPanel";

const meta = {
  title: "Containers/Snapshots",
  component: SnapshotsPanel,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof SnapshotsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const List: Story = {
  render: () => (
    <SnapshotsProvider value={snapshotsValue()}>
      <SnapshotsPanel />
    </SnapshotsProvider>
  ),
};

export const Empty: Story = {
  render: () => (
    <SnapshotsProvider value={snapshotsValue({ snapshots: [] })}>
      <SnapshotsPanel />
    </SnapshotsProvider>
  ),
};
