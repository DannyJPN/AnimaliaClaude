import { MRT_ColumnDef } from "material-react-table";
import { TaxonomyGenusItem } from "./models";
import { getFullDefaultVisibility } from "~/lib/utils";
import { withEllipsisCell } from "~/components/ui/elipsiscell";

export const TABLE_ID: string = 'records-genera';

export const columnDef: MRT_ColumnDef<TaxonomyGenusItem>[] = withEllipsisCell ([
  {
    accessorKey: 'id',
    header: 'Id',
    size: 70
  },
  {
    accessorKey: 'code',
    header: 'Kód',
    size: 70,
    grow: false
  },
  {
    accessorKey: 'nameLat',
    header: 'Latinský Název',
    size: 150
  },
  {
    accessorKey: 'nameCz',
    header: 'Český Název',
    size: 150
  },
  {
    accessorKey: 'nameEn',
    header: 'Anglický Název',
    size: 150
  },
  {
    accessorKey: 'nameSk',
    header: 'Slovenský Název',
    size: 150
  },
  {
    accessorKey: 'zooStatus',
    header: 'Stav',
    size: 70,
    grow: false
  },
  {
    accessorKey: 'shortcut',
    header: 'Skratka',
    size: 70
  },
  {
    accessorKey: 'quantityOwned',
    header: 'Vlastněno',
    size: 70
  },
  {
    accessorKey: 'quantityInZoo',
    header: 'V Zoo',
    size: 70
  },
  {
    accessorKey: 'quantityDeponatedFrom',
    header: 'Dep. z',
    size: 70
  },
  {
    accessorKey: 'quantityDeponatedTo',
    header: 'Dep. do',
    size: 70
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

export const defaultVisibility = getFullDefaultVisibility(columnDef, ['code', 'nameCz', 'nameLat', 'zooStatus']);
