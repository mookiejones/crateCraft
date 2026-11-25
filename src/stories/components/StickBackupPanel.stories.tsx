import type { Meta, StoryObj } from "@storybook/react-vite";
import { StickBackupPanel } from "../../components/StickBackupPanel";

const meta = {
  title: "Components/StickBackupPanel",
  component: StickBackupPanel,
  parameters: { layout: "padded" },
} satisfies Meta<typeof StickBackupPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
