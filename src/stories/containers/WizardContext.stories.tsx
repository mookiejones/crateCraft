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
  title: "Containers/Wizard",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: wizardStoryArgs,
  argTypes: wizardArgTypes,
  render: (args) => <Host {...args} />,
} satisfies Meta<WizardStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Welcome: Story = {};

export const LibraryFound: Story = {
  args: { step: "library" },
};
