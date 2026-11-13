import type { Meta, StoryObj } from "@storybook/react-vite";
import type { GridColDef } from "@mui/x-data-grid";
import { HealthDataGrid, type HealthGridRow } from "./HealthDataGrid";

type Row = HealthGridRow & { name: string; file: string };

const rows: Row[] = [
  { id: 11, name: "Blank", file: "blank.mp3" },
  { id: 12, name: "Gone", file: "gone.mp3" },
];

const columns: GridColDef<Row>[] = [
  { field: "name", headerName: "Track", flex: 1, minWidth: 120 },
  { field: "file", headerName: "File", flex: 1, minWidth: 120 },
];

const meta = {
  title: "Components/HealthDataGrid",
  component: HealthDataGrid,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Rows: Story = {
  render: () => <HealthDataGrid rows={rows} columns={columns} selectedId={11} />,
};

export const Empty: Story = {
  render: () => <HealthDataGrid rows={[]} columns={columns} />,
};
