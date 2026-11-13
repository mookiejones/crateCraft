import type { Meta, StoryObj } from "@storybook/react-vite";
import { FilesProvider } from "../../containers/FilesContext";
import { filesValue } from "../../lib/storybook/fixtures";
import { FilesPanel } from "../../pages/FilesPanel";

const meta = {
  title: "Containers/Files",
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

export const Loading: Story = {
  render: () => (
    <FilesProvider value={filesValue({ loading: true, rows: [] })}>
      <FilesPanel />
    </FilesProvider>
  ),
};
