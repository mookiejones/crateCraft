import type { Meta, StoryObj } from "@storybook/react-vite";
import { RekordboxSmartRules } from "../../components/RekordboxSmartRules";
import type { SmartCrateRow } from "../../lib/ui/rekordbox-smart";

const crates: SmartCrateRow[] = [
  {
    id: 7,
    name: "Chinese Pop",
    frozen: true,
    storedCount: 2,
    writtenCount: 1,
    mismatch: true,
    status: "rules",
    rules: [
      { label: "genre is", classification: "exact" },
      { label: "genre contains", classification: "approximate" },
      { label: "location contains", classification: "impossible" },
    ],
  },
];

const meta = {
  title: "Components/RekordboxSmartRules",
  component: RekordboxSmartRules,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: {
    crates,
    onFreeze: () => undefined,
  },
} satisfies Meta<typeof RekordboxSmartRules>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Mixed: Story = {};
