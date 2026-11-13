import type { Meta, StoryObj } from "@storybook/react-vite";
import type { GridColDef } from "@mui/x-data-grid";
import { ReportGrid } from "../../components/ReportGrid";

type Row = { id: string; problem: string; crate: string; track: string };

const rows: Row[] = [
  { id: "finding-0", problem: "Not on this drive", crate: "Friday", track: "Gone" },
  { id: "finding-1", problem: "Missing", crate: "Friday", track: "Blank" },
];

const columns: GridColDef<Row>[] = [
  { field: "problem", headerName: "Problem", flex: 1, minWidth: 140 },
  { field: "crate", headerName: "Crate", flex: 0.7, minWidth: 100 },
  { field: "track", headerName: "Track", flex: 1, minWidth: 120 },
];

const meta = {
  title: "Components/ReportGrid",
  component: ReportGrid,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Findings: Story = {
  render: () => <ReportGrid rows={rows} columns={columns} getRowId={(row) => row.id} />,
};

export const Empty: Story = {
  render: () => <ReportGrid rows={[]} columns={columns} getRowId={(row) => row.id} />,
};
