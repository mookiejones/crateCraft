import type { Meta, StoryObj } from "@storybook/react-vite";
import { GenreFamilies } from "../../components/GenreFamilies";

const meta = {
  title: "Components/GenreFamilies",
  component: GenreFamilies,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: { writable: true, paused: false, revision: 0 },
} satisfies Meta<typeof GenreFamilies>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Seeded: Story = {};

export const Locked: Story = {
  args: { writable: false, paused: true },
};
