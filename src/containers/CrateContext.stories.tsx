import type { Meta, StoryObj } from "@storybook/react-vite";
import { CrateProvider } from "./CrateContext";
import { crateValue } from "../lib/storybook/fixtures";
import { CrateTree } from "../pages/CrateTree";

const meta = {
  title: "Containers/Crate",
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

export const CrateChosen: Story = {
  render: () => (
    <CrateProvider
      value={crateValue({
        crateChosen: true,
        canRename: true,
        canColor: true,
        canDelete: true,
        rows: crateValue().rows.map((row) => ({ ...row, selected: row.id === 2 })),
      })}
    >
      <div id="crate-list" role="tree">
        <CrateTree />
      </div>
    </CrateProvider>
  ),
};
