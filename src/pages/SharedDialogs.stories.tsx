import { useLayoutEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { openConfirm, setSharedDialogOpen } from "../lib/ui/shared-dialog";
import { SharedDialogs } from "./SharedDialogs";

function ConsentHost() {
  useLayoutEffect(() => {
    setSharedDialogOpen("consent-dialog", true);
    return () => setSharedDialogOpen("consent-dialog", false);
  }, []);
  return (
    <>
      <div id="shared-dialogs" />
      <dialog id="consent-dialog">
        <h2 id="consent-title">Share anonymous stats?</h2>
        <p id="consent-body">Optional usage counts. Sharing stays off until you turn it on.</p>
      </dialog>
      <SharedDialogs />
    </>
  );
}

function ConfirmHost() {
  useLayoutEffect(() => {
    void openConfirm({
      title: "Delete crate",
      message: "Delete House?",
      confirmLabel: "Delete",
    });
    return () => setSharedDialogOpen("confirm-dialog", false);
  }, []);
  return (
    <>
      <div id="shared-dialogs" />
      <SharedDialogs />
    </>
  );
}

const meta = {
  title: "Pages/SharedDialogs",
  component: SharedDialogs,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof SharedDialogs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Consent: Story = {
  render: () => <ConsentHost />,
};

export const Confirm: Story = {
  render: () => <ConfirmHost />,
};
