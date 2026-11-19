import type { Meta, StoryObj } from "@storybook/react-vite";
import type { Job } from "../../lib/api-types";
import { ActivityTray } from "../../components/ActivityTray";
import { JobProvider, idleJobValue, type JobContextValue } from "../../containers/JobContext";

const running: Job = {
  id: "job-1",
  kind: "tag_spelling",
  label: "Fixing spellings",
  state: "running",
  done: 1,
  total: 4,
  current: "Hip-Hop",
  errors: [],
  snapshot_id: null,
  cancelable: true,
  created_at: 1,
  finished_at: null,
};

const recent: Job = {
  ...running,
  id: "job-0",
  state: "success",
  done: 4,
  total: 4,
  cancelable: false,
  created_at: 0,
  finished_at: 1,
  snapshot_id: "snap-1",
};

function Host({ value }: { value: JobContextValue }) {
  return (
    <JobProvider value={value}>
      <ActivityTray />
    </JobProvider>
  );
}

const meta = {
  title: "Components/ActivityTray",
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

export const Running: Story = {
  args: {
    value: { ...idleJobValue(), jobs: [running, recent], running },
  },
  render: (args) => <Host value={args.value} />,
};
