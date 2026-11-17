import type { Meta, StoryObj } from "@storybook/react-vite";
import type { LostTagsPlan } from "../../lib/api-types";
import { LostTagsPanel } from "../../pages/LostTagsPanel";

const report: LostTagsPlan = {
  checked: 3,
  unreadable: 1,
  fixes: [
    {
      asset_id: 1,
      path: "/music/blank.mp3",
      current: { name: "", artist: "" },
      proposed: { name: "File Title", artist: "File Artist" },
    },
    {
      asset_id: 2,
      path: "/music/title.mp3",
      current: { name: "", artist: "Kept Artist" },
      proposed: { name: "File Title" },
    },
  ],
};

const meta = {
  title: "Pages/LostTagsPanel",
  component: LostTagsPanel,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof LostTagsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Fixes: Story = {
  args: { payload: report },
};

export const Clear: Story = {
  args: { payload: { checked: 3, unreadable: 0, fixes: [] } },
};
