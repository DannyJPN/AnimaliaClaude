import { MRT_ColumnDef } from "material-react-table";
import { withEllipsisCell } from "~/components/ui/elipsiscell";
import { getFullDefaultVisibility } from "~/lib/utils";
import type { Rearing } from "./models";

export const REARINGS_TABLE_ID = "REARINGS_TABLE_ID";

export const columnDef: MRT_ColumnDef<Rearing>[] = withEllipsisCell([
  {
    accessorKey: "code",
    header: "Kód",
    size: 100,
  },
  {
    accessorKey: "displayName",
    header: "Název",
  },
  {
    accessorKey: "sort",
    header: "Pořadí",
    size: 80,
  },
  {
    accessorKey: "note",
    header: "Poznámka",
  },
]);

export const columnDefVisibility = getFullDefaultVisibility(
  columnDef,
  ["code", "displayName", "sort", "note"]
);
