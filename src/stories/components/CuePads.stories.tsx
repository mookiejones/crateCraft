import type { Meta, StoryObj } from "@storybook/react-vite";
import type { Marker } from "../../lib/api-types";
import { CuePads } from "../../components/CuePads";

const filled: Marker[] = [
  { index: 0, start_ms: 1500, color: "#CC0000", name: "Drop" },
  { index: 3, start_ms: 8000, color: "#FAC313", name: "Break" },
];

const extra: Marker[] = [
  ...filled,
  { index: 1, start_ms: 4000, name: "First" },
  { index: 1, start_ms: 4500, name: "Second" },
  { start_ms: 9000, color: "#CC0000", name: "Loose" },
];

const meta = {
  title: "Components/CuePads",
  component: CuePads,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof CuePads>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { cues: undefined },
};

export const TwoPads: Story = {
  args: { cues: filled },
};

export const WithExtras: Story = {
  args: { cues: extra },
};
