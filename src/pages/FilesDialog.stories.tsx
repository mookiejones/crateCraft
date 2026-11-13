import type { Meta, StoryObj } from "@storybook/react-vite";
import { FilesProvider } from "../containers/FilesContext";
import { filesValue } from "../lib/storybook/fixtures";
import { FilesDialog } from "./FilesDialog";

const meta = {
  title: "Pages/FilesDialog",
  component: FilesDialog,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof FilesDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rename: Story = {
  render: () => (
    <FilesProvider
      value={filesValue({
        dialogAction: "rename",
        dialogOpen: true,
        dialogName: "Night.mp3",
        dialogPreview: { ok: true, needs_confirm: true, summary: "Rename Night.mp3" },
      })}
    >
      <FilesDialog />
    </FilesProvider>
  ),
};

export const Delete: Story = {
  render: () => (
    <FilesProvider
      value={filesValue({
        dialogAction: "delete",
        dialogOpen: true,
        dialogPreview: { ok: true, needs_confirm: true, summary: "Move 1 file to trash." },
      })}
    >
      <FilesDialog />
    </FilesProvider>
  ),
};
