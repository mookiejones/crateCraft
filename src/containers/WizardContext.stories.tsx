import type { Meta, StoryObj } from "@storybook/react-vite";
import { WizardProvider } from "./WizardContext";
import { wizardModel, wizardValue } from "../lib/storybook/fixtures";
import { WizardScreen } from "../pages/WizardScreen";

const meta = {
  title: "Containers/Wizard",
  component: WizardScreen,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof WizardScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Welcome: Story = {
  render: () => (
    <WizardProvider value={wizardValue()}>
      <div id="wizard">
        <WizardScreen />
      </div>
    </WizardProvider>
  ),
};

export const LibraryFound: Story = {
  render: () => (
    <WizardProvider value={wizardValue({ model: wizardModel("library") })}>
      <div id="wizard">
        <WizardScreen />
      </div>
    </WizardProvider>
  ),
};
