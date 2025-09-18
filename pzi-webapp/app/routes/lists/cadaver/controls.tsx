import { CircleEllipsisIcon, HeartIcon, HomeIcon, LockIcon } from "lucide-react";
import { Link } from "react-router";
import { Button, buttonVariants } from "~/components/ui/button";
import {MRT_ColumnDef} from "material-react-table";
import {CadaverPartner} from "~/routes/lists/cadaver/models";
import {getFullDefaultVisibility} from "~/lib/utils";
import { withEllipsisCell } from "~/components/ui/elipsiscell";
import { Menu, MenuHeader, MenuItem, MenuPopover, MenuSection, MenuTrigger } from "~/components/ui/menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { useFileDownload } from "~/components/hooks/use-file-download";
import { ZooFormatDateField } from "~/components/ui/zoo-format-datefield";

export const CADAVER_PARTNERS_TABLE_ID = "CADAVER_PARTNERS_TABLE_ID";

export const columnDef: MRT_ColumnDef<CadaverPartner>[] = withEllipsisCell ([
    {
        accessorKey: "keyword",
        header: "Keyword",
    },
    {
        accessorKey: "name",
        header: "Název",
    },
    {
        accessorKey: "city",
        header: "Město",
    },
    {
        accessorKey: "streetAndNumber",
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
    ['keyword', 'name', 'city', 'streetAndNumber', 'postalCode', 'country']
);

export function CadaverPartnersActionsMenu({
    partnerId,
    isDisabled,
    onShowMovementDialog,
    onShowCadaverDialog,
}: {
    partnerId: number;
    isDisabled: boolean;
    onShowMovementDialog: () => void;
    onShowCadaverDialog: () => void;
}) {

  return (
    <MenuTrigger>
      <Button
        aria-label="Akce"
        size="icon"
        variant="outline"
        className="text-xs p-0 w-8 h-8 bg-transparent"
        isDisabled={isDisabled}>
        <CircleEllipsisIcon className="size-3" />
      </Button>
      <MenuPopover>
        <Menu>
          <MenuSection>
            <MenuHeader>Sestavy</MenuHeader>
            <MenuItem onAction={onShowMovementDialog}>Pohyb podle partnerů</MenuItem>
            <MenuItem onAction={onShowCadaverDialog}>Tabulka zazn. kadáver v období pro místo</MenuItem>
          </MenuSection>
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  );
};