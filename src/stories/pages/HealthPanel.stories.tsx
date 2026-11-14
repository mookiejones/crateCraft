import type { Meta, StoryObj } from "@storybook/react-vite";
import { HealthProvider } from "../../containers/HealthContext";
import {
  healthArgTypes,
  healthStoryArgs,
  healthValueFromArgs,
  type HealthStoryArgs,
} from "../../lib/storybook/args";
import { HealthPanel } from "../../pages/HealthPanel";

function Host(args: HealthStoryArgs) {
  return (
    <HealthProvider value={healthValueFromArgs(args)}>
      <HealthPanel />
    </HealthProvider>
  );
}

const meta = {
  title: "Pages/HealthPanel",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: { ...healthStoryArgs, hasReport: true },
  argTypes: healthArgTypes,
  render: (args) => <Host {...args} />,
} satisfies Meta<HealthStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Report: Story = {};

export const Busy: Story = {
  args: { hasReport: false, busy: true },
};
