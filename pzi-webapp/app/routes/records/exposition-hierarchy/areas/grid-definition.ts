import { MRT_ColumnDef } from "material-react-table";
import { ExpositionArea } from "../models";
import { getFullDefaultVisibility } from "~/lib/utils";
import { withEllipsisCell } from "~/components/ui/elipsiscell";

export const AREAS_TABLE_ID: string = 'records-exp-hierarchy-areas';

export const columnDef: MRT_ColumnDef<ExpositionArea>[] = withEllipsisCell ([
  {
    accessorKey: 'id',
    header: 'Id',
    size: 70
  },
  {
    accessorKey: 'name',
    header: 'Název',
    size: 150
  },
  {
    accessorKey: 'note',
    header: 'Poznámka',
    size: 150
  },
  {
    accessorKey: 'modifiedBy',
    header: 'Kdo',
    size: 90
  },
  {
    accessorKey: 'modifiedAt',
    header: 'Kdy',
    size: 90
  },
]);

export const defaultVisibility = getFullDefaultVisibility(
  columnDef,
  ['name']
);
