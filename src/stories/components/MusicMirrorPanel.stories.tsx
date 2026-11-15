import type { Meta, StoryObj } from "@storybook/react-vite";
import { MusicMirrorPanel } from "../../components/MusicMirrorPanel";

const meta = {
  title: "Components/MusicMirrorPanel",
  component: MusicMirrorPanel,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof MusicMirrorPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
