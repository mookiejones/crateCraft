import type { Meta, StoryObj } from "@storybook/react-vite";
import { FilesProvider } from "../../containers/FilesContext";
import { driveReport, filesValue } from "../../lib/storybook/fixtures";
import { PortableDialog } from "../../components/PortableDialog";

const meta = {
  title: "Components/PortableDialog",
  component: PortableDialog,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof PortableDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  decorators: [
    (Story) => (
      <FilesProvider value={filesValue()}>
        <Story />
      </FilesProvider>
    ),
  ],
};

export const NotReady: Story = {
  decorators: [
    (Story) => (
      <FilesProvider value={filesValue({ portableReport: driveReport })}>
        <Story />
      </FilesProvider>
    ),
  ],
};

export const Ready: Story = {
  decorators: [
    (Story) => (
      <FilesProvider
        value={filesValue({
          portableReport: { ...driveReport, ready: true, findings: [], summary: "This drive is ready." },
        })}
      >
        <Story />
      </FilesProvider>
    ),
  ],
};
