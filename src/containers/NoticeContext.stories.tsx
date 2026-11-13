import type { Meta, StoryObj } from "@storybook/react-vite";
import { NoticeProvider } from "./NoticeContext";
import { NoticeBanner } from "../components/NoticeBanner";

const meta = {
  title: "Containers/Notice",
  component: NoticeBanner,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof NoticeBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ErrorNotice: Story = {
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

export const Idle: Story = {
  render: () => (
    <NoticeProvider value={{ notice: null, dismiss: () => undefined }}>
      <NoticeBanner />
    </NoticeProvider>
  ),
};
