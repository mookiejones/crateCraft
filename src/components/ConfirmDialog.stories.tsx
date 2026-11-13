import { useLayoutEffect, useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { openConfirm, setSharedDialogOpen, subscribeSharedDialogs } from "../lib/ui/shared-dialog";
import { ConfirmDialog } from "./ConfirmDialog";

function Opened({ children }: { children: ReactNode }) {
  const [, setTick] = useState(0);
  useLayoutEffect(() => {
    const unsub = subscribeSharedDialogs(() => setTick((n) => n + 1));
    void openConfirm({
      title: "Delete crate",
      message: "Delete House?",
      confirmLabel: "Delete",
    });
    return () => {
      unsub();
      setSharedDialogOpen("confirm-dialog", false);
    };
  }, []);
  return children;
}

const meta = {
  title: "Components/ConfirmDialog",
  component: ConfirmDialog,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DeleteCrate: Story = {
  render: () => (
    <Opened>
      <ConfirmDialog />
    </Opened>
  ),
};
