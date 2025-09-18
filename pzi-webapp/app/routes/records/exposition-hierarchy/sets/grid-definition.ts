import { MRT_ColumnDef } from "material-react-table";
import { ExpositionSet } from "../models";
import { getFullDefaultVisibility } from "~/lib/utils";
import { withEllipsisCell } from "~/components/ui/elipsiscell";

export const SETS_TABLE_ID: string = 'records-exp-hierarchy-sets';

export const columnDef: MRT_ColumnDef<ExpositionSet>[] = withEllipsisCell ([
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
  ['name', 'expositionArea.name']
);
