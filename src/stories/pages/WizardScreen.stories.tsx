import type { Meta, StoryObj } from "@storybook/react-vite";
import { WizardProvider } from "../../containers/WizardContext";
import {
  wizardArgTypes,
  wizardStoryArgs,
  wizardValueFromArgs,
  type WizardStoryArgs,
} from "../../lib/storybook/args";
import { WizardScreen } from "../../pages/WizardScreen";

function Host(args: WizardStoryArgs) {
  return (
    <WizardProvider value={wizardValueFromArgs(args)}>
      <div id="wizard">
        <WizardScreen />
      </div>
    </WizardProvider>
  );
}

const meta = {
  title: "Pages/WizardScreen",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: wizardStoryArgs,
  argTypes: wizardArgTypes,
  render: (args) => <Host {...args} />,
} satisfies Meta<WizardStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Welcome: Story = {};
export const Library: Story = { args: { step: "library" } };
export const Snapshot: Story = { args: { step: "snapshot" } };
export const Consent: Story = { args: { step: "consent" } };
export const Updates: Story = { args: { step: "updates" } };
export const Done: Story = { args: { step: "done" } };
