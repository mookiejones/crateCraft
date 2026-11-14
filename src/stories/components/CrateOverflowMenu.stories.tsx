import type { Meta, StoryObj } from "@storybook/react-vite";
import { CrateOverflowMenu } from "../../components/CrateOverflowMenu";
import { tips } from "../../lib/ui/tooltip-strings";

const meta = {
  title: "Components/CrateOverflowMenu",
  component: CrateOverflowMenu,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: {
    buttonId: "crate-actions-more",
    menuId: "crate-actions-menu",
    items: [
      { id: "crate-color", label: "Color", tip: tips.crateColor, onClick: () => undefined },
      { id: "crate-preset", label: "Preset", tip: tips.cratePreset, onClick: () => undefined },
      {
        id: "crate-folder-sync",
        label: "Sync folder",
        tip: tips.crateFolderSync,
        onClick: () => undefined,
      },
    ],
  },
} satisfies Meta<typeof CrateOverflowMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const HiddenRefresh: Story = {
  args: {
    items: [
      { id: "crate-color", label: "Color", tip: tips.crateColor, onClick: () => undefined },
      {
        id: "crate-refresh",
        label: "Refresh",
        tip: tips.crateRefresh,
        hidden: true,
        onClick: () => undefined,
      },
    ],
  },
};
