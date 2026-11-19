import type { Meta, StoryObj } from "@storybook/react-vite";
import type { Job } from "../../lib/api-types";
import { JobToast } from "../../components/JobToast";
import { JobProvider, type JobContextValue, idleJobValue } from "../../containers/JobContext";

const success: Job = {
  id: "job-1",
  kind: "tag_spelling",
  label: "Fixing spellings",
  state: "success",
  done: 2,
  total: 2,
  current: "",
  errors: [],
  snapshot_id: "snap-1",
  cancelable: false,
  created_at: 0,
  finished_at: 1,
};

function valueFrom(toast: Job | null): JobContextValue {
  return { ...idleJobValue(), toast };
}

function Host({ toast }: { toast: Job | null }) {
  return (
    <JobProvider value={valueFrom(toast)}>
      <JobToast />
    </JobProvider>
  );
}

const meta = {
  title: "Components/JobToast",
  component: Host,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof Host>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: { toast: success },
  render: (args) => <Host toast={args.toast} />,
};

export const Failed: Story = {
  args: {
    toast: { ...success, state: "failed", snapshot_id: null, errors: ["Could not write."] },
  },
  render: (args) => <Host toast={args.toast} />,
};

export const Hidden: Story = {
  args: { toast: null },
  render: (args) => <Host toast={args.toast} />,
};
