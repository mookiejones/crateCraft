import type { Meta, StoryObj } from "@storybook/react-vite";
import { NoticeProvider } from "../containers/NoticeContext";
import { NoticeBanner } from "./NoticeBanner";

const meta = {
  title: "Components/NoticeBanner",
  component: NoticeBanner,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof NoticeBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Error: Story = {
  render: () => (
    <NoticeProvider
      value={{
        notice: { text: "That file is not on disk.", severity: "error" },
        dismiss: () => undefined,
      }}
    >
      <NoticeBanner />
    </NoticeProvider>
  ),
};

export const Success: Story = {
  render: () => (
    <NoticeProvider
      value={{
        notice: { text: "Saved.", severity: "success" },
        dismiss: () => undefined,
      }}
    >
      <NoticeBanner />
    </NoticeProvider>
  ),
};

export const Hidden: Story = {
  render: () => (
    <NoticeProvider value={{ notice: null, dismiss: () => undefined }}>
      <NoticeBanner />
    </NoticeProvider>
  ),
};
