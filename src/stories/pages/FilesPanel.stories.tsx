import type { Meta, StoryObj } from "@storybook/react-vite";
import { FilesProvider } from "../../containers/FilesContext";
import { filesValue, musicRootEntries } from "../../lib/storybook/fixtures";
import { FilesPanel } from "../../pages/FilesPanel";

const meta = {
  title: "Pages/FilesPanel",
  component: FilesPanel,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof FilesPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Roots: Story = {
  render: () => (
    <FilesProvider value={filesValue()}>
      <FilesPanel />
    </FilesProvider>
  ),
};

export const Folder: Story = {
  render: () => (
    <FilesProvider
      value={filesValue({
        atRoots: false,
        path: "/Users/dj/Music",
        parent: "",
        breadcrumb: [{ name: "Music", path: "/Users/dj/Music" }],
        rows: [
          { name: "Night.mp3", kind: "file", path: "/Users/dj/Music/Night.mp3", in_library: true },
          { name: "House", kind: "dir", path: "/Users/dj/Music/House" },
        ],
        entries: musicRootEntries,
      })}
    >
      <FilesPanel />
    </FilesProvider>
  ),
};
