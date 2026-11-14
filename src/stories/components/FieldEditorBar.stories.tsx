import type { Meta, StoryObj } from "@storybook/react-vite";
import { FieldEditorBar } from "../../components/FieldEditorBar";
import { TrackListProvider } from "../../containers/TrackListContext";
import { trackListStoryArgs, trackListValueFromArgs } from "../../lib/storybook/args";

type BarStoryArgs = {
  selectedIds: number[];
  writable: boolean;
};

function Host(args: BarStoryArgs) {
  return (
    <TrackListProvider value={trackListValueFromArgs({ ...trackListStoryArgs, writable: args.writable })}>
      <FieldEditorBar selectedIds={args.selectedIds} />
    </TrackListProvider>
  );
}

const meta = {
  title: "Components/FieldEditorBar",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: { selectedIds: [4, 5], writable: true },
  argTypes: {
    writable: { control: "boolean" as const, description: "Library writes are allowed." },
  },
  render: (args) => <Host {...args} />,
} satisfies Meta<BarStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Hidden: Story = {
  args: { selectedIds: [4] },
};

export const Open: Story = {
  args: { selectedIds: [4, 5] },
};
