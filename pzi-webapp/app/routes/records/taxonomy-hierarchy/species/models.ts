export type TaxonomySpeciesItem = {
  id: number,
  taxonomyGenusId: number,
  code?: string,
  nameCz?: string,
  nameLat?: string,
  nameEn?: string,
  nameGe?: string,
  nameSk?: string,
  card?: string,
  rdbCode?: string,
  citeTypeCode?: string,
  protectionType?: string,
  isEep?: boolean,
  isEsb?: boolean,
  isIsb?: boolean,
  isGenePool?: boolean,
  classificationTypeCode?: string,
  zooStatus?: string,
  price?: number,
  regionId?: number,
  note?: string,
  synonyms?: string,
  description?: string,
  feedingRate?: string,
  ucszCoef?: string,
  euCode?: string,
  isRegulationRequirement?: boolean,
  groupType?: string,
  isEuFauna?: boolean,
  euFaunaRefNumber?: string,
  crExceptionRefNumber?: string,
  rdbCodePrevious?: string,
  avgMinDepositInk?: string,
  avgMaxDepositInk?: string,
  avgDurationInk?: string,
  groupId?: number,
  documentation?: string,
  quantityOwned?: number,
  quantityInZoo?: number,
  quantityDeponatedFrom?: number,
  quantityDeponatedTo?: number,
  modifiedBy?: string,
  modifiedAt?: string
};

export type TaxonomyGenusInfoItem = {
  id: number,
  taxonomyFamilyId: number,
  code?: string,
  nameLat?: string,
  nameCz?: string
};

export type TaxonomyFamilyInfoItem = {
  id: number,
  taxonomyOrderId: number,
  code?: string,
  nameLat?: string,
  nameCz?: string,
  taxonomyOrder?: {
    id: number,
    nameLat?: string,
    nameCz?: string,
    taxonomyClass?: {
      id: number,
      taxonomyPhylumId: number,
      nameLat?: string,
      nameCz?: string,
    }
  }
};

export type TaxonomySpeciesInfoItem = {
  id: number,
  taxonomyGenusId: number,
  code?: string,
  nameLat?: string,
  nameCz?: string,
  classificationTypeCode?: string,
  taxonomyGenus?: {
    id: number,
    nameLat?: string,
    nameCz?: string,
    taxonomyFamilyId: number
  }
};

export type TaxononomySpeciesRecordItem = {
  id: number,
  speciesId: number,
  date: string,
  actionTypeCode?: string,
  note?: string,
  modifiedBy?: string,
  modifiedAt?: string,
  actionType?: {
    code: string,
    displayName: string
  }
};

export type TaxononomySpeciesRecordItemWithFlatRelatedData = {
  actionType_displayName?: string
} & TaxononomySpeciesRecordItem;

export type TaxonomySpeciesDocumentItem = {
  id: number,
  speciesId: number,
  documentTypeCode: string,
  date?: string,
  number: string,
  note?: string,
  isValid: boolean,
  createdBy?: string,
  createdOn?: string,
  documentType?: {
    code: string,
    displayName: string
  }
};

export type TaxonomySpeciesDocumentItemWithFlatRelatedData = {
  documentType_displayName?: string
} & TaxonomySpeciesDocumentItem;
