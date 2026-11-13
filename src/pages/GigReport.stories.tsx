import type { Meta, StoryObj } from "@storybook/react-vite";
import { GigStateProvider } from "../containers/GigContext";
import { gigReport, gigValue } from "../lib/storybook/fixtures";
import { GigReport } from "./GigReport";

const meta = {
  title: "Pages/GigReport",
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

export const Ready: Story = {
  render: () => (
    <GigStateProvider
      value={gigValue({
        gig: {
          report: { ...gigReport, ready: true, score: 100, hard_red: false, holding_it_back: [] },
          stepIndex: 0,
          checkedAt: new Date("2026-01-01T12:00:00Z"),
        },
      })}
    >
      <GigReport />
    </GigStateProvider>
  ),
};
