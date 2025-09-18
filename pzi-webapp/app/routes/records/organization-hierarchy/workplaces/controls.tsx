import { MRT_ColumnDef } from "material-react-table";
import { OrganizationLevelItem } from "../models";
import { getFullDefaultVisibility } from "~/lib/utils";
import { withEllipsisCell } from "~/components/ui/elipsiscell";

export const WORKPLACES_TABLE_ID: string = 'records-org-hierarchy-workplaces';

export const columnDef: MRT_ColumnDef<OrganizationLevelItem>[] = withEllipsisCell ([
  {
    accessorKey: 'id',
    header: 'Id',
    size: 70
  },
  {
    accessorKey: 'name',
    header: 'Název',
    size: 200
  },
  {
    accessorKey: 'director',
    header: 'Ředitel',
    size: 150
  },
  {
    accessorKey: 'journalApproversGroup',
    header: 'Kurator AD',
    size: 200
  },
  {
    accessorKey: 'journalReadGroup',
    header: 'View AD',
    size: 200
  },
  {
    accessorKey: 'journalContributorGroup',
    header: 'Editor AD',
    size: 200
  },
  {
    accessorKey: 'modifiedBy',
    header: 'Kdo',
    size: 150
  },
  {
    accessorKey: 'modifiedAt',
    header: 'Kdy',
    size: 150
  }
]);

export const defaultVisibility = getFullDefaultVisibility(
  columnDef,
  ['name', 'director']
);
