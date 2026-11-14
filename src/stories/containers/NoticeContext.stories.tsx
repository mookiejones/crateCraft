import type { Meta, StoryObj } from "@storybook/react-vite";
import { NoticeBanner } from "../../components/NoticeBanner";
import { NoticeProvider } from "../../containers/NoticeContext";
import {
  noticeArgTypes,
  noticeStoryArgs,
  noticeValueFromArgs,
  type NoticeStoryArgs,
} from "../../lib/storybook/args";

function Host(args: NoticeStoryArgs) {
  return (
    <NoticeProvider value={noticeValueFromArgs(args)}>
      <NoticeBanner />
    </NoticeProvider>
  );
}

const meta = {
  title: "Containers/Notice",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: noticeStoryArgs,
  argTypes: noticeArgTypes,
  render: (args) => <Host {...args} />,
} satisfies Meta<NoticeStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ErrorNotice: Story = {};

export const Idle: Story = {
  args: { severity: "hidden" },
};
