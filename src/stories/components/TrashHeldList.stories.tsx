import type { Meta, StoryObj } from "@storybook/react-vite";
import { TrashHeldList } from "../../components/TrashHeldList";
import { SnapshotsProvider } from "../../containers/SnapshotsContext";
import type { TrashItem } from "../../lib/api-types";
import { snapshotsValue } from "../../lib/storybook/fixtures";

const held: TrashItem = {
  id: "held1",
  kind: "audio",
  name: "song.mp3",
  held_at: "2026-01-15T12:00:00+00:00",
  purge_at: "2026-01-22T12:00:00+00:00",
  purge_cancelled: false,
  status: "held",
  days_left: 7,
  label: "held",
};

const due: TrashItem = {
  ...held,
  id: "due1",
  name: "old-backup",
  kind: "snapshot",
  days_left: 0,
  label: "due",
};

function Host({ trash }: { trash: readonly TrashItem[] }) {
  return (
    <SnapshotsProvider value={snapshotsValue({ trash })}>
      <TrashHeldList />
    </SnapshotsProvider>
  );
}

const meta = {
  title: "Components/TrashHeldList",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  render: () => <Host trash={[]} />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Held: Story = {
  render: () => <Host trash={[held, due]} />,
};
