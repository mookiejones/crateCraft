import type { Meta, StoryObj } from "@storybook/react-vite";
import { LanStagePanel } from "../../components/LanStagePanel";

const meta = {
  title: "Components/LanStagePanel",
  component: LanStagePanel,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof LanStagePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
