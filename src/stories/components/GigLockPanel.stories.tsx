import type { Meta, StoryObj } from "@storybook/react-vite";
import { GigLockPanel } from "../../components/GigLockPanel";

const meta = {
  title: "Components/GigLockPanel",
  component: GigLockPanel,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof GigLockPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
