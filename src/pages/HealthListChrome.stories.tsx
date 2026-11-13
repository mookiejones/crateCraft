import type { Meta, StoryObj } from "@storybook/react-vite";
import { HealthProvider } from "../containers/HealthContext";
import { healthValue } from "../lib/storybook/fixtures";
import { HealthListChrome } from "./HealthListChrome";

const meta = {
  title: "Pages/HealthListChrome",
  component: HealthListChrome,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof HealthListChrome>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Hidden: Story = {
  render: () => (
    <HealthProvider value={healthValue()}>
      <HealthListChrome />
    </HealthProvider>
  ),
};

export const Duplicates: Story = {
  render: () => (
    <HealthProvider value={healthValue({ mode: "duplicates", mergeVisible: true, mergeDisabled: false })}>
      <HealthListChrome />
    </HealthProvider>
  ),
};

export const Relink: Story = {
  render: () => (
    <HealthProvider value={healthValue({ mode: "missing", relinkVisible: true, relinkDisabled: false })}>
      <HealthListChrome />
    </HealthProvider>
  ),
};
