import type { Meta, StoryObj } from "@storybook/react-vite";
import { GigDetailsGroup } from "../../pages/GigDetailsGroup";

const meta = {
  title: "Pages/GigDetailsGroup",
  component: GigDetailsGroup,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: {
    label: "Missing files",
    lines: ["A — Gone (/Music/gone.mp3)"],
  },
} satisfies Meta<typeof GigDetailsGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Short: Story = {};

export const Capped: Story = {
  args: {
    label: "Missing files",
    lines: Array.from({ length: 105 }, (_, index) => `Track ${index + 1}`),
  },
};
