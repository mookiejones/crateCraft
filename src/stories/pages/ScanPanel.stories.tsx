import type { Meta, StoryObj } from "@storybook/react-vite";
import { HealthProvider } from "../../containers/HealthContext";
import {
  healthArgTypes,
  healthStoryArgs,
  healthValueFromArgs,
  type HealthStoryArgs,
} from "../../lib/storybook/args";
import { ScanPanel } from "../../pages/ScanPanel";

function Host(args: HealthStoryArgs) {
  return (
    <HealthProvider value={healthValueFromArgs(args)}>
      <ScanPanel />
    </HealthProvider>
  );
}

const meta = {
  title: "Pages/ScanPanel",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: { ...healthStoryArgs, hasScan: true },
  argTypes: healthArgTypes,
  render: (args) => <Host {...args} />,
} satisfies Meta<HealthStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Problems: Story = {};

export const Idle: Story = {
  args: { hasScan: false },
};
