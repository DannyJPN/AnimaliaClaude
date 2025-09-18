import { EnumerationType } from "~/shared/models";

export type JournalEntryType = 'Bio' | 'Movement';
export type JournalEntryStatus = '1-review' | '2-closed_in_review' | '3-review_in_doc' | '4-closed_in_doc' | '5-solved_in_doc';
export type JournalActionTypeCodes = 'BT01' | 'BT02' | 'BT03' | 'BT04' | 'BT05' | 'BT06' | 'BT07' | 'BT08' | 'BT09' | 'BT10' | 'BT11' | 'BT12' | 'BT13' | 'BT14' | 'BT15' |
  'BT16' | 'BT17' | 'BT18' | 'BT19' | 'BT20' | 'BT21' | 'BT22' | 'BT23' | 'BT24' | 'BT25' | 'BT26' | 'BT27' | 'BT28' |
  'MT001' | 'MT002' | 'MT003' | 'MT101' | 'MT102' | 'MT103' | 'MT104' | 'MT105' | 'MT106' | 'MT107' | 'MT108' | 'MT109' | 'MT110' | 'MT111' | 'MT112' | 'MT113' |
  'MT114' | 'MT115' | 'MT116' | 'MT117' | 'MT118' | 'MT119' | 'MT120' | 'MT121' | 'MT122' | 'MT123' | 'MT124' | 'MT125' | 'MT126' | 'MT127' | 'MT128' | 'MT129' |
  'MT130' | 'MT131' | 'MT132' | 'MT133' | 'MT134' | 'MT135' | 'MT136' | 'MT137' | 'MT138' | 'MT139';

export const JOURNAL_ACTION_TYPE_SEX: JournalActionTypeCodes = 'BT19';
export const JOURNAL_ACTION_TYPE_WEIGHT: JournalActionTypeCodes = 'BT22';
export const JOURNAL_ACTION_TYPE_MARKING: JournalActionTypeCodes = 'BT25';
export const JOURNAL_ACTION_TYPE_EUTHANASIA: JournalActionTypeCodes = 'MT126';

export type JournalAttributeCodes = 'GENDER' | 'WEIGHT' | 'CHIP_CODE' | 'EUTHANASIA_REASON';

export const JOURNAL_ENTRY_TYPES: { key: JournalEntryType, text: string }[] = [
  { key: 'Bio', text: 'Bio' },
  { key: 'Movement', text: 'Pohyb' }
];

export const JOURNAL_STATUSES: { key: JournalEntryStatus, text: string }[] = [
  { key: '1-review', text: 'Zadán' },
  { key: '2-closed_in_review', text: 'Hotovo' },
  { key: '3-review_in_doc', text: 'Schválen' },
  { key: '4-closed_in_doc', text: 'Hotovo (dok)' },
  { key: '5-solved_in_doc', text: 'Zpracován' }
];

export const JOURNAL_STATUSES_TRANSLATIONS: Record<string, string> = JOURNAL_STATUSES.reduce((acc, e) => {
  acc[e.key] = e.text;
  return acc;
}, {} as Record<string, string>);

export type JournalEntryAttribute = {
  attributeTypeCode: JournalAttributeCodes,
  attributeValue?: string
};

export type JournalEntrySpecimen = {
  specimenId: number,
  note?: string,
  specimenAccessionNumber?: number,
  specimenBirthDate?: string,
  specimenZims?: string,
  specimenName?: string,
  specimenGenderTypeCode?: string,
  attributes?: JournalEntryAttribute[]
};

export type JournalEntry = {
  id: number;
  entryType: JournalEntryType;
  authorName?: string;
  organizationLevelId: number;
  organizationLevelName: string;
  speciesId: number;
  speciesNameLat?: string;
  speciesNameCz?: string;
  entryDate: string;
  status: JournalEntryStatus;
  actionTypeCode: JournalActionTypeCodes;
  actionTypeDisplayName: string;
  note?: string;
  lastApproverUserName?: string;
  modifiedAt?: string;
  modifiedBy?: string;
  attributes?: JournalEntryAttribute[];
  specimens?: JournalEntrySpecimen[];
  allowedActions: string[];
  isLocked?: boolean;
  isDeleted?: boolean;
  createdBy?: string;
  createdAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  curatorReviewNote?: string;
  archiveReviewedBy?: string;
  archiveReviewedAt?: string;
  archiveReviewNote?: string;
};

export type JournalEntryInsertRequest = {
  entryType: JournalEntryType,
  organizationLevelId: number,
  speciesId: number,
  entryDate: string,
  actionTypeCode: JournalActionTypeCodes,
  note?: string,
  attributes?: JournalEntryAttribute[],
  specimens?: {
    specimenId: number,
    note?: string,
    attributes?: JournalEntryAttribute[],
  }[]
};

export type JournalEntryUpdateRequest = {
  id: number,
  formModified: boolean,
} & JournalEntryInsertRequest;

export type JournalApiApproveEntry = {
  id: number,
  isUpdated: boolean,
  entryType: JournalEntryType,
  organizationLevelId: number,
  speciesId: number,
  entryDate: string,
  note?: string,
  actionTypeCode: JournalActionTypeCodes,
  attributes?: JournalEntryAttribute[],
  specimens?: {
    specimenId: number,
    note?: string,
    attributes?: JournalEntryAttribute[],
  }[]
};

export type DistrictItemType = {
  id: number,
  name: string,
  level: 'department' | 'workplace' | 'district'
};

export type JournalBaseDataResult = {
  bioActionTypesInsert: EnumerationType[],
  bioActionTypesEdit: EnumerationType[],
  movementActionTypesInsert: EnumerationType[],
  movementActionTypesEdit: EnumerationType[],
  districtsInsert: DistrictItemType[],
  districtsEdit: DistrictItemType[]
};

export type JournalDetailOutletContext = {
  baseData?: JournalBaseDataResult
};

export type SpeciesItem = {
  id: number,
  nameLat?: string,
  nameCz?: string
};

export type SpecimenOption = {
  id: number,
  accessionNumber?: number,
  birthDate?: string,
  zims?: string,
  name?: string,
  genderTypeCode?: string,
  note?: string
};

export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
};
