import type { Meta, StoryObj } from "@storybook/react-vite";
import { GigStateProvider } from "./GigContext";
import { gigValue } from "../lib/storybook/fixtures";
import { GigReport } from "../pages/GigReport";

const meta = {
  title: "Containers/Gig",
  component: GigReport,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof GigReport>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NotReady: Story = {
  render: () => (
    <GigStateProvider value={gigValue()}>
      <GigReport />
    </GigStateProvider>
  ),
};

export const Empty: Story = {
  render: () => (
    <GigStateProvider value={gigValue({ gig: { report: null, stepIndex: 0, checkedAt: null } })}>
      <GigReport />
    </GigStateProvider>
  ),
};
