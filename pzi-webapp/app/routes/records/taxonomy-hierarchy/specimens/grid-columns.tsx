import { MRT_ColumnDef } from "material-react-table";
import { getFullDefaultVisibility } from "~/lib/utils";
import {
  SpecimenPlacementFlattened,
  SpecimenPlacementItem,
  TaxonomySpecimenCadaverItem,
  TaxonomySpecimenCadaverItemWithRelations,
  TaxonomySpecimenDocumentItem,
  TaxonomySpecimenDocumentItemWithRelations,
  TaxonomySpecimenItem,
  TaxonomySpecimenMarkingItem,
  TaxonomySpecimenMarkingItemWithRelations,
  TaxonomySpecimenMovementItemWithFlatRelatedData,
  TaxonomySpecimenRecordItem,
  TaxonomySpecimenRecordItemWithRelations
} from "./models";
import { withEllipsisCell } from "~/components/ui/elipsiscell";

export const SPECIMENS_TABLE_ID: string = 'records-specimens';

export const columnDef: MRT_ColumnDef<TaxonomySpecimenItem>[] = withEllipsisCell ([
  {
    accessorKey: 'id',
    header: 'Id',
    size: 70
  },
  {
    accessorKey: 'speciesId',
    header: 'Id druhu'
  },
  {
    accessorKey: 'accessionNumber',
    header: 'Př. č.',
    size: 70,
    grow: false
  },
  {
    accessorKey: 'genderTypeCode',
    header: 'Poh.',
    size: 70,
    grow: false
  },
  {
    accessorKey: 'inDate',
    header: 'Přírustek',
    size: 110
  },
  {
    accessorKey: 'inLocation_keyword',
    header: 'Odkud',
    size: 110
  },
  {
    accessorKey: 'studBookName',
    header: 'Jméno (pl. kn.)',
    size: 120
  },
  {
    accessorKey: 'classificationTypeCode',
    header: 'Typ'
  },
  {
    accessorKey: 'zims',
    header: 'ZIMS',
    size: 90
  },
  {
    accessorKey: 'studBookNumber',
    header: 'Čís. (plem. kn.)'
  },
  {
    accessorKey: 'outDate',
    header: 'Úbytek',
    size: 110
  },
  {
    accessorKey: 'outLocation_keyword',
    header: 'Kam',
    size: 110
  },
  {
    accessorKey: 'name',
    header: 'Domácí jméno'
  },
  {
    accessorKey: 'isHybrid',
    header: 'Hybrid',
    accessorFn: (item) => {
      return item.isHybrid ? 'ano' : '';
    }
  },
  {
    accessorKey: 'registrationNumber',
    header: 'Registrace'
  },
  {
    accessorKey: 'registeredDate',
    header: 'Reg. kdy'
  },
  {
    accessorKey: 'registeredTo',
    header: 'Reg. komu'
  },
  {
    accessorKey: 'euPermit',
    header: 'EU permit'
  },
  {
    accessorKey: 'czechregistrationNumber',
    header: 'ČR evidence'
  },
  {
    accessorKey: 'ueln',
    header: 'UELN'
  },
  {
    accessorKey: 'notch',
    header: 'Vrub'
  },
  {
    accessorKey: 'chip',
    header: 'Chip'
  },
  {
    accessorKey: 'ringNumber',
    header: 'Kroužky'
  },
  {
    accessorKey: 'otherMarking',
    header: 'Jiné značení'
  },
  {
    accessorKey: 'birthDate',
    header: 'Datum nar.'
  },
  {
    accessorKey: 'birthPlace',
    header: 'Místo nar.'
  },
  {
    accessorKey: 'birthMethod',
    header: 'Způsob nar.'
  },
  {
    accessorKey: 'rearing',
    header: 'Odchov'
  },
  {
    accessorKey: 'fatherId',
    header: 'Otec ID'
  },
  {
    accessorKey: 'father_displayName',
    header: 'Otec'
  },
  {
    accessorKey: 'fatherZims',
    header: 'Otec ZIMS'
  },
  {
    accessorKey: 'motherId',
    header: 'Matka ID'
  },
  {
    accessorKey: 'mother_displayName',
    header: 'Matka'
  },
  {
    accessorKey: 'motherZims',
    header: 'Matka ZIMS'
  },
  {
    accessorKey: 'note',
    header: 'Poznámka'
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
    header: 'Deponace z',
    size: 70
  },
  {
    accessorKey: 'quantityDeponatedTo',
    header: 'Deponace do',
    size: 70
  },
  {
    accessorKey: 'price',
    header: 'Cena',
    size: 90
  },
  {
    accessorKey: 'modifiedBy',
    header: 'Kdo',
  },
  {
    accessorKey: 'modifiedAt',
    header: 'Kdy',
  }
]);

