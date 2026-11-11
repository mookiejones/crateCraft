import type { Meta, StoryObj } from "@storybook/react-vite";
import { CrateProvider } from "../containers/CrateContext";
import { crateValue } from "../lib/storybook/fixtures";
import { CrateBrowserActions } from "./CrateBrowserActions";

const meta = {
  title: "Pages/CrateBrowserActions",
  component: CrateBrowserActions,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof CrateBrowserActions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <CrateProvider value={crateValue()}>
      <div id="crate-browser-actions">
        <CrateBrowserActions />
      </div>
    </CrateProvider>
  ),
};

export const SplitOn: Story = {
  render: () => (
    <CrateProvider value={crateValue({ splitPressed: true })}>
      <div id="crate-browser-actions">
        <CrateBrowserActions />
      </div>
    </CrateProvider>
  ),
};
