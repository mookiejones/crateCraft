import type { Meta, StoryObj } from "@storybook/react-vite";
import { BatchProvider, idleBatchValue, useBatch, type BatchContextValue } from "../../containers/BatchContext";
import type { BatchListing } from "../../lib/api-types";

const previewed: BatchListing = {
  queue: [
    { kind: "track", id: 1, name: "Same" },
    { kind: "crate", id: 4, name: "Openers" },
  ],
  destination: { id: 3, name: "Warmup" },
  preview: { first: { kind: "track", id: 1, name: "Same" }, would_add: 2 },
  can_undo: true,
};

function Host({ value }: { value: BatchContextValue }) {
  return (
    <BatchProvider value={value}>
      <QueueLine />
    </BatchProvider>
  );
}

function QueueLine() {
  const batch = useBatch();
  const names = batch.listing.queue.map((item) => item.name).join(", ");
  return <p>{names || "empty"}</p>;
}

const meta = {
  title: "Containers/Batch",
  component: Host,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof Host>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  args: { value: idleBatchValue() },
  render: (args) => <Host value={args.value} />,
};

export const Preview: Story = {
  args: { value: { ...idleBatchValue(), listing: previewed } },
  render: (args) => <Host value={args.value} />,
};
