import type { Meta, StoryObj } from "@storybook/react-vite";
import { SnapshotsProvider } from "../containers/SnapshotsContext";
import { restorePlan, snapshotsValue } from "../lib/storybook/fixtures";
import { RestoreDialog } from "./RestoreDialog";

const meta = {
  title: "Pages/RestoreDialog",
  component: RestoreDialog,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof RestoreDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DryRun: Story = {
  render: () => (
    <SnapshotsProvider value={snapshotsValue({ plan: restorePlan, planOpen: true })}>
      <dialog id="snapshot-dialog" open>
        <RestoreDialog />
      </dialog>
    </SnapshotsProvider>
  ),
};

export const Blocked: Story = {
  render: () => (
    <SnapshotsProvider
      value={snapshotsValue({
        plan: { ...restorePlan, restore_blocked: "Quit Serato before restoring." },
        planOpen: true,
      })}
    >
      <dialog id="snapshot-dialog" open>
        <RestoreDialog />
      </dialog>
    </SnapshotsProvider>
  ),
};
