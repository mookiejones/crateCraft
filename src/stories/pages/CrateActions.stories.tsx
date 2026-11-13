import type { Meta, StoryObj } from "@storybook/react-vite";
import { CrateProvider } from "../../containers/CrateContext";
import { crateValue } from "../../lib/storybook/fixtures";
import { CrateActions } from "../../pages/CrateActions";

const meta = {
  title: "Pages/CrateActions",
  component: CrateActions,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof CrateActions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllTracks: Story = {
  render: () => (
    <CrateProvider value={crateValue()}>
      <div className="crate-actions">
        <CrateActions />
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
        canFolderSync: true,
        canRenameFromTags: true,
      })}
    >
      <div className="crate-actions">
        <CrateActions />
      </div>
    </CrateProvider>
  ),
};
