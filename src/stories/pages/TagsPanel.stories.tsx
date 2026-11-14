import type { Meta, StoryObj } from "@storybook/react-vite";
import { HealthProvider } from "../../containers/HealthContext";
import {
  healthArgTypes,
  healthStoryArgs,
  healthValueFromArgs,
  type HealthStoryArgs,
} from "../../lib/storybook/args";
import { TagsPanel } from "../../pages/TagsPanel";

function Host(args: HealthStoryArgs) {
  return (
    <HealthProvider value={healthValueFromArgs(args)}>
      <TagsPanel />
    </HealthProvider>
  );
}

const meta = {
  title: "Pages/TagsPanel",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: { ...healthStoryArgs, hasTags: true },
  argTypes: healthArgTypes,
  render: (args) => <Host {...args} />,
} satisfies Meta<HealthStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Genre: Story = {};

export const Empty: Story = {
  args: { hasTags: false },
};
