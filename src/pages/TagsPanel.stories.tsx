import type { Meta, StoryObj } from "@storybook/react-vite";
import { HealthProvider } from "../containers/HealthContext";
import { healthValue, tagClusters, tagPlan } from "../lib/storybook/fixtures";
import { TagsPanel } from "./TagsPanel";

const meta = {
  title: "Pages/TagsPanel",
  component: TagsPanel,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof TagsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Genre: Story = {
  render: () => (
    <HealthProvider
      value={healthValue({
        tagsClusters: tagClusters,
        tagsPlans: new Map([["hiphop", tagPlan]]),
      })}
    >
      <TagsPanel />
    </HealthProvider>
  ),
};

export const Empty: Story = {
  render: () => (
    <HealthProvider value={healthValue()}>
      <TagsPanel />
    </HealthProvider>
  ),
};
