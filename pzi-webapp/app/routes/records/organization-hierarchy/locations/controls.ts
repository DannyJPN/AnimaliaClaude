import {MRT_ColumnDef} from "material-react-table";
import {Location} from "~/routes/records/organization-hierarchy/locations/models";
import {getFullDefaultVisibility} from "~/lib/utils";
import { withEllipsisCell } from "~/components/ui/elipsiscell";

export const LOCATIONS_TABLE_ID = "LOCATIONS_TABLE_ID";

export const columnDef: MRT_ColumnDef<Location>[] = withEllipsisCell ([
    {
        accessorKey: "name",
        header: "Název",
    },
    {
        accessorKey: "organizationLevelName",
        header: "Rajon",
        accessorFn: (row) => row.organizationLevel?.name
    },
    {
      accessorKey: "expositionSetName",
      header: "Expoziční celek",
      accessorFn: (row) => row.expositionSet?.name
    },
    {
        accessorKey: "objectNumber",
        header: "Číslo objektu",
    },
    {
        accessorKey: "roomNumber",
        header: "Číslo místnosti",
    },
    {
        accessorKey: "availableForVisitors",
        header: "Dostupné pro návštěvníky",
        accessorFn: (item) => {
          return item.availableForVisitors ? 'ano' : '';
    }
    },
    {
        accessorKey: "locationTypeCode",
        header: "Typ umístění",
    },
    {
        accessorKey: "areaM2",
        header: "Plocha (m²)",
    },
    {
        accessorKey: "capacityM3",
        header: "Objem (m³)",
    },
    {
        accessorKey: "note",
        header: "Poznámka",
    },
    {
        accessorKey: "modifiedBy",
        header: "Kdo",
    },
    {
        accessorKey: "modifiedAt",
        header: "Kdy",
    },
]);

export const columnDefVisibility = getFullDefaultVisibility(
    columnDef,
    ['name', 'objectNumber', 'roomNumber', 'availableForVisitors', 'areaM2', 'capacityM3']
);