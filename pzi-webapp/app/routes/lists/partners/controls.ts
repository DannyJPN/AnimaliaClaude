import {MRT_ColumnDef} from "material-react-table";
import { withEllipsisCell } from "~/components/ui/elipsiscell";
import {getFullDefaultVisibility} from "~/lib/utils";
import {Partners} from "~/routes/lists/partners/models";

export const PARTNERS_TABLE_ID = "PARTNERS_TABLE_ID";

export const columnDef: MRT_ColumnDef<Partners>[] = withEllipsisCell ([
    {
        accessorKey: "keyword",
        header: "Keyword",
    },
    {
        accessorKey: "name",
        header: "Název",
    },
    {
        accessorKey: "status",
        header: "Status",
    },
    {
        accessorKey: "city",
        header: "Město",
    },
    {
        accessorKey: "streetAddress",
        header: "Ulice a číslo",
    },
    {
        accessorKey: "postalCode",
        header: "PSČ",
    },
    {
        accessorKey: "country",
        header: "Země",
    },
    {
        accessorKey: "phone",
        header: "Telefon",
    },
    {
        accessorKey: "email",
        header: "Email",
    },
    {
        accessorKey: "partnerType",
        header: "Typ",
    },
    {
        accessorKey: "firstName",
        header: "Křestní jméno",
    },
    {
        accessorKey: "lastName",
        header: "Příjmení",
    },
    {
        accessorKey: "note",
        header: "Poznámka",
    },
]);

export const columnDefVisibility = getFullDefaultVisibility(
    columnDef,
    ["keyword", "name", "city", "streetAddress", "postalCode", "country"]
);