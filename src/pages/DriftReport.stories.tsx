import type { Meta, StoryObj } from "@storybook/react-vite";
import { GigStateProvider } from "../containers/GigContext";
import { gigValue } from "../lib/storybook/fixtures";
import { DriftReport } from "./DriftReport";

const meta = {
  title: "Pages/DriftReport",
  component: DriftReport,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof DriftReport>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Flags: Story = {
  render: () => (
    <GigStateProvider value={gigValue()}>
      <DriftReport />
    </GigStateProvider>
  ),
};

export const Empty: Story = {
  render: () => (
    <GigStateProvider value={gigValue({ drift: { report: null, scope: "" } })}>
      <DriftReport />
    </GigStateProvider>
  ),
};
