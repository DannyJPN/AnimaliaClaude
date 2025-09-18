import { MRT_ColumnDef } from "material-react-table";
import { Zoos } from "./models";

export const ZOOS_TABLE_ID = "zoos-table";

export const columnDef: MRT_ColumnDef<Zoos>[] = [
  {
    accessorKey: "id",
    header: "ID",
    size: 80,
  },
  {
    accessorKey: "keyword",
    header: "Klíčové slovo",
    size: 150,
  },
  {
    accessorKey: "name",
    header: "Název",
    size: 200,
  },
  {
    accessorKey: "city",
    header: "Město",
    size: 120,
  },
  {
    accessorKey: "country",
    header: "Země",
    size: 100,
  },
  {
    accessorKey: "phone",
    header: "Telefon",
    size: 120,
  },
  {
    accessorKey: "email",
    header: "Email",
    size: 150,
  },
];

export const columnDefVisibility = {
  id: true,
  keyword: true,
  name: true,
  city: true,
  country: false,
  phone: false,
  email: false,
};
