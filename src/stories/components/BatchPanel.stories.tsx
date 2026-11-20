import type { Meta, StoryObj } from "@storybook/react-vite";
import { BatchPanel } from "../../components/BatchPanel";
import { BatchProvider, idleBatchValue, type BatchContextValue } from "../../containers/BatchContext";
import { CrateProvider } from "../../containers/CrateContext";
import type { BatchListing } from "../../lib/api-types";
import {
  crateArgTypes,
  crateStoryArgs,
  crateValueFromArgs,
  type CrateStoryArgs,
} from "../../lib/storybook/args";

const first = { kind: "track" as const, id: 1, name: "Same" };

const queued: BatchListing = {
  queue: [first, { kind: "crate", id: 4, name: "Openers" }],
  destination: { id: 3, name: "Warmup" },
  preview: null,
  can_undo: false,
};

const previewed: BatchListing = {
  ...queued,
  preview: { first, would_add: 2 },
};

type Args = CrateStoryArgs & { listing: BatchListing };

function Host({ listing, ...crate }: Args) {
  const value: BatchContextValue = { ...idleBatchValue(), listing };
  return (
    <CrateProvider value={crateValueFromArgs(crate)}>
      <BatchProvider value={value}>
        <BatchPanel />
      </BatchProvider>
    </CrateProvider>
  );
}

const meta = {
  title: "Components/BatchPanel",
  component: Host,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: { ...crateStoryArgs, listing: idleBatchValue().listing },
  argTypes: crateArgTypes,
  render: (args) => <Host {...args} />,
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Queued: Story = {
  args: { listing: queued, crateChosen: true },
};

export const Preview: Story = {
  args: { listing: previewed, crateChosen: true },
};
