import type { Meta, StoryObj } from "@storybook/react-vite";
import { GigStateProvider } from "../containers/GigContext";
import { gigValue } from "../lib/storybook/fixtures";
import { PortableReport } from "./PortableReport";

const meta = {
  title: "Pages/PortableReport",
  component: PortableReport,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof PortableReport>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Findings: Story = {
  render: () => (
    <GigStateProvider value={gigValue()}>
      <PortableReport />
    </GigStateProvider>
  ),
};

export const Empty: Story = {
  render: () => (
    <GigStateProvider value={gigValue({ portable: { report: null, status: "" } })}>
      <PortableReport />
    </GigStateProvider>
  ),
};