export const columnDefVisibility = getFullDefaultVisibility(
  columnDef,
  [
    'accessionNumber', 'genderTypeCode', 'inDate', 'inLocation_keyword',
    'studBookName', 'outDate', 'outLocation_keyword',
    'zims', 'price'
  ]
);

export const SPECIMEN_MOVEMENTS_TABLE_ID: string = 'records-specimens-movements';

export const movementsColumnDef: MRT_ColumnDef<TaxonomySpecimenMovementItemWithFlatRelatedData>[] = withEllipsisCell ([
  {
    accessorKey: 'id',
    header: 'Id'
  },
  {
    accessorKey: 'date',
    header: 'Datum pohybu'
  },
  {
    accessorKey: 'accountingDate',
    header: 'Účetní datum'
  },
  {
    accessorKey: 'quantity',
    header: 'Počet v ZOO'
  },
  {
    accessorKey: 'quantityActual',
    header: 'Počet v pohybu'
  },
  {
    accessorKey: 'incrementReasonCode',
    header: 'Přírůstek kód'
  },
  {
    accessorKey: 'incrementReason_displayName',
    header: 'Přírustek'
  },
  {
    accessorKey: 'decrementReasonCode',
    header: 'Úbytek kód'
  },
  {
    accessorKey: 'decrementReason_displayName',
    header: 'Úbytek'
  },
  {
    accessorKey: 'partner_keyword',
    header: 'Místo'
  },
  {
    accessorKey: 'gender',
    header: 'Pohlaví skupiny M,F[,U]'
  },
  {
    accessorKey: 'price',
    header: 'Cena [Kč]'
  },
  {
    accessorKey: 'priceFinal',
    header: 'Obchodní cena [Kč]'
  },
  {
    accessorKey: 'contractId',
    header: 'ID Smlouvy'
  },
  {
    accessorKey: 'contract_number',
    header: 'Smlouva'
  },
  {
    accessorKey: 'contractNote',
    header: 'Poznámka ke smlouvě'
  },
  {
    accessorKey: 'note',
    header: 'Poznámka'
  },
  {
    accessorKey: 'modifiedAt',
    header: 'Kdy'
  },
  {
    accessorKey: 'modifiedBy',
    header: 'Kdy'
  },
]);

export const movementsColumnDefVisibility = getFullDefaultVisibility(
  movementsColumnDef,
  ['date', 'incrementReason_displayName', 'decrementReason_displayName', 'contract_number']
);

export const SPECIMEN_PLACEMENTS_TABLE_ID = "records-specimens-placements";

export const specimenPlacementsColumnDef: MRT_ColumnDef<
  SpecimenPlacementFlattened
>[] = withEllipsisCell ([
    {
      accessorKey: 'validSince',
      header: 'Datum',
    },
    {
      accessorKey: 'organizationLevel_name',
      header: 'Organizační jednotka',
    },
    {
      accessorKey: 'location_name',
      header: 'Lokace',
    },
    {
      accessorKey: 'note',
      header: 'Poznámka',
    },
    {
      accessorKey: 'modifiedBy',
      header: 'Kdo',
    },
    {
      accessorKey: 'modifiedAt',
      header: 'Kdy',
    },
  ]);

export const specimenPlacementsColumnDefVisibility = getFullDefaultVisibility(
  specimenPlacementsColumnDef,
  specimenPlacementsColumnDef.map((c) => c.accessorKey!)
);

export function flattenSpecimenPlacement(item: SpecimenPlacementItem) {
  return {
    ...item,
    location_name: item.location?.name,
    organizationLevel_name: item.organizationLevel?.name
  } as SpecimenPlacementFlattened;
};

export const SPECIMEN_RECORDS_TABLE_ID = "records-specimens-records";

export const recordsColumnDef: MRT_ColumnDef<TaxonomySpecimenRecordItemWithRelations>[] = withEllipsisCell ([
  {
    accessorKey: 'id',
    header: 'Id'
  },
  {
    accessorKey: 'date',
    header: 'Datum'
  },
  {
    accessorKey: 'actionTypeCode',
    header: 'Kód výkonu'
  },
  {
    accessorKey: 'actionType_displayName',
    header: 'Výkon'
  },
  {
    accessorKey: 'note',
    header: 'Poznámka'
  },
  {
    accessorKey: 'modifiedBy',
    header: 'Kdo'
  },
  {
    accessorKey: 'modifiedAt',
    header: 'Kdy'
  }
]);

