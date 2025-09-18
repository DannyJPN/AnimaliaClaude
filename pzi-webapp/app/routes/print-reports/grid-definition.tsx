import { MRT_ColumnDef } from "material-react-table";
import { getFullDefaultVisibility } from "~/lib/utils";
import { PrintReport, PrintReportType } from "./models";
import { withEllipsisCell } from "~/components/ui/elipsiscell";

export const columnDef: MRT_ColumnDef<PrintReport>[] = withEllipsisCell ([
  {
    accessorKey: 'name',
    header: 'Název',
    size: 220,
  },
  {
    accessorKey: 'type',
    header: 'Typ Sestavy',
    filterVariant: 'multi-select',
    filterSelectOptions: Object.values(PrintReportType),
  },
  {
    accessorKey: 'description',
    header: 'Popis',
  },
]);

export const columnVisibility = getFullDefaultVisibility(
  columnDef,
  ['name', 'type']
);
