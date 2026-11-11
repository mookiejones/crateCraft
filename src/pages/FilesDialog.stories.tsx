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
        dialogName: "Night.mp3",
        dialogPreview: { ok: true, needs_confirm: true, summary: "Rename Night.mp3" },
      })}
    >
      <dialog id="files-dialog" open>
        <FilesDialog />
      </dialog>
    </FilesProvider>
  ),
};

export const Delete: Story = {
  render: () => (
    <FilesProvider
      value={filesValue({
        dialogAction: "delete",
        dialogPreview: { ok: true, needs_confirm: true, summary: "Move 1 file to trash." },
      })}
    >
      <dialog id="files-dialog" open>
        <FilesDialog />
      </dialog>
    </FilesProvider>
  ),
};
