import { MRT_ColumnDef } from "material-react-table";
import { Contract, ContractAction, ContractWithRelatedData, DocumentMovement } from "./models";
import { getFullDefaultVisibility } from "~/lib/utils";
import { withEllipsisCell } from "~/components/ui/elipsiscell";

export const CONTRACTS_TABLE_ID = "contracts-contracts";

export const columnDef: MRT_ColumnDef<ContractWithRelatedData>[] = withEllipsisCell ([
  {
    accessorKey: 'id',
    header: 'Id',
  },
  {
    accessorKey: 'year',
    header: 'Rok'
  },
  {
    accessorKey: 'number',
    header: 'Číslo'
  },
  {
    accessorKey: 'date',
    header: 'Datum'
  },
  {
    accessorKey: 'partner_keyword',
    header: 'Partner',
    enableSorting: false
  },
  {
    accessorKey: 'movementReason_displayName',
    header: 'Pohyb',
    enableSorting: false
  }
]);

export const columnDefVisibility = getFullDefaultVisibility(
  columnDef,
  ['number', 'date', 'partner_keyword', 'movementReason_displayName']
);

export function flattenODataResult(item: Contract): ContractWithRelatedData {
  return {
    ...item,
    partner_keyword: item.partner?.keyword,
    movementReason_displayName: item.movementReason?.displayName,
    contractType_displayName: item.contractType?.displayName
  };
};

export const DOCUMENT_MOVEMENTS_TABLE_ID = "contracts-documents-movements";

export const documentMovementColumnDef: MRT_ColumnDef<DocumentMovement>[] = withEllipsisCell ([
  {
    accessorKey: 'id',
    header: 'Id',
  },
  {
    accessorKey: 'date',
    header: 'Datum',
  },
  {
    accessorKey: 'incrementReasonName',
    header: 'Přírůstek',
  },
  {
    accessorKey: 'decrementReasonName',
    header: 'Úbytek',
  },
  {
    accessorKey: 'speciesNameLat',
    header: 'Druh lat.',
  },
  {
    accessorKey: 'accessionNumber',
    header: 'Přírůst. č.',
  },
  {
    accessorKey: 'gender',
    header: 'Pohlaví',
  },
  {
    accessorKey: 'name',
    header: 'Jméno',
  },
  {
    accessorKey: 'note',
    header: 'Poznámka',
  },
  {
    accessorKey: 'contractNote',
    header: 'Poznámka ke smlouvě',
  }
]);

export const documentMovementColumnDefVisibility = getFullDefaultVisibility(
  documentMovementColumnDef,
  ['date', 'incrementReasonName', 'decrementReasonName', 'speciesNameLat', 'accessionNumber', 'gender', 'name']
);

export const CONTRACT_ACTIONS_TABLE_ID = "contracts-documents-actions";

export const contractActionsColumnDef: MRT_ColumnDef<ContractAction>[] = withEllipsisCell ([
  {
    accessorKey: 'id',
    header: 'Id',
  },
  {
    accessorKey: 'date',
    header: 'Datum',
  },
  {
    accessorKey: 'actionType.displayName',
    header: 'Úkon',
    enableSorting: false
  },
  {
    accessorKey: 'actionInitiator.displayName',
    header: 'Účastník',
    enableSorting: false
  },
  {
    accessorKey: 'note',
    header: 'Poznámka',
  }
]);

export const contractActionsColumnDefVisibility = getFullDefaultVisibility(
  contractActionsColumnDef,
  ['date', 'actionType.displayName', 'actionInitiator.displayName', 'note']
);
