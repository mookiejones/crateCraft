import type { Meta, StoryObj } from "@storybook/react-vite";
import type { Job } from "../../lib/api-types";
import { JobProgress } from "../../components/JobProgress";

const running: Job = {
  id: "job-1",
  kind: "tag_spelling",
  label: "Fixing spellings",
  state: "running",
  done: 120,
  total: 450,
  current: "Hip-Hop",
  errors: [],
  snapshot_id: null,
  cancelable: true,
  created_at: 0,
  finished_at: null,
};

const meta = {
  title: "Components/JobProgress",
  component: JobProgress,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof JobProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Determinate: Story = {
  args: { job: running, onCancel: () => {} },
};

export const UnknownTotal: Story = {
  args: {
    job: { ...running, done: 0, total: 0 },
    onCancel: () => {},
  },
};

export const Idle: Story = {
  args: { job: null },
};
