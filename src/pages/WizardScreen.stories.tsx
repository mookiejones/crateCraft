import type { Meta, StoryObj } from "@storybook/react-vite";
import { WizardProvider } from "../containers/WizardContext";
import { wizardModel, wizardValue } from "../lib/storybook/fixtures";
import { WizardScreen } from "./WizardScreen";

const meta = {
  title: "Pages/WizardScreen",
  component: WizardScreen,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof WizardScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

function wrap(step: "welcome" | "library" | "snapshot" | "consent" | "done") {
  return (
    <WizardProvider value={wizardValue({ model: wizardModel(step) })}>
      <div id="wizard">
        <WizardScreen />
      </div>
    </WizardProvider>
  );
}

export const Welcome: Story = { render: () => wrap("welcome") };
export const Library: Story = { render: () => wrap("library") };
export const Snapshot: Story = { render: () => wrap("snapshot") };
export const Consent: Story = { render: () => wrap("consent") };
export const Done: Story = { render: () => wrap("done") };
