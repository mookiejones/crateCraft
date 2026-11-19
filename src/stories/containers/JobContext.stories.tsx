import type { Meta, StoryObj } from "@storybook/react-vite";
import type { Job } from "../../lib/api-types";
import { ActivityTray } from "../../components/ActivityTray";
import { JobToast } from "../../components/JobToast";
import { JobProvider, idleJobValue, type JobContextValue } from "../../containers/JobContext";

const toast: Job = {
  id: "job-1",
  kind: "snapshot_restore",
  label: "Restoring snapshot",
  state: "partial",
  done: 1,
  total: 1,
  current: "",
  errors: ["House"],
  snapshot_id: "snap-1",
  cancelable: false,
  created_at: 0,
  finished_at: 1,
};

function Host({ value }: { value: JobContextValue }) {
  return (
    <JobProvider value={value}>
      <ActivityTray />
      <JobToast />
    </JobProvider>
  );
}

const meta = {
  title: "Containers/Jobs",
  component: Host,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof Host>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  args: { value: idleJobValue() },
  render: (args) => <Host value={args.value} />,
};

export const PartialToast: Story = {
  args: { value: { ...idleJobValue(), jobs: [toast], toast } },
  render: (args) => <Host value={args.value} />,
};
