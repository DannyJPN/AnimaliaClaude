import { MRT_ColumnDef } from "material-react-table";
import { getFullDefaultVisibility } from "~/lib/utils";
import { JOURNAL_STATUSES_TRANSLATIONS, JournalEntry, JournalEntryType } from "./models";
import { withEllipsisCell } from "~/components/ui/elipsiscell";

export const TABLE_ID = 'journal-entries';

export const columnDef: MRT_ColumnDef<JournalEntry>[] = withEllipsisCell([
  {
    accessorKey: 'id',
    header: 'Id',
    size: 70,
  },
  {
    accessorKey: 'entryType',
    header: 'Typ záznamu',
    size: 100,
    Cell: ({ cell }) => {
      const value = cell.getValue<JournalEntryType>();
      return value === 'Bio' ? 'Bio' : 'Pohyb';
    }
  },
  {
    accessorKey: 'entryDate',
    header: 'Datum záznamu',
    size: 120,
    Cell: ({ cell }) => {
      const value = cell.getValue<string>();
      if (!value) return '';

      // Format date to dd.MM.yyyy for display
      const dateRegex = /^(\d{4})\.(\d{2})\.(\d{2})$/;
      const match = value.match(dateRegex);

      if (match) {
        return `${match[3]}.${match[2]}.${match[1]}`;
      }

      return value;
    }
  },
  {
    accessorKey: 'organizationLevelName',
    header: 'Rajon'
  },
  {
    accessorKey: 'speciesNameLat',
    header: 'Druh (lat)',
  },
  {
    accessorKey: 'speciesNameCz',
    header: 'Druh (cz)',
  },
  {
    accessorKey: 'authorName',
    header: 'Autor',
  },
  {
    accessorKey: 'actionTypeDisplayName',
    header: 'Typ dat'
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 100,
    accessorFn: (row) => {
      return JOURNAL_STATUSES_TRANSLATIONS[row.status] || '';
    }
  },
  {
    accessorKey: 'note',
    header: 'Poznámka',
    enableSorting: false
  },
  {
    accessorKey: 'lastApproverUserName',
    header: 'Schválil',
  },
  {
    accessorKey: 'modifiedAt',
    header: 'Kdy',
  },
  {
    accessorKey: 'modifiedBy',
    header: 'Kdo',
  },
]);

export const columnVisibility = getFullDefaultVisibility(
  columnDef,
  ['entryType', 'entryDate', 'organizationLevelName', 'authorUserName', 'speciesNameLat', 'speciesNameCz', 'entryTypeDisplayName', 'status', 'note']
);
