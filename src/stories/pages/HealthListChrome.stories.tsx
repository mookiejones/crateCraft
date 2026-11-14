import type { Meta, StoryObj } from "@storybook/react-vite";
import { HealthProvider } from "../../containers/HealthContext";
import {
  healthArgTypes,
  healthStoryArgs,
  healthValueFromArgs,
  type HealthStoryArgs,
} from "../../lib/storybook/args";
import { HealthListChrome } from "../../pages/HealthListChrome";

function Host(args: HealthStoryArgs) {
  return (
    <HealthProvider value={healthValueFromArgs(args)}>
      <HealthListChrome />
    </HealthProvider>
  );
}

const meta = {
  title: "Pages/HealthListChrome",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: healthStoryArgs,
  argTypes: healthArgTypes,
  render: (args) => <Host {...args} />,
} satisfies Meta<HealthStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Hidden: Story = {};

export const Duplicates: Story = {
  args: { mode: "duplicates" },
};

export const Relink: Story = {
  args: { mode: "missing" },
};
