import type { Meta, StoryObj } from "@storybook/react-vite";
import { CrateProvider } from "../containers/CrateContext";
import { crateValue } from "../lib/storybook/fixtures";
import { CrateTree } from "./CrateTree";

const meta = {
  title: "Pages/CrateTree",
  component: CrateTree,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof CrateTree>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <CrateProvider value={crateValue()}>
      <div id="crate-list" role="tree">
        <CrateTree />
      </div>
    </CrateProvider>
  ),
};

export const Empty: Story = {
  render: () => (
    <CrateProvider value={crateValue({ rows: [] })}>
      <div id="crate-list" role="tree">
        <CrateTree />
      </div>
    </CrateProvider>
  ),
};
