import { useLayoutEffect, useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContentText from "@mui/material/DialogContentText";
import { setSharedDialogOpen, subscribeSharedDialogs } from "../../lib/ui/shared-dialog";
import { CenteredDialog } from "../../components/CenteredDialog";

function Opened({ children }: { children: ReactNode }) {
  const [, setTick] = useState(0);
  useLayoutEffect(() => {
    const unsub = subscribeSharedDialogs(() => setTick((n) => n + 1));
    setSharedDialogOpen("consent-dialog", true);
    return () => {
      unsub();
      setSharedDialogOpen("consent-dialog", false);
    };
  }, []);
  return children;
}

const meta = {
  title: "Components/CenteredDialog",
  component: CenteredDialog,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Open: Story = {
  args: {
    id: "consent-dialog",
    labelledBy: "consent-title",
    describedBy: "consent-body",
  },
  render: () => (
    <Opened>
      <CenteredDialog id="consent-dialog" labelledBy="consent-title" describedBy="consent-body">
        <DialogTitle id="consent-title">Share anonymous stats?</DialogTitle>
        <DialogContentText id="consent-body" sx={{ px: 3, pb: 2 }}>
          Optional usage counts. Sharing stays off until you turn it on.
        </DialogContentText>
      </CenteredDialog>
    </Opened>
  ),
};
