import { useLayoutEffect, useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  openCratePrompt,
  setSharedDialogOpen,
  subscribeSharedDialogs,
} from "../lib/ui/shared-dialog";
import { CratePromptDialog } from "./CratePromptDialog";

function Opened({ children }: { children: ReactNode }) {
  const [, setTick] = useState(0);
  useLayoutEffect(() => {
    const unsub = subscribeSharedDialogs(() => setTick((n) => n + 1));
    void openCratePrompt({
      title: "New crate",
      value: "House",
      confirmLabel: "Create",
    });
    return () => {
      unsub();
      setSharedDialogOpen("crate-prompt-dialog", false);
    };
  }, []);
  return children;
}

const meta = {
  title: "Components/CratePromptDialog",
  component: CratePromptDialog,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof CratePromptDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NewCrate: Story = {
  render: () => (
    <Opened>
      <CratePromptDialog />
    </Opened>
  ),
};
