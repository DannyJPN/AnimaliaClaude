import { MRT_ColumnDef } from "material-react-table";
import { TaxonomySpeciesDocumentItem, TaxonomySpeciesDocumentItemWithFlatRelatedData, TaxonomySpeciesItem, TaxononomySpeciesRecordItem, TaxononomySpeciesRecordItemWithFlatRelatedData } from "./models";
import { getFullDefaultVisibility } from "~/lib/utils";
import { withEllipsisCell } from "~/components/ui/elipsiscell";

export const TABLE_ID: string = 'records-species';

export const columnDef: MRT_ColumnDef<TaxonomySpeciesItem>[] = withEllipsisCell ([
  {
    accessorKey: 'id',
    header: 'Id',
    size: 70
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
    accessorKey: 'code',
    header: 'Kód',
    size: 70,
    grow: false
  },
  {
    accessorKey: 'card',
    header: 'Karta',
    size: 90
  },
  {
    accessorKey: 'zooStatus',
    header: 'Stav',
    size: 70,
    grow: false
  },
  {
    accessorKey: 'nameEn',
    header: 'Anglicky',
    size: 150
  },
  {
    accessorKey: 'nameGe',
    header: 'Nemecky',
    size: 150
  },
  {
    accessorKey: 'nameSk',
    header: 'Slovensky',
    size: 150
  },
  {
    accessorKey: 'rdbCode',
    header: 'RDB Code',
  },
  {
    accessorKey: 'citeType',
    header: 'Cite Type',
  },
  {
    accessorKey: 'protectionType',
    header: 'Protection Type',
  },
  {
    accessorKey: 'isEep',
    header: 'EEP',
    accessorFn: (item) => {
      return item.isEep ? 'ano' : '';
    }
  },
  {
    accessorKey: 'isEsb',
    header: 'ESB',
    accessorFn: (item) => {
      return item.isEsb ? 'ano' : '';
    }
  },
  {
    accessorKey: 'isIsb',
    header: 'ISB',
    accessorFn: (item) => {
      return item.isIsb ? 'ano' : '';
    }
  },
  {
    accessorKey: 'isGenePool',
    header: 'Gene Pool',
    accessorFn: (item) => {
      return item.isGenePool ? 'ano' : '';
    }
  },
  {
    accessorKey: 'classificationTypeCode',
    header: 'Typ',
    size: 70
  },
  {
    accessorKey: 'price',
    header: 'Price',
  },
  {
    accessorKey: 'regionId',
    header: 'Region ID',
  },
  {
    accessorKey: 'note',
    header: 'Note',
  },
  {
    accessorKey: 'synonyms',
    header: 'Synonyms',
  },
  {
    accessorKey: 'description',
    header: 'Description',
  },
  {
    accessorKey: 'feedingRate',
    header: 'Feeding Rate',
  },
  {
    accessorKey: 'ucszCoef',
    header: 'UCSZ Coef',
  },
  {
    accessorKey: 'euCode',
    header: 'EU Code',
  },
  {
    accessorKey: 'isRegulationRequirement',
    header: 'Regulation Requirement',
    accessorFn: (item) => {
      return item.isRegulationRequirement ? 'ano' : '';
    }
  },
  {
    accessorKey: 'groupType',
    header: 'Group Type',
  },
  {
    accessorKey: 'isEuFauna',
    header: 'EU Fauna',
    accessorFn: (item) => {
      return item.isEuFauna ? 'ano' : '';
    }
  },
  {
    accessorKey: 'euFaunaRefNumber',
    header: 'EU Fauna Ref Number',
  },
  {
    accessorKey: 'crExceptionRefNumber',
    header: 'CR Exception Ref Number',
  },
  {
    accessorKey: 'rdbCodePrevious',
    header: 'Previous RDB Code',
  },
  {
    accessorKey: 'avgMinDepositInk',
    header: 'Avg Min Deposit Ink',
  },
  {
    accessorKey: 'avgMaxDepositInk',
    header: 'Avg Max Deposit Ink',
  },
  {
    accessorKey: 'avgDurationInk',
    header: 'Avg Duration Ink',
  },
  {
    accessorKey: 'groupId',
    header: 'Group ID',
  },
  {
    accessorKey: 'documentation',
    header: 'Documentation',
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

export const columnDefVisibility = getFullDefaultVisibility(columnDef, ['code', 'nameCz', 'nameLat', 'card', 'zooStatus']);

export const SPECIES_RECORDS_TABLE_ID = 'records-species-records';

export const recordsColumnDef: MRT_ColumnDef<TaxononomySpeciesRecordItemWithFlatRelatedData>[] = withEllipsisCell ([
  {
    accessorKey: 'id',
    header: 'Id',
    size: 70
  },
  {
    accessorKey: 'date',
    header: 'Datum',
    size: 90
  },
  {
    accessorKey: 'actionType_displayName',
    header: 'Akce',
    size: 70
  },
  {
    accessorKey: 'note',
    header: 'Poznamka',
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

export const recordsColumnDefVisibility = getFullDefaultVisibility(recordsColumnDef, ['date', 'actionType_displayName']);

export function flattenODataSpeciesRecordsResult(item: TaxononomySpeciesRecordItem) {
  return {
    ...item,
    actionType_displayName: item.actionType?.displayName
  } as TaxononomySpeciesRecordItemWithFlatRelatedData;
};

export const SPECIES_DOCUMENS_TABLE_ID = 'records-species-documents';

export const documentsColumnDef: MRT_ColumnDef<TaxonomySpeciesDocumentItemWithFlatRelatedData>[] = withEllipsisCell ([
  {
    accessorKey: 'id',
    header: 'Id',
    size: 70
  },
  {
    accessorKey: 'date',
    header: 'Datum',
    size: 90
  },
  {
    accessorKey: 'documentTypeCode_displayName',
    header: 'Druh',
    size: 90
  },
  {
    accessorKey: 'number',
    header: 'Číslo',
    size: 150
  },
  {
    accessorKey: 'isValid',
    header: 'Platný',
    accessorFn: (item) => {
      return item.isValid ? 'ano' : '';
    }
  },
  {
    accessorKey: 'note',
    header: 'Poznamka',
    size: 150
  },
  {
    accessorKey: 'createdBy',
    header: 'Kdo',
    size: 90
  },
  {
    accessorKey: 'createdOn',
    header: 'Kdy',
    size: 90
  }
]);

export const documentsColumnDefisibility = getFullDefaultVisibility(documentsColumnDef, ['date', 'documentType_displayName', 'number', 'isValid']);

export function flattenODataSpeciesDocumentResult(item: TaxonomySpeciesDocumentItem) {
  return {
    ...item,
    documentTypeCode_displayName: item.documentType?.displayName
  } as TaxonomySpeciesDocumentItemWithFlatRelatedData;
};