export const recordsColumnDefVisibility = getFullDefaultVisibility(
  recordsColumnDef,
  ['date', 'actionType_displayName']
);

export function flattenRecord(item: TaxonomySpecimenRecordItem) {
  return {
    ...item,
    actionType_displayName: item.actionType?.displayName,
    partner_displayName: item.partner
      ? [item.partner.accessionNumber?.toString(), item.partner.zims].filter(x => x).join(' ')
      : undefined,
    partner_species_id: item.partner?.speciesId,
    partner_species_name: [item.partner?.species.nameLat, item.partner?.species.nameCz].filter(x => x).join(' / '),
  } as TaxonomySpecimenRecordItemWithRelations;
};

export const SPECIMEN_MARKINGS_TABLE_ID = "records-specimens-markings";

export const markingsColumnDef: MRT_ColumnDef<TaxonomySpecimenMarkingItemWithRelations>[] = withEllipsisCell ([
  {
    accessorKey: 'id',
    header: 'Id'
  },
  {
    accessorKey: 'markingTypeCode',
    header: 'Typ značení (kod)'
  },
  {
    accessorKey: 'markingType_displayName',
    header: 'Typ'
  },
  {
    accessorKey: 'ringNumber',
    header: 'Číslo'
  },
  {
    accessorKey: 'color',
    header: 'Barva'
  },
  {
    accessorKey: 'side',
    header: 'Strana'
  },
  {
    accessorKey: 'locatedOn',
    header: 'Umístění'
  },
  {
    accessorKey: 'isValid',
    header: 'Platnost',
    accessorFn: (item) => {
      return item.isValid ? 'ano' : '';
    }
  },
  {
    accessorKey: 'note',
    header: 'Poznámka'
  },
  {
    accessorKey: 'modifiedBy',
    header: 'Kdo'
  },
  {
    accessorKey: 'modifiedAt',
    header: 'Kdy'
  }
]);

export const markingsColumnDefVisibility = getFullDefaultVisibility(
  markingsColumnDef,
  ['markingType_displayName', 'ringNumber', 'color', 'side', 'date', 'isValid']
);

export function flattenMarking(item: TaxonomySpecimenMarkingItem) {
  return {
    ...item,
    markingType_displayName: item.markingType?.displayName
  } as TaxonomySpecimenMarkingItemWithRelations;
}

export const SPECIMEN_CADAVERS_TABLE_ID = "records-specimens-cadavers";

export const cadaversColumnDef: MRT_ColumnDef<TaxonomySpecimenCadaverItemWithRelations>[] = withEllipsisCell ([
  {
    accessorKey: 'id',
    header: 'Id'
  },
  {
    accessorKey: 'date',
    header: 'Datum'
  },
  {
    accessorKey: 'location',
    header: 'Místo'
  },
  {
    accessorKey: 'note',
    header: 'Poznámka'
  }
]);

export const cadaversColumnDefVisibility = getFullDefaultVisibility(
  cadaversColumnDef,
  ['date', 'ringNumber']
);

export function flattenCadaver(item: TaxonomySpecimenCadaverItem) {
  return {
    ...item,
  } as TaxonomySpecimenCadaverItemWithRelations;
}

export const SPECIMEN_DOCUMENTS_TABLE_ID = "records-specimens-documents";

export const documentsColumnDef: MRT_ColumnDef<TaxonomySpecimenDocumentItemWithRelations>[] = withEllipsisCell ([
  {
    accessorKey: 'id',
    header: 'Id'
  },
  {
    accessorKey: 'date',
    header: 'Datum'
  },
  {
    accessorKey: 'documentTypeCode',
    header: 'Druh'
  },
  {
    accessorKey: 'number',
    header: 'Číslo'
  },
  {
    accessorKey: 'partner',
    header: 'Komu'
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
    header: 'Poznámka'
  },
  {
    accessorKey: 'modifiedBy',
    header: 'Kdo'
  },
  {
    accessorKey: 'modifiedAt',
    header: 'Kdy'
  },
]);

export const documentsColumnDefVisibility = getFullDefaultVisibility(
  documentsColumnDef,
  ['date', 'documentTypeCode', 'number', 'partner', 'isValid']
);

export function flattenDocument(item: TaxonomySpecimenDocumentItem) {
  return {
    ...item,
  } as TaxonomySpecimenDocumentItemWithRelations;
}
